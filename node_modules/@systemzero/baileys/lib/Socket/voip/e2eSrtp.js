'use strict';

// SRTP ponta-a-ponta (E2E) das chamadas de voz.

import crypto from 'crypto';

export function hkdfSha256(salt, ikm, info, len) {
    return Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));
}

// AES-CM PRF (libsrtp KDF).
export function aesCmKdf(masterKey, masterSalt, label, len) {
    const iv = Buffer.alloc(16);
    masterSalt.copy(iv, 0, 0, 14);
    iv[7] ^= label;
    const cipher = crypto.createCipheriv('aes-128-ctr', masterKey, iv);
    const zeros = Buffer.alloc(len);
    return Buffer.concat([cipher.update(zeros), cipher.final()]);
}

/** Deriva as chaves E2E a partir da callKey (32B) e do LID do remetente. */
export function deriveE2eKeys(callKey, participantLid) {
    if (callKey.length < 32) return null;
    const master = hkdfSha256(Buffer.alloc(32), callKey.subarray(0, 32), Buffer.from(participantLid, 'utf-8'), 46);
    const masterKey = master.subarray(0, 16);
    const masterSalt = master.subarray(16, 30);
    return {
        cipherKey: aesCmKdf(masterKey, masterSalt, 0x00, 16),
        authKey: aesCmKdf(masterKey, masterSalt, 0x01, 20),
        salt: aesCmKdf(masterKey, masterSalt, 0x02, 14),
    };
}

/** IV do RTP: salt + SSRC + packet index (roc<<16|seq). */
export function buildE2eRtpIv(salt, ssrc, roc, seq) {
    const iv = Buffer.alloc(16);
    salt.copy(iv, 14 - salt.length);
    iv[4] ^= (ssrc >>> 24) & 0xff;
    iv[5] ^= (ssrc >>> 16) & 0xff;
    iv[6] ^= (ssrc >>> 8) & 0xff;
    iv[7] ^= ssrc & 0xff;
    const packetIndex = BigInt(roc >>> 0) * 0x10000n + BigInt(seq >>> 0);
    const hi16 = Number((packetIndex >> 32n) & 0xffffn);
    const lo32 = Number(packetIndex & 0xffffffffn);
    iv[8] ^= (hi16 >> 8) & 0xff;
    iv[9] ^= hi16 & 0xff;
    iv[10] ^= (lo32 >>> 24) & 0xff;
    iv[11] ^= (lo32 >>> 16) & 0xff;
    iv[12] ^= (lo32 >>> 8) & 0xff;
    iv[13] ^= lo32 & 0xff;
    return iv;
}

/** AES-128-CTR (simétrico). */
export function cryptPayload(keys, ssrc, seq, roc, payload) {
    const iv = buildE2eRtpIv(keys.salt, ssrc, roc, seq);
    const cipher = crypto.createCipheriv('aes-128-ctr', keys.cipherKey, iv);
    return Buffer.concat([cipher.update(payload), cipher.final()]);
}

/** Tag WARP MESSAGE-INTEGRITY. */
export function computeWarpMiTag(authKey, packetWithoutTag, roc, tagLen) {
    const rocBuf = Buffer.alloc(4);
    rocBuf.writeUInt32BE(roc >>> 0, 0);
    const mac = crypto.createHmac('sha1', authKey).update(Buffer.concat([packetWithoutTag, rocBuf])).digest();
    return mac.subarray(0, tagLen);
}
