import React, { useState, useEffect, useContext } from 'react';
import { DollarSign, Calendar, Filter, FileText, Search, CheckCircle } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';

const Faturacao = () => {
  const { theme } = useContext(ThemeContext);
  const [faturas, setFaturas] = useState([]);
  const [filtroTempo, setFiltroTempo] = useState('hoje'); // hoje, semana, mes, tudo

  useEffect(() => {
    fetch('http://localhost:5000/api/faturacao')
      .then(res => res.json())
      .then(data => setFaturas(data))
      .catch(err => console.error(err));
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
    return true; // 'tudo'
  });

  const totalFaturado = faturasFiltradas.reduce((acc, f) => acc + parseFloat(f.valor_total), 0);

  const filterBtnStyle = (isActive) => ({
    padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
    backgroundColor: isActive ? '#2563eb' : theme.pageBg,
    color: isActive ? 'white' : theme.text,
    transition: 'all 0.2s'
  });

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: theme.isDark ? '#ffffff' : theme.text, display: 'flex', alignItems: 'center', gap: '15px' }}>
            <DollarSign color="#10b981" size={32} /> Histórico e Faturação
          </h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>Registo financeiro de todas as consultas finalizadas.</p>
        </div>
      </div>

      {/* DASHBOARD RÁPIDO E FILTROS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginBottom: '30px' }}>
        
        <div style={{ backgroundColor: '#10b981', color: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: 0.9 }}>Total Cobrado ({filtroTempo})</h3>
          <h1 style={{ margin: 0, fontSize: '40px', fontWeight: '900' }}>{totalFaturado.toFixed(2)} €</h1>
          <p style={{ margin: '15px 0 0 0', fontSize: '13px', opacity: 0.8 }}><CheckCircle size={14} style={{ marginBottom: '-2px' }}/> {faturasFiltradas.length} consultas processadas</p>
        </div>

        <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: theme.subText, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>
            <Filter size={16} /> Filtrar Histórico
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button style={filterBtnStyle(filtroTempo === 'hoje')} onClick={() => setFiltroTempo('hoje')}>Hoje</button>
            <button style={filterBtnStyle(filtroTempo === 'semana')} onClick={() => setFiltroTempo('semana')}>Últimos 7 Dias</button>
            <button style={filterBtnStyle(filtroTempo === 'mes')} onClick={() => setFiltroTempo('mes')}>Este Mês</button>
            <button style={filterBtnStyle(filtroTempo === 'tudo')} onClick={() => setFiltroTempo('tudo')}>Todo o Histórico</button>
          </div>
        </div>

      </div>

      {/* TABELA DE FATURAS */}
      <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: theme.pageBg, borderBottom: `2px solid ${theme.border}` }}>
              <th style={{ padding: '15px 20px', color: theme.subText, fontSize: '12px', fontWeight: 'bold' }}>DATA / HORA</th>
              <th style={{ padding: '15px 20px', color: theme.subText, fontSize: '12px', fontWeight: 'bold' }}>PACIENTE</th>
              <th style={{ padding: '15px 20px', color: theme.subText, fontSize: '12px', fontWeight: 'bold' }}>PROCEDIMENTO</th>
              <th style={{ padding: '15px 20px', color: theme.subText, fontSize: '12px', fontWeight: 'bold' }}>MÉTODO</th>
              <th style={{ padding: '15px 20px', color: theme.subText, fontSize: '12px', fontWeight: 'bold', textAlign: 'right' }}>VALOR</th>
            </tr>
          </thead>
          <tbody>
            {faturasFiltradas.length > 0 ? faturasFiltradas.map(f => (
              <tr key={f.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: '15px 20px', fontSize: '14px', color: theme.text }}>
                  {new Date(f.data_emissao).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '15px 20px', fontWeight: 'bold', color: theme.isDark ? '#ffffff' : theme.text }}>{f.paciente_nome}</td>
                <td style={{ padding: '15px 20px', color: theme.text }}>{f.procedimento_nome}</td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ padding: '5px 10px', backgroundColor: theme.pageBg, borderRadius: '6px', fontSize: '12px', border: `1px solid ${theme.border}` }}>{f.metodo_pagamento}</span>
                </td>
                <td style={{ padding: '15px 20px', fontWeight: '900', color: '#10b981', textAlign: 'right', fontSize: '16px' }}>
                  {parseFloat(f.valor_total).toFixed(2)} €
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: theme.subText }}>
                  Nenhum registo financeiro encontrado para este período.
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