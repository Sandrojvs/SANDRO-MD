
/**
 * Utilitários para tratamento de JID e LID do WhatsApp
 * Baseado na lógica da biblioteca Baileys
 */

/**
 * Normaliza um JID removendo sufixos de dispositivo (:1, :2, etc)
 * @param {string} jid 
 * @returns {string}
 */
function jidNormalizedUser(jid) {
if (!jid) return jid;
if (typeof jid !== 'string') return jid;
// Se for um JID de grupo ou newsletter, retorna como está
if (jid.endsWith('@g.us') || jid.endsWith('@newsletter')) return jid;
const [user, server] = jid.split('@');
if (!server) return jid;
const [userId] = user.split(':');
// Se o servidor for lid, mantemos como lid, mas o ideal é que o bot use s.whatsapp.net
return `${userId}@${server}`;
}

/**
 * Extrai apenas os números de um JID ou LID
 * @param {string} jid 
 * @returns {string}
 */
function jidToNumber(jid) {
if (!jid) return '';
if (typeof jid !== 'string') return '';
return jid.split('@')[0].split(':')[0];
}

/**
 * Compara dois IDs (JID ou LID) de forma segura
 * @param {string} id1 
 * @param {string} id2 
 * @returns {boolean}
 */
function areJidsSameUser(id1, id2) {
if (!id1 || !id2) return false;
if (id1 === id2) return true;
const n1 = jidToNumber(id1);
const n2 = jidToNumber(id2);
if (n1 === n2 && n1 !== '' && n1.length > 5) return true;
return normalizeId(id1) === normalizeId(id2);
}

/**
 * Função para garantir que estamos usando o JID de usuário padrão (@s.whatsapp.net)
 * Útil para quando recebemos um LID mas precisamos do JID para menções funcionarem
 */
function ensureSWAJid(jid) {
if (!jid || typeof jid !== 'string') return jid;
const [user, server] = jid.split('@');
if (server === 'lid') {
// Infelizmente não há como converter LID para JID sem uma busca no store ou contato
// Mas podemos tentar manter o JID original se ele vier de outra fonte
return jid;
}
if (!server || server === 's.whatsapp.net') {
return `${user.split(':')[0]}@s.whatsapp.net`;
}
return jid;
}

/**
 * Função legada para compatibilidade com o código existente
 */
function normalizeId(id) {
return jidNormalizedUser(id);
}

module.exports = {
jidNormalizedUser,
jidToNumber,
areJidsSameUser,
normalizeId,
ensureSWAJid
};
