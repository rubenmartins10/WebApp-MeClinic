const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { authMiddleware, requireRole } = require('../middleware/auth');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('../utils/logger');

// Middleware de autenticação - todas as rotas requerem login
router.use(authMiddleware);

/**
 * GET /api/utilizadores
 * Listar todos os utilizadores
 */
router.get('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, email, role, ativo, created_at, mfa_enabled, telefone
      FROM utilizadores
      ORDER BY nome ASC
    `);
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
});

/**
 * GET /api/utilizadores/assinaturas-clinica
 * Devolve todas as assinaturas de todos os utilizadores da clínica (agregadas)
 * IMPORTANTE: esta rota tem de vir ANTES de /:id para não ser interceptada
 */
router.get('/assinaturas-clinica', requireRole('ADMIN', 'DENTISTA'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, assinatura FROM utilizadores WHERE assinatura IS NOT NULL'
    );
    const all = [];
    for (const row of result.rows) {
      if (!row.assinatura) continue;
      try {
        const parsed = JSON.parse(row.assinatura);
        const list = Array.isArray(parsed.signatures) ? parsed.signatures
          : parsed.signature ? [{ id: Date.now() + Math.random(), signature: parsed.signature, nome: parsed.nome || row.nome }]
          : [];
        list.forEach(s => all.push({ ...s, userId: row.id, userName: row.nome }));
      } catch {
        if (typeof row.assinatura === 'string' && row.assinatura.startsWith('data:')) {
          all.push({ id: Date.now() + Math.random(), signature: row.assinatura, nome: row.nome, userId: row.id, userName: row.nome });
        }
      }
    }
    res.json({ assinaturas: all });
  } catch (error) {
    logger.error('Erro ao obter assinaturas da clínica:', { message: error.message });
    res.status(500).json({ error: 'Erro ao obter assinaturas' });
  }
});

/**
 * GET /api/utilizadores/:id
 * Obter utilizador específico
 */
router.get('/:id', async (req, res) => {
  // Apenas o próprio utilizador ou ADMIN pode aceder ao perfil
  if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Permissão insuficiente' });
  }
  try {
    const result = await pool.query(
      `SELECT id, nome, email, role, ativo, created_at, mfa_enabled, telefone
       FROM utilizadores WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Erro ao obter utilizador:', { message: error.message });
    res.status(500).json({ error: 'Erro ao obter utilizador' });
  }
});

/**
 * POST /api/utilizadores
 * Criar novo utilizador
 */
router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { nome, email, password, role } = req.body;
  
  if (!nome || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e password são obrigatórios' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  try {
    // Verificar se email já existe
    const existente = await pool.query(
      'SELECT id FROM utilizadores WHERE email = $1',
      [email]
    );
    
    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Email já registado' });
    }
    
    // Hash da password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Gerar segredo MFA (M-02)
    const mfaSecret = speakeasy.generateSecret({ name: `MeClinic (${email})` });
    const qrCodeUrl = await QRCode.toDataURL(mfaSecret.otpauth_url);

    const safeRole = ['ADMIN', 'DENTISTA', 'ASSISTENTE'].includes(role) ? role : 'ASSISTENTE';
    const result = await pool.query(
      `INSERT INTO utilizadores (nome, email, password_hash, role, ativo, created_at, mfa_enabled, mfa_secret)
       VALUES ($1, $2, $3, $4, true, NOW(), true, $5)
       RETURNING id, nome, email, role, created_at`,
      [nome, email, passwordHash, safeRole, mfaSecret.base32]
    );

    res.status(201).json({
      message: 'Utilizador criado com sucesso',
      user: result.rows[0],
      mfa: { enabled: true, qrCodeUrl }
    });
  } catch (error) {
    logger.error('Erro ao criar utilizador:', { message: error.message });
    res.status(500).json({ error: 'Erro ao criar utilizador' });
  }
});

/**
 * PUT /api/utilizadores/:id
 * Atualizar utilizador
 */
router.put('/:id', requireRole('ADMIN'), async (req, res) => {
  const { nome, email, role, ativo, telefone, mfaToken } = req.body;

  try {
    const adminRes = await pool.query(
      'SELECT mfa_enabled, mfa_secret FROM utilizadores WHERE id = $1',
      [req.user.id]
    );

    if (!adminRes.rows.length) {
      return res.status(401).json({ error: 'Administrador não encontrado' });
    }

    const admin = adminRes.rows[0];

    // Só verificar MFA se o admin tiver MFA ativo
    if (admin.mfa_enabled && admin.mfa_secret) {
      if (!mfaToken || !/^\d{6}$/.test(String(mfaToken))) {
        return res.status(401).json({ error: 'Código MFA obrigatório (6 dígitos)' });
      }
      const mfaValid = speakeasy.totp.verify({
        secret: admin.mfa_secret,
        encoding: 'base32',
        token: String(mfaToken),
        window: 1
      });
      if (!mfaValid) {
        return res.status(401).json({ error: 'Código MFA inválido' });
      }
    }

    const result = await pool.query(
      `UPDATE utilizadores 
       SET nome = COALESCE($1, nome), 
           email = COALESCE($2, email), 
           role = COALESCE($3, role),
           ativo = COALESCE($4, ativo),
           telefone = COALESCE($5, telefone)
       WHERE id = $6
       RETURNING id, nome, email, role, ativo, created_at, telefone`,
      [nome || null, email || null, role || null, ativo !== undefined ? ativo : null, telefone !== undefined ? telefone : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Erro ao atualizar utilizador:', { message: error.message });
    res.status(500).json({ error: 'Erro ao atualizar utilizador' });
  }
});

/**
 * DELETE /api/utilizadores/:id
 * Deletar utilizador
 */
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  const mfaToken = req.body?.mfaToken || req.headers['x-mfa-token'];

  try {
    const adminRes = await pool.query(
      'SELECT mfa_enabled, mfa_secret FROM utilizadores WHERE id = $1',
      [req.user.id]
    );

    if (!adminRes.rows.length) {
      return res.status(401).json({ error: 'Administrador não encontrado' });
    }

    const admin = adminRes.rows[0];

    // Só verificar MFA se o admin tiver MFA ativo
    if (admin.mfa_enabled && admin.mfa_secret) {
      if (!mfaToken || !/^\d{6}$/.test(String(mfaToken))) {
        return res.status(401).json({ error: 'Código MFA obrigatório (6 dígitos)' });
      }
      const mfaValid = speakeasy.totp.verify({
        secret: admin.mfa_secret,
        encoding: 'base32',
        token: String(mfaToken),
        window: 1
      });
      if (!mfaValid) {
        return res.status(401).json({ error: 'Código MFA inválido' });
      }
    }

    const result = await pool.query(
      'DELETE FROM utilizadores WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json({ message: 'Utilizador removido com sucesso' });
  } catch (error) {
    logger.error('Erro ao remover utilizador:', { message: error.message });
    res.status(500).json({ error: 'Erro ao remover utilizador' });
  }
});

/**
 * GET /api/utilizadores/:id/assinatura
 * Obter assinatura digital do utilizador
 * Apenas o próprio utilizador ou ADMIN pode aceder
 */
router.get('/:id/assinatura', async (req, res) => {
  if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Permissão insuficiente' });
  }
  try {
    const result = await pool.query(
      'SELECT assinatura FROM utilizadores WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json({ assinatura: result.rows[0].assinatura || null });
  } catch (error) {
    logger.error('Erro ao obter assinatura:', { message: error.message });
    res.status(500).json({ error: 'Erro ao obter assinatura' });
  }
});

/**
 * PUT /api/utilizadores/:id/assinatura
 * Guardar assinatura digital do utilizador
 */
router.put('/:id/assinatura', async (req, res) => {
  // Apenas o próprio utilizador ou ADMIN pode guardar a assinatura
  if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Permissão insuficiente' });
  }
  const { assinatura } = req.body;
  if (!assinatura) return res.status(400).json({ error: 'Assinatura em falta' });
  try {
    const result = await pool.query(
      'UPDATE utilizadores SET assinatura = $1 WHERE id = $2 RETURNING id',
      [assinatura, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json({ success: true });
  } catch (error) {
    // Se a coluna não existir, criá-la automaticamente e tentar de novo
    if (error.code === '42703') {
      try {
        await pool.query('ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS assinatura TEXT');
        await pool.query('UPDATE utilizadores SET assinatura = $1 WHERE id = $2', [assinatura, req.params.id]);
        return res.json({ success: true });
      } catch (e2) {
        return res.status(500).json({ error: 'Erro ao guardar assinatura' });
      }
    }
    console.error('Erro ao guardar assinatura:', error);
    res.status(500).json({ error: 'Erro ao guardar assinatura' });
  }
});

module.exports = router;
