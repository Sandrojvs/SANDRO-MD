const fs = require("fs");
const moment = require("moment-timezone");
const path = require("path");

const HORARIOS_PATH = path.join(__dirname, "../json/horarios_grupo.json");

// ── Imagens aleatórias ──
const IMGS_ABRIR = [
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=90",
    "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=90",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=90",
    "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=800&q=90",
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=90",
];
const IMGS_FECHAR = [
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=90",
    "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&q=90",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=90",
    "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=90",
    "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=90",
];
function _randImg(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Gerar ID aleatório numérico de 2 dígitos (10-99) ──
function _gerarId(existentes) {
    let id;
    do {
        id = String(Math.floor(Math.random() * 90) + 10);
    } while (existentes.includes(id));
    return id;
}

// ── Leitura e escrita ──
function getHorarios() {
    try {
        return JSON.parse(fs.readFileSync(HORARIOS_PATH, "utf-8"));
    } catch {
        return [];
    }
}

function setHorarios(data) {
    fs.writeFileSync(HORARIOS_PATH, JSON.stringify(data, null, 2));
}

// ── Buscar ou criar registro do grupo ──
function getGrupo(grupoId) {
    const lista = getHorarios();
    let gp = lista.find(g => g.grupoId === grupoId);
    if (!gp) {
        gp = { grupoId, horarios: [] };
        lista.push(gp);
        setHorarios(lista);
    }
    return gp;
}

// ── Adicionar horário ──
function addHorario(grupoId, tipo, modo, valor, adm) {
    const lista = getHorarios();
    let gp = lista.find(g => g.grupoId === grupoId);
    if (!gp) {
        gp = { grupoId, horarios: [] };
        lista.push(gp);
    }
    const idsExistentes = gp.horarios.map(h => h.id);
    const id = _gerarId(idsExistentes);
    gp.horarios.push({ id, tipo, modo, valor, adm, criadoEm: new Date().toISOString() });
    setHorarios(lista);
    return id;
}

// ── Remover horário por ID ──
function removeHorario(grupoId, horarioId) {
    const lista = getHorarios();
    const gp = lista.find(g => g.grupoId === grupoId);
    if (!gp) return false;
    const idx = gp.horarios.findIndex(h => h.id === horarioId);
    if (idx < 0) return false;
    gp.horarios.splice(idx, 1);
    setHorarios(lista);
    return true;
}

// ── Listar horários de um grupo ──
function listarHorarios(grupoId) {
    const lista = getHorarios();
    const gp = lista.find(g => g.grupoId === grupoId);
    return gp ? gp.horarios : [];
}

// ── Zerar horários (todos os grupos) ──
function zerarTodosHorarios() {
    setHorarios([]);
}

// ── Zerar horários de um grupo ──
function zerarHorariosGrupo(grupoId) {
    const lista = getHorarios();
    const idx = lista.findIndex(g => g.grupoId === grupoId);
    if (idx >= 0) {
        lista[idx].horarios = [];
        setHorarios(lista);
    }
}

// ── Função auxiliar: verificar se a conexão está realmente ativa ──
function _isConnReady() {
    try {
        const conn = global.conn;
        if (!conn || !conn.sendMessage) return false;
        // Verificar se o WebSocket está aberto (readyState 1 = OPEN)
        if (conn.ws && conn.ws.readyState !== undefined && conn.ws.readyState !== 1) return false;
        return true;
    } catch {
        return false;
    }
}

// ── SCHEDULER (usa global.conn dinâmico para sobreviver a reconexões) ──
function initHorariosScheduler() {
    console.log("[HORÁRIOS] Sistema de abertura/fechamento automático iniciado ✅");

    async function verificar() {
        // Usar global.conn DINÂMICO — sempre pega a conexão mais recente
        if (!_isConnReady()) {
            return; // Silenciosamente pula — sem log de spam
        }

        let lista;
        try {
            lista = getHorarios();
        } catch (e) {
            console.error("[HORÁRIOS] Erro ao ler horários:", e.message);
            return;
        }
        if (!lista || lista.length === 0) return;

        const agora = moment.tz("America/Sao_Paulo");
        const horaAtual = agora.format("HH:mm");
        const dataAtual = agora.format("DD/MM/YYYY");
        let alterou = false;

        for (const gp of lista) {
            const remover = [];

            for (const h of gp.horarios) {
                let executar = false;

                try {
                    if (h.modo === "diario") {
                        if (h.valor === horaAtual && h._ultimaExec !== dataAtual) {
                            executar = true;
                            h._ultimaExec = dataAtual;
                            alterou = true;
                        }
                    } else if (h.modo === "data") {
                        const [dataParte, horaParte] = h.valor.split(" ");
                        if (dataParte === dataAtual && horaParte === horaAtual) {
                            executar = true;
                            remover.push(h.id);
                            alterou = true;
                        }
                    }
                } catch (parseErr) {
                    console.error(`[HORÁRIOS] Erro ao parsear horário ${h.id}:`, parseErr.message);
                    continue;
                }

                if (executar) {
                    // ═══ RE-VERIFICAR CONEXÃO ANTES DE CADA AÇÃO ═══
                    if (!_isConnReady()) {
                        console.log("[HORÁRIOS] Conexão perdida durante verificação, abortando...");
                        return; // Abortar o restante — será tentado no próximo ciclo
                    }

                    const conn = global.conn;
                    const admNum = h.adm ? h.adm.split("@")[0] : "???";
                    try {
                        if (h.tipo === "fechar") {
                            try {
                                await conn.groupSettingUpdate(gp.grupoId, "announcement");
                            } catch (e) {
                                console.error(`[HORÁRIOS] Erro ao fechar grupo ${gp.grupoId}:`, e.message);
                                // NÃO propagar — continua para tentar enviar mensagem
                            }
                            const _msgsFechamento = [
                                "🚪 Grupo fechado! Até breve, galera!",
                                "🔒 Chat pausado! Nos vemos em breve.",
                                "⏸️ Grupo encerrado por agora. Até já!",
                                "🚫 Fechou! Descansem e voltem logo.",
                                "🔐 Grupo trancado! Voltamos em breve.",
                                "📦 Grupo pausado. Até a próxima!"
                            ];
                            const _msgFc = _msgsFechamento[Math.floor(Math.random() * _msgsFechamento.length)];
                            const _fcTxt = `│\n│  🔒 *GRUPO FECHADO*\n├──────────────\n│\n│  ⏰ Fechamento automático\n│  🕐 Horário: *${horaAtual}*\n│  📅 ${dataAtual}\n│  👤 ADM: @${admNum}\n│\n├──────────────\n│  _${_msgFc}_`;

                            // Buscar foto do grupo
                            let _ppFc = null;
                            try { _ppFc = await conn.profilePictureUrl(gp.grupoId, "image"); } catch { }

                            try {
                                if (_ppFc) {
                                    await conn.sendMessage(gp.grupoId, {
                                        image: { url: _ppFc },
                                        caption: _fcTxt,
                                        mentions: [h.adm]
                                    });
                                } else {
                                    await conn.sendMessage(gp.grupoId, {
                                        text: _fcTxt,
                                        mentions: [h.adm]
                                    });
                                }
                            } catch {
                                try {
                                    await conn.sendMessage(gp.grupoId, {
                                        text: _fcTxt,
                                        mentions: [h.adm]
                                    });
                                } catch (e2) {
                                    console.error(`[HORÁRIOS] Erro ao enviar msg fechamento ${gp.grupoId}:`, e2.message);
                                }
                            }
                        } else {
                            try {
                                await conn.groupSettingUpdate(gp.grupoId, "not_announcement");
                            } catch (e) {
                                console.error(`[HORÁRIOS] Erro ao abrir grupo ${gp.grupoId}:`, e.message);
                                // NÃO propagar — continua para tentar enviar mensagem
                            }
                            const _abTxt = `│\n│  🔓 *GRUPO ABERTO!*\n├──────────────\n│\n│  ⏰ Abertura automática\n│  🕐 Horário: *${horaAtual}*\n│  📅 ${dataAtual}\n│  👤 ADM: @${admNum}\n│\n│  📢 *@todos*\n│  O grupo está aberto!\n├──────────────\n│  _Bom papo a todos!_ 💬`;

                            // Buscar foto do grupo
                            let _ppAb = null;
                            try { _ppAb = await conn.profilePictureUrl(gp.grupoId, "image"); } catch { }

                            try {
                                if (_ppAb) {
                                    await conn.sendMessage(gp.grupoId, {
                                        image: { url: _ppAb },
                                        caption: _abTxt,
                                        mentions: [h.adm]
                                    });
                                } else {
                                    await conn.sendMessage(gp.grupoId, {
                                        text: _abTxt,
                                        mentions: [h.adm]
                                    });
                                }
                            } catch {
                                try {
                                    await conn.sendMessage(gp.grupoId, {
                                        text: _abTxt,
                                        mentions: [h.adm]
                                    });
                                } catch (e2) {
                                    console.error(`[HORÁRIOS] Erro ao enviar msg abertura ${gp.grupoId}:`, e2.message);
                                }
                            }
                        }
                    } catch (e) {
                        console.error(`[HORÁRIOS] Erro geral ao ${h.tipo} grupo ${gp.grupoId}:`, e.message);
                    }
                }
            }

            // Remover horários de data específica já executados
            for (const rid of remover) {
                const idx = gp.horarios.findIndex(x => x.id === rid);
                if (idx >= 0) gp.horarios.splice(idx, 1);
                alterou = true;
            }
        }

        if (alterou) {
            try { setHorarios(lista); } catch (e) {
                console.error("[HORÁRIOS] Erro ao salvar:", e.message);
            }
        }
    }

    // Verificar a cada 30 segundos (mais responsivo que 60s)
    setInterval(() => verificar().catch(e => console.error("[HORÁRIOS] Erro no scheduler:", e.message)), 30 * 1000);

    // Primeira verificação após 5 segundos
    setTimeout(() => verificar().catch(e => console.error("[HORÁRIOS] Erro na primeira verificação:", e.message)), 5000);
}

module.exports = {
    getHorarios,
    setHorarios,
    getGrupo,
    addHorario,
    removeHorario,
    listarHorarios,
    zerarTodosHorarios,
    zerarHorariosGrupo,
    initHorariosScheduler
};
