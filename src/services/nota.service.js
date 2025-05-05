const Jimp = require('jimp');
const QrCode = require('qrcode-reader');
const { consultarNotaViaSefaz } = require('./nota.scraper.js');

async function lerQrCodeDaImagem(buffer) {
  return new Promise((resolve, reject) => {
    Jimp.read(buffer, (err, image) => {
      if (err) return reject("Erro ao ler imagem");
            console.log("Entrou no melhoramento da imagem")
            // 🔧 Pré-processamento para melhorar leitura
            image
            .greyscale() // converte para escala de cinza
            .contrast(0.5) // aumenta contraste
            .normalize() // normaliza cores
            .resize(800, Jimp.AUTO); // garante tamanho mínimo para leitura

      const qr = new QrCode();
      qr.callback = (erro, valor) => {
        if (erro || !valor?.result) {
          return reject("QR Code não detectado");
        }

        resolve(valor.result);
      };

      qr.decode(image.bitmap);
    });
  });
}

async function lerNotaFiscalDaImagem(buffer) {
  try {
    const notaUrl = await lerQrCodeDaImagem(buffer);
    if (!notaUrl || !notaUrl.includes('http')) {
      throw new Error('QR Code não contém uma URL válida');
    }

    const dadosNota = await consultarNotaViaSefaz(notaUrl);
    return dadosNota;
  } catch (error) {
    throw new Error(`Erro ao processar a imagem da nota fiscal: ${error.message}`);
  }
}

module.exports = {
  lerNotaFiscalDaImagem
};
