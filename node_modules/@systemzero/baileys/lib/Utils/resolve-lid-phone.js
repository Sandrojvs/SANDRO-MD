// lib/Utils/resolve-lid-phone.js
// Garante a resolução de telefone real a partir de um @lid em grupo.
//
// O sharedLidPhoneCache só sabe o par LID<->telefone se a lib já tiver visto
// esse mapeamento em algum evento. A fonte mais confiável é a própria
// metadata do grupo (groupMetadata), onde o WhatsApp já entrega o par pronto
// pra cada participante. Esta função força esse fetch + registro no cache.

import { sharedLidPhoneCache } from '../WABinary/index.js';

/**
 * @param {import('../Socket/index.js').WASocket} sock
 * @param {string} groupJid
 * @param {string} lid - o @lid que você quer resolver pro telefone real
 * @returns {Promise<string|undefined>} o JID de telefone (@s.whatsapp.net), ou undefined se não achar
 */
export const resolveLidPhoneFromGroup = async (sock, groupJid, lid) => {
    // já está no cache? não precisa nem buscar metadata de novo
    const cached = sharedLidPhoneCache.getPhoneForLid(lid);
    if (cached) return cached;

    try {
        const metadata = await sock.groupMetadata(groupJid);
        // o fetch já alimenta o sharedLidPhoneCache (fix aplicado em groups.js),
        // então só precisamos ler de volta depois do fetch
        return sharedLidPhoneCache.getPhoneForLid(lid);
    } catch {
        return undefined;
    }
};
