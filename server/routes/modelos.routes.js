const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Middleware de autenticação - todas as rotas requerem login
router.use(authMiddleware);

/**
 * GET /api/modelos-procedimento
 * Listar todos os modelos de procedimentos
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, custo_total_estimado, preco_servico
      FROM modelos_procedimento
      ORDER BY nome ASC
    `);
    
    res.json({
      modelos: result.rows || []
    });
  } catch (error) {
    console.error('Erro ao listar modelos:', error);
    res.status(500).json({ error: 'Erro ao listar modelos de procedimento' });
  }
});

/**
 * GET /api/modelos-procedimento/:id
 * Obter modelo específico
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM modelos_procedimento WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Modelo não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao obter modelo' });
  }
});

/**
 * GET /api/modelos-procedimento/:id/itens
 * Listar itens de um modelo
 */
router.get('/:id/itens', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, modelo_procedimento_id, nome_item, quantidade, preco_unitario, 
             (quantidade * preco_unitario) as preco_total_item
      FROM modelo_procedimento_itens
      WHERE modelo_procedimento_id = $1
      ORDER BY nome_item ASC
    `, [req.params.id]);
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao listar itens' });
  }
});

/**
 * POST /api/modelos-procedimento
 * Criar novo modelo
 */
router.post('/', async (req, res) => {
  const { nome, custo_total_estimado, preco_servico } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO modelos_procedimento (nome, custo_total_estimado, preco_servico, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [nome, custo_total_estimado || 0, preco_servico || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar modelo:', error);
    res.status(500).json({ error: 'Erro ao criar modelo' });
  }
});

/**
 * PUT /api/modelos-procedimento/:id
 * Atualizar modelo
 */
router.put('/:id', async (req, res) => {
  const { nome, custo_total_estimado, preco_servico } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE modelos_procedimento 
       SET nome = $1, custo_total_estimado = $2, preco_servico = $3
       WHERE id = $4
       RETURNING *`,
      [nome, custo_total_estimado || 0, preco_servico || 0, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Modelo não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar modelo:', error);
    res.status(500).json({ error: 'Erro ao atualizar modelo' });
  }
});

/**
 * DELETE /api/modelos-procedimento/:id
 * Deletar modelo
 */
router.delete('/:id', async (req, res) => {
  try {
    // Primeiro, remover itens associados
    await pool.query('DELETE FROM modelo_procedimento_itens WHERE modelo_procedimento_id = $1', [req.params.id]);
    
    // Depois remover o modelo
    const result = await pool.query(
      'DELETE FROM modelos_procedimento WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Modelo não encontrado' });
    }
    
    res.json({ message: 'Modelo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover modelo:', error);
    res.status(500).json({ error: 'Erro ao remover modelo' });
  }
});

module.exports = router;
