'use strict';

// Orquestração de uma call em andamento: heartbeat periódico, presença
// "disponível" mantida, reconexão (por mudança de roster ou proativa antes
// do platform limit de ~30s bater), e o parsing dos <call> brutos que o
// Baileys não reconhece nativamente (relaylatency/terminate/enc_rekey/
// group_update).

import { randomBytes } from 'crypto';
import * as relayParse from './relayParse.js';
import { attemptDataChannelConnect } from './relayDial.js';
import { decryptGroupEpoch, remoteConnectedFromGroupInfoUsers, fanOutGroupRekey } from './voipGroup.js';
import { makeCallLog } from './log.js';

const HEARTBEAT_MS = 10_000;
const PRESENCE_KEEPER_MS = 15_000;
// O servidor tolera um dispositivo companion no papel de áudio numa call de
// grupo só por um tempo limitado (~29-31s observados) antes de derrubar com
// terminate reason="user_invisible" — reconecta um pouco antes disso.
const PROACTIVE_RECONNECT_MS = 24_000;
const PROACTIVE_RECONNECT_CHECK_MS = 2_000;
const LOG_BURST_MS = 60_000;

function nodeToLoggable(n) {
    if (n == null) return n;
    if (Buffer.isBuffer(n) || n instanceof Uint8Array) return `<${n.length} byte(s)>`;
    if (typeof n === 'string') return n;
    if (Array.isArray(n)) return n.map(nodeToLoggable);
    if (typeof n === 'object' && n.tag) return { tag: n.tag, attrs: n.attrs || {}, content: nodeToLoggable(n.content) };
    return n;
}

/** Fecha e reabre o transporte de uma call com o relay/callKey mais recentes guardados na entry. */
function forceReconnectCall(sock, callId, reasonLabel, log) {
    try {
        const entry = sock.calls && sock.calls[callId];
        if (!entry || !entry.pc || entry.reconnecting) return false;
        const relayForReconnect = entry.relay;
        if (!relayForReconnect || !entry.callKey || !entry.selfParticipantId) {
            log(`[CALL] ${callId} (${reasonLabel}): sem relay/callKey/selfParticipantId guardado — não dá pra reconectar.`);
            return false;
        }
        const media = relayParse.getMediaRelayEndpoint(relayForReconnect);
        const addr = media && relayParse.getPrimaryIpv4Address(media);
        if (!media || !addr) {
            log(`[CALL] ${callId} (${reasonLabel}): relay guardado sem endpoint de mídia utilizável — não dá pra reconectar.`);
            return false;
        }
        log(`[CALL] ${callId} reconectando (${reasonLabel}).`);
        // Guarda a faixa/posição tocando agora — a sessão de áudio nova
        // retoma dela, sem precisar mandar tocar de novo.
        if (entry.audio && typeof entry.audio.getTrackState === 'function') {
            entry.pendingAudioResume = entry.audio.getTrackState();
        }
        // Idem pro estado do RTP (seq/timestamp/roc): o SSRC continua o
        // mesmo de propósito, então sem isso o outro lado confunde a seq
        // baixa com um rollover de verdade. Guarda também qual callKey esse
        // estado pertence a (um enc_rekey no meio invalida o reaproveito).
        if (entry.audio && typeof entry.audio.getRtpState === 'function') {
            entry.pendingRtpState = entry.audio.getRtpState();
            entry.pendingRtpKey = entry.callKey;
        }
        entry.reconnecting = true;
        try { entry.pc.close(); } catch (_) {}
        entry.reconnecting = false;
        attemptDataChannelConnect(callId, entry.selfParticipantId, relayForReconnect, media, addr, entry.callKey, { calls: sock.calls, log });
        return true;
    } catch (e) {
        log(`[CALL] erro reconectando ${callId} (${reasonLabel}):`, e.message);
        return false;
    }
}

function respondToRelayLatency(sock, action, log) {
    try {
        const callId = action.attrs && action.attrs['call-id'];
        const callCreator = action.attrs && action.attrs['call-creator'];
        if (!callId || !callCreator) return;
        const entry = sock.calls && sock.calls[callId];
        if (!entry) return;
        const teNode = (Array.isArray(action.content) ? action.content : []).find((c) => c.tag === 'te');
        if (!teNode) { log(`[CALL] relaylatency de ${callId} sem <te>, não dá pra responder.`); return; }
        const relayName = teNode.attrs && teNode.attrs.relay_name;
        const addressBytes = Buffer.isBuffer(teNode.content) ? teNode.content : (teNode.content instanceof Uint8Array ? Buffer.from(teNode.content) : null);
        if (!relayName || !addressBytes) { log(`[CALL] relaylatency de ${callId} com <te> incompleto, não dá pra responder.`); return; }

        let latencyMs = 0;
        try { latencyMs = entry.pc ? Math.max(0, Math.round(entry.pc.rtt())) : 0; } catch (_) {}
        // Soma um offset fixo (0x02000000) ao RTT em ms, manda como string decimal.
        const encodedLatency = String((0x02000000 + latencyMs) >>> 0);

        sock.sendNode({
            tag: 'call',
            attrs: { to: `${callId}@call` },
            content: [
                {
                    tag: 'relaylatency',
                    attrs: { 'call-id': callId, 'call-creator': callCreator },
                    content: [
                        { tag: 'te', attrs: { latency: encodedLatency, relay_name: relayName }, content: addressBytes },
                    ],
                },
            ],
        }).then(() => {
            log(`[CALL] respondi relaylatency de ${callId}: relay=${relayName} latency=${latencyMs}ms`);
        }).catch((e) => log(`[CALL] erro respondendo relaylatency de ${callId}:`, e.message));
    } catch (e) {
        log('[CALL] erro montando resposta de relaylatency:', e.message);
    }
}

function handleTerminate(sock, action, log) {
    try {
        const callId = action.attrs && action.attrs['call-id'];
        const entry = callId && sock.calls && sock.calls[callId];
        if (!entry) return;
        const reason = action.attrs && action.attrs.reason;
        // user_invisible é o motivo que o reconnect proativo existe pra
        // evitar — apagar a entry aqui perde pids/relay/callKey pra sempre
        // (o Allocate cai pra modo 1:1 pro resto da call). Reconecta em vez
        // de derrubar.
        if (reason === 'user_invisible') {
            log(`[CALL] terminate bruto de ${callId} (reason=user_invisible) — reconectando em vez de derrubar (preserva pids/relay).`);
            forceReconnectCall(sock, callId, 'terminate user_invisible', log);
            return;
        }
        log(`[CALL] terminate bruto de ${callId} (reason=${reason || '(nenhum)'}) — encerrando conexão local.`);
        if (entry.pc) { try { entry.pc.close(); } catch (_) {} }
        delete sock.calls[callId];
    } catch (e) {
        log('[CALL] erro processando terminate bruto:', e.message);
    }
}

function handleEncRekey(sock, node, action, log) {
    try {
        const callId = action.attrs && action.attrs['call-id'];
        const entry = callId && sock.calls && sock.calls[callId];
        if (!entry) return;
        const callCreator = action.attrs['call-creator'];
        const transactionId = action.attrs['transaction-id'];
        const sender = (node.attrs && (node.attrs.participant || node.attrs.from)) || '';
        const senderBareId = sender.split('@')[0].split(':')[0];
        const creatorBareId = (callCreator || '').split('@')[0].split(':')[0];
        const isCreator = !!senderBareId && !!creatorBareId && senderBareId === creatorBareId;
        const isKnownParticipant = entry.connectedBareIds instanceof Set && entry.connectedBareIds.has(senderBareId);
        if (!isCreator && !isKnownParticipant) {
            log(`[CALL] enc_rekey de ${callId} ignorado — remetente ${sender} não é o call-creator nem um participante conectado conhecido.`);
            return;
        }
        const kids = Array.isArray(action.content) ? action.content : [];
        const encopt = kids.find((c) => c.tag === 'encopt');
        const enc = kids.find((c) => c.tag === 'enc');
        const keygen = encopt && encopt.attrs && encopt.attrs.keygen;
        const encType = enc && enc.attrs && enc.attrs.type;
        const ciphertext = enc && enc.content;
        const txNum = parseInt(transactionId, 10);
        if (keygen !== '2' || (encType !== 'msg' && encType !== 'pkmsg') || !ciphertext) {
            log(`[CALL] enc_rekey de ${callId} com formato inesperado (keygen=${keygen}, type=${encType}).`);
            return;
        }
        if (entry.epochTransactionId !== undefined && Number.isFinite(txNum) && txNum <= entry.epochTransactionId) {
            log(`[CALL] enc_rekey de ${callId} ignorado — transaction-id ${txNum} não é mais novo que o atual (${entry.epochTransactionId}).`);
            return;
        }
        const bytes = Buffer.isBuffer(ciphertext) ? ciphertext : Buffer.from(ciphertext);
        decryptGroupEpoch(sock, sender, encType, bytes)
            .then((rawEpoch) => {
                entry.callKey = rawEpoch;
                entry.epochReady = true;
                if (Number.isFinite(txNum)) entry.epochTransactionId = txNum;
                log(`[CALL] epoch de verdade RECEBIDO pra ${callId} (de ${sender}, transaction-id=${transactionId}).`);
                if (entry.pendingConnect) {
                    const pending = entry.pendingConnect;
                    entry.pendingConnect = null;
                    entry.relay = pending.relayData;
                    if (pending.relayData && pending.relayData.transactionId !== undefined) {
                        entry.relayTransactionId = pending.relayData.transactionId;
                    }
                    log(`[CALL] conectando ${callId} agora que a chave real da chamada chegou.`);
                    attemptDataChannelConnect(callId, entry.selfParticipantId, pending.relayData, pending.media, pending.addr, entry.callKey, { calls: sock.calls, log });
                } else if (entry.audio && typeof entry.audio.updateCallKey === 'function') {
                    // Call já conectada e tocando: troca a chave na hora, sem reconectar rede.
                    entry.audio.updateCallKey(entry.callKey);
                }
            })
            .catch((e) => log(`[CALL] erro decifrando enc_rekey de ${callId}:`, e.message));
    } catch (e) {
        log('[CALL] erro processando enc_rekey bruto:', e.message);
    }
}

function handleGroupUpdate(sock, action, log) {
    try {
        const callId = action.attrs && action.attrs['call-id'];
        if (!callId) return;
        const entry = sock.calls && sock.calls[callId];
        if (!entry) return;

        // Os <user> ficam dentro de um <group_info> aninhado
        // (group_update > group_info > user > device).
        const groupInfo = (Array.isArray(action.content) ? action.content : []).find((c) => c.tag === 'group_info');
        const pids = new Set();
        const users = groupInfo && Array.isArray(groupInfo.content) ? groupInfo.content : [];
        // O pid que vai pro Allocate de grupo é só dos participantes
        // remotos conectados — o próprio pid é excluído, e só entra quem
        // está com state="connected".
        const selfLidRaw = (sock.user && (sock.user.lid || sock.user.id)) || '';
        const selfBareId = selfLidRaw.split('@')[0].split(':')[0];
        let selfMarcadoInvited = false;
        for (const user of users) {
            if (user.tag !== 'user' || !user.attrs) continue;
            const userBareId = ((user.attrs.jid) || '').split('@')[0].split(':')[0];
            if (selfBareId && userBareId === selfBareId) {
                if (user.attrs.state && user.attrs.state !== 'connected') selfMarcadoInvited = true;
                continue;
            }
            if (user.attrs.state !== 'connected') continue;
            const devices = Array.isArray(user.content) ? user.content : [];
            for (const device of devices) {
                if (device.tag !== 'device' || !device.attrs || device.attrs.pid === undefined) continue;
                const pid = parseInt(device.attrs.pid, 10);
                if (Number.isFinite(pid)) pids.add(pid);
            }
        }
        const previousPids = entry.pids instanceof Set ? entry.pids : new Set();
        const pidsCresceram = pids.size > previousPids.size || Array.from(pids).some((p) => !previousPids.has(p));
        const pidsMudaram = pids.size !== previousPids.size || Array.from(pids).some((p) => !previousPids.has(p));
        entry.pids = pids;
        if (pidsCresceram) {
            entry.logBurstUntil = Date.now() + LOG_BURST_MS;
            log(`[CALL] rajada de log detalhado ligada por ${LOG_BURST_MS / 1000}s pra ${callId} (participante novo: pids [${Array.from(previousPids).join(',')}] -> [${Array.from(pids).join(',')}])`);
        }
        log(`[CALL] group_update de ${callId}: pids conectados agora = [${Array.from(pids).join(', ')}]`);

        // Guarda quem tá conectado agora pra autorizar um enc_rekey futuro.
        // Se ESSE group_update pediu rekey="1" (ninguém mais tem a chave
        // pra distribuir), gera e distribui uma.
        const { connectedBareIds, remoteDeviceJids } = remoteConnectedFromGroupInfoUsers(users, selfBareId);
        entry.connectedBareIds = connectedBareIds;
        if (groupInfo && groupInfo.attrs && groupInfo.attrs.rekey === '1' && !entry.epochReady) {
            try {
                const freshEpoch = randomBytes(32);
                entry.callKey = freshEpoch;
                entry.epochReady = true;
                const transactionId = groupInfo.attrs['transaction-id'];
                log(`[CALL] group_update de ${callId} pediu rekey (rekey="1") — gerando epoch de verdade e distribuindo pra ${remoteDeviceJids.length} dispositivo(s).`);
                fanOutGroupRekey(sock, callId, entry.callCreator, freshEpoch, remoteDeviceJids, transactionId, log)
                    .catch((e) => log(`[CALL] erro distribuindo epoch de ${callId}:`, e.message));
                if (entry.pendingConnect) {
                    const pending = entry.pendingConnect;
                    entry.pendingConnect = null;
                    entry.relay = pending.relayData;
                    if (pending.relayData && pending.relayData.transactionId !== undefined) {
                        entry.relayTransactionId = pending.relayData.transactionId;
                    }
                    log(`[CALL] conectando ${callId} agora que gerou a própria epoch de verdade.`);
                    attemptDataChannelConnect(callId, entry.selfParticipantId, pending.relayData, pending.media, pending.addr, entry.callKey, { calls: sock.calls, log });
                }
            } catch (e) {
                log(`[CALL] erro processando rekey solicitado de ${callId}:`, e.message);
            }
        }

        // Toda vez que o conjunto de pids conectados muda (cresce ou
        // encolhe) enquanto já existe uma conexão viva, fecha ela e abre
        // uma nova do zero com o roster atual — remendar a conexão já
        // aberta nesse caso derruba a call uns segundos depois.
        const pidsMudaramConectado = pidsMudaram && entry.pc && !entry.reconnecting;
        if (pidsMudaramConectado) {
            entry.isGroup = true;
            try {
                const inlineRelayNode = (Array.isArray(action.content) ? action.content : []).find((c) => c.tag === 'relay');
                if (inlineRelayNode) {
                    const freshRelay = relayParse.parseRelayData(inlineRelayNode);
                    entry.relay = freshRelay;
                    if (freshRelay.transactionId !== null && freshRelay.transactionId !== undefined) {
                        entry.relayTransactionId = freshRelay.transactionId;
                    }
                }
            } catch (e) {
                log(`[CALL] erro processando relay novo de ${callId} na mudança de roster:`, e.message);
            }
            log(`[CALL] ${callId} teve o roster mudado (pids=[${Array.from(previousPids).join(',')}] -> [${Array.from(pids).join(',')}]).`);
            forceReconnectCall(sock, callId, 'roster mudou', log);
        } else if (selfMarcadoInvited && entry.pc && !entry.reconnecting) {
            // O próprio bot virou "invited" mesmo sem os pids remotos
            // mudarem — reconecta na hora, sem esperar o timer proativo.
            log(`[CALL] ${callId}: o próprio bot foi marcado "invited" no roster — reconectando na hora.`);
            forceReconnectCall(sock, callId, 'bot marcado invited', log);
        }

        // No exato instante em que alguém é rebaixado pra state="invited",
        // o servidor manda um <relay> novo junto no mesmo group_update —
        // um convite pra reconectar com credenciais frescas em vez de
        // deixar a call morrer.
        const relayNode = (Array.isArray(action.content) ? action.content : []).find((c) => c.tag === 'relay');
        if (relayNode) {
            try {
                const freshRelay = relayParse.parseRelayData(relayNode);
                if (freshRelay.transactionId !== null) {
                    const previousTransactionId = entry.relayTransactionId;
                    // Duas situações: (1) reconexão de verdade — já tínhamos
                    // material antes e mudou; (2) primeira conexão de uma
                    // call por link (-calllink) — o ack do link_join não
                    // traz relay, só chega aqui depois, e entry.pc ainda
                    // nem existe.
                    const isReconnect = previousTransactionId !== undefined && freshRelay.transactionId !== previousTransactionId;
                    const isInitialLinkConnect = !entry.pc;
                    if ((isReconnect || isInitialLinkConnect) && entry.callKey && entry.selfParticipantId) {
                        const media = relayParse.getMediaRelayEndpoint(freshRelay);
                        const addr = media && relayParse.getPrimaryIpv4Address(media);
                        if (media && addr) {
                            if (isInitialLinkConnect && entry.epochReady === false) {
                                // -calllink sem rekey="1" pra gente: a chave
                                // real ainda não chegou (vem num enc_rekey
                                // separado). Guarda o relay e espera.
                                entry.pendingConnect = { relayData: freshRelay, media, addr };
                                log(`[CALL] relay chegou pra ${callId} mas ainda esperando a chave real da chamada (epoch) antes de conectar.`);
                            } else {
                                log(`[CALL] material de relay ${isReconnect ? 'NOVO' : 'inicial (link)'} pra ${callId} (transaction-id ${previousTransactionId} -> ${freshRelay.transactionId}) — ${isReconnect ? 'reconectando com credenciais frescas' : 'conectando a mídia pela primeira vez'}.`);
                                entry.relay = freshRelay;
                                entry.reconnecting = true;
                                if (entry.pc) { try { entry.pc.close(); } catch (_) {} }
                                entry.reconnecting = false;
                                attemptDataChannelConnect(callId, entry.selfParticipantId, freshRelay, media, addr, entry.callKey, { calls: sock.calls, log });
                            }
                        } else {
                            log(`[CALL] material de relay chegou pra ${callId} mas sem endpoint de mídia utilizável — não dá pra conectar.`);
                        }
                    }
                    entry.relayTransactionId = freshRelay.transactionId;
                }
            } catch (e) {
                log(`[CALL] erro processando material de relay novo de ${callId}:`, e.message);
            }
        }
    } catch (e) {
        log('[CALL] erro processando group_update:', e.message);
    }
}

/**
 * Liga toda a orquestração de call num socket: heartbeat, presença,
 * reconexão automática (roster/proativa), e o parsing de <call> bruto.
 * `sock.calls` já precisa existir. Devolve uma função pra desligar tudo.
 */
export function setupCallOrchestration(sock) {
    const log = makeCallLog(sock);

    const heartbeatTimer = setInterval(() => {
        for (const callId of Object.keys(sock.calls)) {
            const entry = sock.calls[callId];
            if (!entry || !entry.callCreator) continue;
            const wrapperId = randomBytes(8).toString('hex').toUpperCase();
            sock.sendNode({
                tag: 'call',
                attrs: { to: `${callId}@call`, id: wrapperId },
                content: [
                    { tag: 'heartbeat', attrs: { 'call-id': callId, 'call-creator': entry.callCreator } },
                ],
            }).then(() => {
                log(`[CALL] heartbeat mandado pra ${callId}.`);
            }).catch((e) => log(`[CALL] erro mandando heartbeat de ${callId}:`, e.message));
        }
    }, HEARTBEAT_MS);

    // Mantém a presença "disponível" atualizada enquanto tiver call ativa —
    // o servidor parece exigir presença recente pra manter a gente na call.
    const presenceTimer = setInterval(() => {
        if (Object.keys(sock.calls).length === 0) return;
        sock.sendPresenceUpdate('available').catch(() => {});
    }, PRESENCE_KEEPER_MS);

    const proactiveTimer = setInterval(() => {
        for (const callId of Object.keys(sock.calls)) {
            const entry = sock.calls[callId];
            if (!entry || !entry.pc || entry.reconnecting || !entry.groupModeStartedAt) continue;
            if (Date.now() - entry.groupModeStartedAt < PROACTIVE_RECONNECT_MS) continue;
            // Reseta otimisticamente antes de tentar, pra não disparar de
            // novo no próximo tick antes do Allocate confirmar.
            entry.groupModeStartedAt = Date.now();
            forceReconnectCall(sock, callId, 'reconnect proativo antes do user_invisible', log);
        }
    }, PROACTIVE_RECONNECT_CHECK_MS);

    const onCbCall = (node) => {
        try {
            const action = Array.isArray(node.content) ? node.content[0] : null;
            log(`[CALL] <call> bruto recebido (action=${action ? action.tag : '(nenhuma)'}): ${JSON.stringify(nodeToLoggable(node))}`);
            if (action && action.tag === 'relaylatency') respondToRelayLatency(sock, action, log);
            if (action && action.tag === 'terminate') handleTerminate(sock, action, log);
            if (action && action.tag === 'enc_rekey') handleEncRekey(sock, node, action, log);
            if (action && action.tag === 'group_update') handleGroupUpdate(sock, action, log);
        } catch (e) {
            log('[CALL] erro processando <call> bruto:', e.message);
        }
    };
    sock.ws.on('CB:call', onCbCall);

    // Limpeza automática de estado quando o Baileys reporta o desfecho de
    // uma call que a gente registrou em sock.calls (accept/reject/timeout/
    // terminate) — fecha o transporte e tira do registro. Não manda
    // mensagem nenhuma pro chat: isso é política de quem usa a lib.
    const onCallStatus = async (calls) => {
        for (const call of calls) {
            const entry = sock.calls[call.id];
            if (!entry) continue;
            entry.status = call.status;
            if (['reject', 'timeout', 'terminate'].includes(call.status)) {
                if (entry.pc) { try { entry.pc.close(); } catch (_) {} }
                delete sock.calls[call.id];
            }
        }
    };
    sock.ev.on('call', onCallStatus);

    return () => {
        clearInterval(heartbeatTimer);
        clearInterval(presenceTimer);
        clearInterval(proactiveTimer);
        sock.ws.off('CB:call', onCbCall);
        sock.ev.off('call', onCallStatus);
    };
}

export { forceReconnectCall };
