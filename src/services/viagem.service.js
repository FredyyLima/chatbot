const prisma = require('../config/prisma.client');

module.exports = {
  async criarViagem(data) {
    return await prisma.viagem.create({ data });
  },

  async listarViagens() {
    return await prisma.viagem.findMany({
      include: { usuario: true, despesas: true },
    });
  },

  async buscarPorId(id) {
    return await prisma.viagem.findUnique({
      where: { id: parseInt(id) },
      include: { usuario: true, despesas: true },
    });
  },

  async atualizarViagem(id, data) {
    return await prisma.viagem.update({
      where: { id: parseInt(id) },
      data,
    });
  },

  async deletarViagem(id) {
    return await prisma.viagem.delete({
      where: { id: parseInt(id) },
    });
  },
};
