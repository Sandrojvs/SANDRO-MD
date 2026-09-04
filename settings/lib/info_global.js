exports.listLanguages = (prefix) => {
return `Você pode ver a lista de idiomas disponíveis em para usar no tradutor ou gtts aqui: https://cloud.google.com/translate/docs/languages
–
• Exemplificando o uso das funções dos comandos *gtts e tradutor*:
–
↳ *Comando:* ${prefix}gtts pt akame
*[pt]* - O idioma, o sotaque que ele(a) irá falar no áudio.
*[akame]* - Vai ser o que será o texto ou frase falado por ele(a).
–
↳ *Comando:* ${prefix}tradutor pt|love you
*[pt]* - O idioma que vai ser realizado a tradução da palavra ou texto.
*[love you]* - O texto/palavra que ele(a) vai fazer a tradução para o idioma.`
}

exports.bemvindo = (prefix) => {
return `Este comando é para informar, como você deve ativar o bem vindo, e lembrando, esse bemvindo, contém uma legenda diferente, a cada grupo que for colocado, o bemvindo2 tem essa função também.
–
• As diferenças entre os bem vindos é que o bemvindo tem foto e o bemvindo2 não contém foto em si somente a mensagem.
–
• Para desativar ou ativar o *bemvindo ou bemvindo2*, use os números 0 ou 1. 
\t• Exemplo de como ativar e desativar o recurso em seu grupo: 
\t\t• *Ativando o recurso:* ${prefix}bemvindo 1 ou ${prefix}bemvindo2 1, ative somente um dos dois para evitar flood em seu grupo.
\t\t• *Desativando o recurso:* ${prefix}bemvindo 0 ou ${prefix}bemvindo2 0, caso um dos 2 esteja ativado.
–
• Para realizar a troca do fundo da imagem do bem vindo, é só mandar uma foto no WhatsApp, retangular e marcar ela com o comando *${prefix}fundobemvindo* ou se quer trocar a do saiu, use *${prefix}fundosaiu*
\t• *Observação:* Os comandos para mudar o fundo é somente disponibilizado o uso ao proprietário(s) do bot.
–
• *Parâmetros usados que podem ser usados para personalizar sua mensagem:*
*#hora#* => Com essa definição inserida em seu argumento, irá mostrar a hora no momento exato que foi realizada a entrada ou saída do integrante do grupo.
*#nomedogp#* => Usada para mostrar o nome do grupo em seu texto de bem-vindo.
*#numerodele#* => Tem a função de mostrar o número do integrante que entrou ou saiu do grupo.
*#prefixo#* => Vai aparecer qual o símbolo que você está utilizando no bot, para fazer ele funcionar.
*#descrição#* => Com essa definição irá mostrar a descrição do grupo ou regras como você preferir chamar.
–
Para definir uma legenda de quando um integrante sair ou entrar em seu grupo, veja os exemplos baixo:
• Adicionar a legenda ou mensagem para dar as saudações ao novo integrante de forma personalizada: 
\t\t• Caso esteja usando o *bem-vindo* (com foto), use: *${prefix}legendabv sua mensagem..*
\t\t• Usando o *bem-vindo2* (sem foto)? Use *${prefix}legendabv2 sua mensagem..*
• Definir uma legenda ou mensagem para a saída de um integrante do grupo:
\t\t• Caso esteja usando o *bem-vindo* (com foto), use: *${prefix}legendasaiu sua mensagem..*
\t\t• Usando o *bem-vindo2* (sem foto)? Use *${prefix}legendasaiu2 sua mensagem..*`
}

exports.infoOwner = (prefix, NickDono, numerodn, NomeDoBot, sender) => {
return `Olá @${sender.split("@")[0]}, aqui está as informações sobre meu dono:
–
• Número do proprietário: wa.me/${numerodn}
• Proprietário: ${NickDono}`
}

exports.configbot = (prefix) => {
return `*C​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​OMO CONFIGURAR O BOT, PRA SER DONO:*
–
Primeiro ligue o bot no termux, e vá para o WhatsApp do bot em algum privado, utilize os seguintes comandos.
*Obs:* Pode por letras modificadas também se você quiser!
–
• *1)* Para alterar o nome do bot, use o seguinte comando:
\t• ${prefix}Nome-bot Nome que deseja colocar em seu bot
–
• *2)* Para alterar o nick do dono do bot, use o seguinte comando:
\t• ${prefix}Nick-dono Seu nick aqui
–
• *3)* Configure o número do dono, com o seguinte comando:
\t• ${prefix}numero-dono 5531972595934
*Obs:* O número tem que ser junto, e não pode conter o símbolo de + nem - e não pode ter o 9 da operadora, tem que ser o número idêntico ao seu do whatsapp.
–
• *4)* Configure o prefixo que você deseja no bot, usando o seguinte comando:
\t• ${prefix}prefixo-bot #
*Obs:* Pode por qualquer símbolo, se o seu símbolo for ${prefix} ele vai passar a ser # de acordo com o que você mudou.
–
Boa sorte! Dúvidas? Entre em contato com o criador, usando: *${prefix}criador*`
}

exports.infoTinderSabs = (prefix) => {
return `🌟😼 - Aprenda a como se registrar no tinder da Akame, a ideia do tinder é você encontrar um(a) parceiro(a) ou um(a) amigo(a) rainbow, sabe? O projeto foi elaborado e estruturado por *@Matheus*.
—
• *${prefix}rgtinder* -> Registre-se no tinder da Akame através deste comando, ele vai te explicar o que você deve retornar ou não.
—
• *${prefix}meutinder* -> Veja como está seu perfil atualmente no Tinder Akame.
—
• *${prefix}rolar ou ${prefix}tinder* -> Veja os participantes com este comando aqui!
—
• *${prefix}tindernome* -> Troque seu nome no nosso sistema, realizamos na hora.
—
• *${prefix}tinderidade* -> Completou ano ou quer mudar? Alteramos na mesma hora.
—
• *${prefix}setgene* -> Mudar o seu gênero que está atualmente no sistema.
—
• *${prefix}setfiltro* -> Coloque o filtro que você deseja atualmente, explicando: 1 para homens, 2 para mulheres e 3 para todos.
—
• *${prefix}setsex* -> Mude a sua sexualidade, caso ouver um erro ou você mudou...
—
• *${prefix}tinderbio* -> (Digitar a sua biografia que você deseja atualmente.
—
• *${prefix}tinderfoto* -> Marque a sua foto que você deseja para mudar no sistema.
—
• *${prefix}sairtinder* -> Caso você desejar deixar de ser incluído no tinder.`
}

exports.infoRent = (prefix) => {
return `Aqui estão as informações nescessárias para o uso de aluguéis de seu bot, leia com toda a atenção.
Por padrão o bot mantém a função do Modo Aluguel ativado em todos os grupos que ele for adicionado ou já esteja, caso você tenha instalado ele pela primeira vez. Para desativar este modo, você deve se direcionar ao grupo você deseja desativar, mas se deseja alugar, recomendo aprender como usar cada comando, estou deixando abaixo um tutorial básico de como usar cada comando do menu dono em referência ao aluguel de seu bot em grupos.
Para desativar a função no grupo aonde você não quer alugar ou registrar ele na lista de grupos alugados, use: *${prefix}modoaluguel 0*
–
• Para adicionar o grupo na lista de aluguel registrado sem gerar o código que faz o registro automático e nescessário o dono está no grupo futuramente à ser registrado no aluguel, use: *${prefix}addrent 558298.../dias*, mas caso deseja colocar este grupo sem a quantidade específica de dias, coloque 0 e automaticamente o grupo não haverá nenhuma data de expiração prévia. 
—
• Para remover dias do grupo adicionado no aluguel, use o comando (usar o comando no grupo que está registrado): *${prefix}tirarrent*
—
• Para remover o aluguel do grupo da lista, use este comando no grupo aonde você vai alugar o bot: *${prefix}delrent*, após o uso deste comando devo lembrar que o bot não irá emitir mais nenhuma função no grupo, haverá o limite de 5 tentativas em cada grupo, isto é o padrão do bot.
—
• Para liberar o uso no grupo por 24 horas como um teste basicamente, é nescessario o uso: *${prefix}cortesia24*
—
• Este comando tem a função de mostrar todos os grupos alugados registrados: *${prefix}listrent*, já este mostra top 3 de grupos que estão perto de vencer: *${prefix}lastrent*
┃│✰ ⋟ ${prefix}Codelistrent - Lista de Códigos gerados por você.
┃│✰ ⋟ ${prefix}Gerarcoderent (556596./dias)
┃│✰ ⋟ ${prefix}Delcoderent (código)
┃│✰ ⋟ ${prefix}Gerarcodecort - Gerar código de Cortesia 24horas.
`
}