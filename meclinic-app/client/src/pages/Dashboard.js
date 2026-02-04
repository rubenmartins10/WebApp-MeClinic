import React from 'react';
import { Users, Calendar, DollarSign, TrendingUp, Activity, Clock } from 'lucide-react';

const Dashboard = () => {
  // Dados de exemplo
  const stats = [
    { title: 'Total Pacientes', value: '1,234', icon: Users, color: '#2563eb', bg: '#eff6ff' },
    { title: 'Consultas Hoje', value: '42', icon: Calendar, color: '#7c3aed', bg: '#f5f3ff' },
    { title: 'Faturação', value: '€ 12,450', icon: DollarSign, color: '#059669', bg: '#ecfdf5' },
    { title: 'Produtos', value: '15', icon: TrendingUp, color: '#ea580c', bg: '#fff7ed' },
  ];

  return (
    <div style={{ padding: '30px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#6b7280', marginTop: '5px' }}>Bem-vindo à MeClinic.</p>
        </div>
        <div style={{ background: 'white', padding: '10px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Clock size={16} />
          <span>{new Date().toLocaleDateString('pt-PT')}</span>
        </div>
      </div>

      {/* Cartões de Estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {stats.map((stat, index) => (
          <div key={index} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>{stat.title}</p>
              <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '5px 0 0 0' }}>{stat.value}</h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: stat.bg, color: stat.color }}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Área em Branco para Gráficos/Listas (Placeholder) */}
      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: 'white', height: '300px', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#374151', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} /> Atividade da Clínica
          </h3>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            (Gráfico de Pacientes)
          </div>
        </div>
        <div style={{ backgroundColor: 'white', height: '300px', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#374151', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} /> Próximas
          </h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>Ana Silva - 09:00</div>
            <div style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>Bruno Santos - 10:30</div>
            <div style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>Carla Dias - 14:00</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;