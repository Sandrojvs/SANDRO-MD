'use strict';

// Framing RTP+WARP da WhatsApp: cabeçalho de 16/20 bytes com extensão
// 0xdebe (não é RTP puro RFC 3550).

const RTP_VERSION = 2;
const WHATSAPP_RTP_EXTENSION_PROFILE = 0xdebe;
const WHATSAPP_RTP_HEADER_SIZE = 16;
const WHATSAPP_RTP_HEADER_DTX_SIZE = 20;
const WARP_AUDIO_PIGGYBACK_EXT = 0x30010000;
const WARP_PIGGYBACK_START_PACKET = 2;

export const RTP_PAYLOAD_TYPE_OPUS = 111;
export const RTP_PAYLOAD_TYPE_WHATSAPP_AUDIO = 120;

export function encodeRtpHeader({ marker, payloadType, sequenceNumber, timestamp, ssrc, extensionWord }) {
    const size = extensionWord != null ? WHATSAPP_RTP_HEADER_DTX_SIZE : WHATSAPP_RTP_HEADER_SIZE;
    const b = Buffer.alloc(size);
    b[0] = (RTP_VERSION << 6) | 0x10;
    b[1] = ((marker ? 1 : 0) << 7) | (payloadType & 0x7f);
    b.writeUInt16BE(sequenceNumber & 0xffff, 2);
    b.writeUInt32BE(timestamp >>> 0, 4);
    b.writeUInt32BE(ssrc >>> 0, 8);
    b.writeUInt16BE(WHATSAPP_RTP_EXTENSION_PROFILE, 12);
    b.writeUInt16BE(extensionWord != null ? 1 : 0, 14);
    if (extensionWord != null) b.writeUInt32BE(extensionWord >>> 0, 16);
    return b;
}

/** Sequenciador de envio RTP. Aceita um estado inicial pra continuar de onde parou num reconnect. */
export class RtpSender {
    constructor(ssrc, samplesPerPacket, payloadType = RTP_PAYLOAD_TYPE_WHATSAPP_AUDIO, resumeState = null) {
        this.ssrc = ssrc;
        this.samplesPerPacket = samplesPerPacket;
        this.payloadType = payloadType;
        this.seq = resumeState ? (resumeState.seq & 0xffff) : 1;
        this.timestamp = resumeState ? (resumeState.timestamp >>> 0) : 0;
        this.packetIndex = resumeState ? resumeState.packetIndex : 0;
        this.roc = resumeState ? resumeState.roc : 0;
    }

    getState() {
        return { seq: this.seq, timestamp: this.timestamp, packetIndex: this.packetIndex, roc: this.roc };
    }

    nextHeader() {
        const marker = this.packetIndex === 0;
        const extensionWord = this.packetIndex >= WARP_PIGGYBACK_START_PACKET ? WARP_AUDIO_PIGGYBACK_EXT : null;
        const sequenceNumber = this.seq;
        const timestamp = this.timestamp;
        const header = encodeRtpHeader({
            marker,
            payloadType: this.payloadType,
            sequenceNumber,
            timestamp,
            ssrc: this.ssrc,
            extensionWord,
        });
        this.seq = (this.seq + 1) & 0xffff;
        this.timestamp = (this.timestamp + this.samplesPerPacket) >>> 0;
        this.packetIndex += 1;
        return { header, sequenceNumber, roc: this.roc, timestamp };
    }
}
