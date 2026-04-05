import React, { useState, useEffect, useContext } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, ChevronLeft, ChevronRight, Printer, Mail, CheckCircle, XCircle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ThemeContext } from '../contexts/ThemeContext';
import { LanguageContext } from '../contexts/LanguageContext'; // <-- Importar Idiomas
import { getActiveLocale } from '../utils/locale';
import apiService from '../services/api';
import logo from '../assets/logo.png'; 

const Report = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext); // <-- Tradutor e língua ativa
  
  const [reportData, setReportData] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const user = (() => { try { return JSON.parse(localStorage.getItem('meclinic_user') || '{}'); } catch { return {}; } })();
  const isAdmin = user.role === 'ADMIN';

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  const fetchReport = (date) => {
    apiService.get(`/api/reports/weekly-detail?start=${date}`)
      .then(data => setReportData(data))
      .catch(() => {});
  };

  useEffect(() => { fetchReport(currentWeekStart); }, [currentWeekStart]);

  const navegarSemana = (dias) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + dias);
    setCurrentWeekStart(d.toISOString().split('T')[0]);
  };

  const showNotif = (type, message) => setNotification({ show: true, type, message });
  const closeNotif = () => setNotification({ show: false, type: '', message: '' });

  const activeLocale = getActiveLocale(language);

  const gerarPDFDocumento = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const mg = 12;

    // ─ Colour palette ──────────────────────────────────────────────────────
    const C = {
      teal:      [14, 170, 165],
      tealDark:  [8,  120, 116],
      tealBg:    [230, 248, 248],
      white:     [255, 255, 255],
      dark:      [25,  25,  25],
      gray:      [110, 110, 110],
      lightGray: [247, 247, 247],
      midGray:   [210, 210, 210],
      green:     [37,   99, 235],
      red:       [220,  38,  38],
      blue:      [37,   99, 235],
      headerBg:  [45,   55,  72],
    };

    const clinicSettings = (() => {
      try { return JSON.parse(localStorage.getItem('meclinic_settings') || '{}'); } catch { return {}; }
    })();
    const clinicNome     = clinicSettings.nome     || 'MeClinic';
    const clinicMorada   = (clinicSettings.morada  || 'Rua Principal, 123  |  Lisboa, Portugal').replace(/\n/g, '  |  ');
    const clinicEmail    = clinicSettings.email    || 'geral@meclinic.pt';
    const clinicTelefone = clinicSettings.telefone || '+351 XXX XXX XXX';

    const r   = reportData || {};
    const rs  = r.resumo   || {};
    const fmt = (d) => new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const euro = (v) => {
      const n = parseFloat(v || 0);
      return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ac';
    };

    const dateStart = new Date(currentWeekStart + 'T00:00:00');
    const dateEnd   = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 6);

    // ── TOP TEAL BANNER ────────────────────────────────────────────────────
    doc.setFillColor(...C.tealDark);
    doc.rect(0, 0, W, 2, 'F');
    doc.setFillColor(...C.teal);
    doc.rect(0, 2, W, 26, 'F');

    const img = new Image();
    img.src = logo;
    try { doc.addImage(img, 'PNG', mg, 7, 32, 11); }
    catch {
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.white);
      doc.text(clinicNome, mg, 16);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text('Clínica Dentária', mg, 22);
    }

    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text('RELATÓRIO SEMANAL', W - mg, 13, { align: 'right' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(clinicMorada, W - mg, 19, { align: 'right' });
    doc.text(`${clinicEmail}  |  ${clinicTelefone}`, W - mg, 25, { align: 'right' });

    let y = 28;

    // ── INFO BAR ──────────────────────────────────────────────────────────
    doc.setFillColor(...C.tealBg);
    doc.rect(0, y, W, 13, 'F');
    doc.setFillColor(...C.teal);
    doc.rect(0, y + 13, W, 0.4, 'F');

    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.dark);
    doc.text(`Período: ${fmt(dateStart)} – ${fmt(dateEnd)}`, mg, y + 5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text(`Emitido: ${fmt(new Date())}  ${new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`, mg, y + 10.5);

    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(
      `Consultas: ${rs.total_consultas || 0}   |   Pac. Novos: ${rs.pacientes_novos || 0}   |   Faturação: ${euro(rs.faturacao_total)}`,
      W - mg, y + 8, { align: 'right' }
    );

    y += 17;

    // ── COLUMN GEOMETRY ────────────────────────────────────────────────────
    const cW  = (W - 2 * mg - 6) / 2;  // ≈ 90 mm
    const colL = mg;
    const colR = mg + cW + 6;

    const sectionHeader = (title, x, yPos) => {
      doc.setFontSize(9.5); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.teal);
      doc.text(title, x, yPos);
      doc.setDrawColor(...C.teal); doc.setLineWidth(0.45);
      doc.line(x, yPos + 1.5, x + cW, yPos + 1.5);
      return yPos + 8;
    };

    const tblHeader = (cols, x, yPos) => {
      doc.setFillColor(...C.headerBg);
      doc.rect(x, yPos, cW, 6.5, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.white);
      let cx = x + 2;
      cols.forEach(({ label, w, right }) => {
        doc.text(label, right ? cx + w - 2 : cx, yPos + 4.5, right ? { align: 'right' } : {});
        cx += w;
      });
      return yPos + 6.5;
    };

    const tblRow = (cells, x, yPos, idx) => {
      doc.setFillColor(...(idx % 2 === 0 ? C.lightGray : C.white));
      doc.rect(x, yPos, cW, 6.5, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.dark);
      let cx = x + 2;
      cells.forEach(({ text, w, right, bold, color }) => {
        if (bold)  doc.setFont('helvetica', 'bold');
        if (color) doc.setTextColor(...color); else doc.setTextColor(...C.dark);
        doc.text(String(text), right ? cx + w - 2 : cx, yPos + 4.5, right ? { align: 'right' } : {});
        if (bold)  doc.setFont('helvetica', 'normal');
        cx += w;
      });
      return yPos + 6.5;
    };

    const badge = (text, color, x, yPos) => {
      doc.setFillColor(...color);
      doc.roundedRect(x, yPos + 1, 17, 4.5, 1, 1, 'F');
      doc.setFontSize(6); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.white);
      doc.text(text, x + 8.5, yPos + 4.3, { align: 'center' });
    };

    // ── LEFT: CLÍNICO ──────────────────────────────────────────────────────
    let yL = sectionHeader('RESUMO CLÍNICO', colL, y);

    const canceladas = parseInt(rs.consultas_canceladas || 0);
    const novos = parseInt(rs.pacientes_novos || 0);
    const statsRows = [
      ['Total de Consultas', rs.total_consultas || 0, 'info'],
      ['Confirmadas',        rs.consultas_confirmadas || 0, 'ok'],
      ['Conclu\u00eddas',         rs.consultas_concluidas  || 0, 'ok'],
      ['Canceladas',         canceladas, canceladas > 2 ? 'alert' : 'ok'],
      ['Pacientes Totais',   rs.total_pacientes || 0, 'info'],
      ['Pacientes Novos',    novos, novos > 0 ? 'ok' : 'info'],
    ];

    const sW1 = cW * 0.58, sW2 = cW * 0.18, sW3 = cW * 0.24;
    yL = tblHeader([
      { label: 'INDICADOR', w: sW1 },
      { label: 'VALOR',     w: sW2, right: true },
      { label: 'STATUS',    w: sW3 },
    ], colL, yL);

    statsRows.forEach(([label, value, status], i) => {
      const bColor = status === 'ok' ? C.green : status === 'alert' ? C.red : C.blue;
      const bText  = status === 'ok' ? 'OK' : status === 'alert' ? 'Alerta' : 'Info';
      doc.setFillColor(...(i % 2 === 0 ? C.lightGray : C.white));
      doc.rect(colL, yL, cW, 6.5, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.dark);
      doc.text(String(label), colL + 2, yL + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value), colL + sW1 + sW2 - 2, yL + 4.5, { align: 'right' });
      badge(bText, bColor, colL + sW1 + sW2 + 2, yL);
      yL += 6.5;
    });

    yL += 5;

    // ── RIGHT: FINANCEIRO ──────────────────────────────────────────────────
    let yR = sectionHeader('RESUMO FINANCEIRO', colR, y);

    const kpis = [
      { label: 'TOTAL FATURADO',       value: euro(rs.faturacao_total),         color: [37, 99, 235]  },
      { label: 'CUSTO DE MATERIAIS',   value: euro(rs.custos_materiais_total),   color: C.red          },
      { label: 'LUCRO BRUTO ESTIMADO', value: euro(rs.lucro_estimado),           color: [16, 185, 129] },
    ];

    kpis.forEach(kpi => {
      doc.setFillColor(...C.lightGray);
      doc.setDrawColor(...kpi.color); doc.setLineWidth(0.25);
      doc.roundedRect(colR, yR, cW, 15, 1.5, 1.5, 'FD');
      doc.setFillColor(...kpi.color);
      doc.roundedRect(colR, yR, 3, 15, 1, 1, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.gray);
      doc.text(kpi.label, colR + 6, yR + 5.5);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...kpi.color);
      doc.text(kpi.value, colR + 6, yR + 12.5);
      yR += 18;
    });

    yR += 3;

    // ── SHARED HELPERS ─────────────────────────────────────────────────────
    const FW          = W - 2 * mg;
    const SAFE_BOTTOM = H - 22;

    const drawFooter = () => {
      const fy = H - 16;
      doc.setDrawColor(...C.teal); doc.setLineWidth(0.4);
      doc.line(mg, fy, W - mg, fy);
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.dark);
      doc.text(`${clinicNome} \u2014 Sistema de Gesta\u0303o Cl\u00ednica`, W / 2, fy + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
      doc.text('Relat\u00f3rio confidencial destinado apenas a uso interno.', W / 2, fy + 10, { align: 'center' });
      doc.setFillColor(...C.teal);
      doc.rect(0, H - 3.5, W, 3.5, 'F');
    };

    const contPage = () => {
      drawFooter();
      doc.addPage();
      doc.setFillColor(...C.teal); doc.rect(0, 0, W, 8, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
      doc.text(clinicNome, mg, 5.5);
      doc.text('RELAT\u00d3RIO SEMANAL (cont.)', W - mg, 5.5, { align: 'right' });
      return 14;
    };

    const fwSectionHeader = (title, yPos) => {
      if (yPos + 15 > SAFE_BOTTOM) yPos = contPage();
      doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.teal);
      doc.text(title, mg, yPos);
      doc.setDrawColor(...C.teal); doc.setLineWidth(0.45);
      doc.line(mg, yPos + 1.5, W - mg, yPos + 1.5);
      return yPos + 8;
    };

    const fwTblHeader = (cols, yPos) => {
      doc.setFillColor(...C.headerBg);
      doc.rect(mg, yPos, FW, 6.5, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
      let cx = mg + 2;
      cols.forEach(({ label, w, right }) => {
        doc.text(label, right ? cx + w - 2 : cx, yPos + 4.5, right ? { align: 'right' } : {});
        cx += w;
      });
      return yPos + 6.5;
    };

    const fwTblRow = (cells, yPos, idx) => {
      doc.setFillColor(...(idx % 2 === 0 ? C.lightGray : C.white));
      doc.rect(mg, yPos, FW, 6.5, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.dark);
      let cx = mg + 2;
      cells.forEach(({ text, w, right, bold, color }) => {
        if (bold)  doc.setFont('helvetica', 'bold');
        if (color) doc.setTextColor(...color); else doc.setTextColor(...C.dark);
        doc.text(String(text), right ? cx + w - 2 : cx, yPos + 4.5, right ? { align: 'right' } : {});
        if (bold)  doc.setFont('helvetica', 'normal');
        cx += w;
      });
      return yPos + 6.5;
    };

    // ── SYNC first two columns then go full-width ──────────────────────────
    let curY = Math.max(yL, yR) + 5;

    // ── PROCEDIMENTOS REALIZADOS (full width, all items) ──────────────────
    curY = fwSectionHeader('PROCEDIMENTOS REALIZADOS', curY);
    const procs = r.detalhe_procedimentos || [];
    const pW1 = FW * 0.50, pW2 = FW * 0.10, pW3 = FW * 0.18, pW4 = FW * 0.22;
    const procCols = [
      { label: 'PROCEDIMENTO', w: pW1 },
      { label: 'QTD',          w: pW2, right: true },
      { label: 'VALOR UNIT.',  w: pW3, right: true },
      { label: 'TOTAL',        w: pW4, right: true },
    ];
    curY = fwTblHeader(procCols, curY);
    if (procs.length > 0) {
      procs.forEach((p, i) => {
        if (curY + 6.5 > SAFE_BOTTOM) { curY = contPage(); curY = fwTblHeader(procCols, curY); }
        const nome = p.nome.length > 44 ? p.nome.slice(0, 41) + '\u2026' : p.nome;
        const unitVal = p.quantidade > 0 ? euro(p.subtotal_faturado / p.quantidade) : '\u2014';
        curY = fwTblRow([
          { text: nome,                       w: pW1 },
          { text: `${p.quantidade}x`,         w: pW2, right: true },
          { text: unitVal,                     w: pW3, right: true },
          { text: euro(p.subtotal_faturado),   w: pW4, right: true, bold: true, color: C.green },
        ], curY, i);
      });
    } else {
      doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.gray);
      doc.text('Sem procedimentos neste per\u00edodo.', mg + 2, curY + 5);
      curY += 10;
    }

    // ── TODOS OS MATERIAIS UTILIZADOS (full width, all items) ─────────────
    curY += 7;
    curY = fwSectionHeader('TODOS OS MATERIAIS UTILIZADOS', curY);
    const mats = r.top_materiais || [];
    const mW1 = FW * 0.48, mW2 = FW * 0.11, mW3 = FW * 0.20, mW4 = FW * 0.21;
    const matCols = [
      { label: 'MATERIAL',     w: mW1 },
      { label: 'QTD',          w: mW2, right: true },
      { label: 'PRE\u00c7O UNIT.', w: mW3, right: true },
      { label: 'CUSTO TOTAL',  w: mW4, right: true },
    ];
    curY = fwTblHeader(matCols, curY);
    if (mats.length > 0) {
      mats.forEach((m, i) => {
        if (curY + 6.5 > SAFE_BOTTOM) { curY = contPage(); curY = fwTblHeader(matCols, curY); }
        const nome = m.material.length > 42 ? m.material.slice(0, 39) + '\u2026' : m.material;
        curY = fwTblRow([
          { text: nome,                    w: mW1 },
          { text: `${m.quantidade_total}x`, w: mW2, right: true },
          { text: euro(m.preco_unitario),   w: mW3, right: true },
          { text: euro(m.custo_total),      w: mW4, right: true, bold: true, color: C.red },
        ], curY, i);
      });
    } else {
      doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.gray);
      doc.text('Sem materiais neste per\u00edodo.', mg + 2, curY + 5);
      curY += 10;
    }

    // ── TOP 3 RANKINGS ────────────────────────────────────────────────────
    curY += 7;
    const ROW_H     = 34;
    const HDR_H     = 13;
    const rankColW  = (FW - 6) / 2;
    const boxH      = HDR_H + 3 * ROW_H + 4;
    if (curY + boxH + 14 > SAFE_BOTTOM) curY = contPage();
    curY = fwSectionHeader('TOP 3 RANKINGS DA SEMANA', curY);

    const rankL     = mg;
    const rankR     = mg + rankColW + 6;
    const medals    = [[245,158,11],[148,163,184],[180,120,60]];  // gold, silver, bronze

    // Container boxes
    doc.setDrawColor(...C.midGray); doc.setLineWidth(0.3);
    doc.setFillColor(248, 253, 252);
    doc.rect(rankL, curY, rankColW, boxH, 'FD');
    doc.setFillColor(248, 249, 253);
    doc.rect(rankR, curY, rankColW, boxH, 'FD');

    // Column header banners (teal left, dark right)
    doc.setFillColor(...C.teal);
    doc.rect(rankL, curY, rankColW, HDR_H, 'F');
    doc.setFillColor(...C.headerBg);
    doc.rect(rankR, curY, rankColW, HDR_H, 'F');

    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
    doc.text('CONSULTAS MAIS REALIZADAS', rankL + rankColW / 2, curY + 8.5, { align: 'center' });
    doc.text('MATERIAIS MAIS UTILIZADOS',  rankR + rankColW / 2, curY + 8.5, { align: 'center' });

    const top3procs = procs.slice(0, 3);
    const top3mats  = mats.slice(0, 3);

    let ry = curY + HDR_H + 2;
    for (let i = 0; i < 3; i++) {
      const cy = ry + ROW_H / 2;
      const txtX_L = rankL + 15;
      const txtX_R = rankR + 15;

      // ── Left col: consulta ──
      const proc = top3procs[i];
      if (proc) {
        doc.setFillColor(...medals[i]);
        doc.circle(rankL + 7.5, cy - 2, 4.8, 'F');
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
        doc.text(String(i + 1), rankL + 7.5, cy + 0.2, { align: 'center' });

        const pNome = proc.nome.length > 25 ? proc.nome.slice(0, 22) + '\u2026' : proc.nome;
        const pUnit = proc.quantidade > 0 ? euro(proc.subtotal_faturado / proc.quantidade) : '\u2014';
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
        doc.text(pNome, txtX_L, cy - 7);
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
        doc.text(`Realizadas: ${proc.quantidade}x`, txtX_L, cy);
        doc.text(`Val. unit\u00e1rio: ${pUnit}`, txtX_L, cy + 6);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.green);
        doc.text(`Total: ${euro(proc.subtotal_faturado)}`, txtX_L, cy + 12);
      }

      // ── Right col: material ──
      const mat = top3mats[i];
      if (mat) {
        doc.setFillColor(...medals[i]);
        doc.circle(rankR + 7.5, cy - 2, 4.8, 'F');
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
        doc.text(String(i + 1), rankR + 7.5, cy + 0.2, { align: 'center' });

        const mNome = mat.material.length > 25 ? mat.material.slice(0, 22) + '\u2026' : mat.material;
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
        doc.text(mNome, txtX_R, cy - 7);
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
        doc.text(`Qtd. total: ${mat.quantidade_total}x`, txtX_R, cy);
        doc.text(`Pre\u00e7o unit\u00e1rio: ${euro(mat.preco_unitario)}`, txtX_R, cy + 6);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.red);
        doc.text(`Custo total: ${euro(mat.custo_total)}`, txtX_R, cy + 12);
      }

      // Thin separator between rows (not after last)
      if (i < 2) {
        doc.setDrawColor(...C.midGray); doc.setLineWidth(0.2);
        doc.line(rankL + 3, ry + ROW_H, rankL + rankColW - 3, ry + ROW_H);
        doc.line(rankR + 3, ry + ROW_H, rankR + rankColW - 3, ry + ROW_H);
      }

      ry += ROW_H;
    }
    curY = curY + boxH + 3;

    // ── FOOTER on last main page ───────────────────────────────────────────
    drawFooter();

    // ── BILLING NOTE PAGES (A4, same template as main report) ────────────
    const notas = r.notas_faturacao || [];
    notas.forEach((nota, notaIdx) => {
      doc.addPage();   // A4 portrait, same as main report

      // ── TOP TEAL BANNER ──────────────────────────────────────────────
      doc.setFillColor(...C.tealDark); doc.rect(0, 0, W, 2, 'F');
      doc.setFillColor(...C.teal);     doc.rect(0, 2, W, 26, 'F');

      try { doc.addImage(img, 'PNG', mg, 7, 32, 11); }
      catch {
        doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.white); doc.text(clinicNome, mg, 16);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text('Clínica Dentária', mg, 22);
      }

      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.white);
      doc.text('NOTA DE HONORÁRIOS', W - mg, 13, { align: 'right' });
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text(clinicMorada, W - mg, 19, { align: 'right' });
      doc.text(`${clinicEmail}  |  ${clinicTelefone}`, W - mg, 25, { align: 'right' });

      // ── INFO BAR ─────────────────────────────────────────────────────
      const nib = 28;
      doc.setFillColor(...C.tealBg);
      doc.rect(0, nib, W, 13, 'F');
      doc.setFillColor(...C.teal);
      doc.rect(0, nib + 13, W, 0.4, 'F');

      const emissaoDate = new Date(nota.data_emissao);
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      doc.text(`Paciente: ${nota.paciente_nome}`, mg, nib + 5);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
      doc.text(
        `Emitido: ${emissaoDate.toLocaleString('pt-PT')}   |   Ref. Nota #${String(notaIdx + 1).padStart(3, '0')}`,
        mg, nib + 10.5
      );

      // ── BODY ─────────────────────────────────────────────────────────
      let ny = nib + 21;
      const bMg  = mg;
      const bW   = W - 2 * mg;

      // Two-column info grid
      const leftW  = bW * 0.55;
      const rightW = bW * 0.45;
      const rowH   = 22;

      // Helper: labelled field box
      const fieldBox = (label, value, x, y, w, accent) => {
        doc.setDrawColor(...C.midGray); doc.setLineWidth(0.25);
        doc.setFillColor(...C.lightGray);
        doc.rect(x, y, w, rowH, 'FD');
        // accent bar left
        doc.setFillColor(...(accent || C.teal));
        doc.rect(x, y, 2.5, rowH, 'F');
        doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.gray);
        doc.text(label.toUpperCase(), x + 6, y + 6.5);
        doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
        const maxChars = Math.floor(w / 2.5);
        const valStr   = String(value || 'Não informado');
        const display  = valStr.length > maxChars ? valStr.slice(0, maxChars - 1) + '…' : valStr;
        doc.text(display, x + 6, y + 15);
      };

      fieldBox('Procedimento Realizado', nota.procedimento_nome,  bMg,          ny, leftW,  C.teal);
      fieldBox('Método de Pagamento',    nota.metodo_pagamento,   bMg + leftW + 4, ny, rightW - 4, C.headerBg);

      ny += rowH + 5;

      // Date/time separate row
      const dtLabel = 'Data e Hora da Consulta';
      const dtValue = emissaoDate.toLocaleString('pt-PT', { dateStyle: 'full', timeStyle: 'short' });
      fieldBox(dtLabel, dtValue, bMg, ny, bW, [107, 114, 128]);

      ny += rowH + 10;

      // ── DIVIDER ──────────────────────────────────────────────────────
      doc.setDrawColor(...C.teal); doc.setLineWidth(0.4);
      doc.line(bMg, ny, W - bMg, ny);
      ny += 10;

      // ── TOTAL LIQUIDADO BOX ──────────────────────────────────────────
      const totalH = 38;
      doc.setFillColor(...C.tealDark); doc.rect(bMg, ny, bW, 2, 'F');
      doc.setFillColor(...C.teal);     doc.rect(bMg, ny + 2, bW, totalH - 2, 'F');

      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(230, 248, 248);
      doc.text('TOTAL LIQUIDADO', W / 2, ny + 11, { align: 'center' });
      doc.setFontSize(26); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
      doc.text(euro(nota.valor_total), W / 2, ny + 30, { align: 'center' });

      ny += totalH + 15;

      // ── CONFIDENTIALITY NOTE ─────────────────────────────────────────
      doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.gray);
      doc.text(
        'Este documento é de uso interno e confidencial. Emitido automaticamente pelo Sistema MeClinic.',
        W / 2, ny, { align: 'center' }
      );

      // ── FOOTER ───────────────────────────────────────────────────────
      const nFy = H - 16;
      doc.setDrawColor(...C.teal); doc.setLineWidth(0.4);
      doc.line(mg, nFy, W - mg, nFy);
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      doc.text(`${clinicNome} \u2014 Nota de Honor\u00e1rios`, W / 2, nFy + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
      doc.text('Documento confidencial destinado apenas a uso interno.', W / 2, nFy + 10, { align: 'center' });
      doc.setFillColor(...C.teal); doc.rect(0, H - 3.5, W, 3.5, 'F');
    });

    return doc;
  };

  const baixarPDF = () => {
    const doc = gerarPDFDocumento();
    doc.save(`Relatorio_Clinica_${currentWeekStart}.pdf`);
  };

  const enviarEmail = async () => {
    if (!user.email) {
      showNotif('error', t('reports.msg.email_err'));
      return;
    }
    
    setIsSending(true);

    try {
      const doc = gerarPDFDocumento();
      const pdfBase64 = doc.output('datauristring');

      const res = await fetch('/api/reports/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailDestino: user.email, 
          pdfBase64, 
          semana: currentWeekStart,
          subject: t('reports.email.modal.default_subject'),
          message: t('reports.email.modal.default_message')
        })
      });

      if (res.ok) {
        showNotif('success', `${t('reports.msg.success')} (${user.email})!`);
      } else {
        showNotif('error', t('reports.msg.send_err'));
      }
    } catch (err) {
      console.error('Erro ao enviar:', err);
      showNotif('error', t('reports.msg.server_err'));
    } finally {
      setIsSending(false);
    }
  };

  const cardStyle = { backgroundColor: theme.cardBg, padding: '25px', borderRadius: '15px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' };
  const valStyle = { fontSize: '32px', fontWeight: '900', margin: '10px 0 5px 0' };

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto' }}>
      
      {notification.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '40px', borderRadius: '20px', border: `1px solid ${theme.border}`, textAlign: 'center', minWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease-out' }}>
            {notification.type === 'success' ? <CheckCircle size={70} color="#059669" style={{ marginBottom: '20px' }} /> : <XCircle size={70} color="#ef4444" style={{ marginBottom: '20px' }} />}
            <h2 style={{ margin: '0 0 10px 0', fontSize: '26px', fontWeight: 'bold', color: theme.isDark ? '#ffffff' : theme.text }}>
              {notification.type === 'success' ? t('reports.alert.success') : t('reports.alert.warning')}
            </h2>
            <p style={{ margin: '0 0 30px 0', color: theme.subText, fontSize: '16px', lineHeight: '1.5' }}>{notification.message}</p>
            <button onClick={closeNotif} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: notification.type === 'success' ? '#059669' : '#ef4444', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' }}>
              {t('reports.alert.btn_ok')}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 5px 0', color: theme.isDark ? '#ffffff' : theme.text, display: 'flex', alignItems: 'center', gap: '15px' }}>
            <BarChart3 color="#2563eb" size={32} /> {t('reports.title')}
          </h1>
          <p style={{ color: theme.subText, margin: 0 }}>{t('reports.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: theme.cardBg, borderRadius: '10px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
            <button onClick={() => navegarSemana(-7)} style={{ padding: '10px 15px', border: 'none', background: 'none', cursor: 'pointer', color: theme.text, borderRight: `1px solid ${theme.border}` }}><ChevronLeft size={20} /></button>
            <div style={{ padding: '0 20px', fontWeight: 'bold', color: theme.text }}>
              {t('reports.week_of')} {new Date(currentWeekStart).toLocaleDateString(activeLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
            <button onClick={() => navegarSemana(7)} style={{ padding: '10px 15px', border: 'none', background: 'none', cursor: 'pointer', color: theme.text, borderLeft: `1px solid ${theme.border}` }}><ChevronRight size={20} /></button>
          </div>

          <button onClick={baixarPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.pageBg, color: theme.text, border: `1px solid ${theme.border}`, padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Printer size={18} /> {t('reports.btn.print')}
          </button>

          {isAdmin && (
            <button onClick={enviarEmail} disabled={isSending} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', opacity: isSending ? 0.7 : 1 }}>
              <Mail size={18} /> {isSending ? t('reports.btn.sending') : t('reports.btn.send_email')}
            </button>
          )}
        </div>
      </div>

      {reportData ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.subText, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}><Users size={18} color="#3b82f6" /> {t('reports.card.consultations')}</div>
              <div style={{ ...valStyle, color: theme.isDark ? '#fff' : '#000' }}>{reportData.resumo?.total_consultas || 0}</div>
            </div>
            <div style={{ ...cardStyle, backgroundColor: '#10b981', color: 'white', border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', opacity: 0.9 }}><DollarSign size={18} /> {t('reports.card.billed')}</div>
              <div style={valStyle}>{parseFloat(reportData.resumo?.faturacao_total || 0).toFixed(2)}€</div>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.subText, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}><TrendingDown size={18} color="#ef4444" /> {t('reports.card.materials')}</div>
              <div style={{ ...valStyle, color: '#ef4444' }}>{parseFloat(reportData.resumo?.custos_materiais_total || 0).toFixed(2)}€</div>
            </div>
            <div style={{ ...cardStyle, borderColor: '#2563eb', backgroundColor: theme.isDark ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2563eb', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}><TrendingUp size={18} /> {t('reports.card.profit')}</div>
              <div style={{ ...valStyle, color: '#2563eb' }}>{parseFloat(reportData.resumo?.lucro_estimado || 0).toFixed(2)}€</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div style={{ backgroundColor: theme.cardBg, padding: '25px', borderRadius: '15px', border: `1px solid ${theme.border}` }}>
              <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text }}><FileText size={20} color="#2563eb" /> {t('reports.table.procedures')}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.subText, fontSize: '12px' }}>
                    <th style={{ paddingBottom: '10px' }}>{t('reports.table.proc.name')}</th><th style={{ paddingBottom: '10px', textAlign: 'center' }}>{t('reports.table.proc.qty')}</th><th style={{ paddingBottom: '10px', textAlign: 'right' }}>{t('reports.table.proc.value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.detalhe_procedimentos?.length > 0 ? reportData.detalhe_procedimentos.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '15px 0', fontWeight: 'bold', color: theme.text }}>{p.nome}</td>
                      <td style={{ padding: '15px 0', textAlign: 'center', color: theme.subText }}>{p.quantidade}x</td>
                      <td style={{ padding: '15px 0', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{parseFloat(p.subtotal_faturado).toFixed(2)}€</td>
                    </tr>
                  )) : <tr><td colSpan="3" style={{ padding: '30px 0', textAlign: 'center', color: theme.subText }}>{t('reports.empty')}</td></tr>}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: theme.cardBg, padding: '25px', borderRadius: '15px', border: `1px solid ${theme.border}` }}>
              <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text }}><TrendingDown size={20} color="#ef4444" /> {t('reports.table.materials')}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.subText, fontSize: '12px' }}>
                    <th style={{ paddingBottom: '10px' }}>{t('reports.table.mat.name')}</th>
                    <th style={{ paddingBottom: '10px', textAlign: 'center' }}>{t('reports.table.mat.qty')}</th>
                    <th style={{ paddingBottom: '10px', textAlign: 'right' }}>{t('reports.table.mat.cost_un')}</th>
                    <th style={{ paddingBottom: '10px', textAlign: 'right' }}>{t('reports.table.mat.cost_total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.top_materiais?.length > 0 ? reportData.top_materiais.map((m, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '15px 0', fontWeight: 'bold', color: theme.text }}>{m.material}</td>
                      <td style={{ padding: '15px 0', textAlign: 'center', color: theme.subText }}>{m.quantidade_total}x</td>
                      <td style={{ padding: '15px 0', textAlign: 'right', color: theme.subText }}>{parseFloat(m.preco_unitario).toFixed(2)}€</td>
                      <td style={{ padding: '15px 0', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>{parseFloat(m.custo_total).toFixed(2)}€</td>
                    </tr>
                  )) : <tr><td colSpan="4" style={{ padding: '30px 0', textAlign: 'center', color: theme.subText }}>{t('reports.empty')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0', color: theme.subText }}>{t('reports.loading')}</div>
      )}
    </div>
  );
};

export default Report;