import React, { useState, useEffect, useContext } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, ChevronLeft, ChevronRight, Printer, Mail, CheckCircle, XCircle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ThemeContext } from '../ThemeContext';
import logo from '../logo.png'; 

const Report = () => {
  const { theme } = useContext(ThemeContext);
  const [reportData, setReportData] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const user = JSON.parse(localStorage.getItem('meclinic_user') || '{}');
  const isAdmin = user.role === 'ADMIN';

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

  const navegarSemana = (dias) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + dias);
    setCurrentWeekStart(d.toISOString().split('T')[0]);
  };

  const showNotif = (type, message) => setNotification({ show: true, type, message });
  const closeNotif = () => setNotification({ show: false, type: '', message: '' });

  // A MAGIA DO PDF
  const gerarPDFDocumento = () => {
    // Cria o PDF com a primeira página em formato A4 normal
    const doc = new jsPDF();
    
    // LOGÓTIPO NA PÁGINA PRINCIPAL DO RELATÓRIO
    const img = new Image();
    img.src = logo;
    doc.addImage(img, 'PNG', 14, 10, 45, 15);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Semana de: ${new Date(currentWeekStart).toLocaleDateString('pt-PT')}`, 14, 35);

    if (reportData) {
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text("Resumo Financeiro", 14, 45);
      
      doc.setFont(undefined, 'normal');
      doc.text(`Consultas Realizadas: ${reportData.resumo?.total_consultas || 0}`, 14, 55);
      doc.text(`Total Faturado: ${parseFloat(reportData.resumo?.faturacao_total || 0).toFixed(2)} EUR`, 14, 65);
      doc.text(`Custo de Materiais: ${parseFloat(reportData.resumo?.custos_materiais_total || 0).toFixed(2)} EUR`, 14, 75);
      
      doc.setFont(undefined, 'bold');
      doc.text(`Lucro Bruto Estimado: ${parseFloat(reportData.resumo?.lucro_estimado || 0).toFixed(2)} EUR`, 14, 85);

      // TABELA 1: PROCEDIMENTOS (A4)
      if (reportData.detalhe_procedimentos && reportData.detalhe_procedimentos.length > 0) {
        autoTable(doc, {
          head: [['Procedimento Realizado', 'Quantidade', 'Faturado']],
          body: reportData.detalhe_procedimentos.map(p => [p.nome, `${p.quantidade}x`, `${parseFloat(p.subtotal_faturado).toFixed(2)}€`]),
          startY: 95,
        });
      }

      // TABELA 2: MATERIAIS (A4)
      if (reportData.top_materiais && reportData.top_materiais.length > 0) {
        autoTable(doc, {
          head: [['Material Gasto', 'Qtd', 'Custo Un.', 'Custo Total']],
          body: reportData.top_materiais.map(m => [m.material, m.quantidade_total, `${parseFloat(m.preco_unitario).toFixed(2)}€`, `${parseFloat(m.custo_total).toFixed(2)}€`]),
          startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 100,
        });
      }

      // ------------------------------------------------------------------
      // ANEXAR AS NOTAS DE HONORÁRIOS COMO PÁGINAS "TALÃO" INDIVIDUAIS
      // ------------------------------------------------------------------
      if (reportData.notas_faturacao && reportData.notas_faturacao.length > 0) {
        reportData.notas_faturacao.forEach(nota => {
          // Adiciona uma nova página com tamanho de Recibo/Talão (100x150)
          doc.addPage([100, 150], 'portrait');

          doc.addImage(img, 'PNG', 30, 10, 40, 12);
          
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(12); 
          doc.setFont(undefined, 'bold'); 
          doc.text("NOTA DE HONORÁRIOS", 50, 32, { align: 'center' });
          
          doc.setFontSize(8); 
          doc.setFont(undefined, 'normal'); 
          doc.text("DOCUMENTO DE CONTROLO INTERNO", 50, 37, { align: 'center' });
          
          doc.setDrawColor(200, 200, 200);
          doc.line(10, 42, 90, 42);
          
          doc.setFontSize(10);
          doc.text(`Paciente: ${nota.paciente_nome}`, 10, 52);
          doc.text(`Data/Hora: ${new Date(nota.data_emissao).toLocaleString('pt-PT')}`, 10, 62);
          doc.text(`Procedimento: ${nota.procedimento_nome}`, 10, 72);
          doc.text(`Método Pag.: ${nota.metodo_pagamento}`, 10, 82);
          
          doc.line(10, 92, 90, 92);
          
          doc.setFontSize(14); 
          doc.setFont(undefined, 'bold');
          doc.text(`TOTAL PAGO: ${parseFloat(nota.valor_total).toFixed(2)} EUR`, 50, 105, { align: 'center' });
        });
      }
    }
    return doc;
  };

  const baixarPDF = () => {
    const doc = gerarPDFDocumento();
    doc.save(`Relatorio_Clinica_${currentWeekStart}.pdf`);
  };

  const enviarEmail = async () => {
    if (!user.email) {
      showNotif('error', 'Erro: Não foi possível encontrar o seu e-mail na base de dados.');
      return;
    }
    const emailDestino = user.email;
    setIsSending(true);

    try {
      const doc = gerarPDFDocumento();
      const pdfBase64 = doc.output('datauristring');

      const res = await fetch('http://localhost:5000/api/reports/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailDestino, pdfBase64, semana: currentWeekStart })
      });

      if (res.ok) {
        showNotif('success', `Relatório enviado com sucesso para o seu e-mail (${emailDestino})!`);
      } else {
        showNotif('error', 'Erro ao enviar. Verifique a palavra-passe de aplicação do Gmail no servidor.');
      }
    } catch (err) {
      showNotif('error', 'Falha ao conectar ao servidor.');
    } finally {
      setIsSending(false);
    }
  };

  const cardStyle = { backgroundColor: theme.cardBg, padding: '25px', borderRadius: '15px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' };
  const valStyle = { fontSize: '32px', fontWeight: '900', margin: '10px 0 5px 0' };

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto' }}>
      
      {notification.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '40px', borderRadius: '20px', border: `1px solid ${theme.border}`, textAlign: 'center', minWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease-out' }}>
            {notification.type === 'success' ? <CheckCircle size={70} color="#059669" style={{ marginBottom: '20px' }} /> : <XCircle size={70} color="#ef4444" style={{ marginBottom: '20px' }} />}
            <h2 style={{ margin: '0 0 10px 0', fontSize: '26px', fontWeight: 'bold', color: theme.isDark ? '#ffffff' : theme.text }}>
              {notification.type === 'success' ? 'Sucesso!' : 'Aviso do Sistema'}
            </h2>
            <p style={{ margin: '0 0 30px 0', color: theme.subText, fontSize: '16px', lineHeight: '1.5' }}>{notification.message}</p>
            <button onClick={closeNotif} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: notification.type === 'success' ? '#059669' : '#ef4444', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' }}>
              OK, entendi
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 5px 0', color: theme.isDark ? '#ffffff' : theme.text, display: 'flex', alignItems: 'center', gap: '15px' }}>
            <BarChart3 color="#2563eb" size={32} /> Relatório Financeiro
          </h1>
          <p style={{ color: theme.subText, margin: 0 }}>Análise de desempenho e custos.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: theme.cardBg, borderRadius: '10px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
            <button onClick={() => navegarSemana(-7)} style={{ padding: '10px 15px', border: 'none', background: 'none', cursor: 'pointer', color: theme.text, borderRight: `1px solid ${theme.border}` }}><ChevronLeft size={20} /></button>
            <div style={{ padding: '0 20px', fontWeight: 'bold', color: theme.text }}>
              {/* DATA COMPLETA COM ANO AQUI */}
              Semana de {new Date(currentWeekStart).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
            <button onClick={() => navegarSemana(7)} style={{ padding: '10px 15px', border: 'none', background: 'none', cursor: 'pointer', color: theme.text, borderLeft: `1px solid ${theme.border}` }}><ChevronRight size={20} /></button>
          </div>

          <button onClick={baixarPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.pageBg, color: theme.text, border: `1px solid ${theme.border}`, padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Printer size={18} /> Imprimir Relatório
          </button>

          {isAdmin && (
            <button onClick={enviarEmail} disabled={isSending} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', opacity: isSending ? 0.7 : 1 }}>
              <Mail size={18} /> {isSending ? 'A enviar...' : 'Enviar para Admin'}
            </button>
          )}
        </div>
      </div>

      {reportData ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.subText, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}><Users size={18} color="#3b82f6" /> Consultas Concluídas</div>
              <div style={{ ...valStyle, color: theme.isDark ? '#fff' : '#000' }}>{reportData.resumo?.total_consultas || 0}</div>
            </div>
            <div style={{ ...cardStyle, backgroundColor: '#10b981', color: 'white', border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', opacity: 0.9 }}><DollarSign size={18} /> Total Faturado</div>
              <div style={valStyle}>{parseFloat(reportData.resumo?.faturacao_total || 0).toFixed(2)}€</div>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.subText, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}><TrendingDown size={18} color="#ef4444" /> Custo de Materiais</div>
              <div style={{ ...valStyle, color: '#ef4444' }}>{parseFloat(reportData.resumo?.custos_materiais_total || 0).toFixed(2)}€</div>
            </div>
            <div style={{ ...cardStyle, borderColor: '#2563eb', backgroundColor: theme.isDark ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2563eb', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}><TrendingUp size={18} /> Lucro Bruto Estimado</div>
              <div style={{ ...valStyle, color: '#2563eb' }}>{parseFloat(reportData.resumo?.lucro_estimado || 0).toFixed(2)}€</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div style={{ backgroundColor: theme.cardBg, padding: '25px', borderRadius: '15px', border: `1px solid ${theme.border}` }}>
              <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text }}><FileText size={20} color="#2563eb" /> Procedimentos Realizados</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.subText, fontSize: '12px' }}>
                    <th style={{ paddingBottom: '10px' }}>NOME</th><th style={{ paddingBottom: '10px', textAlign: 'center' }}>QTD</th><th style={{ paddingBottom: '10px', textAlign: 'right' }}>VALOR FATURADO</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.detalhe_procedimentos?.length > 0 ? reportData.detalhe_procedimentos.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '15px 0', fontWeight: 'bold', color: theme.text }}>{p.nome}</td>
                      <td style={{ padding: '15px 0', textAlign: 'center', color: theme.subText }}>{p.quantidade}x</td>
                      <td style={{ padding: '15px 0', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{parseFloat(p.subtotal_faturado).toFixed(2)}€</td>
                    </tr>
                  )) : <tr><td colSpan="3" style={{ padding: '30px 0', textAlign: 'center', color: theme.subText }}>Sem dados nesta semana.</td></tr>}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: theme.cardBg, padding: '25px', borderRadius: '15px', border: `1px solid ${theme.border}` }}>
              <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text }}><TrendingDown size={20} color="#ef4444" /> Consumo de Materiais</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.subText, fontSize: '12px' }}>
                    <th style={{ paddingBottom: '10px' }}>MATERIAL</th>
                    <th style={{ paddingBottom: '10px', textAlign: 'center' }}>QTD</th>
                    <th style={{ paddingBottom: '10px', textAlign: 'right' }}>CUSTO UN.</th>
                    <th style={{ paddingBottom: '10px', textAlign: 'right' }}>CUSTO TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.top_materiais?.length > 0 ? reportData.top_materiais.map((m, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '15px 0', fontWeight: 'bold', color: theme.text }}>{m.material}</td>
                      <td style={{ padding: '15px 0', textAlign: 'center', color: theme.subText }}>{m.quantidade_total}x</td>
                      <td style={{ padding: '15px 0', textAlign: 'right', color: theme.subText }}>{parseFloat(m.preco_unitario).toFixed(2)}€</td>
                      <td style={{ padding: '15px 0', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>{parseFloat(m.custo_total).toFixed(2)}€</td>
                    </tr>
                  )) : <tr><td colSpan="4" style={{ padding: '30px 0', textAlign: 'center', color: theme.subText }}>Sem dados nesta semana.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0', color: theme.subText }}>A carregar dados do relatório...</div>
      )}
    </div>
  );
};

export default Report;