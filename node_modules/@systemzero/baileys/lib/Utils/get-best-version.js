// lib/Utils/get-best-version.js
//
// fetchLatestWaWebVersion() e fetchLatestBaileysVersion() SEMPRE retornam um
// objeto com `version` preenchido, mesmo quando a busca falha — nesse caso
// devolvem isLatest:false e um valor antigo fixo embutido na lib. Checar só
// `if (result.version)` nunca detecta a falha, porque version sempre existe.
//
// Este helper tenta as duas fontes, na ordem, e só aceita um resultado se
// `isLatest === true` (ou seja, se realmente buscou fresco da rede). Só cai
// no valor fixo antigo se AMBAS as fontes falharem de verdade.

import { fetchLatestWaWebVersion } from './generics.js';
import { fetchLatestBaileysVersion } from './generics.js';

/**
 * @param {object} [options] - passado direto pras duas funções de fetch
 * @returns {Promise<{ version: number[], isLatest: boolean, source: string }>}
 */
export const getBestWaVersion = async (options = {}) => {
    try {
        const web = await fetchLatestWaWebVersion(options);
        if (web?.isLatest && web?.version) {
            return { version: web.version, isLatest: true, source: 'web.whatsapp.com' };
        }
    } catch {
        // segue pra próxima fonte
    }

    try {
        const github = await fetchLatestBaileysVersion(options);
        if (github?.isLatest && github?.version) {
            return { version: github.version, isLatest: true, source: 'github' };
        }
    } catch {
        // segue pro fallback fixo
    }

    // as duas fontes falharam de verdade — usa o valor fixo embutido,
    // mas avisa explicitamente que NÃO é a versão mais atual
    return { version: [2, 3000, 1027934701], isLatest: false, source: 'fallback-fixo' };
};
