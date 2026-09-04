'use strict';

// Detecta um socket "zumbi" (a conexão fica pendurada sem o WhatsApp nunca
// mandar um close de verdade) — sonda com um sendPresenceUpdate real quando
// passa tempo demais sem nenhuma mensagem, e encerra o socket se a sonda
// falhar ou o WebSocket nem estiver mais aberto. Isso dispara o
// connection.update de close normal; quem já estiver ouvindo esse evento
// pra reconectar assume dali — a lib não recria o socket sozinha.

const DEFAULT_IDLE_THRESHOLD_MS = 600_000;
const DEFAULT_CHECK_INTERVAL_MS = 120_000;

export function setupConnectionWatchdog(sock, { idleThresholdMs = DEFAULT_IDLE_THRESHOLD_MS, checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS } = {}) {
    let lastActivity = Date.now();
    let checking = false;

    const onActivity = () => { lastActivity = Date.now(); };
    const onConnectionUpdate = ({ connection }) => {
        if (connection === 'open') onActivity();
    };
    sock.ev.on('messages.upsert', onActivity);
    sock.ev.on('connection.update', onConnectionUpdate);

    const timer = setInterval(async () => {
        if (checking) return;
        const idleMs = Date.now() - lastActivity;
        if (idleMs < idleThresholdMs) return;
        checking = true;
        try {
            if (!sock.ws?.isOpen) {
                sock.logger.warn(`[watchdog] WebSocket não está aberto depois de ${Math.floor(idleMs / 1000)}s sem atividade — encerrando pra forçar reconexão.`);
                sock.end(new Error('connection-watchdog: websocket não está aberto'));
                return;
            }
            await sock.sendPresenceUpdate('available');
            lastActivity = Date.now();
        } catch (e) {
            sock.logger.warn(`[watchdog] socket não respondeu à sonda de presença — encerrando pra forçar reconexão: ${e.message}`);
            sock.end(new Error('connection-watchdog: sonda de presença falhou'));
        } finally {
            checking = false;
        }
    }, checkIntervalMs);

    return () => {
        clearInterval(timer);
        sock.ev.off('messages.upsert', onActivity);
        sock.ev.off('connection.update', onConnectionUpdate);
    };
}
