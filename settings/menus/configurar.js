const configbot = (prefixo) => {
   return `⚙️ *CONFIGURAR O BOT*
━━━━━━━━━━━━━━━━━

🔑 *SER DONO DO BOT*
1. Entre no WhatsApp onde o bot
   está conectado (celular/web)
2. Abra qualquer conversa
3. Digite o comando abaixo:

📌 *${prefixo}numero-dono* <seu nº>
Ex: ${prefixo}numero-dono 5531995595444
⚠️ Sem +, sem - e sem o 9 extra
O nº deve ser igual ao seu WhatsApp

💡 _Enquanto não configurar, o
próprio bot é o dono dele mesmo._

━━━━━━━━━━━━━━━━━
👥 *SUB-DONOS*
━━━━━━━━━━━━━━━━━

📌 ${prefixo}dono2 <nº> — 2º dono
📌 ${prefixo}dono3 <nº> — 3º dono
_Sub-donos têm acesso a comandos
admin mas não removem o dono._

━━━━━━━━━━━━━━━━━
✏️ *PERSONALIZAR*
━━━━━━━━━━━━━━━━━

📌 ${prefixo}nome-bot <nome>
📌 ${prefixo}nick-dono <apelido>
📌 ${prefixo}prefixo-bot <símbolo>
Ex: ${prefixo}prefixo-bot /

🖼️ *MUDAR FOTO/GIF DO MENU*
📌 ${prefixo}fotomenu — Marque uma foto

━━━━━━━━━━━━━━━━━
🔄 *ATIVAÇÕES*
━━━━━━━━━━━━━━━━━

📌 ${prefixo}modoregistro — Obrigar registro
📌 ${prefixo}aniversario — Parabéns auto
📌 ${prefixo}modogold — Economia virtual
📌 ${prefixo}status — Ver tudo ativado`
}

exports.configbot = configbot
