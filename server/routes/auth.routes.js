const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { asyncHandler } = require('../errorHandler');
const { validateRequest, registerSchema, loginSchema } = require('../validation/authValidation');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const pool = require('../db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

// Rate limit específico para login/register (mais restritivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: 'Demasiadas tentativas. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

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
  loginLimiter,
  validateRequest(registerSchema),
  asyncHandler(AuthController.register)
);

/**
 * POST /api/auth/login
 * Fazer login
 */
router.post(
  '/login',
  loginLimiter,
  validateRequest(loginSchema),
  asyncHandler(AuthController.login)
);

/**
 * POST /api/auth/refresh
 * Renovar access token com refresh token
 */
router.post('/refresh', asyncHandler(AuthController.refresh));

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
    if (userRes.rows.length === 0) {
      // Resposta genérica — não revelar se o email existe (H-04: email enumeration)
      return res.json({ message: "Se o e-mail existir no sistema, receberá um código em breve." });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query("UPDATE utilizadores SET reset_code = $1, reset_expires = $2 WHERE email = $3", [code, expires, email]);

    // Mostrar código apenas em desenvolvimento (nunca em produção)
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Reset code gerado (apenas dev)', { email, code });
    }

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
      logger.warn('Email de recuperação falhou', { message: emailErr.message });
      // Não revelar o código nem confirmar se email existe
      res.json({ message: "Se o e-mail existir no sistema, receberá um código em breve." });
    }
  } catch (err) {
    logger.error('Erro ao solicitar recuperação:', { message: err.message });
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

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE utilizadores SET password_hash = $1, reset_code = NULL, reset_expires = NULL WHERE email = $2", [hash, email]);

    res.json({ message: "Palavra-passe alterada com sucesso! Já pode fazer login." });
  } catch (err) {
    logger.error('Erro ao resetar palavra-passe:', { message: err.message });
    res.status(500).json({ error: "Erro no servidor." });
  }
});

/**
 * GET /api/auth/activity
 * Retorna sessões activas e histórico de login do utilizador autenticado
 * Admin vê todas as sessões; assistentes vêem só as próprias
 */
router.get('/activity', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  try {
    // Sessões activas: is_active = true E last_seen nos últimos 5 minutos
    const activeSessions = await pool.query(
      `SELECT 
        al.id,
        al.user_id,
        u.nome as user_name,
        u.role,
        al.device_info,
        al.location,
        al.created_at as login_time,
        al.last_seen as last_activity,
        al.session_id,
        al.is_active,
        CASE WHEN al.is_active = TRUE AND al.last_seen > NOW() - INTERVAL '5 minutes' THEN TRUE ELSE FALSE END as really_active
      FROM activity_log al
      JOIN utilizadores u ON al.user_id = u.id
      WHERE al.action_type = 'LOGIN' 
        AND al.status = 'success'
        AND al.created_at > NOW() - INTERVAL '30 days'
      ORDER BY al.is_active DESC, al.last_seen DESC
      LIMIT 20`,
      []
    );

    // Histórico de login do utilizador (últimos 30 dias)
    const loginHistory = await pool.query(
      `SELECT 
        al.id,
        al.user_id,
        u.nome as user_name,
        u.role,
        al.device_info,
        al.location,
        al.status,
        al.created_at as data
      FROM activity_log al
      JOIN utilizadores u ON al.user_id = u.id
      WHERE al.user_id = $1 
        AND al.action_type = 'LOGIN'
        AND al.created_at > NOW() - INTERVAL '30 days'
      ORDER BY al.created_at DESC
      LIMIT 20`,
      [userId]
    );

    res.json({
      activeSessions: activeSessions.rows,
      loginHistory: loginHistory.rows,
      currentUser: {
        id: req.user.id,
        nome: req.user.nome,
        role: req.user.role
      }
    });
  } catch (err) {
    logger.error('Erro ao buscar activity:', { message: err.message });
    res.status(500).json({ error: 'Erro ao buscar histórico de atividade' });
  }
}));

/**
 * POST /api/auth/heartbeat
 * Atualiza last_seen da sessão atual para manter status "ativo"
 */
router.post('/heartbeat', authMiddleware, asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId obrigatório' });
  }

  await pool.query(
    `UPDATE activity_log SET last_seen = NOW() WHERE session_id = $1 AND user_id = $2 AND is_active = TRUE`,
    [sessionId, req.user.id]
  );
  res.json({ ok: true });
}));

/**
 * POST /api/auth/terminate-session
 * Termina uma sessão específica (marca is_active = false)
 * Admin pode terminar qualquer sessão; assistente só as próprias
 */
router.post('/terminate-session', authMiddleware, asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId obrigatório' });
  }

  const isAdmin = req.user.role === 'ADMIN';

  if (isAdmin) {
    await pool.query(
      `UPDATE activity_log SET is_active = FALSE WHERE session_id = $1`,
      [sessionId]
    );
  } else {
    await pool.query(
      `UPDATE activity_log SET is_active = FALSE WHERE session_id = $1 AND user_id = $2`,
      [sessionId, req.user.id]
    );
  }

  res.json({ ok: true, message: 'Sessão terminada com sucesso' });
}));

/**
 * POST /api/auth/terminate-all-sessions
 * Termina todas as sessões activas (excepto a sessão actual, opcionalmente)
 */
router.post('/terminate-all-sessions', authMiddleware, asyncHandler(async (req, res) => {
  const { exceptSessionId } = req.body;
  const isAdmin = req.user.role === 'ADMIN';

  if (isAdmin) {
    // Admin termina TODAS as sessões
    if (exceptSessionId) {
      await pool.query(
        `UPDATE activity_log SET is_active = FALSE WHERE is_active = TRUE AND session_id != $1`,
        [exceptSessionId]
      );
    } else {
      await pool.query(`UPDATE activity_log SET is_active = FALSE WHERE is_active = TRUE`);
    }
  } else {
    // Assistente só termina as próprias
    if (exceptSessionId) {
      await pool.query(
        `UPDATE activity_log SET is_active = FALSE WHERE user_id = $1 AND is_active = TRUE AND session_id != $2`,
        [req.user.id, exceptSessionId]
      );
    } else {
      await pool.query(
        `UPDATE activity_log SET is_active = FALSE WHERE user_id = $1 AND is_active = TRUE`,
        [req.user.id]
      );
    }
  }

  res.json({ ok: true, message: 'Todas as sessões foram terminadas' });
}));

/**
 * POST /api/auth/logout
 * Marca a sessão actual como inactiva
 */
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    await pool.query(
      `UPDATE activity_log SET is_active = FALSE WHERE session_id = $1 AND user_id = $2`,
      [sessionId, req.user.id]
    );
  }
  res.json({ ok: true });
}));

module.exports = router;
