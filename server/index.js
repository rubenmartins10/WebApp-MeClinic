'use strict';
require('dotenv').config();

const https = require('https');
const fs    = require('fs');
const path  = require('path');
const cron  = require('node-cron');

const app    = require('./app');
const pool   = require('./db');
const logger = require('./utils/logger');
const { purgeExpired } = require('./utils/tokenStore');

// ==========================================
// --- START SERVER ---
// ==========================================
const PORT      = process.env.PORT || 5000;
const certPath  = path.join(__dirname, 'cert.pem');
const keyPath   = path.join(__dirname, 'key.pem');

let httpsOptions = null;
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  try {
    const cert = fs.readFileSync(certPath, 'utf-8').trim();
    const key  = fs.readFileSync(keyPath,  'utf-8').trim();
    if (cert.includes('BEGIN CERTIFICATE') && key.includes('BEGIN')) {
      httpsOptions = { key, cert };
      logger.info('Certificados SSL carregados com sucesso');
    }
  } catch (err) {
    logger.warn('Erro ao carregar certificados SSL:', { message: err.message });
  }
}

if (httpsOptions && process.env.NODE_ENV !== 'development') {
  https.createServer(httpsOptions, app).listen(443, () => {
    logger.info(`HTTPS Servidor ativo na porta 443`);
  });
} else if (httpsOptions) {
  https.createServer(httpsOptions, app).listen(PORT, () => {
    logger.info(`HTTPS Servidor ativo em https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    logger.info(`HTTP Servidor ativo em http://localhost:${PORT} | NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  });
}

// ==========================================
// --- CRON: Limpar refresh tokens expirados (a cada hora) ---
// ==========================================
cron.schedule('0 * * * *', () => {
  purgeExpired();
});

// ==========================================
// --- CRON: Relatório semanal (sexta-feira 16:00) ---
// ==========================================
const { sendWeeklyReportEmail } = require('./controllers/reportsController');

cron.schedule('0 16 * * 5', async () => {
  logger.info('[SCHEDULED] Iniciando envio automático de relatório semanal...');
  const result = await sendWeeklyReportEmail();
  if (result.success) {
    logger.info(`[SCHEDULED] ${result.message}`);
  } else {
    logger.error(`[SCHEDULED] Erro: ${result.message || result.error}`);
  }
});
logger.info('Agendamento ativo: Relatórios enviados toda sexta-feira às 16:00');

// ==========================================
// --- CRON: Lembretes de consultas (a cada minuto) ---
// ==========================================
const { sendConsultaReminderEmail, sendStockAlertEmail } = require('./services/notificationService');
const consultasJaNotificadas = new Set();

cron.schedule('* * * * *', async () => {
  try {
    const now    = new Date();
    const target = new Date(now.getTime() + 15 * 60 * 1000);
    const dataPT = target.toISOString().split('T')[0];
    const horaTarget = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;

    const result = await pool.query(
      `SELECT c.id, p.nome as paciente_nome, p.email, p.telefone,
              c.data_consulta, c.hora_consulta, m.nome as procedimento_nome
       FROM consultas c
       JOIN pacientes p ON c.paciente_id = p.id
       LEFT JOIN modelos_procedimento m ON c.procedimento_id = m.id
       WHERE c.data_consulta = $1
         AND LEFT(c.hora_consulta::text, 5) = $2
         AND c.status NOT IN ('cancelada', 'concluida')`,
      [dataPT, horaTarget]
    );

    for (const consulta of result.rows) {
      if (consultasJaNotificadas.has(consulta.id)) continue;
      consultasJaNotificadas.add(consulta.id);
      await sendConsultaReminderEmail(consulta);
    }
  } catch (err) {
    logger.error('[CRON][CONSULTAS] Erro no cron de lembretes:', { message: err.message });
  }
});
logger.info('Agendamento ativo: Lembretes de consultas verificados a cada minuto');

// ==========================================
// --- CRON: Alertas de stock baixo (08:00 diário) ---
// ==========================================
const Produto = require('./models/Produto');

cron.schedule('0 8 * * *', async () => {
  try {
    const produtosBaixos = await Produto.getLowStockAlerts();
    if (produtosBaixos.length === 0) return;
    logger.info(`[CRON][STOCK] ${produtosBaixos.length} produto(s) com stock baixo — enviando alertas...`);
    for (const produto of produtosBaixos) {
      await sendStockAlertEmail(produto);
    }
  } catch (err) {
    logger.error('[CRON][STOCK] Erro no scan diário de stock:', { message: err.message });
  }
});
logger.info('Agendamento ativo: Scan de stock baixo todos os dias às 08:00');
