// Importando os módulos necessários
const fetch = require("node-fetch");
const FormData = require("form-data");
const { JSDOM } = require("jsdom");

// Função para converter imagens WebP em MP4
async function webp_mp4(imageBuffer) {
  // Cria um novo objeto FormData e anexa a imagem
  let formData = new FormData();
  formData.append("new-image-url", "");
  formData.append("new-image", imageBuffer, "image.webp");

  // Faz uma solicitação POST para o site de conversão
  let response = await fetch("https://ezgif.com/webp-to-mp4", {
    method: "POST",
    body: formData,
  });

  // Obtém o HTML da resposta
  let html = await response.text();

  // Usa JSDOM para analisar o HTML
  let { document } = new JSDOM(html).window;

  // Cria um novo objeto FormData para a próxima solicitação
  let formData2 = new FormData();
  let formValues = {};

  // Obtém todos os valores de input do formulário no HTML
  for (let input of document.querySelectorAll("form input[name]")) {
    formValues[input.name] = input.value;
    formData2.append(input.name, input.value);
  }

  // Faz outra solicitação POST para obter o MP4
  let response2 = await fetch(
    "https://ezgif.com/webp-to-mp4/" + formValues.file,
    {
      method: "POST",
      body: formData2,
    }
  );

  // Obtém o HTML da segunda resposta
  let html2 = await response2.text();

  // Usa JSDOM para analisar o HTML novamente
  let { document: document2 } = new JSDOM(html2).window;

  // Retorna a URL do vídeo MP4
  return new URL(
    document2.querySelector("div#output > p.outfile > video > source").src,
    response2.url
  ).toString();
}

// Exporta a função webp_mp4
module.exports = webp_mp4;
