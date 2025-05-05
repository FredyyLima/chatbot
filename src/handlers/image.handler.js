// handlers/imagem.handler.js

const prisma = require("../config/prisma.client");
const path = require("path");
const { writeFile } = require("fs/promises");
const { lerNotaFiscalDaImagem } = require("../services/nota.service");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { NUMERO_AUTORIZADO } = require("../config/constants");

async function handleImageMessage(msg, sock) {
  try {
    const numeroAutorizado = NUMERO_AUTORIZADO;
    const numeroDeenvio = msg.key.remoteJid;

    if (!numeroDeenvio.includes(numeroAutorizado)) return;

    const buffer = await downloadImageBuffer(msg, sock);
    if (!buffer) throw new Error("Não foi possível obter a imagem.");

    const remetente = msg.key.remoteJid;
    const telefone = remetente.replace(/[^0-9]/g, "");

    const usuario = await prisma.usuario.findUnique({ where: { telefone } });
    if (!usuario) throw new Error("Usuário não encontrado");

    const viagemAtiva = await prisma.viagem.findFirst({
      where: {
        usuarioId: usuario.id,
        status: "em_andamento"
      },
      orderBy: { id: "desc" }
    });

    if (!viagemAtiva) {
      await sock.sendMessage(remetente, {
        text: "❌ Você não possui uma viagem ativa para vincular esta nota fiscal."
      });
      return;
    }

    const nomeImagem = `nota_${Date.now()}.jpg`;
    const caminhoImagem = path.join(__dirname, "..", "public", "notas", nomeImagem);
    await writeFile(caminhoImagem, buffer);

    const nota = await lerNotaFiscalDaImagem(buffer);

    const valorLimpo = parseFloat(
      (nota.valorTotal || "").replace(",", ".").replace(/[^\d.]/g, "")
    );

    if (isNaN(valorLimpo) || valorLimpo <= 0) {
      await sock.sendMessage(remetente, {
        text: "⚠️ Não foi possível identificar o valor total da nota fiscal. Verifique se a imagem está legível e enviada corretamente."
      });
      return;
    }

    await prisma.despesa.create({
      data: {
        viagemId: viagemAtiva.id,
        usuarioId: usuario.id,
        dataHora: new Date(
          nota.dataHora.replace(
            /^(\d{2})\/(\d{2})\/(\d{4})/,
            (_, d, m, y) => `${y}-${m}-${d}`
          )
        ),
        valor: valorLimpo,
        imagem: nomeImagem,
        fornecedor: nota.razaoSocial,
        cnpj: nota.cnpj
      }
    });

    await sock.sendMessage(remetente, {
      text: `✅ Nota registrada com sucesso!\nFornecedor: ${nota.razaoSocial}\nValor: R$ ${nota.valorTotal}`,
      quoted: msg
    });
  } catch (err) {
    console.error(err);
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: `❌ Erro ao registrar nota fiscal: ${err.message || err}` },
      { quoted: msg }
    );
  }
}

async function downloadImageBuffer(msg, sock) {
  return await downloadMediaMessage(
    msg,
    "buffer",
    {},
    { logger: console, reuploadRequest: sock.updateMediaMessage }
  );
}

module.exports = { handleImageMessage };
