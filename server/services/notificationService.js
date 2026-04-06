const twilio = require('twilio');
const { sendEmail } = require('./emailService');
const pool = require('../db');
const logger = require('../utils/logger');

/**
 * Obtém todos os administradores com email (e telefone se disponível).
 */
async function getAdmins() {
  try {
    const result = await pool.query(
      "SELECT email, nome, telefone FROM utilizadores WHERE role = 'ADMIN' AND email IS NOT NULL"
    );
    return result.rows;
  } catch (err) {
    logger.error('[NOTIF] Erro ao buscar admins:', { message: err.message });
    return [];
  }
}

/**
 * Envia mensagem WhatsApp via Twilio.
 * Requer TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM no .env.
 * @param {string} telefone  - Número do destinatário (qualquer formato PT)
 * @param {string} body      - Texto da mensagem
 */
async function sendWhatsappMessage(telefone, body) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    logger.warn('[WA] Twilio não configurado — WhatsApp não enviado');
    return;
  }
  if (!telefone) { logger.warn('[WA] Telefone não fornecido'); return; }

  // Normalizar número: remover tudo exceto dígitos, garantir código-país
  let num = telefone.replace(/\D/g, '');
  if (num.startsWith('00')) num = num.slice(2);
  if (!num.startsWith('351') && num.length <= 9) num = '351' + num;

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
      to: `whatsapp:+${num}`,
      body,
    });
    logger.info(`[WA] WhatsApp enviado para +${num}`);
  } catch (err) {
    logger.error(`[WA] Erro ao enviar WhatsApp para +${num}:`, { message: err.message });
  }
}

/**
 * Envia email de alerta de stock baixo para todos os administradores.
 * @param {{ id, nome, stock_atual, stock_minimo, categoria }} produto
 */
async function sendStockAlertEmail(produto) {
  try {
    const admins = await getAdmins();
    if (admins.length === 0) {
      logger.warn('[NOTIF][STOCK] Nenhum admin encontrado para enviar alerta de stock.');
      return;
    }

    const subject = `⚠️ Stock Baixo: ${produto.nome}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#b91c1c;color:#fff;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:22px;">⚠️ Alerta de Stock Baixo</h1>
          <p style="margin:6px 0 0;font-size:13px;">Sistema MeClinic</p>
        </div>
        <div style="background:#f8f9fa;padding:24px;border-radius:0 0 10px 10px;">
          <p style="color:#333;margin:0 0 16px;">O produto abaixo atingiu o stock mínimo:</p>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
            <tr style="background:#fee2e2;">
              <td style="padding:10px 16px;font-weight:bold;color:#991b1b;width:40%;">Produto</td>
              <td style="padding:10px 16px;color:#333;">${produto.nome}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-weight:bold;color:#555;">Categoria</td>
              <td style="padding:10px 16px;color:#333;">${produto.categoria || '—'}</td>
            </tr>
            <tr style="background:#fef2f2;">
              <td style="padding:10px 16px;font-weight:bold;color:#991b1b;">Stock Atual</td>
              <td style="padding:10px 16px;color:#b91c1c;font-weight:bold;">${produto.stock_atual}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-weight:bold;color:#555;">Stock Mínimo</td>
              <td style="padding:10px 16px;color:#333;">${produto.stock_minimo}</td>
            </tr>
          </table>
          <p style="color:#666;font-size:13px;margin:20px 0 0;border-top:1px solid #ddd;padding-top:12px;">
            Por favor, reponha o stock assim que possível.<br>
            Este é um email automático do sistema MeClinic.
          </p>
        </div>
      </div>
    `;

    await Promise.all(admins.map(admin => sendEmail(admin.email, subject, html)));
    logger.info(`[NOTIF][STOCK] Alerta de stock enviado para ${admins.length} admin(s): ${produto.nome}`);

    // WhatsApp para admins com telefone
    const msgWa = `⚠️ Stock Baixo: ${produto.nome}\nStock atual: ${produto.stock_atual} (mínimo: ${produto.stock_minimo}). Por favor reponha o stock. — Sistema MeClinic`;
    const adminsComTel = admins.filter(a => a.telefone);
    for (const admin of adminsComTel) {
      await sendWhatsappMessage(admin.telefone, msgWa);
    }
  } catch (err) {
    logger.error('[NOTIF][STOCK] Erro ao enviar alerta de stock:', { message: err.message });
  }
}

/**
 * Envia email de lembrete de consulta para o paciente.
 * @param {{ id, paciente_nome, email, data_consulta, hora_consulta, procedimento_nome }} consulta
 */
async function sendConsultaReminderEmail(consulta) {
  if (!consulta.email) {
    logger.warn(`[NOTIF][CONSULTA] Paciente sem email: ${consulta.paciente_nome} (consulta ${consulta.id})`);
    return;
  }

  try {
    const dataFormatada = new Date(consulta.data_consulta).toLocaleDateString('pt-PT', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const hora = consulta.hora_consulta
      ? String(consulta.hora_consulta).substring(0, 5)
      : '';

    const subject = `🔔 Lembrete: Consulta em 15 minutos — ${hora}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#1d4ed8,#1e40af);color:#fff;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:22px;">🔔 Lembrete de Consulta</h1>
          <p style="margin:6px 0 0;font-size:13px;">Sistema MeClinic</p>
        </div>
        <div style="background:#f8f9fa;padding:24px;border-radius:0 0 10px 10px;">
          <p style="color:#333;margin:0 0 16px;">Olá <strong>${consulta.paciente_nome}</strong>,</p>
          <p style="color:#333;margin:0 0 20px;">A sua consulta começa em <strong>15 minutos</strong>. Não se atrase!</p>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
            <tr style="background:#dbeafe;">
              <td style="padding:10px 16px;font-weight:bold;color:#1e40af;width:40%;">Data</td>
              <td style="padding:10px 16px;color:#333;">${dataFormatada}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-weight:bold;color:#555;">Hora</td>
              <td style="padding:10px 16px;color:#333;font-weight:bold;">${hora}</td>
            </tr>
            ${consulta.procedimento_nome ? `
            <tr style="background:#eff6ff;">
              <td style="padding:10px 16px;font-weight:bold;color:#555;">Procedimento</td>
              <td style="padding:10px 16px;color:#333;">${consulta.procedimento_nome}</td>
            </tr>` : ''}
          </table>
          <p style="color:#666;font-size:13px;margin:20px 0 0;border-top:1px solid #ddd;padding-top:12px;">
            Este é um email automático do sistema MeClinic. Por favor, não responda a este email.
          </p>
        </div>
      </div>
    `;

    await sendEmail(consulta.email, subject, html);
    logger.info(`[NOTIF][CONSULTA] Lembrete enviado para ${consulta.email} (consulta ${consulta.id})`);

    // WhatsApp se o paciente tiver telefone
    if (consulta.telefone) {
      const primeiroNome = consulta.paciente_nome.split(' ')[0];
      const msgWa = `Olá ${primeiroNome}! 🔔 Lembrete: a sua consulta está marcada para ${hora}. Por favor não se atrase. Qualquer dúvida, contacte-nos. — Equipa MeClinic`;
      await sendWhatsappMessage(consulta.telefone, msgWa);
    }
  } catch (err) {
    logger.error(`[NOTIF][CONSULTA] Erro ao enviar lembrete (consulta ${consulta.id}):`, { message: err.message });
  }
}

module.exports = { sendStockAlertEmail, sendConsultaReminderEmail, sendWhatsappMessage };
