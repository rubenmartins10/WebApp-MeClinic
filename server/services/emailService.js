const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Gera um email HTML com o template padrão MeClinic —
 * visualmente alinhado com o cabeçalho dos PDFs (faixa escura + banner azul + corpo branco).
 *
 * @param {string} title      - Título do documento (ex: "Receita Médica")
 * @param {string} bodyHtml   - Conteúdo HTML do corpo do email
 * @returns {string}          - HTML completo
 */
function buildEmailHtml(title, bodyHtml) {
  const clinicNome     = process.env.CLINIC_NAME     || 'MeClinic';
  const clinicMorada   = process.env.CLINIC_ADDRESS  || '';
  const clinicTelefone = process.env.CLINIC_PHONE    || '';
  const clinicEmail    = process.env.CLINIC_EMAIL    || '';
  const clinicNif      = process.env.CLINIC_NIF      || '';

  const footerParts = [
    clinicNif      ? `NIF: ${clinicNif}`   : null,
    clinicMorada   || null,
    clinicTelefone || null,
    clinicEmail    || null,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Faixa escura topo (igual ao rect tealDark 2px dos PDFs) -->
        <tr>
          <td style="background:#1d4ed8;height:4px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Banner principal azul (igual ao rect teal 26px dos PDFs) -->
        <tr>
          <td style="background:#2563eb;padding:18px 32px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <!-- Nome da clínica à esquerda -->
                <td style="vertical-align:middle;">
                  <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">${clinicNome.toUpperCase()}</span>
                </td>
                <!-- Título do documento à direita -->
                <td style="vertical-align:middle;text-align:right;">
                  <span style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${title}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Info bar azul claro (igual ao tealBg dos PDFs) -->
        <tr>
          <td style="background:#dbeafe;padding:10px 32px;border-bottom:2px solid #2563eb;">
            <p style="margin:0;color:#1e293b;font-size:12px;">
              Emitido em <strong>${new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
              &nbsp;·&nbsp; Sistema de Gestão Clínica
            </p>
          </td>
        </tr>

        <!-- Corpo branco -->
        <tr>
          <td style="background:#ffffff;padding:28px 32px;color:#1e293b;font-size:15px;line-height:1.75;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Rodapé com dados da clínica -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:3px solid #2563eb;">
            ${footerParts.length > 0 ? `
            <p style="margin:0 0 6px;color:#1d4ed8;font-size:12px;font-weight:700;text-align:center;">${clinicNome}</p>
            <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">${footerParts.join('&nbsp;&nbsp;|&nbsp;&nbsp;')}</p>
            ` : `
            <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;font-weight:700;">${clinicNome}</p>
            `}
            <p style="margin:8px 0 0;color:#cbd5e1;font-size:10px;text-align:center;">
              Email automático — por favor não responda a esta mensagem.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
  const clinicNome = process.env.CLINIC_NAME || 'MeClinic';
  const from = `"${clinicNome}" <${process.env.EMAIL_USER}>`;

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
