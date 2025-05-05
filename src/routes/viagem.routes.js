const express = require('express');
const router = express.Router();
const controller = require('../controllers/viagem.controller');

router.post('/viagens', controller.criar);
router.get('/viagens', controller.listar);
router.get('/viagens/:id', controller.buscar);
router.put('/viagens/:id', controller.atualizar);
router.delete('/viagens/:id', controller.deletar);

module.exports = router;
