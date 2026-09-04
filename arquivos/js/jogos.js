const fs = require('fs')

exports.palavrasANA = [
    {
      palavraOriginal: "AMOR",
      resposta: "Amor",
      dica: "É um sentimento mais profundo, duradouro e estável baseado numa relação de reciprocidade e cuidado."
    },
    {
      palavraOriginal: "BRASIL",
      resposta: "Brasil",
      dica: "Maior país da América Latina, conhecido por sua diversidade cultural."
    },    
    {
      palavraOriginal: "PORTUGAL",
      resposta: "Portugal",
      dica: "É o Estado-Nação mais antigo da Europa e um dos mais antigos do mundo."
    },
    {
      palavraOriginal: "HIDRANTE",
      resposta: "Hidrante",
      dica: "Tem como finalidade o combate ao fogo, proteção de vidas e do patrimônio."
    },
    {
      palavraOriginal: "BANANA",
      resposta: "Banana",
      dica: "Por ser um fruto partenocárpico, não possui sementes, com exceção de uma espécie vendida no mercado indonésio, a Musa balbisiana."
    },
    {
      palavraOriginal: "CIMENTO",
      resposta: "Cimento",
      dica: "É um pó fino com propriedades aglomerantes, aglutinantes ou ligantes, que se enrijece ao entrar em contato com a água."
    },
    {
      palavraOriginal: "SATURNO",
      resposta: "Saturno",
      dica: "É o segundo maior planeta do Sistema Solar, com 9 vezes o tamanho da Terra."
    },
    {
      palavraOriginal: "CAMARÃO",
      resposta: "Camarão",
      dica: "É um fruto do mar, especificando o tipo são crustáceos."
    },
    {
      palavraOriginal: "YOUTUBE",
      resposta: "YouTube",
      dica: "É um aplicativo que tem uma diversidade de vídeos e músicas."
    },
    {
      palavraOriginal: "PISTOLA",
      resposta: "Pistola",
      dica: "Modernamente podemos conceituar como arma curta, raiada, portátil."
    },
    {
      palavraOriginal: "SKATE",
      resposta: "Skate",
      dica: "É constituído uma prancha, quatro rodinhas e dois eixos que prendem as rodas."
    },
    {
      palavraOriginal: "HADES",
      resposta: "Hades",
      dica: "Mitologia, era visto como um deus insensível, impiedoso e repugnante."
    },
    {
      palavraOriginal: "PERSÉFONE",
      resposta: "Perséfone",
      dica: "Mitologia, deusa das ervas, flores, frutos e perfumes, filha de Zeus e Deméter."
    },
    {
      palavraOriginal: "PASTEL",
      resposta: "Pastel",
      dica: "É um alimento composto por uma massa à base de farinha de trigo a que se dá a forma de um envelope."      
    },
    {
      palavraOriginal: "KAMAITACHI",
      resposta: "Kamaitachi",
      dica: "É cantor e compositor Brasileiro do estado de RJ, suas músicas começaram a fazer sucesso após o lançamento de Manual do Suicidio, em 4 de janeiro de 2018."
    },
    {
      palavraOriginal: "IRACEMA",
      resposta: "Iracema",
      dica: "É um romance escrito em 1865, a virgem dos lábios de mel, que tinha os cabelos mais negros que a asas da graúna e mais longos que seu talhe de palmeira."
    },
    {
      palavraOriginal: "NETFLIX",
      resposta: "Netflix",
      dica: "Aplicativo de Streaming, a partir de R$19,90 o plano mais básico..."
    },
    {
      palavraOriginal: "GUATEMALA",
      resposta: "Guatemala",
      dica: "A cultura indígena domina o país, sobretudo no interior e essa composição torna o país diferente de seus vizinhos."
    },
    {
      palavraOriginal: "LUBA",
      resposta: "Luba",
      dica: "O criador de conteúdo produz vídeos de humor com reações, desafios e jogo, além de collabs com outros criadores de conteúdo com quem arranca muitas risadas! Atualmente o criador está com 8.8M de inscritos no aplicativo YouTube!"
    },
    {
      palavraOriginal: "SAXOFONE",
      resposta: "Saxofone",
      dica: "Instrumento Musical"
    },
    {
      palavraOriginal: "AMEIXA",
      resposta: "Ameixa",
      dica: "É uma fruta que possui alto valor nutritivo, é rica em açúcar, sais minerais (cálcio, fósforo e ferro) e algumas vitaminas."
    },
    {
      palavraOriginal: "MACEIÓ",
      resposta: "Maceió",
      dica: "É uma cidade do Brasil, a capital do estado do Nordeste e conhecida por suas praias e belezas naturais."
    },
    {
      palavraOriginal: "PANFLETOS",
      resposta: "Panfletos",
      dica: "São objetos usados para ler e geralmente são feitos de papel."
    },
    {
      palavraOriginal: "ESCOLA",
      resposta: "Escola",
      dica: "É um ambiente de formação e educação, geralmente frequentado por crianças e adolescentes."
    },
    {
      palavraOriginal: "ITÁLIA",
      resposta: "Itália",
      dica: "É um país do continente europeu, um país românico e também é conhecido por sua arte e arquitetura."
    },
    {
      palavraOriginal: "FRANÇA",
      resposta: "França",
      dica: "É um país do continente europeu, conhecido por sua moda e gastronomia."
    },
    {
      palavraOriginal: "ÓDIO",
      resposta: "Ódio",
      dica: "É um sentimento negativo e também conhecido por sua tristeza e dor."
    },
    {
      palavraOriginal: "DIABO",
      resposta: "Diabo",
      dica: "É uma divindade maligna, conhecido por sua maldade e crueldade."
    },
    {
      palavraOriginal: "DEUS",
      resposta: "Deus",
      dica: "É uma divindade suprema, conhecido por sua onipotência e onisciência."
    },
    {
      palavraOriginal: "INFERNO",
      resposta: "Inferno",
      dica: "É um lugar mitológico, conhecido por seu fogo e sofrimento."
    },
    {
      palavraOriginal: "PARAÍSO",
      resposta: "Paraíso",
      dica: "É um lugar mitológico, conhecido por sua beleza e perfeição."
    },
    {
      palavraOriginal: "ELDORADO",
      resposta: "Eldorado",
      dica: "É uma cidade mítica, conhecida por seu ouro e riquezas."
    },
    {
      palavraOriginal: "BABILÔNIA",
      resposta: "Babilônia",
      dica: "É uma cidade da Mesopotâmia, conhecida por sua riqueza e cultura."
    },
    {
      palavraOriginal: "GOMORRA",
      resposta: "Gomorra",
      dica: "É uma cidade bíblica, conhecida por sua depravação e pecado."
    },
   {
      palavraOriginal: "ALEMANHA",
      resposta: "Alemanha",
      dica: "É um país germânico do continente europeu, ele é basicamente conhecido por sua tecnologia e indústria."
    },
    {
      palavraOriginal: "SOL",
      resposta: "Sol",
      dica: "É uma estrela, a fonte de luz e calor da Terra e também conhecido por sua importância para a vida."
    },
    {
      palavraOriginal: "ESTRELA",
      resposta: "Estrela",
      dica: "É um corpo celeste luminoso, conhecido por sua beleza e variedade."
    },
    {
      palavraOriginal: "MONTANHA",
      resposta: "Montanha",
      dica: "É uma elevação do terreno, conhecida por sua beleza e majestade."
    },
    {
      palavraOriginal: "VULCANO",
      resposta: "Vulcano",
      dica: "É uma montanha que expele lava e gases, conhecida por sua força e destruição."
    },
    {
      palavraOriginal: "ANIVERSÁRIO",
      resposta: "Aniversário",
      dica: "Um momento de alegria e celebração."
    }
]

exports.showdomilhao = [
{
original: 'AMEIXA',
foto: 'https://telegra.ph/file/84928021bd4e6dfe8ff8c.jpg'
}, 
{
original: '100',
foto: 'https://telegra.ph/file/1530a82843034f1ede5d5.jpg'
}
]	

exports.quizanimais = [
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Porquinho da índia",
      original: "PORQUINHO DA ÍNDIA",
      foto: "https://telegra.ph/file/617e247a4fbb63d299198.jpg",
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Hamster",
      original: "HAMSTER",
      foto: "https://telegra.ph/file/a478979f342ac1746a645.jpg"
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Rottweiler",
      original: "ROTTWEILER",
      foto: "https://telegra.ph/file/a10ad7df6ab6a2312a1f9.jpg"
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Floppa",
      original: "FLOPPA",
      foto: "https://telegra.ph/file/7633abcd83b8a587f418d.jpg"
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Guaxinim",
      original: "GUAXINIM",
      foto: "https://telegra.ph/file/3800c7048d04a1c3dbc4e.jpg"
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Zebra",
      original: 'ZEBRA',
      foto: "https://telegra.ph/file/a08e224344e34aa916972.jpg"
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Carneiro",
      original: "CARNEIRO",
      foto: "https://telegra.ph/file/096342c8c7815ba9d83be.jpg"
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Bode",
      original: 'BODE',
      foto: 'https://telegra.ph/file/ff574a82178089f453444.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Mamute",    
      original: "MAMUTE",
      foto: "https://telegra.ph/file/00e445dde6c036a0c0df5.jpg"
    },
    {
     question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
     resposta: "Alpaca",    
     original: "ALPACA",
     foto: "https://telegra.ph/file/a201b23b179392f1cdd7f.jpg"
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Porco Espinho",    
      original: 'PORCO ESPINHO',
      foto: 'https://telegra.ph/file/7b180efc77c8ab6e9a24a.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Quokka",    
      original: 'QUOKKA',
      foto: 'https://telegra.ph/file/3042e66a22c6d0fb6e0cd.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Panda Vermelho",    
      original: 'PANDA VERMELHO',
      foto: 'https://telegra.ph/file/a6517debde47b846073cc.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Peixe Gota",
      original: "PEIXE GOTA",
      foto: "https://telegra.ph/file/e8892204b373c147bf489.jpg"
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Peixe Mandarim",
      original: "PEIXE MANDARIM",
      foto: "https://telegra.ph/file/e8892204b373c147bf489.jpg"
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Dragão de Komodo",
      original: "DRAGÃO DE KOMODO",
      foto: "https://telegra.ph/file/d4c36b449f4c781533f3c.jpg"
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Leopardo",
      original: "LEOPARDO",
      foto: "https://telegra.ph/file/0016017b9d28a3b6d027a.jpg"
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Furão",
      original: 'FURÃO',
      foto: 'https://telegra.ph/file/e352b4831db11c20a3c62.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Lebre",
      original: 'LEBRE',
      foto: 'https://telegra.ph/file/89f9a46ce660261279477.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Marreco",
      original: 'MARRECO',
      foto: 'https://telegra.ph/file/aa41bde6c4c350ec9d0d4.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Ganso",
      original: 'GANSO',
      foto: 'https://telegra.ph/file/9ab69884414feefc9c109.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Cavalo Marinho",
      original: 'CAVALO MARINHO',
      foto: 'https://telegra.ph/file/e4cee57d5b731dfffa5d8.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Crocodilo",
      original: 'CROCODILO',
      foto: 'https://telegra.ph/file/b4483f9a7077fd29a137f.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Ornitorrinco",
      original: 'ORNITORRINCO',
      foto: 'https://telegra.ph/file/8ffdd62da1834433112be.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Husky Siberiano",
      original: 'HUSKY SIBERIANO',
      foto: 'https://telegra.ph/file/07b98023259637951ba8f.jpg'
    },
    {
      question: "Qual é o animal apresentado na imagem?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Capivara",
      original: 'CAPIVARA',
      foto: 'https://telegra.ph/file/54f20cbd80737fe45a284.jpg'
    },
    {
      question: "Aqui vai um enigma: “Eu sou o rei da selva, mas sou também um predador, tenho garras afiadas e dentes fortes. O que sou?”\n• Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Leão",
      original: "LEÃO",
      foto: "https://telegra.ph/file/84ae747d96d97c030d36d.jpg"
    },
    {
      question: "Que animal é o único que pode ver a cor ultravioleta?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Abelha, têm três olhos, sendo dois grandes na frente e um pequeno no topo da cabeça. O olho pequeno é chamado de ocelos e é sensível à luz ultravioleta.",
      original: "ABELHA",
      foto: "https://telegra.ph/file/84ae747d96d97c030d36d.jpg"
    },
    {
      question: "Que animal é o maior do mundo?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Baleia azul, ela pode atingir até 30 metros de comprimento e pesar até 200 toneladas.",
      original: "BALEIA AZUL",
      foto: "https://telegra.ph/file/84ae747d96d97c030d36d.jpg"
    },
    {
      question: "Que animal é o mais inteligente do mundo?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Gorilas, eles são capazes de usar ferramentas, resolver problemas e até mesmo expressar emoções complexas.",
      original: "GORILA",
      foto: "https://telegra.ph/file/84ae747d96d97c030d36d.jpg"
    },
    {
      question: "Que animal é capaz de aprender mais de 100 palavras e frases?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Golfinho, eles são capazes de aprender e usar uma linguagem complexa, que inclui sons, gestos e até mesmo sinais.",
      original: "GOLFINHO",
      foto: "https://telegra.ph/file/84ae747d96d97c030d36d.jpg"
    },
    {
      question: "Que animal é capaz de criar ferramentas complexas, como lanças e redes?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Orangotango, são os primatas mais inteligentes do mundo. Eles são capazes de usar ferramentas de forma sofisticada, como para caçar, pescar e coletar alimentos.",
      original: "ORANGOTANGO",
      foto: "https://telegra.ph/file/84ae747d96d97c030d36d.jpg"
    },
    {
      question: "Que animal é capaz de aprender a linguagem de sinais e se comunicar com humanos?\n • Envie sua resposta abaixo, mencionando a mensagem.",
      resposta: "Chimpanzé, eles são os primatas mais próximos dos humanos. Eles são capazes de aprender a linguagem de sinais e se comunicar com humanos de forma complexa.",
      original: "CHIMPANZÉ",
      foto: "https://telegra.ph/file/84ae747d96d97c030d36d.jpg"
    },
]

exports.enigmaArchive = [
    {
        numero: "ENIGMA 1",
        respostaEne: "O FÓSFORO",
        charada: "Imagine que você está em uma sala escura ao lado de Sherlock. Nela há um fósforo, uma lâmpada de querosene, uma vela e uma lareira. O que você acenderia primeiro?"
    },
    {
        numero: "ENIGMA 2",
        respostaEne: "SEGREDO",
        charada: "O detetive Sherlock encontrou um bilhete que faz parte de uma pista de um mistério que precisa ser solucionado. “Se você me tem, quer me compartilhar; se você não me compartilha, você me manteve. O que eu sou?”"
    },
    {
        numero: "ENIGMA 3",
        respostaEne: "NENHUM",
        charada: "Watson e Sherlock adoram brincar com enigmas para treinar o método científico. Ajude-os a encontrar a resposta desse enigma: um macaco, um esquilo e um pássaro estão correndo para o topo de um coqueiro. Quem pegará a banana primeiro, o macaco, o esquilo ou o pássaro?"
    },
    {
        numero: "ENIGMA 4",
        respostaEne: "ECO",
        charada: "Eu falo, mas não tenho boca. Eu ouço, mas não tenho ouvidos. Não tenho corpo, mas vivo com o vento. Quem sou eu?"
    },
    {
        numero: "ENIGMA 5",
        respostaEne: "IDADE",
        charada: "Eu sou algo que as pessoas amam ou odeiam. Eu mudo tanto a aparência das pessoas quanto seus pensamentos. Se uma pessoa cuida de si mesma, eu subo ainda mais. Eu engano algumas pessoas. E para outras, sou um verdadeiro mistério. Algumas pessoas bem que tentam me esconder, mas uma hora, inevitavelmente, eu apareço. Não importa o que as pessoas tentem, eu jamais cairei. Quem sou eu?"
    },
    {
        numero: "ENIGMA 6",
        respostaEne: "SOMBRA",
        charada: "Tenho apenas uma cor, mas posso ter vários tamanhos. Estou presente quando faz sol. Na chuva, jamais! Passo todo o tempo no chão, mas nunca fico sujo. Não faço mal algum e não posso sentir dor. Quem sou eu?"
    },
    {
        numero: "ENIGMA 7",
        respostaEne: "12 ANOS",
        charada: "Perguntaram para Maria quantos anos ela tem. Maria respondeu que em dois anos terá o dobro da idade que ela tinha há cinco anos. Quantos anos Maria tem?"
    },
    {
        numero: "ENIGMA 8",
        respostaEne: "ESCURIDÃO",
        charada: "Quanto mais houver de mim, menos você verá. Quem sou eu?"
    },
    {
        numero: "ENIGMA 9",
        respostaEne: "ESPONJA",
        charada: "Sou cheio de buracos, mas ainda assim consigo reter muita água. Quem sou eu?"
    },
    {
        numero: "ENIGMA 9",
        respostaEne: "COTOVELO DIREITO",
        charada: "O que você pode segurar com a sua mão esquerda, mas jamais com a direita?"
    },
    {
        numero: "ENIGMA 10",
        respostaEne: "ÂNCORA",
        charada: "Quando precisa de mim, você me atira para longe, até um lugar onde ninguém pode me ver. Mas quando já não precisa mais, você me traz de volta. Quem sou eu?"
},
    {
       numero: "ENIGMA 11",
       respostaEne: "AS PALAVRAS",
       charada: "Nós podemos machucar sem fazer um único movimento. Podemos envenenar sem tocar. Carregamos a verdade e a mentira. E não devemos ser julgadas pelo nosso tamanho Quem somos nós?"
},
    {
        numero: "ENIGMA 12",
        respostaEne: "UMA TESOURA",
        charada: "Ponha os dedos nos meus olhos que eu abrirei as minhas potentes mandíbulas. E vou devorar tudo o que vier pela frente: roupas, penas, papéis. Quem sou eu?"
    },
    {
        numero: "ENIGMA 13",
        respostaEne: "ALFABETO",
        charada: "Eu posso guardar tudo dentro de mim. Tudo o que você pode imaginar: o vento, as florestas, o mundo, o universo e até Deus. Tudo o que vier à sua cabeça você pode encontrar dentro de mim. Quem sou eu?"
    },
    {
        numero: "ENIGMA 14",
        respostaEne: "DINHEIRO FALSO",
        charada: "Quem me faz não diz que faz. Quem me tem não sabe que tem. E quem sabe não me quer ter de jeito nenhum. Quem sou eu?"
    },
    {
        numero: "ENIGMA 15",
        respostaEne: "ESCURIDÃO",
        charada: "Quanto mais houver de mim, menos você verá. Quem sou eu?"
    },
    {
        numero: "ENIGMA 16",
        respostaEne: "A CONFIANÇA",
        charada: "O que pode ser quebrada, mas nunca segurada?"
    },
    {
        numero: "ENIGMA 17",
        respostaEne: "OPÇÃO",
        charada: "Se há três, você tem três. Se há duas, você tem duas. Mas se há uma, você não tem nenhuma. O que é?"
    },
    {
        numero: "ENIGMA 18",
        respostaEne: "O PADRE",
        charada: "Já casei muitas vezes, mas estou sempre solteiro. Quem sou eu?"
    },
    {
        numero: "ENIGMA 19",
        respostaEne: "JOÃO",
        charada: "A mãe do João teve cinco filhos. O primeiro se chamava Dadá, o segundo Dedé, o terceiro, Didi, e o quarto, Dodó. Como se chamava o quinto filho?"
    },
    {
        numero: "ENIGMA 20",
        respostaEne: "O CAIXÃO",
        charada: "O que é, o que é: quem faz não quer, quem compra não usa e quem usa não fica sabendo?"
    },
    {
        numero: "ENIGMA 21",
        respostaEne: "A COMIDA",
        charada: "Eu sou o que você come, Mas não o que você bebe. O que sou?"
    },    
    {
        numero: "ENIGMA 22",
        respostaEne: "UMA CANETA",
        charada: "Eu sou o que você usa para escrever, Mas não o que você usa para ler. O que sou?"
    },
    {
        numero: "ENIGMA 23",
        respostaEne: "LETRA O",
        charada: "Eu sou o começo de tudo, O fim de tudo, O que está no meio, E o que está em tudo. O que sou?"
    },
    {
        numero: "ENIGMA 24",
        respostaEne: "SER HUMANO",
        charada: "O que é que tem quatro pernas de manhã, duas pernas de tarde e três pernas de noite?"
    },    
    {
        numero: "ENIGMA 25",
        respostaEne: "O OVO",
        charada: "O que é que é redondo e branco, mas não é uma bola?"
    },    
    {
        numero: "ENIGMA 26",
        respostaEne: "A MAÇA",
        charada: "O que é que é verde por fora e vermelho por dentro?"
    },
    {
        numero: "ENIGMA 27",
        respostaEne: "O FUTURO",
        charada: "O que é que nunca está na frente, mas está sempre por trás?"
    },   
    {
        numero: "ENIGMA 28",
        respostaEne: "O VÁZIO",
        charada: "O que é que é maior do que o Universo, mas é mais leve do que uma pena?"
    },    
    {
        numero: "ENIGMA 28",
        respostaEne: "O VÁZIO",
        charada: "O que é que é maior do que o Universo, mas é mais leve do que uma pena?"
    },
    {
        numero: "ENIGMA 29",
        respostaEne: "UMA PROMESSA",
        charada: "O que é que se pode quebrar, mas nunca se pode consertar?"
    },    
    {
        numero: "ENIGMA 29",
        respostaEne: "O PRESENTE",
        charada: "O que é que é sempre jovem, mas nunca envelhece?"
    } 
]

exports.garticArchives = [
    {
      pergunta: 'Aplicativo',
      imagem: 'https://telegra.ph/file/dfa10e1cd64bfd575b26a.jpg',
      letra_inicial: 'N',
      contem_traços: '❌️️',
      resposta: 'NETFLIX'
    },
    {
      pergunta: 'Aplicativo',
      imagem: 'https://telegra.ph/file/070fbfa1cccd65681f3fa.jpg',
      letra_inicial: 'F',
      contem_traços: '❌️️',
      resposta: 'FACEBOOK'
      },
      {
      pergunta: 'Desenho',
      imagem: 'https://telegra.ph/file/1e344b9cde13d5a6c6095.jpg',
      letra_inicial: 'TO',
      contem_traços: '❌️️',
      resposta: 'TOM E JERRY'
    },
    {
      pergunta: 'Objeto',
      imagem: 'https://telegra.ph/file/af0e70ea5a92cbfc71f43.jpg',
      letra_inicial: 'GU',
      contem_traços: '✅️️️',
      resposta: 'GUARDA-CHUVA'
    },
    {
      pergunta: 'Profissão',
      imagem: 'https://telegra.ph/file/cbea80472e3d2624676a6.jpg',
      letra_inicial: 'J',
      contem_traços: '❌️️️️',
      resposta: 'JUIZ'
    },
    {
      pergunta: 'Aplicativo',
      imagem: 'https://telegra.ph/file/b5a9a0de5e222b5084a8a.jpg',
      letra_inicial: 'SN',
      contem_traços: '❌️️',
      resposta: 'SNAPCHAT'
    },
    {
      pergunta: 'Países',
      imagem: 'https://telegra.ph/file/5721a0cde0166bee675e5.jpg',
      letra_inicial: 'E',
      contem_traços: '❌️️',
      resposta: 'ESPANHA'
    },
    {
      pergunta: 'Objeto',
      imagem: 'https://telegra.ph/file/bdb05184d2d6f5a7d1ecf.jpg',
      letra_inicial: 'D',
      contem_traços: '❌️️',
      resposta: 'DARDOS'
    },
    {
      pergunta: 'Objeto',
      imagem: 'https://telegra.ph/file/317913121ec9ca6aae71b.jpg',
      letra_inicial: 'D',
      contem_traços: '❌️️',
      resposta: 'DOMINÓ'
    },
    {
      pergunta: 'Objeto',
      imagem: 'https://telegra.ph/file/63eca8c97ed165bfecfe5.jpg',
      letra_inicial: 'C',
      contem_traços: '❌️️',
      resposta: 'CANADÁ'
    },
    {
      pergunta: 'Jogos',
      imagem: 'https://telegra.ph/file/68ea5f4b182ae4c501a32.jpg',
      letra_inicial: 'X',
      contem_traços: '❌️️',
      resposta: 'XADREZ'
    },
    {
      pergunta: 'Filme',
      imagem: 'https://telegra.ph/file/a29ac8b0638d9e23bdab0.jpg',
      letra_inicial: 'A',
      contem_traços: '❌️️',
      resposta: 'A ORIGEM'
    },
    {
      pergunta: 'Filme',
      imagem: 'https://telegra.ph/file/b3e2aaca939ed0cdf7a73.jpg',
      letra_inicial: 'OS',
      contem_traços: '❌️️',
      resposta: 'OS SETE SAMURAIS'
    },
    {
      pergunta: 'Filme',
      imagem: 'https://telegra.ph/file/ab11fa68eda5abe19562b.jpg',
      letra_inicial: 'SE',
      contem_traços: '❌️️',
      resposta: 'SENHOR DOS ANÉIS'
    },
    {
      pergunta: 'Filme',
      imagem: 'https://telegra.ph/file/de030e592fecdc2cf0d20.jpg',
      letra_inicial: 'JU',
      contem_traços: '❌️️',
      resposta: 'JUMANJI'
    },
    {
      pergunta: 'Filme',
      imagem: 'https://telegra.ph/file/aafcb73c2dd10aef1bd47.jpg',
      letra_inicial: 'S',
      contem_traços: '❌️️',
      resposta: 'SONIC'
    },
    {
      pergunta: 'Série',
      imagem: 'https://telegra.ph/file/e0c905d9630bf9d36df77.jpg',
      letra_inicial: 'TH',
      contem_traços: '❌️️',
      resposta: 'THE WALKING DEAD'
    },
    {
      pergunta: 'Desenho',
      imagem: 'https://telegra.ph/file/d30cac0c8bb2159d38192.jpg',
      letra_inicial: 'SI',
      contem_traços: '❌️️',
      resposta: 'SIMPSONS'
    },
    {
      pergunta: 'Série',
      imagem: 'https://telegra.ph/file/c2a993a353fcca61242e4.jpg',
      letra_inicial: 'ST',
      contem_traços: '❌️️',
      resposta: 'STRANGER THINGS'
    },
    {
      pergunta: 'Série',
      imagem: 'https://telegra.ph/file/fac611a1d9e2c2fc14957.jpg',
      letra_inicial: 'PE',
      contem_traços: '❌️️',
      resposta: 'PEAKY BLINDERS'
    },
    {
      pergunta: 'Série - Documentário',
      imagem: 'https://telegra.ph/file/ecd17a4b75e4541bd20b8.jpg',
      letra_inicial: 'CH',
      contem_traços: '❌️️',
      resposta: 'CHERNOBYL'
    },
    {
      pergunta: 'Países',
      imagem: 'https://telegra.ph/file/05164ea8e02880f74010b.jpg',
      letra_inicial: 'C',
      contem_traços: '❌️️',
      resposta: 'CHINA'
    },
    {
      pergunta: 'Países',
      imagem: 'https://telegra.ph/file/24161e5698f3874c285eb.jpg',
      letra_inicial: 'S',
      contem_traços: '❌️️',
      resposta: 'SUÍÇA'
    },
    {
      pergunta: 'Países',
      imagem: 'https://telegra.ph/file/0207859d0fcb2c7624f1b.jpg',
      letra_inicial: 'S',
      contem_traços: '❌️️',
      resposta: 'COREIA DO SUL'
    },
    {
      pergunta: 'Países',
      imagem: 'https://telegra.ph/file/4890a8e71a7cc8d3862d0.jpg',
      letra_inicial: 'AR',
      contem_traços: '❌️️',
      resposta: 'ARGENTINA'
    },
    {
      pergunta: 'Países',
      imagem: 'https://telegra.ph/file/dfb6e013f52a018032625.jpg',
      letra_inicial: 'P',
      contem_traços: '❌️️',
      resposta: 'PORTUGAL'
    },
    {
      pergunta: 'Países',
      imagem: 'https://telegra.ph/file/8d238d4ffa865dd7009a7.jpg',
      letra_inicial: 'F',
      contem_traços: '❌️️',
      resposta: 'FRANÇA'
    }
]

exports.whatMusicAr = [
  {
    trechoMusic: "“Ela, ela tem piercing no seio\nDe onde 'cê veio? 'To interessado\n'Cê bebe, 'cê fuma, 'cê transa\nTudo isso sua amiga contou\nNão fumo, não bebo, só transo\nQuer desafiar, é só vir, amor”",
    resposta: "NOVIDADE NA ÁREA",
    artista: "MC Livinho",
    dica: "Alcança topo do Spotify com funk lento e dançante no mês de Julho."
  },
  {
    trechoMusic: "“Papai, solicito socorro, me instrua\nMe tire dessa rua escura\nFui dominado pela droga, desisti do ensino\nVeio o apocalipse sombrear o meu caminho\nDesde o início, eu já sonhava em conquistar um cargo\nCurrículo no artigo 12 'tava pegando mais fácil\nAbandonei a linha e o pipa pelo motor da Hornet\nFoi na porta do banco, o artigo 157”",
    resposta: "CRACOLÂNDIA",
    artista: "MC Ryan SP, MC Hariel, Alok, MC Davi, Salvador da Rima",
    dica: "Faz alusão à famosa rua do centro de São Paulo onde o comércio ilegal divide espaço com usuários de drogas."
  },
  {
    trechoMusic: "“Teto espelhado, cama redonda, faz o movimento\nQuarto gelado, fogo na bomba, fumaça no vento\nDe frente, de lado, por cima, por baixo, gemendo baixinho\nCom amor e com carinho”",
    resposta: "FAZ UM VUK VUK",
    artista: "Mc Kevin o Chris (part. DJ NK da Serra)",
    dica: "Música do TikTok"
  },
  {
    trechoMusic: "“Cross my heart, hope to die\nTo my lover, I'd never lie\nHe said, be true, I swear I'll try\nIn the end, it's him and I”",
    resposta: "HIM & I",
    artista: "G-Easy & Halsey",
    dica: "É uma canção de amor que mostra a conexão profunda entre dois amantes, que se comparam ao lendário casal criminoso, Bonnie e Clyde."
  },
  {
    trechoMusic: "“And every single year\nI'm drowning in my tears, I'm drowning in my tears again\nI can't seem to forget the pain I seem to give\nThe pain I seem to give, my friend\nAnd every single year\nI'm drowning in my tears, I'm drowning in my tears again\nI can't seem to forget the pain I seem to give\nThe pain I seem to give, my friend”",
    resposta: "NUMB",
    artista: "XXXTENTACION",
    dica: "A música que reflete emoções profundas, transmitindo a sensação de entorpecimento emocional e desconexão."
  },
  {
    trechoMusic: "“You were the shadow to my light\nDid you feel us?\nAnother star, you fade away\nAfraid our aim is out of sight”",
    resposta: "FADED",
    artista: "Alan Walker",
    dica: "Marcada pela voz cativante de Iselin Solheim. Lançada em 2015, tornou-se um grande sucesso internacional, conquistando milhões de ouvintes com sua melodia envolvente e letras emocionais."
  },
  {
    trechoMusic: "“Just shoot for the stars\nIf it feels right, then aim for my heart”",
    resposta: "LEVITATING",
    artista: "Dua Lipa",
    dica: "Uma jornada estelar com uma sensação pop irresistível."
   },
   {
    trechoMusic: "“Now, the day bleeds into nightfall\nAnd you're not here to get me through it all”",
    resposta: "SOMEONE YOU LOVED",
    artista: "Lewis Capaldi",
    dica: "Um mergulho profundo na emoção da saudade e solidão."
   },
   {
    trechoMusic: "“Don't show up, don't come out\nDon't start caring about me now”",
    resposta: "DON'T START NOW",
    artista: "Dua Lipa",
    dica: "Um convite a não se mostrar, não aparecer, e não começar a se importar."
   },
   {
    trechoMusic: "“I'm off the deep end, watch as I dive in\nI'll never meet the ground”",
    resposta: "SHALLOW",
    artista: "Lady Gaga, Bradley Cooper",
    dica: "Uma colaboração profunda, onde mergulhar no desconhecido é a única opção."
   },
   {
    trechoMusic: "“I'm a sucker for you\nYou say the word and I'll go anywhere blindly”",
    resposta: "SUCKER",
    artista: "Jonas Brothers",
    dica: "Ser cativado pelo pop dos Jonas Brothers, embarcando em uma jornada sem hesitação."
   },
   {
    trechoMusic: "“Quando a chuva passar, quando o tempo abrir\nAbra a janela e veja eu sou o sol”",
    resposta: "QUANDO A CHUVA PASSAR",
    artista: "Ivete Sangalo",
    dica: "Uma mensagem de renovação, onde após a tempestade, o sol se revela."
   },
   {
    trechoMusic: "“Tudo bem\nÉ só isso, não tem mais jeito\nAcabou, boa sorte”",
    resposta: "AMOR PRA RECOMEÇAR",
    artista: "Frejat",
    dica: "A resignação diante do inevitável, desejando boa sorte para o próximo capítulo."
   },
   {
    trechoMusic: "“Você não quis tentar\nE agora quer voltar, quer voltar”",
    resposta: "VAI VOLTAR",
    artista: "Roupa Nova",
    dica: "Uma história de idas e vindas, onde o retorno é ansiado, mas não garantido."
   },
   {
    trechoMusic: "“Eu quero ser pra você\nA alegria de uma chegada”",
    resposta: "CERTAS COISAS",
    artista: "Lulu Santos",
    dica: "Explorando o significado de ser a felicidade ao se encontrar."
   },
   {
    trechoMusic: "“Ela é meu amor, só me vê a mim\nA mim que vivi para encontrar\nNa luz do seu olhar\nA paz que sonhei”",
    resposta: "ELA É CARIOCA",
    artista: "Tom Jobim",
    dica: "Uma homenagem à beleza da mulher carioca, com ritmo contagiante."
   },
   {
    trechoMusic: "“Passei de nave e ela me viu\nNa rua da Água portando fuzil\nMe mama num beco um pouco distante\nMe satisfaz, 'to na onda do kunk”",
    resposta: "TIPO HOLLYWOOD",
    artista: "Mc Ws da leste, DJ CHADIN DO C, MC Cothiê",
    dica: "Faz sucesso entre os jovens no tiktok, lançada em ano de 2023."
   },
   {
    trechoMusic: "“Bola aê, brisa aê, que hoje a noite é de prazer\nFaz o que quiser fazer, pode até subir e descer\nNo papin, faz assim, vem ni-vem ni-vem ni mim\nQue-que hoje eu tô facin, tô fa-tô fa-tô facin”",
    resposta: "TÁ OK",
    artista: "Dennis DJ, Mc Kevin o Chris",
    dica: "Tá muito fácil, em que mundo você está para não saber?"
   },
   {
    trechoMusic: "“Você é tão linda, no baile eu te vi passar\nParando tudo com essa marra no olhar\nDiz que cansou dos playboy com marra de brabo\nSe eu te beijar, hoje eu dou dois tiro' pro alto”",
    resposta: "POESIA ACÚSTICA 13",
    artista: "MC Cabelinho, Luísa Sonza, Oruam, Tz da Coronel, Chefin, L7nnon, Xamã, Chris MC, …",
    dica: "Gravada a 1 ano atrás, a nova edição da série de rap acústico também conta com 13 artistas."
   },
   {
    trechoMusic: "“Diziam pra mim\nQue essa moda passou\nQue monogamia é papo de doido\nMas pra mim é uma honra\nSer uma cafona\nPra esse povo”",
    resposta: "CHICO",
    artista: "Luísa Sonza",
    dica: "Gravada a 1 ano atrás, a nova edição da série de rap acústico também conta com 13 artistas."
   },
   {
    trechoMusic: "“Você mente tão mal, finge tão mal\n'Tá na sua cara, você não me esqueceu\nMente tão mal, finge tão mal\n'Tá na (tua) sua cara, você não me esqueceu”",
    resposta: "HOTEL CARO",
    artista: "Baco Exu do Blues e Luísa Sonza",
    dica: "A canção fala sobre o fim de um relacionamento amoroso e os sentimentos que envolvem este momento."
   }  
]