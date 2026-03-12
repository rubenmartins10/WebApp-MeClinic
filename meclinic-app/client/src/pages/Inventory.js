import React, { useState, useEffect, useContext } from 'react';
import { Search, Camera, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle, Package, X, Save, Clock } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';
import { LanguageContext } from '../LanguageContext'; 

const Inventario = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext);
  
  const [produtos, setProdutos] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas'); 
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [produtoToEdit, setProdutoToEdit] = useState(null);

  const initialForm = { nome: '', codigo_barras: '', stock_atual: '', stock_minimo: '', unidade_medida: 'un', categoria: 'Descartáveis', imagem_url: '', data_validade: '' };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { carregarProdutos(); }, []);

  const carregarProdutos = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/produtos');
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (err) {
      setProdutos([]);
    }
  };

  const showNotif = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };

  const confirmarEliminacao = async () => {
    if (!showDeleteConfirm) return;
    try {
      const res = await fetch(`http://localhost:5000/api/produtos/${showDeleteConfirm}`, { method: 'DELETE' });
      if (res.ok) {
        showNotif('success', t('inventory.msg.removed'));
        carregarProdutos();
      } else {
        showNotif('error', t('inventory.msg.remove_err'));
      }
    } catch (err) {
      showNotif('error', t('inventory.msg.server_err'));
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleEditClick = (p) => {
    setProdutoToEdit(p.id);
    setFormData({
      nome: p.nome || '',
      codigo_barras: p.codigo_barras || '',
      stock_atual: p.stock_atual || 0,
      stock_minimo: p.stock_minimo || 5,
      unidade_medida: p.unidade_medida || 'un',
      categoria: p.categoria || 'Descartáveis',
      imagem_url: p.imagem_url || '',
      data_validade: p.data_validade ? p.data_validade.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = produtoToEdit ? `http://localhost:5000/api/produtos/${produtoToEdit}` : 'http://localhost:5000/api/produtos';
      const method = produtoToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        showNotif('success', produtoToEdit ? t('inventory.msg.updated') : t('inventory.msg.added'));
        setShowModal(false);
        setProdutoToEdit(null);
        setFormData(initialForm);
        carregarProdutos();
      } else {
        showNotif('error', t('inventory.msg.save_err'));
      }
    } catch (err) {
      showNotif('error', t('inventory.msg.server_err'));
    }
  };

  const handleBarcodeLookup = (codigo) => {
    setFormData({ ...formData, codigo_barras: codigo });
    
    if (codigo.length >= 8 && !produtoToEdit) {
      const produtoConhecido = produtos.find(p => p.codigo_barras === codigo);
      if (produtoConhecido) {
        setFormData(prev => ({
          ...prev,
          nome: produtoConhecido.nome,
          categoria: produtoConhecido.categoria || 'Descartáveis',
          unidade_medida: produtoConhecido.unidade_medida || 'un',
          stock_minimo: produtoConhecido.stock_minimo,
          imagem_url: produtoConhecido.imagem_url || ''
        }));
        showNotif('success', 'Produto reconhecido! Dados preenchidos automaticamente.');
      }
    }
  };

  const produtosFiltrados = produtos.filter(p => {
    const matchPesquisa = p.nome.toLowerCase().includes(pesquisa.toLowerCase()) || (p.codigo_barras && p.codigo_barras.toLowerCase().includes(pesquisa.toLowerCase()));
    const matchCategoria = categoriaAtiva === 'Todas' || p.categoria === categoriaAtiva;
    return matchPesquisa && matchCategoria;
  });

  const calcularTotalUnidades = (nomeProduto, stockAtual, stockMinimo) => {
    const match = nomeProduto.match(/\((\d+)\s*([a-zA-Z]+)\)/);
    if (match) {
      const unidadesPorCaixa = parseInt(match[1], 10);
      const unidadeMedida = match[2];
      const totalReal = Math.round(unidadesPorCaixa * parseFloat(stockAtual));
      
      const isAlerta = parseFloat(stockAtual) <= parseFloat(stockMinimo);
      const cor = isAlerta ? '#ef4444' : '#10b981'; 
      
      return {
        texto: `${totalReal} ${unidadeMedida} ${t('inventory.card.total_calc')}`,
        cor: cor
      };
    }
    return null; 
  };

  const inputStyle = { 
    width: '100%', padding: '14px', borderRadius: '10px', 
    border: `1px solid ${theme.border}`, background: theme.pageBg, 
    color: theme.text, outline: 'none', boxSizing: 'border-box', fontSize: '14px', transition: 'border-color 0.2s' 
  };
  const labelStyle = { 
    display: 'block', fontSize: '12px', fontWeight: 'bold', color: theme.subText, 
    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' 
  };

  const categoryMap = {
    'Todas': t('inventory.cat.all'),
    'Descartáveis': t('inventory.cat.disposables'),
    'Anestesia': t('inventory.cat.anesthesia'),
    'Endo_Restauro': t('inventory.cat.endo'),
    'Cirurgia': t('inventory.cat.surgery'),
    'Ortodontia': t('inventory.cat.ortho'),
    'Esterilizacao': t('inventory.cat.sterilization'),
    'Equipamento': t('inventory.cat.instruments')
  };

  const CategoryBtn = ({ label, id }) => (
    <button 
      onClick={() => setCategoriaAtiva(id)}
      style={{
        flexShrink: 0, 
        padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
        backgroundColor: categoriaAtiva === id ? '#2563eb' : theme.cardBg,
        color: categoriaAtiva === id ? 'white' : theme.text,
        border: categoriaAtiva === id ? '1px solid #2563eb' : `1px solid ${theme.border}`,
        transition: 'all 0.2s', boxShadow: categoriaAtiva === id ? '0 4px 6px -1px rgba(37, 99, 235, 0.3)' : 'none'
      }}
    >
      {label}
    </button>
  );

  const activeLocale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-PT';

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      <style>
        {`
          .scroll-categorias::-webkit-scrollbar { height: 8px; }
          .scroll-categorias::-webkit-scrollbar-track { background: transparent; }
          .scroll-categorias::-webkit-scrollbar-thumb { background-color: ${theme.border}; border-radius: 10px; }
          .scroll-categorias::-webkit-scrollbar-thumb:hover { background-color: #64748b; }
          .form-input:focus { border-color: #2563eb !important; }
        `}
      </style>

      {notification.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '40px', borderRadius: '20px', border: `1px solid ${theme.border}`, textAlign: 'center', minWidth: '350px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease-out' }}>
            {notification.type === 'success' ? <CheckCircle size={60} color="#059669" style={{ marginBottom: '20px' }} /> : <XCircle size={60} color="#ef4444" style={{ marginBottom: '20px' }} />}
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold', color: theme.isDark ? '#ffffff' : theme.text }}>
              {notification.type === 'success' ? t('inventory.alert.success') : t('inventory.alert.warning')}
            </h2>
            <p style={{ margin: '0 0 30px 0', color: theme.subText, fontSize: '15px' }}>{notification.message}</p>
            <button onClick={() => setNotification({show: false})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: notification.type === 'success' ? '#059669' : '#ef4444', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t('inventory.alert.btn_ok')}
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '15px', width: '350px', textAlign: 'center', border: `1px solid ${theme.border}` }}>
            <AlertTriangle size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>{t('inventory.delete.title')}</h2>
            <p style={{ color: theme.subText, marginBottom: '25px' }}>{t('inventory.delete.desc')}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#64748b', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>{t('inventory.delete.cancel')}</button>
              <button onClick={confirmarEliminacao} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>{t('inventory.delete.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '20px' }}>
          <div style={{ backgroundColor: theme.cardBg, width: '100%', maxWidth: '550px', borderRadius: '20px', padding: '35px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Package size={26} color="#2563eb" /> {produtoToEdit ? t('inventory.modal.edit_title') : t('inventory.modal.add_title')}
              </h2>
              <button onClick={() => { setShowModal(false); setFormData(initialForm); setProdutoToEdit(null); }} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer', padding: '5px' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={{...labelStyle, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px'}}>
                   <Search size={14}/> {t('inventory.modal.barcode')}
                </label>
                <input 
                  className="form-input" type="text" placeholder={t('inventory.modal.barcode_ph')} style={{...inputStyle, borderColor: '#2563eb', borderWidth: '2px'}} 
                  value={formData.codigo_barras} 
                  onChange={e => handleBarcodeLookup(e.target.value)} 
                />
              </div>

              <div>
                <label style={labelStyle}>{t('inventory.modal.name')}</label>
                <input required className="form-input" type="text" placeholder={t('inventory.modal.name_ph')} style={inputStyle} value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>{t('inventory.modal.category')}</label>
                  <select className="form-input" style={inputStyle} value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                    <option value="Descartáveis">{t('inventory.cat.disposables')}</option>
                    <option value="Anestesia">{t('inventory.cat.anesthesia')}</option>
                    <option value="Endo_Restauro">{t('inventory.cat.endo')}</option>
                    <option value="Cirurgia">{t('inventory.cat.surgery')}</option>
                    <option value="Ortodontia">{t('inventory.cat.ortho')}</option>
                    <option value="Esterilizacao">{t('inventory.cat.sterilization')}</option>
                    <option value="Equipamento">{t('inventory.cat.instruments')}</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t('inventory.modal.unit')}</label>
                  <select className="form-input" style={inputStyle} value={formData.unidade_medida} onChange={e => setFormData({...formData, unidade_medida: e.target.value})}>
                    <option value="un">{t('inventory.modal.unit.un')}</option>
                    <option value="cx">{t('inventory.modal.unit.cx')}</option>
                    <option value="mts">{t('inventory.modal.unit.mts')}</option>
                    <option value="lts">{t('inventory.modal.unit.lts')}</option>
                    <option value="ml">{t('inventory.modal.unit.ml')}</option>
                    <option value="grs">{t('inventory.modal.unit.grs')}</option>
                  </select>
                </div>
              </div>

              <div style={{ backgroundColor: theme.isDark ? '#0f172a' : '#f1f5f9', padding: '20px', borderRadius: '15px', border: `1px solid ${theme.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{...labelStyle, color: theme.text}}>{t('inventory.modal.stock_current')}</label>
                  <input required className="form-input" type="number" step="any" style={{...inputStyle, backgroundColor: theme.cardBg}} value={formData.stock_atual} onChange={e => setFormData({...formData, stock_atual: e.target.value})} />
                </div>
                <div>
                  <label style={{...labelStyle, color: '#ef4444'}}>{t('inventory.modal.stock_min')}</label>
                  <input required className="form-input" type="number" step="any" style={{...inputStyle, backgroundColor: theme.cardBg, borderColor: theme.isDark ? '#7f1d1d' : '#fca5a5'}} value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: e.target.value})} />
                </div>
                <div>
                  <label style={{...labelStyle, color: '#f59e0b'}}>{t('inventory.modal.expiry')}</label>
                  <input className="form-input" type="date" style={{...inputStyle, backgroundColor: theme.cardBg}} value={formData.data_validade} onChange={e => setFormData({...formData, data_validade: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>{t('inventory.modal.img_url')}</label>
                <input className="form-input" type="text" placeholder={t('inventory.modal.img_url_ph')} style={inputStyle} value={formData.imagem_url} onChange={e => setFormData({...formData, imagem_url: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => { setShowModal(false); setFormData(initialForm); setProdutoToEdit(null); }} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#64748b', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{t('inventory.modal.cancel')}</button>
                <button type="submit" style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}>
                  <Save size={20} /> {t('inventory.modal.save')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>
            {t('inventory.title')}
          </h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>{t('inventory.subtitle')}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button style={{ backgroundColor: '#059669', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}>
            <Camera size={20} /> {t('inventory.btn.camera')}
          </button>
          <button onClick={() => { setProdutoToEdit(null); setFormData(initialForm); setShowModal(true); }} style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}>
            <Plus size={20} /> {t('inventory.btn.add')}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '30px', width: '100%' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', marginBottom: '20px' }}>
          <Search size={20} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '14px' }} />
          <input 
            type="text" 
            placeholder={t('inventory.search.placeholder')} 
            style={{ width: '100%', padding: '14px 15px 14px 45px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, outline: 'none', fontSize: '15px', boxSizing: 'border-box' }}
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
        </div>

        <div className="scroll-categorias" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', width: '100%' }}>
          <CategoryBtn label={t('inventory.cat.all')} id="Todas" />
          <CategoryBtn label={t('inventory.cat.disposables')} id="Descartáveis" />
          <CategoryBtn label={t('inventory.cat.anesthesia')} id="Anestesia" />
          <CategoryBtn label={t('inventory.cat.endo')} id="Endo_Restauro" />
          <CategoryBtn label={t('inventory.cat.surgery')} id="Cirurgia" />
          <CategoryBtn label={t('inventory.cat.ortho')} id="Ortodontia" />
          <CategoryBtn label={t('inventory.cat.sterilization')} id="Esterilizacao" />
          <CategoryBtn label={t('inventory.cat.instruments')} id="Equipamento" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
        {produtosFiltrados.map(p => {
          const totalCalc = calcularTotalUnidades(p.nome, p.stock_atual, p.stock_minimo);
          
          // =========================================================================
          // MAGIA: ARREDONDAMENTO INTELIGENTE DE CAIXAS PARA O ECRÃ
          // =========================================================================
          const stockFloat = parseFloat(p.stock_atual);
          let stockVisual;
          if (p.unidade_medida === 'cx' || p.nome.match(/\((\d+)\s*[a-zA-Z]+\)/)) {
            stockVisual = Math.ceil(stockFloat); // 2.98 vira 3.
          } else {
            stockVisual = stockFloat % 1 === 0 ? stockFloat : stockFloat.toFixed(2);
          }
          
          const categoriaTraduzida = categoryMap[p.categoria] || categoryMap['Descartáveis'];
          
          let isExpiring = false;
          let validadeText = '';
          if (p.data_validade) {
            const expDate = new Date(p.data_validade);
            const today = new Date();
            const diffTime = expDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 30) isExpiring = true;
            validadeText = expDate.toLocaleDateString(activeLocale, { month: 'short', year: 'numeric' });
          }

          return (
           <div key={p.id} style={{ backgroundColor: theme.cardBg, borderRadius: '20px', border: `1px solid ${isExpiring ? '#ef4444' : theme.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', boxShadow: isExpiring ? '0 4px 15px rgba(239, 68, 68, 0.15)' : '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              
              <div style={{ height: '200px', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, position: 'relative' }}>
                
                <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
                  {categoriaTraduzida}
                </div>

                {p.data_validade && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: isExpiring ? '#ef4444' : '#f59e0b', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                    <Clock size={12} /> VAL: {validadeText}
                  </div>
                )}

                {p.imagem_url ? (
                  <img src={p.imagem_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
                ) : (
                  <Package size={60} color="#e2e8f0" />
                )}
              </div>
              
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: theme.isDark ? '#ffffff' : theme.text, fontWeight: 'bold', lineHeight: '1.4' }}>{p.nome}</h3>
                <p style={{ margin: '0 0 20px 0', color: theme.subText, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {p.codigo_barras || t('inventory.card.no_code')}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: theme.subText, fontWeight: 'bold', marginBottom: '4px' }}>{t('inventory.card.current_qty')}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
                      
                      <span style={{ fontSize: '24px', fontWeight: '900', color: theme.isDark ? '#ffffff' : theme.text }}>
                        {stockVisual}
                      </span>
                      <span style={{ fontSize: '14px', color: theme.subText, fontWeight: 'bold' }}>
                        {p.unidade_medida}
                      </span>
                      
                      {totalCalc && (
                        <span style={{ fontSize: '12px', color: totalCalc.cor, marginLeft: '4px', fontWeight: 'bold' }}>
                          ({totalCalc.texto})
                        </span>
                      )}
                      
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditClick(p)} style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none', backgroundColor: theme.isDark ? '#1e3a8a' : '#dbeafe', color: '#2563eb', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(p.id)} style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none', backgroundColor: theme.isDark ? '#450a0a' : '#fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

           </div>
          );
        })}

        {produtosFiltrados.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: theme.subText }}>
            <Package size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p>{t('inventory.empty')}</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Inventario;