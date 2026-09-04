const FormData = require("form-data");
const FileType = require("file-type");
const fetch = require("node-fetch");
const crypto = require("crypto");
const axios = require("axios");
// const { ImageUploadService } = require('node-upload-images');

class Uploader {
  getRandomFilename(extension) {
    return `${Math.floor(Math.random() * 10000)}.${extension}`;
  }

  async pixhost(imageBuffer) {
    return new Promise((resolve, reject) => {
      try {
        const service = new ImageUploadService("pixhost.to");
        service
          .uploadFromBinary(imageBuffer, this.getRandomFilename("png"))
          .then(({ directLink }) => {
            resolve(directLink);
          })
          .catch(() => reject("Erro ao enviar para Pixhost."));
      } catch (err) {
        reject(err);
      }
    });
  }

  // Tokyo
  async catbox(content) {
    try {
      let ext = "png";
      try {
        const type = await FileType.fromBuffer(content);
        if (type && type.ext) ext = type.ext;
      } catch {}

      const formData = new FormData();
      formData.append("reqtype", "fileupload");
      formData.append("fileToUpload", content, this.getRandomFilename(ext));

      const response = await axios.post(
        "https://catbox.moe/user/api.php",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "User-Agent": this.fakeUserAgent(),
          },
        }
      );

      return response.data;
    } catch (err) {
      throw new Error(`Erro ao enviar para Catbox: ${err.message}`);
    }
  }

  fakeUserAgent() {
    const agents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64)",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }
}

module.exports = Uploader;
