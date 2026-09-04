const fs = require("fs-extra");
const moment = require("moment-timezone");
const path = require("path");

const avisosPath = "./dados/avisos-automaticos/avisos.json";
const mediaDir = "./dados/avisos-automaticos/media";

// Inicializa
if (!fs.existsSync(mediaDir)) fs.mkdirsSync(mediaDir);
if (!fs.existsSync(avisosPath)) fs.writeFileSync(avisosPath, JSON.stringify([]));

let avisosData = JSON.parse(fs.readFileSync(avisosPath));

function saveAvisos() {
    fs.writeFileSync(avisosPath, JSON.stringify(avisosData, null, 2));
}

// Gerar ID numérico aleatório de 2 dígitos (10-99)
function _gerarIdAviso(existentes) {
    let id;
    do {
        id = String(Math.floor(Math.random() * 90) + 10);
    } while (existentes.includes(id));
    return id;
}

function reloadAvisos() {
    try {
        avisosData = JSON.parse(fs.readFileSync(avisosPath));
    } catch { }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ═══════════════════════════════════════════════
// CRUD de Avisos
// ═══════════════════════════════════════════════

function addAviso(from, alertData) {
    reloadAvisos();
    const group = avisosData.find((a) => a.groupId === from);
    if (group) {
        group.avisos.push(alertData);
    } else {
        avisosData.push({ groupId: from, avisos: [alertData] });
    }
    saveAvisos();
}

function rmAviso(from, id) {
    reloadAvisos();
    const gi = avisosData.findIndex((a) => a.groupId === from);
    if (gi === -1) return false;
    const ai = avisosData[gi].avisos.findIndex((a) => a.id === id);
    if (ai === -1) return false;
    const aviso = avisosData[gi].avisos[ai];
    if (aviso.mediaPath && fs.existsSync(aviso.mediaPath)) {
        try { fs.unlinkSync(aviso.mediaPath); } catch { }
    }
    avisosData[gi].avisos.splice(ai, 1);
    saveAvisos();
    return true;
}

function clearAvisos(from) {
    reloadAvisos();
    const gi = avisosData.findIndex((a) => a.groupId === from);
    if (gi === -1) return false;
    avisosData[gi].avisos.forEach((av) => {
        if (av.mediaPath && fs.existsSync(av.mediaPath)) {
            try { fs.unlinkSync(av.mediaPath); } catch { }
        }
    });
    avisosData[gi].avisos = [];
    saveAvisos();
    return true;
}

function getAvisos(from) {
    reloadAvisos();
    const g = avisosData.find((a) => a.groupId === from);
    return g ? g.avisos : [];
}

// ═══════════════════════════════════════════════
// Scheduler Independente (setInterval de 30s)
// ═══════════════════════════════════════════════

let _schedulerRunning = false;
let _lastCheckedMinute = "";

// ── Função auxiliar: verificar se a conexão está realmente ativa ──
function _isConnReady() {
    try {
        const conn = global.conn;
        if (!conn || !conn.sendMessage) return false;
        if (conn.ws && conn.ws.readyState !== undefined && conn.ws.readyState !== 1) return false;
        return true;
    } catch {
        return false;
    }
}

async function _checkAndSendAvisos() {
    if (_schedulerRunning) return; // Evita execução simultânea
    _schedulerRunning = true;

    try {
        // Usar global.conn DINÂMICO — sempre pega a conexão mais recente
        if (!_isConnReady()) {
            _schedulerRunning = false;
            return; // Silenciosamente pula — sem log de spam
        }

        const conn = global.conn;

        reloadAvisos();
        if (avisosData.length === 0) { _schedulerRunning = false; return; }

        const now = moment().tz("America/Sao_Paulo");
        const currentTime = now.format("HH:mm");
        const currentDate = now.format("DD/MM/YY");

        // Evita processar o mesmo minuto duas vezes
        if (_lastCheckedMinute === currentTime) { _schedulerRunning = false; return; }

        let changed = false;

        for (let i = 0; i < avisosData.length; i++) {
            const group = avisosData[i];

            for (let j = 0; j < group.avisos.length; j++) {
                const aviso = group.avisos[j];
                let deveEnviar = false;

                if (aviso.daily) {
                    // Diário: envia se o horário bate E não foi enviado hoje
                    if (aviso.time === currentTime && aviso.lastSent !== currentDate) {
                        deveEnviar = true;
                    }
                } else {
                    // Data fixa: envia se data + horário batem
                    if (aviso.date === currentDate && aviso.time === currentTime && !aviso.sent) {
                        deveEnviar = true;
                    }
                }

                if (!deveEnviar) continue;

                // ═══ RE-VERIFICAR CONEXÃO ANTES DE CADA ENVIO ═══
                if (!_isConnReady()) {
                    console.log("[AVISO AUTO] Conexão perdida durante envio, abortando...");
                    _schedulerRunning = false;
                    return;
                }

                try {
                    // Busca metadados do grupo para mencionar todos
                    const groupMeta = await conn.groupMetadata(group.groupId).catch(() => null);
                    if (!groupMeta) continue;

                    const participants = groupMeta.participants.map((p) => p.id);

                    // Envia apenas o texto do admin, limpo
                    const mentionTxt = aviso.text;

                    // Envia mídia ou texto
                    if (aviso.mediaPath && fs.existsSync(aviso.mediaPath)) {
                        const buffer = fs.readFileSync(aviso.mediaPath);
                        const ext = path.extname(aviso.mediaPath).toLowerCase();

                        if ([".jpg", ".jpeg", ".png"].includes(ext)) {
                            await conn.sendMessage(group.groupId, {
                                image: buffer,
                                caption: mentionTxt,
                                mentions: participants,
                            });
                        } else if ([".mp4", ".gif"].includes(ext)) {
                            await conn.sendMessage(group.groupId, {
                                video: buffer,
                                caption: mentionTxt,
                                mentions: participants,
                            });
                        } else if ([".mp3", ".ogg", ".m4a"].includes(ext)) {
                            await conn.sendMessage(group.groupId, {
                                text: mentionTxt,
                                mentions: participants,
                            });
                            await sleep(1000);
                            await conn.sendMessage(group.groupId, {
                                audio: buffer,
                                mimetype: ext === ".mp3" ? "audio/mpeg" : "audio/ogg; codecs=opus",
                                ptt: ext === ".ogg",
                            });
                        }
                    } else {
                        await conn.sendMessage(group.groupId, {
                            text: mentionTxt,
                            mentions: participants,
                        });
                    }

                    // Marca como enviado
                    if (aviso.daily) {
                        aviso.lastSent = currentDate;
                    } else {
                        // Remove mídia e o aviso
                        if (aviso.mediaPath && fs.existsSync(aviso.mediaPath)) {
                            try { fs.unlinkSync(aviso.mediaPath); } catch { }
                        }
                        group.avisos.splice(j, 1);
                        j--;
                    }
                    changed = true;
                    await sleep(2000);

                } catch (e) {
                    console.error("[AVISO AUTO] Erro ao enviar:", e.message || e);
                }
            }
        }

        if (changed) {
            try { saveAvisos(); } catch (e) {
                console.error("[AVISO AUTO] Erro ao salvar:", e.message);
            }
        }
        _lastCheckedMinute = currentTime;

    } catch (e) {
        console.error("[AVISO AUTO] Erro geral:", e.message || e);
    }

    _schedulerRunning = false;
}

/**
 * Inicia o scheduler independente com setInterval
 * Deve ser chamado UMA VEZ no iniciar.js quando conn === "open"
 * Usa global.conn dinâmico — não precisa de parâmetro
 */
function initAvisosScheduler() {

    // Verifica a cada 30 segundos
    setInterval(() => {
        _checkAndSendAvisos().catch(e => console.error("[AVISO AUTO] Erro no scheduler:", e.message));
    }, 30000);

    // Primeira verificação imediata
    setTimeout(() => _checkAndSendAvisos().catch(e => console.error("[AVISO AUTO] Erro na primeira verificação:", e.message)), 5000);
}

module.exports = {
    addAviso,
    rmAviso,
    clearAvisos,
    getAvisos,
    initAvisosScheduler,
    _gerarIdAviso,
};
