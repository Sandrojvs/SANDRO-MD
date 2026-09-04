'use strict';

// Chamadas de voz 1:1 — camada de sinalização.
//
// A chave E2E da chamada é um proto.Message{call:{callKey}} cifrado pelo
// mesmo pipeline Signal usado pra mensagens de texto. O <offer> exige uma
// ordem de filhos fixa e validada pelo servidor (erro 439 se errar):
// audio → audio → net → capability → enc → encopt. O call-creator tem que
// ser o LID da própria conta (sock.user.lid), não o JID de telefone.

import { randomBytes } from 'crypto';
import { proto } from '../../../WAProto/index.js';
import { encodeWAMessage } from '../../Utils/index.js';
import { findRelayNode, parseRelayData, getMediaRelayEndpoint, getPrimaryIpv4Address } from './relayParse.js';
import { attemptDataChannelConnect } from './relayDial.js';
import { makeCallLog } from './log.js';

// Byte 5 = 0xbb tem o bit do codec MLOW (proprietário) ligado; usamos a
// variante sem esse bit (0xbb & 0x7f = 0x3b), só Opus padrão.
export const CAPABILITY_OFFER = Buffer.from([0x01, 0x05, 0xf7, 0x09, 0xe0, 0x3b, 0x13]);

const OFFER_ACK_TIMEOUT_MS = 12_000;

function genId(bytes) {
    return randomBytes(bytes).toString('hex').toUpperCase();
}

// O Baileys emite `TAG:<id>` no seu `ws` interno pra qualquer nó recebido
// cujo atributo `id` bata com o que a gente mandou. O offer manda
// `<call id=wrapperId>`, e a resposta com o <relay> vem com esse mesmo id.
function waitForOfferAck(sock, wrapperId) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), OFFER_ACK_TIMEOUT_MS);
        sock.ws.once(`TAG:${wrapperId}`, (ackNode) => {
            clearTimeout(timer);
            resolve(ackNode);
        });
    });
}

// Igual format_participant_id do bot Rust: tira o /recurso, mantém um
// :N@lid já existente, um @lid puro vira :0@lid, o resto passa direto.
export function formatParticipantId(jid) {
    const bare = (jid || '').split('/')[0].trim();
    const at = bare.lastIndexOf('@');
    if (at <= 0) return bare;
    const user = bare.slice(0, at);
    const domain = bare.slice(at + 1);
    if (domain === 'lid' && !user.includes(':')) return `${user}:0@${domain}`;
    return bare;
}

function handleOfferAck(sock, callId, callCreator, callKey, ackNode, log) {
    if (!ackNode) {
        log(`[CALL] Nenhum ack recebido pro offer ${callId} (timeout de ${OFFER_ACK_TIMEOUT_MS}ms).`);
        return;
    }
    log(`[CALL] Ack do offer ${callId} recebido: tag=${ackNode.tag}, attrs=${JSON.stringify(ackNode.attrs || {})}`);

    const relayNode = findRelayNode(ackNode);
    if (!relayNode) {
        log(`[CALL] Ack de ${callId} não trouxe <relay> nenhum.`);
        return;
    }

    const relayData = parseRelayData(relayNode);
    const entry = sock.calls && sock.calls[callId];
    if (entry) entry.relay = relayData;

    log(
        `[CALL] Relay de ${callId}: ${relayData.endpoints.length} endpoint(s), ` +
        `${relayData.relayTokens.length} token(s), ${relayData.authTokens.length} auth_token(s), ` +
        `hbh_key=${relayData.hbhKey ? relayData.hbhKey.length + 'B' : 'ausente'}, ` +
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
    log(`[CALL] Endpoint de mídia escolhido pra ${callId}: ${media.relayName} (${addr.ip}:${addr.port})`);

    attemptDataChannelConnect(callId, formatParticipantId(callCreator), relayData, media, addr, callKey, { calls: sock.calls, log });
}

/**
 * Manda um <offer> de chamada 1:1 pra `targetJid`, registra a chamada em
 * `sock.calls` e espera em paralelo o <ack type="offer"> com o <relay>.
 */
export async function startOutgoingCall(sock, targetJid, originChatId) {
    const log = makeCallLog(sock);

    // Manda presença "disponível" antes de ligar — sem isso o servidor pode
    // derrubar calls de grupo com reason="user_invisible" depois de um tempo.
    sock.sendPresenceUpdate('available').catch(() => {});

    const callId = genId(16);
    const wrapperId = genId(8);
    const callCreator = sock.user.lid || sock.user.id;

    if (typeof sock.assertSessions === 'function') {
        await sock.assertSessions([targetJid]);
    }

    const callKey = randomBytes(32);
    const messageProto = proto.Message.fromObject({ call: { callKey } });
    const encoded = encodeWAMessage(messageProto);

    const { type, ciphertext } = await sock.signalRepository.encryptMessage({
        jid: targetJid,
        data: encoded,
    });

    const ackPromise = waitForOfferAck(sock, wrapperId);

    await sock.sendNode({
        tag: 'call',
        attrs: { to: targetJid, id: wrapperId },
        content: [
            {
                tag: 'offer',
                attrs: { 'call-id': callId, 'call-creator': callCreator },
                content: [
                    { tag: 'audio', attrs: { enc: 'opus', rate: '8000' }, content: [] },
                    { tag: 'audio', attrs: { enc: 'opus', rate: '16000' }, content: [] },
                    { tag: 'net', attrs: { medium: '3' }, content: [] },
                    { tag: 'capability', attrs: { ver: '1' }, content: CAPABILITY_OFFER },
                    { tag: 'enc', attrs: { v: '2', type, count: '0' }, content: ciphertext },
                    { tag: 'encopt', attrs: { keygen: '2' }, content: [] },
                ]
            }
        ]
    });

    sock.calls[callId] = {
        callId,
        wrapperId,
        peer: targetJid,
        callCreator,
        originChatId: originChatId || targetJid,
        status: 'offer',
        startedAt: Date.now(),
        // Guardados pro reconector automático conseguir chamar
        // attemptDataChannelConnect de novo com material de relay fresco.
        callKey,
        selfParticipantId: formatParticipantId(callCreator),
    };

    ackPromise
        .then((ackNode) => handleOfferAck(sock, callId, callCreator, callKey, ackNode, log))
        .catch((e) => log(`[CALL] erro processando ack/relay de ${callId}:`, e.message));

    return { callId, wrapperId, callCreator, encType: type };
}

/**
 * Manda um <terminate> pra encerrar uma chamada nossa (1:1 ou grupo). `to`
 * é o mesmo alvo que recebeu o offer original.
 */
export async function terminateCall(sock, callId, callCreator, to) {
    await sock.sendNode({
        tag: 'call',
        attrs: { to, id: genId(8) },
        content: [
            { tag: 'terminate', attrs: { 'call-id': callId, 'call-creator': callCreator }, content: [] },
        ],
    });
}
