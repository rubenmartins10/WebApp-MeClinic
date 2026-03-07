import React, { useEffect, useState } from 'react';
import { Users, Calendar, Euro, AlertTriangle, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = () => {
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({ pacientes_semana: 0, consultas_semana: 0, faturacao_semana: 0, alertas_stock: 0 });
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  const carregarDados = (startDate) => {
    // Carrega gráfico
    fetch(`http://localhost:5000/api/stats/patients-weekly?start=${startDate}`)
      .then(res => res.json())
      .then(data => setChartData(data));

    // Carrega cartões (Summary)
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
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>{title}</span>
        <div style={{ padding: '8px', backgroundColor: `${color}15`, borderRadius: '10px' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ padding: '30px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER COM NAVEGAÇÃO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Dashboard MeClinic</h1>
          <p style={{ color: '#6b7280' }}>Monitorização de desempenho semanal</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'white', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <button onClick={() => navegarSemana(-1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: '700', fontSize: '14px' }}>Semana de {new Date(currentWeekStart).toLocaleDateString('pt-PT')}</span>
          <button onClick={() => navegarSemana(1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* LINHA DE CARTÕES (KPIs) */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <StatCard title="NOVOS PACIENTES" value={summary.pacientes_semana} icon={Users} color="#2563eb" sub="Registados esta semana" />
        <StatCard title="CONSULTAS" value={summary.consultas_semana} icon={Calendar} color="#7c3aed" sub="Agendadas para a semana" />
        <StatCard title="FATURAÇÃO ESTIMADA" value={`${parseFloat(summary.faturacao_semana).toFixed(2)}€`} icon={Euro} color="#059669" sub="Baseado nos procedimentos" />
        <StatCard title="ALERTAS DE STOCK" value={summary.alertas_stock} icon={AlertTriangle} color={summary.alertas_stock > 0 ? "#ef4444" : "#059669"} sub="Produtos abaixo do mínimo" />
      </div>

      {/* GRÁFICO (REPOSICIONADO PARA BAIXO) */}
      <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={20} color="#2563eb" /> Fluxo de Pacientes por Dia
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;