import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { makeCommunitiesSocket } from './communities.js';
import { setupVoip } from './voip/index.js';
import { setupConnectionWatchdog } from './connection-watchdog.js';
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    if (config.shouldSyncHistoryMessage === undefined) {
        newConfig.shouldSyncHistoryMessage = () => !!newConfig.syncFullHistory;
    }
    const sock = makeCommunitiesSocket(newConfig);
    const pararVoip = setupVoip(sock);
    const pararWatchdog = setupConnectionWatchdog(sock);
    let jaParou = false;
    const pararUmaVez = () => {
        if (jaParou) {
            return;
        }
        jaParou = true;
        pararVoip();
        pararWatchdog();
    };
    sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'close') {
            pararUmaVez();
        }
    });
    const originalEnd = sock.end;
    sock.end = (error) => {
        pararUmaVez();
        return originalEnd(error);
    };
    return sock;
};
export default makeWASocket;
//# sourceMappingURL=index.js.map
