import React, { useState, useEffect, useContext } from 'react';
import { DollarSign, Filter, CheckCircle, Receipt, X, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import { ThemeContext } from '../contexts/ThemeContext';
import { LanguageContext } from '../contexts/LanguageContext'; // <-- Importar Idiomas
import { getActiveLocale } from '../utils/locale';
import apiService from '../services/api';
import logo from '../assets/logo.png'; 

const Faturacao = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext); // <-- Tradutor e língua ativa

  const [faturas, setFaturas] = useState([]);
  const [filtroTempo, setFiltroTempo] = useState('hoje'); // hoje, semana, mes, tudo
  
  const [notaModal, setNotaModal] = useState(null);

  useEffect(() => {
    apiService.get('/api/faturacao')
      .then(data => setFaturas(Array.isArray(data) ? data : (data.faturas || [])))
      .catch(() => {});
  }, []);

  const faturasFiltradas = faturas.filter(f => {
    const dataFatura = new Date(f.data_emissao);
    const hoje = new Date();
    
    if (filtroTempo === 'hoje') {
      return dataFatura.toDateString() === hoje.toDateString();
    }
    if (filtroTempo === 'semana') {
      const umaSemanaAtras = new Date();
      umaSemanaAtras.setDate(hoje.getDate() - 7);
      return dataFatura >= umaSemanaAtras;
    }
    if (filtroTempo === 'mes') {
      return dataFatura.getMonth() === hoje.getMonth() && dataFatura.getFullYear() === hoje.getFullYear();
    }
    return true; 
  });

  const totalFaturado = faturasFiltradas.reduce((acc, f) => acc + parseFloat(f.valor_total), 0);

  const imprimirNotaIndividual = (nota) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297, mg = 12;

    const C = {
      teal:      [14, 170, 165],
      tealDark:  [8,  120, 116],
      tealBg:    [230, 248, 248],
      white:     [255, 255, 255],
      dark:      [25,  25,  25],
      gray:      [110, 110, 110],
      lightGray: [247, 247, 247],
      midGray:   [210, 210, 210],
      headerBg:  [45,   55,  72],
    };

    const euro = (v) => parseFloat(v || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ac';

    const clinicSettings = (() => { try { return JSON.parse(localStorage.getItem('meclinic_settings') || '{}'); } catch { return {}; } })();
    const clinicNome     = clinicSettings.nome     || 'MeClinic';
    const clinicMorada   = (clinicSettings.morada  || 'Rua Principal, 123  |  Lisboa, Portugal').replace(/\n/g, '  |  ');
    const clinicEmail    = clinicSettings.email    || 'geral@meclinic.pt';
    const clinicTelefone = clinicSettings.telefone || '+351 XXX XXX XXX';

    const img = new Image(); img.src = logo;

    // ── TOP TEAL BANNER ──────────────────────────────────────────────────
    doc.setFillColor(...C.tealDark); doc.rect(0, 0, W, 2, 'F');
    doc.setFillColor(...C.teal);     doc.rect(0, 2, W, 26, 'F');

    try { doc.addImage(img, 'PNG', mg, 7, 32, 11); }
    catch {
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.white); doc.text(clinicNome, mg, 16);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text('Clínica Dentária', mg, 22);
    }

    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
    doc.text('NOTA DE HONORÁRIOS', W - mg, 13, { align: 'right' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(clinicMorada, W - mg, 19, { align: 'right' });
    doc.text(`${clinicEmail}  |  ${clinicTelefone}`, W - mg, 25, { align: 'right' });

    // ── INFO BAR ─────────────────────────────────────────────────────────
    const nib = 28;
    doc.setFillColor(...C.tealBg); doc.rect(0, nib, W, 13, 'F');
    doc.setFillColor(...C.teal);   doc.rect(0, nib + 13, W, 0.4, 'F');

    const emissaoDate = new Date(nota.data_emissao);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(`Paciente: ${nota.paciente_nome}`, mg, nib + 5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text(`Emitido: ${emissaoDate.toLocaleString('pt-PT')}`, mg, nib + 10.5);

    // ── BODY ─────────────────────────────────────────────────────────────
    let ny = nib + 21;
    const bW      = W - 2 * mg;
    const leftW   = bW * 0.55;
    const rightW  = bW * 0.45;
    const rowH    = 22;

    const fieldBox = (label, value, x, y, w, accent) => {
      doc.setDrawColor(...C.midGray); doc.setLineWidth(0.25);
      doc.setFillColor(...C.lightGray);
      doc.rect(x, y, w, rowH, 'FD');
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

    fieldBox('Procedimento Realizado', nota.procedimento_nome,  mg,              ny, leftW,  C.teal);
    fieldBox('Método de Pagamento',    nota.metodo_pagamento,   mg + leftW + 4,  ny, rightW - 4, C.headerBg);
    ny += rowH + 5;

    fieldBox('Data e Hora da Consulta',
      emissaoDate.toLocaleString('pt-PT', { dateStyle: 'full', timeStyle: 'short' }),
      mg, ny, bW, [107, 114, 128]);
    ny += rowH + 10;

    // ── DIVIDER ──────────────────────────────────────────────────────────
    doc.setDrawColor(...C.teal); doc.setLineWidth(0.4);
    doc.line(mg, ny, W - mg, ny);
    ny += 10;

    // ── TOTAL LIQUIDADO BOX ──────────────────────────────────────────────
    const totalH = 38;
    doc.setFillColor(...C.tealDark); doc.rect(mg, ny, bW, 2, 'F');
    doc.setFillColor(...C.teal);     doc.rect(mg, ny + 2, bW, totalH - 2, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(230, 248, 248);
    doc.text('TOTAL LIQUIDADO', W / 2, ny + 11, { align: 'center' });
    doc.setFontSize(26); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
    doc.text(euro(nota.valor_total), W / 2, ny + 30, { align: 'center' });
    ny += totalH + 15;

    // ── CONFIDENTIALITY NOTE ─────────────────────────────────────────────
    doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.gray);
    doc.text('Este documento é de uso interno e confidencial. Emitido automaticamente pelo Sistema MeClinic.', W / 2, ny, { align: 'center' });

    // ── FOOTER ───────────────────────────────────────────────────────────
    const nFy = H - 16;
    doc.setDrawColor(...C.teal); doc.setLineWidth(0.4);
    doc.line(mg, nFy, W - mg, nFy);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(`${clinicNome} \u2014 Nota de Honor\u00e1rios`, W / 2, nFy + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text('Documento confidencial destinado apenas a uso interno.', W / 2, nFy + 10, { align: 'center' });
    doc.setFillColor(...C.teal); doc.rect(0, H - 3.5, W, 3.5, 'F');

    doc.save(`Nota_Faturacao_${nota.paciente_nome.replace(/\s+/g, '_')}.pdf`);
  };

  const filterBtnStyle = (isActive) => ({
    padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
    backgroundColor: isActive ? '#2563eb' : theme.pageBg,
    color: isActive ? 'white' : theme.text,
    transition: 'all 0.2s'
  });

  const localeMap = { pt: 'pt-PT', en: 'en-US', es: 'es-ES' };
  const activeLocale = localeMap[language] || 'pt-PT';

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto' }}>
      
      {notaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.isDark ? '#1e293b' : '#ffffff', padding: '0', borderRadius: '12px', width: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', border: `1px solid ${theme.border}` }}>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '30px 20px 20px', textAlign: 'center', borderBottom: '2px dashed #cbd5e1', position: 'relative' }}>
              <button onClick={() => setNotaModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
              <img src={logo} alt="Logo" style={{ height: '40px', marginBottom: '15px' }} />
              <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('billing.modal.title')}</h2>
              <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#64748b', fontWeight: 'bold', letterSpacing: '0.5px' }}>{t('billing.modal.subtitle')}</p>
            </div>

            <div style={{ padding: '30px 25px', color: theme.isDark ? '#f8fafc' : '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '15px' }}>
                <span style={{ color: theme.subText }}>{t('billing.modal.patient')}</span>
                <strong style={{ textAlign: 'right' }}>{notaModal.paciente_nome}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '15px' }}>
                <span style={{ color: theme.subText }}>{t('billing.modal.datetime')}</span>
                <strong style={{ textAlign: 'right' }}>{new Date(notaModal.data_emissao).toLocaleString(activeLocale, { dateStyle: 'short', timeStyle: 'short' })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '15px' }}>
                <span style={{ color: theme.subText }}>{t('billing.modal.procedure')}</span>
                <strong style={{ textAlign: 'right' }}>{notaModal.procedimento_nome}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '15px' }}>
                <span style={{ color: theme.subText }}>{t('billing.modal.method')}</span>
                <strong style={{ textAlign: 'right' }}>{notaModal.metodo_pagamento}</strong>
              </div>

              <div style={{ backgroundColor: theme.isDark ? '#0f172a' : '#f1f5f9', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${theme.border}` }}>
                <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{t('billing.modal.total')}</span>
                <span style={{ fontSize: '28px', fontWeight: '900', color: '#10b981' }}>{parseFloat(notaModal.valor_total).toFixed(2)}€</span>
              </div>
            </div>

            <div style={{ padding: '20px 25px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '15px', backgroundColor: theme.isDark ? '#1e293b' : '#ffffff' }}>
              <button onClick={() => setNotaModal(null)} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>{t('billing.modal.btn_close')}</button>
              <button onClick={() => imprimirNotaIndividual(notaModal)} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}>
                <Printer size={18} /> {t('billing.modal.btn_print')}
              </button>
            </div>

          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: theme.isDark ? '#ffffff' : theme.text, display: 'flex', alignItems: 'center', gap: '15px' }}>
            <DollarSign color="#10b981" size={32} /> {t('billing.title')}
          </h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>{t('billing.subtitle')}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginBottom: '30px' }}>
        
        <div style={{ backgroundColor: '#10b981', color: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: 0.9 }}>{t('billing.dashboard.total')}</h3>
          <h1 style={{ margin: 0, fontSize: '40px', fontWeight: '900' }}>{totalFaturado.toFixed(2)} €</h1>
          <p style={{ margin: '15px 0 0 0', fontSize: '13px', opacity: 0.8 }}><CheckCircle size={14} style={{ marginBottom: '-2px' }}/> {faturasFiltradas.length} {t('billing.dashboard.processed')}</p>
        </div>

        <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: theme.subText, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>
            <Filter size={16} /> {t('billing.filter.title')}
          </div>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button style={filterBtnStyle(filtroTempo === 'hoje')} onClick={() => setFiltroTempo('hoje')}>{t('billing.filter.today')}</button>
            <button style={filterBtnStyle(filtroTempo === 'semana')} onClick={() => setFiltroTempo('semana')}>{t('billing.filter.week')}</button>
            <button style={filterBtnStyle(filtroTempo === 'mes')} onClick={() => setFiltroTempo('mes')}>{t('billing.filter.month')}</button>
            <button style={filterBtnStyle(filtroTempo === 'tudo')} onClick={() => setFiltroTempo('tudo')}>{t('billing.filter.all')}</button>
          </div>
        </div>

      </div>

      <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: theme.pageBg, borderBottom: `2px solid ${theme.border}` }}>
              <th style={{ padding: '15px 20px', color: theme.subText, fontSize: '12px', fontWeight: 'bold' }}>{t('billing.table.date')}</th>
              <th style={{ padding: '15px 20px', color: theme.subText, fontSize: '12px', fontWeight: 'bold' }}>{t('billing.table.patient')}</th>
              <th style={{ padding: '15px 20px', color: theme.subText, fontSize: '12px', fontWeight: 'bold' }}>{t('billing.table.procedure')}</th>
              <th style={{ padding: '15px 20px', color: theme.subText, fontSize: '12px', fontWeight: 'bold' }}>{t('billing.table.method')}</th>
              <th style={{ padding: '15px 20px', color: theme.subText, fontSize: '12px', fontWeight: 'bold', textAlign: 'right', paddingRight: '40px' }}>{t('billing.table.value')}</th>
              <th style={{ padding: '15px 20px', color: theme.subText, fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>{t('billing.table.note')}</th>
            </tr>
          </thead>
          <tbody>
            {faturasFiltradas.length > 0 ? faturasFiltradas.map(f => (
              <tr key={f.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: '15px 20px', fontSize: '14px', color: theme.text }}>
                  {new Date(f.data_emissao).toLocaleString(activeLocale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '15px 20px', fontWeight: 'bold', color: theme.isDark ? '#ffffff' : theme.text }}>{f.paciente_nome}</td>
                <td style={{ padding: '15px 20px', color: theme.text }}>{f.procedimento_nome}</td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ padding: '5px 10px', backgroundColor: theme.pageBg, borderRadius: '6px', fontSize: '12px', border: `1px solid ${theme.border}` }}>{f.metodo_pagamento}</span>
                </td>
                <td style={{ padding: '15px 40px 15px 20px', fontWeight: '900', color: '#10b981', textAlign: 'right', fontSize: '16px' }}>
                  {parseFloat(f.valor_total).toFixed(2)} €
                </td>
                <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                  <button 
                    onClick={() => setNotaModal(f)} 
                    style={{ backgroundColor: theme.isDark ? '#1e3a8a' : '#eff6ff', color: '#2563eb', border: `1px solid ${theme.isDark ? '#1e40af' : '#bfdbfe'}`, padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', transition: 'all 0.2s' }} 
                    title={t('billing.table.tooltip')}
                  >
                    <Receipt size={18} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: theme.subText }}>
                  {t('billing.table.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Faturacao;