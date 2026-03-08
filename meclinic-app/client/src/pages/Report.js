// client/src/pages/Report.js
import React, { useState, useEffect, useContext } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ThemeContext } from '../ThemeContext';

const Reports = () => {
  const { theme } = useContext(ThemeContext);
  const [reportData, setReportData] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  const fetchReport = (date) => {
    fetch(`http://localhost:5000/api/reports/weekly-detail?start=${date}`)
    .then(res => res.json())
    .then(data => setReportData(data))
    .catch(err => console.error("Erro ao carregar relatórios:", err));
  };

  useEffect(() => { fetchReport(currentWeekStart); }, [currentWeekStart]);

  const navegarSemana = (dir) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + (dir * 7));
    setCurrentWeekStart(d.toISOString().split('T')[0]);
  };

  const gerarPDFRelatorio = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(37, 99, 235);
    doc.text("Relatório de Desempenho Semanal - MeClinic", 14, 20);
    
    doc.setFontSize(12); doc.setTextColor(100);
    const dataFim = new Date(currentWeekStart);
    dataFim.setDate(dataFim.getDate() + 6);
    doc.text(`Semana: ${new Date(currentWeekStart).toLocaleDateString('pt-PT')} a ${dataFim.toLocaleDateString('pt-PT')}`, 14, 28);

    // PROTEÇÃO APLICADA: parseFloat(valor || 0).toFixed(2)
    autoTable(doc, {
      startY: 35,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Consultas', `${reportData.resumo.total_consultas || 0}`],
        ['Faturação Bruta Estimada', `${parseFloat(reportData.resumo.faturacao_total || 0).toFixed(2)}€`],
        ['Custos Materiais Estimados', `${parseFloat(reportData.resumo.custos_materiais_total || 0).toFixed(2)}€`],
        ['Lucro Bruto Estimado', `${parseFloat(reportData.resumo.lucro_estimado || 0).toFixed(2)}€`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.setFontSize(14); doc.setTextColor(37, 99, 235);
    doc.text("Detalhe por Procedimento", 14, doc.lastAutoTable.finalY + 15);

    // PROTEÇÃO APLICADA NO DETALHE
    const tableData = (reportData.detalhe_procedimentos || []).map(p => [
      p.nome, p.quantidade, `${parseFloat(p.subtotal_faturado || 0).toFixed(2)}€`
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Procedimento', 'Quantidade', 'Subtotal Faturado']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`Relatorio_Semanal_${currentWeekStart}.pdf`);
  };

  if (!reportData) return <div style={{padding: '40px', color: theme.text}}>Carregando relatórios...</div>;

  const MetricCard = ({ title, value, icon: Icon, color, highlight }) => (
    <div style={{ backgroundColor: highlight ? color : theme.cardBg, padding: '25px', borderRadius: '15px', border: highlight ? 'none' : `1px solid ${theme.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: highlight ? 'white' : theme.subText, textTransform: 'uppercase' }}>{title}</span>
        <Icon size={20} color={highlight ? 'white' : color} />
      </div>
      <div style={{ fontSize: '24px', fontWeight: '800', color: highlight ? 'white' : theme.text }}>{value}</div>
    </div>
  );

  return (
    <div style={{ padding: '10px', transition: 'all 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: 0, color: theme.text }}>Relatórios Financeiros</h1>
          <p style={{ color: theme.subText }}>Análise detalhada de custos e proveitos.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: theme.cardBg, padding: '10px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
            <button onClick={() => navegarSemana(-1)} style={{border:'none', background:'none', cursor:'pointer', color: theme.subText}}><ChevronLeft size={20} /></button>
            <span style={{padding:'0 15px', fontWeight:'600', color: theme.text}}>Semana de {new Date(currentWeekStart).toLocaleDateString('pt-PT')}</span>
            <button onClick={() => navegarSemana(1)} style={{border:'none', background:'none', cursor:'pointer', color: theme.subText}}><ChevronRight size={20} /></button>
          </div>
          <button onClick={gerarPDFRelatorio} style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Printer size={18} /> Exportar PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {/* APLICADA PROTEÇÃO parseFloat(valor || 0) A TODOS OS CARTÕES */}
        <MetricCard title="Consultas" value={reportData.resumo.total_consultas || 0} icon={Users} color="#2563eb" />
        <MetricCard title="Faturação Bruta" value={`${parseFloat(reportData.resumo.faturacao_total || 0).toFixed(2)}€`} icon={DollarSign} color="#059669" />
        <MetricCard title="Custos Materiais" value={`${parseFloat(reportData.resumo.custos_materiais_total || 0).toFixed(2)}€`} icon={TrendingDown} color="#ef4444" />
        <MetricCard title="Lucro Real" value={`${parseFloat(reportData.resumo.lucro_estimado || 0).toFixed(2)}€`} icon={TrendingUp} color="#2563eb" highlight />
      </div>

      <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '15px', border: `1px solid ${theme.border}` }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text }}><BarChart3 size={20}/> Distribuição por Procedimento</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: theme.text }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${theme.border}`, textAlign: 'left', color: theme.subText }}>
              <th style={{ padding: '15px' }}>Procedimento</th>
              <th style={{ padding: '15px' }}>Quantidade Realizada</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>Total Faturado</th>
            </tr>
          </thead>
          <tbody>
            {(reportData.detalhe_procedimentos || []).length > 0 ? (
              reportData.detalhe_procedimentos.map(p => (
                <tr key={p.nome} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: '15px', fontWeight: '600', color: theme.text }}>{p.nome}</td>
                  <td style={{ padding: '15px', color: theme.subText }}>{p.quantidade} atendimentos</td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                    {parseFloat(p.subtotal_faturado || 0).toFixed(2)}€
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: theme.subText }}>
                  Não existem consultas registadas nesta semana.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;