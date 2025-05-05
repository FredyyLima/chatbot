const { NUMERO_AUTORIZADO } = require("../config/constants");
const prisma = require("../config/prisma.client");

async function verificarCadastroUsuario(remetente, sock, entrada = "") {
  const telefone = remetente.replace(/[^0-9]/g, "");
  let usuario = await prisma.usuario.findUnique({ where: { telefone } });

  if (!usuario) {
    usuario = await prisma.usuario.create({
      data: { telefone, estadoAtual: "preenchendo_nome" }
    });

    console.log("🆕 Usuário criado com estado preenchendo_nome");

    await sock.sendMessage(remetente, {
      text: "👋 Olá! Antes de começarmos, por favor informe seu nome completo:"
    });

    return false;
  }

  // Cadastro incompleto
  if (!usuario.nome || !usuario.email || !usuario.empresa) {
    console.log("🧾 Estado atual do usuário:", usuario.estadoAtual);

    // trata as etapas do cadastro
    const entradaLimpa = entrada.trim();

    if (usuario.estadoAtual === "preenchendo_nome") {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          nome: entradaLimpa,
          estadoAtual: "preenchendo_email"
        }
      });

      await sock.sendMessage(remetente, { text: "📧 Qual é o seu e-mail corporativo?" });
      return false;
    }

    if (usuario.estadoAtual === "preenchendo_email") {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          email: entradaLimpa,
          estadoAtual: "preenchendo_empresa"
        }
      });

      await sock.sendMessage(remetente, { text: "🏢 Qual é o nome da empresa?" });
      return false;
    }

    if (usuario.estadoAtual === "preenchendo_empresa") {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          empresa: entradaLimpa,
          estadoAtual: null
        }
      });

      await sock.sendMessage(remetente, {
        text: "✅ Cadastro concluído! Agora você pode iniciar sua viagem digitando *iniciar viagem*"
      });
      return false;
    }

    // Se por algum motivo o estado estiver fora do previsto
    if (!usuario.estadoAtual) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { estadoAtual: "preenchendo_nome" }
      });

      await sock.sendMessage(remetente, {
        text: "👋 Olá! Antes de começarmos, por favor informe seu nome completo:"
      });
    }

    return false;
  }

  return true; // Cadastro completo
}
  
  module.exports = {
    verificarCadastroUsuario
  };
  