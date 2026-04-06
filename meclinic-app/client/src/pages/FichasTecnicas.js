import React, { useState, useEffect, useContext } from 'react';
import { FileText, ClipboardList, Download, Edit, Save, X, CheckCircle, XCircle, Plus, Trash2, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ThemeContext } from '../contexts/ThemeContext';
import { LanguageContext } from '../contexts/LanguageContext';
import apiService from '../services/api';
import logo from '../assets/logo.png';
import { flattenToWhite } from '../utils/signatureUtils';

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

  const user = (() => { try { return JSON.parse(localStorage.getItem('meclinic_user') || '{}'); } catch { return {}; } })();
  const isAdmin = user.role === 'ADMIN';

  const [assinaturaPreferida, setAssinaturaPreferida] = useState({ img: null, nome: '' });

  const carregarDados = () => {
    apiService.get('/api/modelos-procedimento')
      .then(data => setModelos(Array.isArray(data) ? data : (data.modelos || [])))
      .catch(() => setModelos([]));

    apiService.get('/api/produtos')
      .then(data => setProdutosInventario(Array.isArray(data) ? data : (data.produtos || [])))
      .catch(() => setProdutosInventario([]));
  };

  useEffect(() => carregarDados(), []);

  useEffect(() => {
    if (!user.id) return;
    const token = localStorage.getItem('meclinic_token');
    fetch(`/api/utilizadores/${user.id}/assinatura`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(async data => {
        const raw = data.assinatura;
        if (!raw) return;
        let sig = null, nome = '';
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.signatures) && parsed.signatures.length > 0) {
            sig = parsed.signatures[0].signature; nome = parsed.signatures[0].nome || '';
          } else if (parsed.signature) {
            sig = parsed.signature; nome = parsed.nome || '';
          }
        } catch {
          if (typeof raw === 'string' && raw.startsWith('data:')) sig = raw;
        }
        if (sig) setAssinaturaPreferida({ img: await flattenToWhite(sig), nome });
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const carregarItens = (modelo) => {
    setSelecionado(modelo);
    setIsEditing(false);
    apiService.get(`/api/modelos-procedimento/${modelo.id}/itens`)
      .then(data => setItens(Array.isArray(data) ? data : (data.itens || [])))
      .catch(() => setItens([]));
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
      const novo = await apiService.post('/api/modelos-procedimento', { nome: newProcName });
      setShowNewModal(false); setNewProcName('');
      carregarDados(); carregarItens(novo);
      mostrarNotificacao('success', t('tech_sheets.msg.created'));
    } catch (err) { mostrarNotificacao('error', t('inventory.msg.server_err')); }
  };

  const handleDeleteProcedimento = async () => {
    try {
      await apiService.delete(`/api/modelos-procedimento/${selecionado.id}`);
      setShowDeleteConfirm(false); 
      setSelecionado(null);        
      carregarDados();           
      mostrarNotificacao('success', t('tech_sheets.msg.removed'));
    } catch (error) {
      mostrarNotificacao('error', t('tech_sheets.msg.remove_err'));
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
    // When name changes, resolve produto_id from inventory for reliable stock deduction
    if (field === 'nome_item') {
      const match = produtosInventario.find(p => p.nome === value);
      novos[index].produto_id = match ? match.id : null;
      if (match && !novos[index].preco_unitario) {
        novos[index].preco_unitario = parseFloat(match.preco_unitario || match.preco || 0);
      }
    }
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
      await apiService.put(`/api/modelos-procedimento/${selecionado.id}`, { itens: editedProdutos, custo_total: editedPrecoTotal, preco_servico: editedPrecoServico });
      carregarItens({...selecionado, custo_total_estimado: editedPrecoTotal, preco_servico: editedPrecoServico}); 
      carregarDados();
      mostrarNotificacao('success', t('tech_sheets.msg.saved'));
      setIsEditing(false);
    } catch (err) { mostrarNotificacao('error', t('tech_sheets.msg.save_err')); }
  };

  const gerarPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297, mg = 12;

    const C = {
      teal:      [37,  99, 235],
      tealDark:  [29,  78, 216],
      tealBg:    [219, 234, 254],
      white:     [255, 255, 255],
      dark:      [25,  25,  25],
      gray:      [110, 110, 110],
      lightGray: [247, 247, 247],
      midGray:   [210, 210, 210],
      headerBg:  [45,   55,  72],
    };

    const euro = (v) => parseFloat(v || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ac';

    const clinicSettings = (() => { try { return JSON.parse(localStorage.getItem('meclinic_settings') || '{}'); } catch { return {}; } })();
    const clinicNome     = clinicSettings.nome     || 'MeClinic';
    const clinicMorada   = (clinicSettings.morada  || 'Rua Principal, 123  |  Lisboa, Portugal').replace(/\n/g, '  |  ');
    const clinicEmail    = clinicSettings.email    || 'geral@meclinic.pt';
    const clinicTelefone = clinicSettings.telefone || '+351 XXX XXX XXX';

    const img = new Image(); img.src = logo;

    // \u2500\u2500 TOP BANNER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    doc.setFillColor(...C.tealDark); doc.rect(0, 0, W, 2, 'F');
    doc.setFillColor(...C.teal);     doc.rect(0, 2, W, 26, 'F');

    try { doc.addImage(img, 'PNG', mg, 7, 32, 11); }
    catch {
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.white); doc.text(clinicNome, mg, 16);
    }

    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
    doc.text('FICHA T\u00c9CNICA', W - mg, 13, { align: 'right' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(clinicMorada, W - mg, 19, { align: 'right' });
    doc.text(`${clinicEmail}  |  ${clinicTelefone}`, W - mg, 25, { align: 'right' });

    // \u2500\u2500 INFO BAR \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const nib = 28;
    doc.setFillColor(...C.tealBg); doc.rect(0, nib, W, 14, 'F');
    doc.setFillColor(...C.teal);   doc.rect(0, nib + 14, W, 0.4, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(`${t('tech_sheets.title')}: ${selecionado.nome}`, mg, nib + 6);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-PT', { dateStyle: 'full' })}`, mg, nib + 11.5);

    // \u2500\u2500 SUMMARY BOXES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    let ny = nib + 22;
    const bW = W - 2 * mg;
    const halfW = (bW - 4) / 2;
    const rowH = 22;

    const fieldBox = (label, value, x, y, w, accent) => {
      doc.setDrawColor(...C.midGray); doc.setLineWidth(0.25);
      doc.setFillColor(...C.lightGray); doc.rect(x, y, w, rowH, 'FD');
      doc.setFillColor(...(accent || C.teal)); doc.rect(x, y, 2.5, rowH, 'F');
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.gray);
      doc.text(label.toUpperCase(), x + 6, y + 6.5);
      doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      doc.text(String(value), x + 6, y + 15);
    };

    fieldBox('Custo Total Estimado', euro(selecionado.custo_total_estimado), mg, ny, halfW, C.headerBg);
    fieldBox('Pre\u00e7o do Servi\u00e7o', euro(selecionado.preco_servico), mg + halfW + 4, ny, halfW, C.teal);
    ny += rowH + 10;

    // \u2500\u2500 MATERIALS TABLE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const itensArray = Array.isArray(itens) ? itens : [];
    autoTable(doc, {
      startY: ny,
      head: [[t('tech_sheets.table.material'), t('tech_sheets.table.qty'), t('tech_sheets.table.subtotal')]],
      body: itensArray.map(i => [i.nome_item, i.quantidade, euro(i.preco_total_item)]),
      headStyles: { fillColor: C.teal, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: C.lightGray },
      styles: { fontSize: 9, cellPadding: 5, textColor: C.dark },
      columnStyles: { 2: { halign: 'right' } },
      margin: { left: mg, right: mg },
      theme: 'grid',
    });

    ny = doc.lastAutoTable.finalY + 10;

    // \u2500\u2500 MARGEM BOX \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const totalH = 28;
    doc.setFillColor(...C.tealDark); doc.rect(mg, ny, bW, 2, 'F');
    doc.setFillColor(...C.teal);     doc.rect(mg, ny + 2, bW, totalH - 2, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(230, 248, 248);
    doc.text('PRE\u00c7O DO SERVI\u00c7O', W / 2, ny + 10, { align: 'center' });
    doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
    doc.text(euro(selecionado.preco_servico), W / 2, ny + 23, { align: 'center' });
    ny += totalH + 10;

    // \u2500\u2500 SIGNATURE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    if (assinaturaPreferida.img) {
      const sigY = ny;
      doc.addImage(assinaturaPreferida.img, W / 2 - 30, sigY, 60, 15);
      const lineY = sigY + 12;
      doc.setDrawColor(...C.midGray); doc.setLineWidth(0.3); doc.line(W / 2 - 30, lineY, W / 2 + 30, lineY);
      if (assinaturaPreferida.nome) {
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
        doc.text(assinaturaPreferida.nome, W / 2, lineY + 5, { align: 'center' });
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
        doc.text('Assinatura do Respons\u00e1vel', W / 2, lineY + 10, { align: 'center' });
      } else {
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
        doc.text('Assinatura do Respons\u00e1vel', W / 2, lineY + 5, { align: 'center' });
      }
      ny = lineY + 18;
    }

    // \u2500\u2500 FOOTER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const nFy = H - 16;
    doc.setDrawColor(...C.teal); doc.setLineWidth(0.4);
    doc.line(mg, nFy, W - mg, nFy);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(`${clinicNome} \u2014 Ficha T\u00e9cnica`, W / 2, nFy + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text('Documento confidencial destinado apenas a uso interno.', W / 2, nFy + 10, { align: 'center' });
    doc.setFillColor(...C.teal); doc.rect(0, H - 3.5, W, 3.5, 'F');

    doc.save(`Ficha_${selecionado.nome.replace(/\s+/g, '_')}.pdf`);
  };

  const btnStyle = { color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s' };
  const tableInputStyle = { width: '100%', background: theme.pageBg, color: theme.text, border: `1px solid ${theme.border}`, padding: '8px 10px', borderRadius: '6px', outline: 'none', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: '13px' };
  const fontBase = { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' };

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
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1400px', margin: '0 auto', transition: 'all 0.3s ease', ...fontBase }}>
      
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>
            {t('tech_sheets.title')}
          </h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>{t('tech_sheets.subtitle')}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowNewModal(true)} style={{ ...btnStyle, backgroundColor: '#2563eb' }}>
            <Plus size={18}/> {t('tech_sheets.btn.new')}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        
        <div style={{ backgroundColor: theme.cardBg, padding: '10px', borderRadius: '14px', border: `1px solid ${theme.border}`, alignSelf: 'start' }}>
          {modelos.map(m => (
            <button key={m.id} onClick={() => carregarItens(m)} style={{ width: '100%', padding: '14px 16px', marginBottom: '4px', textAlign: 'left', border: 'none', borderRadius: '10px', cursor: 'pointer', backgroundColor: selecionado?.id === m.id ? '#2563eb' : 'transparent', color: selecionado?.id === m.id ? 'white' : theme.text, transition: 'all 0.2s', ...fontBase }}>
              <div style={{ fontWeight: '600', fontSize: '14px', letterSpacing: '-0.01em' }}>{m.nome}</div>
              <div style={{ fontSize: '12px', opacity: selecionado?.id === m.id ? 0.85 : 0.5, marginTop: '4px', fontWeight: '500' }}>{t('tech_sheets.list.price')} {parseFloat(m.preco_servico || 0).toFixed(2)}€</div>
            </button>
          ))}
          {modelos.length === 0 && (
            <p style={{ textAlign: 'center', color: theme.subText, fontSize: '13px', marginTop: '20px', ...fontBase }}>{t('tech_sheets.list.empty')}</p>
          )}
        </div>

        <div style={{ backgroundColor: theme.cardBg, padding: '28px', borderRadius: '14px', border: `1px solid ${isEditing ? '#f59e0b' : theme.border}`, transition: 'all 0.3s' }}>
          {selecionado ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px', ...fontBase }}>
                  {isEditing && <Edit color="#f59e0b" size={22} />} {selecionado.nome}
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

              <table style={{ width: '100%', color: theme.text, borderCollapse: 'collapse', ...fontBase }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: `2px solid ${theme.border}` }}>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.subText }}>{t('tech_sheets.table.material')}</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.subText }}>{t('tech_sheets.table.qty')}</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.subText }}>{t('tech_sheets.table.cost_un')}</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.subText }}>{t('tech_sheets.table.subtotal')}</th>
                    {isEditing && <th style={{ width: '40px' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {(isEditing ? editedProdutos : itens).map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background 0.15s' }}>
                      <td style={{ padding: '13px 14px', color: theme.text, fontSize: '14px', fontWeight: '500' }}>
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
                      <td style={{ padding: '13px 14px', color: theme.text, fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isEditing ? (
                            <input type="number" step="any" style={{ ...tableInputStyle, width: '80px' }} value={item.quantidade} onChange={e => handleInputChange(index, 'quantidade', e.target.value)} />
                          ) : (
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{item.quantidade}</span>
                          )}
                          <span style={{ fontSize: '11px', color: theme.subText, fontWeight: '600', textTransform: 'lowercase' }}>
                            {getDisplayUnit(item.nome_item)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 14px', color: theme.subText, fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>
                        {isEditing ? <input type="number" step="0.01" style={{ ...tableInputStyle, width: '100px' }} value={item.preco_unitario} onChange={e => handleInputChange(index, 'preco_unitario', e.target.value)} /> : `${parseFloat(item.preco_unitario).toFixed(2)}€`}
                      </td>
                      <td style={{ textAlign: 'right', padding: '13px 14px', fontWeight: '700', color: theme.text, fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>
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
              
              <div style={{ marginTop: '24px', padding: '22px 24px', backgroundColor: theme.pageBg, border: `1px solid ${theme.border}`, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: '600', fontSize: '11px', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.06em', ...fontBase }}>{t('tech_sheets.summary.cost')}</span>
                  <span style={{ display: 'block', fontSize: '22px', fontWeight: '700', color: theme.text, marginTop: '4px', fontVariantNumeric: 'tabular-nums', ...fontBase }}>
                    {isEditing ? editedPrecoTotal.toFixed(2) : parseFloat(selecionado.custo_total_estimado || 0).toFixed(2)}€
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: '600', fontSize: '11px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', ...fontBase }}>
                    {t('tech_sheets.summary.price')}
                  </span>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', justifyContent: 'flex-end' }}>
                      <input type="number" step="0.01" style={{ ...tableInputStyle, width: '120px', borderColor: '#10b981', borderWidth: '2px', fontSize: '20px', fontWeight: 'bold', textAlign: 'right' }} value={editedPrecoServico} onChange={e => setEditedPrecoServico(e.target.value)} />
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>€</span>
                    </div>
                  ) : (
                    <span style={{ display: 'block', fontSize: '28px', fontWeight: '800', color: '#10b981', fontVariantNumeric: 'tabular-nums', marginTop: '4px', ...fontBase }}>
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