const filteredUsers = new Map(); // chave = número, valor = timestamp

function isFiltered(sender) {
  const tempo = 5000; // 5 segundos
  if (!filteredUsers.has(sender)) return false;

  const ultimoUso = filteredUsers.get(sender);
  return (Date.now() - ultimoUso) < tempo;
}

function addFilter(sender) {
  filteredUsers.set(sender, Date.now());
}

module.exports = { isFiltered, addFilter };