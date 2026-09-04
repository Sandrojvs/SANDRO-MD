const fs = require('fs');
const votacao = JSON.parse(fs.readFileSync('./database/func/votacao/voting.json'))

const sleep = async(ms) => {return new Promise((resolve) => setTimeout(resolve, ms))
}

const DeletarVotos = (IDGRUPO) => {
processo = votacao.indexOf(IDGRUPO)
while(processo >= 0) {
votacao.splice(processo, 1)
processo = votacao.indexOf(IDGRUPO)
}
fs.writeFileSync(`./database/func/votacao/voting.json`, JSON.stringify(votacao))
fs.unlinkSync(`./database/func/votacao/votos/${IDGRUPO}.json`)
fs.unlinkSync(`./database/func/votacao/p_votos/${IDGRUPO}.json`)
}

const AdicionarVoto = async(from, R1, R2, R3, R4, mention) => {
votacao.push(IDGRUPO)
fs.writeFileSync(`./database/func/votacao/p_votos/${IDGRUPO}.json`, `[]`)
fs.writeFileSync(`./database/func/votacao/votos/${IDGRUPO}.json`, `[]`)
fs.writeFileSync('./database/func/votacao/voting.json', JSON.stringify(votacao))
await sleep(2000)
let _votos = JSON.parse(fs.readFileSync(`./database/func/votacao/votos/${IDGRUPO}.json`))
_votos.push({razao: R1 ? R1 : '-', votos: R2.trim() + '@s.whatsapp.net', votos2: R3.trim() + '@s.whatsapp.net', duracao: R4})
fs.writeFileSync(`./database/func/votacao/votos/${IDGRUPO}.json`, JSON.stringify(_votos))
setTimeout(async function() {
let voto = JSON.parse(fs.readFileSync(`./database/func/votacao/p_votos/${IDGRUPO}.json`))
let verdade = voto.filter(V1 => V1.votacao == '01')
let falso = voto.filter(V2 => V2.votacao == '02')
if(verdade.length == falso.length) return mention(`*😱🗳️ VOTAÇÃO EMPATADA! 🗳️😱*\n• Os 2 usuários terminaram em empate, com a mesma pontuação de votos.\nEntão a decisão está na mão dos adms, se vai refazer a votação, ou decidir o ganhador de alguma forma.\n—\n• [1] Total de Votos do Usuário da Cor Vermelha ( @${_votos[0].votos.split('@')[0]} ): *${verdade.length}*\n• [2] Total de Votos do Usuário da Cor Azul ( @${_votos[0].votos2.split('@')[0]} ): *${falso.length}*`)
mention(`*❌🗳️ VOTAÇÃO ENCERRADA! 🗳️❌*\n• Soma total de todos os membros que realizaram seus votos: *${verdade.length + falso.length}*\n—\n• [1] Total de Votos do Usuário da Cor Vermelha ( @${voto[0].votos.split('@')[0]} ): *${verdade.length}*\n• [2] Total de Votos do Usuário da Cor Azul ( @${voto[0].votos2.split('@')[0]} ): *${falso.length}*\n—\n📍 Ganhador: @${verdade.length > falso.length ? _votos[0].votos.split('@')[0] : _votos[0].votos.split('@')[0]}`)
fs.unlinkSync(`../database/func/votacao/votos/${from}.json`)
fs.unlinkSync(`../database/func/votacao/p_votos/${from}.json`)
fs.writeFileSync("../database/func/votacao/voting.json", JSON.stringify(votacao))
}, R4*60*1000)
}

module.exports = {DeletarVotos,AdicionarVoto}
