const fs = require(`fs`)

const { saveJSON, sendHours, identArroba, contarMin, alerandom, converterMin } = require(`../../config.js`)

const sortepath = `./dados/horarios/sorte.json`

if(!fs.existsSync(sortepath)) {fs.writeFileSync(sortepath, JSON.stringify([]))}

const sorte = JSON.parse(fs.readFileSync(sortepath))

function saveSorte() {saveJSON(sorte, sortepath)}

function sorteFunc(blackmd, info, valor, text) {
    from = info.key.remoteJid
    sender = info.key.participant
    letra = valor.slice(valor.length - 1, valor.length).toLowerCase()
    nmr = Number(valor.toLowerCase().split(letra)[0])
    soma = nmr
    if(letra == "h") soma *= 60
    if(letra == "d") soma *= 60 * 24
    menc = []
    for(t of text.split(" ")) {if(t.includes("@")) menc.push(identArroba(t))}
    primeira = alerandom(100)
    porcentagem = alerandom(45) + (primeira < 80 ? 55 : 0)
    msg = [
        {minimo: 0, dica: `Suas chances não condizem com um jogo considerável... Recomendo tentar novamente mais tarde`},
        {minimo: 10, dica: `Suas chances estão extremamente baixas... Tenha cuidado em seus giros para não perder muitos pontos`},
        {minimo: 25, dica: `Suas chances estão boas... Porém, tenha cuidado, não temos garantias de bons ganhos`},
        {minimo: 50, dica: `Suas chances parecem estar meio a meio... É bom arriscar, porque ou você ganha, ou você perde`},
        {minimo: 60, dica: `Suas chances estão muito boas... Se sente otimista para jogar?`},
        {minimo: 90, dica: `Suas chances estão incríveis... Você pode jogar, mas sempre com cautela, porque os números podem mudar`},
    ]
    getmsg = []
    msg.forEach(m => {
        if(porcentagem > m.minimo) getmsg.push(m.dica)
    });
    txt = text.replace(`#sorte#`, String(porcentagem) + `%`).replace(`#dica#`, getmsg.reverse()[0])
    function sendMess() {blackmd.sendMessage(from, {text: txt, mentions: menc}, {quoted: info})}
    AB = sorte.map(i => i.id).indexOf(sender)
    if(AB < 0) {
        sorte.push({id: sender, tempo: {hora: sendHours("HH:mm"), dia: sendHours("DD")}, insi: 2})
        saveSorte()
        sendMess()
    } else {
        if((contarMin(sendHours("HH:mm")) + (Number(sendHours("DD")) !== Number(sorte[AB].tempo.dia) ? 1440 : 0)) >= (contarMin(sorte[AB].tempo.hora) + soma)) {
            sorte[AB].tempo.hora = sendHours("HH:mm")
            sorte[AB].tempo.dia = sendHours("DD")
            saveSorte()
            sendMess()
        } else {
            if(sorte[AB].insi > 0) {
                sorte[AB].insi -= 1
                saveSorte()
            } else {
                sorte[AB].insi = 5
                saveSorte()
                resto = converterMin((contarMin(sorte[AB].tempo.hora) + soma) - (contarMin(sendHours("HH:mm")) + (Number(sendHours("DD")) !== Number(sorte[AB].tempo.dia) ? 1440 : 0)))
                console.log(`soma: `, soma)
                console.log(`resto: `, resto)
                let [horas, minutos] = resto.split(`:`)
                fim = `${Number(horas) > 0 ? `${horas} hora${Number(horas) !== 1 ? `s` : ``} e ` : ``}${minutos} minuto${Number(minutos) !== 1 ? `s` : ``}`
                blackmd.sendMessage(from, {text: `Ei malandrinho você já consultou sua sorte recentemente... E poderá fazer uma nova consulta em ${fim} 😊`}, {quoted: info})
            }
        }
    }
}

module.exports = { sorte, saveSorte, sorteFunc }