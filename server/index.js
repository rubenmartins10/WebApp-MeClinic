const express = require("express");
const cors = require("cors");
const pool = require("./db"); // Importa a ligação que criaste no db.js
const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Essencial para o Req-04 e Req-07 (receber dados) [cite: 199]

// ROTA DE TESTE: Listar produtos (conforme a Figura 15 do teu relatório) [cite: 645]
app.get("/api/produtos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produtos ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro no servidor ao procurar produtos");
  }
});

app.listen(5000, () => {
  console.log("Servidor MeClinic ativo na porta 5000");
});