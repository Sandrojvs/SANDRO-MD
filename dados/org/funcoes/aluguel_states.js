/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║     STATE MACHINE — CONTRATO DE ALUGUEL POR ETAPAS      ║
 * ║      Fluxo de perguntas no privado do dono do bot       ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const fs = require("fs");
const path = require("path");

const STATES_PATH = path.resolve("./dados/org/json/aluguel_states.json");
const ALUGUEL_TIMEOUT = 10 * 60 * 1000; // 10 minutos

// ── Load / Save ────────────────────────────────────────────

function loadAluguelStates() {
    try {
        return JSON.parse(fs.readFileSync(STATES_PATH, "utf-8"));
    } catch {
        return {};
    }
}

function saveAluguelStates(data) {
    fs.writeFileSync(STATES_PATH, JSON.stringify(data, null, 2));
}

// ── State get / set / clear ────────────────────────────────

function getAluguelState(sender) {
    const states = loadAluguelStates();
    const state = states[sender];
    if (!state) return null;
    if (Date.now() - state.lastActivity > ALUGUEL_TIMEOUT) {
        clearAluguelState(sender);
        return null;
    }
    return state;
}

function setAluguelState(sender, step, data = {}) {
    const states = loadAluguelStates();
    states[sender] = {
        step,
        data,
        lastActivity: Date.now(),
    };
    saveAluguelStates(states);
}

function clearAluguelState(sender) {
    const states = loadAluguelStates();
    delete states[sender];
    saveAluguelStates(states);
}

// ── Steps e Prompts ────────────────────────────────────────

const ALUGUEL_STEPS = [
    "nome_grupo",
    "link_grupo",
    "responsavel_nome",
    "responsavel_contato",
    "dias",
    "valor",
    "confirmar",
];

const ALUGUEL_PROMPTS = {
    nome_grupo: (data) => ({
        msg: `│\n│  📋 *CONTRATO DE ALUGUEL*  •  1/6\n│  ▓▓░░░░░░░░ _17%_\n├──────────────\n│\n│  🏘️ Qual é o *nome do grupo*?\n│${data.nome_auto ? `\n│  ✅ Detectei: ⚠️ *${data.nome_auto}*\n│\n│  → Envie *ok* para confirmar\n│  → Ou digite outro nome` : `\n│  📌 _Digite o nome exato_\n│  _que aparece no grupo._\n│\n│  💡 _Ex: Fãs de Anime BR_\n│  💡 _Ex: Turma do Zap_`}\n│\n│  ⏰ _Timeout: 5 minutos_\n├──────────────\n│  💡 _Envie *cancelar* a qualquer_\n│  _momento para desistir._`,
        image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=90"
    }),

    link_grupo: (data) => ({
        msg: `│\n│  📋 *CONTRATO DE ALUGUEL*  •  2/6\n│  ▓▓▓░░░░░░░ _33%_\n├──────────────\n│\n│  🔗 Qual é o *link do grupo*?\n│${data.link_auto ? `\n│  ✅ Detectei:\n│  ${data.link_auto}\n│\n│  → Envie *ok* para confirmar\n│  → Cole outro link\n│  → Ou envie *pular*` : data.link_falhou ? `\n│  ⚠️ *Não sou ADM* deste grupo,\n│  por isso não consegui pegar o\n│  link automaticamente.\n│\n│  📌 _Cole o link de convite_\n│  _Ex: https://chat.whatsapp.com/..._\n│  💡 _Ou envie *pular* se não_\n│  _possuir o link no momento._` : `\n│  📌 _Cole o link de convite_\n│  _do grupo. Começa com:_\n│  _https://chat.whatsapp.com/..._\n│\n│  💡 _Envie *pular* se não tiver_`}\n│\n│  ━━ 📝 Coletado ━━\n│  🏘️ ${data.nome_grupo || "—"}\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=90"
    }),

    responsavel_nome: (data) => ({
        msg: `│\n│  📋 *CONTRATO DE ALUGUEL*  •  3/6\n│  ▓▓▓▓▓░░░░░ _50%_\n├──────────────\n│\n│  👤 Qual o *nome completo* do\n│  responsável pelo aluguel?\n│\n│  📌 _Quem está contratando_\n│  _o serviço para o grupo._\n│\n│  💡 _Ex: João Silva_\n│  💡 _Ex: Maria Santos_\n│\n│  ━━ 📝 Coletado ━━\n│  🏘️ ${data.nome_grupo || "—"}\n│  🔗 ${data.link_grupo ? "✅ Link definido" : "❌ Sem link"}\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=90"
    }),

    responsavel_contato: (data) => ({
        msg: `│\n│  📋 *CONTRATO DE ALUGUEL*  •  4/6\n│  ▓▓▓▓▓▓▓░░░ _67%_\n├──────────────\n│\n│  📞 Número de *WhatsApp* do\n│  responsável *${data.responsavel_nome}*?\n│\n│  📌 _Formato:_\n│  → DDI + DDD + Número\n│  → Apenas números\n│\n│  💡 _Ex: 5511999999999_\n│  💡 _Ex: 5581998001234_\n│\n│  ━━ 📝 Coletado ━━\n│  🏘️ ${data.nome_grupo || "—"}\n│  👤 ${data.responsavel_nome || "—"}\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=800&q=90"
    }),

    dias: (data) => ({
        msg: `│\n│  📋 *CONTRATO DE ALUGUEL*  •  5/6\n│  ▓▓▓▓▓▓▓▓░░ _83%_\n├──────────────\n│\n│  📆 Por quantos *dias* será\n│  o contrato de aluguel?\n│\n│  ╭────────────────╮\n│  │ *7*  ─ 📅 Semanal    │\n│  │ *15* ─ 📅 Quinzenal  │\n│  │ *30* ─ 📅 Mensal     │\n│  │ *60* ─ 📅 Bimestral  │\n│  │ *90* ─ 📅 Trimestral │\n│  ╰────────────────╯\n│\n│  📌 _Ou digite qualquer número_\n│  _de dias personalizado._\n│\n│  ━━ 📝 Resumo ━━\n│  🏘️ *${data.nome_grupo}*\n│  👤 ${data.responsavel_nome}\n│  📞 ${data.responsavel_contato}\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=90"
    }),

    valor: (data) => ({
        msg: `│\n│  📋 *CONTRATO DE ALUGUEL*  •  6/6\n│  ▓▓▓▓▓▓▓▓▓▓ _100%_\n├──────────────\n│\n│  💰 Qual o *valor cobrado*\n│  por este aluguel?\n│\n│  📌 _Informe o valor total_\n│  _do período contratado._\n│\n│  💡 _Ex: 50_\n│  💡 _Ex: R$ 120,00_\n│  💡 _Ex: 200/mês_\n│  💡 _Envie *pular* se gratuito_\n│\n│  ━━ 📝 Resumo ━━\n│  🏘️ *${data.nome_grupo}*\n│  👤 ${data.responsavel_nome}\n│  📆 ${data.dias} dia(s)\n│\n│  ✨ _Última etapa!_\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=90"
    }),

    confirmar: (data) => ({
        msg: `│\n│  📝 *CONFIRMAR CONTRATO*\n├──────────────\n│\n│  📄 *DADOS DO GRUPO*\n│  🏘️ Nome: *${data.nome_grupo}*\n│  🔗 Link: ${data.link_grupo || "Não informado"}\n│  🆔 ID: ${data.id_gp || "Não informado"}\n│\n│  👤 *RESPONSÁVEL*\n│  📛 Nome: *${data.responsavel_nome}*\n│  📞 Contato: wa.me/${data.responsavel_contato}\n│\n│  📊 *PLANO*\n│  📆 Duração: *${data.dias} dia(s)*\n│  💰 Valor: *${data.valor}*\n│\n│  ╭─────────────╮\n│  │ ✅ *sim* ─ confirmar  │\n│  │ ❌ *não* ─ cancelar   │\n│  ╰─────────────╯\n│\n│  📌 _Ao confirmar, o contrato_\n│  _será registrado e ativado._`,
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=90"
    }),
};

// ── Helper: extrair msg e image do prompt ──────────────────
function _getPrompt(stepName, data) {
    const promptFn = ALUGUEL_PROMPTS[stepName];
    const result = typeof promptFn === "function" ? promptFn(data) : promptFn;
    // Se o prompt retorna um objeto { msg, image }, extrair
    if (result && typeof result === "object" && result.msg) {
        return { msg: result.msg, image: result.image || null };
    }
    // Fallback: string pura
    return { msg: result, image: null };
}

// ── Iniciar fluxo ──────────────────────────────────────────

function startAluguelFlow(sender, initialData = {}) {
    const firstStep = ALUGUEL_STEPS[0];
    setAluguelState(sender, firstStep, initialData);
    return _getPrompt(firstStep, initialData);
}

// ── Processar resposta ─────────────────────────────────────

function processarRespostaAluguel(sender, resposta) {
    const state = getAluguelState(sender);
    if (!state) return { error: true, msg: "⏰ O tempo do contrato expirou. Use *!alugarbot* novamente." };

    const { step, data } = state;
    const resp = resposta.trim();
    const respLower = resp.toLowerCase();

    // ── Cancelamento global ──
    if (respLower === "cancelar" || respLower === "cancel") {
        clearAluguelState(sender);
        return { done: false, cancelled: true, msg: "❌ Contrato cancelado com sucesso.\n\n💡 Use *!alugarbot* para iniciar um novo." };
    }

    switch (step) {
        case "nome_grupo": {
            if (respLower === "ok" && data.nome_auto) {
                data.nome_grupo = data.nome_auto;
            } else if (resp.length < 2) {
                return { error: true, msg: "⚠️ Nome muito curto. Informe um nome válido para o grupo." };
            } else {
                data.nome_grupo = resp;
            }
            // Se já tem link auto-detectado, pular etapa do link
            if (data.link_auto) {
                data.link_grupo = data.link_auto;
                const nextStep = "responsavel_nome";
                setAluguelState(sender, nextStep, data);
                const prompt = _getPrompt(nextStep, data);
                return { done: false, msg: prompt.msg, image: prompt.image };
            }
            const nextStep = "link_grupo";
            setAluguelState(sender, nextStep, data);
            const prompt = _getPrompt(nextStep, data);
            return { done: false, msg: prompt.msg, image: prompt.image };
        }

        case "link_grupo": {
            if (respLower === "pular" || respLower === "skip" || respLower === "nao" || respLower === "não") {
                data.link_grupo = "";
            } else if (respLower === "ok" && data.link_auto) {
                data.link_grupo = data.link_auto;
            } else if (resp.includes("chat.whatsapp.com") || resp.includes("http")) {
                data.link_grupo = resp;
            } else {
                return { error: true, msg: "⚠️ Isso não parece um link válido.\n\n💡 Cole o link do grupo (começa com https://chat.whatsapp.com/...)\n💡 Ou envie *pular*" };
            }
            const nextStep = "responsavel_nome";
            setAluguelState(sender, nextStep, data);
            const prompt = _getPrompt(nextStep, data);
            return { done: false, msg: prompt.msg, image: prompt.image };
        }

        case "responsavel_nome": {
            if (resp.length < 2) return { error: true, msg: "⚠️ Nome muito curto. Informe o nome completo do responsável.\n💡 Ex: João Silva" };
            data.responsavel_nome = resp;
            const nextStep = "responsavel_contato";
            setAluguelState(sender, nextStep, data);
            const prompt = _getPrompt(nextStep, data);
            return { done: false, msg: prompt.msg, image: prompt.image };
        }

        case "responsavel_contato": {
            const numero = resp.replace(/\D/g, "");
            if (numero.length < 8) return { error: true, msg: "⚠️ Número inválido. Envie com DDD + número.\n💡 Ex: 5511999999999" };
            data.responsavel_contato = numero;
            const nextStep = "dias";
            setAluguelState(sender, nextStep, data);
            const prompt = _getPrompt(nextStep, data);
            return { done: false, msg: prompt.msg, image: prompt.image };
        }

        case "dias": {
            const dias = parseInt(resp);
            if (isNaN(dias) || dias < 1 || dias > 365) {
                return { error: true, msg: "⚠️ Informe um número de dias válido (1 a 365).\n\n💡 Planos sugeridos: *7*, *15*, *30* ou *90* dias" };
            }
            data.dias = dias;
            const nextStep = "valor";
            setAluguelState(sender, nextStep, data);
            const prompt = _getPrompt(nextStep, data);
            return { done: false, msg: prompt.msg, image: prompt.image };
        }

        case "valor": {
            if (respLower === "pular" || respLower === "skip") {
                data.valor = "Não informado";
            } else {
                data.valor = resp;
            }
            const nextStep = "confirmar";
            setAluguelState(sender, nextStep, data);
            const prompt = _getPrompt(nextStep, data);
            return { done: false, msg: prompt.msg, image: prompt.image };
        }

        case "confirmar": {
            if (respLower === "sim" || respLower === "s" || respLower === "yes") {
                clearAluguelState(sender);
                return { done: true, confirmed: true, data };
            } else if (respLower === "nao" || respLower === "não" || respLower === "n" || respLower === "no") {
                clearAluguelState(sender);
                return { done: false, cancelled: true, msg: "❌ Contrato cancelado.\n\n💡 Use *!alugarbot* para iniciar um novo." };
            } else {
                return { error: true, msg: "💡 Responda *sim* para confirmar ou *não* para cancelar." };
            }
        }

        default: {
            clearAluguelState(sender);
            return { error: true, msg: "⚠️ Erro no fluxo. Use *!alugarbot* novamente." };
        }
    }
}

// ══════════════════════════════════════════════════════════════
// ║         FLUXO DE RENOVAÇÃO DE CONTRATO POR ETAPAS         ║
// ══════════════════════════════════════════════════════════════

const RENOV_STATES_PATH = path.resolve("./dados/org/json/renovacao_states.json");
const RENOVACAO_TIMEOUT = 10 * 60 * 1000; // 10 minutos

// ── Load / Save ────────────────────────────────────────────
function loadRenovacaoStates() {
    try {
        return JSON.parse(fs.readFileSync(RENOV_STATES_PATH, "utf-8"));
    } catch {
        return {};
    }
}

function saveRenovacaoStates(data) {
    fs.writeFileSync(RENOV_STATES_PATH, JSON.stringify(data, null, 2));
}

// ── State get / set / clear ────────────────────────────────
function getRenovacaoState(sender) {
    const states = loadRenovacaoStates();
    const state = states[sender];
    if (!state) return null;
    if (Date.now() - state.lastActivity > RENOVACAO_TIMEOUT) {
        clearRenovacaoState(sender);
        return null;
    }
    return state;
}

function setRenovacaoState(sender, step, data = {}) {
    const states = loadRenovacaoStates();
    states[sender] = { step, data, lastActivity: Date.now() };
    saveRenovacaoStates(states);
}

function clearRenovacaoState(sender) {
    const states = loadRenovacaoStates();
    delete states[sender];
    saveRenovacaoStates(states);
}

// ── Prompts da renovação ───────────────────────────────────

const RENOVACAO_PROMPTS = {
    renovar_dias: (data) => ({
        msg: `  🔄 *RENOVAR CONTRATO*  ━  Etapa *1*/2\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n📆 Quantos *dias* deseja renovar?\n\n  *7*  ─ semanal\n  *15* ─ quinzenal\n  *30* ─ mensal\n  *90* ─ trimestral\n\n━━ 📝 Info ━━\n🏘️ *${data.nome_grupo}*\n👤 ${data.responsavel_nome}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n❌ _cancelar para sair_`,
        image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=90"
    }),

    renovar_valor: (data) => ({
        msg: `  🔄 *RENOVAR CONTRATO*  ━  Etapa *2*/2 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n💰 Qual é o *novo valor* cobrado?\n\n💡 Valor atual: *${data.valor_atual}*\n💡 Envie *manter* para manter\n\n━━ 📝 Resumo ━━\n🏘️ ${data.nome_grupo}\n📆 +${data.dias_renovar} dia(s)\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n❌ _cancelar para sair_`,
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=90"
    }),

    renovar_confirmar: (data) => ({
        msg: `  🔄 *CONFIRMAR RENOVAÇÃO*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n━━ 📄 Contrato ━━\n🏘️ *Grupo:* ${data.nome_grupo}\n🔗 *Link:* ${data.link_grupo || "Não informado"}\n🆔 *ID:* ${data.id_gp || "Não informado"}\n\n━━ 👤 Cliente ━━\n👤 *Responsável:* ${data.responsavel_nome}\n📞 *Contato:* wa.me/${data.responsavel_contato}\n\n━━ 📊 Renovação ━━\n📆 *Dias a adicionar:* +${data.dias_renovar} dia(s)\n💰 *Valor:* ${data.valor_novo}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n✅ Envie *sim* para confirmar\n❌ Envie *não* para cancelar`,
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=90"
    }),
};

function _getRenovPrompt(stepName, data) {
    const promptFn = RENOVACAO_PROMPTS[stepName];
    const result = typeof promptFn === "function" ? promptFn(data) : promptFn;
    if (result && typeof result === "object" && result.msg) {
        return { msg: result.msg, image: result.image || null };
    }
    return { msg: result, image: null };
}

// ── Iniciar fluxo de renovação ─────────────────────────────

function startRenovacaoFlow(sender, contratoExistente) {
    const data = {
        id_gp: contratoExistente.id_gp,
        nome_grupo: contratoExistente.nome_,
        link_grupo: contratoExistente.link || "",
        responsavel_nome: contratoExistente.responsavel_nome,
        responsavel_contato: contratoExistente.responsavel_contato,
        valor_atual: contratoExistente.valor || "Não informado",
    };
    const firstStep = "renovar_dias";
    setRenovacaoState(sender, firstStep, data);
    return _getRenovPrompt(firstStep, data);
}

// ── Processar resposta da renovação ────────────────────────

function processarRespostaRenovacao(sender, resposta) {
    const state = getRenovacaoState(sender);
    if (!state) return { error: true, msg: "⏰ O tempo da renovação expirou. Use *!renovaraluguel* novamente." };

    const { step, data } = state;
    const resp = resposta.trim();
    const respLower = resp.toLowerCase();

    // ── Cancelamento global ──
    if (respLower === "cancelar" || respLower === "cancel") {
        clearRenovacaoState(sender);
        return { done: false, cancelled: true, msg: "❌ Renovação cancelada.\n\n💡 Use *!renovaraluguel* para tentar novamente." };
    }

    switch (step) {
        case "renovar_dias": {
            const dias = parseInt(resp);
            if (isNaN(dias) || dias < 1 || dias > 365) {
                return { error: true, msg: "⚠️ Informe um número de dias válido (1 a 365).\n\n💡 Planos sugeridos: *7*, *15*, *30* ou *90* dias" };
            }
            data.dias_renovar = dias;
            const nextStep = "renovar_valor";
            setRenovacaoState(sender, nextStep, data);
            const prompt = _getRenovPrompt(nextStep, data);
            return { done: false, msg: prompt.msg, image: prompt.image };
        }

        case "renovar_valor": {
            if (respLower === "manter" || respLower === "mantém" || respLower === "mantem" || respLower === "mesmo") {
                data.valor_novo = data.valor_atual;
            } else if (respLower === "pular" || respLower === "skip") {
                data.valor_novo = data.valor_atual;
            } else {
                data.valor_novo = resp;
            }
            const nextStep = "renovar_confirmar";
            setRenovacaoState(sender, nextStep, data);
            const prompt = _getRenovPrompt(nextStep, data);
            return { done: false, msg: prompt.msg, image: prompt.image };
        }

        case "renovar_confirmar": {
            if (respLower === "sim" || respLower === "s" || respLower === "yes") {
                clearRenovacaoState(sender);
                return { done: true, confirmed: true, data };
            } else if (respLower === "nao" || respLower === "não" || respLower === "n" || respLower === "no") {
                clearRenovacaoState(sender);
                return { done: false, cancelled: true, msg: "❌ Renovação cancelada.\n\n💡 Use *!renovaraluguel* para tentar novamente." };
            } else {
                return { error: true, msg: "💡 Responda *sim* para confirmar ou *não* para cancelar." };
            }
        }

        default: {
            clearRenovacaoState(sender);
            return { error: true, msg: "⚠️ Erro no fluxo. Use *!renovaraluguel* novamente." };
        }
    }
}

module.exports = {
    getAluguelState,
    setAluguelState,
    clearAluguelState,
    startAluguelFlow,
    processarRespostaAluguel,
    ALUGUEL_STEPS,
    ALUGUEL_PROMPTS,
    // Renovação
    getRenovacaoState,
    setRenovacaoState,
    clearRenovacaoState,
    startRenovacaoFlow,
    processarRespostaRenovacao,
};
