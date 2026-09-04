'use strict';

// STUN Allocate (variante WASM) pro relay de mídia das chamadas de voz.

import crypto from 'crypto';

const STUN_MAGIC = 0x2112a442;
const STUN_XOR_PORT = 0x2112;
const STUN_XOR_ADDR = [0x21, 0x12, 0xa4, 0x42];

const ATTR_MESSAGE_INTEGRITY = 0x0008;
const ATTR_FINGERPRINT = 0x8028;
const ATTR_RELAY_TOKEN = 0x4000;
const STUN_ATTR_STREAM_DESCRIPTORS = 0x4024;
const STUN_ATTR_WASM_RELAY_ENDPOINT = 0x0016;
const ATTR_SENDER_SUBSCRIPTIONS_V2 = 0x4025;
const STUN_ATTR_RECEIVER_SUBSCRIPTIONS = 0x4021;
const STUN_ATTR_PARTICIPANT_COUNT = 0x805a;

export const MSG_ALLOCATE_REQUEST = 0x0003;
export const MSG_ALLOCATE_SUCCESS = 0x0103;
export const MSG_ALLOCATE_ERROR = 0x0113;
export const MSG_BINDING_SUCCESS = 0x0101;
export const MSG_WHATSAPP_PING = 0x0801;

function pad4(n) { return (4 - (n % 4)) % 4; }

function stunAttr(attrType, value) {
    const pad = pad4(value.length);
    const buf = Buffer.alloc(4 + value.length + pad);
    buf.writeUInt16BE(attrType, 0);
    buf.writeUInt16BE(value.length, 2);
    value.copy(buf, 4);
    return buf;
}

export function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc ^= buf[i];
        for (let j = 0; j < 8; j++) {
            const mask = -(crc & 1);
            crc = (crc >>> 1) ^ (0xedb88320 & mask);
        }
    }
    return (~crc) >>> 0;
}

function stunPseudoHeader(msgType, msgLen, transactionId) {
    const h = Buffer.alloc(20);
    h.writeUInt16BE(msgType, 0);
    h.writeUInt16BE(msgLen, 2);
    h.writeUInt32BE(STUN_MAGIC, 4);
    transactionId.copy(h, 8);
    return h;
}

/** Header + attrs, com MESSAGE-INTEGRITY e FINGERPRINT opcionais. */
export function encodeStunRequest(msgType, transactionId, attrs, integrityKey, includeFingerprint) {
    let body = Buffer.from(attrs);

    if (integrityKey) {
        const msgLen = body.length + 24;
        const header = stunPseudoHeader(msgType, msgLen, transactionId);
        const mi = crypto.createHmac('sha1', integrityKey).update(Buffer.concat([header, body])).digest();
        body = Buffer.concat([body, stunAttr(ATTR_MESSAGE_INTEGRITY, mi)]);
    }

    if (includeFingerprint) {
        const msgLen = body.length + 8;
        const header = stunPseudoHeader(msgType, msgLen, transactionId);
        const fp = (crc32(Buffer.concat([header, body])) ^ 0x5354554e) >>> 0;
        const fpBuf = Buffer.alloc(4);
        fpBuf.writeUInt32BE(fp, 0);
        body = Buffer.concat([body, stunAttr(ATTR_FINGERPRINT, fpBuf)]);
    }

    const out = Buffer.alloc(20 + body.length);
    out.writeUInt16BE(msgType, 0);
    out.writeUInt16BE(body.length, 2);
    out.writeUInt32BE(STUN_MAGIC, 4);
    transactionId.copy(out, 8);
    body.copy(out, 20);
    return out;
}

export function encodeXorRelayEndpoint(ipv4, port) {
    const octets = ipv4.split('.').map((n) => parseInt(n, 10));
    if (octets.length !== 4 || octets.some((n) => Number.isNaN(n))) return null;
    const xorPort = port ^ STUN_XOR_PORT;
    const buf = Buffer.alloc(6);
    buf.writeUInt16BE(xorPort, 0);
    for (let i = 0; i < 4; i++) buf[2 + i] = octets[i] ^ STUN_XOR_ADDR[i];
    return buf;
}

function createWasmRelayEndpointAttr(endpointXor) {
    const buf = Buffer.alloc(8);
    buf.writeUInt16BE(1, 0);
    endpointXor.copy(buf, 2);
    return buf;
}

/** SSRC de participante/stream via HKDF-SHA256(salt=slotWord, ikm=callId, info=lid). */
export function deriveWasmParticipantSsrc(callId, lid, slotWord) {
    const salt = Buffer.alloc(4);
    salt.writeUInt32LE(slotWord >>> 0, 0);
    const okm = Buffer.from(crypto.hkdfSync('sha256', Buffer.from(callId, 'utf-8'), salt, Buffer.from(lid, 'utf-8'), 4));
    return okm.readUInt32LE(0);
}

// audio media/FEC/NACK, video media/FEC/NACK, hbh FEC tx/rx, app-data.
const WASM_STREAM_SLOTS = [
    [0, 0, 0], [0, 1, 1], [0, 2, 4],
    [1, 0, 2], [1, 1, 3], [1, 2, 5],
    [2, 0, 7], [2, 1, 8], [2, 2, 6],
];

// Protobuf wire mínimo (varints planos, sem zigzag).
function pbVarint(bytes, value) {
    let v = value >>> 0;
    while (v > 0x7f) {
        bytes.push((v & 0x7f) | 0x80);
        v >>>= 7;
    }
    bytes.push(v);
}
function pbTag(bytes, field, wire) { pbVarint(bytes, (field << 3) | wire); }
function pbLenDelim(out, field, valueBytes) {
    pbTag(out, field, 2);
    pbVarint(out, valueBytes.length);
    for (const b of valueBytes) out.push(b);
}

export function createWasmStreamDescriptorsFromSsrcs(streamSsrcs, hbhFecSsrcs) {
    const out = [];
    WASM_STREAM_SLOTS.forEach(([streamIndex, subType], i) => {
        const ssrc = streamSsrcs[i];
        if (!ssrc) return;
        const d = [];
        if (streamIndex !== 0) { pbTag(d, 1, 0); pbVarint(d, streamIndex); }
        if (subType !== 0) { pbTag(d, 2, 0); pbVarint(d, subType); }
        pbTag(d, 3, 0); pbVarint(d, ssrc);
        pbLenDelim(out, 1, d);
    });
    hbhFecSsrcs.forEach((ssrc, index) => {
        if (!ssrc) return;
        const d = [];
        pbTag(d, 1, 0); pbVarint(d, index + 3);
        pbTag(d, 2, 0); pbVarint(d, 3);
        pbTag(d, 3, 0); pbVarint(d, ssrc);
        pbLenDelim(out, 1, d);
    });
    return Buffer.from(out);
}

function createWasmStreamDescriptors(callId, selfParticipantId) {
    const ssrcs = WASM_STREAM_SLOTS.map(([, , slot]) => deriveWasmParticipantSsrc(callId, selfParticipantId, slot));
    return createWasmStreamDescriptorsFromSsrcs(ssrcs, [0, 0]);
}

export function deriveWasmRelayStreamSsrcs(callId, lid) {
    return WASM_STREAM_SLOTS.map(([, , slot]) => deriveWasmParticipantSsrc(callId, lid, slot));
}

// Slots 0-5 (audio+video) determinísticos; 6-8 (hbh FEC + app-data)
// sorteados uma vez por sessão de grupo e reaproveitados dali em diante.
export const APP_DATA_SSRC_SLOT_WORD = 6;
export const HBH_FEC_TX_SSRC_SLOT_WORD = 7;
export const HBH_FEC_RX_SSRC_SLOT_WORD = 8;

export function prepareGroupStreamAuxSsrcs(callId, lid, appDataSsrc) {
    const ssrcs = deriveWasmRelayStreamSsrcs(callId, lid);
    const used = new Set(ssrcs.slice(0, 6));
    used.add(appDataSsrc >>> 0);
    for (let i = 6; i < 9; i++) {
        let candidate = 0;
        for (let tries = 0; tries < 64; tries++) {
            candidate = crypto.randomBytes(4).readUInt32BE(0);
            if (candidate !== 0 && !used.has(candidate)) break;
            candidate = 0;
        }
        if (!candidate) throw new Error('não deu pra sortear um SSRC auxiliar único pro grupo');
        used.add(candidate);
        ssrcs[i] = candidate;
    }
    return ssrcs;
}

function normalizedPids(participantPids) {
    return Array.from(new Set(participantPids)).sort((a, b) => a - b);
}

function createWasmSenderSubscription(ssrcs, participantPids, video) {
    const packedSsrcs = [];
    for (const ssrc of ssrcs) {
        if (!ssrc) continue;
        pbVarint(packedSsrcs, ssrc);
    }
    const subscription = [];
    pbLenDelim(subscription, 1, packedSsrcs);
    for (const pid of participantPids) {
        const participant = [];
        pbTag(participant, 1, 0);
        pbVarint(participant, pid);
        if (video) { pbTag(participant, 2, 0); pbVarint(participant, 1); }
        pbLenDelim(subscription, 2, participant);
    }
    const wrapper = [];
    pbLenDelim(wrapper, 1, subscription);
    const out = [];
    pbLenDelim(out, 1, wrapper);
    return Buffer.from(out);
}

export function createWasmGroupSenderSubscriptions(streamSsrcs, appDataSsrc, participantPids) {
    const pids = normalizedPids(participantPids);
    return Buffer.concat([
        createWasmSenderSubscription(streamSsrcs.slice(3, 6), pids, true),
        createWasmSenderSubscription(streamSsrcs.slice(6, 9), [], false),
        createWasmSenderSubscription(streamSsrcs.slice(0, 3), pids, false),
        createWasmSenderSubscription([appDataSsrc], pids, false),
    ]);
}

export function createWasmGroupReceiverSubscriptions(participantPids) {
    const out = [];
    for (const pid of normalizedPids(participantPids)) {
        const participant = [];
        pbTag(participant, 1, 0);
        pbVarint(participant, pid);
        pbLenDelim(out, 2, participant);
    }
    return Buffer.from(out);
}

/** Allocate de grupo: igual o 1:1, mas com sender/receiver subscriptions quando já tem pid conectado. */
export function buildWasmGroupStunAllocateRequest({ transactionId, relayToken, endpointXor, integrityKey, streamSsrcs, appDataSsrc, hbhFecSsrcs, participantPids }) {
    const pids = normalizedPids(participantPids || []);
    const descriptors = createWasmStreamDescriptorsFromSsrcs(streamSsrcs, pids.length > 1 ? hbhFecSsrcs : [0, 0]);

    let attrs = stunAttr(ATTR_RELAY_TOKEN, relayToken);
    if (pids.length > 0) {
        attrs = Buffer.concat([attrs, stunAttr(ATTR_SENDER_SUBSCRIPTIONS_V2, createWasmGroupSenderSubscriptions(streamSsrcs, appDataSsrc, pids))]);
        attrs = Buffer.concat([attrs, stunAttr(STUN_ATTR_RECEIVER_SUBSCRIPTIONS, createWasmGroupReceiverSubscriptions(pids))]);
    }
    attrs = Buffer.concat([attrs, stunAttr(STUN_ATTR_STREAM_DESCRIPTORS, descriptors)]);
    if (pids.length > 0) {
        const participantCount = [];
        pbVarint(participantCount, pids.length);
        attrs = Buffer.concat([attrs, stunAttr(STUN_ATTR_PARTICIPANT_COUNT, Buffer.from(participantCount))]);
    }
    attrs = Buffer.concat([attrs, stunAttr(STUN_ATTR_WASM_RELAY_ENDPOINT, createWasmRelayEndpointAttr(endpointXor))]);

    return encodeStunRequest(MSG_ALLOCATE_REQUEST, transactionId, attrs, integrityKey, false);
}

/** Allocate 1:1 (variante WASM). */
export function buildWasmStunAllocateRequest(transactionId, relayToken, endpointXor, integrityKey, callId, selfParticipantId) {
    let attrs = stunAttr(ATTR_RELAY_TOKEN, relayToken);
    attrs = Buffer.concat([attrs, stunAttr(STUN_ATTR_STREAM_DESCRIPTORS, createWasmStreamDescriptors(callId, selfParticipantId))]);
    attrs = Buffer.concat([attrs, stunAttr(STUN_ATTR_WASM_RELAY_ENDPOINT, createWasmRelayEndpointAttr(endpointXor))]);
    return encodeStunRequest(MSG_ALLOCATE_REQUEST, transactionId, attrs, integrityKey, false);
}

/** Consent ping (RFC 7675), mandado junto com cada reenvio do Allocate. */
export function buildWhatsappPing(transactionId) {
    return encodeStunRequest(MSG_WHATSAPP_PING, transactionId, Buffer.alloc(0), null, false);
}

export function isStunPacket(data) {
    return data.length >= 2 && (data[0] & 0xc0) === 0x00;
}
export function stunMessageType(data) {
    if (data.length < 2) return null;
    return (((data[0] & 0x3f) << 8) | data[1]) & 0xffff;
}
export function stunTransactionId(data) {
    return data.length >= 20 ? data.subarray(8, 20) : null;
}

/** Percorre os atributos TLV de uma resposta STUN (RFC 5389). */
export function parseStunAttributes(data) {
    const attrs = [];
    let off = 20;
    while (off + 4 <= data.length) {
        const attrType = data.readUInt16BE(off);
        const len = data.readUInt16BE(off + 2);
        const valueStart = off + 4;
        if (valueStart + len > data.length) break;
        attrs.push({ attrType, value: data.subarray(valueStart, valueStart + len) });
        off = valueStart + len + pad4(len);
    }
    return attrs;
}
