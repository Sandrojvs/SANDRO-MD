/*｡☆✼★━━━━━━ATENÇÃO━━━━━━━━━━★✼
❤️⃤𝙀𝙐 𝙎𝘼𝙉𝘿𝙍𝙊 𝘽𝙊𝙏 𝙉𝘼𝙊 𝙋𝙀𝙍𝙈𝙄𝙏𝙊 𝙍𝙀𝙑𝙀𝙉𝘿𝙀𝙍 𝙊𝙐 𝙍𝙀𝙋𝘼𝙎𝙎𝘼𝙍 𝙀𝙎𝙎𝘼 𝙑𝙀𝙍𝙎𝘼𝙊 V33.❤️⃤
｡☆✼★━━━━━━ATENÇÃO━━━━━━━━━━★✼*/

const fs = require("fs");
const path = require("path");

const SIMI_PATH = path.join(__dirname, "dados", "simi.json");

// Cache em memória
let simiDB = null;
let insertCount = 0;
const SAVE_INTERVAL = 10; // Salvar a cada 10 mensagens aprendidas

function loadDB() {
    if (simiDB) return simiDB;
    try {
        if (fs.existsSync(SIMI_PATH)) {
            simiDB = JSON.parse(fs.readFileSync(SIMI_PATH, "utf-8"));
        } else {
            simiDB = [];
        }
    } catch (e) {
        console.error("[SIMI] Erro ao carregar simi.json:", e.message);
        simiDB = [];
    }
    return simiDB;
}

function saveDB() {
    try {
        fs.writeFileSync(SIMI_PATH, JSON.stringify(simiDB, null, 4), "utf-8");
    } catch (e) {
        console.error("[SIMI] Erro ao salvar simi.json:", e.message);
    }
}

// Salvar ao fechar o processo para não perder dados
process.on("exit", () => {
    if (simiDB && insertCount > 0) saveDB();
});

/**
 * Histórico das últimas mensagens por grupo
 */
const lastMessages = {};

/**
 * Insere/aprende uma nova mensagem no banco de dados.
 * Cada mensagem recebida é associada como resposta à mensagem anterior
 * de outro membro no grupo (aprendizado por conversação).
 */
function insert(type, info) {
    const from = info.key.remoteJid;
    const sender = info.key.participant || info.key.remoteJid;

    let text = "";
    if (type === "conversation") {
        text = info.message?.conversation || "";
    } else if (type === "extendedTextMessage") {
        text = info.message?.extendedTextMessage?.text || "";
    }

    // Ignorar mensagens muito curtas ou vazias
    if (!text || text.trim().length < 2) return;
    text = text.trim();

    // Ignorar se parece ser um comando
    if (text.startsWith("!") || text.startsWith("/") || text.startsWith(".") || text.startsWith("#")) return;

    const db = loadDB();

    // Se existe uma mensagem anterior neste grupo de OUTRO remetente,
    // registrar esta mensagem como resposta para aquela
    if (lastMessages[from] && lastMessages[from].sender !== sender) {
        const prevText = lastMessages[from].text;
        const prevNorm = prevText.toLowerCase().trim();

        // Buscar se já existe entrada para a mensagem anterior
        let entry = db.find(
            (e) => e.msg && e.msg.toLowerCase().trim() === prevNorm
        );

        if (entry) {
            // Adicionar resposta se ainda não existe (evitar duplicatas)
            if (!entry.messages.includes(text)) {
                entry.messages.push(text);
                insertCount++;
            }
        } else {
            // Criar nova entrada
            db.push({ msg: prevText, messages: [text] });
            insertCount++;
        }

        // Salvar periodicamente
        if (insertCount >= SAVE_INTERVAL) {
            saveDB();
            insertCount = 0;
        }
    }

    // Guardar esta mensagem como a última do grupo
    lastMessages[from] = { text, sender, time: Date.now() };
}

/**
 * Busca uma resposta para a mensagem no banco de dados local.
 * 1. Busca exata
 * 2. Busca parcial (mensagens que contêm o texto)
 * 3. Busca por palavras-chave
 */
function response(text) {
    if (!text || text.trim().length < 2) return null;

    const db = loadDB();
    const normalized = text.toLowerCase().trim();

    // 1. Busca exata
    let entry = db.find(
        (e) =>
            e.msg &&
            e.messages &&
            e.messages.length > 0 &&
            e.msg.toLowerCase().trim() === normalized
    );

    if (entry) {
        return entry.messages[Math.floor(Math.random() * entry.messages.length)];
    }

    // 2. Busca parcial — o input está contido na msg ou vice-versa
    const partialMatches = db.filter(
        (e) =>
            e.msg &&
            e.messages &&
            e.messages.length > 0 &&
            (e.msg.toLowerCase().trim().includes(normalized) ||
                normalized.includes(e.msg.toLowerCase().trim())) &&
            e.msg.trim().length >= 3
    );

    if (partialMatches.length > 0) {
        const pick = partialMatches[Math.floor(Math.random() * partialMatches.length)];
        return pick.messages[Math.floor(Math.random() * pick.messages.length)];
    }

    // 3. Busca por palavras-chave (se o texto tiver 2+ palavras)
    const words = normalized.split(/\s+/).filter((w) => w.length > 2);
    if (words.length >= 2) {
        const keywordMatches = db.filter(
            (e) =>
                e.msg &&
                e.messages &&
                e.messages.length > 0 &&
                words.some((w) => e.msg.toLowerCase().includes(w))
        );

        if (keywordMatches.length > 0) {
            const pick = keywordMatches[Math.floor(Math.random() * keywordMatches.length)];
            return pick.messages[Math.floor(Math.random() * pick.messages.length)];
        }
    }

    return null;
}

module.exports = { insert, response, loadDB, saveDB };
