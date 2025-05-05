const prisma = require("../config/prisma.client");
const { sendBailey, sendAdm } = require("../config/baileys.client");
const fs = require("fs");
const path = require("path");
const { log } = require("console");
const { getSocket } = require("../config/baileys.client");

class MessageService {
  constructor() {
    this.startHour = 14; // Hora de início (7h da manhã, por exemplo)
    this.endHour = 21; // Hora de término (21h, por exemplo)
    this.delay = 1 * 60 * 1000; // 4 minutos em milissegundos (240000 ms)
  }

  async endofdayreport() {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Início do dia
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Fim do dia

    const totalMessages = await prisma.agenda.count({
      where: {
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    await sendAdm(
      `Srs, boa noite!\n\nZapbo chegou no fim do espediente.\n\nsegue o relatório do dia:\n\n*${totalMessages}* mensagens enviadas.\n\n*PRODUTO: FGTS*\n\nLembra o Guilherme de programar o envio de mensagens para amanhã.\n\n Ótima noite!`
    );
  }

  // Função para verificar se estamos dentro do horário permitido
  isWithinSchedule() {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= this.startHour && currentHour <= this.endHour;
  }

<<<<<<< HEAD
  //Valida se o número tem wpp ou não e tenta a variação com mais um 9 ou menos um 9
  limparNumero(numero) {
    return numero.replace(/\D/g, ""); // remove tudo que não for número
  }

  tentarFormatacoes(numero) {
    const tentativas = [];
  
    if (numero.length === 13 && numero[4] === '9') {
      // Ex: 5541999999999 -> tenta primeiro sem o 9
      tentativas.push(numero.slice(0, 4) + numero.slice(5)); // tira o 9
      tentativas.push(numero); // depois tenta o com 9
    }
  
    if (numero.length === 12 && numero[4] !== '9') {
      // Ex: 554188888888 -> tenta primeiro como está, depois adiciona o 9
      tentativas.push(numero);
      tentativas.push(numero.slice(0, 4) + '9' + numero.slice(4));
    }
  
    return [...new Set(tentativas)];
  }
  

  async sendToMany(destinatarios, mensagem) {
    const sock = getSocket();
    if (!sock) throw new Error("Socket WhatsApp não está conectado");

    let enviados = [];

    for (const numeroBruto of destinatarios) {
      const numeroLimpo = this.limparNumero(numeroBruto);
      const tentativas = this.tentarFormatacoes(numeroLimpo);

      let enviado = false;
      for (const tentativa of tentativas) {
        const jid = `${tentativa}@s.whatsapp.net`;
        const [check] = await sock.onWhatsApp(jid);

        if (check?.exists) {
          const resultado = await sock.sendMessage(jid, { text: mensagem });
          enviados.push({
            numeroOriginal: numeroBruto,
            usado: tentativa,
            messageId: resultado.key.id,
            status: "enviado",
          });
          enviado = true;
          break;
        }
      }

      if (!enviado) {
        enviados.push({
          numeroOriginal: numeroBruto,
          status: "não encontrado no WhatsApp",
        });
      }
=======
  async sendToMany() {
    const contatos = await prisma.user.findMany({
      where: { sended: false },
      include: { pedidos: true },
    });

    console.log("Enviando mensagens...");

    for (let contato of contatos) {
      const msg = `
      🌟 Olá! Sou a Maju, assistente da loja. 😊  
    
      👤 *${contato.nome}*, \n espero que esteja bem!  
      Me perdoe pelo horário, mas estou passando para lembrar sobre o pagamento da sua *comanda de fevereiro*.  
    
      📋 *COMANDA DE PEDIDO* 📋  
    
      📦 *Pedidos:*  
      ${contato.pedidos
        .map(
          (item) =>
            `➡️ ${item.quantidade}x ${item.produto} - R$ ${item.total},00 (Data: ${item.data})`
        )
        .join("\n")}  
    
      💰 *Total: R$ ${contato.total_comanda},00*  
    
      🔹 Para facilitar, você pode fazer o pagamento via *Pix*:  
      💳 *Chave Pix (Nubank): 11999241855*  
    
      📩 Assim que realizar o pagamento, por gentileza, envie o comprovante para agilizar a confirmação.  
    
      Obrigado pela preferência! Qualquer dúvida, estou por aqui. 😊🍬  
    
      📲 *Fique por dentro das novidades e promoções!*  
      👉 Siga a gente no Instagram: [@docinhostialulu_](https://www.instagram.com/docinhostialulu_?igsh=MW1tNDNjODdqeXp3Mg==) 🍭✨  
      👉 Entre no nosso grupo do WhatsApp e receba ofertas exclusivas: [Clique aqui](https://chat.whatsapp.com/BvgnLYXjYaR8ek68dMeGvK) 💬🎁  
    `;
      const msg_cobranca = ` 🌟 Olá! Sou a Maju, assistente da loja. 😊

👤 ${contato.nome}, espero que esteja bem!

Passando para lembrar que ainda não identificamos o pagamento da sua comanda de fevereiro. Caso já tenha feito, poderia nos encaminhar o comprovante, por favor?

💰 Valor total: R$ ${contato.total_comanda}

Para facilitar, você pode fazer o pagamento via Pix:
💳 Chave Pix (Nubank): 11999241855

Se precisar de algo ou tiver qualquer dúvida, estou à disposição. Agradecemos a preferência! 😊🍬`;

      await sendBailey(contato.telefone, msg)
        .then(async () => {
          await prisma.user.update({
            where: { id: contato.id },
            data: { sended: true },
          });
        })
        .catch((error) => {
          console.log("Erro ao enviar mensagem:", error);
        });

      // Espera 4 minutos antes de enviar a próxima mensagem
      await new Promise((resolve) => setTimeout(resolve, this.delay));

      // if (!this.isWithinSchedule()) {
      //   console.log("por hoje deu...");
      //   // await this.endofdayreport();
      //   break;
      // }
>>>>>>> 0667c1d68fa4d51ae0c9fb87e361c0e4d10d85b8
    }

    return enviados;
  }
<<<<<<< HEAD
  
=======

  async sendToOne(telefone, msg) {
    await sendBailey(telefone, msg)
      .then(async () => {
        
      })
      .catch((error) => {
        console.log("Erro ao enviar mensagem:", error);
      });
  }
>>>>>>> 0667c1d68fa4d51ae0c9fb87e361c0e4d10d85b8
}

module.exports = MessageService;
