'use strict';

// Backoff de reconexão com jitter total, igual o app oficial: dobra a cada
// falha, sorteia dentro de [base/2, base*1.5), trava num teto com folga de
// +-30s pra não sincronizar reconexões de várias instâncias no mesmo segundo.

const DEFAULT_BASE_MS = 2000;
const DEFAULT_CAP_MS = 15 * 60 * 1000;

export function computeReconnectDelay(attempts, { baseMs = DEFAULT_BASE_MS, capMs = DEFAULT_CAP_MS } = {}) {
    const n = Math.min(Math.max(attempts, 0), 20);
    const raw = Math.min(baseMs * Math.pow(2, n), capMs);
    let delay = raw / 2 + Math.random() * raw;
    if (delay > capMs) {
        delay = capMs + (Math.random() * 60000 - 30000);
    }
    return Math.max(500, Math.round(delay));
}
