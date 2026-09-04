'use strict';

// Chamadas de grupo — reaproveita o transporte de relayDial.js, mas o
// offer e a distribuição de chave são diferentes:
//   1. O offer vai pra "<call-id>@call", com um único <audio> e um
//      <group_info> listando cada participante com seus dispositivos.
//   2. A chave da chamada não vem no offer — a gente gera e distribui
//      depois, um <enc_rekey> por dispositivo remoto, cifrado pelo mesmo
//      pipeline Signal das mensagens de texto.
//   3. Daí em diante é igual ao 1:1: um relay só, um DataChannel só, SSRC
//      e chaves SRTP derivados do mesmo jeito.

import { randomBytes } from 'crypto';
import { proto } from '../../../WAProto/index.js';
import { encodeWAMessage, encodeSignedDeviceIdentity, unpadRandomMax16 } from '../../Utils/index.js';
import { jidDecode, jidEncode, isLidUser } from '../../WABinary/index.js';
import { CAPABILITY_OFFER, formatParticipantId } from './voip.js';
import { findRelayNode, parseRelayData, getMediaRelayEndpoint, getPrimaryIpv4Address } from './relayParse.js';
import { attemptDataChannelConnect } from './relayDial.js';
import { makeCallLog } from './log.js';

const OFFER_ACK_TIMEOUT_MS = 12_000;
const GROUP_AUDIO_RATE = '16000';
export const MAX_REMOTE_PARTICIPANTS = 31;

// Igual Jid::to_non_ad() do bot Rust: tira o :dispositivo, fica só
// user@domínio. O <user jid=...> do group_info usa sempre essa forma.
function toNonAd(jid) {
    const decoded = jidDecode(jid);
    if (!decoded) return jid;
    return jidEncode(decoded.user, decoded.server);
}

function genHex(bytes) {
    return randomBytes(bytes).toString('hex');
}

// "00" + 15 bytes aleatórios em hex minúsculo.
function genCallId() {
    return '00' + genHex(15);
}

function genWrapperId() {
    return genHex(8).toUpperCase();
}

function waitForAck(sock, wrapperId) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), OFFER_ACK_TIMEOUT_MS);
        sock.ws.once(`TAG:${wrapperId}`, (ackNode) => {
            clearTimeout(timer);
            resolve(ackNode);
        });
    });
}

function findChild(node, tag) {
    const kids = Array.isArray(node?.content) ? node.content : [];
    return kids.find((c) => c.tag === tag) || null;
}

function nodeToLoggable(node) {
    if (node == null) return node;
    if (Buffer.isBuffer(node) || node instanceof Uint8Array) {
        const buf = Buffer.isBuffer(node) ? node : Buffer.from(node);
        return `<${buf.length} byte(s)>`;
    }
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(nodeToLoggable);
    if (typeof node === 'object' && node.tag) {
        return { tag: node.tag, attrs: node.attrs || {}, content: nodeToLoggable(node.content) };
    }
    return node;
}

// Um participante de grupo pode vir com o próprio jid já em @lid, ou em
// @s.whatsapp.net com o campo .lid resolvido à parte.
function participantLidOf(p) {
    if (isLidUser(p.id)) return p.id;
    if (p.lid && isLidUser(p.lid)) return p.lid;
    return null;
}

/**
 * Monta os <user><device><capability> do <group_info> pra cada LID (self +
 * participantes) e devolve os dispositivos remotos pra distribuir a chave
 * depois via <enc_rekey>.
 */
export async function buildGroupInfoUsers(sock, selfLid, participantLids) {
    const allLids = [selfLid, ...participantLids];
    // useCache=false: busca sempre fresco pra montar o group_info, evita
    // descompasso com um cache velho de dispositivos.
    const devices = await sock.getUSyncDevices(allLids, false, false);
    const selfUser = jidDecode(selfLid)?.user;

    const byUser = new Map();
    for (const d of devices) {
        const decoded = jidDecode(d.jid);
        const userKey = decoded ? decoded.user : d.user;
        if (!userKey) continue;
        // getUSyncDevices devolve @lid "pelado" (sem :N) pro dispositivo 0,
        // mas o group_info exige o :N explícito nesse domínio.
        const normalizedJid = formatParticipantId(d.jid);
        if (!byUser.has(userKey)) byUser.set(userKey, []);
        const list = byUser.get(userKey);
        if (!list.includes(normalizedJid)) list.push(normalizedJid);
    }

    const users = [];
    const remoteDeviceJids = [];
    for (const lid of allLids) {
        const userKey = jidDecode(lid)?.user;
        let deviceJids = (userKey && byUser.get(userKey)) || [];
        if (userKey === selfUser) {
            // getUSyncDevices exclui de propósito o meu dispositivo atual.
            const selfDeviceJid = formatParticipantId(lid);
            if (!deviceJids.includes(selfDeviceJid)) deviceJids = [selfDeviceJid, ...deviceJids];
        }
        if (deviceJids.length === 0) deviceJids = [formatParticipantId(lid)];

        const isSelf = userKey === selfUser;
        users.push({
            tag: 'user',
            attrs: { jid: toNonAd(lid) },
            content: deviceJids.map((djid) => ({
                tag: 'device',
                attrs: { jid: djid },
                // Só o meu dispositivo declara capability; a dos remotos vem
                // deles mesmos.
                content: isSelf ? [{ tag: 'capability', attrs: { ver: '1' }, content: CAPABILITY_OFFER }] : [],
            })),
        });

        if (!isSelf) remoteDeviceJids.push(...deviceJids);
    }

    return { users, remoteDeviceJids };
}

/**
 * Extrai (bareId conectado, deviceJid remoto) de uma lista de <user> vinda
 * de um <group_info> (ack do link_join ou group_update no meio da call).
 */
export function remoteConnectedFromGroupInfoUsers(users, selfBareId) {
    const connectedBareIds = new Set();
    const remoteDeviceJids = [];
    for (const user of Array.isArray(users) ? users : []) {
        if (user.tag !== 'user' || !user.attrs || user.attrs.state !== 'connected') continue;
        const userBareId = (user.attrs.jid || '').split('@')[0].split(':')[0];
        if (selfBareId && userBareId === selfBareId) continue;
        connectedBareIds.add(userBareId);
        const devices = Array.isArray(user.content) ? user.content : [];
        for (const device of devices) {
            if (device.tag === 'device' && device.attrs && device.attrs.jid) remoteDeviceJids.push(device.attrs.jid);
        }
    }
    return { connectedBareIds, remoteDeviceJids };
}

/** Manda um <enc_rekey> (cifrado por dispositivo) com a callKey gerada por nós. */
export async function fanOutGroupRekey(sock, callId, callCreator, callKey, remoteDeviceJids, transactionId, log) {
    if (!remoteDeviceJids.length) {
        log(`[CALL] Nenhum dispositivo remoto pra distribuir a chave de ${callId}.`);
        return;
    }
    if (typeof sock.assertSessions === 'function') {
        await sock.assertSessions(remoteDeviceJids);
    }

    const messageProto = proto.Message.fromObject({ call: { callKey } });
    const encoded = encodeWAMessage(messageProto);

    let sent = 0;
    for (const deviceJid of remoteDeviceJids) {
        try {
            const { type, ciphertext } = await sock.signalRepository.encryptMessage({ jid: deviceJid, data: encoded });
            const children = [
                { tag: 'encopt', attrs: { keygen: '2' }, content: [] },
                { tag: 'enc', attrs: { v: '2', type, count: '0' }, content: ciphertext },
            ];
            if (type === 'pkmsg') {
                children.push({
                    tag: 'device-identity',
                    attrs: {},
                    content: encodeSignedDeviceIdentity(sock.authState.creds.account, true),
                });
            }
            await sock.sendNode({
                tag: 'call',
                attrs: { to: deviceJid, id: genWrapperId() },
                content: [
                    {
                        tag: 'enc_rekey',
                        attrs: { 'call-id': callId, 'call-creator': callCreator, 'transaction-id': String(transactionId || 1) },
                        content: children,
                    },
                ],
            });
            sent++;
        } catch (e) {
            log(`[CALL] erro mandando enc_rekey pra ${deviceJid} em ${callId}:`, e.message);
        }
    }
    log(`[CALL] Chave da chamada de grupo ${callId} distribuída pra ${sent}/${remoteDeviceJids.length} dispositivo(s).`);
}

/**
 * Decifra um <enc_rekey> recebido de outro participante — usado quando
 * somos quem está entrando numa call que já existe (-calllink) e esperamos
 * alguém já autorizado mandar a chave real pra gente.
 */
export async function decryptGroupEpoch(sock, senderDeviceJid, encType, ciphertext) {
    const plaintext = await sock.signalRepository.decryptMessage({ jid: senderDeviceJid, type: encType, ciphertext });
    const unpadded = unpadRandomMax16(Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext));
    const message = proto.Message.decode(unpadded);
    const rawEpoch = message && message.call && message.call.callKey;
    if (!rawEpoch || rawEpoch.length !== 32) {
        throw new Error('mensagem decifrada não trouxe um callKey de 32 bytes');
    }
    return Buffer.isBuffer(rawEpoch) ? rawEpoch : Buffer.from(rawEpoch);
}

// Acha o phash que o servidor devolveu preso no nosso próprio <user> dentro
// do group_info de erro ("sua hash tá desatualizada, tenta de novo com essa").
function findSelfPhashFromError(ackNode, selfBareJid) {
    const groupInfo = findChild(ackNode, 'group_info');
    const kids = Array.isArray(groupInfo?.content) ? groupInfo.content : [];
    const failedSelf = kids.find((c) => c.tag === 'user' && c.attrs?.jid === selfBareJid && c.attrs?.phash);
    return failedSelf ? failedSelf.attrs.phash : null;
}

async function handleGroupOfferAck(sock, callId, callCreator, callKey, remoteDeviceJids, ackNode, retryCtx, log) {
    // Se o offer não foi aceito, a chamada nunca existe de verdade — tira do
    // registro pra não travar tentativas futuras.
    if (!ackNode) {
        log(`[CALL] Nenhum ack recebido pro offer de grupo ${callId} (timeout de ${OFFER_ACK_TIMEOUT_MS}ms).`);
        if (sock.calls) delete sock.calls[callId];
        return;
    }
    log(`[CALL] Ack do offer de grupo ${callId} recebido: tag=${ackNode.tag}, attrs=${JSON.stringify(ackNode.attrs || {})}`);
    log(`[CALL] Ack COMPLETO de ${callId}: ${JSON.stringify(nodeToLoggable(ackNode))}`);

    if (ackNode.attrs && ackNode.attrs.error) {
        // Erro 411 com phash no meu próprio usuário = "sua hash tá velha,
        // usa essa" — manda o offer de novo (mesmo call-id) com o phash
        // certo. Só tenta uma vez.
        if (ackNode.attrs.error === '411' && retryCtx && retryCtx.attemptsLeft > 0) {
            const selfBareJid = toNonAd(callCreator);
            const phash = findSelfPhashFromError(ackNode, selfBareJid);
            if (phash) {
                log(`[CALL] Offer de grupo ${callId} levou 411, tentando de novo com phash=${phash}...`);
                const selfUserNode = retryCtx.users.find((u) => u.attrs.jid === selfBareJid);
                if (selfUserNode) selfUserNode.attrs.phash = phash;
                const retryAck = await sendGroupOfferAndWaitAck(sock, {
                    callId, selfLid: callCreator, groupJid: retryCtx.groupJid, users: retryCtx.users,
                }, log);
                return handleGroupOfferAck(sock, callId, callCreator, callKey, remoteDeviceJids, retryAck, {
                    ...retryCtx, attemptsLeft: retryCtx.attemptsLeft - 1,
                }, log);
            }
        }
        // Um ack com error="207" (não documentado) pode vir MESMO trazendo
        // um <group_info> completo e um <relay> utilizável — não é uma
        // rejeição real. Só trata como rejeição quando não tem relay junto.
        if (!findRelayNode(ackNode)) {
            log(`[CALL] Servidor rejeitou o offer de grupo ${callId} com erro ${ackNode.attrs.error} — não vai ter relay nem conexão.`);
            if (sock.calls) delete sock.calls[callId];
            return;
        }
        log(`[CALL] Ack de grupo ${callId} veio com erro ${ackNode.attrs.error}, mas trouxe relay/group_info junto — seguindo normalmente.`);
    }

    const groupInfo = findChild(ackNode, 'group_info');
    const transactionId = groupInfo?.attrs?.['transaction-id'];
    log(`[CALL] group_info de ${callId}: ${groupInfo ? JSON.stringify(groupInfo.attrs) : 'ausente'}`);

    const relayNode = findRelayNode(ackNode);
    if (!relayNode) {
        log(`[CALL] Ack de grupo ${callId} não trouxe <relay> nenhum.`);
        return;
    }
    const relayData = parseRelayData(relayNode);
    const entry = sock.calls && sock.calls[callId];
    if (entry) entry.relay = relayData;

    log(
        `[CALL] Relay de grupo ${callId}: ${relayData.endpoints.length} endpoint(s), ` +
        `${relayData.relayTokens.length} token(s), ${relayData.authTokens.length} auth_token(s), ` +
        `key=${relayData.relayKey ? relayData.relayKey.length + 'B' : 'ausente'}, ` +
        `warp_mi_tag_len=${relayData.warpMiTagLen}`
    );

    const media = getMediaRelayEndpoint(relayData);
    if (!media) {
        log(`[CALL] Nenhum endpoint de mídia utilizável em ${callId} (sem IPv4 ou sem token correspondente).`);
        return;
    }
    const addr = getPrimaryIpv4Address(media);
    if (!addr) {
        log(`[CALL] Endpoint ${media.relayName} de ${callId} não tem IPv4.`);
        return;
    }
    log(`[CALL] Endpoint de mídia escolhido pra grupo ${callId}: ${media.relayName} (${addr.ip}:${addr.port})`);

    attemptDataChannelConnect(callId, formatParticipantId(callCreator), relayData, media, addr, callKey, { calls: sock.calls, log });

    // Manda sempre, mesmo se o ack não trouxer rekey="1" — sem isso ninguém
    // tem a chave da chamada que a gente mesmo gerou.
    fanOutGroupRekey(sock, callId, callCreator, callKey, remoteDeviceJids, transactionId, log)
        .catch((e) => log(`[CALL] erro distribuindo a chave da chamada de grupo ${callId}:`, e.message));
}

/** Monta e manda o <call><offer>...</offer></call> de grupo, devolve a promise do ack. */
async function sendGroupOfferAndWaitAck(sock, { callId, selfLid, groupJid, users }, log) {
    const wrapperId = genWrapperId();
    const ackPromise = waitForAck(sock, wrapperId);

    const offerAttrs = { 'call-id': callId, 'call-creator': selfLid };
    if (groupJid.endsWith('@g.us')) offerAttrs['group-jid'] = groupJid;

    const offerNode = {
        tag: 'call',
        attrs: { to: `${callId}@call`, id: wrapperId },
        content: [
            {
                tag: 'offer',
                attrs: offerAttrs,
                content: [
                    { tag: 'audio', attrs: { enc: 'opus', rate: GROUP_AUDIO_RATE }, content: [] },
                    { tag: 'net', attrs: { medium: '3' }, content: [] },
                    { tag: 'group_info', attrs: {}, content: users },
                ],
            },
        ],
    };
    log(`[CALL] Offer de grupo ${callId} sendo mandado: ${JSON.stringify(nodeToLoggable(offerNode))}`);

    await sock.sendNode(offerNode);
    return ackPromise;
}

/**
 * Liga pra um grupo: pega os participantes (groupMetadata), manda o offer
 * de grupo, e na resposta abre o transporte de mídia e distribui a chave
 * por dispositivo.
 */
export async function startOutgoingGroupCall(sock, groupJid, originChatId) {
    const log = makeCallLog(sock);

    // O bot precisa manter a presença "disponível" durante a call, senão o
    // servidor pode derrubar de calls de grupo com reason="user_invisible".
    sock.sendPresenceUpdate('available').catch(() => {});

    const meta = await sock.groupMetadata(groupJid);
    const selfLid = sock.user.lid || sock.user.id;
    const selfUser = jidDecode(selfLid)?.user;

    const participantLids = [];
    for (const p of meta.participants || []) {
        const lid = participantLidOf(p);
        if (!lid) continue;
        if (jidDecode(lid)?.user === selfUser) continue;
        participantLids.push(lid);
    }

    if (participantLids.length < 2) {
        throw new Error('Preciso de pelo menos 2 outras pessoas com LID já resolvido nesse grupo pra conseguir ligar (o WhatsApp ainda não passou o LID de todo mundo aqui).');
    }
    if (participantLids.length > MAX_REMOTE_PARTICIPANTS) {
        participantLids.length = MAX_REMOTE_PARTICIPANTS;
    }

    const { users, remoteDeviceJids } = await buildGroupInfoUsers(sock, selfLid, participantLids);

    const callId = genCallId();
    const callKey = randomBytes(32);

    const ackPromise = sendGroupOfferAndWaitAck(sock, { callId, selfLid, groupJid, users }, log);

    sock.calls[callId] = {
        callId,
        peer: groupJid,
        callCreator: selfLid,
        originChatId: originChatId || groupJid,
        status: 'offer',
        isGroup: true,
        startedAt: Date.now(),
        callKey,
        selfParticipantId: formatParticipantId(selfLid),
        // Somos o call-creator: a callKey acima já é a de verdade, não uma
        // placeholder esperando epoch (diferente do fluxo de -calllink).
        epochReady: true,
    };

    ackPromise
        .then((ackNode) => handleGroupOfferAck(sock, callId, selfLid, callKey, remoteDeviceJids, ackNode, { groupJid, users, attemptsLeft: 1 }, log))
        .catch((e) => log(`[CALL] erro processando ack/relay de grupo ${callId}:`, e.message));

    return { callId, callCreator: selfLid, participantCount: participantLids.length };
}
