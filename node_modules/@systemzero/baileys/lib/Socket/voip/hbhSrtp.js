'use strict';

// SRTP/SRTCP "hop-by-hop" (cliente<->relay), separado do E2E ponta-a-ponta.
// A chave (hbh_key, 30 bytes) vem no <relay> da resposta do offer.

import crypto from 'crypto';
import { hkdfSha256 } from './e2eSrtp.js';

export const HBH_KEY_LEN = 30;
const HBH_SALT_SEED_LEN = 14;

const LABEL_RTCP_ENCRYPTION = 0x03;
const LABEL_RTCP_AUTH = 0x04;
const LABEL_RTCP_SALT = 0x05;

const NULL_SALT_32 = Buffer.alloc(32);

function deriveHbhKeyWithLabels(hbhKey, saltLabel, keyLabel) {
    if (!hbhKey || hbhKey.length !== HBH_KEY_LEN) return null;
    const saltSeed = hbhKey.subarray(0, HBH_SALT_SEED_LEN);
    const keySeed = hbhKey.subarray(HBH_SALT_SEED_LEN);
    const derivedSalt = hkdfSha256(NULL_SALT_32, saltSeed, Buffer.from(saltLabel, 'utf-8'), 32);
    return hkdfSha256(derivedSalt, keySeed, Buffer.from(keyLabel, 'utf-8'), HBH_KEY_LEN);
}

function deriveHbhSrtcpKeyUplink(hbhKey) {
    return deriveHbhKeyWithLabels(hbhKey, 'uplink hbh srtcp salt', 'uplink hbh srtcp key');
}

function deriveHbhSrtcpKeyDownlink(hbhKey) {
    return deriveHbhKeyWithLabels(hbhKey, 'downlink hbh srtcp salt', 'downlink hbh srtcp key');
}

function keyingFromCryptoKey(cryptoKey30) {
    return {
        masterKey: cryptoKey30.subarray(0, 16),
        masterSalt: cryptoKey30.subarray(16, 30),
    };
}

// AES-ICM estilo libsrtp (vai-um de 2 bytes, não é CTR de 128 bits padrão).
function aesIcmCrypt(key30, iv16, data) {
    const aesKey = key30.subarray(0, 16);
    const salt = key30.subarray(16, 30);
    const counter = Buffer.alloc(16);
    salt.copy(counter, 0, 0, 14);
    for (let i = 0; i < 16; i++) counter[i] ^= iv16[i];

    const out = Buffer.from(data);
    let pos = 0;
    while (pos < out.length) {
        const cipher = crypto.createCipheriv('aes-128-ecb', aesKey, null);
        cipher.setAutoPadding(false);
        const ks = Buffer.concat([cipher.update(counter), cipher.final()]);
        const n = Math.min(16, out.length - pos);
        for (let i = 0; i < n; i++) out[pos + i] ^= ks[i];
        pos += n;
        counter[15] = (counter[15] + 1) & 0xff;
        if (counter[15] === 0) counter[14] = (counter[14] + 1) & 0xff;
    }
    return out;
}

function aesIcmKey30(aesKey16, salt14) {
    return Buffer.concat([aesKey16.subarray(0, 16), salt14.subarray(0, 14)]);
}

function deriveSessionBytes(masterKey, masterSalt, label, len) {
    const kdfKey = aesIcmKey30(masterKey, masterSalt);
    const iv = Buffer.alloc(16);
    iv[7] = label;
    return aesIcmCrypt(kdfKey, iv, Buffer.alloc(len));
}

function expandLibsrtcpSessionKeys(keying) {
    return {
        sessionKey: deriveSessionBytes(keying.masterKey, keying.masterSalt, LABEL_RTCP_ENCRYPTION, 16),
        sessionSalt: deriveSessionBytes(keying.masterKey, keying.masterSalt, LABEL_RTCP_SALT, 14),
        authKey: deriveSessionBytes(keying.masterKey, keying.masterSalt, LABEL_RTCP_AUTH, 20),
    };
}

/** Chaves SRTCP hop-by-hop de uplink (o que a gente manda pro relay). */
export function deriveHbhSrtcpKeysUplink(hbhKey) {
    const stage1 = deriveHbhSrtcpKeyUplink(hbhKey);
    if (!stage1) return null;
    const session = expandLibsrtcpSessionKeys(keyingFromCryptoKey(stage1));
    return { cipherKey: session.sessionKey, authKey: session.authKey, salt: session.sessionSalt };
}

/** Chaves SRTCP hop-by-hop de downlink (o que o relay manda pra gente). */
export function deriveHbhSrtcpKeysDownlink(hbhKey) {
    const stage1 = deriveHbhSrtcpKeyDownlink(hbhKey);
    if (!stage1) return null;
    const session = expandLibsrtcpSessionKeys(keyingFromCryptoKey(stage1));
    return { cipherKey: session.sessionKey, authKey: session.authKey, salt: session.sessionSalt };
}
