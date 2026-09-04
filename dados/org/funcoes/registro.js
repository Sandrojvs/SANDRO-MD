const fs = require("fs-extra");
const moment = require("moment-timezone");

// ===== CAMINHOS =====
const REGISTROS_PATH = "./dados/registros/registros.json";
const STATES_PATH = "./dados/registros/registro_states.json";

// ===== TIMEOUT =====
const REGISTRO_TIMEOUT = 5 * 60 * 1000; // 5 minutos

// ===== NORMALIZAÇÃO DE JID =====

function _normalizeJid(jid) {
    if (!jid) return jid;
    // Se já é @s.whatsapp.net, verificar se é LID disfarçado (>15 dígitos)
    if (jid.endsWith("@s.whatsapp.net")) {
        const num = jid.split("@")[0];
        // Números reais têm no máximo 15 dígitos (DDI + número)
        // LIDs têm 16+ dígitos — são IDs internos, NÃO números de telefone
        if (num.length > 15) return jid; // Manter como está, é LID
        return jid;
    }
    // Se é @lid, converter para @s.whatsapp.net (mas marcar como LID se >15 dígitos)
    if (jid.includes("@lid")) return jid.replace("@lid", "@s.whatsapp.net");
    if (!jid.includes("@")) return jid + "@s.whatsapp.net";
    return jid;
}

// ===== CARREGAR / SALVAR =====

function loadRegistros() {
    try {
        return JSON.parse(fs.readFileSync(REGISTROS_PATH, "utf8"));
    } catch {
        fs.writeFileSync(REGISTROS_PATH, JSON.stringify({}, null, 2));
        return {};
    }
}

function saveRegistros(data) {
    fs.writeFileSync(REGISTROS_PATH, JSON.stringify(data, null, 2), "utf8");
}

function loadStates() {
    try {
        return JSON.parse(fs.readFileSync(STATES_PATH, "utf8"));
    } catch {
        fs.writeFileSync(STATES_PATH, JSON.stringify({}, null, 2));
        return {};
    }
}

function saveStates(data) {
    fs.writeFileSync(STATES_PATH, JSON.stringify(data, null, 2), "utf8");
}

// ===== CRUD DE USUÁRIO (com normalização de JID) =====

/**
 * Busca usuário tentando múltiplas variantes do JID (raw + normalizado).
 * Retorna o registro mais recente se houver duplicatas.
 */
function getUser(sender) {
    const regs = loadRegistros();
    const norm = _normalizeJid(sender);
    const raw = regs[sender] || null;
    const normalized = (norm !== sender) ? (regs[norm] || null) : null;

    // Se encontrou em ambos, retornar o mais recente
    if (raw && normalized) {
        const rawDate = raw.atualizadoEm ? new Date(raw.atualizadoEm).getTime() : 0;
        const normDate = normalized.atualizadoEm ? new Date(normalized.atualizadoEm).getTime() : 0;
        return normDate >= rawDate ? normalized : raw;
    }
    return raw || normalized || null;
}

/**
 * Salva o usuário e remove entrada duplicada do JID antigo se existir.
 */
function setUser(sender, userData) {
    const regs = loadRegistros();
    const norm = _normalizeJid(sender);

    // Salvar no JID normalizado
    regs[norm] = userData;

    // Remover entrada duplicada do JID bruto se for diferente
    if (sender !== norm && regs[sender]) {
        delete regs[sender];
    }

    saveRegistros(regs);
}

function deleteUser(sender) {
    const regs = loadRegistros();
    const norm = _normalizeJid(sender);
    let deletou = false;

    if (regs[sender]) { delete regs[sender]; deletou = true; }
    if (norm !== sender && regs[norm]) { delete regs[norm]; deletou = true; }

    if (deletou) saveRegistros(regs);
    return deletou;
}

function getAllUsers() {
    return loadRegistros();
}

// ===== STATE MACHINE =====

const STEPS = [
    "sexo",
    "nome",
    "nascimento",
    "altura",
    "cidade",
    "profissao",
    "religiao",
    "estadoCivil",
    "time",
    "frase",
];

// ===== IMAGENS ALEATÓRIAS POR ETAPA (HD, Unsplash) =====
// Cada etapa tem 5 URLs diferentes para variar a cada registro

const REGISTRO_IMAGES = {
    sexo: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=90",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=90",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=90",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=90",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=90",
    ],
    nome: [
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=90",
        "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=90",
        "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=90",
        "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=90",
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=90",
    ],
    nascimento: [
        "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800&q=90",
        "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=90",
        "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=90",
        "https://images.unsplash.com/photo-1464349153159-4e7e33109c84?w=800&q=90",
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=90",
    ],
    altura: [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=90",
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=90",
        "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=90",
        "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=90",
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=90",
    ],
    cidade: [
        "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=90",
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=90",
        "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=90",
        "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=90",
        "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=90",
    ],
    profissao: [
        "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=90",
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=90",
        "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&q=90",
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=90",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=90",
    ],
    religiao: [
        "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=90",
        "https://images.unsplash.com/photo-1544761634-dc512f2238a3?w=800&q=90",
        "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=800&q=90",
        "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&q=90",
        "https://images.unsplash.com/photo-1545987796-200d7b120b76?w=800&q=90",
    ],
    estadoCivil: [
        "https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=800&q=90",
        "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=90",
        "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=90",
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=90",
        "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=800&q=90",
    ],
    time: [
        "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=90",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=90",
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=90",
        "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=90",
        "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=90",
    ],
    frase: [
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=90",
        "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&q=90",
        "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=800&q=90",
        "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=800&q=90",
        "https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=800&q=90",
    ],
};

function _getRandomImage(step) {
    const images = REGISTRO_IMAGES[step];
    if (!images || images.length === 0) return null;
    return images[Math.floor(Math.random() * images.length)];
}

// ===== PROMPTS MELHORADOS (Layout Clean) =====

const STEP_PROMPTS = {
    sexo: () => ({
        msg: `│\n│  📝 *CADASTRO*  •  1/10\n│  ▓░░░░░░░░░ _10%_\n├──────────────\n│\n│  🚻 Qual é o seu *sexo*?\n│\n│  ╭─────────────╮\n│  │ *1* ─ 👨 Masculino │\n│  │ *2* ─ 👩 Feminino  │\n│  ╰─────────────╯\n│\n│  📌 _Responda apenas *1* ou *2*_\n│  ⏰ _Timeout: 5 minutos_\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: _getRandomImage("sexo")
    }),

    nome: () => ({
        msg: `│\n│  📝 *CADASTRO*  •  2/10\n│  ▓▓░░░░░░░░ _20%_\n├──────────────\n│\n│  ✏️ Qual seu *nome completo*?\n│\n│  📌 _Regras:_\n│  → Mínimo *2* caracteres\n│  → Máx *50* caracteres\n│  → Sem números ou símbolos\n│\n│  💡 _Ex: João da Silva_\n│  💡 _Ex: Maria Souza_\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: _getRandomImage("nome")
    }),

    nascimento: () => ({
        msg: `│\n│  📝 *CADASTRO*  •  3/10\n│  ▓▓▓░░░░░░░ _30%_\n├──────────────\n│\n│  🎂 Sua *data de nascimento*?\n│\n│  📌 _Use o formato:_\n│  → *DD/MM/AAAA*\n│\n│  ✅ _Aceitos: 01/01/1950 até hoje_\n│  ❌ _Datas futuras não aceitas_\n│\n│  💡 _Ex: 15/03/1995_\n│  💡 _Ex: 02/12/2001_\n│\n│  🔮 _Seu signo e idade serão_\n│  _calculados automaticamente!_\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: _getRandomImage("nascimento")
    }),

    altura: () => ({
        msg: `│\n│  📝 *CADASTRO*  •  4/10\n│  ▓▓▓▓░░░░░░ _40%_\n├──────────────\n│\n│  📏 Qual a sua *altura*?\n│\n│  📌 _Formatos aceitos:_\n│  → *1.75* (metros)\n│  → *175* (centímetros)\n│\n│  ✅ _Entre 0.50m e 2.50m_\n│\n│  💡 _Ex: 1.68_\n│  💡 _Ex: 182_\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: _getRandomImage("altura")
    }),

    cidade: () => ({
        msg: `│\n│  📝 *CADASTRO*  •  5/10\n│  ▓▓▓▓▓░░░░░ _50%_\n├──────────────\n│\n│  🏙️ De onde você é?\n│  Informe *cidade* e *estado*.\n│\n│  📌 _Formato recomendado:_\n│  → Cidade / UF\n│\n│  💡 _Ex: São Paulo / SP_\n│  💡 _Ex: Rio de Janeiro / RJ_\n│  💡 _Ex: Lisboa / Portugal_\n│\n│  🌍 _Aceita cidades do exterior!_\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: _getRandomImage("cidade")
    }),

    profissao: () => ({
        msg: `│\n│  📝 *CADASTRO*  •  6/10\n│  ▓▓▓▓▓▓░░░░ _60%_\n├──────────────\n│\n│  💼 Qual sua *profissão*\n│  ou *ocupação atual*?\n│\n│  📌 _Máx: 40 caracteres_\n│\n│  💡 _Ex: Programador_\n│  💡 _Ex: Estudante_\n│  💡 _Ex: Designer Gráfico_\n│  💡 _Ex: Desempregado_\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: _getRandomImage("profissao")
    }),

    religiao: () => ({
        msg: `│\n│  📝 *CADASTRO*  •  7/10\n│  ▓▓▓▓▓▓▓░░░ _70%_\n├──────────────\n│\n│  🙏 Qual sua *religião*\n│  ou *crença*?\n│\n│  📌 _Máx: 40 caracteres_\n│\n│  💡 _Ex: Católico_\n│  💡 _Ex: Evangélico_\n│  💡 _Ex: Espírita_\n│  💡 _Ex: Ateu_\n│  💡 _Ou digite "nenhuma"_\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: _getRandomImage("religiao")
    }),

    estadoCivil: () => ({
        msg: `│\n│  📝 *CADASTRO*  •  8/10\n│  ▓▓▓▓▓▓▓▓░░ _80%_\n├──────────────\n│\n│  💍 Qual seu *estado civil*?\n│  Escolha uma opção abaixo:\n│\n│  ╭───────────────╮\n│  │ *1* ─ 💔 Solteiro(a) │\n│  │ *2* ─ 💑 Namorando   │\n│  │ *3* ─ 💏 Noivo(a)    │\n│  │ *4* ─ 💍 Casado(a)   │\n│  │ *5* ─ 💔 Separado(a) │\n│  │ *6* ─ 🖤 Viúvo(a)    │\n│  ╰───────────────╯\n│\n│  📌 _Responda com o número_\n│  📌 _ou escreva por extenso_\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: _getRandomImage("estadoCivil")
    }),

    time: () => ({
        msg: `│\n│  📝 *CADASTRO*  •  9/10\n│  ▓▓▓▓▓▓▓▓▓░ _90%_\n├──────────────\n│\n│  ⚽ Qual seu *time do coração*?\n│\n│  📌 _Máx: 40 caracteres_\n│\n│  💡 _Ex: Flamengo_\n│  💡 _Ex: Corinthians_\n│  💡 _Ex: Real Madrid_\n│  💡 _Digite "nenhum" se não_\n│  _torce para nenhum time_\n│\n│  🏆 _Quase lá! Falta só 1!_\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: _getRandomImage("time")
    }),

    frase: () => ({
        msg: `│\n│  📝 *CADASTRO*  •  10/10\n│  ▓▓▓▓▓▓▓▓▓▓ _100%_\n├──────────────\n│\n│  💬 Escreva uma *frase de vida*,\n│  *bio* ou *pensamento*:\n│\n│  📌 _Máx: 150 caracteres_\n│\n│  💡 _Ex: Viva e deixe viver!_\n│  💡 _Ex: A vida é bela._\n│  💡 _Ex: Deus é fiel!_\n│\n│  ✨ *Última etapa!*\n│  _Após essa, seu perfil será_\n│  _finalizado automaticamente!_\n├──────────────\n│  ❌ *cancelar* p/ sair`,
        image: _getRandomImage("frase")
    }),
};

function _getPrompt(step) {
    const fn = STEP_PROMPTS[step];
    if (typeof fn === "function") return fn();
    return fn;
}

// ===== STATE MACHINE =====

function getRegistroState(sender) {
    const states = loadStates();
    const state = states[sender];
    if (!state) return null;

    // Verificar timeout
    if (Date.now() - state.lastActivity > REGISTRO_TIMEOUT) {
        clearRegistroState(sender);
        return null; // expirado
    }
    return state;
}

function setRegistroState(sender, step, data = {}) {
    const states = loadStates();
    states[sender] = {
        step: step,
        data: data,
        lastActivity: Date.now(),
    };
    saveStates(states);
}

function clearRegistroState(sender) {
    const states = loadStates();
    delete states[sender];
    saveStates(states);
}

function startRegistro(sender) {
    setRegistroState(sender, "sexo", {});
    const prompt = _getPrompt("sexo");
    return {
        msg: prompt.msg,
        image: prompt.image
    };
}

// ===== VALIDAÇÃO DE DATA =====

function validarData(str) {
    if (!str || typeof str !== "string") return false;
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = str.trim().match(regex);
    if (!match) return false;

    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);
    const ano = parseInt(match[3], 10);

    if (mes < 1 || mes > 12) return false;
    if (dia < 1 || dia > 31) return false;
    if (ano < 1900 || ano > new Date().getFullYear()) return false;

    // Verificar dia válido para o mês
    const diasNoMes = new Date(ano, mes, 0).getDate();
    if (dia > diasNoMes) return false;

    // Verificar se a data não é no futuro
    const dataNasc = new Date(ano, mes - 1, dia);
    if (dataNasc > new Date()) return false;

    // Verificar idade mínima (pelo menos 10 anos)
    const hoje = new Date();
    let idade = hoje.getFullYear() - ano;
    if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) {
        idade--;
    }
    if (idade < 10) return false;

    return true;
}

// ===== CÁLCULO DE IDADE =====

function calcularIdade(dataNascStr) {
    const [dia, mes, ano] = dataNascStr.split("/").map(Number);
    const hoje = new Date();
    let idade = hoje.getFullYear() - ano;
    const mesAtual = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();

    if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
        idade--;
    }
    return idade;
}

// ===== CÁLCULO DE SIGNO =====

function calcularSigno(dataNascStr) {
    const [dia, mes] = dataNascStr.split("/").map(Number);

    const signos = [
        { nome: "Capricórnio", emoji: "♑", inicio: [12, 22], fim: [1, 19] },
        { nome: "Aquário", emoji: "♒", inicio: [1, 20], fim: [2, 18] },
        { nome: "Peixes", emoji: "♓", inicio: [2, 19], fim: [3, 20] },
        { nome: "Áries", emoji: "♈", inicio: [3, 21], fim: [4, 19] },
        { nome: "Touro", emoji: "♉", inicio: [4, 20], fim: [5, 20] },
        { nome: "Gêmeos", emoji: "♊", inicio: [5, 21], fim: [6, 20] },
        { nome: "Câncer", emoji: "♋", inicio: [6, 21], fim: [7, 22] },
        { nome: "Leão", emoji: "♌", inicio: [7, 23], fim: [8, 22] },
        { nome: "Virgem", emoji: "♍", inicio: [8, 23], fim: [9, 22] },
        { nome: "Libra", emoji: "♎", inicio: [9, 23], fim: [10, 22] },
        { nome: "Escorpião", emoji: "♏", inicio: [10, 23], fim: [11, 21] },
        { nome: "Sagitário", emoji: "♐", inicio: [11, 22], fim: [12, 21] },
    ];

    // Capricórnio é especial (cruza virada do ano)
    if ((mes === 12 && dia >= 22) || (mes === 1 && dia <= 19)) {
        return { nome: "Capricórnio", emoji: "♑" };
    }

    for (const s of signos) {
        if (s.nome === "Capricórnio") continue;
        const [mi, di] = s.inicio;
        const [mf, df] = s.fim;
        if ((mes === mi && dia >= di) || (mes === mf && dia <= df)) {
            return { nome: s.nome, emoji: s.emoji };
        }
    }

    return { nome: "Desconhecido", emoji: "❓" };
}

// ===== PROCESSAR RESPOSTA DO FLUXO =====

function processarResposta(sender, resposta) {
    const state = getRegistroState(sender);
    if (!state) return { error: true, msg: "⏰ Seu registro expirou por inatividade. Digite *!registrar* para recomeçar." };

    const resp = resposta.trim();
    if (!resp || resp.length === 0) {
        return { error: true, msg: "❌ Resposta vazia. Tente novamente." };
    }

    const step = state.step;
    const data = state.data;

    switch (step) {
        case "sexo": {
            const r = resp.toLowerCase();
            if (r === "1" || r === "masculino" || r === "m") {
                data.sexo = "Masculino";
            } else if (r === "2" || r === "feminino" || r === "f") {
                data.sexo = "Feminino";
            } else {
                return { error: true, msg: "❌ Resposta inválida!\n\n💡 Responda *1* para Masculino ou *2* para Feminino." };
            }
            setRegistroState(sender, "nome", data);
            const p = _getPrompt("nome");
            return { error: false, msg: p.msg, image: p.image };
        }

        case "nome": {
            if (resp.length < 3) return { error: true, msg: "❌ Nome muito curto. Digite seu nome completo." };
            if (resp.length > 60) return { error: true, msg: "❌ Nome muito longo (máx 60 caracteres)." };
            data.nome = resp;
            setRegistroState(sender, "nascimento", data);
            const p = _getPrompt("nascimento");
            return { error: false, msg: p.msg, image: p.image };
        }

        case "nascimento": {
            if (!validarData(resp)) {
                return {
                    error: true,
                    msg: `❌ Data inválida!\n\n📅 Use o formato: *DD/MM/AAAA*\n💡 Exemplo: *15/03/1995*\n💡 Idade mínima: 10 anos.`
                };
            }
            data.nascimento = resp;
            data.idade = calcularIdade(resp);
            const signo = calcularSigno(resp);
            data.signo = signo.nome;
            data.signoEmoji = signo.emoji;
            setRegistroState(sender, "altura", data);

            const p = _getPrompt("altura");
            const msgSigno = `✅ *Data registrada!*\n\n🎂 Idade: *${data.idade} anos*\n${signo.emoji} Signo: *${signo.nome}*\n\n${p.msg}`;
            return { error: false, msg: msgSigno, image: p.image };
        }

        case "altura": {
            // Aceita: 1.75, 1,75, 175
            let alt = resp.replace(",", ".").trim();
            if (/^\d{3}$/.test(alt)) alt = (parseInt(alt) / 100).toFixed(2);
            const altNum = parseFloat(alt);
            if (isNaN(altNum) || altNum < 0.5 || altNum > 2.5) {
                return { error: true, msg: "❌ Altura inválida!\n\n💡 Ex: *1.75* ou *175*\n💡 Entre 0.50m e 2.50m" };
            }
            data.altura = altNum.toFixed(2) + "m";
            setRegistroState(sender, "cidade", data);
            const p = _getPrompt("cidade");
            return { error: false, msg: p.msg, image: p.image };
        }

        case "cidade": {
            if (resp.length < 2) return { error: true, msg: "❌ Cidade muito curta. Tente novamente." };
            if (resp.length > 50) return { error: true, msg: "❌ Cidade muito longa (máx 50 caracteres)." };
            data.cidade = resp;
            setRegistroState(sender, "profissao", data);
            const p = _getPrompt("profissao");
            return { error: false, msg: p.msg, image: p.image };
        }

        case "profissao": {
            if (resp.length < 2) return { error: true, msg: "❌ Profissão muito curta. Tente novamente." };
            if (resp.length > 50) return { error: true, msg: "❌ Profissão muito longa (máx 50 caracteres)." };
            data.profissao = resp;
            setRegistroState(sender, "religiao", data);
            const p = _getPrompt("religiao");
            return { error: false, msg: p.msg, image: p.image };
        }

        case "religiao": {
            if (resp.length > 40) return { error: true, msg: "❌ Muito longo (máx 40 caracteres)." };
            data.religiao = resp;
            setRegistroState(sender, "estadoCivil", data);
            const p = _getPrompt("estadoCivil");
            return { error: false, msg: p.msg, image: p.image };
        }

        case "estadoCivil": {
            const opcoes = {
                "1": "💔 Solteiro(a)",
                "solteiro": "💔 Solteiro(a)",
                "solteira": "💔 Solteiro(a)",
                "2": "💑 Namorando",
                "namorando": "💑 Namorando",
                "3": "💏 Noivo(a)",
                "noivo": "💏 Noivo(a)",
                "noiva": "💏 Noivo(a)",
                "4": "💍 Casado(a)",
                "casado": "💍 Casado(a)",
                "casada": "💍 Casado(a)",
                "5": "💔 Separado(a)",
                "separado": "💔 Separado(a)",
                "separada": "💔 Separado(a)",
                "6": "🖤 Viúvo(a)",
                "viuvo": "🖤 Viúvo(a)",
                "viuva": "🖤 Viúvo(a)",
                "viúvo": "🖤 Viúvo(a)",
                "viúva": "🖤 Viúvo(a)",
            };
            const escolha = opcoes[resp.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
            if (!escolha) {
                return { error: true, msg: "❌ Opção inválida!\n\n💡 Responda com o número:\n*1* ─ Solteiro(a)\n*2* ─ Namorando\n*3* ─ Noivo(a)\n*4* ─ Casado(a)\n*5* ─ Separado(a)\n*6* ─ Viúvo(a)" };
            }
            data.estadoCivil = escolha;
            setRegistroState(sender, "time", data);
            const p = _getPrompt("time");
            return { error: false, msg: p.msg, image: p.image };
        }

        case "time": {
            if (resp.length > 40) return { error: true, msg: "❌ Muito longo (máx 40 caracteres)." };
            data.time = resp;
            setRegistroState(sender, "frase", data);
            const p = _getPrompt("frase");
            return { error: false, msg: p.msg, image: p.image };
        }

        case "frase": {
            if (resp.length > 150) return { error: true, msg: "❌ Frase muito longa (máx 150 caracteres)." };
            data.frase = resp;

            // Finalizar registro
            const agora = moment.tz("America/Sao_Paulo").format();
            const existente = getUser(sender);
            const userData = {
                sexo: data.sexo,
                nome: data.nome,
                nascimento: data.nascimento,
                idade: data.idade,
                signo: data.signo,
                signoEmoji: data.signoEmoji,
                altura: data.altura,
                cidade: data.cidade,
                profissao: data.profissao,
                religiao: data.religiao,
                estadoCivil: data.estadoCivil || null,
                time: data.time,
                frase: data.frase,
                registradoEm: existente?.registradoEm || agora,
                atualizadoEm: agora,
            };

            setUser(sender, userData);
            clearRegistroState(sender);

            return {
                error: false,
                completed: true,
                userData: userData,
                msg: null, // o perfil será montado pelo index.js
            };
        }

        default:
            clearRegistroState(sender);
            return { error: true, msg: "❌ Erro no fluxo. Digite *!registrar* para recomeçar." };
    }
}

// ===== CANCELAR REGISTRO =====

function cancelarRegistro(sender) {
    const state = getRegistroState(sender);
    if (!state) return false;
    clearRegistroState(sender);
    return true;
}

// ===== GERAR TEXTO DO PERFIL (Layout Premium) =====

function gerarPerfil(userData, numero, pushname, extras = {}) {
    const u = userData;
    const genIcon = u.sexo === "Feminino" ? "👩" : "👨";

    let txt = "";
    txt += `│\n`;
    txt += `│  ${genIcon} *PERFIL*\n`;
    txt += `├──────────────\n`;
    txt += `│\n`;
    txt += `│  📛 *${u.nome}*\n`;
    if (pushname) txt += `│  🏷️ ${pushname}\n`;
    txt += `│  📱 @${numero}\n`;
    txt += `│  🚻 ${u.sexo || "N/A"} • 📏 ${u.altura || "N/A"}\n`;
    txt += `│\n`;
    txt += `├── 📋 *INFO* ─────\n`;
    txt += `│\n`;
    txt += `│  🎂 ${u.nascimento} • *${u.idade} anos*\n`;
    txt += `│  ${u.signoEmoji} ${u.signo}\n`;
    txt += `│  🌍 ${u.cidade}\n`;
    txt += `│  💼 ${u.profissao}\n`;
    txt += `│  ⛪ ${u.religiao}\n`;
    if (u.estadoCivil) txt += `│  ${u.estadoCivil}\n`;
    txt += `│  ⚽ ${u.time}\n`;
    txt += `│\n`;
    txt += `│  💬 _"${u.frase}"_\n`;
    if (extras.recado && extras.recado !== "Sem recado") {
        txt += `│  📝 _${extras.recado}_\n`;
    }

    // Gold — sempre visível
    if (extras.golds !== undefined) {
        txt += `│\n`;
        txt += `├── 🪙 *GOLD* ──────\n`;
        txt += `│\n`;
        txt += `│  💰 Saldo: *${extras.golds}* golds\n`;
    }

    if (extras.mensagens !== undefined) {
        txt += `│\n`;
        txt += `├── 📊 *ATIVIDADE* ──\n`;
        txt += `│\n`;
        txt += `│  💬 *${extras.mensagens}* msgs\n`;
        txt += `│  🤖 *${extras.comandos}* cmds\n`;
        txt += `│  🎭 *${extras.figurinhas}* figs\n`;
        txt += `│  ⚠️ *${extras.advertencias || 0}/3* adv\n`;
        // Status de mute
        if (extras.mutado) {
            txt += `│  🔇 *MUTADO* — ${extras.mutadoMsgs || 0} msgs apagadas\n`;
        } else {
            txt += `│  🔊 Livre\n`;
        }
    }

    if (extras.mostrarPersonalidade) {
        txt += `│\n`;
        txt += `├── 🎲 *RANDOM* ────\n`;
        txt += `│\n`;
        txt += `│  🐂 Corno: *${Math.floor(Math.random() * 100)}%*\n`;
        txt += `│  🐄 Gado: *${Math.floor(Math.random() * 100)}%*\n`;
        txt += `│  😇 Santo: *${Math.floor(Math.random() * 100)}%*\n`;
        txt += `│  😈 Safado: *${Math.floor(Math.random() * 100)}%*\n`;
        txt += `│  💼 CEO: *${Math.floor(Math.random() * 100)}%*\n`;
        txt += `│  🥰 Lindo: *${Math.floor(Math.random() * 100)}%*\n`;
    }

    txt += `│\n`;
    txt += `├──────────────\n`;
    txt += `│  📌 _Reg: ${moment(u.registradoEm).format("DD/MM/YYYY")}_\n`;
    txt += `│  🔄 _Att: ${moment(u.atualizadoEm).format("DD/MM/YYYY")}_`;

    return txt;
}

function mensagemIntro(prefix) {
    return {
        msg: `│\n│  📋 *SISTEMA DE REGISTRO*\n├──────────────\n│\n│  🔐 Olá! Vou te guiar no\n│  *cadastro completo* do bot.\n│\n│  📝 São *10 perguntas* rápidas:\n│  → Sexo, Nome, Nascimento\n│  → Altura, Cidade, Profissão\n│  → Religião, Estado Civil\n│  → Time do Coração, Frase\n│\n│  🎁 _Ao completar você:_\n│  → Desbloqueia todos os comandos\n│  → Ganha seu perfil personalizado\n│  → Recebe parabéns no aniversário\n│\n│  ⏰ _Timeout: *5 minutos*_\n│  _Se demorar, o cadastro expira._\n│\n│  💡 Envie *cancelar* a qualquer\n│  momento para sair do cadastro.\n├──────────────\n│  _Vamos começar! 🚀_`,
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=90"
    };
}

function mensagemJaRegistrado(prefix, userData) {
    return {
        msg: `│\n│  ⚠️ *JÁ REGISTRADO*\n├──────────────\n│\n│  📛 *${userData.nome}*\n│  🎂 ${userData.idade} anos • ${userData.signoEmoji} ${userData.signo}\n│  🌍 ${userData.cidade || "—"}\n│  💼 ${userData.profissao || "—"}\n│\n│  🔄 Deseja *atualizar* seus dados?\n│  _Todas as 10 etapas serão_\n│  _refeitas com novos dados._\n│\n│  ╭─────────────╮\n│  │ ✅ *sim* ─ refazer tudo │\n│  │ ❌ *não* ─ manter atual │\n│  ╰─────────────╯\n│\n│  🗑️ Quer *apagar* seu registro?\n│  Use: *${prefix}delregistro*\n│\n│  📌 _Responda apenas sim ou não_`,
        image: "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=800&q=90"
    };
}

// ===== EXPORTS =====

module.exports = {
    loadRegistros,
    saveRegistros,
    getUser,
    setUser,
    deleteUser,
    getAllUsers,
    getRegistroState,
    setRegistroState,
    clearRegistroState,
    startRegistro,
    validarData,
    calcularIdade,
    calcularSigno,
    processarResposta,
    cancelarRegistro,
    gerarPerfil,
    mensagemIntro,
    mensagemJaRegistrado,
    STEPS,
    STEP_PROMPTS,
};
