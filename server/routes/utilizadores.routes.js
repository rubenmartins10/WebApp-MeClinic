const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');

// Middleware de autenticação - todas as rotas requerem login
router.use(authMiddleware);

/**
 * GET /api/utilizadores
 * Listar todos os utilizadores
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, email, role, ativo, created_at, mfa_enabled
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
 * GET /api/utilizadores/:id
 * Obter utilizador específico
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nome, email, role, ativo, created_at, mfa_enabled
       FROM utilizadores WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao obter utilizador' });
  }
});

/**
 * POST /api/utilizadores
 * Criar novo utilizador
 */
router.post('/', async (req, res) => {
  const { nome, email, password, role } = req.body;
  
  if (!nome || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e password são obrigatórios' });
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
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const result = await pool.query(
      `INSERT INTO utilizadores (nome, email, password_hash, role, ativo, created_at, mfa_enabled)
       VALUES ($1, $2, $3, $4, true, NOW(), false)
       RETURNING id, nome, email, role, created_at`,
      [nome, email, passwordHash, role || 'ASSISTENTE']
    );
    
    res.status(201).json({
      message: 'Utilizador criado com sucesso',
      user: result.rows[0],
      qrCodeUrl: null
    });
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    res.status(500).json({ error: 'Erro ao criar utilizador' });
  }
});

/**
 * PUT /api/utilizadores/:id
 * Atualizar utilizador
 */
router.put('/:id', async (req, res) => {
  const { nome, email, role, ativo } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE utilizadores 
       SET nome = COALESCE($1, nome), 
           email = COALESCE($2, email), 
           role = COALESCE($3, role),
           ativo = COALESCE($4, ativo)
       WHERE id = $5
       RETURNING id, nome, email, role, ativo, created_at`,
      [nome || null, email || null, role || null, ativo !== undefined ? ativo : null, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    res.status(500).json({ error: 'Erro ao atualizar utilizador' });
  }
});

/**
 * DELETE /api/utilizadores/:id
 * Deletar utilizador
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM utilizadores WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    res.json({ message: 'Utilizador removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover utilizador:', error);
    res.status(500).json({ error: 'Erro ao remover utilizador' });
  }
});

/**
 * GET /api/utilizadores/:id/assinatura
 * Obter assinatura digital do utilizador
 */
router.get('/:id/assinatura', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT assinatura FROM utilizadores WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json({ assinatura: result.rows[0].assinatura || null });
  } catch (error) {
    console.error('Erro ao obter assinatura:', error);
    res.status(500).json({ error: 'Erro ao obter assinatura' });
  }
});

/**
 * PUT /api/utilizadores/:id/assinatura
 * Guardar assinatura digital do utilizador
 */
router.put('/:id/assinatura', async (req, res) => {
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
