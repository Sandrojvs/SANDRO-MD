// lib/Utils/get-name.js
// Resolve o nome do remetente com cobertura total (nunca retorna vazio).
// Ordem de prioridade:
//   1) Nome salvo localmente (store/contatos) — mais confiável
//   2) verifiedName (conta business confirmada pela Meta)
//   3) notify / pushName da própria mensagem
//   4) Nome resolvido via cache LID -> JID (se sender for @lid)
//   5) Número de telefone formatado (fallback final, nunca undefined)

import { jidDecode, isLidUser, sharedLidPhoneCache, lidToJid } from '../WABinary/jid-utils.js';

/**
 * @param {object} msg - mensagem completa do Baileys (proto.IWebMessageInfo)
 * @param {object} [contactStore] - opcional: { [jid]: { name, notify, verifiedName } }
 * @returns {string} nome final, garantido não-vazio
 */
export const getName = (msg, contactStore) => {
    try {
        const key = msg?.key || {};
        let sender = key.participant || key.remoteJid || '';

        // se vier @lid, tenta resolver pro JID real (telefone) primeiro,
        // pois o contactStore normalmente é indexado por @s.whatsapp.net
        let resolvedSender = sender;
        if (isLidUser(sender)) {
            const phone = sharedLidPhoneCache.getPhoneForLid(sender) || lidToJid(sender);
            if (phone && phone !== sender) resolvedSender = phone;
        }

        // 1) contato salvo localmente
        const contact = contactStore?.[resolvedSender] || contactStore?.[sender];
        if (contact?.name && contact.name.trim()) return contact.name.trim();

        // 2) verifiedName (conta business)
        if (contact?.verifiedName && contact.verifiedName.trim()) return contact.verifiedName.trim();

        // 3) pushName / notify da mensagem em si
        const pushName = msg?.pushName || contact?.notify;
        if (pushName && pushName.trim() && pushName.trim() !== 'WhatsApp User') {
            return pushName.trim();
        }

        // 4) fallback: número de telefone formatado a partir do JID resolvido
        const decoded = jidDecode(resolvedSender);
        if (decoded?.user) {
            return `+${decoded.user}`;
        }

        // 5) último recurso absoluto — nunca undefined/empty
        return 'Usuário desconhecido';
    } catch {
        return 'Usuário desconhecido';
    }
};
