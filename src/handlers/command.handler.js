const { processarComandoTexto } = require("./menu.handler");
const { verificarCadastroUsuario } = require("../middlewares/autenticacao");
const { NUMERO_AUTORIZADO } = require("../config/constants");

async function handleCommand(remetente, texto, sock) {
  console.log("📩 Mensagem recebida de:", remetente);

  const telefone = remetente.replace(/[^0-9]/g, "");

  if (telefone !== NUMERO_AUTORIZADO || !texto) {
    console.log("🚫 Número não autorizado ou mensagem vazia");
    return;
  }

  const cadastroOk = await verificarCadastroUsuario(remetente, sock, texto);

  console.log("✅ Cadastro verificado:", cadastroOk);

  if (!cadastroOk) return;

  await processarComandoTexto(remetente, texto.trim(), sock);
}


module.exports = { handleCommand };
