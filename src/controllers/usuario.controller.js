const prisma = require("../config/prisma.client");

async function tratarCadastroUsuario(estado, entrada, usuario, sock, remetente) {
  if (estado === "preenchendo_nome") {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        nome: entrada,
        estadoAtual: "preenchendo_email"
      }
    });
    await sock.sendMessage(remetente, { text: "📧 Qual é o seu e-mail corporativo?" });
    return;
  }

  if (estado === "preenchendo_email") {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        email: entrada,
        estadoAtual: "preenchendo_empresa"
      }
    });
    await sock.sendMessage(remetente, { text: "🏢 Qual é o nome da empresa?" });
    return;
  }

  if (estado === "preenchendo_empresa") {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        empresa: entrada,
        estadoAtual: null
      }
    });
    await sock.sendMessage(remetente, {
      text: "✅ Cadastro concluído! Agora você pode iniciar sua viagem digitando *iniciar viagem*"
    });
    return;
  }
}

module.exports = {
  tratarCadastroUsuario
};
