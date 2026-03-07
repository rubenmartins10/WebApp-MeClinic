import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Calendar, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
const [reportData, setReportData] = useState(null);
const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
});

const fetchReport = (date) => {
    fetch(`http://localhost:5000/api/reports/weekly-detail?start=${date}`)
    .then(res => res.json())
    .then(data => setReportData(data));
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
    doc.text(`Semana: ${currentWeekStart} a ${new Date(new Date(currentWeekStart).getTime() + 6*24*60*60*1000).toLocaleDateString()}`, 14, 30);

    autoTable(doc, {
    startY: 40,
    head: [['Métrica', 'Valor']],
    body: [
        ['Total Consultas', reportData.resumo.total_consultas],
        ['Faturação Bruta', `${reportData.resumo.faturacao_total.toFixed(2)}€`],
        ['Custos Materiais', `${reportData.resumo.custos_materiais_total.toFixed(2)}€`],
        ['Lucro Líquido Estimado', `${reportData.resumo.lucro_estimado.toFixed(2)}€`]
    ],
    theme: 'grid'
    });

    doc.text("Detalhamento por Procedimento", 14, doc.lastAutoTable.finalY + 15);

    autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Procedimento', 'Qtd', 'Total Faturado']],
    body: reportData.detalhe_procedimentos.map(p => [p.nome, p.quantidade, `${p.subtotal_faturado.toFixed(2)}€`]),
    });

    doc.save(`Relatorio_Semanal_${currentWeekStart}.pdf`);
};

if (!reportData) return <div style={{padding: '40px'}}>Carregando...</div>;

return (
    <div style={{ padding: '40px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
    
      {/* Cabeçalho */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: 0 }}>Relatórios Financeiros</h1>
        <p style={{ color: '#6b7280' }}>Análise detalhada de custos e proveitos.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '10px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <button onClick={() => navegarSemana(-1)} style={{border:'none', background:'none', cursor:'pointer'}}><ChevronLeft/></button>
            <span style={{padding:'0 15px', fontWeight:'600'}}>Semana de {new Date(currentWeekStart).toLocaleDateString('pt-PT')}</span>
            <button onClick={() => navegarSemana(1)} style={{border:'none', background:'none', cursor:'pointer'}}><ChevronRight/></button>
        </div>
        <button onClick={gerarPDFRelatorio} style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} /> Exportar PDF
        </button>
        </div>
    </div>

      {/* Cartões de Métricas */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <MetricCard title="Consultas" value={reportData.resumo.total_consultas} icon={Users} color="#2563eb" />
        <MetricCard title="Faturação Bruta" value={`${reportData.resumo.faturacao_total.toFixed(2)}€`} icon={DollarSign} color="#059669" />
        <MetricCard title="Custos Materiais" value={`${reportData.resumo.custos_materiais_total.toFixed(2)}€`} icon={TrendingDown} color="#ef4444" />
        <MetricCard title="Lucro Real" value={`${reportData.resumo.lucro_estimado.toFixed(2)}€`} icon={TrendingUp} color="#2563eb" highlight />
    </div>

      {/* Tabela de Procedimentos */}
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 size={20}/> Distribuição por Procedimento</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#64748b' }}>
            <th style={{ padding: '15px' }}>Procedimento</th>
            <th style={{ padding: '15px' }}>Quantidade Realizada</th>
            <th style={{ padding: '15px', textAlign: 'right' }}>Total Faturado</th>
            </tr>
        </thead>
        <tbody>
            {reportData.detalhe_procedimentos.map(p => (
            <tr key={p.nome} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '15px', fontWeight: '600' }}>{p.nome}</td>
                <td style={{ padding: '15px' }}>{p.quantidade} atendimentos</td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>{p.subtotal_faturado.toFixed(2)}€</td>
            </tr>
            ))}
        </tbody>
        </table>
    </div>
    </div>
);
};

const MetricCard = ({ title, value, icon: Icon, color, highlight }) => (
<div style={{ backgroundColor: highlight ? color : 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
    <span style={{ fontSize: '13px', fontWeight: 'bold', color: highlight ? 'white' : '#9ca3af', textTransform: 'uppercase' }}>{title}</span>
    <Icon size={20} color={highlight ? 'white' : color} />
    </div>
    <div style={{ fontSize: '24px', fontWeight: '800', color: highlight ? 'white' : '#111827' }}>{value}</div>
</div>
);

export default Reports;