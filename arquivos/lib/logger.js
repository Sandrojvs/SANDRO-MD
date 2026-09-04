const colors = require('colors');

exports.sayLog = (message) => {
  console.log(colors.bold.bgCyan.white("[SANDRO BOT  | TALK]"), message);
};

exports.inputLog = (message) => {
  console.log(colors.bold.bgMagenta.white("[SANDRO BOT  | INPUT]"), message);
};

exports.infoLog = (message) => {
  console.log(colors.bold.bgBlue.white("[SANDRO BOT  | INFO]"), message);
};

exports.successLog = (message) => {
  console.log(colors.bold.bgGreen.white("[SANDRO BOT  | SUCCESS]"), message); 
}

exports.errorLog = (message) => {
  console.log(colors.bold.bgRed.white("[SANDRO BOT  | ERROR]"), message);
};

exports.warningLog = (message) => {
  console.log(colors.bold.bgYellow.black("[SANDRO BOT  | WARNING]"), message); 
};

exports.eventLog = (type, { user, group, isGroup, date, time, content, messageType }) => {
  const eventType = colors.bold.bgBlue.white(`[ ${type.toUpperCase()} ]`);
  const location = isGroup ? `${colors.white('Grupo')}: ${colors.bold.cyan(group || 'Desconhecido')}` : `${colors.white('Privado')}`;
  const userDisplay = colors.magenta('Usuário') + `: ${colors.bold(user || 'Desconhecido')}`;
  const contentDisplay = colors.white('Conteúdo') + `: ${colors.dim(content || "N/A")}`;
  const typeDisplay = messageType ? colors.gray(`(${messageType || "Desconhecido"})`) : '';
  const dateTime = colors.white(`${date} às ${time}`);
  console.log(`${eventType} ${dateTime} | ${userDisplay} | ${location} | ${contentDisplay} ${typeDisplay}`);
};
