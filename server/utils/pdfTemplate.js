/**
 * Template Profissional de PDF para MeClinic
 * Fornece funções reutilizáveis para gerar PDFs com estética consistente
 */

const PDFDocument = require('pdfkit');

class PDFTemplate {
  constructor(options = {}) {
    this.options = {
      size: 'A4',
      margin: 40,
      ...options
    };
    
    // Cores profissionais
    this.colors = {
      primary: '#2563eb',      // Azul
      secondary: '#6b7280',    // Cinzento
      success: '#10b981',      // Verde
      warning: '#f59e0b',      // Amarelo
      danger: '#ef4444',       // Vermelho
      text: '#000000',
      subtext: '#666666',
      lightGray: '#f3f4f6',
      border: '#e5e7eb'
    };
    
    this.doc = new PDFDocument({
      size: this.options.size,
      margin: this.options.margin,
      bufferPages: true
    });
    
    this.buffers = [];
    this.doc.on('data', this.buffers.push.bind(this.buffers));
  }

  /**
   * Escrever cabeçalho profissional
   */
  addHeader(title, subtitle) {
    const pageWidth = this.doc.page.width;
    
    // Logo/Título principal
    this.doc.fontSize(24).fillColor(this.colors.primary).font('Helvetica-Bold').text('MeClinic', {
      align: 'center'
    });
    
    // Subtítulo
    this.doc.fontSize(10).fillColor(this.colors.secondary).font('Helvetica').text(subtitle || 'Sistema de Gestão Clínica', {
      align: 'center'
    });
    
    // Espaço
    this.doc.moveDown(0.5);
    
    // Linha divisória
    this.doc.moveTo(this.options.margin, this.doc.y).lineTo(pageWidth - this.options.margin, this.doc.y)
      .stroke(this.colors.border);
    
    this.doc.moveDown(1);
    
    // Título do documento
    this.doc.fontSize(16).fillColor(this.colors.text).font('Helvetica-Bold').text(title);
    this.doc.moveDown(0.3);
  }

  /**
   * Adicionar data e informações do documento
   */
  addDocumentInfo(info) {
    this.doc.fontSize(9).fillColor(this.colors.subtext).font('Helvetica');
    
    if (info.date) {
      this.doc.text(`Gerado em: ${info.date}`);
    }
    if (info.period) {
      this.doc.text(`Período: ${info.period}`);
    }
    if (info.user) {
      this.doc.text(`Utilizador: ${info.user}`);
    }
    
    this.doc.moveDown(0.8);
  }

  /**
   * Adicionar seção com título
   */
  addSection(title) {
    this.doc.fontSize(12).fillColor(this.colors.primary).font('Helvetica-Bold').text(title);
    
    const pageWidth = this.doc.page.width;
    this.doc.moveTo(this.options.margin, this.doc.y).lineTo(pageWidth - this.options.margin, this.doc.y)
      .stroke(this.colors.primary);
    
    this.doc.moveDown(0.5);
  }

  /**
   * Adicionar par chave-valor
   */
  addKeyValue(label, value, labelFont = 'bold', valueColor = null) {
    const startY = this.doc.y;
    
    this.doc.fontSize(10).font(`Helvetica-${labelFont}`).fillColor(this.colors.secondary)
      .text(label, this.options.margin);
    
    this.doc.y = startY;
    this.doc.font('Helvetica').fillColor(valueColor || this.colors.text)
      .text(String(value || '-'), this.options.margin + 100);
    
    this.doc.moveDown(0.4);
  }

  /**
   * Adicionar tabela simples
   */
  addSimpleTable(headers, rows) {
    const pageWidth = this.doc.page.width;
    const tableWidth = pageWidth - (this.options.margin * 2);
    const colWidth = tableWidth / headers.length;
    
    const tableStartY = this.doc.y;
    
    // Cabeçalho
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
    this.doc.rect(this.options.margin, this.doc.y, tableWidth, 25).fill(this.colors.primary);
    
    headers.forEach((header, i) => {
      this.doc.text(header, this.options.margin + (i * colWidth) + 5, tableStartY + 7, {
        width: colWidth - 10
      });
    });
    
    this.doc.moveDown(1.8);
    
    // Linhas
    rows.forEach((row, rowIndex) => {
      const rowY = this.doc.y;
      const bgColor = rowIndex % 2 === 0 ? '#f9fafb' : '#ffffff';
      
      this.doc.rect(this.options.margin, rowY, tableWidth, 20).fill(bgColor);
      this.doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);
      
      row.forEach((cell, cellIndex) => {
        this.doc.text(String(cell || '-'), this.options.margin + (cellIndex * colWidth) + 5, rowY + 5, {
          width: colWidth - 10
        });
      });
      
      this.doc.moveDown(1.4);
    });
  }

  /**
   * Adicionar caixa de destaque (para avisos, resumos, etc)
   */
  addHighlightBox(content, color = 'primary') {
    const pageWidth = this.doc.page.width;
    const boxWidth = pageWidth - (this.options.margin * 2);
    
    const boxY = this.doc.y;
    this.doc.rect(this.options.margin, boxY, boxWidth, 40).stroke(this.colors[color]);
    
    this.doc.fontSize(9).fillColor(this.colors[color]).font('Helvetica')
      .text(content, this.options.margin + 10, boxY + 10, {
        width: boxWidth - 20
      });
    
    this.doc.moveDown(2.5);
  }

  /**
   * Adicionar rodapé profissional
   */
  addFooter() {
    const pageCount = this.doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      this.doc.switchToPage(i);
      
      const pageHeight = this.doc.page.height;
      const pageWidth = this.doc.page.width;
      
      // Linha divisória
      this.doc.moveTo(this.options.margin, pageHeight - 35).lineTo(pageWidth - this.options.margin, pageHeight - 35)
        .stroke(this.colors.border);
      
      // Texto do rodapé
      this.doc.fontSize(8).fillColor(this.colors.subtext).font('Helvetica');
      this.doc.text('Este documento é confidencial e protegido pelo Regulamento Geral de Proteção de Dados (RGPD)', 
        this.options.margin, pageHeight - 30, { align: 'left', width: pageWidth - (this.options.margin * 2) });
      
      // Número de página
      this.doc.text(`Página ${i + 1} de ${pageCount}`, pageWidth - this.options.margin - 50, pageHeight - 30, { 
        align: 'right' 
      });
      
      // Data
      this.doc.fontSize(7).text(`MeClinic™ - ${new Date().getFullYear()}`, this.options.margin, pageHeight - 15);
    }
  }

  /**
   * Finalizar e retornar buffer do PDF
   */
  finish() {
    return new Promise((resolve, reject) => {
      this.doc.on('end', () => {
        const pdfBuffer = Buffer.concat(this.buffers);
        resolve(pdfBuffer);
      });
      
      this.doc.on('error', reject);
      this.doc.end();
    });
  }

  /**
   * Retornar documento para manipulação direta
   */
  getDoc() {
    return this.doc;
  }
}

module.exports = PDFTemplate;
