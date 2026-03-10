import React, { useEffect, useState, useContext } from 'react';
import { Users, Calendar, Euro, AlertTriangle, ChevronLeft, ChevronRight, TrendingUp, X, Package } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ThemeContext } from '../ThemeContext';
import { LanguageContext } from '../LanguageContext';

const Dashboard = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);

  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({ pacientes_semana: 0, consultas_semana: 0, faturacao_semana: 0, alertas_stock: 0 });
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAlertsList, setStockAlertsList] = useState([]);

  const carregarDados = (startDate) => {
    fetch(`http://localhost:5000/api/stats/patients-weekly?start=${startDate}`)
      .then(res => res.json())
      .then(data => setChartData(data));

    fetch(`http://localhost:5000/api/stats/dashboard-summary?start=${startDate}`)
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
      const res = await fetch('http://localhost:5000/api/stats/stock-alerts');
      const data = await res.json();
      setStockAlertsList(data);
      setShowStockModal(true);
    } catch (e) { console.error("Erro ao carregar alertas:", e); }
  };

  // FUNÇÃO MÁGICA PARA CALCULAR O TOTAL REAL NO DASHBOARD
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

  const StatCard = ({ title, value, icon: Icon, color, sub, onIconClick, clickableIcon }) => (
    <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1, border: `1px solid ${theme.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: theme.subText }}>{title}</span>
        <div 
          onClick={clickableIcon ? onIconClick : undefined}
          style={{ 
            padding: '8px', backgroundColor: `${color}15`, borderRadius: '10px', 
            cursor: clickableIcon ? 'pointer' : 'default', transition: 'all 0.2s',
            opacity: clickableIcon ? 0.9 : 1
          }}
          onMouseEnter={(e) => { if(clickableIcon) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseLeave={(e) => { if(clickableIcon) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1)'; } }}
          title={clickableIcon ? t('dashboard.modal.stock_title') : ""}
        >
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.text }}>{value}</div>
      <div style={{ fontSize: '12px', color: theme.subText, marginTop: '5px' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ padding: '10px', transition: 'all 0.3s ease' }}>
      
      {showStockModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '20px', width: '550px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            
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
                    const stockVisual = parseFloat(item.stock_atual) % 1 === 0 ? parseInt(item.stock_atual) : parseFloat(item.stock_atual).toFixed(2);
                    const minVisual = parseFloat(item.stock_minimo) % 1 === 0 ? parseInt(item.stock_minimo) : parseFloat(item.stock_minimo).toFixed(2);

                    return (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: theme.text }}>{item.nome}</td>
                        <td style={{ padding: '15px', textAlign: 'right' }}>
                          <span style={{ fontWeight: '900', color: '#ef4444', fontSize: '15px' }}>
                            {stockVisual} <span style={{ fontSize: '12px', fontWeight: 'normal', color: theme.subText }}>{item.unidade_medida}</span>
                          </span>
                          {/* AQUI APARECE O CÁLCULO (ex: 400 mts no total) */}
                          {totalCalc && (
                            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>
                              ({totalCalc})
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'right', color: theme.subText, verticalAlign: 'top', paddingTop: '17px' }}>
                          {minVisual}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: theme.subText }}>
                        <Package size={30} style={{ opacity: 0.3, marginBottom: '10px' }} />
                        <br/>{t('dashboard.modal.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <button onClick={() => setShowStockModal(false)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: theme.pageBg, color: theme.text, fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
              {t('dashboard.modal.close')}
            </button>
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

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <StatCard title={t('dashboard.card.new_patients')} value={summary.pacientes_semana} icon={Users} color="#2563eb" sub={t('dashboard.card.new_patients_sub')} />
        <StatCard title={t('dashboard.card.consultations')} value={summary.consultas_semana} icon={Calendar} color="#7c3aed" sub={t('dashboard.card.consultations_sub')} />
        <StatCard title={t('dashboard.card.billing')} value={`${parseFloat(summary.faturacao_semana || 0).toFixed(2)}€`} icon={Euro} color="#059669" sub={t('dashboard.card.billing_sub')} />
        <StatCard 
          title={t('dashboard.card.stock_alerts')} 
          value={summary.alertas_stock} 
          icon={AlertTriangle} 
          color={summary.alertas_stock > 0 ? "#ef4444" : "#059669"} 
          sub={t('dashboard.card.stock_alerts_sub')} 
          clickableIcon={summary.alertas_stock > 0} 
          onIconClick={openStockAlerts}
        />
      </div>

      <div style={{ backgroundColor: theme.cardBg, borderRadius: '15px', padding: '25px', border: `1px solid ${theme.border}` }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text }}>
          <TrendingUp size={20} color="#2563eb" /> {t('dashboard.chart.title')}
        </h3>
        <div style={{ height: '350px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
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