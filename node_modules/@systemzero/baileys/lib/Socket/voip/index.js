'use strict';

// Chamadas de voz nativas do socket: estado em sock.calls, métodos diretos
// (sock.startCall/sock.startGroupCall/sock.joinCallLink/sock.endCall/
// sock.playCallAudio), reconexão automática sempre ligada.

import { startOutgoingCall, terminateCall } from './voip.js';
import { startOutgoingGroupCall } from './voipGroup.js';
import { joinCallLink } from './voipCallLink.js';
import { setupCallOrchestration } from './orchestrate.js';
import { makeCallLog } from './log.js';

/** Liga o sistema de chamadas num socket. Devolve uma função pra desligar tudo. */
export function setupVoip(sock) {
    sock.calls = sock.calls || {};
    const log = makeCallLog(sock);
    const stopOrchestration = setupCallOrchestration(sock);

    sock.startCall = (targetJid, originChatId) => startOutgoingCall(sock, targetJid, originChatId);
    sock.startGroupCall = (groupJid, originChatId) => startOutgoingGroupCall(sock, groupJid, originChatId);
    sock.joinCallLink = (tokenOrUrl, originChatId) => joinCallLink(sock, tokenOrUrl, originChatId);

    sock.endCall = async (callId) => {
        const entry = sock.calls[callId];
        if (!entry) return false;
        const to = entry.isGroup ? `${callId}@call` : entry.peer;
        await terminateCall(sock, callId, entry.callCreator, to).catch((e) => log(`[CALL] erro terminando ${callId}:`, e.message));
        if (entry.pc) { try { entry.pc.close(); } catch (_) {} }
        delete sock.calls[callId];
        return true;
    };

    sock.playCallAudio = (callId, pcmBuffer) => {
        const entry = sock.calls[callId];
        if (!entry || !entry.audio) return false;
        entry.audio.playPcm(pcmBuffer);
        return true;
    };

    sock.stopCallAudio = (callId) => {
        const entry = sock.calls[callId];
        if (!entry || !entry.audio) return false;
        entry.audio.stopTrack();
        return true;
    };

    return () => {
        stopOrchestration();
        for (const callId of Object.keys(sock.calls)) {
            const entry = sock.calls[callId];
            if (entry && entry.pc) { try { entry.pc.close(); } catch (_) {} }
        }
    };
}
