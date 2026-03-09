// client/src/pages/Report.js
import React, { useState, useEffect, useContext } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, ChevronLeft, ChevronRight, Printer, Mail, Send, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ThemeContext } from '../ThemeContext';

const Reports = () => {
  const { theme } = useContext(ThemeContext);
  const [reportData, setReportData] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [notif, setNotif] = useState({ show: false, msg: '' });

  const user = JSON.parse(localStorage.getItem('meclinic_user') || '{}');

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

  const showNotification = (msg) => {
    setNotif({ show: true, msg });
    setTimeout(() => setNotif({ show: false, msg: '' }), 4000);
  };

  const gerarPDF = (action = 'download') => {
    const doc = new jsPDF();
    const dataFim = new Date(currentWeekStart);
    dataFim.setDate(dataFim.getDate() + 6);
    const dataStr = `${new Date(currentWeekStart).toLocaleDateString('pt-PT')} a ${dataFim.toLocaleDateString('pt-PT')}`;

    doc.setFontSize(20); doc.setTextColor(37, 99, 235);
    doc.text("Relatorio Semanal - MeClinic", 14, 20);
    doc.setFontSize(11); doc.setTextColor(100);
    doc.text(`Semana de referencia: ${dataStr}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Metrica Financeira', 'Valor Calculado']],
      body: [
        ['Total de Consultas', `${reportData.resumo.total_consultas || 0}`],
        ['Faturacao Bruta Estimada', `${parseFloat(reportData.resumo.faturacao_total || 0).toFixed(2)}€`],
        ['Custos Materiais (Baseado em Fichas)', `${parseFloat(reportData.resumo.custos_materiais_total || 0).toFixed(2)}€`],
        ['Lucro Bruto Estimado', `${parseFloat(reportData.resumo.lucro_estimado || 0).toFixed(2)}€`]
      ],
      theme: 'grid', headStyles: { fillColor: [37, 99, 235] }
    });

    doc.setFontSize(14); doc.setTextColor(37, 99, 235);
    doc.text("1. Resumo de Procedimentos Realizados", 14, doc.lastAutoTable.finalY + 15);
    const procTable = (reportData.detalhe_procedimentos || []).map(p => [ p.nome, p.quantidade, `${parseFloat(p.subtotal_faturado || 0).toFixed(2)}€` ]);
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 20, head: [['Procedimento', 'Vezes Realizado', 'Faturado']], body: procTable, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });

    doc.addPage();
    doc.setFontSize(14); doc.setTextColor(37, 99, 235);
    doc.text("2. Materiais e Consumiveis Gastos na Semana", 14, 20);
    const matTable = (reportData.top_materiais || []).map(m => [ m.material, m.quantidade_total, `${parseFloat(m.custo_total || 0).toFixed(2)}€` ]);
    autoTable(doc, { startY: 25, head: [['Material Consumido', 'Qtd Total Gasta', 'Custo Total Estimado']], body: matTable, theme: 'grid', headStyles: { fillColor: [5, 150, 105] } });

    if (reportData.alertas_stock && reportData.alertas_stock.length > 0) {
      doc.text("3. ALERTAS CRITICOS DE STOCK", 14, doc.lastAutoTable.finalY + 15);
      const stockTable = reportData.alertas_stock.map(s => [ s.nome, `${s.stock_atual} ${s.unidade_medida}`, s.stock_minimo ]);
      autoTable(doc, { startY: doc.lastAutoTable.finalY + 20, head: [['Produto em Falta', 'Stock Atual', 'Aviso Minimo']], body: stockTable, theme: 'striped', headStyles: { fillColor: [239, 68, 68] } });
    }

    if (action === 'download') {
      doc.save(`Relatorio_MeClinic_${currentWeekStart}.pdf`);
    } else {
      return doc.output('datauristring');
    }
  };

  const enviarRelatorioEmail = async () => {
    setIsSending(true);
    const pdfBase64 = gerarPDF('email');
    
    try {
      const response = await fetch('http://localhost:5000/api/reports/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailDestino: user.email || 'teu_email@clinica.com',
          pdfBase64: pdfBase64,
          semana: new Date(currentWeekStart).toLocaleDateString('pt-PT')
        })
      });
      
      const data = await response.json();
      if (response.ok) showNotification("Relatório PDF enviado para o seu e-mail!");
      else alert(data.error);
    } catch (err) {
      alert("Erro ao conectar ao servidor de e-mail.");
    } finally {
      setIsSending(false);
    }
  };

  if (!reportData) return <div style={{padding: '40px', color: theme.text}}>A processar dados financeiros...</div>;

  const BarChart = ({ data, labelKey, valueKey, color, suffix = '' }) => {
    if (!data || data.length === 0) return <p style={{ color: theme.subText }}>Sem dados registados.</p>;
    const maxVal = Math.max(...data.map(d => parseFloat(d[valueKey] || 0)));
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((item, i) => {
          const val = parseFloat(item[valueKey] || 0);
          const percent = maxVal > 0 ? (val / maxVal) * 100 : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '150px', fontSize: '13px', fontWeight: 'bold', color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item[labelKey]}>{item[labelKey]}</div>
              <div style={{ flex: 1, backgroundColor: theme.pageBg, height: '14px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${theme.border}` }}>
                <div style={{ width: `${percent}%`, backgroundColor: color, height: '100%', borderRadius: '8px', transition: 'width 1s ease' }}></div>
              </div>
              <div style={{ width: '50px', textAlign: 'right', fontSize: '13px', fontWeight: '900', color: theme.text }}>{val}{suffix}</div>
            </div>
          );
        })}
      </div>
    );
  };

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
      
      {notif.show && (
        <div style={{ position: 'fixed', top: 30, right: 30, backgroundColor: '#059669', color: 'white', padding: '15px 25px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <CheckCircle size={20} /> {notif.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: 0, color: theme.text }}>Relatórios de Gestão</h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>Análise de performance e custos reais.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: theme.cardBg, padding: '10px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
            <button onClick={() => navegarSemana(-1)} style={{border:'none', background:'none', cursor:'pointer', color: theme.subText}}><ChevronLeft size={20} /></button>
            <span style={{padding:'0 15px', fontWeight:'600', color: theme.text}}>Semana de {new Date(currentWeekStart).toLocaleDateString('pt-PT')}</span>
            <button onClick={() => navegarSemana(1)} style={{border:'none', background:'none', cursor:'pointer', color: theme.subText}}><ChevronRight size={20} /></button>
          </div>
          
          <button onClick={() => gerarPDF('download')} style={{ backgroundColor: theme.pageBg, color: theme.text, border: `1px solid ${theme.border}`, padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Printer size={18} /> Exportar PDF
          </button>

          <button onClick={enviarRelatorioEmail} disabled={isSending} style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: isSending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', opacity: isSending ? 0.7 : 1 }}>
            {isSending ? <Send size={18} className="animate-pulse" /> : <Mail size={18} />} 
            {isSending ? 'A Enviar...' : 'Enviar por E-mail'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <MetricCard title="Consultas (Semana)" value={reportData.resumo.total_consultas || 0} icon={Users} color="#2563eb" />
        <MetricCard title="Faturação Bruta" value={`${parseFloat(reportData.resumo.faturacao_total || 0).toFixed(2)}€`} icon={DollarSign} color="#059669" />
        <MetricCard title="Custos Materiais" value={`${parseFloat(reportData.resumo.custos_materiais_total || 0).toFixed(2)}€`} icon={TrendingDown} color="#ef4444" />
        <MetricCard title="Lucro Real Estimado" value={`${parseFloat(reportData.resumo.lucro_estimado || 0).toFixed(2)}€`} icon={TrendingUp} color="#2563eb" highlight />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '15px', border: `1px solid ${theme.border}` }}>
          <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text }}>
            <BarChart3 size={20} color="#2563eb" /> Procedimentos Realizados
          </h3>
          <p style={{ color: theme.subText, fontSize: '13px', marginBottom: '20px' }}>Ranking dos tratamentos com mais procura nesta semana.</p>
          <BarChart data={reportData.detalhe_procedimentos} labelKey="nome" valueKey="quantidade" color="#3b82f6" />
        </div>

        <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '15px', border: `1px solid ${theme.border}` }}>
          <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text }}>
            <TrendingDown size={20} color="#ef4444" /> Top 10 Materiais Gastos
          </h3>
          <p style={{ color: theme.subText, fontSize: '13px', marginBottom: '20px' }}>O material deduzido com base nas Fichas Técnicas realizadas.</p>
          <BarChart data={reportData.top_materiais} labelKey="material" valueKey="quantidade_total" color="#10b981" suffix=" un" />
        </div>
      </div>
    </div>
  );
};

export default Reports;