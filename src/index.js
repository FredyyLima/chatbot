require("dotenv").config(); // deve estar logo no topo do seu index.js

const express = require("express");
const app = express();
const port = 3004;
const bodyParser = require("body-parser");
const Routers = require("../src/routes/message.routes");
const YAML = require("yamljs");
const swagger = require("swagger-ui-express");
const path = require("path");
const { connect } = require("../src/config/baileys.client");
const viagemRoutes = require('./routes/viagem.routes');
const teste = path.join(__dirname, "../src/swagger.yaml");


const swaggerDocument = YAML.load(teste);

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", Routers);
app.use("/api", swagger.serve, swagger.setup(swaggerDocument));
app.use("/", viagemRoutes);

connect();
app.listen(port, () => {
  console.log(`app rodando na porta: http://localhost:${port}/api`);
});


