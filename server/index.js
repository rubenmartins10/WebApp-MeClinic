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

    const secret = speakeasy.generateSecret({ 
      name: `MeClinic (${email})` 
    });

    const newUser = await pool.query(
      "INSERT INTO utilizadores (nome, email, password_hash, mfa_enabled, mfa_secret) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email",
      [nome, email, password_hash, true, secret.base32]
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({ 
      message: "Conta criada com sucesso!", 
      user: newUser.rows[0], 
      qrCodeUrl
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro no servidor ao registar utilizador." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;

    const userResult = await pool.query("SELECT * FROM utilizadores WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Email ou palavra-passe incorretos." });
    }

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Email ou palavra-passe incorretos." });
    }

    if (user.mfa_enabled) {
      if (!mfaToken) {
        return res.status(400).json({ error: "O código do Google Authenticator é obrigatório." });
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: mfaToken
      });

      if (!verified) {
        return res.status(401).json({ error: "Código da App inválido. Tenta novamente." });
      }
    }

    res.json({ 
      message: "Login bem-sucedido", 
      user: { id: user.id, nome: user.nome, email: user.email } 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro no servidor ao iniciar sessão." });
  }
});

// --- PRODUTOS ---
app.get("/api/produtos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produtos ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- CONSULTAS ---
app.get('/api/consultas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, p.nome as paciente_nome, c.data_consulta, c.hora_consulta, c.motivo,
        m.nome as procedimento_nome
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN modelos_procedimento m ON c.procedimento_id = m.id
      WHERE 
        c.data_consulta > CURRENT_DATE 
        OR (c.data_consulta = CURRENT_DATE AND c.hora_consulta >= CURRENT_TIME)
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
    let pacienteId;
    if (paciente.rows.length === 0) {
      const novoP = await pool.query("INSERT INTO pacientes (nome, telefone) VALUES ($1, $2) RETURNING id", [nome, telefone]);
      pacienteId = novoP.rows[0].id;
    } else {
      pacienteId = paciente.rows[0].id;
    }
    const novaC = await pool.query(
      "INSERT INTO consultas (paciente_id, data_consulta, hora_consulta, motivo, procedimento_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [pacienteId, data, hora, motivo, procedimento_id || null]
    );
    res.json(novaC.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao marcar consulta" });
  }
});

// ==========================================
// --- FICHAS TÉCNICAS E PROCEDIMENTOS ---
// ==========================================

// Obter Fichas / Procedimentos
app.get('/api/modelos-procedimento', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM modelos_procedimento ORDER BY nome ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter Itens de um Procedimento
app.get('/api/modelos-procedimento/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM modelo_procedimento_itens WHERE modelo_id = $1 ORDER BY id ASC", [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADICIONADO: Atualizar Fichas e Itens (Permite que o Administrador guarde os preços e quantidades)
app.put("/api/modelos-procedimento/:id", async (req, res) => {
  const { id } = req.params;
  const { itens, custo_total } = req.body;
  
  try {
    await pool.query("BEGIN"); // Transação de segurança

    // 1. Atualizar o custo total na ficha principal
    await pool.query(
      "UPDATE modelos_procedimento SET custo_total_estimado = $1 WHERE id = $2",
      [custo_total, id]
    );

    // 2. Atualizar todos os produtos um a um com as novas quantidades/preços
    for (let item of itens) {
      await pool.query(
        "UPDATE modelo_procedimento_itens SET quantidade = $1, preco_unitario = $2, preco_total_item = $3 WHERE id = $4",
        [item.quantidade, item.preco_unitario, item.preco_total_item, item.id]
      );
    }

    await pool.query("COMMIT"); // Confirma na Base de Dados
    res.json({ message: "Procedimento atualizado com sucesso!" });

  } catch (err) {
    await pool.query("ROLLBACK"); // Se falhar, cancela tudo para não haver ficheiros corrompidos
    console.error(err.message);
    res.status(500).json({ error: "Erro ao atualizar a Ficha Técnica." });
  }
});

// --- ESTATÍSTICAS ---
app.get('/api/stats/patients-weekly', async (req, res) => {
  const { start } = req.query; 
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(date_series, 'DD/MM') as date,
        COALESCE(COUNT(p.id), 0)::int as count
      FROM 
        generate_series($1::date, $1::date + '6 days'::interval, '1 day'::interval) date_series
      LEFT JOIN pacientes p ON DATE(p.created_at) = DATE(date_series)
      GROUP BY date_series
      ORDER BY date_series ASC
    `, [start]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar estatísticas semanais" });
  }
});

app.get('/api/stats/dashboard-summary', async (req, res) => {
  const { start } = req.query;
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM pacientes WHERE created_at::date BETWEEN $1::date AND $1::date + '6 days'::interval) as pacientes_semana,
        (SELECT COUNT(*) FROM consultas WHERE data_consulta BETWEEN $1::date AND $1::date + '6 days'::interval) as consultas_semana,
        (SELECT COALESCE(SUM(m.preco_servico), 0) FROM consultas c JOIN modelos_procedimento m ON c.procedimento_id = m.id 
        WHERE c.data_consulta BETWEEN $1::date AND $1::date + '6 days'::interval) as faturacao_semana,
        (SELECT COUNT(*) FROM produtos WHERE stock_atual <= stock_minimo) as alertas_stock
    `, [start]);
    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/weekly-detail', async (req, res) => {
  const { start } = req.query;
  try {
    const report = await pool.query(`
      SELECT 
        COUNT(c.id)::int as total_consultas,
        COALESCE(SUM(m.preco_servico), 0)::float as faturacao_total,
        COALESCE(SUM(m.custo_total_estimado), 0)::float as custos_materiais_total,
        (COALESCE(SUM(m.preco_servico), 0) - COALESCE(SUM(m.custo_total_estimado), 0))::float as lucro_estimado
      FROM consultas c
      JOIN modelos_procedimento m ON c.procedimento_id = m.id
      WHERE c.data_consulta BETWEEN $1::date AND $1::date + '6 days'::interval
    `, [start]);

    const procedimentos = await pool.query(`
      SELECT 
        m.nome, 
        COUNT(c.id)::int as quantidade,
        SUM(m.preco_servico)::float as subtotal_faturado
      FROM consultas c
      JOIN modelos_procedimento m ON c.procedimento_id = m.id
      WHERE c.data_consulta BETWEEN $1::date AND $1::date + '6 days'::interval
      GROUP BY m.nome
      ORDER BY quantidade DESC
    `, [start]);

    res.json({
      resumo: report.rows[0],
      detalhe_procedimentos: procedimentos.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("Servidor MeClinic ativo na porta 5000");
});