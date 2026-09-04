const fs = require("fs-extra")
const sabrpg = JSON.parse(fs.readFileSync("./database/usuarios/SystemRPG/sabrpg.json"));

exports.AdicionarGold = (UserID, ValorA) => {
userNumber = sabrpg.map(i => i.id).indexOf(UserID)
sabrpg[userNumber].money += Number(ValorA)
fs.writeFileSync("./database/usuarios/SystemRPG/sabrpg.json", JSON.stringify(sabrpg))
}

exports.RemoverGold = (UserID, ValorR) => {
userNumber = sabrpg.map(i => i.id).indexOf(UserID)
sabrpg[userNumber].money -= Number(ValorR)
fs.writeFileSync("./database/usuarios/SystemRPG/sabrpg.json", JSON.stringify(sabrpg))
}