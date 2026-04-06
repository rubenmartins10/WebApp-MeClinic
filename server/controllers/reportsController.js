const pool = require('../db');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Controller de Relatórios
 * Gera relatórios em PDF e envia por email aos administradores
 */

// Configurar transporter de email - Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Gerar relatório semanal em PDF
 * Retorna buffer do PDF gerado
 */
async function generateWeeklyReportPDF() {
  return new Promise(async (resolve, reject) => {
    try {
      // Calcular data de início (segunda-feira da semana anterior)
      const today = new Date();
      const currentDay = today.getDay();
      const daysBack = currentDay === 0 ? 6 : currentDay - 1; // Segunda = 1
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysBack - 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Buscar estatísticas da semana
      const statsQuery = await pool.query(`
        SELECT
          COUNT(DISTINCT c.id) as total_consultas,
          COUNT(DISTINCT p.id) as total_pacientes,
          COALESCE(SUM(f.valor_total), 0) as faturacao_total,
          COALESCE(COUNT(DISTINCT f.id), 0) as total_faturas,
          COALESCE(AVG(f.valor_total), 0) as valor_medio_fatura,
          COUNT(DISTINCT CASE WHEN c.status = 'confirmada' THEN c.id END) as consultas_confirmadas,
          COUNT(DISTINCT CASE WHEN c.status = 'cancelada' THEN c.id END) as consultas_canceladas,
          COUNT(DISTINCT CASE WHEN c.status = 'concluida' THEN c.id END) as consultas_concluidas
        FROM consultas c
        LEFT JOIN pacientes p ON c.id_paciente = p.id
        LEFT JOIN faturacao f ON c.id = f.id_consulta
        WHERE c.data_consulta >= $1 AND c.data_consulta <= $2
      `, [weekStart, weekEnd]);

      const stats = statsQuery.rows[0] || {
        total_consultas: 0,
        total_pacientes: 0,
        faturacao_total: 0,
        total_faturas: 0,
        valor_medio_fatura: 0,
        consultas_confirmadas: 0,
        consultas_canceladas: 0,
        consultas_concluidas: 0
      };

      // Buscar top 5 pacientes mais consultados
      const topPatientsQuery = await pool.query(`
        SELECT 
          p.nome,
          COUNT(c.id) as num_consultas
        FROM consultas c
        JOIN pacientes p ON c.id_paciente = p.id
        WHERE c.data_consulta >= $1 AND c.data_consulta <= $2
        GROUP BY p.id, p.nome
        ORDER BY num_consultas DESC
        LIMIT 5
      `, [weekStart, weekEnd]);

      // Buscar top 5 produtos mais vendidos
      const topProductsQuery = await pool.query(`
        SELECT 
          pr.nome,
          SUM(fp.quantidade) as qtde_vendida,
          SUM(fp.quantidade * fp.preco_unitario) as total_vendas
        FROM faturacao_produtos fp
        JOIN produtos pr ON fp.id_produto = pr.id
        JOIN faturacao f ON fp.id_fatura = f.id
        WHERE f.data_emissao >= $1 AND f.data_emissao <= $2
        GROUP BY pr.id, pr.nome
        ORDER BY qtde_vendida DESC
        LIMIT 5
      `, [weekStart, weekEnd]);

      // Buscar alertas de stock
      const stockAlertsQuery = await pool.query(`
        SELECT 
          nome,
          stock_atual,
          stock_minimo,
          CASE WHEN data_validade <= CURRENT_DATE + interval '30 days' THEN 'Vence em breve' ELSE 'OK' END as status_validade
        FROM produtos
        WHERE stock_atual <= stock_minimo OR (data_validade <= CURRENT_DATE + interval '30 days')
        ORDER BY stock_atual ASC
        LIMIT 10
      `);

      // Criar PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- CABEÇALHO ---
      doc.fontSize(24).font('Helvetica-Bold').text('MeClinic', { align: 'center' });
      doc.fontSize(11).font('Helvetica').text('Clínica de Saúde Integrada', { align: 'center' });
      doc.fontSize(9).fillColor('#666666').text('Rua Exemplo, 123 • 0000-000 Lisboa • Portugal', { align: 'center' });
      doc.fontSize(9).text('Tel: +351 XXX XXX XXX • Email: contato@meclinic.pt', { align: 'center' });
      
      doc.moveTo(40, doc.y + 10).lineTo(555, doc.y + 10).stroke('#cccccc');
      doc.moveDown();

      // --- TÍTULOS E DATA ---
      const weekFormatted = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}/${weekStart.getFullYear()} a ${weekEnd.getDate().toString().padStart(2, '0')}/${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}/${weekEnd.getFullYear()}`;
      
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text('Relatório Semanal', { align: 'left' });
      doc.fontSize(11).font('Helvetica').fillColor('#666666').text(`Período: ${weekFormatted}`, { align: 'left' });
      doc.fontSize(11).text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, { align: 'left' });
      doc.moveDown(0.5);

      // --- RESUMO EXECUTIVO ---
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('📊 RESUMO EXECUTIVO');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#0066cc');
      doc.moveDown(0.5);

      // Grid de estatísticas
      const boxWidth = 105;
      const boxHeight = 55;
      const boxesPerRow = 5;
      const boxes = [
        { label: 'Consultas', value: stats.total_consultas, color: '#0066cc' },
        { label: 'Pacientes', value: stats.total_pacientes, color: '#2563eb' },
        { label: 'Faturação', value: `€${parseFloat(stats.faturacao_total).toFixed(2)}`, color: '#ffc107' },
        { label: 'Faturas', value: stats.total_faturas, color: '#fd7e14' },
        { label: 'Ticket Médio', value: `€${parseFloat(stats.valor_medio_fatura).toFixed(2)}`, color: '#6f42c1' }
      ];

      boxes.forEach((box, idx) => {
        const x = 50 + (idx * boxWidth);
        doc.rect(x, doc.y, boxWidth - 5, boxHeight).stroke(box.color);
        doc.fontSize(9).font('Helvetica').fillColor('#666666').text(box.label, x + 5, doc.y + 5, { width: boxWidth - 10 });
        doc.fontSize(14).font('Helvetica-Bold').fillColor(box.color).text(box.value.toString(), x + 5, doc.y + 20, { width: boxWidth - 10, align: 'center' });
      });

      doc.moveDown(4);

      // --- STATUS DE CONSULTAS ---
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('📋 STATUS DE CONSULTAS');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#0066cc');
      doc.moveDown(0.5);

      const consultasStatus = [
        { status: 'Confirmadas', value: stats.consultas_confirmadas, color: '#2563eb' },
        { status: 'Concluídas', value: stats.consultas_concluidas, color: '#0066cc' },
        { status: 'Canceladas', value: stats.consultas_canceladas, color: '#dc3545' }
      ];

      let yPosition = doc.y;
      consultasStatus.forEach((item) => {
        doc.fontSize(10).font('Helvetica').fillColor('#000000').text(item.status, 50, yPosition);
        doc.rect(250, yPosition - 3, 15, 15).fill(item.color);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(item.color).text(item.value.toString(), 275, yPosition);
        yPosition += 20;
      });

      doc.moveDown(2);

      // --- TOP PACIENTES ---
      if (topPatientsQuery.rows.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('👥 TOP 5 PACIENTES');
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#0066cc');
        doc.moveDown(0.5);

        // Cabeçalho tabela
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
        doc.rect(50, doc.y, 400, 20).fill('#0066cc');
        doc.text('Paciente', 60, doc.y + 5);
        doc.text('Consultas', 400, doc.y + 5);
        doc.moveDown(1.5);

        // Linhas da tabela
        topPatientsQuery.rows.forEach((patient, idx) => {
          const bgColor = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
          doc.rect(50, doc.y, 400, 20).fill(bgColor);
          doc.fontSize(10).font('Helvetica').fillColor('#000000');
          doc.text(patient.nome, 60, doc.y + 5, { width: 330 });
          doc.text(patient.num_consultas.toString(), 400, doc.y + 5);
          doc.moveDown(1.5);
        });

        doc.moveDown(0.5);
      }

      // --- TOP PRODUTOS ---
      if (topProductsQuery.rows.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('📦 TOP 5 PRODUTOS VENDIDOS');
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#0066cc');
        doc.moveDown(0.5);

        // Cabeçalho tabela
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
        doc.rect(50, doc.y, 400, 20).fill('#0066cc');
        doc.text('Produto', 60, doc.y + 5);
        doc.text('Qtde', 350, doc.y + 5);
        doc.text('Total', 420, doc.y + 5);
        doc.moveDown(1.5);

        // Linhas da tabela
        topProductsQuery.rows.forEach((product, idx) => {
          const bgColor = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
          doc.rect(50, doc.y, 400, 20).fill(bgColor);
          doc.fontSize(10).font('Helvetica').fillColor('#000000');
          doc.text(product.nome.substring(0, 40), 60, doc.y + 5, { width: 280 });
          doc.text(product.qtde_vendida.toString(), 350, doc.y + 5);
          doc.text(`€${parseFloat(product.total_vendas).toFixed(2)}`, 420, doc.y + 5);
          doc.moveDown(1.5);
        });

        doc.moveDown(0.5);
      }

      // --- ALERTAS DE STOCK ---
      if (stockAlertsQuery.rows.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('⚠️  ALERTAS DE STOCK E VALIDADE');
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#dc3545');
        doc.moveDown(0.5);

        doc.fontSize(9).font('Helvetica').fillColor('#666666');
        stockAlertsQuery.rows.forEach((item) => {
          doc.text(`• ${item.nome} - Stock: ${parseFloat(item.stock_atual).toFixed(2)} (Mín: ${item.stock_minimo}) - ${item.status_validade}`, { indent: 20 });
        });

        doc.moveDown(1);
      }

      // --- RODAPÉ ---
      doc.fontSize(9).fillColor('#666666').text('_________________________________________________________________________________', { align: 'center' });
      doc.fontSize(8).text('MeClinic™ - Sistema de Gestão Clínica | Relatório Confidencial', { align: 'center' });
      doc.text('Este relatório contém informações confidenciais e é destinado apenas para uso interno.', { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Obter todos os administradores
 */
async function getAdministrators() {
  try {
    const result = await pool.query(
      "SELECT email, nome FROM utilizadores WHERE role = 'ADMIN' AND email IS NOT NULL",
    );
    return result.rows;
  } catch (error) {
    logger.error('Erro ao buscar administradores:', { message: error.message });
    return [];
  }
}

/**
 * Enviar relatório por email para todos administradores
 */
async function sendWeeklyReportEmail() {
  try {
    logger.info('[REPORT] Iniciando geração de relatório semanal...');

    // Gerar PDF
    const pdfBuffer = await generateWeeklyReportPDF();
    logger.info('[REPORT] PDF gerado com sucesso');

    // Obter lista de administradores
    const admins = await getAdministrators();
    if (admins.length === 0) {
      logger.warn('[REPORT] Nenhum administrador encontrado para enviar relatório');
      return { success: false, message: 'Nenhum administrador encontrado' };
    }

    logger.info(`[REPORT] Enviando relatório para ${admins.length} administrador(es)...`);

    // Enviar email para cada administrador
    const emailPromises = admins.map(admin => {
      const mailOptions = {
        from: `MeClinic <${process.env.EMAIL_USER}>`,
        to: admin.email,
        subject: `📊 Relatório Semanal MeClinic - ${new Date().toLocaleDateString('pt-PT')}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: #ffffff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">📊 Relatório Semanal</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Sistema de Gestão MeClinic</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; margin: 0 0 15px 0;">Olá ${admin.nome},</p>
              <p style="color: #666; margin: 0 0 15px 0;">
                Segue em anexo o relatório semanal da clínica MeClinic com as principais estatísticas, 
                vendas, pacientes e alertas.
              </p>
              <div style="background: #ffffff; border-left: 4px solid #0066cc; padding: 15px; margin: 15px 0; border-radius: 4px;">
                <p style="color: #0066cc; font-weight: bold; margin: 0 0 5px 0;">📎 Documento anexado:</p>
                <p style="color: #666; margin: 0;">Relatório_Semanal_${new Date().toISOString().split('T')[0]}.pdf</p>
              </div>
              <p style="color: #999; font-size: 12px; margin: 20px 0 0 0; border-top: 1px solid #ddd; padding-top: 10px;">
                Este é um email automático gerado pelo sistema MeClinic. 
                Por favor, não responda a este email.
              </p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `Relatório_Semanal_${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    logger.info(`[REPORT] Relatório enviado com sucesso para ${admins.length} administrador(es)`);
    return {
      success: true,
      message: `Relatório enviado para ${admins.length} administrador(es)`,
      recipients: admins.length
    };

  } catch (error) {
    logger.error('[REPORT] Erro ao enviar relatório:', { message: error.message });
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateWeeklyReportPDF,
  sendWeeklyReportEmail,
  getAdministrators
};
