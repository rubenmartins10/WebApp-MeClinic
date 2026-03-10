const express = require("express");
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy"); 
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const PDFDocument = require("pdfkit-table");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// PREPARAÇÃO DA BASE DE DADOS
pool.query("ALTER TABLE produtos ALTER COLUMN stock_atual TYPE NUMERIC(10, 3)").catch(() => {});
pool.query("ALTER TABLE produtos ALTER COLUMN stock_minimo TYPE NUMERIC(10, 3)").catch(() => {});
// NOVAS COLUNAS PARA RECUPERAÇÃO DE PALAVRA-PASSE
pool.query("ALTER TABLE utilizadores ADD COLUMN reset_code VARCHAR(10)").catch(() => {});
pool.query("ALTER TABLE utilizadores ADD COLUMN reset_expires TIMESTAMP").catch(() => {});

// ==========================================
// --- CONFIGURAÇÃO DE E-MAIL ---
// ==========================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'rubendavidsilvamartins@gmail.com', pass: 'ozrf vmiq mzxt ddii' }
});

// ==========================================
// --- AUTENTICAÇÃO E SEGURANÇA ---
// ==========================================
app.post("/api/register", async (req, res) => {
  try {
    const { nome, email, password } = req.body;
    const userExists = await pool.query("SELECT * FROM utilizadores WHERE email = $1", [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: "Já existe uma conta com este email." });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const secret = speakeasy.generateSecret({ name: `MeClinic (${email})` });

    const newUser = await pool.query(
      "INSERT INTO utilizadores (nome, email, password_hash, mfa_enabled, mfa_secret, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nome, email, role",
      [nome, email, password_hash, true, secret.base32, 'ADMIN']
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ message: "Conta criada com sucesso!", user: newUser.rows[0], qrCodeUrl });
  } catch (err) { res.status(500).json({ error: "Erro no servidor." }); }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;
    const userResult = await pool.query("SELECT * FROM utilizadores WHERE email = $1", [email]);
    if (userResult.rows.length === 0) return res.status(401).json({ error: "Credenciais incorretas." });

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: "Credenciais incorretas." });

    if (user.mfa_enabled) {
      if (!mfaToken) return res.status(400).json({ error: "O código do Authenticator é obrigatório." });
      const verified = speakeasy.totp.verify({ secret: user.mfa_secret, encoding: 'base32', token: mfaToken });
      if (!verified) return res.status(401).json({ error: "Código inválido." });
    }

    res.json({ message: "Login bem-sucedido", user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ error: "Erro no servidor." }); }
});

app.post("/api/change-password", async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, mfaToken } = req.body;
    const userResult = await pool.query("SELECT * FROM utilizadores WHERE id = $1", [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "Utilizador não encontrado." });
    
    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: "A palavra-passe atual está incorreta." });

    if (user.mfa_enabled) {
      if (!mfaToken) return res.status(400).json({ error: "Código MFA obrigatório." });
      const verified = speakeasy.totp.verify({ secret: user.mfa_secret, encoding: 'base32', token: mfaToken });
      if (!verified) return res.status(401).json({ error: "Código inválido." });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
    await pool.query("UPDATE utilizadores SET password_hash = $1 WHERE id = $2", [newPasswordHash, userId]);
    res.json({ message: "Palavra-passe alterada!" });
  } catch (err) { res.status(500).json({ error: "Erro no servidor." }); }
});

// --- RECUPERAÇÃO DE PALAVRA-PASSE ---
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query("SELECT id, nome FROM utilizadores WHERE email = $1", [email]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "E-mail não encontrado no sistema." });

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos
    const expires = new Date(Date.now() + 15 * 60000); // Expira em 15 minutos

    await pool.query("UPDATE utilizadores SET reset_code = $1, reset_expires = $2 WHERE email = $3", [code, expires, email]);

    await transporter.sendMail({
      from: 'rubendavidsilvamartins@gmail.com',
      to: email,
      subject: 'Recuperação de Palavra-passe - MeClinic',
      html: `<h3>Olá ${userRes.rows[0].nome},</h3>
             <p>Foi pedido um reset de palavra-passe para a sua conta.</p>
             <p>O seu código de verificação é: <strong style="font-size: 24px; color: #2563eb;">${code}</strong></p>
             <p>Este código expira em 15 minutos.</p>`
    });

    res.json({ message: "Código enviado para o seu e-mail." });
  } catch (err) { res.status(500).json({ error: "Erro no servidor ao enviar e-mail." }); }
});

app.post('/api/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const userRes = await pool.query("SELECT id, reset_expires FROM utilizadores WHERE email = $1 AND reset_code = $2", [email, code]);
    if (userRes.rows.length === 0) return res.status(400).json({ error: "Código inválido ou e-mail incorreto." });

    if (new Date() > new Date(userRes.rows[0].reset_expires)) {
      return res.status(400).json({ error: "Este código já expirou. Peça um novo." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE utilizadores SET password_hash = $1, reset_code = NULL, reset_expires = NULL WHERE email = $2", [hash, email]);

    res.json({ message: "Palavra-passe alterada com sucesso! Já pode fazer login." });
  } catch (err) { res.status(500).json({ error: "Erro no servidor." }); }
});

app.get("/api/utilizadores", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, nome, email, role, mfa_enabled FROM utilizadores ORDER BY nome ASC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/utilizadores", async (req, res) => {
  try {
    const { nome, email, password, role } = req.body;
    const userExists = await pool.query("SELECT * FROM utilizadores WHERE email = $1", [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: "Já existe uma conta." });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const secret = speakeasy.generateSecret({ name: `MeClinic (${email})` });

    const newUser = await pool.query(
      "INSERT INTO utilizadores (nome, email, password_hash, mfa_enabled, mfa_secret, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nome, email, role",
      [nome, email, password_hash, true, secret.base32, role || 'ASSISTENTE']
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ message: "Membro adicionado!", user: newUser.rows[0], qrCodeUrl });
  } catch (err) { res.status(500).json({ error: "Erro no servidor." }); }
});

app.delete("/api/utilizadores/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM utilizadores WHERE id = $1", [req.params.id]);
    res.json({ message: "Removido!" });
  } catch (err) { res.status(500).json({ error: "Erro." }); }
});

// ==========================================
// --- PRODUTOS & INVENTÁRIO ---
// ==========================================
app.get("/api/produtos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produtos ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

app.post("/api/produtos", async (req, res) => {
  const { nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, categoria_id, imagem_url } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO produtos (nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, categoria_id, imagem_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [nome, codigo_barras || null, stock_atual || 0, stock_minimo || 5, unidade_medida || 'un', categoria_id || null, imagem_url || '']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/api/produtos/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, imagem_url } = req.body;
  try {
    await pool.query(
      "UPDATE produtos SET nome=$1, codigo_barras=$2, stock_atual=$3, stock_minimo=$4, unidade_medida=$5, imagem_url=$6 WHERE id=$7",
      [nome, codigo_barras || null, stock_atual, stock_minimo, unidade_medida, imagem_url || '', id]
    );
    res.json({ message: "Produto atualizado!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/produtos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM produtos WHERE id = $1", [req.params.id]);
    res.json({ message: "Produto removido!" });
  } catch (err) { res.status(500).json({ error: "Erro." }); }
});

// ==========================================
// --- CONSULTAS ---
// ==========================================
app.get('/api/consultas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, p.nome as paciente_nome, p.telefone as paciente_telefone, p.email as paciente_email, 
      c.data_consulta, c.hora_consulta, c.motivo, c.status, c.procedimento_id, m.nome as procedimento_nome, m.custo_total_estimado as preco_estimado, m.preco_servico
      FROM consultas c 
      JOIN pacientes p ON c.paciente_id = p.id 
      LEFT JOIN modelos_procedimento m ON c.procedimento_id = m.id
      WHERE c.status = 'AGENDADA' OR c.data_consulta = CURRENT_DATE
      ORDER BY c.data_consulta ASC, c.hora_consulta ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/consultas', async (req, res) => {
  const { nome, email, telefone, data, hora, motivo, procedimento_id } = req.body;
  try {
    let paciente = await pool.query("SELECT id FROM pacientes WHERE nome = $1", [nome]);
    let pId;
    if (paciente.rows.length === 0) {
      const novoP = await pool.query("INSERT INTO pacientes (nome, telefone, email) VALUES ($1, $2, $3) RETURNING id", [nome, telefone, email || null]);
      pId = novoP.rows[0].id;
    } else {
      pId = paciente.rows[0].id;
      await pool.query("UPDATE pacientes SET telefone = $1, email = $2 WHERE id = $3", [telefone, email || null, pId]);
    }
    const novaC = await pool.query("INSERT INTO consultas (paciente_id, data_consulta, hora_consulta, motivo, procedimento_id) VALUES ($1, $2, $3, $4, $5) RETURNING *", [pId, data, hora, motivo, procedimento_id || null]);
    res.json(novaC.rows[0]);
  } catch (err) { res.status(500).json({ error: "Erro" }); }
});

app.put('/api/consultas/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, data, hora, motivo, procedimento_id } = req.body;
  try {
    let paciente = await pool.query("SELECT id FROM pacientes WHERE nome = $1", [nome]);
    let pId;
    if (paciente.rows.length === 0) {
      const novoP = await pool.query("INSERT INTO pacientes (nome, telefone, email) VALUES ($1, $2, $3) RETURNING id", [nome, telefone, email || null]);
      pId = novoP.rows[0].id;
    } else {
      pId = paciente.rows[0].id;
      await pool.query("UPDATE pacientes SET telefone = $1, email = $2 WHERE id = $3", [telefone, email || null, pId]);
    }
    await pool.query("UPDATE consultas SET paciente_id = $1, data_consulta = $2, hora_consulta = $3, motivo = $4, procedimento_id = $5 WHERE id = $6", [pId, data, hora, motivo, procedimento_id || null, id]);
    res.json({ message: "Atualizada!" });
  } catch (err) { res.status(500).json({ error: "Erro" }); }
});

app.delete('/api/consultas/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM consultas WHERE id = $1", [req.params.id]);
    res.json({ message: "Desmarcada!" });
  } catch (err) { res.status(500).json({ error: "Erro." }); }
});

// ==========================================
// --- FATURAÇÃO E CHECK-OUT ---
// ==========================================
app.post('/api/faturacao/checkout', async (req, res) => {
  const { consulta_id, paciente_nome, procedimento_nome, valor_total, metodo_pagamento, email_destino, pdfBase64 } = req.body;
  
  try {
    await pool.query("BEGIN");
    await pool.query("UPDATE consultas SET status = 'FINALIZADA' WHERE id = $1", [consulta_id]);
    
    const procSeguro = procedimento_nome || 'Consulta Geral';
    const valorSeguro = parseFloat(valor_total) || 0;

    await pool.query(
      "INSERT INTO faturacao (consulta_id, paciente_nome, procedimento_nome, valor_total, metodo_pagamento) VALUES ($1, $2, $3, $4, $5)", 
      [consulta_id, paciente_nome, procSeguro, valorSeguro, metodo_pagamento || 'Multibanco']
    );

    const consultaRes = await pool.query("SELECT procedimento_id FROM consultas WHERE id = $1", [consulta_id]);
    
    if (consultaRes.rows.length > 0 && consultaRes.rows[0].procedimento_id) {
      const procId = consultaRes.rows[0].procedimento_id;
      const materiaisRes = await pool.query("SELECT nome_item, quantidade FROM modelo_procedimento_itens WHERE modelo_id = $1", [procId]);
      
      for (let item of materiaisRes.rows) {
        const prodRes = await pool.query("SELECT nome FROM produtos WHERE nome = $1", [item.nome_item]);
        if (prodRes.rows.length > 0) {
          const prodName = prodRes.rows[0].nome;
          const match = prodName.match(/\((\d+)\s*[a-zA-Z]+\)/);
          let deduction = parseFloat(item.quantidade);
          if (match) {
            const unitsPerBox = parseInt(match[1], 10);
            deduction = deduction / unitsPerBox; 
          }
          await pool.query(
            "UPDATE produtos SET stock_atual = stock_atual - $1 WHERE nome = $2",
            [deduction, item.nome_item]
          );
        }
      }
    }

    await pool.query("COMMIT");

    if (email_destino && pdfBase64) {
      try {
        const pdfBuffer = Buffer.from(pdfBase64.split("base64,")[1], "base64");
        await transporter.sendMail({
          from: 'rubendavidsilvamartins@gmail.com', to: email_destino,
          subject: `Resumo de Consulta - Clínica`,
          text: `Olá ${paciente_nome},\n\nAnexo enviamos o comprovativo e resumo da sua consulta.\n\nObrigado pela preferência!`,
          attachments: [{ filename: `Recibo_${paciente_nome.replace(/\s+/g, '_')}.pdf`, content: pdfBuffer }]
        });
      } catch (emailErr) {
        console.error("Erro ao enviar email:", emailErr);
      }
    }
    res.json({ message: "Check-out concluído e Stock atualizado!" });
  } catch (err) { 
    await pool.query("ROLLBACK"); 
    res.status(500).json({ error: "Erro ao finalizar a consulta na Base de Dados." }); 
  }
});

app.get('/api/faturacao', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM faturacao ORDER BY data_emissao DESC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// --- FICHAS TÉCNICAS E PROCEDIMENTOS ---
// ==========================================
app.get('/api/modelos-procedimento', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM modelos_procedimento ORDER BY nome ASC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/modelos-procedimento/:id/itens', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM modelo_procedimento_itens WHERE modelo_id = $1 ORDER BY id ASC", [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/modelos-procedimento', async (req, res) => {
  try {
    const novo = await pool.query("INSERT INTO modelos_procedimento (nome, custo_total_estimado, preco_servico) VALUES ($1, 0, 0) RETURNING *", [req.body.nome]);
    res.json(novo.rows[0]);
  } catch (err) { res.status(500).json({ error: "Erro." }); }
});

app.put("/api/modelos-procedimento/:id", async (req, res) => {
  const { id } = req.params;
  const { itens, custo_total, preco_servico } = req.body;
  try {
    await pool.query("BEGIN"); 
    await pool.query("UPDATE modelos_procedimento SET custo_total_estimado = $1, preco_servico = $2 WHERE id = $3", [custo_total, preco_servico, id]);
    const idsParaManter = itens.filter(item => !String(item.id).startsWith("temp-")).map(item => parseInt(item.id));
    if (idsParaManter.length > 0) { await pool.query("DELETE FROM modelo_procedimento_itens WHERE modelo_id = $1 AND id <> ALL($2::int[])", [id, idsParaManter]); } 
    else { await pool.query("DELETE FROM modelo_procedimento_itens WHERE modelo_id = $1", [id]); }
    for (let item of itens) {
      if (String(item.id).startsWith("temp-")) { await pool.query("INSERT INTO modelo_procedimento_itens (modelo_id, nome_item, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)", [id, item.nome_item, item.quantidade, item.preco_unitario]); } 
      else { await pool.query("UPDATE modelo_procedimento_itens SET nome_item = $1, quantidade = $2, preco_unitario = $3 WHERE id = $4", [item.nome_item, item.quantidade, item.preco_unitario, item.id]); }
    }
    await pool.query("COMMIT"); res.json({ message: "Atualizado!" });
  } catch (err) { await pool.query("ROLLBACK"); res.status(500).json({ error: "Erro." }); }
});

app.delete("/api/modelos-procedimento/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM modelos_procedimento WHERE id = $1", [req.params.id]);
    res.json({ message: "Apagado!" });
  } catch (err) { res.status(500).json({ error: "Erro." }); }
});

// ==========================================
// --- ESTATÍSTICAS E RELATÓRIOS ---
// ==========================================
app.post('/api/reports/send-email', async (req, res) => {
  const { emailDestino, pdfBase64, semana } = req.body;
  try {
    const pdfBuffer = Buffer.from(pdfBase64.split("base64,")[1], "base64");
    await transporter.sendMail({
      from: 'rubendavidsilvamartins@gmail.com', to: emailDestino,
      subject: `Relatório Clínica - Semana de ${semana}`,
      text: 'Anexo enviamos o relatório detalhado.',
      attachments: [{ filename: `Relatorio_${semana}.pdf`, content: pdfBuffer }]
    });
    res.json({ message: "Sucesso!" });
  } catch (error) { res.status(500).json({ error: "Erro." }); }
});

app.get('/api/stats/dashboard-summary', async (req, res) => {
  const { start } = req.query;
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM pacientes WHERE created_at::date BETWEEN $1::date AND $1::date + '6 days'::interval) as pacientes_semana,
        (SELECT COUNT(*) FROM faturacao WHERE data_emissao::date BETWEEN $1::date AND $1::date + '6 days'::interval) as consultas_semana,
        (SELECT COALESCE(SUM(valor_total), 0) FROM faturacao WHERE data_emissao::date BETWEEN $1::date AND $1::date + '6 days'::interval) as faturacao_semana,
        (SELECT COUNT(*) FROM produtos WHERE stock_atual <= stock_minimo) as alertas_stock
    `, [start]);
    res.json(stats.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats/patients-weekly', async (req, res) => {
  const { start } = req.query; 
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(date_series, 'DD/MM') as date, COALESCE(COUNT(c.id), 0)::int as count 
      FROM generate_series($1::date, $1::date + '6 days'::interval, '1 day'::interval) date_series 
      LEFT JOIN consultas c ON c.data_consulta::date = DATE(date_series) 
      GROUP BY date_series ORDER BY date_series ASC
    `, [start]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/weekly-detail', async (req, res) => {
  const { start } = req.query;
  try {
    const report = await pool.query(`
      SELECT COUNT(c.id)::int as total_consultas, COALESCE(SUM(m.preco_servico), 0)::float as faturacao_total, COALESCE(SUM(m.custo_total_estimado), 0)::float as custos_materiais_total, (COALESCE(SUM(m.preco_servico), 0) - COALESCE(SUM(m.custo_total_estimado), 0))::float as lucro_estimado
      FROM consultas c JOIN modelos_procedimento m ON c.procedimento_id = m.id WHERE c.data_consulta::date BETWEEN $1::date AND $1::date + '6 days'::interval
    `, [start]);
    const procedimentos = await pool.query(`
      SELECT m.nome, COUNT(c.id)::int as quantidade, SUM(m.preco_servico)::float as subtotal_faturado 
      FROM consultas c JOIN modelos_procedimento m ON c.procedimento_id = m.id WHERE c.data_consulta::date BETWEEN $1::date AND $1::date + '6 days'::interval GROUP BY m.nome ORDER BY quantidade DESC
    `, [start]);
    const materiais = await pool.query(`
      SELECT mpi.nome_item as material, SUM(mpi.quantidade)::int as quantidade_total, mpi.preco_unitario, SUM(mpi.quantidade * mpi.preco_unitario)::float as custo_total
      FROM consultas c JOIN modelo_procedimento_itens mpi ON c.procedimento_id = mpi.modelo_id WHERE c.data_consulta::date BETWEEN $1::date AND $1::date + '6 days'::interval GROUP BY mpi.nome_item, mpi.preco_unitario ORDER BY quantidade_total DESC
    `, [start]);
    const notas = await pool.query(`
      SELECT data_emissao, paciente_nome, procedimento_nome, metodo_pagamento, valor_total FROM faturacao WHERE data_emissao::date BETWEEN $1::date AND $1::date + '6 days'::interval ORDER BY data_emissao DESC
    `, [start]);
    res.json({ resumo: report.rows[0], detalhe_procedimentos: procedimentos.rows, top_materiais: materiais.rows, notas_faturacao: notas.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(5000, () => { console.log("Servidor ativo na porta 5000"); });