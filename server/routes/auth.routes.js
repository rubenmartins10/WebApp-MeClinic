const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../errorHandler');
const { validateRequest, registerSchema, loginSchema } = require('../validation/authValidation');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const pool = require('../db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Email transporter setup - Suporta múltiplos modos
let transporter;

if (process.env.EMAIL_MODE === 'console') {
  // Modo console (apenas log) - para desenvolvimento rápido
  console.log('📧 EMAIL MODE: CONSOLE (nenhum email será enviado)');
  transporter = {
    sendMail: async (options) => {
      console.log(`
╔════════════════════════════════════════════════════╗
║                   MODO CONSOLE EMAIL                ║
╠════════════════════════════════════════════════════╣
║ Para: ${options.to.padEnd(42)}║
║ Assunto: ${options.subject.substring(0, 34).padEnd(42)}║
║ Corpo: ${options.html.substring(0, 34).padEnd(46)}║
║ [NÃO ENVIADO - apenas para testes]               ║
╚════════════════════════════════════════════════════╝
      `);
      return { messageId: 'console-mode-' + Date.now() };
    }
  };
} else {
  // SMTP real (Gmail, Mailtrap, etc)
  console.log(`📧 EMAIL MODE: SMTP (${process.env.SMTP_HOST || 'smtp.gmail.com'})`);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' ? true : false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false
    }
  });
}

/**
 * Rotas de Autenticação
 * 
 * POST   /api/auth/register  - Registar novo utilizador
 * POST   /api/auth/login     - Login
 * GET    /api/auth/profile   - Obter perfil (protegida)
 * POST   /api/auth/logout    - Logout
 */

/**
 * POST /api/auth/register
 * Registar novo utilizador com validação
 */
router.post(
  '/register',
  validateRequest(registerSchema),
  asyncHandler(AuthController.register)
);

/**
 * POST /api/auth/login
 * Fazer login
 */
router.post(
  '/login',
  validateRequest(loginSchema),
  asyncHandler(AuthController.login)
);

/**
 * GET /api/auth/profile
 * Obter profile do utilizador autenticado
 */
router.get(
  '/profile',
  authMiddleware,
  asyncHandler(AuthController.getProfile)
);

/**
 * POST /api/auth/logout
 * Logout (client remove token)
 */
router.post(
  '/logout',
  authMiddleware,
  asyncHandler(AuthController.logout)
);

/**
 * POST /api/auth/forgot-password
 * Solicitar código de recuperação de palavra-passe
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query("SELECT id, nome FROM utilizadores WHERE email = $1", [email]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "E-mail não encontrado no sistema." });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query("UPDATE utilizadores SET reset_code = $1, reset_expires = $2 WHERE email = $3", [code, expires, email]);

    // ======= SOLUÇÃO PARA TESTES: Mostrar código no servidor =======
    // Em PRODUÇÃO, remover isto e usar email real
    console.log(`
╔════════════════════════════════════════════════════╗
║         CÓDIGO DE RECUPERAÇÃO DE PASSWORD          ║
╠════════════════════════════════════════════════════╣
║ Email: ${email.padEnd(40)}║
║ Código: ${code.padEnd(40)}║
║ Válido por: 15 minutos                            ║
╚════════════════════════════════════════════════════╝
    `);

    // Tentar enviar email (silenciosa se falhar)
    try {
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
    } catch (emailErr) {
      // Se email falhar, mostrar código no response também (para testes)
      console.warn("⚠️  Email falhou, devolvendo código no response para testes");
      res.json({ 
        message: "Código gerado (email indisponível - use para testes)", 
        testCode: code,
        validFor: "15 minutos"
      });
    }
  } catch (err) {
    console.error("Erro ao solicitar recuperação:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

/**
 * POST /api/auth/reset-password
 * Resetar palavra-passe com código de verificação
 */
router.post('/reset-password', async (req, res) => {
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
  } catch (err) {
    console.error("Erro ao resetar palavra-passe:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

/**
 * DEBUG ENDPOINT: POST /api/auth/create-test-user
 * Criar utilizador de teste para demonstração (REMOVER EM PRODUÇÃO)
 */
router.post('/create-test-user', async (req, res) => {
  try {
    // Verificar se o utilizador já existe
    const existingUser = await pool.query("SELECT id FROM utilizadores WHERE email = $1", ['teste@meclinic.pt']);
    if (existingUser.rows.length > 0) {
      return res.json({ message: "Utilizador de teste já existe", email: "teste@meclinic.pt", password: "Teste123!" });
    }

    // Criar novo utilizador de teste
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash("Teste123!", salt);
    
    const newUser = await pool.query(
      "INSERT INTO utilizadores (nome, email, password_hash, mfa_enabled, mfa_secret, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nome, email",
      ["Utilizador Teste", "teste@meclinic.pt", password_hash, false, 'test_secret', 'ASSISTENTE']
    );

    res.json({
      message: "✅ Utilizador de teste criado com sucesso!",
      user: newUser.rows[0],
      credentials: {
        email: "teste@meclinic.pt",
        password: "Teste123!"
      }
    });
  } catch (err) {
    console.error("Erro ao criar utilizador de teste:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
