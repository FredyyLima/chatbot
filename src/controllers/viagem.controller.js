const viagemService = require('../services/viagem.service');

module.exports = {
  async criar(req, res) {
    try {
      const novaViagem = await viagemService.criarViagem(req.body);
      res.status(201).json(novaViagem);
    } catch (err) {
      res.status(400).json({ erro: err.message });
    }
  },

  async listar(req, res) {
    const viagens = await viagemService.listarViagens();
    res.json(viagens);
  },

  async buscar(req, res) {
    const viagem = await viagemService.buscarPorId(req.params.id);
    if (!viagem) return res.status(404).json({ erro: 'Viagem não encontrada' });
    res.json(viagem);
  },

  async atualizar(req, res) {
    try {
      const viagem = await viagemService.atualizarViagem(req.params.id, req.body);
      res.json(viagem);
    } catch (err) {
      res.status(400).json({ erro: err.message });
    }
  },

  async deletar(req, res) {
    try {
      await viagemService.deletarViagem(req.params.id);
      res.json({ mensagem: 'Viagem deletada com sucesso' });
    } catch (err) {
      res.status(400).json({ erro: err.message });
    }
  },
};
