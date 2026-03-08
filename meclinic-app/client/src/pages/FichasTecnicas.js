// client/src/pages/FichasTecnicas.js
import React, { useState, useEffect, useContext } from 'react';
import { FileText, ClipboardList, ChevronRight, Download, Edit, Save, X, CheckCircle, XCircle, Plus, Trash2, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ThemeContext } from '../ThemeContext';

const FichasTecnicas = () => {
  const { theme } = useContext(ThemeContext);
  const [modelos, setModelos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [itens, setItens] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProdutos, setEditedProdutos] = useState([]);
  const [editedPrecoTotal, setEditedPrecoTotal] = useState(0);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProcName, setNewProcName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const user = JSON.parse(localStorage.getItem('meclinic_user') || '{}');
  const isAdmin = !user.role || user.role.toUpperCase() === 'ADMIN';

  const carregarModelos = () => {
    fetch('http://localhost:5000/api/modelos-procedimento').then(res => res.json()).then(data => setModelos(data));
  };

  useEffect(() => carregarModelos(), []);

  const carregarItens = (modelo) => {
    setSelecionado(modelo);
    setIsEditing(false); 
    fetch(`http://localhost:5000/api/modelos-procedimento/${modelo.id}/itens`).then(res => res.json()).then(data => setItens(data));
  };

  const mostrarNotificacao = (type, message) => setNotification({ show: true, type, message });
  const fecharNotificacao = () => setNotification({ show: false, type: '', message: '' });

  const handleCreateProcedimento = async (e) => {
    e.preventDefault();
    if (!newProcName.trim()) return;
    try {
      const response = await fetch('http://localhost:5000/api/modelos-procedimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newProcName })
      });
      if (response.ok) {
        const novo = await response.json();
        setShowNewModal(false); setNewProcName('');
        carregarModelos(); carregarItens(novo);
        mostrarNotificacao('success', 'Procedimento criado!');
      }
    } catch (err) { mostrarNotificacao('error', 'Erro no servidor.'); }
  };

  const handleDeleteProcedimento = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/modelos-procedimento/${selecionado.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setShowDeleteConfirm(false); 
        setSelecionado(null);        
        carregarModelos();           
        mostrarNotificacao('success', 'Procedimento removido com sucesso!');
      } else {
        mostrarNotificacao('error', 'Erro ao remover procedimento.');
      }
    } catch (error) {
      mostrarNotificacao('error', 'Erro de ligação ao servidor.');
    }
  };

  const iniciarEdicao = () => {
    setEditedProdutos(JSON.parse(JSON.stringify(itens)));
    setEditedPrecoTotal(parseFloat(selecionado.custo_total_estimado));
    setIsEditing(true);
  };
  
  const cancelarEdicao = () => setIsEditing(false);

  const adicionarNovoMaterial = () => {
    setEditedProdutos([...editedProdutos, { id: `temp-${Date.now()}`, nome_item: '', quantidade: 1, preco_unitario: 0, preco_total_item: 0 }]);
  };

  const removerMaterial = (index) => {
    const novos = [...editedProdutos];
    novos.splice(index, 1);
    setEditedProdutos(novos);
    setEditedPrecoTotal(novos.reduce((acc, p) => acc + parseFloat(p.preco_total_item || 0), 0));
  };

  const handleInputChange = (index, field, value) => {
    const novos = [...editedProdutos];
    novos[index][field] = value;
    novos[index].preco_total_item = (parseFloat(novos[index].quantidade) || 0) * (parseFloat(novos[index].preco_unitario) || 0);
    setEditedProdutos(novos);
    setEditedPrecoTotal(novos.reduce((acc, p) => acc + parseFloat(p.preco_total_item || 0), 0));
  };

  const salvarEdicao = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/modelos-procedimento/${selecionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: editedProdutos, custo_total: editedPrecoTotal })
      });
      if (response.ok) {
        carregarItens(selecionado); carregarModelos();
        mostrarNotificacao('success', 'Ficha atualizada!');
      }
    } catch (err) { mostrarNotificacao('error', 'Erro ao salvar.'); }
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Ficha Técnica: ${selecionado.nome}`, 14, 20);
    autoTable(doc, { head: [['Material', 'Qtd', 'Subtotal']], body: itens.map(i => [i.nome_item, i.quantidade, i.preco_total_item]), startY: 30 });
    doc.save(`Ficha_${selecionado.nome}.pdf`);
  };

  const btnStyle = { color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };
  
  // Estilo robusto para os inputs para se verem sempre bem em qualquer modo
  const tableInputStyle = { width: '100%', background: theme.pageBg, color: theme.text, border: `1px solid ${theme.border}`, padding: '8px', borderRadius: '6px', outline: 'none' };

  return (
    <div style={{ padding: '10px', color: theme.text, transition: 'all 0.3s ease' }}>
      
      {/* MODAL: Criar Procedimento */}
      {showNewModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.createCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            {/* COR FORÇADA AQUI */}
            <h2 style={{ marginBottom: '20px', color: theme.text }}>Novo Procedimento</h2>
            <form onSubmit={handleCreateProcedimento}>
              <input 
                placeholder="Nome..." required
                style={{ width: '100%', padding: '12px', marginBottom: '20px', backgroundColor: theme.pageBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px', outline: 'none' }}
                value={newProcName} onChange={e => setNewProcName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowNewModal(false)} style={{ ...btnStyle, backgroundColor: '#64748b', flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button type="submit" style={{ ...btnStyle, backgroundColor: '#2563eb', flex: 1, justifyContent: 'center' }}>Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Apagar Procedimento */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.createCard, backgroundColor: theme.cardBg, borderColor: theme.border, textAlign: 'center' }}>
            <AlertTriangle size={50} color="#ef4444" style={{ margin: '0 auto 15px auto' }} />
            {/* COR FORÇADA AQUI */}
            <h2 style={{ marginBottom: '10px', color: theme.text }}>Apagar Procedimento?</h2>
            {/* COR FORÇADA AQUI */}
            <p style={{ color: theme.subText, marginBottom: '25px', fontSize: '14px' }}>
              Tem a certeza que deseja remover <strong style={{ color: theme.text }}>"{selecionado?.nome}"</strong>? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ ...btnStyle, backgroundColor: '#64748b', flex: 1, justifyContent: 'center' }}>Cancelar</button>
              <button onClick={handleDeleteProcedimento} style={{ ...btnStyle, backgroundColor: '#ef4444', flex: 1, justifyContent: 'center' }}>Sim, Apagar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Notificações */}
      {notification.show && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, backgroundColor: theme.cardBg, padding: '20px', borderRadius: '10px', borderLeft: `5px solid ${notification.type === 'success' ? '#059669' : '#ef4444'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {/* COR FORÇADA AQUI */}
          <p style={{ margin: 0, color: theme.text, display: 'flex', alignItems: 'center' }}>
            {notification.message} 
            <button onClick={fecharNotificacao} style={{ background: 'none', border: 'none', color: theme.text, marginLeft: '15px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        {/* COR FORÇADA AQUI */}
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: theme.text }}><FileText color="#2563eb" /> Fichas Técnicas</h1>
        {isAdmin && <button onClick={() => setShowNewModal(true)} style={{ ...btnStyle, backgroundColor: '#2563eb' }}><Plus size={18}/> Novo Procedimento</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: theme.cardBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          {modelos.map(m => (
            <button key={m.id} onClick={() => carregarItens(m)} style={{ width: '100%', padding: '12px', marginBottom: '5px', textAlign: 'left', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: selecionado?.id === m.id ? '#2563eb' : 'transparent', color: selecionado?.id === m.id ? 'white' : theme.text }}>
              <div style={{ fontWeight: '600' }}>{m.nome}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{parseFloat(m.custo_total_estimado).toFixed(2)}€</div>
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: theme.cardBg, padding: '25px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          {selecionado ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                {/* COR FORÇADA AQUI */}
                <h2 style={{ margin: 0, color: theme.text }}>{selecionado.nome}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {isEditing ? (
                    <><button onClick={cancelarEdicao} style={{ ...btnStyle, backgroundColor: '#ef4444' }}>Cancelar</button>
                      <button onClick={salvarEdicao} style={{ ...btnStyle, backgroundColor: '#2563eb' }}>Salvar</button></>
                  ) : (
                    <>
                      {isAdmin && (
                        <>
                          <button onClick={iniciarEdicao} style={{ ...btnStyle, backgroundColor: '#f59e0b' }}><Edit size={18} /> Editar</button>
                          <button onClick={() => setShowDeleteConfirm(true)} style={{ ...btnStyle, backgroundColor: '#ef4444' }}><Trash2 size={18} /> Apagar</button>
                        </>
                      )}
                      <button onClick={gerarPDF} style={{ ...btnStyle, backgroundColor: '#059669' }}><Download size={18} /> PDF</button>
                    </>
                  )}
                </div>
              </div>

              <table style={{ width: '100%', color: theme.text, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: `2px solid ${theme.border}`, color: theme.subText }}>
                    <th style={{ padding: '12px' }}>Material</th><th style={{ padding: '12px' }}>Qtd</th><th style={{ padding: '12px' }}>P. Unit</th><th style={{ textAlign: 'right', padding: '12px' }}>Total</th>{isEditing && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {(isEditing ? editedProdutos : itens).map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      {/* COR FORÇADA NOS DADOS DA TABELA */}
                      <td style={{ padding: '12px', color: theme.text }}>
                        {isEditing ? <input style={tableInputStyle} value={item.nome_item} onChange={e => handleInputChange(index, 'nome_item', e.target.value)} /> : item.nome_item}
                      </td>
                      <td style={{ padding: '12px', color: theme.text }}>
                        {isEditing ? <input type="number" style={{ ...tableInputStyle, width: '80px' }} value={item.quantidade} onChange={e => handleInputChange(index, 'quantidade', e.target.value)} /> : item.quantidade}
                      </td>
                      <td style={{ padding: '12px', color: theme.text }}>
                        {isEditing ? <input type="number" style={{ ...tableInputStyle, width: '100px' }} value={item.preco_unitario} onChange={e => handleInputChange(index, 'preco_unitario', e.target.value)} /> : `${parseFloat(item.preco_unitario).toFixed(2)}€`}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px', fontWeight: 'bold', color: theme.text }}>{parseFloat(item.preco_total_item).toFixed(2)}€</td>
                      {isEditing && <td style={{ textAlign: 'center' }}><button onClick={() => removerMaterial(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>

              {isEditing && <button onClick={adicionarNovoMaterial} style={{ width: '100%', padding: '12px', marginTop: '15px', border: `1px dashed ${theme.border}`, color: '#2563eb', cursor: 'pointer', background: theme.pageBg, borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Adicionar Material</button>}
              
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: theme.pageBg, border: `1px solid ${theme.border}`, borderRadius: '10px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
                {/* COR FORÇADA AQUI */}
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: theme.subText, textTransform: 'uppercase' }}>Total Estimado</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: theme.text }}>{isEditing ? editedPrecoTotal.toFixed(2) : parseFloat(selecionado.custo_total_estimado).toFixed(2)}€</span>
              </div>
            </>
          ) : <p style={{ textAlign: 'center', color: theme.subText, padding: '50px' }}>Selecione um procedimento na lista à esquerda.</p>}
        </div>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  createCard: { padding: '30px', borderRadius: '15px', border: '1px solid', width: '400px' }
};

export default FichasTecnicas;