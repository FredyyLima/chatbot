const puppeteer = require('puppeteer');
const puppeteerstealth = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteerstealth.use(StealthPlugin());



async function consultarNotaViaSefaz(url) {
  const browser = await puppeteer.launch({ headless: false,  defaultViewport: null,
    args: ["--start-maximized"] });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 1100000 });
    console.log("🌐 URL final:", page.url());
    // Aguarda conteúdo principal carregar
    await page.waitForSelector('#conteudo', { timeout: 100000 });

    const dados = await page.evaluate(() => {
      const razaoSocial = document.querySelector('#u20')?.innerText?.trim() || null;

      const linhas = Array.from(document.querySelectorAll('*'))
        .map(e => e.innerText)
        .filter(t => t?.trim())
        .join('\n')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      let cnpj = null;
      let dataHora = null;
      let valorTotal = null;

      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];

        if (!cnpj && linha.includes('CNPJ:')) {
          const match = linha.match(/CNPJ:\s*([\d\.\/-]+)/);
          if (match) cnpj = match[1];
        }

        if (!dataHora && linha.includes('Emissão:')) {
          const match = linha.match(/Emissão:\s*([\d\/: ]+)/);
          if (match) dataHora = match[1];
        }

        if (!valorTotal && linha === 'Valor a pagar R$:') {
          const proximaLinha = linhas[i + 1];
          if (proximaLinha) valorTotal = proximaLinha.replace(',', '.').trim();
        }
      }

      return {
        razaoSocial,
        cnpj,
        dataHora,
        valorTotal
      };
    });

    await browser.close();
    return dados;
  } catch (error) {
    await browser.close();
    throw new Error(`Erro ao consultar nota na SEFAZ: ${error.message}`);
  }
}

module.exports = {
  consultarNotaViaSefaz,
};
