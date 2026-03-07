import React, { useState, useEffect } from 'react';
import { FileText, ClipboardList, ChevronRight, Download, Edit, Save, X, CheckCircle, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FichasTecnicas = () => {
  const [modelos, setModelos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [itens, setItens] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProdutos, setEditedProdutos] = useState([]);
  const [editedPrecoTotal, setEditedPrecoTotal] = useState(0);

  // ESTADO: Controla a notificação bonita no centro do ecrã
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const carregarModelos = () => {
    fetch('http://localhost:5000/api/modelos-procedimento')
      .then(res => res.json())
      .then(data => setModelos(data));
  };

  useEffect(() => {
    carregarModelos();
  }, []);

  const carregarItens = (modelo) => {
    setSelecionado(modelo);
    setIsEditing(false); 
    fetch(`http://localhost:5000/api/modelos-procedimento/${modelo.id}/itens`)
      .then(res => res.json())
      .then(data => setItens(data));
  };

  // FUNÇÕES DE NOTIFICAÇÃO: Mostra e esconde manualmente
  const mostrarNotificacao = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const fecharNotificacao = () => {
    setNotification({ show: false, type: '', message: '' });
  };

  // --- LÓGICA DE EDIÇÃO ---
  const iniciarEdicao = () => {
    setEditedProdutos(JSON.parse(JSON.stringify(itens)));
    setEditedPrecoTotal(parseFloat(selecionado.custo_total_estimado));
    setIsEditing(true);
  };

  const cancelarEdicao = () => {
    setIsEditing(false);
  };

  const handleInputChange = (index, field, value) => {
    const novosProdutos = [...editedProdutos];
    novosProdutos[index][field] = value;
    
    const qtd = parseFloat(novosProdutos[index].quantidade) || 0;
    const precoU = parseFloat(novosProdutos[index].preco_unitario) || 0;
    novosProdutos[index].preco_total_item = qtd * precoU;
    
    setEditedProdutos(novosProdutos);
    
    const novoTotal = novosProdutos.reduce((acc, p) => acc + parseFloat(p.preco_total_item || 0), 0);
    setEditedPrecoTotal(novoTotal);
  };

  const salvarEdicao = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/modelos-procedimento/${selecionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: editedProdutos,
          custo_total: editedPrecoTotal
        })
      });

      if (response.ok) {
        setItens(editedProdutos);
        setSelecionado({ ...selecionado, custo_total_estimado: editedPrecoTotal });
        setIsEditing(false);
        carregarModelos(); 
        
        mostrarNotificacao('success', 'Ficha técnica atualizada com sucesso!');
      } else {
        mostrarNotificacao('error', 'Erro ao atualizar a ficha na base de dados.');
      }
    } catch (error) {
      console.error('Erro:', error);
      mostrarNotificacao('error', 'Erro ao ligar ao servidor.');
    }
  };

  // --- PDF ---
  const gerarPDF = () => {
    const doc = new jsPDF();
    const dataHoje = new Date().toLocaleDateString('pt-PT');

    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text("MeClinic - Ficha Técnica", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Documento gerado em: ${dataHoje}`, 14, 28);
    doc.text(`Procedimento: ${selecionado.nome}`, 14, 34);

    const tableColumn = ["Item / Material", "Quantidade", "Preço Unitário", "Subtotal"];
    const tableRows = [];

    const dadosParaPDF = isEditing ? editedProdutos : itens;

    dadosParaPDF.forEach(item => {
      const rowData = [
        item.nome_item,
        item.quantidade,
        `${parseFloat(item.preco_unitario).toFixed(2)}€`,
        `${parseFloat(item.preco_total_item).toFixed(2)}€`
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      margin: { top: 45 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(0);
    
    const custoFinal = isEditing ? editedPrecoTotal : selecionado.custo_total_estimado;
    doc.text(`CUSTO TOTAL ESTIMADO: ${parseFloat(custoFinal).toFixed(2)}€`, 14, finalY);

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Nota: Estes valores baseiam-se no consumo médio por ato médico.", 14, finalY + 10);

    doc.save(`Ficha_Tecnica_${selecionado.nome.replace(/\s+/g, '_')}.pdf`);
  };

  const btnStyle = { color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh', position: 'relative' }}>
      
      {/* OVERLAY DE NOTIFICAÇÃO MANUAL COM BOTÃO X */}
      {notification.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '40px 30px 30px 30px', borderRadius: '15px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)', textAlign: 'center',
            minWidth: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            position: 'relative' // Necessário para posicionar o botão X no canto
          }}>
            
            {/* BOTÃO FECHAR (X) */}
            <button 
              onClick={fecharNotificacao}
              style={{
                position: 'absolute', top: '15px', right: '15px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={24} />
            </button>

            {notification.type === 'success' 
              ? <CheckCircle size={56} color="#059669" style={{ marginBottom: '15px' }} />
              : <XCircle size={56} color="#ef4444" style={{ marginBottom: '15px' }} />
            }
            <h3 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: 'bold', color: '#1e293b' }}>
              {notification.type === 'success' ? 'Sucesso!' : 'Erro'}
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>{notification.message}</p>
          </div>
        </div>
      )}

      <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
        <FileText size={28} color="#2563eb" /> Fichas Técnicas
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '15px' }}>PROCEDIMENTOS</h3>
          {modelos.map(m => (
            <button
              key={m.id}
              onClick={() => carregarItens(m)}
              style={{
                width: '100%', padding: '15px', marginBottom: '8px', border: 'none', borderRadius: '10px',
                backgroundColor: selecionado?.id === m.id ? '#eff6ff' : 'transparent',
                color: selecionado?.id === m.id ? '#2563eb' : '#374151',
                textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: '600'
              }}
            >
              <div>
                <div>{m.nome}</div>
                <div style={{ fontSize: '11px', color: selecionado?.id === m.id ? '#60a5fa' : '#9ca3af', marginTop: '4px' }}>
                  Total: {parseFloat(m.custo_total_estimado).toFixed(2)}€
                </div>
              </div>
              <ChevronRight size={18} style={{ alignSelf: 'center' }} />
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {selecionado ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '22px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {selecionado.nome}
                  {isEditing && <span style={{ fontSize: '12px', backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '6px' }}>MODO DE EDIÇÃO</span>}
                </h2>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {isEditing ? (
                    <>
                      <button onClick={cancelarEdicao} style={{ ...btnStyle, backgroundColor: '#ef4444' }}>
                        <X size={18} /> Cancelar
                      </button>
                      <button onClick={salvarEdicao} style={{ ...btnStyle, backgroundColor: '#2563eb' }}>
                        <Save size={18} /> Salvar Alterações
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={iniciarEdicao} style={{ ...btnStyle, backgroundColor: '#f59e0b' }}>
                        <Edit size={18} /> Editar
                      </button>
                      <button onClick={gerarPDF} style={{ ...btnStyle, backgroundColor: '#059669' }}>
                        <Download size={18} /> Gerar PDF
                      </button>
                    </>
                  )}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '15px' }}>Material</th>
                    <th style={{ padding: '15px' }}>Qtd.</th>
                    <th style={{ padding: '15px' }}>P. Unitário</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(isEditing ? editedProdutos : itens).map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px', fontWeight: '500' }}>{item.nome_item}</td>
                      <td style={{ padding: '15px' }}>
                        {isEditing ? (
                          <input 
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantidade}
                            onChange={(e) => handleInputChange(index, 'quantidade', e.target.value)}
                            style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                          />
                        ) : (
                          item.quantidade
                        )}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input 
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.preco_unitario}
                              onChange={(e) => handleInputChange(index, 'preco_unitario', e.target.value)}
                              style={{ width: '90px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                            /> €
                          </div>
                        ) : (
                          `${parseFloat(item.preco_unitario).toFixed(2)}€`
                        )}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }}>
                        {parseFloat(item.preco_total_item).toFixed(2)}€
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '10px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Custo Total Estimado</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>
                  {isEditing ? editedPrecoTotal.toFixed(2) : parseFloat(selecionado.custo_total_estimado).toFixed(2)}€
                </span>
              </div>

            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '100px', color: '#9ca3af' }}>
              <ClipboardList size={60} style={{ opacity: 0.2, marginBottom: '15px' }} />
              <p>Selecione um procedimento para visualizar e exportar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FichasTecnicas;