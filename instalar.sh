#!/bin/bash

# ===============================
# 🎨 CORES
# ===============================
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
PURPLE='\033[1;35m'
CYAN='\033[1;36m'
WHITE='\033[1;37m'
RESET='\033[0m'

# ===============================
# ⏳ FUNÇÕES
# ===============================
loading() {
  msg=$1
  echo -ne "${CYAN}$msg${RESET}"
  for i in {1..3}; do
    sleep 0.5
    echo -ne "."
  done
  echo ""
}

barra() {
  echo -ne "${GREEN}["
  for i in {1..30}; do
    echo -ne "█"
    sleep 0.02
  done
  echo -e "]${RESET}"
}

clear

# ===============================
# 🚀 BANNER
# ===============================
echo -e "${GREEN}"
echo "███████╗ █████╗ ███╗   ██╗██████╗ ██████╗  ██████╗     ███╗   ███╗██████╗"
echo "██╔════╝██╔══██╗████╗  ██║██╔══██╗██╔══██╗██╔═══██╗    ████╗ ████║██╔══██╗"
echo "███████╗███████║██╔██╗ ██║██║  ██║██████╔╝██║   ██║    ██╔████╔██║██║  ██║"
echo "╚════██║██╔══██║██║╚██╗██║██║  ██║██╔══██╗██║   ██║    ██║╚██╔╝██║██║  ██║"
echo "███████║██║  ██║██║ ╚████║██████╔╝██║  ██║╚██████╔╝    ██║ ╚═╝ ██║██████╔╝"
echo "╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝     ╚═╝     ╚═╝╚═════╝ "
echo -e "${RESET}"

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}🚀 Instalação do ${GREEN}SANDRO MD${CYAN} está começando${RESET}"
echo -e "${GREEN}⏳ Aguarde, isso pode levar alguns minutos...${RESET}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
sleep 3

# ===============================
# 📦 INSTALAÇÃO
# ===============================
loading "🔧 apt-get upgrade"
apt-get upgrade
barra

loading "🔄 apt-get update"
apt-get update
barra

loading "⬆️ apt upgrade -y"
apt upgrade -y
barra

loading "🔁 apt update -y"
apt update -y
barra

loading "🚩 Instalando NodeJS"
apt install nodejs -y
barra

loading "🚩 Instalando NodeJS LTS"
apt install nodejs-lts -y
barra

loading "🚩 Instalando FFmpeg"
apt install ffmpeg -y
barra

loading "⬇️ Instalando Wget"
apt install wget -y
barra

loading "📂 Instalando Git"
apt install git -y
barra

loading "📦 pkg update && pkg upgrade"
pkg update && pkg upgrade -y
barra

loading "🚩 pkg install ffmpeg"
pkg install ffmpeg -y
barra

# ===============================
# 🎉 FINALIZAÇÃO
# ===============================
echo -e "${GREEN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ INSTALAÇÃO FINALIZADA COM SUCESSO!"
echo "🤖 SANDRO MD PRONTO PARA USO"
echo "🚀 INICIANDO O BOT..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${RESET}"
sleep 2

npm start