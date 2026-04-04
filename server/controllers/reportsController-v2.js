const pool = require('../db');
const PDFTemplate = require('../utils/pdfTemplate');
const nodemailer = require('nodemailer');

/**
 * Controller de Relatórios - Versão Refatorizada
 * Gera relatórios em PDF profissionais e envia por email aos administradores
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
 * Gerar relatório semanal em PDF com design profissional
 */
async function generateWeeklyReportPDF() {
  try {
    // Calcular data de início (segunda-feira da semana anterior)
    const today = new Date();
    const currentDay = today.getDay();
    const daysBack = currentDay === 0 ? 6 : currentDay - 1;
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
      consultas_cancelada: 0,
      consultas_concluidas: 0
    };

    // Buscar top 5 pacientes
    const topPatientsQuery = await pool.query(`
      SELECT p.nome, COUNT(c.id) as num_consultas
      FROM consultas c
      JOIN pacientes p ON c.id_paciente = p.id
      WHERE c.data_consulta >= $1 AND c.data_consulta <= $2
      GROUP BY p.id, p.nome
      ORDER BY num_consultas DESC
      LIMIT 5
    `, [weekStart, weekEnd]);

    // Buscar top 5 produtos vendidos
    const topProductsQuery = await pool.query(`
      SELECT pr.nome, SUM(fp.quantidade) as qtde_vendida, SUM(fp.quantidade * fp.preco_unitario) as total_vendas
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
      SELECT nome, stock_atual, stock_minimo, 
        CASE WHEN data_validade <= CURRENT_DATE + interval '30 days' THEN 'Vence em breve' ELSE 'OK' END as status_validade
      FROM produtos
      WHERE stock_atual <= stock_minimo OR (data_validade <= CURRENT_DATE + interval '30 days')
      ORDER BY stock_atual ASC
      LIMIT 10
    `);

    // Criar PDF com template profissional
    const pdf = new PDFTemplate({ margin: 40 });
    const doc = pdf.getDoc();

    // Cabeçalho
    pdf.addHeader(
      'RELATÓRIO SEMANAL DE ATIVIDADE',
      'Resumo Executivo da Clínica'
    );

    // Info do documento
    const weekFormatted = `${weekStart.toLocaleDateString('pt-PT')} a ${weekEnd.toLocaleDateString('pt-PT')}`;
    pdf.addDocumentInfo({
      date: new Date().toLocaleString('pt-PT'),
      period: weekFormatted,
      user: 'Sistema Automático'
    });

    // === RESUMO EXECUTIVO ===
    pdf.addSection('RESUMO EXECUTIVO');

    const summaryData = [
      ['Total de Consultas', `${stats.total_consultas}`],
      ['Total de Pacientes Únicos', `${stats.total_pacientes}`],
      ['Faturação Semanal', `€${parseFloat(stats.faturacao_total).toFixed(2)}`],
      ['Número de Faturas', `${stats.total_faturas}`],
      ['Ticket Médio', `€${parseFloat(stats.valor_medio_fatura).toFixed(2)}`]
    ];

    summaryData.forEach(([label, value]) => {
      pdf.addKeyValue(label, value);
    });

    doc.moveDown(0.5);

    // === STATUS DE CONSULTAS ===
    pdf.addSection('STATUS DE CONSULTAS');

    const consultasStatus = [
      ['Confirmadas', `${stats.consultas_confirmadas}`],
      ['Concluídas', `${stats.consultas_concluidas}`],
      ['Canceladas', `${stats.consultas_cancelada}`]
    ];

    consultasStatus.forEach(([status, count]) => {
      pdf.addKeyValue(status, count);
    });

    doc.moveDown(0.5);

    // === TOP PACIENTES ===
    if (topPatientsQuery.rows.length > 0) {
      pdf.addSection('TOP 5 PACIENTES');
      
      const patientHeaders = ['Posição', 'Paciente', 'Consultas'];
      const patientRows = topPatientsQuery.rows.map((p, i) => [
        `${i + 1}`,
        p.nome,
        `${p.num_consultas}`
      ]);

      pdf.addSimpleTable(patientHeaders, patientRows);
      doc.moveDown(0.5);
    }

    // === TOP PRODUTOS ===
    if (topProductsQuery.rows.length > 0) {
      pdf.addSection('TOP 5 PRODUTOS VENDIDOS');
      
      const productHeaders = ['Posição', 'Produto', 'Quantidade', 'Total €'];
      const productRows = topProductsQuery.rows.map((p, i) => [
        `${i + 1}`,
        p.nome.substring(0, 30),
        `${p.qtde_vendida}`,
        `€${parseFloat(p.total_vendas).toFixed(2)}`
      ]);

      pdf.addSimpleTable(productHeaders, productRows);
      doc.moveDown(0.5);
    }

    // === ALERTAS DE STOCK ===
    if (stockAlertsQuery.rows.length > 0) {
      pdf.addSection('ALERTAS DE STOCK E VALIDADE');
      
      pdf.addHighlightBox(
        `Existem ${stockAlertsQuery.rows.length} produtos com stock baixo ou próximo de vencer. Revise urgentemente.`,
        'warning'
      );

      stockAlertsQuery.rows.forEach((product) => {
        const status = product.status_validade === 'Vence em breve' ? 'URGENTE' : 'BAIXO STOCK';
        doc.fontSize(9).fillColor('#ef4444').font('Helvetica-Bold')
          .text(`${status}:`, doc.x, doc.y);
        
        doc.font('Helvetica').fillColor('#666666')
          .text(
            ` ${product.nome} (Stock: ${product.stock_atual}/${product.stock_minimo}) - ${product.status_validade}`,
            doc.x + 50,
            doc.y - 12
          );
        
        doc.moveDown(0.5);
      });
    }

    // Adicionar rodapé profissional
    pdf.addFooter();

    // Retornar PDF
    return await pdf.finish();

  } catch (error) {
    console.error('Erro ao gerar PDF de relatório:', error);
    throw error;
  }
}

/**
 * Obter todos os administradores
 */
async function getAdministrators() {
  try {
    const result = await pool.query(
      "SELECT email, nome FROM utilizadores WHERE role = 'ADMIN' AND email IS NOT NULL"
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar administradores:', error);
    return [];
  }
}

/**
 * Enviar relatório por email para todos administradores
 */
async function sendWeeklyReportEmail() {
  try {
    console.log('[REPORT] Iniciando geração de relatório semanal...');

    // Gerar PDF
    const pdfBuffer = await generateWeeklyReportPDF();
    console.log('[REPORT] PDF gerado com sucesso');

    // Obter lista de administradores
    const admins = await getAdministrators();
    if (admins.length === 0) {
      console.log('[REPORT] ⚠️  Nenhum administrador encontrado para enviar relatório');
      return { success: false, message: 'Nenhum administrador encontrado' };
    }

    console.log(`[REPORT] Enviando relatório para ${admins.length} administrador(es)...`);

    // Enviar email para cada administrador
    const emailPromises = admins.map(admin => {
      const mailOptions = {
        from: `MeClinic <${process.env.EMAIL_USER}>`,
        to: admin.email,
        subject: `Relatório Semanal MeClinic - ${new Date().toLocaleDateString('pt-PT')}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Relatório Semanal</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Sistema de Gestão MeClinic</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; margin: 0 0 15px 0;">Olá ${admin.nome},</p>
              <p style="color: #666; margin: 0 0 15px 0;">
                Segue em anexo o relatório semanal da clínica com as principais estatísticas, 
                vendas, pacientes e alertas de stock.
              </p>
              <div style="background: #ffffff; border-left: 4px solid #2563eb; padding: 15px; margin: 15px 0; border-radius: 4px;">
                <p style="color: #2563eb; font-weight: bold; margin: 0 0 5px 0;">Ficheiro anexado:</p>
                <p style="color: #666; margin: 0;">Relatório_Semanal_${new Date().toISOString().split('T')[0]}.pdf</p>
              </div>
              <p style="color: #999; font-size: 12px; margin: 20px 0 0 0; border-top: 1px solid #ddd; padding-top: 10px;">
                Este é um email automático gerado pelo sistema MeClinic.
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

    console.log(`[REPORT] ✅ Relatório enviado com sucesso para ${admins.length} administrador(es)`);
    return {
      success: true,
      message: `Relatório enviado para ${admins.length} administrador(es)`,
      adminCount: admins.length
    };

  } catch (error) {
    console.error('[REPORT] Erro ao enviar relatório:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

module.exports = {
  generateWeeklyReportPDF,
  sendWeeklyReportEmail,
  getAdministrators
};
