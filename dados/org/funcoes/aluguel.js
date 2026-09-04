/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║          SISTEMA DE ALUGUEL DE GRUPOS — BronxysBot        ║
 * ║        Módulo completo e profissional de contratos        ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

const ARQUIVO = path.resolve("./dados/org/json/rg_aluguel.json");

// ─── FUNÇÕES DE LEITURA / ESCRITA ─────────────────────────────

function getAluguel() {
    try {
        return JSON.parse(fs.readFileSync(ARQUIVO, "utf-8"));
    } catch {
        return [];
    }
}

function setAluguel(data) {
    fs.writeFileSync(ARQUIVO, JSON.stringify(data, null, 2));
}

function getAluguelByGrupo(groupId) {
    const lista = getAluguel();
    return lista.find(i => i.id_gp === groupId) || null;
}

function getAluguelByLink(link) {
    const lista = getAluguel();
    // Extrair código do link
    const code = link.split("chat.whatsapp.com/").pop()?.trim();
    if (!code) return null;
    return lista.find(i => (i.link || "").includes(code)) || null;
}

// ─── ADICIONAR CONTRATO ────────────────────────────────────────

function adicionarContrato({
    id_gp, nome_, link,
    responsavel_nome, responsavel_contato,
    plano_dias, valor, cadastrado_por
}) {
    const lista = getAluguel();

    // Verificar se já existe
    const idx = lista.findIndex(i => i.id_gp === id_gp);
    const agora = moment().tz("America/Sao_Paulo");
    const vencIso = agora.clone().add(plano_dias, "days").toISOString();
    const vencTs = Math.floor(agora.clone().add(plano_dias, "days").valueOf() / 1000);

    const contrato = {
        id_gp,
        nome_: nome_ || "Grupo Sem Nome",
        link: link || "",
        responsavel_nome: responsavel_nome || "Não informado",
        responsavel_contato: responsavel_contato || "Não informado",
        data_aluguel: agora.toISOString(),
        vencimento: vencTs,
        vencimento_iso: vencIso,
        plano_dias: Number(plano_dias),
        valor: valor || "Não informado",
        aviso_3d_enviado: false,
        aviso_1d_enviado: false,
        cadastrado_por: cadastrado_por || "Dono",
    };

    if (idx >= 0) {
        lista[idx] = contrato;
    } else {
        lista.push(contrato);
    }

    setAluguel(lista);
    return contrato;
}

// ─── RENOVAR CONTRATO ─────────────────────────────────────────

function renovarContrato(id_gp, dias_extras) {
    const lista = getAluguel();
    const idx = lista.findIndex(i => i.id_gp === id_gp);
    if (idx < 0) return false;

    const contrato = lista[idx];
    const agora = Math.floor(Date.now() / 1000);
    // Se já venceu, conta a partir de agora; se ainda ativo, adiciona sobre o vencimento atual
    const base = contrato.vencimento > agora ? contrato.vencimento : agora;
    const novoVenc = base + (dias_extras * 86400);
    const novoIso = moment.unix(novoVenc).tz("America/Sao_Paulo").toISOString();

    contrato.vencimento = novoVenc;
    contrato.vencimento_iso = novoIso;
    contrato.plano_dias += Number(dias_extras);
    contrato.aviso_3d_enviado = false;
    contrato.aviso_1d_enviado = false;

    lista[idx] = contrato;
    setAluguel(lista);
    return contrato;
}

// ─── REMOVER CONTRATO (busca por ID, link ou nome) ────────────

function removerContrato(busca) {
    const lista = getAluguel();
    let idx = -1;

    // 1. Buscar por id_gp exato
    if (busca) {
        idx = lista.findIndex(i => i.id_gp && i.id_gp === busca);
    }

    // 2. Fallback: buscar por link (código do convite)
    if (idx < 0 && busca && busca.includes("chat.whatsapp.com")) {
        const code = busca.split("chat.whatsapp.com/").pop()?.split("?")[0]?.trim();
        if (code) {
            idx = lista.findIndex(i => i.link && i.link.includes(code));
        }
    }

    // 3. Fallback: buscar por nome do grupo (case insensitive)
    if (idx < 0 && busca && !busca.endsWith("@g.us")) {
        const buscaNorm = busca.toLowerCase().trim();
        idx = lista.findIndex(i => i.nome_ && i.nome_.toLowerCase().trim() === buscaNorm);
    }

    if (idx < 0) return false;
    const removido = lista[idx];
    lista.splice(idx, 1);
    setAluguel(lista);
    return removido;
}

// ─── FORMATAÇÃO PROFISSIONAL ──────────────────────────────────

function formatarContrato(c, showFull = true) {
    const agora = Math.floor(Date.now() / 1000);
    const restante = c.vencimento - agora;
    const diasRest = Math.floor(restante / 86400);
    const horasRest = Math.floor((restante % 86400) / 3600);

    let statusEmoji, statusTxt;
    if (restante < 0) {
        statusEmoji = "🔴";
        statusTxt = "VENCIDO";
    } else if (diasRest <= 3) {
        statusEmoji = "🟡";
        statusTxt = `VENCENDO em ${diasRest}d ${horasRest}h`;
    } else {
        statusEmoji = "🟢";
        statusTxt = `ATIVO — ${diasRest}d restantes`;
    }

    const dataAluguel = moment(c.data_aluguel).tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm");
    const dataVenc = moment.unix(c.vencimento).tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm");

    if (!showFull) {
        return `│  ${statusEmoji} *${c.nome_}* — ${statusTxt}\n│  📅 Vence: ${dataVenc} │ 👤 ${c.responsavel_nome}`;
    }

    return `│  📋 *CONTRATO DE ALUGUEL*
├──────────────
│
│  ${statusEmoji} *Status:* ${statusTxt}
│
│  🏘️ *Grupo:* ${c.nome_}
│  🔗 *Link:* ${c.link || "Não informado"}
│  🆔 *ID:* ${c.id_gp}
│
│  👤 *Responsável:* ${c.responsavel_nome}
│  📞 *Contato:* wa.me/${c.responsavel_contato}
│
│  📅 Alugado em: ${dataAluguel}
│  ⏳ Vence em: ${dataVenc}
│  📆 Plano: ${c.plano_dias} dia(s)
│  💰 Valor: ${c.valor}
│
│  🔧 _Cadastrado por:_ ${c.cadastrado_por}`;
}

// ─── SCHEDULER DE VERIFICAÇÃO ─────────────────────────────────

function initAluguelScheduler(_ignoredConn, numerodono_ofc) {
    console.log("[ALUGUEL] Sistema de contratos iniciado ✅");

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

    async function verificar() {
        // Usar global.conn DINÂMICO — sempre pega a conexão mais recente
        if (!_isConnReady()) return; // Silenciosamente pula — sem log de spam
        const conn = global.conn;

        const lista = getAluguel();
        const agora = Math.floor(Date.now() / 1000);
        let alterou = false;
        const donoJid = numerodono_ofc + "@s.whatsapp.net";

        for (let i = 0; i < lista.length; i++) {
            const c = lista[i];
            const restante = c.vencimento - agora;
            const dias3 = 3 * 86400;
            const dias1 = 86400;

            try {
                // ── Aviso 3 dias antes ──────────────────────────────────
                if (!c.aviso_3d_enviado && restante > 0 && restante <= dias3) {
                    c.aviso_3d_enviado = true;
                    alterou = true;
                    const dataVenc = moment.unix(c.vencimento).tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm");
                    try {
                        await conn.sendMessage(donoJid, {
                            text: `│\n│  ⚠️ *VENCIMENTO EM 3 DIAS*\n├──────────────\n│\n│  🏘️ *${c.nome_}*\n│  ⏳ Vence: *${dataVenc}*\n│  👤 ${c.responsavel_nome}\n│  📞 wa.me/${c.responsavel_contato}\n│  💰 Valor: ${c.valor}\n│\n├──────────────\n│  💡 *!renovaraluguel* (no grupo)\n│  💡 *!renovaraluguel ${c.nome_}* (PV)`
                        });
                    } catch (e) {
                        console.error("[ALUGUEL] Erro ao enviar aviso 3d:", e.message);
                    }
                }

                // ── Aviso 1 dia antes ───────────────────────────────────
                if (!c.aviso_1d_enviado && restante > 0 && restante <= dias1) {
                    c.aviso_1d_enviado = true;
                    alterou = true;
                    const dataVenc = moment.unix(c.vencimento).tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm");
                    try {
                        await conn.sendMessage(donoJid, {
                            text: `│\n│  🚨 *ALERTA: VENCE AMANHÃ!*\n├──────────────\n│\n│  🏘️ *${c.nome_}*\n│  ⏳ Vence: *${dataVenc}*\n│  👤 ${c.responsavel_nome}\n│  📞 wa.me/${c.responsavel_contato}\n│  💰 Valor: ${c.valor}\n│\n├──────────────\n│  ❗ *!renovaraluguel* (no grupo)\n│  ❗ *!renovaraluguel ${c.nome_}* (PV)`
                        });
                    } catch (e) {
                        console.error("[ALUGUEL] Erro ao enviar aviso 1d:", e.message);
                    }
                }

                // ── Venceu ──────────────────────────────────────────────
                if (restante <= 0) {
                    const dataAluguel = moment(c.data_aluguel).tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm");
                    const dataVenc = moment.unix(c.vencimento).tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm");

                    // Avisa o dono
                    try {
                        await conn.sendMessage(donoJid, {
                            text: `│\n│  🔴 *ALUGUEL ENCERRADO*\n├──────────────\n│\n│  🏘️ *${c.nome_}*\n│  🔗 ${c.link || "Sem link"}\n│  👤 ${c.responsavel_nome}\n│  📞 wa.me/${c.responsavel_contato}\n│\n│  📅 Alugado: ${dataAluguel}\n│  ⏳ Venceu: ${dataVenc}\n│  💰 Valor: ${c.valor}\n│\n├──────────────\n│  🚪 _Bot saiu do grupo._`
                        });
                    } catch (e) {
                        console.error("[ALUGUEL] Erro ao notificar dono:", e.message);
                    }

                    // Avisa o grupo antes de sair
                    try {
                        await conn.sendMessage(c.id_gp, {
                            text: `│\n│  ⏰ *ALUGUEL ENCERRADO*\n├──────────────\n│\n│  O bot irá sair agora.\n│  Para continuar usando:\n│  📞 wa.me/${c.responsavel_contato}`
                        });
                    } catch { }

                    // Sai do grupo
                    try {
                        await conn.groupLeave(c.id_gp);
                        console.log(`[ALUGUEL] Bot saiu do grupo: ${c.nome_} (${c.id_gp})`);
                    } catch (e) {
                        console.error("[ALUGUEL] Erro ao sair do grupo:", e.message);
                    }

                    // Remove do JSON
                    lista.splice(i, 1);
                    i--;
                    alterou = true;
                }
            } catch (itemErr) {
                console.error("[ALUGUEL] Erro ao processar contrato:", itemErr.message);
            }
        }

        if (alterou) {
            try { setAluguel(lista); } catch (e) {
                console.error("[ALUGUEL] Erro ao salvar:", e.message);
            }
        }
    }

    // Primeira verificação imediata
    verificar().catch(e => console.error("[ALUGUEL] Erro na primeira verificação:", e.message));

    // Verificar a cada hora
    setInterval(() => verificar().catch(e => console.error("[ALUGUEL] Erro no scheduler:", e.message)), 3600 * 1000);
}

// ── ZERAR TODOS OS CONTRATOS ──────────────────────────────
function zerarAluguel() {
    setAluguel([]);
}

module.exports = {
    getAluguel,
    setAluguel,
    getAluguelByGrupo,
    getAluguelByLink,
    adicionarContrato,
    renovarContrato,
    removerContrato,
    formatarContrato,
    initAluguelScheduler,
    zerarAluguel,
};
