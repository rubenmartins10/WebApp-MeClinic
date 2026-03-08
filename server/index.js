const express = require("express");
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy"); 
const QRCode = require("qrcode");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// --- AUTENTICAÇÃO E MFA ---
// ==========================================

app.post("/api/register", async (req, res) => {
  try {
    const { nome, email, password } = req.body;
    
    const userExists = await pool.query("SELECT * FROM utilizadores WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Já existe uma conta com este email." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const secret = speakeasy.generateSecret({ name: `MeClinic (${email})` });

    const newUser = await pool.query(
      "INSERT INTO utilizadores (nome, email, password_hash, mfa_enabled, mfa_secret, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nome, email, role",
      [nome, email, password_hash, true, secret.base32, 'ADMIN']
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ message: "Conta criada com sucesso!", user: newUser.rows[0], qrCodeUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;
    const userResult = await pool.query("SELECT * FROM utilizadores WHERE email = $1", [email]);
    
    if (userResult.rows.length === 0) return res.status(401).json({ error: "Email ou palavra-passe incorretos." });

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: "Email ou palavra-passe incorretos." });

    if (user.mfa_enabled) {
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: mfaToken
      });
      if (!verified) return res.status(401).json({ error: "Código MFA inválido." });
    }

    res.json({ 
      message: "Login bem-sucedido", 
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role } 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro no servidor ao iniciar sessão." });
  }
});

// --- PRODUTOS ---
// --- PRODUTOS ---
app.get("/api/produtos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produtos ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Criar novo produto
app.post("/api/produtos", async (req, res) => {
  const { nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, categoria_id, imagem_url } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO produtos (nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, categoria_id, imagem_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [nome, codigo_barras || null, stock_atual || 0, stock_minimo || 5, unidade_medida || 'un', categoria_id || null, imagem_url || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar produto existente (ou adicionar stock)
app.put("/api/produtos/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, imagem_url } = req.body;
  try {
    await pool.query(
      "UPDATE produtos SET nome=$1, codigo_barras=$2, stock_atual=$3, stock_minimo=$4, unidade_medida=$5, imagem_url=$6 WHERE id=$7",
      [nome, codigo_barras || null, stock_atual, stock_minimo, unidade_medida, imagem_url || '', id]
    );
    res.json({ message: "Produto atualizado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apagar produto
app.delete("/api/produtos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM produtos WHERE id = $1", [req.params.id]);
    res.json({ message: "Produto removido!" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao apagar produto." });
  }
});

// --- CONSULTAS ---
app.get('/api/consultas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, p.nome as paciente_nome, c.data_consulta, c.hora_consulta, c.motivo, m.nome as procedimento_nome
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN modelos_procedimento m ON c.procedimento_id = m.id
      WHERE c.data_consulta >= CURRENT_DATE 
      ORDER BY c.data_consulta ASC, c.hora_consulta ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/consultas', async (req, res) => {
  const { nome, telefone, data, hora, motivo, procedimento_id } = req.body;
  try {
    let paciente = await pool.query("SELECT id FROM pacientes WHERE nome = $1", [nome]);
    let pId = paciente.rows.length === 0 
      ? (await pool.query("INSERT INTO pacientes (nome, telefone) VALUES ($1, $2) RETURNING id", [nome, telefone])).rows[0].id
      : paciente.rows[0].id;
    
    const novaC = await pool.query(
      "INSERT INTO consultas (paciente_id, data_consulta, hora_consulta, motivo, procedimento_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [pId, data, hora, motivo, procedimento_id || null]
    );
    res.json(novaC.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao marcar consulta" });
  }
});

// ==========================================
// --- FICHAS TÉCNICAS E PROCEDIMENTOS ---
// ==========================================

app.get('/api/modelos-procedimento', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM modelos_procedimento ORDER BY nome ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/modelos-procedimento', async (req, res) => {
  const { nome } = req.body;
  try {
    const novo = await pool.query("INSERT INTO modelos_procedimento (nome, custo_total_estimado) VALUES ($1, 0) RETURNING *", [nome]);
    res.json(novo.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar procedimento." });
  }
});

app.get('/api/modelos-procedimento/:id/itens', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM modelo_procedimento_itens WHERE modelo_id = $1 ORDER BY id ASC", [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/modelos-procedimento/:id", async (req, res) => {
  const { id } = req.params;
  const { itens, custo_total } = req.body;
  try {
    await pool.query("BEGIN");
    await pool.query("UPDATE modelos_procedimento SET custo_total_estimado = $1 WHERE id = $2", [custo_total, id]);

    const idsManter = itens.filter(i => !String(i.id).startsWith("temp-")).map(i => parseInt(i.id));
    if (idsManter.length > 0) {
      await pool.query("DELETE FROM modelo_procedimento_itens WHERE modelo_id = $1 AND id <> ALL($2::int[])", [id, idsManter]);
    } else {
      await pool.query("DELETE FROM modelo_procedimento_itens WHERE modelo_id = $1", [id]);
    }

    for (let item of itens) {
      if (String(item.id).startsWith("temp-")) {
        await pool.query("INSERT INTO modelo_procedimento_itens (modelo_id, nome_item, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)", [id, item.nome_item, item.quantidade, item.preco_unitario]);
      } else {
        await pool.query("UPDATE modelo_procedimento_itens SET nome_item = $1, quantidade = $2, preco_unitario = $3 WHERE id = $4", [item.nome_item, item.quantidade, item.preco_unitario, item.id]);
      }
    }
    await pool.query("COMMIT");
    res.json({ message: "Atualizado!" });
  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

// NOVA ROTA: Apagar um procedimento completo
app.delete("/api/modelos-procedimento/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Como a tabela tem ON DELETE CASCADE, isto apaga a ficha e todos os materiais associados
    await pool.query("DELETE FROM modelos_procedimento WHERE id = $1", [id]);
    res.json({ message: "Procedimento apagado com sucesso!" });
  } catch (err) {
    console.error("Erro ao apagar procedimento:", err.message);
    res.status(500).json({ error: "Erro ao apagar procedimento." });
  }
});

// --- ESTATÍSTICAS ---
app.get('/api/stats/patients-weekly', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(d, 'DD/MM') as date, COALESCE(COUNT(p.id), 0)::int as count
      FROM generate_series($1::date, $1::date + '6 days'::interval, '1 day'::interval) d
      LEFT JOIN pacientes p ON DATE(p.created_at) = DATE(d)
      GROUP BY d ORDER BY d ASC
    `, [req.query.start]);
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/stats/dashboard-summary', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM pacientes WHERE created_at::date BETWEEN $1::date AND $1::date + '6 days'::interval) as pacientes_semana,
        (SELECT COUNT(*) FROM consultas WHERE data_consulta BETWEEN $1::date AND $1::date + '6 days'::interval) as consultas_semana,
        (SELECT COALESCE(SUM(m.preco_servico), 0) FROM consultas c JOIN modelos_procedimento m ON c.procedimento_id = m.id WHERE c.data_consulta BETWEEN $1::date AND $1::date + '6 days'::interval) as faturacao_semana,
        (SELECT COUNT(*) FROM produtos WHERE stock_atual <= stock_minimo) as alertas_stock
    `, [req.query.start]);
    res.json(stats.rows[0]);
  } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/reports/weekly-detail', async (req, res) => {
  try {
    const resu = await pool.query(`SELECT COUNT(c.id)::int as total_consultas, SUM(m.preco_servico)::float as faturacao_total, SUM(m.custo_total_estimado)::float as custos_materiais_total FROM consultas c JOIN modelos_procedimento m ON c.procedimento_id = m.id WHERE c.data_consulta BETWEEN $1::date AND $1::date + '6 days'::interval`, [req.query.start]);
    const det = await pool.query(`SELECT m.nome, COUNT(c.id)::int as quantidade, SUM(m.preco_servico)::float as subtotal_faturado FROM consultas c JOIN modelos_procedimento m ON c.procedimento_id = m.id WHERE c.data_consulta BETWEEN $1::date AND $1::date + '6 days'::interval GROUP BY m.nome`, [req.query.start]);
    res.json({ resumo: resu.rows[0], detalhe_procedimentos: det.rows });
  } catch (err) { res.status(500).send(err.message); }
});

app.listen(5000, () => console.log("Servidor MeClinic ativo na porta 5000"));