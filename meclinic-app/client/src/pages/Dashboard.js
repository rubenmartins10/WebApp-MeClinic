import React, { useEffect, useState, useContext } from 'react';
import { Users, Calendar, Euro, AlertTriangle, ChevronLeft, ChevronRight, TrendingUp, X, Package, Clock, FileDown } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ThemeContext } from '../ThemeContext';
import { LanguageContext } from '../LanguageContext';
import jsPDF from 'jspdf';

const Dashboard = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext);

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

  const activeLocale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-PT';

  const carregarDados = (startDate) => {
    const token = localStorage.getItem('token');
    fetch(`/api/stats/patients-weekly?start=${startDate}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setChartData(data));

    fetch(`/api/stats/dashboard-summary?start=${startDate}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/stats/stock-alerts', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setStockAlertsList(data);
      setShowStockModal(true);
    } catch (e) { console.error("Erro ao carregar alertas de stock:", e); }
  };

  const openExpiryAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/stats/validade-alerts', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
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
    const doc = new jsPDF();
    doc.setTextColor(37, 99, 235); doc.setFontSize(22); doc.setFont(undefined, 'bold'); doc.text("MECLINIC", 20, 20);
    doc.setTextColor(0, 0, 0); doc.setFontSize(14); doc.text(t('dashboard.order.title'), 20, 30);
    doc.setTextColor(100, 116, 139); doc.setFontSize(11); doc.setFont(undefined, 'normal'); doc.text(`${t('dashboard.order.date')} ${new Date().toLocaleDateString(activeLocale)}`, 20, 38);
    doc.setDrawColor(200, 200, 200); doc.line(20, 42, 190, 42);
    
    doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.setFont(undefined, 'bold');
    doc.text(t('dashboard.order.product').toUpperCase(), 20, 52);
    doc.text(t('dashboard.order.current').toUpperCase(), 130, 52);
    doc.text(t('dashboard.order.suggested').toUpperCase(), 160, 52);
    doc.line(20, 55, 190, 55);
    
    doc.setFont(undefined, 'normal');
    let y = 65;
    
    stockAlertsList.forEach((item) => {
      if (y > 270) { doc.addPage(); y = 20; }
      
      const current = parseFloat(item.stock_atual);
      const min = parseFloat(item.stock_minimo);
      
      let currentVisual = current;
      if (item.unidade_medida === 'cx' || item.nome.match(/\((\d+)\s*[a-zA-Z]+\)/)) {
        currentVisual = Math.ceil(current);
      } else {
        currentVisual = current % 1 === 0 ? current : current.toFixed(2);
      }

      let qtdSugerida = Math.ceil((min * 2) - current);
      if (qtdSugerida <= 0) qtdSugerida = 1; 
      
      let nomeCurto = item.nome;
      if (nomeCurto.length > 50) nomeCurto = nomeCurto.substring(0, 47) + '...';

      doc.text(nomeCurto, 20, y);
      doc.text(`${currentVisual} ${item.unidade_medida}`, 130, y);
      
      doc.setDrawColor(37, 99, 235); doc.setFillColor(240, 249, 255); doc.rect(158, y - 5, 32, 7, 'FD');
      doc.setFont(undefined, 'bold'); doc.setTextColor(37, 99, 235); doc.text(`${qtdSugerida} ${item.unidade_medida}`, 160, y);
      
      doc.setFont(undefined, 'normal'); doc.setTextColor(0, 0, 0);
      y += 12;
    });
    
    y += 20;
    if (y > 270) { doc.addPage(); y = 30; }
    doc.setDrawColor(0, 0, 0); doc.line(20, y, 90, y);
    doc.setFontSize(10); doc.text(t('dashboard.order.signature'), 20, y + 6);
    
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
        <StatCard title={t('dashboard.card.new_patients')} value={summary.pacientes_semana} icon={Users} color="#2563eb" sub={t('dashboard.card.new_patients_sub')} />
        <StatCard title={t('dashboard.card.consultations')} value={summary.consultas_semana} icon={Calendar} color="#7c3aed" sub={t('dashboard.card.consultations_sub')} />
        <StatCard title={t('dashboard.card.billing')} value={`${parseFloat(summary.faturacao_semana || 0).toFixed(2)}€`} icon={Euro} color="#059669" sub={t('dashboard.card.billing_sub')} />
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