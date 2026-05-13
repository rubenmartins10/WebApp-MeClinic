const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendEmail, buildEmailHtml } = require('../services/emailService');

router.use(authMiddleware);

// Relatório Semanal Detalhado
router.get('/weekly-detail', async (req, res) => {
  const { start } = req.query;
  if (!start || isNaN(Date.parse(start))) {
    return res.status(400).json({ error: 'Parâmetro start inválido. Use o formato YYYY-MM-DD.' });
  }
  try {
    const report = await pool.query(`
      SELECT 
        COUNT(c.id)::int as total_consultas, 
        COALESCE(SUM(m.preco_servico), 0)::float as faturacao_total, 
        COALESCE(SUM(m.custo_total_estimado), 0)::float as custos_materiais_total, 
        (COALESCE(SUM(m.preco_servico), 0) - COALESCE(SUM(m.custo_total_estimado), 0))::float as lucro_estimado,
        COUNT(DISTINCT c.paciente_id)::int as total_pacientes,
        COUNT(DISTINCT CASE WHEN p.created_at::date BETWEEN $1::date AND $1::date + '6 days'::interval THEN p.id END)::int as pacientes_novos,
        COUNT(DISTINCT CASE WHEN c.status = 'confirmada' THEN c.id END)::int as consultas_confirmadas,
        COUNT(DISTINCT CASE WHEN c.status = 'concluida'  THEN c.id END)::int as consultas_concluidas,
        COUNT(DISTINCT CASE WHEN c.status = 'cancelada'  THEN c.id END)::int as consultas_canceladas
      FROM consultas c 
      LEFT JOIN modelos_procedimento m ON c.procedimento_id = m.id
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.data_consulta::date BETWEEN $1::date AND $1::date + '6 days'::interval
    `, [start]);
    
    const procedimentos = await pool.query(`
      SELECT m.nome, COUNT(c.id)::int as quantidade, SUM(m.preco_servico)::float as subtotal_faturado 
      FROM consultas c 
      JOIN modelos_procedimento m ON c.procedimento_id = m.id 
      WHERE c.data_consulta::date BETWEEN $1::date AND $1::date + '6 days'::interval 
      GROUP BY m.nome ORDER BY quantidade DESC
    `, [start]);
    
    const materiais = await pool.query(`
      SELECT mpi.nome_item as material, SUM(mpi.quantidade)::int as quantidade_total, mpi.preco_unitario, SUM(mpi.quantidade * mpi.preco_unitario)::float as custo_total 
      FROM consultas c 
      JOIN modelo_procedimento_itens mpi ON c.procedimento_id = mpi.modelo_id 
      WHERE c.data_consulta::date BETWEEN $1::date AND $1::date + '6 days'::interval 
      GROUP BY mpi.nome_item, mpi.preco_unitario ORDER BY quantidade_total DESC
    `, [start]);
    
    const notas = await pool.query(`
      SELECT data_emissao, paciente_nome, procedimento_nome, metodo_pagamento, valor_total 
      FROM faturacao 
      WHERE data_emissao::date BETWEEN $1::date AND $1::date + '6 days'::interval 
      ORDER BY data_emissao DESC
    `, [start]);

    res.json({
      resumo: report.rows[0] || {},
      detalhe_procedimentos: procedimentos.rows || [],
      top_materiais: materiais.rows || [],
      notas_faturacao: notas.rows || []
    });
  } catch (err) {
    logger.error('Erro weekly-detail', { message: err.message });
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

// Envio de Relatório por Email — restrito a ADMIN (M-01)
router.post('/send-email', requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  const { emailDestino, pdfBase64, semana, subject } = req.body;

  if (!pdfBase64 || !pdfBase64.includes('base64,')) {
    return res.status(400).json({ error: 'PDF inválido ou em falta.' });
  }

  try {
    const reportDate = semana || new Date().toISOString().split('T')[0];
    const emailSubject = subject || `Relatório Semanal MeClinic — ${new Date(reportDate).toLocaleDateString('pt-PT')}`;

    const userName = req.user?.nome || 'Administrador';
    const html = buildEmailHtml('Relatório Semanal', `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Segue em anexo o <strong>relatório semanal</strong> da clínica com a análise de desempenho e custos, referente à semana de <strong>${new Date(reportDate).toLocaleDateString('pt-PT')}</strong>.</p>
      <p>Este documento inclui:</p>
      <ul style="margin:8px 0 12px 0;padding-left:20px;color:#374151;">
        <li>Total de consultas e pacientes atendidos</li>
        <li>Resumo de faturação e custos</li>
        <li>Alertas de stock e validade</li>
      </ul>
      <p style="margin:0;color:#64748b;font-size:13px;">Ficheiro em anexo: <strong>Relatorio_Meclinic_${reportDate}.pdf</strong></p>
    `);

    const reportBuffer = Buffer.from(pdfBase64.split("base64,")[1], "base64");
    await sendEmail(emailDestino, emailSubject, html, [
      { filename: `Relatorio_Meclinic_${reportDate}.pdf`, content: reportBuffer, contentType: 'application/pdf' }
    ]);

    res.json({ message: 'Relatório enviado com sucesso.' });
  } catch (err) {
    logger.error('Erro ao enviar relatório por email:', { message: err.message });
    res.status(500).json({ error: 'Erro ao enviar e-mail.' });
  }
});

// ========================================
// NOVO: Envio Automático de Relatório Semanal
// ========================================
const { sendWeeklyReportEmail } = require('../controllers/reportsController');

/**
 * Endpoint para enviar relatório semanal manualmente
 * Útil para testes
 * POST /api/reports/send-weekly-manual
 */
router.post('/send-weekly-manual', requireRole('ADMIN'), async (req, res) => {
  try {
    const result = await sendWeeklyReportEmail();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
