import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle, Package, X, Save, Clock, ScanLine, Loader } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { LanguageContext } from '../contexts/LanguageContext';
import BarcodeScanner from '../components/common/BarcodeScanner'; // Scanner otimizado
import { getActiveLocale } from '../utils/locale';
import apiService from '../services/api';

const Inventory = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext);
  
  const [produtos, setProdutos] = useState([]);
  const [paginacao, setPaginacao] = useState({ page: 1, pages: 1, total: 0 });
  const [pesquisa, setPesquisa] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas'); 
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [produtoToEdit, setProdutoToEdit] = useState(null);

  // ESTADO DA NOSSA CÂMARA
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const lookupTimerRef = useRef(null);

  const initialForm = { nome: '', codigo_barras: '', stock_atual: '', stock_minimo: '', unidade_medida: 'un', categoria: 'Descartáveis', imagem_url: '', data_validade: '' };
  const [formData, setFormData] = useState(initialForm);

  const carregarProdutos = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (pesquisa) params.append('search', pesquisa);
      if (categoriaAtiva !== 'Todas') params.append('categoria', categoriaAtiva);
      const data = await apiService.get(`/api/produtos?${params}`);
      setProdutos(Array.isArray(data) ? data : (data.produtos || []));
      if (data.pagination) setPaginacao(data.pagination);
    } catch {
      setProdutos([]);
    }
  }, [pesquisa, categoriaAtiva]);

  useEffect(() => { carregarProdutos(1); }, [carregarProdutos]);

  const showNotif = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };

  const confirmarEliminacao = async () => {
    if (!showDeleteConfirm) return;
    try {
      await apiService.delete(`/api/produtos/${showDeleteConfirm}`);
      showNotif('success', t('inventory.msg.removed') || 'Produto removido.');
      carregarProdutos(paginacao.page || 1);
    } catch (err) {
      showNotif('error', t('inventory.msg.remove_err') || 'Erro.');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleEditClick = (p) => {
    setProdutoToEdit(p.id);
    setFormData({
      nome: p.nome || '', codigo_barras: p.codigo_barras || '', stock_atual: p.stock_atual || 0, stock_minimo: p.stock_minimo || 5, unidade_medida: p.unidade_medida || 'un', categoria: p.categoria || 'Descartáveis', imagem_url: p.imagem_url || '', data_validade: p.data_validade ? p.data_validade.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = produtoToEdit ? `/api/produtos/${produtoToEdit}` : '/api/produtos';
      if (produtoToEdit) {
        await apiService.put(url, formData);
      } else {
        await apiService.post(url, formData);
      }

      showNotif('success', produtoToEdit ? (t('inventory.msg.updated') || 'Atualizado!') : (t('inventory.msg.added') || 'Adicionado!'));
      setShowModal(false); setProdutoToEdit(null); setFormData(initialForm); carregarProdutos(paginacao.page || 1);
    } catch (err) {
      showNotif('error', t('inventory.msg.save_err') || 'Erro ao guardar.');
    }
  };

  // A Lógica Inteligente de Preenchimento via Código de Barras
  const handleBarcodeLookup = (codigo) => {
    setFormData(prev => ({ ...prev, codigo_barras: codigo }));
    
    // Cancelar lookup anterior
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);

    if (codigo.length >= 8 && !produtoToEdit) {
      lookupTimerRef.current = setTimeout(async () => {
        setBarcodeLoading(true);
        try {
          const data = await apiService.get(`/api/produtos/barcode/${encodeURIComponent(codigo)}`);
          if (data.found && data.product) {
            setFormData(prev => ({
              ...prev,
              nome: data.product.nome || prev.nome,
              categoria: data.product.categoria || prev.categoria,
              unidade_medida: data.product.unidade_medida || prev.unidade_medida,
              stock_minimo: data.product.stock_minimo || prev.stock_minimo,
              imagem_url: data.product.imagem_url || prev.imagem_url
            }));
            const sourceLabel = data.source === 'local' 
              ? (t('inventory.msg.barcode_local') || 'Produto reconhecido na base de dados!') 
              : (t('inventory.msg.barcode_online') || 'Produto identificado online!');
            showNotif('success', sourceLabel);
          }
        } catch {
          // Silencioso - não é erro crítico
        } finally {
          setBarcodeLoading(false);
        }
      }, 400);
    }
  };

  // Lookup direto para scan da câmara (sem debounce)
  const handleScannedBarcode = async (codigo) => {
    setFormData(prev => ({ ...prev, codigo_barras: codigo }));
    setShowScanner(false);
    showNotif('success', t('inventory.msg.barcode_read') || 'Código de barras lido com sucesso!');

    if (!produtoToEdit) {
      setBarcodeLoading(true);
      try {
        const data = await apiService.get(`/api/produtos/barcode/${encodeURIComponent(codigo)}`);
        if (data.found && data.product) {
          setFormData(prev => ({
            ...prev,
            nome: data.product.nome || prev.nome,
            categoria: data.product.categoria || prev.categoria,
            unidade_medida: data.product.unidade_medida || prev.unidade_medida,
            stock_minimo: data.product.stock_minimo || prev.stock_minimo,
            imagem_url: data.product.imagem_url || prev.imagem_url
          }));
          const sourceLabel = data.source === 'local' 
            ? (t('inventory.msg.barcode_local') || 'Produto reconhecido na base de dados!') 
            : (t('inventory.msg.barcode_online') || 'Produto identificado online!');
          showNotif('success', sourceLabel);
        }
      } catch {
        // Silencioso
      } finally {
        setBarcodeLoading(false);
      }
    }
  };

  // BarcodeScanner component now handles scanning - old useEffect removed

  const produtosFiltrados = produtos;

  const calcularTotalUnidades = (nomeProduto, stockAtual, stockMinimo) => {
    const match = nomeProduto.match(/\((\d+)\s*([a-zA-Z]+)\)/);
    if (match) {
      const unidadesPorCaixa = parseInt(match[1], 10);
      const totalReal = Math.round(unidadesPorCaixa * parseFloat(stockAtual));
      const isAlerta = parseFloat(stockAtual) <= parseFloat(stockMinimo);
      return { texto: `${totalReal} ${match[2]} ${t('inventory.card.total_calc') || 'total'}`, cor: isAlerta ? '#ef4444' : '#10b981' };
    }
    return null; 
  };

  const inputStyle = { width: '100%', padding: '14px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, outline: 'none', boxSizing: 'border-box', fontSize: '14px', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: theme.subText, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };

  const categoryMap = {
    'Todas': t('inventory.cat.all') || 'Todas', 'Descartáveis': t('inventory.cat.disposables') || 'Descartáveis', 'Anestesia': t('inventory.cat.anesthesia') || 'Anestesia', 'Endo_Restauro': t('inventory.cat.endo') || 'Endo / Restauro', 'Cirurgia': t('inventory.cat.surgery') || 'Cirurgia', 'Ortodontia': t('inventory.cat.ortho') || 'Ortodontia', 'Esterilizacao': t('inventory.cat.sterilization') || 'Esterilização', 'Equipamento': t('inventory.cat.instruments') || 'Equipamento'
  };

  const CategoryBtn = ({ label, id }) => (
    <button onClick={() => setCategoriaAtiva(id)} style={{ flexShrink: 0, padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', backgroundColor: categoriaAtiva === id ? '#2563eb' : theme.cardBg, color: categoriaAtiva === id ? 'white' : theme.text, border: categoriaAtiva === id ? '1px solid #2563eb' : `1px solid ${theme.border}`, transition: 'all 0.2s', boxShadow: categoriaAtiva === id ? '0 4px 6px -1px rgba(37, 99, 235, 0.3)' : 'none' }}>
      {label}
    </button>
  );

  const activeLocale = getActiveLocale(language);

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      <style>
        {`
          .scroll-categorias::-webkit-scrollbar { height: 8px; }
          .scroll-categorias::-webkit-scrollbar-track { background: transparent; }
          .scroll-categorias::-webkit-scrollbar-thumb { background-color: ${theme.border}; border-radius: 10px; }
          .scroll-categorias::-webkit-scrollbar-thumb:hover { background-color: #64748b; }
          .form-input:focus { border-color: #2563eb !important; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          
          /* Estilizar a caixa feia padrão da biblioteca do Scanner */
          #reader { border: none !important; border-radius: 15px !important; overflow: hidden; }
          #reader__dashboard_section_csr button { background-color: #2563eb !important; color: white !important; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; margin-top: 10px; }
          #reader__dashboard_section_csr select { padding: 10px; border-radius: 10px; border: 1px solid #cbd5e1; width: 100%; margin-bottom: 10px; outline: none; }
          #reader a { display: none; } /* Esconde o link "Powered by" */
        `}
      </style>

      {/* JANELA DA CÂMARA (SCANNER) */}
      {showScanner && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '650px' }}>
            <BarcodeScanner 
              onScanSuccess={(codigo) => {
                handleScannedBarcode(codigo);
              }}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}

      {notification.show && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '15px 25px', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.3s' }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span style={{ fontWeight: 'bold' }}>{notification.message}</span>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '15px', width: '350px', textAlign: 'center', border: `1px solid ${theme.border}` }}>
            <AlertTriangle size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>{t('inventory.delete.title') || 'Eliminar'}</h2>
            <p style={{ color: theme.subText, marginBottom: '25px' }}>{t('inventory.delete.desc') || 'Tem a certeza?'}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#64748b', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>{t('inventory.delete.cancel') || 'Cancelar'}</button>
              <button onClick={confirmarEliminacao} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>{t('inventory.delete.confirm') || 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '20px' }}>
          <div style={{ backgroundColor: theme.cardBg, width: '100%', maxWidth: '550px', borderRadius: '20px', padding: '35px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Package size={26} color="#2563eb" /> {produtoToEdit ? (t('inventory.modal.edit_title') || 'Editar') : (t('inventory.modal.add_title') || 'Adicionar')}
              </h2>
              <button onClick={() => { setShowModal(false); setFormData(initialForm); setProdutoToEdit(null); }} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer', padding: '5px' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={{...labelStyle, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <Search size={14}/> {t('inventory.modal.barcode') || 'Código de Barras'}
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    className="form-input" type="text" placeholder="Escreva ou leia com a câmara" style={{...inputStyle, borderColor: '#2563eb', borderWidth: '2px', flex: 1}} 
                    value={formData.codigo_barras} 
                    onChange={e => handleBarcodeLookup(e.target.value)} 
                  />
                  {barcodeLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                      <Loader size={22} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  )}
                  {/* O NOSSO NOVO BOTÃO DE LIGAR A CÂMARA */}
                  <button 
                    type="button" 
                    onClick={() => setShowScanner(true)}
                    style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', padding: '0 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Usar Câmara do Dispositivo"
                  >
                    <ScanLine size={24} />
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>{t('inventory.modal.name') || 'Nome'}</label>
                <input required className="form-input" type="text" placeholder="Ex: Luvas de Nitrilo M (100 un)" style={inputStyle} value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>{t('inventory.modal.category') || 'Categoria'}</label>
                  <select className="form-input" style={inputStyle} value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                    <option value="Descartáveis">{t('inventory.cat.disposables') || 'Descartáveis'}</option>
                    <option value="Anestesia">{t('inventory.cat.anesthesia') || 'Anestesia'}</option>
                    <option value="Endo_Restauro">{t('inventory.cat.endo') || 'Endo/Restauro'}</option>
                    <option value="Cirurgia">{t('inventory.cat.surgery') || 'Cirurgia'}</option>
                    <option value="Ortodontia">{t('inventory.cat.ortho') || 'Ortodontia'}</option>
                    <option value="Esterilizacao">{t('inventory.cat.sterilization') || 'Esterilização'}</option>
                    <option value="Equipamento">{t('inventory.cat.instruments') || 'Equipamento'}</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t('inventory.modal.unit') || 'Unidade'}</label>
                  <select className="form-input" style={inputStyle} value={formData.unidade_medida} onChange={e => setFormData({...formData, unidade_medida: e.target.value})}>
                    <option value="un">un (Unidade)</option><option value="cx">cx (Caixa)</option><option value="mts">mts (Metros)</option><option value="lts">lts (Litros)</option><option value="ml">ml (Mililitros)</option><option value="grs">grs (Gramas)</option>
                  </select>
                </div>
              </div>

              <div style={{ backgroundColor: theme.isDark ? '#0f172a' : '#f1f5f9', padding: '20px', borderRadius: '15px', border: `1px solid ${theme.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{...labelStyle, color: theme.text}}>{t('inventory.modal.stock_current') || 'Stock'}</label>
                  <input required className="form-input" type="number" step="any" style={{...inputStyle, backgroundColor: theme.cardBg}} value={formData.stock_atual} onChange={e => setFormData({...formData, stock_atual: e.target.value})} />
                </div>
                <div>
                  <label style={{...labelStyle, color: '#ef4444'}}>{t('inventory.modal.stock_min') || 'Mínimo'}</label>
                  <input required className="form-input" type="number" step="any" style={{...inputStyle, backgroundColor: theme.cardBg, borderColor: theme.isDark ? '#7f1d1d' : '#fca5a5'}} value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: e.target.value})} />
                </div>
                <div>
                  <label style={{...labelStyle, color: '#f59e0b'}}>{t('inventory.modal.expiry') || 'Validade'}</label>
                  <input className="form-input" type="date" style={{...inputStyle, backgroundColor: theme.cardBg, paddingLeft: '10px', paddingRight: '10px'}} value={formData.data_validade} onChange={e => setFormData({...formData, data_validade: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>{t('inventory.modal.img_url') || 'URL Imagem'}</label>
                <input className="form-input" type="text" placeholder="https://link-da-imagem.com" style={inputStyle} value={formData.imagem_url} onChange={e => setFormData({...formData, imagem_url: e.target.value})} />
                {formData.imagem_url && (
                  <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${theme.border}`, backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '160px' }}>
                    <img 
                      src={formData.imagem_url} 
                      alt={t('inventory.modal.preview') || 'Pré-visualização'} 
                      style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => { setShowModal(false); setFormData(initialForm); setProdutoToEdit(null); }} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#64748b', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{t('inventory.modal.cancel') || 'Cancelar'}</button>
                <button type="submit" style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}>
                  <Save size={20} /> {t('inventory.modal.save') || 'Guardar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>
            {t('inventory.title') || 'Inventário'}
          </h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>{t('inventory.subtitle') || 'Gestão de materiais'}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          {/* BOTÃO AZUL PRINCIPAL */}
          <button onClick={() => { setProdutoToEdit(null); setFormData(initialForm); setShowModal(true); }} style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}>
            <Plus size={20} /> {t('inventory.btn.add') || 'Adicionar Produto'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '30px', width: '100%' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '14px' }} />
            <input 
              type="text" 
              placeholder={t('inventory.search.placeholder') || 'Pesquisar...'}
              style={{ width: '100%', padding: '14px 15px 14px 45px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, outline: 'none', fontSize: '15px', boxSizing: 'border-box' }}
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>
          {/* BOTÃO RÁPIDO DA CÂMARA NA PESQUISA */}
          <button 
            onClick={() => { setShowModal(true); setShowScanner(true); }} 
            style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '0 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', transition: 'all 0.2s' }}
            title="Procurar com a Câmara"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.cardBg}
          >
            <ScanLine size={22} />
          </button>
        </div>

        <div className="scroll-categorias" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', width: '100%' }}>
          <CategoryBtn label={categoryMap['Todas']} id="Todas" />
          <CategoryBtn label={categoryMap['Descartáveis']} id="Descartáveis" />
          <CategoryBtn label={categoryMap['Anestesia']} id="Anestesia" />
          <CategoryBtn label={categoryMap['Endo_Restauro']} id="Endo_Restauro" />
          <CategoryBtn label={categoryMap['Cirurgia']} id="Cirurgia" />
          <CategoryBtn label={categoryMap['Ortodontia']} id="Ortodontia" />
          <CategoryBtn label={categoryMap['Esterilizacao']} id="Esterilizacao" />
          <CategoryBtn label={categoryMap['Equipamento']} id="Equipamento" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
        {produtosFiltrados.map(p => {
          const totalCalc = calcularTotalUnidades(p.nome, p.stock_atual, p.stock_minimo);
          const stockFloat = parseFloat(p.stock_atual);
          let stockVisual;
          if (p.unidade_medida === 'cx' || p.nome.match(/\((\d+)\s*[a-zA-Z]+\)/)) { stockVisual = Math.ceil(stockFloat); } 
          else { stockVisual = stockFloat % 1 === 0 ? stockFloat : stockFloat.toFixed(2); }
          
          const categoriaTraduzida = categoryMap[p.categoria] || categoryMap['Descartáveis'];
          let isExpiring = false; let validadeText = '';
          if (p.data_validade) {
            const expDate = new Date(p.data_validade); const today = new Date(); const diffTime = expDate - today; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) isExpiring = true; validadeText = expDate.toLocaleDateString(activeLocale, { month: 'short', year: 'numeric' });
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
                {p.imagem_url ? (<img src={p.imagem_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />) : (<Package size={60} color="#e2e8f0" />)}
              </div>
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: theme.isDark ? '#ffffff' : theme.text, fontWeight: 'bold', lineHeight: '1.4' }}>{p.nome}</h3>
                <p style={{ margin: '0 0 20px 0', color: theme.subText, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ScanLine size={14}/> {p.codigo_barras || t('inventory.card.no_code') || 'S/ Código'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: theme.subText, fontWeight: 'bold', marginBottom: '4px' }}>{t('inventory.card.current_qty') || 'Stock Atual'}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '24px', fontWeight: '900', color: theme.isDark ? '#ffffff' : theme.text }}>{stockVisual}</span>
                      <span style={{ fontSize: '14px', color: theme.subText, fontWeight: 'bold' }}>{p.unidade_medida}</span>
                      {totalCalc && (<span style={{ fontSize: '12px', color: totalCalc.cor, marginLeft: '4px', fontWeight: 'bold' }}>({totalCalc.texto})</span>)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditClick(p)} style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none', backgroundColor: theme.isDark ? '#1e3a8a' : '#dbeafe', color: '#2563eb', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}><Edit2 size={18} /></button>
                    <button onClick={() => setShowDeleteConfirm(p.id)} style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none', backgroundColor: theme.isDark ? '#450a0a' : '#fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
           </div>
          );
        })}
        {produtosFiltrados.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: theme.subText }}>
            <Package size={40} style={{ opacity: 0.3, marginBottom: '10px' }} /><br/><p>{t('inventory.empty') || 'Nenhum produto encontrado.'}</p>
          </div>
        )}
      </div>
      {paginacao.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
          <button
            disabled={paginacao.page <= 1}
            onClick={() => carregarProdutos(paginacao.page - 1)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              background: paginacao.page <= 1 ? 'transparent' : theme.cardBg,
              color: paginacao.page <= 1 ? theme.subText : theme.text,
              cursor: paginacao.page <= 1 ? 'not-allowed' : 'pointer',
              opacity: paginacao.page <= 1 ? 0.4 : 1,
              fontWeight: '600', fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            {t('common.prev')}
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '10px',
            padding: '10px 16px',
          }}>
            {(() => {
              const total = paginacao.pages;
              const cur = paginacao.page;
              let pages = [];
              if (total <= 7) {
                pages = Array.from({ length: total }, (_, i) => i + 1);
              } else {
                pages = [1];
                if (cur > 3) pages.push('...');
                for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
                if (cur < total - 2) pages.push('...');
                pages.push(total);
              }
              return pages.map((p, i) => p === '...' ? (
                <span key={`dots-${i}`} style={{ color: theme.subText, padding: '0 4px', fontSize: '14px' }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => carregarProdutos(p)}
                  style={{
                    width: '34px', height: '34px',
                    borderRadius: '8px',
                    border: 'none',
                    background: p === cur ? '#2563eb' : 'transparent',
                    color: p === cur ? '#fff' : theme.subText,
                    fontWeight: p === cur ? '700' : '500',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >{p}</button>
              ));
            })()}
          </div>

          <div style={{ fontSize: '13px', color: theme.subText, minWidth: '100px', textAlign: 'center' }}>
            {paginacao.total} {t('inventory.products')}
          </div>

          <button
            disabled={paginacao.page >= paginacao.pages}
            onClick={() => carregarProdutos(paginacao.page + 1)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              background: paginacao.page >= paginacao.pages ? 'transparent' : '#2563eb',
              color: paginacao.page >= paginacao.pages ? theme.subText : '#fff',
              cursor: paginacao.page >= paginacao.pages ? 'not-allowed' : 'pointer',
              opacity: paginacao.page >= paginacao.pages ? 0.4 : 1,
              fontWeight: '600', fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {t('common.next')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Inventory;