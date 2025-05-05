const prisma = require("../config/prisma.client");
const { exportarDespesasParaExcel } = require("../services/export.service");
const { readFile } = require("fs/promises");

const menus = {
  menu: {
    texto: `📋 *Menu Principal*:
1️⃣ Viagens
2️⃣ Cadastros
\nDigite o número ou nome da opção desejada.`,
    opcoes: {
      "1": "viagens",
      "2": "cadastros",
      "viagens": "viagens",
      "cadastros": "cadastros"
    }
  },
  viagens: {
    texto: `✈️ *Menu Viagens*:
1️⃣ Iniciar viagem
2️⃣ Registrar nota
3️⃣ Finalizar viagem
4️⃣ Consultar viagem
5️⃣ Exportar despesas
6️⃣ Editar dados da viagem
7️⃣ Voltar ao menu anterior`,
    opcoes: {
      "1": "iniciar viagem",
      "2": "registrar nota",
      "3": "finalizar viagem",
      "4": "consultar viagem",
      "5": "exportar despesas",
      "6": "editar dados da viagem",
      "7": "principal",
      "voltar": "principal"
    }
  },
  cadastros: {
    texto: `🧾 *Menu Cadastros*:
1️⃣ Editar nome
2️⃣ Editar e-mail
3️⃣ Editar empresa
4️⃣ Voltar ao menu anterior`,
    opcoes: {
      "1": "editar nome",
      "2": "editar e-mail",
      "3": "editar empresa",
      "4": "principal",
      "voltar": "principal"
    }
  }
};

async function exibirMenuAtual(sock, remetente, menuNome) {
  const menu = menus[menuNome];
  if (menu) {
    await sock.sendMessage(remetente, { text: menu.texto });
  } else {
    await sock.sendMessage(remetente, { text: "❌ Menu não encontrado." });
  }
}

async function processarComandoTexto(remetente, entrada, sock) {
  const telefone = remetente.replace(/\D/g, "");
  const usuario = await prisma.usuario.findUnique({ where: { telefone } });
  const estado = usuario.estadoAtual;
  const menuAtual = usuario.menuAtual || "menu";

  const entradaLimpa = entrada.trim().toLowerCase();

  // Processamento do fluxo de cadastro
  switch (estado) {
    case "preenchendo_nome":
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { nome: entrada, estadoAtual: "preenchendo_email" }
      });
      await sock.sendMessage(remetente, { text: "📧 Qual é o seu e-mail corporativo?" });
      return;

    case "preenchendo_email":
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { email: entrada, estadoAtual: "preenchendo_empresa" }
      });
      await sock.sendMessage(remetente, { text: "🏢 Qual é o nome da empresa?" });
      return;

    case "preenchendo_empresa":
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { empresa: entrada, estadoAtual: null }
      });
      await sock.sendMessage(remetente, {
        text: "✅ Cadastro concluído! Digite *menu* para começar."
      });
      return;

    case "aguardando_destino":
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          estadoAtual: "aguardando_centro",
          dadosTempJson: JSON.stringify({ destino: entrada })
        }
      });
      await sock.sendMessage(remetente, { text: "📌 Qual o centro de custo?" });
      return;

    case "aguardando_centro":
      const dados1 = JSON.parse(usuario.dadosTempJson || "{}");
      dados1.centroCusto = entrada;

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          estadoAtual: "aguardando_dias",
          dadosTempJson: JSON.stringify(dados1)
        }
      });
      await sock.sendMessage(remetente, { text: "🕒 Quantos dias pretende ficar?" });
      return;

    case "aguardando_dias":
      const dados2 = JSON.parse(usuario.dadosTempJson || "{}");
      dados2.dias = parseInt(entrada);

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          estadoAtual: "aguardando_confirmacao",
          dadosTempJson: JSON.stringify(dados2)
        }
      });

      await sock.sendMessage(remetente, {
        text: `📋 Resumo da sua viagem:\n\n🛬 Destino: ${dados2.destino}\n🏢 Centro de Custo: ${dados2.centroCusto}\n📅 Dias: ${dados2.dias}\n\nDeseja confirmar? (sim / não)`
      });
      return;

    case "aguardando_confirmacao":
      const dadosFinais = JSON.parse(usuario.dadosTempJson || "{}");
      if (entradaLimpa === "sim") {
        await prisma.viagem.create({
          data: {
            destino: dadosFinais.destino,
            centroCusto: dadosFinais.centroCusto,
            dias: dadosFinais.dias,
            usuarioId: usuario.id
          }
        });

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { estadoAtual: null, dadosTempJson: null }
        });

        await sock.sendMessage(remetente, {
          text: "✅ Viagem registrada com sucesso!"
        });
      } else {
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { estadoAtual: "aguardando_destino", dadosTempJson: null }
        });

        await sock.sendMessage(remetente, {
          text: "🔁 Vamos recomeçar. Qual o novo destino da sua viagem?"
        });
      }
      return;
  }

  // Verifica se digitou um número ou comando no menu atual
  const opcoes = menus[menuAtual]?.opcoes || {};
  const comando = opcoes[entradaLimpa] || entradaLimpa;

  // Se for um submenu, navega
  if (menus[comando]) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { menuAtual: comando }
    });
    await exibirMenuAtual(sock, remetente, comando);
    return;
  }

  // Comandos disponíveis em todos os menus
  if (comando === "consultar viagem") {
    const viagem = await prisma.viagem.findFirst({
      where: { usuarioId: usuario.id, status: "em_andamento" },
      include: { despesas: true },
      orderBy: { id: "desc" }
    });

    if (!viagem) {
      await sock.sendMessage(remetente, { text: "ℹ️ Nenhuma viagem em andamento." });
      return;
    }

    const total = viagem.despesas.reduce((acc, d) => acc + Number(d.valor), 0);
    const lista = viagem.despesas.map((d, i) =>
      `#${i + 1} - R$ ${d.valor.toFixed(2)} - ${d.fornecedor}`).join("\n") || "Nenhuma despesa registrada.";

    await sock.sendMessage(remetente, {
      text: `📍 *Destino:* ${viagem.destino}\n🏢 *Centro de Custo:* ${viagem.centroCusto}\n📅 *Dias:* ${viagem.dias}\n\n💸 *Despesas:*\n${lista}\n\n🔢 *Total:* R$ ${total.toFixed(2)}`
    });
    return;
  }

  if (comando === "finalizar viagem") {
    const viagem = await prisma.viagem.findFirst({
      where: { usuarioId: usuario.id, status: "em_andamento" },
      orderBy: { id: "desc" }
    });

    if (!viagem) {
      await sock.sendMessage(remetente, { text: "ℹ️ Nenhuma viagem em andamento." });
      return;
    }

    await prisma.viagem.update({
      where: { id: viagem.id },
      data: { status: "finalizada" }
    });

    await sock.sendMessage(remetente, { text: "✅ Viagem finalizada com sucesso!" });
    return;
  }

  if (comando === "exportar despesas") {
    const viagem = await prisma.viagem.findFirst({
      where: { usuarioId: usuario.id, status: "em_andamento" },
      orderBy: { id: "desc" }
    });

    if (!viagem) {
      await sock.sendMessage(remetente, { text: "ℹ️ Nenhuma viagem ativa." });
      return;
    }

    const caminhoExcel = await exportarDespesasParaExcel(viagem.id);
    const buffer = await readFile(caminhoExcel);

    await sock.sendMessage(remetente, {
      document: buffer,
      fileName: `despesas_viagem_${viagem.id}.xlsx`,
      mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    return;
  }

  if (comando === "iniciar viagem") {
    const ativa = await prisma.viagem.findFirst({
      where: { usuarioId: usuario.id, status: "em_andamento" }
    });

    if (ativa) {
      await sock.sendMessage(remetente, {
        text: "🚫 Já existe uma viagem em andamento. Finalize antes de iniciar outra."
      });
    } else {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { estadoAtual: "aguardando_destino", dadosTempJson: null }
      });

      await sock.sendMessage(remetente, {
        text: "📍 Para começar, informe o destino da viagem:"
      });
    }
    return;
  }

  if (comando === "registrar nota") {
    await sock.sendMessage(remetente, {
      text: "📸 Envie a imagem da nota fiscal para registrá-la."
    });
    return;
  }

  await sock.sendMessage(remetente, {
    text: "🤖 Comando não reconhecido. Digite *menu* para opções."
  });
}

module.exports = {
  processarComandoTexto,
  exibirMenuAtual
};
