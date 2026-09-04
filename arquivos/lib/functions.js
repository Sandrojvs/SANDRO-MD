const fs = require('fs');
const cfonts = require("cfonts")
const moment = require("moment-timezone")
const { color } = require('./color')
const spin = require('spinnies')
const axios = require('axios')
const cheerio = require('cheerio')
const BodyForm = require('form-data')
const path = require('path')
const { tmpdir } = require('os')

// Carrega config com fallback para evitar erros se o arquivo não existir
let config = { prefix: "!" };
try {
config = JSON.parse(fs.readFileSync("./settings/settings.json"))
} catch (e) {}

const prefix = config.prefix
const prefixo = config.prefix

var corzinhas = ["red","green","yellow","blue","magenta","cyan","white","gray","redBright","greenBright","yellowBright","blueBright","magentaBright","cyanBright","whiteBright"]
const cor1 = corzinhas[Math.floor(Math.random() * (corzinhas.length))]
const cor2 = corzinhas[Math.floor(Math.random() * (corzinhas.length))]
const cor3 = corzinhas[Math.floor(Math.random() * (corzinhas.length))]
const cor4 = corzinhas[Math.floor(Math.random() * (corzinhas.length))]
const cor5 = corzinhas[Math.floor(Math.random() * (corzinhas.length))]

const getBuffer = async (url, opcoes) => {
try {
opcoes = opcoes ? opcoes : {}
const post = await axios({
method: "get",
url,
headers: {
'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 
'DNT': 1,
'Upgrade-Insecure-Request': 1
},
...opcoes,
family: 4, // Força IPv4
responseType: 'arraybuffer'
})
return post.data
} catch (erro) {
console.log(`Erro identificado: ${erro}`)
}
}

const spinner = { 
"interval": 150,
"frames": [
"S",
"SA",
"SAN",
"SANDRO",
"SANDRO-MD",
]
}

const spinner2 = { 
"interval": 150,
"frames": [" MEU CANAL : youtube.com/@sandro-bot"]
}

let globalSpinner;
let globalSpinner2;

const getGlobalSpinner = () => {
if(!globalSpinner) globalSpinner = new spin({ color: 'pink', succeedColor: 'purple', spinner});
return globalSpinner;
}

const getGlobalSpinner2 = () => {
if(!globalSpinner2) globalSpinner2 = new spin({ color: 'pink', succeedColor: 'purple', spinner2});
return globalSpinner2;
}

const spins = getGlobalSpinner()
const spins2 = getGlobalSpinner2()

const start = (id, text) => {
if (!spins.spinners[id]) {
spins.add(id, {text: text})
} else {
spins.update(id, {text: text})
}
}

const start2 = (id, text) => {
if (!spins2.spinners[id]) {
spins2.add(id, {text: text})
} else {
spins2.update(id, {text: text})
}
}

const infopd = (id, text) => {
if (spins.spinners[id]) {
spins.update(id, {text: text})
} else {
spins.add(id, {text: text})
}
}

const success = (id, text) => {
if (spins.spinners[id]) {
spins.succeed(id, {text: text})
} else {
console.log(text)
}
}

const close = (id, text) => {
if (spins.spinners[id]) {
spins.fail(id, {text: text})
} else {
console.log(text)
}
}

const getGroupAdmins = (participants) => {
let admins = []
for (let i of participants) {
if (i.admin === "admin" || i.admin === "superadmin") {
admins.push(i.id)
}
}
return admins
}

const resposta = {
espere: "💦 Aguarde...enviando ",
dono: "💦 Esse comando so pode ser usado pelo meu dono!!! ",
grupo: "💦 Esse comando só pode ser usado em grupo ",
privado: "💦 Esse comando só pode ser usado no privado ",
adm: "💦 Esse comando só pode ser usado por administradores de grupo",
botadm: " 💦 Este comando só pode ser usado quando o bot se torna administrador ",
registro: `[⚙️️] Você não se registrou utilize ${prefixo}rg para se registrar `,
norg: "[⚙️️] Você ja está registrado ",
erro: "💦 Error, tente novamente mais tarde "
}

async function webp_mp4(buffer) {
return new Promise(async (resolve, reject) => {
const pathFile = path.join(tmpdir(), `${Math.floor(Math.random() * 1000000)}.webp`)
fs.writeFileSync(pathFile, buffer)
const axiosConfig = {
headers: {
'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
},
family: 4
}
try {
const form = new BodyForm()
form.append('new-image-url', '')
form.append('new-image', fs.createReadStream(pathFile))
// Tenta o servidor principal primeiro, ele redireciona se necessário
const { data, res } = await axios.post('https://ezgif.com/webp-to-mp4', form, {
...axiosConfig,
headers: {
...axiosConfig.headers,
...form.getHeaders()
}
}).catch(async () => {
// Se falhar, tenta o s6 diretamente como fallback
return await axios.post('https://s6.ezgif.com/webp-to-mp4', form, {
...axiosConfig,
headers: {
...axiosConfig.headers,
...form.getHeaders()
}
})
})
const $ = cheerio.load(data)
const file = $('input[name="file"]').attr('value')
const token = $('input[name="token"]').attr('value')
const submit = $('input[name="convert"]').attr('value') || 'Convert WebP to MP4!'
if (!file) {
if (fs.existsSync(pathFile)) fs.unlinkSync(pathFile)
return reject(new Error("EzGif: Arquivo não aceito ou limite excedido."))
}
const form2 = new BodyForm()
form2.append('file', file)
if (token) form2.append('token', token)
form2.append('convert', submit)
// Pega a URL de ação do formulário para saber para qual servidor enviar
const action = $('form').attr('action') || `/webp-to-mp4/${file}`
const nextUrl = action.startsWith('http') ? action : `https://ezgif.com${action}`
const { data: data2 } = await axios.post(nextUrl, form2, {
...axiosConfig,
headers: {
...axiosConfig.headers,
...form2.getHeaders()
}
})
const $2 = cheerio.load(data2)
let result = $2('img#output').attr('src') || $2('video source').attr('src')
if (!result) {
if (fs.existsSync(pathFile)) fs.unlinkSync(pathFile)
return reject(new Error("EzGif: Falha na conversão final."))
}
result = result.startsWith('http') ? result : 'https:' + result
if (fs.existsSync(pathFile)) fs.unlinkSync(pathFile)
resolve(result)
} catch (err) {
if (fs.existsSync(pathFile)) fs.unlinkSync(pathFile)
reject(err)
}
})
}

module.exports = {
getBuffer,
start,
start2,
infopd,
success,
close,
getGroupAdmins,
resposta,
prefix,
prefixo,
webp_mp4
}

let file = require.resolve(__filename);
fs.watchFile(file, () => {
fs.unwatchFile(file);
console.log(`${color(`ALTERAÇÕES SALVAS ${__filename} \n ~> SANDRO`,'cyan')}`)
delete require.cache[file];
require(file);
})
