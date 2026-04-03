const express = require('express');
const router = express.Router();
const pool = require('../db');
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

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

// Relatório Semanal Detalhado (MOVER PARA reports.routes.js)
// Este endpoint foi movido para /api/reports/weekly-detail
// Mantendo esta rota para compatibilidade com versões antigas
router.get('/weekly-detail', async (req, res) => {
  const { start } = req.query;
  try {
    const report = await pool.query(`
      SELECT 
        COUNT(c.id)::int as total_consultas, 
        COALESCE(SUM(m.preco_servico), 0)::float as faturacao_total, 
        COALESCE(SUM(m.custo_total_estimado), 0)::float as custos_materiais_total, 
        (COALESCE(SUM(m.preco_servico), 0) - COALESCE(SUM(m.custo_total_estimado), 0))::float as lucro_estimado 
      FROM consultas c 
      JOIN modelos_procedimento m ON c.procedimento_id = m.id 
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
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// --- REPORT EMAIL ENDPOINTS (DEPRECATED) ---
// ==========================================
// Este endpoint foi movido para /api/reports/send-email
// Mantendo esta rota para compatibilidade com versões antigas
router.post('/send-email', async (req, res) => {
  const { emailDestino, pdfBase64, semana } = req.body;
  
  try {
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

module.exports = router;
