'use strict';

// Parser do bloco <relay> que vem dentro do <ack type="offer"> — chaves
// STUN/SRTP e endereços dos servidores de mídia da chamada.

const HBH_KEY_LEN = 30;
const MAX_RELAY_TOKENS = 64;

function children(node) {
    return Array.isArray(node?.content) ? node.content : [];
}

function contentBytes(node) {
    if (!node) return null;
    const c = node.content;
    if (Buffer.isBuffer(c)) return c;
    if (c instanceof Uint8Array) return Buffer.from(c);
    if (typeof c === 'string') return Buffer.from(c, 'utf-8');
    return null;
}

function looksLikeBase64(txt) {
    return txt.length >= 4 && /^[A-Za-z0-9+/=]+$/.test(txt);
}

function tryDecodeBase64(bytes) {
    const txt = bytes.toString('utf-8');
    if (!looksLikeBase64(txt)) return null;
    try {
        const decoded = Buffer.from(txt, 'base64');
        if (decoded.toString('base64').replace(/=+$/, '') === txt.replace(/=+$/, '')) return decoded;
        return null;
    } catch {
        return null;
    }
}

function decodeHbhKey(bytes) {
    if (!bytes || bytes.length === 0) return null;
    let decoded = tryDecodeBase64(bytes) || bytes;
    if (decoded.length !== HBH_KEY_LEN) {
        const inner = tryDecodeBase64(decoded);
        if (inner && inner.length === HBH_KEY_LEN) decoded = inner;
    }
    return decoded.length === HBH_KEY_LEN ? decoded : null;
}

function decodeRelayKeyContent(bytes) {
    return tryDecodeBase64(bytes) || bytes;
}

function parseIndexedTokens(kids, tag) {
    const tokens = [];
    for (const node of kids) {
        if (node.tag !== tag) continue;
        const bytes = contentBytes(node);
        if (!bytes) continue;
        const idRaw = node.attrs?.id;
        let id = tokens.length;
        if (idRaw !== undefined) {
            const parsed = parseInt(idRaw, 10);
            if (Number.isFinite(parsed) && parsed >= 0) id = parsed;
        }
        if (id >= MAX_RELAY_TOKENS) continue;
        while (tokens.length <= id) tokens.push(Buffer.alloc(0));
        tokens[id] = bytes;
    }
    return tokens;
}

function parseTe2Address(bytes, protocol) {
    if (bytes.length === 6) {
        return {
            protocol,
            ipv4: `${bytes[0]}.${bytes[1]}.${bytes[2]}.${bytes[3]}`,
            ipv6: null,
            port: (bytes[4] << 8) | bytes[5],
        };
    }
    if (bytes.length === 18) {
        const parts = [];
        for (let i = 0; i < 16; i += 2) {
            parts.push(((bytes[i] << 8) | bytes[i + 1]).toString(16));
        }
        return {
            protocol,
            ipv4: null,
            ipv6: parts.join(':'),
            port: (bytes[16] << 8) | bytes[17],
        };
    }
    return null;
}

/** Procura um <relay> em qualquer lugar da sub-árvore. */
export function findRelayNode(node) {
    if (!node) return null;
    if (node.tag === 'relay') return node;
    for (const child of children(node)) {
        const found = findRelayNode(child);
        if (found) return found;
    }
    return null;
}

export function parseRelayData(relayNode) {
    const kids = children(relayNode);
    const findBytes = (tag) => {
        const node = kids.find((c) => c.tag === tag);
        return node ? contentBytes(node) : null;
    };

    const keyBytes = findBytes('key');
    const hbhKeyBytes = findBytes('hbh_key');
    const warpMiTagLenBytes = findBytes('warp_mi_tag_len');
    const warpMiTagLen = warpMiTagLenBytes
        ? parseInt(warpMiTagLenBytes.toString('utf-8').trim(), 10) || null
        : null;

    const relayTokens = parseIndexedTokens(kids, 'token');
    const authTokens = parseIndexedTokens(kids, 'auth_token');

    const endpoints = [];
    const indexByKey = new Map();
    for (const te2 of kids.filter((c) => c.tag === 'te2')) {
        const addrBytes = contentBytes(te2);
        if (!addrBytes) continue;
        const a = te2.attrs || {};
        const relayId = parseInt(a.relay_id, 10) || 0;
        const relayName = a.relay_name || '';
        const tokenId = parseInt(a.token_id, 10) || 0;
        const authTokenId = parseInt(a.auth_token_id, 10) || 0;
        const isFna = a.is_fna === '1';
        const protocol = parseInt(a.protocol, 10) || 0;
        const c2rRttMs = a.c2r_rtt !== undefined ? parseInt(a.c2r_rtt, 10) : null;

        const address = parseTe2Address(addrBytes, protocol);
        if (!address) continue;

        const key = `${relayId}:${relayName}`;
        if (!indexByKey.has(key)) {
            indexByKey.set(key, endpoints.length);
            endpoints.push({
                relayId, relayName, tokenId, authTokenId, isFna,
                ipv4Te2Bytes: null, addresses: [], c2rRttMs,
            });
        }
        const endpoint = endpoints[indexByKey.get(key)];
        endpoint.addresses.push(address);
        if (c2rRttMs !== null) endpoint.c2rRttMs = c2rRttMs;
        if (addrBytes.length === 6 && !endpoint.ipv4Te2Bytes) endpoint.ipv4Te2Bytes = addrBytes;
    }

    const attrs = relayNode.attrs || {};
    return {
        hbhKey: hbhKeyBytes ? decodeHbhKey(hbhKeyBytes) : null,
        hbhKeyAscii: hbhKeyBytes,
        relayKey: keyBytes ? decodeRelayKeyContent(keyBytes) : null,
        relayKeyAscii: keyBytes,
        warpMiTagLen,
        uuid: attrs.uuid || null,
        transactionId: attrs['transaction-id'] !== undefined ? parseInt(attrs['transaction-id'], 10) : null,
        selfPid: attrs.self_pid !== undefined ? parseInt(attrs.self_pid, 10) : null,
        peerPid: attrs.peer_pid !== undefined ? parseInt(attrs.peer_pid, 10) : null,
        relayTokens,
        authTokens,
        endpoints,
    };
}

/** FNA relays (inbound-only) não servem pra conectar por conta própria. */
export function isOutboundRelayCandidate(endpoint) {
    return !endpoint.isFna && endpoint.authTokenId !== 0;
}

export const WEB_CLIENT_RELAY_PORT = 3480;

export function getPrimaryIpv4Address(endpoint) {
    const addr = endpoint.addresses.find((a) => a.ipv4);
    return addr ? { ip: addr.ipv4, port: addr.port } : null;
}

/** Escolhe o endpoint de relay pra conectar a mídia. */
export function getMediaRelayEndpoint(relayData) {
    const usable = (e) => {
        const addr = getPrimaryIpv4Address(e);
        const token = relayData.relayTokens[e.tokenId];
        return !!addr && !!token && token.length > 0;
    };
    const onWebClientPort = (e) => {
        const addr = getPrimaryIpv4Address(e);
        return !!addr && addr.port === WEB_CLIENT_RELAY_PORT;
    };
    const pick = (usableOnly) => {
        return relayData.endpoints.find((e) => onWebClientPort(e) && (!usableOnly || usable(e)))
            || relayData.endpoints.find((e) => isOutboundRelayCandidate(e) && (!usableOnly || usable(e)))
            || relayData.endpoints.find((e) => !e.isFna && (!usableOnly || usable(e)))
            || relayData.endpoints.find((e) => !usableOnly || usable(e))
            || null;
    };
    return pick(true) || pick(false);
}
