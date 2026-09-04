const fs = require(`fs`);
const moment = require("moment-timezone");
const { getFileBuffer, colors, uploader } = require(`../../consts-func.js`);

const alerandom = (nmr) => {
  return Math.floor(Math.random() * nmr);
};

const isJsonIncludes = (json, value) => {
  if (JSON.stringify(json).includes(value)) return true;
  return false;
};

function saveJSON(inter, caminho) {
  fs.writeFileSync(caminho, JSON.stringify(inter, null, 2));
}

const sendHours = (formato) => {
  moment.locale("pt");
  return moment.tz("America/Sao_Paulo").format(formato);
};

const contar = (frase, letraProcurada) => {
  total = 0;
  for (i = 0; i < frase.length; i++) {
    if (letraProcurada == frase[i]) total += 1;
  }
  return total;
};

const contarMin = (base_a) => {
  if (contar(String(base_a), `:`) != 1)
    return `É necessário o uso dos : no horário, seguindo apenas horas e minutos`;
  var [a, b] = base_a.split(":");
  return Number(Number(a) * 60) + Number(b);
};

const converterMin = (base_b) => {
  if (Number(base_b) === 0) return `00:00`;
  if (!Number(base_b)) return `Precisa ser um número`;
  nmr = Number(base_b);
  b = nmr % 60;
  a = (nmr - b) / 60;
  return `${a < 10 ? `0` + a : a}:${b < 10 ? `0` + b : b}`;
};

const {
  gerarHorariosAleatorios,
  obterHorarioAtual,
  buscarHorarios,
} = require(`./horarios.js`);

const paidhourspath = `./dados/horarios/horarios.json`;

if (!fs.existsSync(paidhourspath)) {
  fs.writeFileSync(paidhourspath, JSON.stringify([]));
}

const paidHours = JSON.parse(fs.readFileSync(paidhourspath));

function savePaid() {
  saveJSON(paidHours, paidhourspath);
}

function addGroupInPaid(from) {
  if (!isJsonIncludes(paidHours, from)) {
    paidHours.push({
      groupId: from,
      start: true,
      fundoperso: false,
      url: ``,
      horarios: [],
    });
    savePaid();
  }
}

const getGroupInPaid = (from) => {
  AB = paidHours.map((i) => i.groupId).indexOf(from);
  return paidHours[AB];
};

const getIDinPaid = (from, idpaid) => {
  horarios = getGroupInPaid(from).horarios;
  AB = horarios.map((i) => i.id).indexOf(idpaid);
  return horarios[AB];
};

const isIDinPaid = (from, idpaid) => {
  horarios = getGroupInPaid(from).horarios;
  AB = horarios.map((i) => i.id).indexOf(idpaid);
  return AB >= 0 ? true : false;
};

function addPaid(from, hm) {
  addGroupInPaid(from);
  horarios = getGroupInPaid(from).horarios;
  nmr = Number(hm.slice(0, hm.length - 1));
  ini = Number(hm.slice(0, hm.length - 1));
  letra = hm.slice(hm.length - 1, hm.length).toLowerCase();
  atual =
    sendHours(`HH:`) +
    (letra == `m`
      ? String(Number(sendHours(`mm`)) - (Number(sendHours(`mm`)) % 5))
      : `00`);
  multiplicador = nmr;
  if (letra == `h`) multiplicador *= 60;
  soma = contarMin(atual) + multiplicador;
  if (soma >= 1440) {
    sobra = soma % 1440;
    dias = (soma - sobra) / 1440;
  } else {
    sobra = soma;
    dias = 0;
  }
  horarios.push({
    id: sendHours(`DDMMHHmmss`),
    tempo: converterMin(sobra),
    dias: dias,
    save: sendHours(`DD`),
    nmr: ini,
    letra: letra,
  });
  savePaid();
}

function rmPaid(from, idpaid) {
  horarios = getGroupInPaid(from).horarios;
  AB = horarios.map((i) => i.id).indexOf(idpaid);
  horarios.splice(AB, 1);
  savePaid();
}

// prepareWAMessageMedia será carregado via import() dinâmico onde necessário
let _prepareWAMessageMedia = null;
async function getPrepareWAMessageMedia() {
  if (!_prepareWAMessageMedia) {
    const baileys = await import("@whiskeysockets/baileys");
    _prepareWAMessageMedia = baileys.prepareWAMessageMedia;
  }
  return _prepareWAMessageMedia;
}

const paidgrouplinkpath = `./dados/horarios/grouplink.json`;

if (!fs.existsSync(paidgrouplinkpath)) {
  fs.writeFileSync(paidgrouplinkpath, JSON.stringify([]));
}

const groupLinkPaid = JSON.parse(fs.readFileSync(paidgrouplinkpath));

function paidSGL() {
  saveJSON(groupLinkPaid, paidgrouplinkpath);
}

async function addGroupLinkInPaid(blackmd, from) {
  if (!isJsonIncludes(groupLinkPaid, from)) {
    try {
      getftgp = await blackmd.profilePictureUrl(from, "image");
      const prepareWAMessageMedia = await getPrepareWAMessageMedia();
      upwapi = await prepareWAMessageMedia(
        { image: { url: getftgp } },
        { upload: blackmd.waUploadToServer }
      );
      getfile = await getFileBuffer(upwapi.imageMessage, `image`);
      //fs.writeFileSync(`./dados/horarios/${from}.jpg`, getfile)
      uptele = await upload(getfile);
    } catch (e) {
      //return console.log(`Não foi possível salvar a foto do grupo ${from} - ${e}`)}
      groupLinkPaid.push({
        id: from,
        foto: `https://files.catbox.moe/ydc580.jpg`,
      });
      paidSGL();
    }
  }
}

function rmGroupLinkInPaid(from) {
  AB = groupLinkPaid.map((i) => i.id).indexOf(from);
  if (AB >= 0) {
    groupLinkPaid.splice(AB, 1);
    paidSGL();
  }
}

const getInfoPaidGroupLink = (from) => {
  AB = groupLinkPaid.map((i) => i.id).indexOf(from);
  return groupLinkPaid[AB];
};

const getGroupLinkFromPaidID = (from) => {
  data = getGroupInPaid(from);
  if (isJsonIncludes(groupLinkPaid, from)) {
    if (data.fundoperso) return data.url;
    return getInfoPaidGroupLink(from).foto;
  } else {
    fotos = [
      "https://telegra.ph/file/19b26c8d215503ebe498b.jpg",
      "https://telegra.ph/file/cae53e974702d0422801b.jpg",
      "https://telegra.ph/file/e161d9cfdc7653236888f.jpg",
      "https://telegra.ph/file/a0386a144de81c21efcdd.jpg",
      "https://telegra.ph/file/bd5aac0e59f4dd2128197.jpg",
      "https://telegra.ph/file/32f100123ab5c8ffbfaab.jpg",
      "https://telegra.ph/file/122c70aece00f1f8d4487.jpg",
      "https://telegra.ph/file/44cef1af0a4449886ad3d.jpg",
      "https://telegra.ph/file/4fcd478cac376c1cbadf8.jpg",
      "https://telegra.ph/file/c4b8c2591806fcfcde654.jpg",
    ];
    return fotos[alerandom(fotos.length)];
  }
};

async function paidFunc(sabrina) {
  if (paidHours.length > 0) {
    totalpaid = 0;
    for (p of paidHours) {
      if (p.horarios.length > 0) totalpaid += 1;
    }
    if (totalpaid > 0) {
      ABC = {
        criador: `@m4thxyz_ & LICHT SAN`,
        dica: `Dica: alterne os giros entre normal e turbo, se vier um Grande Ganho, PARE e espere a próxima brecha!\n🔞NÃO INDICADO PARA MENORES🔞\nLembrando a todos!\nHorários de probabilidades aumentam muito sua chance de lucrar, mas lembrando que não anula a chance de perda, por mais que seja baixa, jogue com responsabilidade...`,
        resultado: gerarHorariosAleatorios(
          obterHorarioAtual().split(":")[0],
          0,
          59
        ),
      };
      for (a of paidHours) {
        from = a.groupId;
        if (a.horarios.length > 0 && a.start) {
          for (b of a.horarios) {
            if (b.dias <= 0) {
              if (contarMin(sendHours(`HH:mm`)) >= contarMin(b.tempo)) {
                multiplicador = b.nmr;
                if (b.letra == `h`) multiplicador *= 60;
                atual =
                  sendHours(`HH:`) +
                  (b.letra == `m`
                    ? !String(b.nmr / 5).includes(`.`)
                      ? String(
                        Number(sendHours(`mm`)) -
                        (Number(sendHours(`mm`)) % 5)
                      )
                      : sendHours(`mm`)
                    : `00`);
                soma = contarMin(atual) + multiplicador;
                if (soma >= 1440) {
                  b.tempo = converterMin(soma % 1440);
                  savePaid();
                  b.dias += (soma - (soma % 1440)) / 1440;
                  savePaid();
                } else {
                  b.tempo = converterMin(soma);
                  savePaid();
                }
                console.log(colors.white(ABC));
                sabrina.sendMessage(from, {
                  image: { url: getGroupLinkFromPaidID(from) },
                  caption: `🍀 *HORÁRIOS PAGANTES DAS ${sendHours("HH")}h* 💰

${ABC.resultado
                      .map(
                        (h) => `*${h.name}*
${h.times.map((p) => `⥲ ${p}`).join(`\n`)}`
                      )
                      .join(`\n\n`)}

${ABC.dica}`,
                  contextInfo: { forwardingScore: 999, isForwarded: true },
                });
              }
            } else {
              if (Number(sendHours(`DD`)) !== Number(b.save)) {
                b.save = sendHours(`DD`);
                savePaid();
                b.dias -= 1;
                savePaid();
              }
            }
          }
        }
      }
    }
  }
}

module.exports = {
  paidHours,
  savePaid,
  addGroupInPaid,
  getGroupInPaid,
  getIDinPaid,
  addPaid,
  rmPaid,
  isIDinPaid,
  groupLinkPaid,
  paidSGL,
  addGroupLinkInPaid,
  getGroupLinkFromPaidID,
  getInfoPaidGroupLink,
  rmGroupLinkInPaid,
  paidFunc,
};
