'use strict';

// Log de chamada por cima do logger padrão do socket (pino) — sem arquivo
// separado.

export function makeCallLog(sock) {
    return (...args) => sock.logger.info(args.map((a) => (typeof a === 'string' ? a : String((a && a.stack) || a))).join(' '));
}
