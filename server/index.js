const express = require("express");
const cors = require("cors");
const pool = require("./db"); // Importa a ligação que criaste no db.js
const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Essencial para receber dados do formulário

// 1. LISTAR (GET) - Conforme a Figura 15 do teu relatório
app.get("/api/produtos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produtos ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro no servidor ao procurar produtos");
  }
});

// 2. CRIAR (POST) - Req-04: Adicionar novo material
app.post("/api/produtos", async (req, res) => {
  try {
    const { nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, categoria_id } = req.body;
    const newProduct = await pool.query(
      "INSERT INTO produtos (nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, categoria_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, categoria_id || 1]
    );
    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro ao guardar o produto");
  }
});

// 3. EDITAR (PUT) - Req-05: Atualizar informações de stock
app.put("/api/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, codigo_barras, stock_atual, stock_minimo, unidade_medida } = req.body;
    await pool.query(
      "UPDATE produtos SET nome = $1, codigo_barras = $2, stock_atual = $3, stock_minimo = $4, unidade_medida = $5 WHERE id = $6",
      [nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, id]
    );
    res.send("Produto atualizado com sucesso!");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro ao editar o produto");
  }
});

// 4. APAGAR (DELETE) - Remover item do inventário
app.delete("/api/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM produtos WHERE id = $1", [id]);
    res.send("Produto removido!");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro ao apagar o produto");
  }
});

app.listen(5000, () => {
  console.log("Servidor MeClinic ativo na porta 5000");
});