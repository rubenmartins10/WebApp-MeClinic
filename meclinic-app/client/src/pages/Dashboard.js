import React, { useEffect, useState, useContext } from 'react';
import { Users, Calendar, Euro, AlertTriangle, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ThemeContext } from '../ThemeContext';
import { LanguageContext } from '../LanguageContext'; // <-- Motor de Idiomas

const Dashboard = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext); // <-- Função de tradução

  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({ pacientes_semana: 0, consultas_semana: 0, faturacao_semana: 0, alertas_stock: 0 });
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

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

  const StatCard = ({ title, value, icon: Icon, color, sub }) => (
    <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1, border: `1px solid ${theme.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: theme.subText }}>{title}</span>
        <div style={{ padding: '8px', backgroundColor: `${color}15`, borderRadius: '10px' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.text }}>{value}</div>
      <div style={{ fontSize: '12px', color: theme.subText, marginTop: '5px' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ padding: '10px', transition: 'all 0.3s ease' }}>
      
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
        <StatCard title={t('dashboard.card.stock_alerts')} value={summary.alertas_stock} icon={AlertTriangle} color={summary.alertas_stock > 0 ? "#ef4444" : "#059669"} sub={t('dashboard.card.stock_alerts_sub')} />
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