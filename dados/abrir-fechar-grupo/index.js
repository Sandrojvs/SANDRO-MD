const fs = require("fs")
const moment = require('moment-timezone');
const { getGroupAdmins } = require(`../../consts-func.js`)

function saveJSON(inter, caminho) {
  fs.writeFileSync(caminho, JSON.stringify(inter, null, 2));
}

const isJsonIncludes = (json, value) => {
  if (JSON.stringify(json).includes(value)) return true
  return false
}

const contar = (frase, letraProcurada) => {
  total = 0
  for (i = 0; i < frase.length; i++) {
    if (letraProcurada == frase[i]) total += 1
  }
  return total
}

const contarMin = (base_a) => {
  if (contar(String(base_a), `:`) != 1) return `É necessário o uso dos : no horário, seguindo apenas horas e minutos`
  var [a, b] = base_a.split(':')
  return Number(Number(a) * 60) + Number(b)
}

const converterMin = (base_b) => {
  if (Number(base_b) === 0) return `00:00`
  if (!Number(base_b)) return `Precisa ser um número`
  nmr = Number(base_b)
  b = nmr % 60
  a = (nmr - b) / 60
  return `${a < 10 ? `0` + a : a}:${b < 10 ? `0` + b : b}`
}

const sendHours = (formato) => {
  moment.locale("pt")
  return moment.tz('America/Sao_Paulo').format(formato)
}

const sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const ocgrouppath = `./dados/abrir-fechar-grupo/openclosegp.json`

if (!fs.existsSync(ocgrouppath)) { fs.writeFileSync(ocgrouppath, JSON.stringify([])) }

const openclosegp = JSON.parse(fs.readFileSync(ocgrouppath))

function saveOpenCloseGP() { saveJSON(openclosegp, ocgrouppath) }

function rgGroupOCfunc(from) {
  if (!isJsonIncludes(openclosegp, from)) {
    openclosegp.push({ groupId: from, horarios: [] })
    saveOpenCloseGP()
  }
}

const getGroupOpenCloseFunc = (from) => {
  caixa = []
  for (i of openclosegp) {
    if (from == i.groupId) caixa.push(i)
  }
  return caixa[0].horarios
}

function addOpenCloseGP(from, horario, adm, af = `open`) {
  if (horario.includes(`:`)) {
    a = contarMin(horario)
    b = a % 1440
    day = (a - b) / 1440
    hr = converterMin(b)
  } else {
    letra = String(horario).slice(horario.length - 1, horario.length).toLowerCase()
    if (letra == `d`) mp = 60 * 24
    else if (letra == `h`) mp = 60
    else mp = 1
    nmr = Number(String(horario).slice(0, horario.length - 1)) || 1
    nmr *= mp
    ha = contarMin(sendHours("HH:mm")) + nmr
    parte = ha % 1440
    day = (ha - parte) / 1440
    hr = converterMin(parte)
  }
  if (day == 0 && contarMin(hr) < contarMin(sendHours("HH:mm"))) {
    day += 1
  }
  grupo = getGroupOpenCloseFunc(from)
  grupo.push({ id: sendHours("DDMMYYHHmmss"), func: af, hora: hr, dias: day, save: sendHours("DD"), cobrado: false, adm: adm })
  saveOpenCloseGP()
}

const getLastOpenCloseGP = (from) => {
  grupo = getGroupOpenCloseFunc(from)
  return grupo[grupo.length - 1]
}

const isIDopenCloseGP = (from, id) => {
  grupo = getGroupOpenCloseFunc(from)
  AB = grupo.map(i => i.id).indexOf(id)
  return AB >= 0 ? true : false
}

function rmOpenCloseGP(from, id) {
  grupo = getGroupOpenCloseFunc(from)
  AB = grupo.map(i => i.id).indexOf(id)
  grupo.splice(AB, 1)
  saveOpenCloseGP()
}

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

async function ABRIR_E_FECHAR_GRUPO(blackmd) {
  try {
    if (openclosegp.length > 0) {
      for (abrir of openclosegp) {
        if (abrir.horarios.length > 0) {
          for (fechar of abrir.horarios) {
            try {
              if (fechar.dias > 0) {
                if (Number(fechar.save) !== Number(sendHours("DD"))) {
                  fechar.save = sendHours("DD")
                  fechar.dias -= 1
                  saveOpenCloseGP()
                }
              } else {
                if (contarMin(sendHours("HH:mm")) >= contarMin(fechar.hora) && !fechar.cobrado) {
                  fechar.cobrado = true
                  saveOpenCloseGP()

                  // ═══ VERIFICAR CONEXÃO ANTES DE AGIR ═══
                  if (!_isConnReady()) {
                    console.log("[ABRIR/FECHAR] Conexão indisponível, abortando operação...")
                    return
                  }

                  grupo = abrir.groupId
                  let data;
                  try {
                    data = await blackmd.groupMetadata(grupo)
                  } catch (e) {
                    console.error(`[ABRIR/FECHAR] Erro ao obter metadados do grupo ${grupo}:`, e.message)
                    data = { subject: "indefinido" }
                  }
                  AB = openclosegp.map(ab => ab.groupId).indexOf(grupo)
                  BC = openclosegp[AB].horarios.map(bc => bc.id).indexOf(fechar.id)
                  if (fechar.func == `close`) {
                    try { await blackmd.groupSettingUpdate(grupo, `announcement`) } catch (e) { console.error(`[ABRIR/FECHAR] Erro ao fechar grupo ${grupo}:`, e.message) }
                    await sleep(2500)
                    try { await blackmd.sendMessage(grupo, { text: `[❗] *O grupo ${data.subject || `"indefinido"`} foi fechado pelo ADM @${fechar.adm.split("@")[0]} em horário programado com sucesso* ❌`, mentions: [fechar.adm] }) } catch (e) { console.error(`[ABRIR/FECHAR] Erro ao enviar msg:`, e.message) }
                    if (AB >= 0 && BC >= 0) { openclosegp[AB].horarios.splice(BC, 1); saveOpenCloseGP() }
                  } else {
                    try { await blackmd.groupSettingUpdate(grupo, `not_announcement`) } catch (e) { console.error(`[ABRIR/FECHAR] Erro ao abrir grupo ${grupo}:`, e.message) }
                    await sleep(2500)
                    try { await blackmd.sendMessage(grupo, { text: `[❕] *O grupo ${data.subject || `"indefinido"`} foi aberto pelo ADM @${fechar.adm.split("@")[0]} em horário programado com sucesso* ✔`, mentions: [fechar.adm] }) } catch (e) { console.error(`[ABRIR/FECHAR] Erro ao enviar msg:`, e.message) }
                    if (AB >= 0 && BC >= 0) { openclosegp[AB].horarios.splice(BC, 1); saveOpenCloseGP() }
                  }
                }
              }
            } catch (itemErr) {
              console.error(`[ABRIR/FECHAR] Erro ao processar horário:`, itemErr.message)
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("[ABRIR/FECHAR] Erro geral:", e.message)
  }
}

// ── Scheduler independente (usa global.conn dinâmico) ──
function initAbrirFecharScheduler() {
  console.log("[ABRIR/FECHAR] Scheduler independente iniciado ✅")

  setInterval(() => {
    try {
      if (!_isConnReady()) return
      ABRIR_E_FECHAR_GRUPO(global.conn).catch(e => console.error("[ABRIR/FECHAR] Erro no scheduler:", e.message))
    } catch (e) {
      console.error("[ABRIR/FECHAR] Erro no setInterval:", e.message)
    }
  }, 30000)

  // Primeira verificação após 5s
  setTimeout(() => {
    try {
      if (!_isConnReady()) return
      ABRIR_E_FECHAR_GRUPO(global.conn).catch(e => console.error("[ABRIR/FECHAR] Erro na primeira verificação:", e.message))
    } catch (e) {
      console.error("[ABRIR/FECHAR] Erro no setTimeout:", e.message)
    }
  }, 5000)
}

module.exports = { openclosegp, saveOpenCloseGP, rgGroupOCfunc, getGroupOpenCloseFunc, addOpenCloseGP, rmOpenCloseGP, isIDopenCloseGP, ABRIR_E_FECHAR_GRUPO, getLastOpenCloseGP, initAbrirFecharScheduler }