'use strict';

// RTCP (Sender Report + SDES) criptografado com SRTCP. Necessário pro relay
// continuar considerando a chamada ativa numa call de grupo.

import crypto from 'crypto';
import { hkdfSha256, aesCmKdf, buildE2eRtpIv } from './e2eSrtp.js';
import * as hbhSrtp from './hbhSrtp.js';

const NTP_UNIX_OFFSET_SECS = 2208988800;
const RTCP_PT_SR = 200;
const RTCP_PT_SDES = 202;
const SRTCP_AUTH_TAG_LEN = 10;
const RTCP_HEADER_LEN = 8;
const WHATSAPP_RTCP_CNAME_LEN = 18;
export const RTCP_MS = 1500;
const RTP_SEQ_MOD = 65536;

// Chaves SRTCP ponta-a-ponta (fallback). Preferimos hbhSrtp quando
// tivermos o hbh_key, que é a chave que o relay consegue ler.
function deriveSrtcpKeys(callKey, participantLid) {
    if (callKey.length < 32) return null;
    const master = hkdfSha256(Buffer.alloc(32), callKey.subarray(0, 32), Buffer.from(participantLid, 'utf-8'), 46);
    const masterKey = master.subarray(0, 16);
    const masterSalt = master.subarray(16, 30);
    return {
        cipherKey: aesCmKdf(masterKey, masterSalt, 0x03, 16),
        authKey: aesCmKdf(masterKey, masterSalt, 0x04, 20),
        salt: aesCmKdf(masterKey, masterSalt, 0x05, 14),
    };
}

// SRTCP protect (RFC 3711 §3.4).
function protectSrtcp(keys, senderSsrc, index, rtcpPlain) {
    const split = Math.min(rtcpPlain.length, RTCP_HEADER_LEN);
    const roc = Math.floor((index >>> 0) / 0x10000);
    const seq = (index >>> 0) & 0xffff;
    const iv = buildE2eRtpIv(keys.salt, senderSsrc, roc, seq);
    const header = rtcpPlain.subarray(0, split);
    const body = rtcpPlain.subarray(split);
    const cipher = crypto.createCipheriv('aes-128-ctr', keys.cipherKey, iv);
    const encryptedBody = Buffer.concat([cipher.update(body), cipher.final()]);
    const indexBuf = Buffer.alloc(4);
    indexBuf.writeUInt32BE((0x80000000 | ((index >>> 0) & 0x7fffffff)) >>> 0, 0);
    const withoutTag = Buffer.concat([header, encryptedBody, indexBuf]);
    const mac = crypto.createHmac('sha1', keys.authKey).update(withoutTag).digest();
    return Buffer.concat([withoutTag, mac.subarray(0, SRTCP_AUTH_TAG_LEN)]);
}

function buildSenderReport(localSsrc, stats, nowMs) {
    const buf = Buffer.alloc(28);
    buf[0] = 0x80;
    buf[1] = RTCP_PT_SR;
    buf.writeUInt16BE(6, 2);
    buf.writeUInt32BE(localSsrc >>> 0, 4);
    const ntpSec = (Math.floor(nowMs / 1000) + NTP_UNIX_OFFSET_SECS) >>> 0;
    const ntpFrac = Math.floor((nowMs % 1000) / 1000 * 4294967296) >>> 0;
    buf.writeUInt32BE(ntpSec, 8);
    buf.writeUInt32BE(ntpFrac, 12);
    buf.writeUInt32BE(stats.rtpTimestamp >>> 0, 16);
    buf.writeUInt32BE(stats.packetsSent >>> 0, 20);
    buf.writeUInt32BE(stats.octetsSent >>> 0, 24);
    return buf;
}

function buildWhatsappRtcpCname(entropy) {
    const HEX = '0123456789abcdef';
    let randomHex = '';
    for (let nibble = 0; nibble < 11; nibble++) {
        const byte = entropy[6 + (nibble >> 1)];
        const value = (nibble & 1) === 0 ? (byte >> 4) : (byte & 0x0f);
        randomHex += HEX[value];
    }
    return Buffer.from(randomHex.slice(0, 5) + '@pj' + randomHex.slice(5, 11) + '.org', 'ascii');
}

function buildSourceDescription(localSsrc, cname) {
    const packet = Buffer.alloc(32);
    packet[0] = 0x81;
    packet[1] = RTCP_PT_SDES;
    packet.writeUInt16BE(7, 2);
    packet.writeUInt32BE(localSsrc >>> 0, 4);
    packet[8] = 1;
    packet[9] = WHATSAPP_RTCP_CNAME_LEN;
    cname.copy(packet, 10);
    return packet;
}

function encodeReceptionReport(report) {
    const buf = Buffer.alloc(24);
    buf.writeUInt32BE(report.ssrc >>> 0, 0);
    buf[4] = report.fractionLost & 0xff;
    const lostBuf = Buffer.alloc(4);
    lostBuf.writeUInt32BE(report.cumulativeLost >>> 0, 0);
    lostBuf.copy(buf, 5, 1, 4);
    buf.writeUInt32BE(report.extendedHighestSequence >>> 0, 8);
    buf.writeUInt32BE(report.jitter >>> 0, 12);
    buf.writeUInt32BE(report.lastSenderReport >>> 0, 16);
    buf.writeUInt32BE(report.delaySinceLastSenderReport >>> 0, 20);
    return buf;
}

function encodeWhatsappReceptionReport(report) {
    return Buffer.concat([encodeReceptionReport(report), Buffer.alloc(24)]);
}

function buildWhatsappSenderReportWithSdes(localSsrc, stats, nowMs, cname, report) {
    let sr = buildSenderReport(localSsrc, stats, nowMs);
    if (report) {
        sr[0] |= 1;
        sr = Buffer.concat([sr, encodeWhatsappReceptionReport(report)]);
        sr.writeUInt16BE(sr.length / 4 - 1, 2);
    }
    return Buffer.concat([sr, buildSourceDescription(localSsrc, cname)]);
}

// RFC 5761: RTCP usa payload type 192-223, nunca se sobrepõe com o PT de RTP (120).
export function isRtcpPacket(buf) {
    return buf.length >= 2 && (buf[0] >> 6) === 2 && buf[1] >= 192 && buf[1] <= 223;
}

export function parseRtpHeaderBasics(buf) {
    if (buf.length < 12) return null;
    return {
        sequenceNumber: buf.readUInt16BE(2),
        timestamp: buf.readUInt32BE(4),
        ssrc: buf.readUInt32BE(8),
    };
}

/** Perda/jitter/sequência de um SSRC remoto (RFC 3550 §A.1/§A.8 simplificado). */
class RtpReceptionStats {
    constructor(clockRate) {
        this.clockRate = clockRate;
        this.ssrc = null;
        this.baseSequence = 0;
        this.maxSequence = 0;
        this.cycles = 0;
        this.received = 0;
        this.expectedPrior = 0;
        this.receivedPrior = 0;
        this.jitterQ4 = 0;
        this.lastArrivalMs = null;
        this.lastRtpTimestamp = null;
        this.lastSenderReport = 0;
        this.lastSenderReportAtMs = null;
    }

    observe(ssrc, sequenceNumber, rtpTimestamp, arrivalMs) {
        if (this.ssrc === null) {
            this.ssrc = ssrc >>> 0;
            this.baseSequence = sequenceNumber;
            this.maxSequence = sequenceNumber;
            this.cycles = 0;
            this.received = 1;
        } else {
            const currentSeq16 = this.maxSequence & 0xffff;
            const udelta = (sequenceNumber - currentSeq16) & 0xffff;
            if (udelta < 3000) {
                if (sequenceNumber < currentSeq16) this.cycles += RTP_SEQ_MOD;
                this.maxSequence = this.cycles + sequenceNumber;
            }
            this.received++;
        }
        if (this.lastArrivalMs !== null && this.lastRtpTimestamp !== null) {
            const arrivalUnits = (arrivalMs / 1000) * this.clockRate;
            const lastArrivalUnits = (this.lastArrivalMs / 1000) * this.clockRate;
            const d = (arrivalUnits - lastArrivalUnits) - (rtpTimestamp - this.lastRtpTimestamp);
            this.jitterQ4 += Math.abs(d) - (this.jitterQ4 / 16);
        }
        this.lastArrivalMs = arrivalMs;
        this.lastRtpTimestamp = rtpTimestamp;
    }

    report(nowMs) {
        if (this.ssrc === null) return null;
        const expected = this.cycles + this.maxSequence - this.baseSequence + 1;
        const expectedInterval = expected - this.expectedPrior;
        const receivedInterval = this.received - this.receivedPrior;
        const lostInterval = expectedInterval - receivedInterval;
        let fractionLost = 0;
        if (expectedInterval > 0 && lostInterval > 0) {
            fractionLost = Math.min(255, Math.floor((lostInterval * 256) / expectedInterval));
        }
        this.expectedPrior = expected;
        this.receivedPrior = this.received;
        const cumulativeLost = Math.max(-0x800000, Math.min(0x7fffff, expected - this.received));
        const delaySinceLastSenderReport = this.lastSenderReportAtMs
            ? Math.min(0xffffffff, Math.round(((nowMs - this.lastSenderReportAtMs) * 65536) / 1000))
            : 0;
        return {
            ssrc: this.ssrc,
            fractionLost,
            cumulativeLost: cumulativeLost >>> 0,
            extendedHighestSequence: (this.cycles + (this.maxSequence & 0xffff)) >>> 0,
            jitter: Math.max(0, Math.floor(this.jitterQ4 / 16)) >>> 0,
            lastSenderReport: this.lastSenderReport,
            delaySinceLastSenderReport,
        };
    }
}

/**
 * Sessão RTCP de uma call. `sendRaw(buf)` manda pelo DataChannel. `log` é
 * opcional (tipicamente o logger do socket, nível trace/debug).
 */
export function createRtcpSession({ callId, localSsrc, callKey, hbhKey, selfParticipantId, clockRate, sendRaw, log, isBurst }) {
    const burst = typeof isBurst === 'function' ? isBurst : () => false;
    const hbhKeys = hbhKey && hbhKey.length === hbhSrtp.HBH_KEY_LEN ? hbhSrtp.deriveHbhSrtcpKeysUplink(hbhKey) : null;
    const keys = hbhKeys || deriveSrtcpKeys(callKey, selfParticipantId);
    if (log) {
        const origem = hbhKeys ? 'hop-by-hop' : (keys ? 'ponta-a-ponta (fallback)' : 'sem chaves válidas');
        log(`[CALL] [RTCP ${callId}] sessão criada (ssrc=${localSsrc}, chaves: ${origem}).`);
    }
    const cname = buildWhatsappRtcpCname(crypto.randomBytes(12));
    let index = 1;
    let sentPackets = 0;
    const sendStats = { packetsSent: 0, octetsSent: 0, rtpTimestamp: 0 };
    const receptionBySsrc = new Map();
    let announced = false;
    let timer = null;

    function send(plain) {
        if (!keys) return;
        try {
            const packet = protectSrtcp(keys, localSsrc, index, plain);
            index = (index + 1) >>> 0;
            sendRaw(packet);
            sentPackets++;
            if (sentPackets === 1 || sentPackets % 20 === 0 || burst()) {
                log && log(`[CALL] [RTCP ${callId}] pacote ${sentPackets} mandado (${packet.length} bytes, index=${index - 1}, participantes: ${receptionBySsrc.size}).`);
            }
        } catch (e) {
            if (log) log(`[CALL] [RTCP ${callId}] erro protegendo/mandando pacote:`, e.stack || e.message);
        }
    }

    function announce() {
        if (announced || !keys) return;
        announced = true;
        send(buildSourceDescription(localSsrc, cname));
    }

    function recordSent(payloadLength, rtpTimestamp) {
        sendStats.packetsSent = (sendStats.packetsSent + 1) >>> 0;
        sendStats.octetsSent = (sendStats.octetsSent + payloadLength) >>> 0;
        sendStats.rtpTimestamp = rtpTimestamp >>> 0;
    }

    function recordReceived(rawRtpPacket, arrivalMs) {
        if (isRtcpPacket(rawRtpPacket)) {
            if (burst() && log) log(`[CALL] [RTCP ${callId}] recordReceived ignorou pacote RTCP ${rawRtpPacket.length}B.`);
            return;
        }
        const parsed = parseRtpHeaderBasics(rawRtpPacket);
        if (!parsed) {
            if (log) log(`[CALL] [RTCP ${callId}] pacote curto demais pra ter cabeçalho RTP (${rawRtpPacket.length}B).`);
            return;
        }
        let stats = receptionBySsrc.get(parsed.ssrc);
        if (!stats) {
            stats = new RtpReceptionStats(clockRate);
            receptionBySsrc.set(parsed.ssrc, stats);
            if (log) log(`[CALL] [RTCP ${callId}] novo participante remoto: ssrc=${parsed.ssrc} (total: ${receptionBySsrc.size}).`);
        }
        stats.observe(parsed.ssrc, parsed.sequenceNumber, parsed.timestamp, arrivalMs);
    }

    function tick() {
        try {
            if (!keys) return;
            const nowMs = Date.now();
            if (receptionBySsrc.size === 0) {
                send(buildWhatsappSenderReportWithSdes(localSsrc, sendStats, nowMs, cname, null));
                return;
            }
            for (const stats of receptionBySsrc.values()) {
                const report = stats.report(nowMs);
                send(buildWhatsappSenderReportWithSdes(localSsrc, sendStats, nowMs, cname, report));
            }
        } catch (e) {
            if (log) log(`[CALL] [RTCP ${callId}] erro no tick periódico:`, e.stack || e.message);
        }
    }

    function start() {
        if (log) log(`[CALL] [RTCP ${callId}] iniciando (anúncio + timer de ${RTCP_MS}ms).`);
        announce();
        timer = setInterval(tick, RTCP_MS);
    }

    function close() {
        if (timer) clearInterval(timer);
        timer = null;
    }

    return { start, close, recordSent, recordReceived };
}
