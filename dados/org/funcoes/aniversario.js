const fs = require("fs-extra");
const chalk = require('chalk');
const moment = require("moment-timezone");
const path = require("path");

// ===== IMPORTAR MÓDULO DE REGISTRO =====
const { getAllUsers, calcularIdade, setUser, calcularSigno } = require("./registro.js");

// ===== PATHS DOS AVATARES FALLBACK =====
const AVATAR_MASC = path.join(__dirname, "..", "media", "avatar_masculino.png");
const AVATAR_FEM = path.join(__dirname, "..", "media", "avatar_feminino.png");

// ===== FRASES DE ANIVERSÁRIO =====
const BIRTHDAY_MESSAGES = [
    "🎊 O mundo ficou mais bonito no dia em que você nasceu!",
    "🌟 Mais um ano de história, e que venham muitos mais!",
    "🎆 Que esse novo ciclo traga tudo de mais incrível pra você!",
    "💫 Que cada dia desse novo ano seja melhor que o anterior!",
    "🎈 Celebre muito, você merece cada segundo de felicidade!",
    "🥳 Que a vida te presenteie com tudo que seu coração deseja!",
    "✨ Que sua luz continue brilhando e inspirando quem tá ao redor!",
    "🎇 Que esse ano novo de vida traga realizações incríveis!",
    "🌈 Que sua caminhada seja repleta de amor e conquistas!",
    "🎁 O melhor presente é saber que você existe nesse mundo!",
    "💎 Que esse novo ano seja tão precioso quanto você é!",
    "🔥 Parabéns guerreiro(a), continue quebrando tudo na vida!",
    "🦋 Que você voe cada vez mais alto nesse novo ciclo!",
    "🏆 Mais um ano de vitórias, e o melhor ainda está por vir!",
    "💪 Que nada e ninguém tire o brilho dos seus olhos!",
    "🌻 Que esse novo ano floresça com muita saúde e alegria!",
    "🚀 Que seus sonhos decolem e alcancem o infinito!",
    "👑 Rei/Rainha do dia! Que seu reinado dure para sempre!",
    "🎶 Que a melodia da vida toque sempre ao seu favor!",
    "⭐ Hoje brilha a estrela mais especial do grupo!",
];

// ===== FRASES POR SIGNO =====
const SIGNO_MESSAGES = {
    "Áries": "♈ Como ariano(a), sua energia e coragem são inspiradoras!",
    "Touro": "♉ Como taurino(a), sua determinação move montanhas!",
    "Gêmeos": "♊ Como geminiano(a), sua versatilidade encanta a todos!",
    "Câncer": "♋ Como canceriano(a), seu coração enorme conquista o mundo!",
    "Leão": "♌ Como leonino(a), seu brilho ilumina qualquer lugar!",
    "Virgem": "♍ Como virginiano(a), sua perfeição é admirável!",
    "Libra": "♎ Como libriano(a), seu equilíbrio traz paz a todos!",
    "Escorpião": "♏ Como escorpiano(a), sua intensidade é única!",
    "Sagitário": "♐ Como sagitariano(a), sua liberdade inspira a todos!",
    "Capricórnio": "♑ Como capricorniano(a), sua ambição é admirável!",
    "Aquário": "♒ Como aquariano(a), sua originalidade muda o mundo!",
    "Peixes": "♓ Como pisciano(a), sua sensibilidade toca corações!",
};

// ===== VERIFICAR ANIVERSARIANTES DO DIA =====

function getAniversariantesDoDia() {
    const users = getAllUsers();
    const hoje = moment.tz("America/Sao_Paulo");
    const diaHoje = hoje.format("DD");
    const mesHoje = hoje.format("MM");

    const aniversariantes = [];

    for (const [jid, userData] of Object.entries(users)) {
        if (!userData.nascimento) continue;
        const [dia, mes] = userData.nascimento.split("/");
        if (dia === diaHoje && mes === mesHoje) {
            // Atualizar idade automaticamente
            const idadeCorreta = calcularIdade(userData.nascimento);
            if (idadeCorreta !== userData.idade) {
                userData.idade = idadeCorreta;
                setUser(jid, userData);
            }
            aniversariantes.push({ jid, userData });
        }
    }

    return aniversariantes;
}

// ===== GERAR MENSAGEM DE ANIVERSÁRIO (GRUPO) =====

function gerarMensagemAniversario(userData, numero) {
    const fraseRandom = BIRTHDAY_MESSAGES[Math.floor(Math.random() * BIRTHDAY_MESSAGES.length)];
    const fraseSigno = SIGNO_MESSAGES[userData.signo] || "";
    const genIcon = userData.sexo === "Feminino" ? "👩" : "👨";

    let txt = `╭──── 🎂🎉 *FELIZ ANIVERSÁRIO* 🎉🎂 ────╮\n`;
    txt += `┃\n`;
    txt += `┃  🥳 *PARABÉNS* @${numero}!!\n`;
    txt += `┃\n`;
    txt += `┃  ${genIcon} *${userData.nome}*\n`;
    txt += `┃  🎂 Completando *${userData.idade} anos* hoje!\n`;
    txt += `┃  ${userData.signoEmoji} Signo: *${userData.signo}*\n`;

    if (userData.time && userData.time.toLowerCase() !== "nenhum") {
        txt += `┃  ⚽ Torcedor(a) do *${userData.time}*\n`;
    }

    txt += `┃\n`;
    txt += `┃  ${fraseRandom}\n`;

    if (fraseSigno) {
        txt += `┃  ${fraseSigno}\n`;
    }

    if (userData.frase) {
        txt += `┃\n`;
        txt += `┃  💬 _"${userData.frase}"_\n`;
    }

    txt += `┃\n`;
    txt += `┃  🎊 *Que Deus abençoe seu novo*\n`;
    txt += `┃  *ciclo de vida!* 🙏✨\n`;
    txt += `┃\n`;
    txt += `╰──────────────────────────────────────╯\n`;
    txt += `\n🎂🎈🥳🎉🎊🎁🎆🎇✨💫`;

    return txt;
}

// ===== MENSAGEM PRIVADA DE ANIVERSÁRIO =====

function gerarMensagemPrivada(userData) {
    const genIcon = userData.sexo === "Feminino" ? "👩" : "👨";
    return `╭──── 🎂 *PARABÉNS* 🎂 ────╮
┃
┃  🥳 Olá *${userData.nome}*!
┃
┃  ${genIcon} Hoje é o seu dia especial!
┃  🎂 Você está fazendo *${userData.idade} anos*!
┃
┃  ${userData.signoEmoji} *${userData.signo}* te acompanha
┃  nessa nova jornada!
┃
┃  💫 Desejo que esse novo ciclo
┃  traga muita saúde, amor,
┃  prosperidade e felicidade!
┃
┃  🙏 Que Deus te abençoe
┃  e te guie sempre! 🌟
┃
╰─────────────────────────╯

🎂🎈🎉 _Da equipe Aleatory_ 🤖✨`;
}

// ===== BUSCAR FOTO DE PERFIL =====

async function getProfilePic(conn, jid, userData) {
    try {
        const ppUrl = await conn.profilePictureUrl(jid, "image");
        return { image: { url: ppUrl } };
    } catch {
        // Foto privada — usar avatar baseado no sexo
        const avatarPath = userData.sexo === "Feminino" ? AVATAR_FEM : AVATAR_MASC;
        try {
            return { image: fs.readFileSync(avatarPath) };
        } catch {
            return null; // Sem avatar disponível, enviar só texto
        }
    }
}

// ===== INICIAR SCHEDULER =====

let birthdaySchedulerRunning = false;
let checkedToday = null;

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

function initBirthdayScheduler() {
    if (birthdaySchedulerRunning) return;
    birthdaySchedulerRunning = true;

    console.log(chalk.cyan("SANDRO-BOT"));

    // Verificar a cada 60 segundos se é meia-noite (00:00)
    setInterval(() => {
        // Verificar se o sistema está ativado
        try {
            const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "..", "settings.json")));
            if (cfg.aniversario === false) return; // desativado pelo dono
        } catch (e) { /* ignorar erro de leitura */ }

        // Usar global.conn DINÂMICO com verificação de readyState
        if (!_isConnReady()) return;
        const conn = global.conn;

        const agora = moment.tz("America/Sao_Paulo");
        const horaAtual = agora.format("HH:mm");
        const diaAtual = agora.format("DD/MM/YYYY");

        // Executar à meia-noite e apenas uma vez por dia
        if (horaAtual === "00:00" && checkedToday !== diaAtual) {
            checkedToday = diaAtual;
            checkAndCelebrate(conn).catch(e => console.error("[ANIVERSÁRIO] Erro:", e.message));
        }
    }, 60000); // verifica a cada 1 minuto
}

// ===== VERIFICAR E CELEBRAR =====

async function checkAndCelebrate(conn) {
    try {
        const aniversariantes = getAniversariantesDoDia();

        if (aniversariantes.length === 0) {
            console.log("🎂 Nenhum aniversariante hoje.");
            return;
        }

        console.log(`🎂 ${aniversariantes.length} aniversariante(s) encontrado(s)!`);

        // Buscar todos os grupos que o bot participa
        const groups = await conn.groupFetchAllParticipating();
        const botNumber = conn.user?.id?.split(":")[0];
        const botLidNumber = conn.user?.lid?.split(":")[0];

        for (const { jid, userData } of aniversariantes) {
            const numero = jid.split("@")[0];
            const msgTexto = gerarMensagemAniversario(userData, numero);

            // Buscar foto de perfil do aniversariante
            const imgPayload = await getProfilePic(conn, jid, userData);

            // Percorrer todos os grupos
            for (const [groupId, groupData] of Object.entries(groups)) {
                const participants = groupData.participants.map(p => p.id);

                // Verificar se o aniversariante está nesse grupo
                const isInGroup = participants.some(p =>
                    p === jid || p.split("@")[0] === jid.split("@")[0]
                );

                if (!isInGroup) continue;

                // Verificar se o bot é admin (checa JID normal e LID)
                const isBotAdmin = groupData.participants.some(p => {
                    const pNum = p.id.split("@")[0];
                    const isBot = pNum === botNumber || pNum === botLidNumber;
                    return isBot && (p.admin === "admin" || p.admin === "superadmin");
                });

                try {
                    const allMembers = participants;

                    // 1. Fechar o grupo temporariamente
                    let groupWasClosed = false;
                    if (isBotAdmin) {
                        try {
                            await conn.groupSettingUpdate(groupId, "announcement");
                            groupWasClosed = true;
                            console.log(`🔒 Grupo ${groupData.subject} fechado para aniversário.`);
                        } catch (e) {
                            console.log(`⚠️ Não conseguiu fechar grupo ${groupData.subject}:`, e.message);
                        }
                    }

                    // 2. Enviar mensagem com foto
                    if (imgPayload) {
                        await conn.sendMessage(groupId, {
                            ...imgPayload,
                            caption: msgTexto,
                            mentions: [jid, ...allMembers],
                        });
                    } else {
                        await conn.sendMessage(groupId, {
                            text: msgTexto,
                            mentions: [jid, ...allMembers],
                        });
                    }

                    // 3. Reabrir o grupo após 1 minuto
                    if (groupWasClosed) {
                        const _groupIdToReopen = groupId;
                        const _groupNameToReopen = groupData.subject;
                        setTimeout(async () => {
                            try {
                                // Usar global.conn DINÂMICO — não a referência antiga
                                const _conn = global.conn;
                                if (!_conn || !_conn.sendMessage) return;
                                if (_conn.ws && _conn.ws.readyState !== undefined && _conn.ws.readyState !== 1) return;
                                await _conn.groupSettingUpdate(_groupIdToReopen, "not_announcement");
                                console.log(`🔓 Grupo ${_groupNameToReopen} reaberto após aniversário.`);
                            } catch (e) {
                                console.log("⚠️ Erro ao reabrir grupo:", e.message);
                            }
                        }, 60000); // 1 minuto
                    }

                    console.log(`🎂 Mensagem de aniversário enviada no grupo: ${groupData.subject}`);

                    // Pequena pausa entre grupos para evitar flood
                    await new Promise(r => setTimeout(r, 3000));

                } catch (groupError) {
                    console.log(`⚠️ Erro ao processar grupo ${groupId}:`, groupError.message);
                }
            }

            // Enviar mensagem privada com foto
            try {
                const msgPrivada = gerarMensagemPrivada(userData);
                if (imgPayload) {
                    await conn.sendMessage(jid, {
                        ...imgPayload,
                        caption: msgPrivada,
                    });
                } else {
                    await conn.sendMessage(jid, { text: msgPrivada });
                }
                console.log(`🎂 Mensagem privada de aniversário enviada para: ${numero}`);
            } catch (pvError) {
                console.log(`⚠️ Erro ao enviar mensagem privada para ${numero}:`, pvError.message);
            }

            // Pausa entre aniversariantes
            await new Promise(r => setTimeout(r, 5000));
        }

    } catch (error) {
        console.error("❌ Erro no sistema de aniversário:", error);
    }
}

// ===== EXPORTS =====

module.exports = {
    getAniversariantesDoDia,
    gerarMensagemAniversario,
    gerarMensagemPrivada,
    initBirthdayScheduler,
    checkAndCelebrate,
    BIRTHDAY_MESSAGES,
    SIGNO_MESSAGES,
};
