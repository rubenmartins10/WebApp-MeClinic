const { sendEmail } = require('../services/emailService');
const { sendWhatsappMessage } = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * POST /api/notificacoes/enviar-receita
 * Envia receita médica por email (com PDF em anexo) e/ou WhatsApp (mensagem de texto).
 * Body: { email, telefone, paciente_nome, pdfBase64, nomeFicheiro, mensagemWhatsapp }
 */
async function enviarReceita(req, res) {
  const { email, telefone, paciente_nome, pdfBase64, nomeFicheiro, mensagemWhatsapp } = req.body || {};
  const results = { email: null, whatsapp: null };

  // --- Email com PDF em anexo ---
  if (email && pdfBase64) {
    try {
      const clinicNome = process.env.CLINIC_NAME || 'MeClinic';
      const dataHoje = new Date().toLocaleDateString('pt-PT', { dateStyle: 'long' });
      const primeiroNome = (paciente_nome || 'Paciente').split(' ')[0];

      const subject = `Receita Médica — ${clinicNome}`;
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#1d4ed8,#1e40af);color:#fff;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
            <h1 style="margin:0;font-size:22px;">📄 Receita Médica</h1>
            <p style="margin:6px 0 0;font-size:13px;">${clinicNome}</p>
          </div>
          <div style="background:#f8f9fa;padding:24px;border-radius:0 0 10px 10px;">
            <p style="color:#333;margin:0 0 12px;">Caro(a) <strong>${primeiroNome}</strong>,</p>
            <p style="color:#333;margin:0 0 16px;">Em anexo encontra a sua receita médica emitida em <strong>${dataHoje}</strong>.</p>
            <p style="color:#333;margin:0 0 16px;">Por favor cumpra a medicação conforme indicado. Em caso de dúvida ou reação adversa, contacte-nos de imediato.</p>
            <p style="color:#666;font-size:13px;margin:20px 0 0;border-top:1px solid #ddd;padding-top:12px;">
              Este é um email automático do sistema ${clinicNome}. Por favor, não responda a este email.
            </p>
          </div>
        </div>
      `;

      // Extrair base64 puro do data URI (formato: data:application/pdf;base64,XXXX)
      const base64Pure = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;

      await sendEmail(email, subject, html, [{
        filename: nomeFicheiro || 'receita.pdf',
        content: base64Pure,
        encoding: 'base64',
        contentType: 'application/pdf',
      }]);
      results.email = 'sent';
      logger.info(`[NOTIF][RECEITA] Email enviado para ${email}`);
    } catch (err) {
      results.email = 'error';
      logger.error('[NOTIF][RECEITA] Erro ao enviar email:', { message: err.message });
    }
  }

  // --- WhatsApp ---
  if (telefone) {
    try {
      const clinicNome = process.env.CLINIC_NAME || 'MeClinic';
      const primeiroNome = (paciente_nome || 'Paciente').split(' ')[0];
      const dataHoje = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
      const msg = mensagemWhatsapp
        || `Olá ${primeiroNome}! 🦷\n\nA sua receita médica foi emitida em ${dataHoje} pela ${clinicNome}.\n\nEncontra o PDF em anexo no email enviado. Por favor cumpra a medicação conforme indicado. Em caso de dúvida, contacte-nos.\n\nCom os melhores cumprimentos,\nEquipa ${clinicNome}`;
      await sendWhatsappMessage(telefone, msg);
      results.whatsapp = 'sent';
    } catch (err) {
      results.whatsapp = 'error';
      logger.error('[NOTIF][RECEITA] Erro ao enviar WhatsApp:', { message: err.message });
    }
  }

  res.json({ success: true, results });
}

/**
 * POST /api/notificacoes/enviar-whatsapp
 * Envia uma mensagem WhatsApp via Twilio.
 * Body: { telefone, mensagem }
 */
async function enviarWhatsapp(req, res) {
  const { telefone, mensagem } = req.body || {};
  if (!telefone || !mensagem) {
    return res.status(400).json({ success: false, error: 'telefone e mensagem são obrigatórios' });
  }

  try {
    await sendWhatsappMessage(telefone, mensagem);
    res.json({ success: true });
  } catch (err) {
    logger.error('[NOTIF][WA] Erro ao enviar WhatsApp:', { message: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { enviarReceita, enviarWhatsapp };
