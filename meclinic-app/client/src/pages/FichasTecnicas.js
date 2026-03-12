import React, { useState, useEffect, useContext } from 'react';
import { FileText, ClipboardList, Download, Edit, Save, X, CheckCircle, XCircle, Plus, Trash2, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ThemeContext } from '../ThemeContext';
import { LanguageContext } from '../LanguageContext';

const FichasTecnicas = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);

  const [modelos, setModelos] = useState([]);
  const [produtosInventario, setProdutosInventario] = useState([]); 
  const [selecionado, setSelecionado] = useState(null);
  const [itens, setItens] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProdutos, setEditedProdutos] = useState([]);
  const [editedPrecoTotal, setEditedPrecoTotal] = useState(0);
  const [editedPrecoServico, setEditedPrecoServico] = useState(0); 
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProcName, setNewProcName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const user = JSON.parse(localStorage.getItem('meclinic_user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  const carregarDados = () => {
    fetch('/api/modelos-procedimento')
      .then(res => res.json())
      .then(data => setModelos(data));
      
    fetch('/api/produtos')
      .then(res => res.json())
      .then(data => setProdutosInventario(data));
  };

  useEffect(() => carregarDados(), []);

  const carregarItens = (modelo) => {
    setSelecionado(modelo);
    setIsEditing(false); 
    fetch(`/api/modelos-procedimento/${modelo.id}/itens`).then(res => res.json()).then(data => setItens(data));
  };

  const mostrarNotificacao = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };
  const fecharNotificacao = () => setNotification({ show: false, type: '', message: '' });

  const handleCreateProcedimento = async (e) => {
    e.preventDefault();
    if (!newProcName.trim()) return;
    try {
      const response = await fetch('/api/modelos-procedimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newProcName })
      });
      if (response.ok) {
        const novo = await response.json();
        setShowNewModal(false); setNewProcName('');
        carregarDados(); carregarItens(novo);
        mostrarNotificacao('success', t('tech_sheets.msg.created'));
      }
    } catch (err) { mostrarNotificacao('error', t('inventory.msg.server_err')); }
  };

  const handleDeleteProcedimento = async () => {
    try {
      const response = await fetch(`/api/modelos-procedimento/${selecionado.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setShowDeleteConfirm(false); 
        setSelecionado(null);        
        carregarDados();           
        mostrarNotificacao('success', t('tech_sheets.msg.removed'));
      } else {
        mostrarNotificacao('error', t('tech_sheets.msg.remove_err'));
      }
    } catch (error) {
      mostrarNotificacao('error', t('inventory.msg.server_err'));
    }
  };

  const iniciarEdicao = () => {
    setEditedProdutos(JSON.parse(JSON.stringify(itens)));
    setEditedPrecoTotal(parseFloat(selecionado.custo_total_estimado) || 0);
    setEditedPrecoServico(parseFloat(selecionado.preco_servico) || 0);
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
    if (editedProdutos.some(p => !p.nome_item)) {
      mostrarNotificacao('error', 'Selecione o nome para todos os materiais.');
      return;
    }

    try {
      const response = await fetch(`/api/modelos-procedimento/${selecionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: editedProdutos, custo_total: editedPrecoTotal, preco_servico: editedPrecoServico })
      });
      if (response.ok) {
        carregarItens({...selecionado, custo_total_estimado: editedPrecoTotal, preco_servico: editedPrecoServico}); 
        carregarDados();
        mostrarNotificacao('success', t('tech_sheets.msg.saved'));
        setIsEditing(false);
      }
    } catch (err) { mostrarNotificacao('error', t('tech_sheets.msg.save_err')); }
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${t('tech_sheets.title')}: ${selecionado.nome}`, 14, 20);
    autoTable(doc, { head: [[t('tech_sheets.table.material'), t('tech_sheets.table.qty'), t('tech_sheets.table.subtotal')]], body: itens.map(i => [i.nome_item, i.quantidade, `${parseFloat(i.preco_total_item).toFixed(2)}€`]), startY: 30 });
    doc.save(`Ficha_${selecionado.nome}.pdf`);
  };

  const btnStyle = { color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };
  const tableInputStyle = { width: '100%', background: theme.pageBg, color: theme.text, border: `1px solid ${theme.border}`, padding: '8px', borderRadius: '6px', outline: 'none' };

  const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' },
    createCard: { padding: '30px', borderRadius: '15px', border: '1px solid', width: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }
  };

  const getDisplayUnit = (nomeItem) => {
    if (!nomeItem) return '';
    const match = nomeItem.match(/\(\d+\s*([a-zA-Z]+)\)/);
    if (match) {
      return match[1]; 
    }
    const prod = produtosInventario.find(p => p.nome === nomeItem);
    return prod ? prod.unidade_medida : '';
  };

  return (
    <div style={{ padding: '10px', color: theme.text, transition: 'all 0.3s ease' }}>
      
      {showNewModal && isAdmin && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.createCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h2 style={{ marginBottom: '20px', color: theme.isDark ? '#ffffff' : theme.text }}>{t('tech_sheets.modal.new_title')}</h2>
            <form onSubmit={handleCreateProcedimento}>
              <input 
                placeholder={t('tech_sheets.modal.new_ph')} required
                style={{ width: '100%', padding: '12px', marginBottom: '20px', backgroundColor: theme.pageBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px', outline: 'none' }}
                value={newProcName} onChange={e => setNewProcName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowNewModal(false)} style={{ ...btnStyle, backgroundColor: '#64748b', flex: 1, justifyContent: 'center' }}>{t('tech_sheets.modal.cancel')}</button>
                <button type="submit" style={{ ...btnStyle, backgroundColor: '#2563eb', flex: 1, justifyContent: 'center' }}>{t('tech_sheets.modal.create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && isAdmin && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.createCard, backgroundColor: theme.cardBg, borderColor: theme.border, textAlign: 'center' }}>
            <AlertTriangle size={50} color="#ef4444" style={{ margin: '0 auto 15px auto' }} />
            <h2 style={{ marginBottom: '10px', color: theme.isDark ? '#ffffff' : theme.text }}>{t('tech_sheets.delete.title')}</h2>
            <p style={{ color: theme.subText, marginBottom: '25px', fontSize: '14px' }}>
              {t('tech_sheets.delete.desc_part1')} <strong style={{ color: theme.text }}>"{selecionado?.nome}"</strong>? {t('tech_sheets.delete.desc_part2')}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ ...btnStyle, backgroundColor: '#64748b', flex: 1, justifyContent: 'center' }}>{t('tech_sheets.delete.cancel')}</button>
              <button onClick={handleDeleteProcedimento} style={{ ...btnStyle, backgroundColor: '#ef4444', flex: 1, justifyContent: 'center' }}>{t('tech_sheets.delete.remove')}</button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, backgroundColor: theme.cardBg, padding: '20px', borderRadius: '10px', borderLeft: `5px solid ${notification.type === 'success' ? '#059669' : '#ef4444'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          {notification.type === 'success' ? <CheckCircle color="#059669" size={24} /> : <XCircle color="#ef4444" size={24} />}
          <p style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontWeight: 'bold' }}>{notification.message}</p>
          <button onClick={fecharNotificacao} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer' }}><X size={18} /></button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '30px', fontWeight: '800' }}>
          <FileText color="#2563eb" size={32} /> {t('tech_sheets.title')}
        </h1>
        {isAdmin && (
          <button onClick={() => setShowNewModal(true)} style={{ ...btnStyle, backgroundColor: '#2563eb' }}>
            <Plus size={18}/> {t('tech_sheets.btn.new')}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        
        <div style={{ backgroundColor: theme.cardBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          {modelos.map(m => (
            <button key={m.id} onClick={() => carregarItens(m)} style={{ width: '100%', padding: '12px', marginBottom: '5px', textAlign: 'left', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: selecionado?.id === m.id ? '#2563eb' : 'transparent', color: selecionado?.id === m.id ? 'white' : theme.text, transition: 'all 0.2s' }}>
              <div style={{ fontWeight: '600' }}>{m.nome}</div>
              <div style={{ fontSize: '11px', opacity: selecionado?.id === m.id ? 1 : 0.6, marginTop: '4px' }}>{t('tech_sheets.list.price')} {parseFloat(m.preco_servico || 0).toFixed(2)}€</div>
            </button>
          ))}
          {modelos.length === 0 && (
            <p style={{ textAlign: 'center', color: theme.subText, fontSize: '13px', marginTop: '20px' }}>{t('tech_sheets.list.empty')}</p>
          )}
        </div>

        <div style={{ backgroundColor: theme.cardBg, padding: '25px', borderRadius: '12px', border: `1px solid ${isEditing ? '#f59e0b' : theme.border}`, transition: 'all 0.3s' }}>
          {selecionado ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isEditing && <Edit color="#f59e0b" size={24} />} {selecionado.nome}
                </h2>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {isEditing ? (
                    <>
                      <button onClick={cancelarEdicao} style={{ ...btnStyle, backgroundColor: '#ef4444' }}>{t('tech_sheets.detail.cancel')}</button>
                      <button onClick={salvarEdicao} style={{ ...btnStyle, backgroundColor: '#059669' }}><Save size={18} /> {t('tech_sheets.detail.save')}</button>
                    </>
                  ) : (
                    <>
                      {isAdmin && (
                        <>
                          <button onClick={iniciarEdicao} style={{ ...btnStyle, backgroundColor: '#f59e0b' }}><Edit size={18} /> {t('tech_sheets.detail.edit')}</button>
                          <button onClick={() => setShowDeleteConfirm(true)} style={{ ...btnStyle, backgroundColor: '#ef4444' }}><Trash2 size={18} /> {t('tech_sheets.detail.remove')}</button>
                        </>
                      )}
                      <button onClick={gerarPDF} style={{ ...btnStyle, backgroundColor: '#2563eb' }}><Download size={18} /> {t('tech_sheets.detail.export')}</button>
                    </>
                  )}
                </div>
              </div>

              {/* LISTA INVISÍVEL PARA PESQUISA (DATALIST) */}
              {isEditing && (
                <datalist id="lista-produtos-inventario">
                  {produtosInventario.map(prod => (
                    <option key={prod.id} value={prod.nome} />
                  ))}
                </datalist>
              )}

              <table style={{ width: '100%', color: theme.text, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: `2px solid ${theme.border}`, color: theme.subText }}>
                    <th style={{ padding: '12px' }}>{t('tech_sheets.table.material')}</th>
                    <th style={{ padding: '12px' }}>{t('tech_sheets.table.qty')}</th>
                    <th style={{ padding: '12px' }}>{t('tech_sheets.table.cost_un')}</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>{t('tech_sheets.table.subtotal')}</th>
                    {isEditing && <th style={{ width: '40px' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {(isEditing ? editedProdutos : itens).map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '12px', color: theme.text }}>
                        {isEditing ? (
                          // NOVA CAIXA COM PESQUISA INCORPORADA
                          <input 
                            list="lista-produtos-inventario"
                            style={tableInputStyle} 
                            placeholder={t('tech_sheets.table.ph_material')}
                            value={item.nome_item} 
                            onChange={e => handleInputChange(index, 'nome_item', e.target.value)}
                          />
                        ) : (
                          item.nome_item
                        )}
                      </td>
                      <td style={{ padding: '12px', color: theme.text }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isEditing ? (
                            <input type="number" step="any" style={{ ...tableInputStyle, width: '80px' }} value={item.quantidade} onChange={e => handleInputChange(index, 'quantidade', e.target.value)} />
                          ) : (
                            <span>{item.quantidade}</span>
                          )}
                          <span style={{ fontSize: '12px', color: theme.subText, fontWeight: 'bold' }}>
                            {getDisplayUnit(item.nome_item)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: theme.text }}>
                        {isEditing ? <input type="number" step="0.01" style={{ ...tableInputStyle, width: '100px' }} value={item.preco_unitario} onChange={e => handleInputChange(index, 'preco_unitario', e.target.value)} /> : `${parseFloat(item.preco_unitario).toFixed(2)}€`}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px', fontWeight: 'bold', color: theme.text }}>
                        {parseFloat(item.preco_total_item).toFixed(2)}€
                      </td>
                      {isEditing && (
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => removerMaterial(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }} title={t('tech_sheets.detail.remove')}>
                            <Trash2 size={18}/>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {isEditing && (
                <button onClick={adicionarNovoMaterial} style={{ width: '100%', padding: '15px', marginTop: '15px', border: `1px dashed ${theme.border}`, color: '#f59e0b', cursor: 'pointer', background: theme.pageBg, borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} /> {t('tech_sheets.btn.add_material')}
                </button>
              )}
              
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: theme.pageBg, border: `1px solid ${theme.border}`, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: theme.subText, textTransform: 'uppercase' }}>{t('tech_sheets.summary.cost')}</span>
                  <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', color: theme.text }}>
                    {isEditing ? editedPrecoTotal.toFixed(2) : parseFloat(selecionado.custo_total_estimado || 0).toFixed(2)}€
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#10b981', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                    {t('tech_sheets.summary.price')}
                  </span>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', justifyContent: 'flex-end' }}>
                      <input type="number" step="0.01" style={{ ...tableInputStyle, width: '120px', borderColor: '#10b981', borderWidth: '2px', fontSize: '20px', fontWeight: 'bold', textAlign: 'right' }} value={editedPrecoServico} onChange={e => setEditedPrecoServico(e.target.value)} />
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>€</span>
                    </div>
                  ) : (
                    <span style={{ display: 'block', fontSize: '26px', fontWeight: '900', color: '#10b981' }}>
                      {parseFloat(selecionado.preco_servico || 0).toFixed(2)}€
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: theme.subText, padding: '80px 20px' }}>
              <ClipboardList size={60} style={{ opacity: 0.3, margin: '0 auto 15px auto' }} />
              <h3 style={{ margin: '0 0 10px 0', color: theme.text }}>{t('tech_sheets.empty_state.title')}</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>{t('tech_sheets.empty_state.desc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FichasTecnicas;