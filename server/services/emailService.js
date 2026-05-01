const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Gera um email HTML com o template padrão MeClinic.
 *
 * @param {string} title      - Título principal no cabeçalho (ex: "Receita Médica")
 * @param {string} bodyHtml   - Conteúdo HTML do corpo do email
 * @returns {string}          - HTML completo
 */
function buildEmailHtml(title, bodyHtml) {
  const clinicNome = process.env.CLINIC_NAME || 'MeClinic';
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#1d4ed8,#1e40af);padding:28px 32px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${title}</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.80);font-size:13px;">${clinicNome}</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="background:#ffffff;padding:28px 32px;color:#1e293b;font-size:15px;line-height:1.7;">
                ${bodyHtml}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                  Este é um email automático do sistema ${clinicNome}. Por favor, não responda a este email.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Cria o transporter uma única vez (lazy singleton).
 * Lê as variáveis do .env em runtime para que alterações ao ficheiro
 * sejam reflectidas sem recompilar.
 */
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true = 465, false = STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return _transporter;
}

/**
 * Envia um email com anexos opcionais.
 *
 * @param {string} to        - Endereço do destinatário
 * @param {string} subject   - Assunto
 * @param {string} html      - Corpo HTML
 * @param {Array}  attachments - Array de { filename, content (Buffer|base64 string), encoding }
 */
async function sendEmail(to, subject, html, attachments = []) {
  const from = `"MeClinic" <${process.env.EMAIL_USER}>`;

  try {
    const info = await getTransporter().sendMail({ from, to, subject, html, attachments });
    logger.info(`Email enviado para ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`Falha ao enviar email para ${to}: ${err.message}`);
    throw err;
  }
}

/**
 * Converte um dataURI base64 ("data:application/pdf;base64,JVBERi0...")
 * para um Buffer pronto a usar como anexo.
 */
function dataUriToBuffer(dataUri) {
  const base64 = dataUri.replace(/^data:[^;]+;base64,/, '');
  return Buffer.from(base64, 'base64');
}

module.exports = { sendEmail, dataUriToBuffer, buildEmailHtml };
