const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Dashboard Summary - resumo da semana
router.get('/dashboard-summary', async (req, res) => {
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
    res.json(stats.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dados de consultas por semana para o gráfico
router.get('/patients-weekly', async (req, res) => {
  const { start } = req.query;
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(date_series, 'DD/MM') as date, COALESCE(COUNT(c.id), 0)::int as count 
      FROM generate_series($1::date, $1::date + '6 days'::interval, '1 day'::interval) date_series 
      LEFT JOIN consultas c ON c.data_consulta::date = DATE(date_series) 
      GROUP BY date_series 
      ORDER BY date_series ASC
    `, [start]);
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alertas de Stock
router.get('/stock-alerts', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nome, stock_atual, stock_minimo, unidade_medida FROM produtos WHERE stock_atual <= stock_minimo ORDER BY nome ASC"
    );
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alertas de Validade
router.get('/validade-alerts', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nome, data_validade, categoria FROM produtos WHERE data_validade IS NOT NULL AND data_validade <= CURRENT_DATE + interval '30 days' ORDER BY data_validade ASC"
    );
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
