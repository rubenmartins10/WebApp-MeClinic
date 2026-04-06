import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Euro, AlertTriangle, ChevronLeft, ChevronRight, TrendingUp, X, Package, Clock, FileDown } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ThemeContext } from '../contexts/ThemeContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { getActiveLocale } from '../utils/locale';
import apiService from '../services/api';
import jsPDF from 'jspdf';
import logo from '../assets/logo.png';

const Dashboard = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext);
  const navigate = useNavigate();

  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({ pacientes_semana: 0, consultas_semana: 0, faturacao_semana: 0, alertas_stock: 0, alertas_validade: 0 });
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAlertsList, setStockAlertsList] = useState([]);
  
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [expiryAlertsList, setExpiryAlertsList] = useState([]);

  const activeLocale = getActiveLocale(language);

  const carregarDados = (startDate) => {
    apiService.get(`/api/stats/patients-weekly?start=${startDate}`)
      .then(data => setChartData(data));

    apiService.get(`/api/stats/dashboard-summary?start=${startDate}`)
      .then(data => setSummary(data));
  };

  useEffect(() => {
    carregarDados(currentWeekStart);
  }, [currentWeekStart]);

  const navegarSemana = (direcao) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + (direcao * 7));
    setCurrentWeekStart(date.toISOString().split('T')[0]);
  };

  const openStockAlerts = async () => {
    try {
      const data = await apiService.get('/api/stats/stock-alerts');
      setStockAlertsList(data);
      setShowStockModal(true);
    } catch (e) { console.error("Erro ao carregar alertas de stock:", e); }
  };

  const openExpiryAlerts = async () => {
    try {
      const data = await apiService.get('/api/stats/validade-alerts');
      setExpiryAlertsList(data);
      setShowExpiryModal(true);
    } catch (e) { console.error("Erro ao carregar alertas de validade:", e); }
  };

  const calcularTotalUnidades = (nomeProduto, stockAtual) => {
    const match = nomeProduto.match(/\((\d+)\s*([a-zA-Z]+)\)/);
    if (match) {
      const unidadesPorCaixa = parseInt(match[1], 10);
      const unidadeMedida = match[2];
      const totalReal = Math.round(unidadesPorCaixa * parseFloat(stockAtual));
      return `${totalReal} ${unidadeMedida} ${t('inventory.card.total_calc')}`;
    }
    return null; 
  };

  const gerarEncomendaPDF = () => {
    if (stockAlertsList.length === 0) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const mg = 12;

    // ─ Colour palette ──────────────────────────────────────────────────────
    const C = {
      teal:      [37,  99, 235],
      tealDark:  [29,  78, 216],
      tealBg:    [219, 234, 254],
      white:     [255, 255, 255],
      dark:      [25,  25,  25],
      gray:      [110, 110, 110],
      lightGray: [247, 247, 247],
      midGray:   [210, 210, 210],
      blue:      [37,   99, 235],
      red:       [220,  38,  38],
      headerBg:  [45,   55,  72],
    };

    const clinicSettings = (() => {
      try { return JSON.parse(localStorage.getItem('meclinic_settings') || '{}'); } catch { return {}; }
    })();
    const clinicNome     = clinicSettings.nome     || 'MeClinic';
    const clinicMorada   = (clinicSettings.morada  || 'Rua Principal, 123  |  Lisboa, Portugal').replace(/\n/g, '  |  ');
    const clinicEmail    = clinicSettings.email    || 'geral@meclinic.pt';
    const clinicTelefone = clinicSettings.telefone || '+351 XXX XXX XXX';

    const FW          = W - 2 * mg;
    const SAFE_BOTTOM = H - 22;

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
      doc.text('Cl\u00ednica', mg, 22);
    }

    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text(t('dashboard.order.title') || 'NOTA DE ENCOMENDA', W - mg, 13, { align: 'right' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(clinicMorada, W - mg, 19, { align: 'right' });
    doc.text(`${clinicEmail}  |  ${clinicTelefone}`, W - mg, 25, { align: 'right' });

    // ── INFO BAR ──────────────────────────────────────────────────────────
    const ib = 28;
    doc.setFillColor(...C.tealBg);
    doc.rect(0, ib, W, 13, 'F');
    doc.setFillColor(...C.teal);
    doc.rect(0, ib + 13, W, 0.4, 'F');

    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(`${t('dashboard.order.date') || 'Data:'} ${new Date().toLocaleDateString(activeLocale)}`, mg, ib + 5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text(`${stockAlertsList.length} produto(s) com stock abaixo do m\u00ednimo`, mg, ib + 10.5);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(`Emitido: ${new Date().toLocaleString('pt-PT')}`, W - mg, ib + 8, { align: 'right' });

    let curY = ib + 17;

    // ── FOOTER helper ──────────────────────────────────────────────────────
    const drawFooter = () => {
      const fy = H - 16;
      doc.setDrawColor(...C.teal); doc.setLineWidth(0.4);
      doc.line(mg, fy, W - mg, fy);
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      doc.text(`${clinicNome} \u2014 Nota de Encomenda`, W / 2, fy + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
      doc.text('Documento confidencial destinado apenas a uso interno.', W / 2, fy + 10, { align: 'center' });
      doc.setFillColor(...C.teal);
      doc.rect(0, H - 3.5, W, 3.5, 'F');
    };

    const contPage = () => {
      drawFooter();
      doc.addPage();
      doc.setFillColor(...C.teal); doc.rect(0, 0, W, 8, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
      doc.text(clinicNome, mg, 5.5);
      doc.text('NOTA DE ENCOMENDA (cont.)', W - mg, 5.5, { align: 'right' });
      return 14;
    };

    // ── TABLE HEADER ──────────────────────────────────────────────────────
    const nW1 = FW * 0.52, nW2 = FW * 0.20, nW3 = FW * 0.16, nW4 = FW * 0.12;
    const cols = [
      { label: t('dashboard.order.product')?.toUpperCase() || 'PRODUTO',   w: nW1 },
      { label: t('dashboard.order.current')?.toUpperCase() || 'STOCK ATUAL', w: nW2, right: true },
      { label: 'STOCK MÍN.',  w: nW3, right: true },
      { label: t('dashboard.order.suggested')?.toUpperCase() || 'QTD ENCOMENDAR', w: nW4, right: true },
    ];

    const drawTableHeader = (yPos) => {
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

    // ── SECTION HEADER ─────────────────────────────────────────────────────
    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.teal);
    doc.text('PRODUTOS A ENCOMENDAR', mg, curY);
    doc.setDrawColor(...C.teal); doc.setLineWidth(0.45);
    doc.line(mg, curY + 1.5, W - mg, curY + 1.5);
    curY += 8;

    curY = drawTableHeader(curY);

    // ── ROWS ───────────────────────────────────────────────────────────────
    stockAlertsList.forEach((item, i) => {
      if (curY + 6.5 > SAFE_BOTTOM) { curY = contPage(); curY = drawTableHeader(curY); }

      const current = parseFloat(item.stock_atual);
      const min     = parseFloat(item.stock_minimo);

      let currentVisual;
      if (item.unidade_medida === 'cx' || item.nome.match(/\((\d+)\s*[a-zA-Z]+\)/)) {
        currentVisual = Math.ceil(current);
      } else {
        currentVisual = current % 1 === 0 ? current : current.toFixed(2);
      }
      const minVisual = min % 1 === 0 ? min : min.toFixed(2);

      let qtdSugerida = Math.ceil((min * 2) - current);
      if (qtdSugerida <= 0) qtdSugerida = 1;

      const nomeCurto = item.nome.length > 46 ? item.nome.slice(0, 43) + '\u2026' : item.nome;

      doc.setFillColor(...(i % 2 === 0 ? C.lightGray : C.white));
      doc.rect(mg, curY, FW, 6.5, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.dark);

      let cx = mg + 2;
      // Nome
      doc.text(nomeCurto, cx, curY + 4.5); cx += nW1;
      // Stock atual (red if critical)
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.red);
      doc.text(`${currentVisual} ${item.unidade_medida}`, cx + nW2 - 2, curY + 4.5, { align: 'right' }); cx += nW2;
      // Stock mínimo
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
      doc.text(`${minVisual} ${item.unidade_medida}`, cx + nW3 - 2, curY + 4.5, { align: 'right' }); cx += nW3;
      // Qtd sugerida (blue bold)
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.blue);
      doc.text(`${qtdSugerida} ${item.unidade_medida}`, cx + nW4 - 2, curY + 4.5, { align: 'right' });

      curY += 6.5;
    });

    // ── SUMMARY BAR ───────────────────────────────────────────────────────
    curY += 4;
    if (curY + 10 > SAFE_BOTTOM) curY = contPage();
    doc.setFillColor(...C.tealBg);
    doc.rect(mg, curY, FW, 8, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.teal);
    doc.text(`Total: ${stockAlertsList.length} produto(s) a encomendar`, mg + 3, curY + 5.5);
    curY += 14;

    // ── SIGNATURE LINE ────────────────────────────────────────────────────
    if (curY + 20 > SAFE_BOTTOM) curY = contPage();
    doc.setDrawColor(...C.midGray); doc.setLineWidth(0.4);
    doc.line(mg, curY, mg + 80, curY);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text(t('dashboard.order.signature') || 'Assinatura / Aprovação', mg, curY + 5);

    // ── FOOTER ────────────────────────────────────────────────────────────
    drawFooter();

    const dataFicheiro = new Date().toISOString().split('T')[0];
    doc.save(`Encomenda_MeClinic_${dataFicheiro}.pdf`);
  };

  const StatCard = ({ title, value, icon: Icon, color, sub, onIconClick, clickableIcon }) => (
    <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
        <div 
          onClick={clickableIcon ? onIconClick : undefined}
          style={{ 
            padding: '8px', backgroundColor: `${color}15`, borderRadius: '10px', 
            cursor: clickableIcon ? 'pointer' : 'default', transition: 'all 0.2s',
            opacity: clickableIcon ? 0.9 : 1
          }}
          onMouseEnter={(e) => { if(clickableIcon) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; } }}
          onMouseLeave={(e) => { if(clickableIcon) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: '900', color: theme.text }}>{value}</div>
      <div style={{ fontSize: '12px', color: theme.subText, marginTop: '5px', fontWeight: 'bold' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ padding: '20px', transition: 'all 0.3s ease', maxWidth: '1400px', margin: '0 auto' }}>
      
      {showStockModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '20px', width: '600px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={24} color="#ef4444" /> {t('dashboard.modal.stock_title')}
              </h2>
              <button onClick={() => setShowStockModal(false)} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <p style={{ color: theme.subText, marginBottom: '20px', fontSize: '14px' }}>{t('dashboard.modal.stock_desc')}</p>

            <div style={{ overflowY: 'auto', flex: 1, borderTop: `1px solid ${theme.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.pageBg, color: theme.subText, fontSize: '12px' }}>
                    <th style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}` }}>{t('dashboard.modal.table.product')}</th>
                    <th style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, textAlign: 'right' }}>{t('dashboard.modal.table.current')}</th>
                    <th style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, textAlign: 'right' }}>{t('dashboard.modal.table.min')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stockAlertsList.length > 0 ? stockAlertsList.map(item => {
                    const totalCalc = calcularTotalUnidades(item.nome, item.stock_atual);
                    const minVisual = parseFloat(item.stock_minimo) % 1 === 0 ? parseInt(item.stock_minimo) : parseFloat(item.stock_minimo).toFixed(2);

                    // APLICAÇÃO DA NOVA REGRA NO DASHBOARD
                    const stockFloat = parseFloat(item.stock_atual);
                    let stockVisual;
                    if (item.unidade_medida === 'cx' || item.nome.match(/\((\d+)\s*[a-zA-Z]+\)/)) {
                      stockVisual = Math.ceil(stockFloat);
                    } else {
                      stockVisual = stockFloat % 1 === 0 ? stockFloat : stockFloat.toFixed(2);
                    }

                    return (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: theme.text }}>{item.nome}</td>
                        <td style={{ padding: '15px', textAlign: 'right' }}>
                          <span style={{ fontWeight: '900', color: '#ef4444', fontSize: '15px' }}>
                            {stockVisual} <span style={{ fontSize: '12px', fontWeight: 'normal', color: theme.subText }}>{item.unidade_medida}</span>
                          </span>
                          {totalCalc && <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>({totalCalc})</div>}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'right', color: theme.subText, verticalAlign: 'top', paddingTop: '17px' }}>{minVisual}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: theme.subText }}>
                        <Package size={30} style={{ opacity: 0.3, marginBottom: '10px' }} /><br/>{t('dashboard.modal.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button onClick={() => setShowStockModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: theme.pageBg, color: theme.text, fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>
                {t('dashboard.modal.close')}
              </button>
              
              {stockAlertsList.length > 0 && (
                <button onClick={gerarEncomendaPDF} style={{ flex: 2, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}>
                  <FileDown size={20} /> {t('dashboard.modal.btn_order') || 'Gerar Encomenda (PDF)'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {showExpiryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '20px', width: '550px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={24} color="#f59e0b" /> {t('dashboard.modal.expiry_title')}
              </h2>
              <button onClick={() => setShowExpiryModal(false)} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <p style={{ color: theme.subText, marginBottom: '20px', fontSize: '14px' }}>{t('dashboard.modal.expiry_desc')}</p>

            <div style={{ overflowY: 'auto', flex: 1, borderTop: `1px solid ${theme.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.pageBg, color: theme.subText, fontSize: '12px' }}>
                    <th style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}` }}>{t('dashboard.modal.table.product')}</th>
                    <th style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}` }}>{t('dashboard.modal.table.category')}</th>
                    <th style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, textAlign: 'right' }}>{t('dashboard.modal.table.expiry')}</th>
                  </tr>
                </thead>
                <tbody>
                  {expiryAlertsList.length > 0 ? expiryAlertsList.map(item => {
                    const dataExp = new Date(item.data_validade);
                    const hoje = new Date();
                    const isCaducado = dataExp < hoje;
                    const corValidade = isCaducado ? '#ef4444' : '#f59e0b'; 

                    return (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: theme.text }}>{item.nome}</td>
                        <td style={{ padding: '15px', color: theme.subText, fontSize: '13px' }}>
                          <span style={{ backgroundColor: theme.pageBg, padding: '4px 8px', borderRadius: '6px' }}>{item.categoria}</span>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'right', fontWeight: '900', color: corValidade }}>
                           {dataExp.toLocaleDateString(activeLocale)}
                           {isCaducado && <div style={{ fontSize: '10px', textTransform: 'uppercase', marginTop: '2px' }}>Expirado</div>}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: theme.subText }}>
                        <Clock size={30} style={{ opacity: 0.3, marginBottom: '10px' }} /><br/>{t('dashboard.modal.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button onClick={() => setShowExpiryModal(false)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: theme.pageBg, color: theme.text, fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>{t('dashboard.modal.close')}</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: theme.text, margin: 0 }}>{t('dashboard.title')}</h1>
          <p style={{ color: theme.subText }}>{t('dashboard.subtitle')}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: theme.cardBg, padding: '10px 20px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          <button onClick={() => navegarSemana(-1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: theme.subText }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>{t('dashboard.week_of')} {new Date(currentWeekStart).toLocaleDateString('pt-PT')}</span>
          <button onClick={() => navegarSemana(1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: theme.subText }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <StatCard title={t('dashboard.card.new_patients')} value={summary.pacientes_semana} icon={Users} color="#2563eb" sub={t('dashboard.card.new_patients_sub')} clickableIcon onIconClick={() => navigate('/pacientes')} />
        <StatCard title={t('dashboard.card.consultations')} value={summary.consultas_semana} icon={Calendar} color="#7c3aed" sub={t('dashboard.card.consultations_sub')} clickableIcon onIconClick={() => navigate('/consultas')} />
        <StatCard title={t('dashboard.card.billing')} value={`${parseFloat(summary.faturacao_semana || 0).toFixed(2)}€`} icon={Euro} color="#059669" sub={t('dashboard.card.billing_sub')} clickableIcon onIconClick={() => navigate('/faturacao')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard 
          title={t('dashboard.card.stock_alerts')} 
          value={summary.alertas_stock || 0} 
          icon={AlertTriangle} 
          color={(summary.alertas_stock > 0) ? "#ef4444" : "#059669"} 
          sub={t('dashboard.card.stock_alerts_sub')} 
          clickableIcon={true} 
          onIconClick={openStockAlerts}
        />
        <StatCard 
          title={t('dashboard.card.expiry_alerts')} 
          value={summary.alertas_validade || 0} 
          icon={Clock} 
          color={(summary.alertas_validade > 0) ? "#f59e0b" : "#059669"} 
          sub={t('dashboard.card.expiry_alerts_sub')} 
          clickableIcon={true} 
          onIconClick={openExpiryAlerts}
        />
      </div>

      <div style={{ backgroundColor: theme.cardBg, borderRadius: '15px', padding: '25px', border: `1px solid ${theme.border}` }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text }}>
          <TrendingUp size={20} color="#2563eb" /> {t('dashboard.chart.title')}
        </h3>
        <div style={{ height: '350px', width: '100%', minWidth: 0, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: theme.subText, fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: theme.subText, fontSize: 12}} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: theme.cardBg, color: theme.text, borderRadius: '10px', border: `1px solid ${theme.border}` }} />
              <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: theme.cardBg }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;