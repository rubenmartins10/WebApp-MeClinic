require('dotenv').config();
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

// Limite elevado para suportar Upload de Raio-X e PDFs grandes (Receitas)
app.use(express.json({ limit: '50mb' })); 

// ==========================================
// --- INICIALIZAÇÃO DA BASE DE DADOS ---
// ==========================================
async function initDB() {
  console.log("A preparar a base de dados e garantir tabelas...");
  
  try { await pool.query("ALTER TABLE produtos ALTER COLUMN stock_atual TYPE NUMERIC(10, 3)"); } catch(e){}
  try { await pool.query("ALTER TABLE produtos ALTER COLUMN stock_minimo TYPE NUMERIC(10, 3)"); } catch(e){}
  try { await pool.query("ALTER TABLE utilizadores ADD COLUMN reset_code VARCHAR(10)"); } catch(e){}
  try { await pool.query("ALTER TABLE utilizadores ADD COLUMN reset_expires TIMESTAMP"); } catch(e){}
  try { await pool.query("ALTER TABLE produtos ADD COLUMN categoria VARCHAR(100) DEFAULT 'Descartáveis'"); } catch(e){}
  try { await pool.query("ALTER TABLE produtos ADD COLUMN data_validade DATE"); } catch(e){}
  try { await pool.query("ALTER TABLE pacientes ADD COLUMN notas_clinicas TEXT DEFAULT ''"); } catch(e){}
  try { await pool.query("ALTER TABLE pacientes ADD COLUMN odontograma_dados TEXT DEFAULT '{}'"); } catch(e){}
  try { await pool.query("ALTER TABLE utilizadores ADD COLUMN assinatura_base64 TEXT"); } catch(e){}

  // TABELA PARA ARQUIVOS DO CRM (EXAMES E RECEITAS)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exames_paciente (
        id SERIAL PRIMARY KEY,
        paciente_id INT,
        nome_exame VARCHAR(255),
        data_exame DATE DEFAULT CURRENT_DATE,
        arquivo_base64 TEXT
      )
    `);
  } catch(e) { console.error("Erro ao criar tabela exames_paciente:", e); }

  // AUTO-CATEGORIZAÇÃO INTELIGENTE DE PRODUTOS
  try {
    await pool.query(`UPDATE produtos SET categoria = 'Esterilizacao' WHERE nome ILIKE '%manga%' OR nome ILIKE '%desinfe%' OR nome ILIKE '%esteriliz%' OR nome ILIKE '%líquido%' OR nome ILIKE '%liquido%' OR nome ILIKE '%autoclave%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Anestesia' WHERE nome ILIKE '%anest%' OR nome ILIKE '%agulha%' OR nome ILIKE '%seringa%' OR nome ILIKE '%carpule%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Endo_Restauro' WHERE nome ILIKE '%resina%' OR nome ILIKE '%cimento%' OR nome ILIKE '%lima%' OR nome ILIKE '%broca%' OR nome ILIKE '%ácido%' OR nome ILIKE '%acido%' OR nome ILIKE '%adesivo%' OR nome ILIKE '%compósito%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Cirurgia' WHERE nome ILIKE '%implante%' OR nome ILIKE '%sutura%' OR nome ILIKE '%bisturi%' OR nome ILIKE '%enxerto%' OR nome ILIKE '%membrana%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Ortodontia' WHERE nome ILIKE '%bracket%' OR nome ILIKE '%arame%' OR nome ILIKE '%elástico%' OR nome ILIKE '%elastico%' OR nome ILIKE '%arco%' OR nome ILIKE '%braquete%' OR nome ILIKE '%tubo%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Equipamento' WHERE nome ILIKE '%espelho%' OR nome ILIKE '%pinça%' OR nome ILIKE '%pinca%' OR nome ILIKE '%sonda%' OR nome ILIKE '%explorador%' OR nome ILIKE '%motor%' OR nome ILIKE '%turbina%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Descartáveis' WHERE nome ILIKE '%luva%' OR nome ILIKE '%aspirador%' OR nome ILIKE '%babete%' OR nome ILIKE '%copo%' OR nome ILIKE '%algodão%' OR nome ILIKE '%algodao%' OR nome ILIKE '%compressa%' OR nome ILIKE '%rolo%' OR nome ILIKE '%máscara%' OR nome ILIKE '%mascara%' OR nome ILIKE '%toca%' OR nome ILIKE '%touca%' OR nome ILIKE '%protetor%'`);
  } catch (e) {}
}
initDB();

// ==========================================
// --- CONFIGURAÇÃO DE E-MAIL (À PROVA DE BALA) ---
// ==========================================
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ==========================================
// --- AUTENTICAÇÃO E UTILIZADORES ---
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

app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query("SELECT id, nome FROM utilizadores WHERE email = $1", [email]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "E-mail não encontrado no sistema." });

    const code = Math.floor(100000 + Math.random() * 900000).toString(); 
    const expires = new Date(Date.now() + 15 * 60000); 

    await pool.query("UPDATE utilizadores SET reset_code = $1, reset_expires = $2 WHERE email = $3", [code, expires, email]);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
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

app.get('/api/utilizadores/:id/assinatura', async (req, res) => {
  try {
    const result = await pool.query("SELECT assinatura_base64 FROM utilizadores WHERE id = $1", [req.params.id]);
    res.json({ assinatura: result.rows[0]?.assinatura_base64 || null });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/utilizadores/:id/assinatura', async (req, res) => {
  try {
    const { assinatura } = req.body;
    await pool.query("UPDATE utilizadores SET assinatura_base64 = $1 WHERE id = $2", [assinatura, req.params.id]);
    res.json({ message: "Assinatura padrão guardada com sucesso!" });
  } catch(err) { res.status(500).json({ error: err.message }); }
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
  const { nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, imagem_url, categoria, data_validade } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO produtos (nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, imagem_url, categoria, data_validade) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [nome, codigo_barras || null, stock_atual || 0, stock_minimo || 5, unidade_medida || 'un', imagem_url || '', categoria || 'Descartáveis', data_validade || null]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/api/produtos/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, imagem_url, categoria, data_validade } = req.body;
  try {
    await pool.query(
      "UPDATE produtos SET nome=$1, codigo_barras=$2, stock_atual=$3, stock_minimo=$4, unidade_medida=$5, imagem_url=$6, categoria=$7, data_validade=$8 WHERE id=$9",
      [nome, codigo_barras || null, stock_atual, stock_minimo, unidade_medida, imagem_url || '', categoria || 'Descartáveis', data_validade || null, id]
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
// --- FATURAÇÃO, CHECKOUT E E-MAIL PACIENTES ---
// ==========================================
app.post('/api/faturacao/checkout', async (req, res) => {
  const { 
    consulta_id, paciente_nome, procedimento_nome, valor_total, metodo_pagamento, 
    email_destino, enviar_receita_email, 
    pdfBase64, materiais_gastos, 
    exame_nome, exame_base64, 
    receita_nome, receita_base64 
  } = req.body;

  try {
    await pool.query("BEGIN");
    
    // 1. Marca consulta como finalizada
    await pool.query("UPDATE consultas SET status = 'FINALIZADA' WHERE id = $1", [consulta_id]);
    
    // 2. Regista Faturação
    const procSeguro = procedimento_nome || 'Consulta Geral';
    const valorSeguro = parseFloat(valor_total) || 0;
    await pool.query(
      "INSERT INTO faturacao (consulta_id, paciente_nome, procedimento_nome, valor_total, metodo_pagamento) VALUES ($1, $2, $3, $4, $5)", 
      [consulta_id, paciente_nome, procSeguro, valorSeguro, metodo_pagamento || 'Multibanco']
    );

    // 3. Abate Materiais do Stock
    if (materiais_gastos && materiais_gastos.length > 0) {
      for (let item of materiais_gastos) {
        if (parseFloat(item.quantidade) > 0) {
          const prodRes = await pool.query("SELECT nome FROM produtos WHERE nome = $1", [item.nome_item]);
          if (prodRes.rows.length > 0) {
            const prodName = prodRes.rows[0].nome;
            const match = prodName.match(/\((\d+)\s*[a-zA-Z]+\)/);
            let deduction = parseFloat(item.quantidade);
            if (match) { 
              deduction = deduction / parseInt(match[1], 10); 
            }
            await pool.query("UPDATE produtos SET stock_atual = stock_atual - $1 WHERE nome = $2", [deduction, item.nome_item]);
          }
        }
      }
    }

    // 4. Guarda Exame e Receita no CRM do Paciente
    let pId = null;
    const getPaciente = await pool.query("SELECT paciente_id FROM consultas WHERE id = $1", [consulta_id]);
    if (getPaciente.rows.length > 0) { pId = getPaciente.rows[0].paciente_id; }

    if (pId) {
      if (exame_base64 && exame_nome) { 
        await pool.query("INSERT INTO exames_paciente (paciente_id, nome_exame, arquivo_base64) VALUES ($1, $2, $3)", [pId, exame_nome, exame_base64]); 
      }
      if (receita_base64 && receita_nome) { 
        await pool.query("INSERT INTO exames_paciente (paciente_id, nome_exame, arquivo_base64) VALUES ($1, $2, $3)", [pId, receita_nome, receita_base64]); 
      }
    }
    
    await pool.query("COMMIT");

    // 5. ENVIO DE E-MAIL INTELIGENTE COM TEXTO PREMIUM
    if (email_destino) {
      try {
        const attachments = [];
        const dataHoje = new Date().toLocaleDateString('pt-PT');
        let docTypes = [];

        if (pdfBase64) {
          const invoiceBuffer = Buffer.from(pdfBase64.split("base64,")[1], "base64");
          attachments.push({ filename: `Fatura_${paciente_nome.replace(/\s+/g, '_')}.pdf`, content: invoiceBuffer });
          const isOrcamento = (procedimento_nome || '').toLowerCase().includes('avalia') || (procedimento_nome || '').toLowerCase().includes('consulta');
          docTypes.push(isOrcamento ? 'Plano de Tratamento e Orçamento' : 'Fatura-Recibo');
        }
        
        if (enviar_receita_email && receita_base64) {
          const rxBuffer = Buffer.from(receita_base64.split("base64,")[1], "base64");
          attachments.push({ filename: receita_nome || `Relatorio_Clinico.pdf`, content: rxBuffer });
          docTypes.push('Prescrição Médica / Relatório');
        }

        const docListStr = docTypes.join(" e ");

        // TEXTO PREMIUM DO PACIENTE
        const bodyText = `Caro/a ${paciente_nome},\n\nEsperamos que se encontre bem.\n\nEm anexo a este email, enviamos os documentos referentes à sua última consulta na Meclinic (${docListStr}).\n\nSe tiver alguma dificuldade em abrir os anexos ou se precisar de algum esclarecimento adicional, não hesite em contactar-nos.\n\nCom os melhores cumprimentos,\nA equipa Meclinic`;

        if (attachments.length > 0) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER, 
            to: email_destino, 
            subject: `Os seus documentos Meclinic - ${dataHoje}`, 
            text: bodyText, 
            attachments: attachments
          });
        }
      } catch (emailErr) { 
        console.error("Erro no envio do Email no Checkout:", emailErr); 
      }
    }

    res.json({ message: "Check-out concluído com sucesso!" });
  } catch (err) { 
    await pool.query("ROLLBACK"); 
    res.status(500).json({ error: "Erro ao finalizar a consulta." }); 
  }
});

app.get('/api/faturacao', async (req, res) => {
  try { 
    const result = await pool.query("SELECT * FROM faturacao ORDER BY data_emissao DESC"); 
    res.json(result.rows); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// --- FICHAS TÉCNICAS ---
// ==========================================
app.get('/api/modelos-procedimento', async (req, res) => {
  try { const result = await pool.query("SELECT * FROM modelos_procedimento ORDER BY nome ASC"); res.json(result.rows); } catch (err) {} 
});

app.get('/api/modelos-procedimento/:id/itens', async (req, res) => {
  try { const result = await pool.query("SELECT * FROM modelo_procedimento_itens WHERE modelo_id = $1 ORDER BY id ASC", [req.params.id]); res.json(result.rows); } catch (err) {} 
});

app.post('/api/modelos-procedimento', async (req, res) => {
  try { const novo = await pool.query("INSERT INTO modelos_procedimento (nome, custo_total_estimado, preco_servico) VALUES ($1, 0, 0) RETURNING *", [req.body.nome]); res.json(novo.rows[0]); } catch (err) {} 
});

app.put("/api/modelos-procedimento/:id", async (req, res) => {
  const { id } = req.params; const { itens, custo_total, preco_servico } = req.body;
  try {
    await pool.query("BEGIN"); 
    await pool.query("UPDATE modelos_procedimento SET custo_total_estimado = $1, preco_servico = $2 WHERE id = $3", [custo_total, preco_servico, id]);
    
    const idsParaManter = itens.filter(item => !String(item.id).startsWith("temp-")).map(item => parseInt(item.id));
    if (idsParaManter.length > 0) { 
      await pool.query("DELETE FROM modelo_procedimento_itens WHERE modelo_id = $1 AND id <> ALL($2::int[])", [id, idsParaManter]); 
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
    await pool.query("COMMIT"); res.json({ message: "Atualizado!" });
  } catch (err) { await pool.query("ROLLBACK"); res.status(500).json({ error: "Erro." }); }
});

app.delete("/api/modelos-procedimento/:id", async (req, res) => {
  try { await pool.query("DELETE FROM modelos_procedimento WHERE id = $1", [req.params.id]); res.json({ message: "Apagado!" }); } catch (err) {} 
});

// ==========================================
// --- DASHBOARD E RELATÓRIOS ---
// ==========================================
app.get('/api/stats/dashboard-summary', async (req, res) => {
  const { start } = req.query;
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM pacientes WHERE created_at::date BETWEEN $1::date AND $1::date + '6 days'::interval) as pacientes_semana,
        (SELECT COUNT(*) FROM faturacao WHERE data_emissao::date BETWEEN $1::date AND $1::date + '6 days'::interval) as consultas_semana,
        (SELECT COALESCE(SUM(valor_total), 0) FROM faturacao WHERE data_emissao::date BETWEEN $1::date AND $1::date + '6 days'::interval) as faturacao_semana,
        (SELECT COUNT(*) FROM produtos WHERE stock_atual <= stock_minimo) as alertas_stock,
        (SELECT COUNT(*) FROM produtos WHERE data_validade IS NOT NULL AND data_validade <= CURRENT_DATE + interval '30 days') as alertas_validade
    `, [start]);
    res.json(stats.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats/stock-alerts', async (req, res) => {
  try { const result = await pool.query("SELECT id, nome, stock_atual, stock_minimo, unidade_medida FROM produtos WHERE stock_atual <= stock_minimo ORDER BY nome ASC"); res.json(result.rows); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats/validade-alerts', async (req, res) => {
  try { const result = await pool.query("SELECT id, nome, data_validade, categoria FROM produtos WHERE data_validade IS NOT NULL AND data_validade <= CURRENT_DATE + interval '30 days' ORDER BY data_validade ASC"); res.json(result.rows); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats/patients-weekly', async (req, res) => {
  const { start } = req.query; 
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(date_series, 'DD/MM') as date, COALESCE(COUNT(c.id), 0)::int as count 
      FROM generate_series($1::date, $1::date + '6 days'::interval, '1 day'::interval) date_series 
      LEFT JOIN consultas c ON c.data_consulta::date = DATE(date_series) GROUP BY date_series ORDER BY date_series ASC
    `, [start]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/weekly-detail', async (req, res) => {
  const { start } = req.query;
  try {
    const report = await pool.query(`SELECT COUNT(c.id)::int as total_consultas, COALESCE(SUM(m.preco_servico), 0)::float as faturacao_total, COALESCE(SUM(m.custo_total_estimado), 0)::float as custos_materiais_total, (COALESCE(SUM(m.preco_servico), 0) - COALESCE(SUM(m.custo_total_estimado), 0))::float as lucro_estimado FROM consultas c JOIN modelos_procedimento m ON c.procedimento_id = m.id WHERE c.data_consulta::date BETWEEN $1::date AND $1::date + '6 days'::interval`, [start]);
    const procedimentos = await pool.query(`SELECT m.nome, COUNT(c.id)::int as quantidade, SUM(m.preco_servico)::float as subtotal_faturado FROM consultas c JOIN modelos_procedimento m ON c.procedimento_id = m.id WHERE c.data_consulta::date BETWEEN $1::date AND $1::date + '6 days'::interval GROUP BY m.nome ORDER BY quantidade DESC`, [start]);
    const materiais = await pool.query(`SELECT mpi.nome_item as material, SUM(mpi.quantidade)::int as quantidade_total, mpi.preco_unitario, SUM(mpi.quantidade * mpi.preco_unitario)::float as custo_total FROM consultas c JOIN modelo_procedimento_itens mpi ON c.procedimento_id = mpi.modelo_id WHERE c.data_consulta::date BETWEEN $1::date AND $1::date + '6 days'::interval GROUP BY mpi.nome_item, mpi.preco_unitario ORDER BY quantidade_total DESC`, [start]);
    const notas = await pool.query(`SELECT data_emissao, paciente_nome, procedimento_nome, metodo_pagamento, valor_total FROM faturacao WHERE data_emissao::date BETWEEN $1::date AND $1::date + '6 days'::interval ORDER BY data_emissao DESC`, [start]);
    res.json({ resumo: report.rows[0], detalhe_procedimentos: procedimentos.rows, top_materiais: materiais.rows, notas_faturacao: notas.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// --- ENVIO DO RELATÓRIO DA ADMINISTRAÇÃO ---
// ==========================================
app.post('/api/reports/send-email', async (req, res) => {
  const { emailDestino, pdfBase64, semana } = req.body;
  
  try {
    // TEXTO PREMIUM DA ADMINISTRAÇÃO (RGPD SAFE)
    const bodyText = `Caro(s) membro(s) da Administração,\n\nInformo que o Relatório Geral da clínica, referente à semana de ${semana}, já se encontra processado e disponível para a vossa análise.\n\nEste documento compila os dados globais da operação, incluindo:\n• Total de procedimentos e consultas realizadas;\n• Sumário de faturação e custos de materiais;\n• Alertas de stock e validade.\n\nPor se tratar de um documento com dados confidenciais do negócio, o resumo financeiro detalhado e seguro encontra-se apenas no PDF em anexo e na plataforma oficial.\n\nFico à disposição para qualquer esclarecimento adicional ou se precisarem de ajuda a extrair algum dado mais específico.\n\nCom os melhores cumprimentos,\nSistema Automático Meclinic`;

    const reportBuffer = Buffer.from(pdfBase64.split("base64,")[1], "base64");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailDestino,
      subject: `[INTERNO] Relatório Geral de Atividade Meclinic – Semana de ${semana}`,
      text: bodyText,
      attachments: [
        { filename: `Relatorio_Meclinic_${semana}.pdf`, content: reportBuffer }
      ]
    });

    res.json({ message: 'Relatório enviado com sucesso.' });
  } catch (err) {
    console.error("Erro ao enviar relatório:", err);
    res.status(500).json({ error: "Erro ao enviar e-mail." });
  }
});

// ==========================================
// --- CRM PACIENTES ---
// ==========================================
app.post('/api/pacientes', async (req, res) => {
  try {
    const { nome, telefone, email } = req.body;
    const result = await pool.query("INSERT INTO pacientes (nome, telefone, email) VALUES ($1, $2, $3) RETURNING *", [nome, telefone, email || null]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/pacientes/:id/dados', async (req, res) => {
  try {
    const { nome, telefone, email } = req.body;
    await pool.query("UPDATE pacientes SET nome = $1, telefone = $2, email = $3 WHERE id = $4", [nome, telefone, email || null, req.params.id]);
    res.json({ message: "Dados atualizados!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/pacientes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.nome, p.telefone, p.email, p.notas_clinicas, p.odontograma_dados, p.created_at, COUNT(c.id)::int as total_consultas, COALESCE(SUM(f.valor_total), 0)::float as total_faturado, MAX(c.data_consulta) as ultima_consulta
      FROM pacientes p LEFT JOIN consultas c ON p.id = c.paciente_id LEFT JOIN faturacao f ON c.id = f.consulta_id
      GROUP BY p.id ORDER BY p.nome ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/pacientes/:id/historico', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.data_consulta, c.hora_consulta, c.status, m.nome as procedimento_nome
      FROM consultas c LEFT JOIN modelos_procedimento m ON c.procedimento_id = m.id
      WHERE c.paciente_id = $1 ORDER BY c.data_consulta DESC, c.hora_consulta DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/pacientes/:id/notas', async (req, res) => {
  try {
    const { notas } = req.body;
    await pool.query("UPDATE pacientes SET notas_clinicas = $1 WHERE id = $2", [notas, req.params.id]);
    res.json({ message: "Notas atualizadas!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/pacientes/:id/odontograma', async (req, res) => {
  try {
    const { dados } = req.body;
    await pool.query("UPDATE pacientes SET odontograma_dados = $1 WHERE id = $2", [JSON.stringify(dados), req.params.id]);
    res.json({ message: "Odontograma guardado na BD!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/pacientes/:id/exames', async (req, res) => {
  try {
    const { nome, base64 } = req.body;
    const result = await pool.query("INSERT INTO exames_paciente (paciente_id, nome_exame, arquivo_base64) VALUES ($1, $2, $3) RETURNING id, nome_exame, data_exame", [req.params.id, nome, base64]);
    res.json(result.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/pacientes/:id/exames', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, nome_exame, data_exame, arquivo_base64 FROM exames_paciente WHERE paciente_id = $1 ORDER BY data_exame DESC", [req.params.id]);
    res.json(result.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/pacientes/exames/:idExame', async (req, res) => {
  try {
    await pool.query("DELETE FROM exames_paciente WHERE id = $1", [req.params.idExame]);
    res.json({ message: "Exame apagado!" });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/pacientes/:id', async (req, res) => {
  try {
    const pId = req.params.id;
    await pool.query("DELETE FROM exames_paciente WHERE paciente_id = $1", [pId]).catch(()=>{});
    await pool.query("DELETE FROM faturacao WHERE consulta_id IN (SELECT id FROM consultas WHERE paciente_id = $1)", [pId]).catch(()=>{});
    await pool.query("DELETE FROM consultas WHERE paciente_id = $1", [pId]).catch(()=>{});
    await pool.query("DELETE FROM pacientes WHERE id = $1", [pId]);
    res.json({ message: "Paciente removido com sucesso!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(5000, () => { console.log("Servidor ativo na porta 5000"); });