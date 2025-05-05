const express = require("express");
const Controller = require("../controllers/message.controller");
const router = express.Router();
const messageController = new Controller();

router.post("/", async (req, res) => {
    try {
      const result = await messageController.create_user(req.body); // pega os dados do corpo
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ erro: error.message });
    }
  });
  
router.post("/sendToMany", messageController.sendToMany);


module.exports = router;
