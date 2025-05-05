<<<<<<< HEAD
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const path = require("path");
const { handleCommand } = require("../handlers/command.handler");
const { handleImageMessage } = require("../handlers/image.handler");
=======
const { Boom } = require("@hapi/boom"); // Utilizada para erros mais estruturados (não está sendo usada diretamente aqui)
const {
  DisconnectReason,
  useMultiFileAuthState,
  makeWASocket,
  Browsers,
} = require("@whiskeysockets/baileys"); // Baileys é a biblioteca que implementa o WhatsApp Web API
>>>>>>> 0667c1d68fa4d51ae0c9fb87e361c0e4d10d85b8

let sock = null; // variável que guarda a instância

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(path.resolve(__dirname, "../../auth"));

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify" || !messages || !messages[0]) return;
  
    const msg = messages[0];
  
    // ignora mensagens do próprio bot
    if (msg.key.fromMe) return;

    // verifica se é imagem com QR code
    if (msg.message?.imageMessage) {
      await handleImageMessage(msg, sock);
      return;
    }

    const remetente = msg.key.remoteJid;
    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
  
    console.log(`📩 Mensagem recebida de ${remetente}: ${texto}`);
  
    // Chama o handler
    await handleCommand(remetente, texto, sock);
  });
  

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.warn("⚠️ Conexão fechada. Código:", lastDisconnect?.error?.output?.statusCode);
      if (shouldReconnect) connect();
    } else if (connection === "open") {
      console.log("✅ Conexão estabelecida!");
      console.log("Número logado:", sock.user.id);
    }
  });

  return sock;
}

function getSocket() {
  return sock;
}

<<<<<<< HEAD
=======
// Função assíncrona para enviar mensagens para um número específico
const sendBailey = async (number, message) => {
  if (!sock) throw new Error("🚫 Socket não inicializado.");
  await waitForConnection(); // Aguarda a conexão ser estabelecida antes de enviar

  try {
    console.log(`📤 Enviando mensagem para ${number}... `);
    // Envia a mensagem usando o socket
    await sock.sendMessage(`55${number}@s.whatsapp.net`, { text: message });
    console.log(
      `✅ Mensagem enviada para ${number} às ${new Date().toLocaleTimeString()}`
    );
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem:", error.message || error); // Trata erros ao enviar mensagem
    throw error; // Relança o erro
  }
};

// Função para enviar uma mensagem específica para o administrador
const sendAdm = async (message) => {
  await sendBailey(5511992767398, message);
};

// Exporta as funções para uso externo
>>>>>>> 0667c1d68fa4d51ae0c9fb87e361c0e4d10d85b8
module.exports = {
  connect,
  getSocket,
};
