const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

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

module.exports = { sendEmail, dataUriToBuffer };
