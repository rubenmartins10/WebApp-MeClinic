const express = require('express');
const router = express.Router();
const pool = require('../db');
const nodemailer = require('nodemailer');
const { authMiddleware, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// Email transporter setup - usando Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

router.use(authMiddleware);

// Relatório Semanal Detalhado
router.get('/weekly-detail', async (req, res) => {
  const { start } = req.query;
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
      JOIN modelos_procedimento m ON c.procedimento_id = m.id
      JOIN pacientes p ON c.paciente_id = p.id
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
router.post('/send-email', requireRole('ADMIN'), async (req, res) => {
  const { emailDestino, pdfBase64, semana, subject, message } = req.body;

  if (!pdfBase64 || !pdfBase64.includes('base64,')) {
    return res.status(400).json({ error: 'PDF inválido ou em falta.' });
  }

  try {
    // Usar subject e message customizados se fornecidos, caso contrário usar os padrões
    const emailSubject = subject || `[INTERNO] Relatório Geral de Atividade Meclinic – Semana de ${semana}`;
    const emailBody = message || `Caro(s) membro(s) da Administração,\n\nInformo que o Relatório Geral da clínica, referente à semana de ${semana}, já se encontra processado e disponível para a vossa análise.\n\nEste documento compila os dados globais da operação, incluindo:\n• Total de procedimentos e consultas realizadas;\n• Sumário de faturação e custos de materiais;\n• Alertas de stock e validade.\n\nPor se tratar de um documento com dados confidenciais do negócio, o resumo financeiro detalhado e seguro encontra-se apenas no PDF em anexo e na plataforma oficial.\n\nFico à disposição para qualquer esclarecimento adicional ou se precisarem de ajuda a extrair algum dado mais específico.\n\nCom os melhores cumprimentos,\nSistema Automático Meclinic`;

    const reportBuffer = Buffer.from(pdfBase64.split("base64,")[1], "base64");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailDestino,
      subject: emailSubject,
      text: emailBody,
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

// ========================================
// NOVO: Envio Automático de Relatório Semanal
// ========================================
const { sendWeeklyReportEmail } = require('../controllers/reportsController');

/**
 * Endpoint para enviar relatório semanal manualmente
 * Útil para testes
 * POST /api/reports/send-weekly-manual
 */
router.post('/send-weekly-manual', async (req, res) => {
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
