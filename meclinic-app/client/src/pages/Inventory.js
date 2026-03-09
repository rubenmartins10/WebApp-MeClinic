import React, { useState, useEffect, useContext } from 'react';
import { Search, Camera, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle, Package, X, Save } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';

const Inventario = () => {
  const { theme } = useContext(ThemeContext);
  
  const [produtos, setProdutos] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  // Controlo de Modais
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [produtoToEdit, setProdutoToEdit] = useState(null);

  const initialForm = { nome: '', codigo_barras: '', stock_atual: '', stock_minimo: '', unidade_medida: 'un', imagem_url: '' };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/produtos');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProdutos(data);
      } else {
        setProdutos([]);
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
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
        showNotif('success', 'Produto removido com sucesso.');
        carregarProdutos();
      } else {
        showNotif('error', 'Erro ao remover produto.');
      }
    } catch (err) {
      showNotif('error', 'Falha ao ligar ao servidor.');
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
      imagem_url: p.imagem_url || ''
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
        showNotif('success', produtoToEdit ? 'Produto atualizado!' : 'Produto adicionado ao inventário!');
        setShowModal(false);
        setProdutoToEdit(null);
        setFormData(initialForm);
        carregarProdutos();
      } else {
        showNotif('error', 'Erro ao guardar produto.');
      }
    } catch (err) {
      showNotif('error', 'Erro de ligação ao servidor.');
    }
  };

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(pesquisa.toLowerCase()) || 
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(pesquisa.toLowerCase()))
  );

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, outline: 'none', marginBottom: '15px' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: theme.subText, marginBottom: '6px', textTransform: 'uppercase' };

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* NOTIFICAÇÃO GENÉRICA */}
      {notification.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '40px', borderRadius: '20px', border: `1px solid ${theme.border}`, textAlign: 'center', minWidth: '350px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease-out' }}>
            {notification.type === 'success' ? <CheckCircle size={60} color="#059669" style={{ marginBottom: '20px' }} /> : <XCircle size={60} color="#ef4444" style={{ marginBottom: '20px' }} />}
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold', color: theme.isDark ? '#ffffff' : theme.text }}>
              {notification.type === 'success' ? 'Sucesso!' : 'Atenção'}
            </h2>
            <p style={{ margin: '0 0 30px 0', color: theme.subText, fontSize: '15px' }}>{notification.message}</p>
            <button onClick={() => setNotification({show: false})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: notification.type === 'success' ? '#059669' : '#ef4444', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              OK, entendi
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE APAGAR */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '15px', width: '350px', textAlign: 'center', border: `1px solid ${theme.border}` }}>
            <AlertTriangle size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>Remover Produto?</h2>
            <p style={{ color: theme.subText, marginBottom: '25px' }}>Esta ação vai apagar o produto permanentemente do inventário.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#64748b', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarEliminacao} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR/EDITAR PRODUTO */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, width: '500px', borderRadius: '20px', padding: '30px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={24} color="#2563eb" /> {produtoToEdit ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={() => { setShowModal(false); setFormData(initialForm); setProdutoToEdit(null); }} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Nome do Produto</label>
              <input required type="text" placeholder="Ex: Luvas de Nitrilo" style={inputStyle} value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Código de Barras</label>
                  <input type="text" placeholder="Opcional..." style={inputStyle} value={formData.codigo_barras} onChange={e => setFormData({...formData, codigo_barras: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Unidade de Medida</label>
                  <select style={inputStyle} value={formData.unidade_medida} onChange={e => setFormData({...formData, unidade_medida: e.target.value})}>
                    <option value="un">Unidades (un)</option>
                    <option value="cx">Caixas (cx)</option>
                    <option value="mts">Metros (mts)</option>
                    <option value="lts">Litros (lts)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="grs">Gramas (grs)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Stock Atual</label>
                  <input required type="number" style={inputStyle} value={formData.stock_atual} onChange={e => setFormData({...formData, stock_atual: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Stock Mínimo (Alerta)</label>
                  <input required type="number" style={inputStyle} value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: e.target.value})} />
                </div>
              </div>

              <label style={labelStyle}>URL da Imagem (Link da net)</label>
              <input type="text" placeholder="https://..." style={inputStyle} value={formData.imagem_url} onChange={e => setFormData({...formData, imagem_url: e.target.value})} />

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => { setShowModal(false); setFormData(initialForm); setProdutoToEdit(null); }} style={{ flex: 1, padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#64748b', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <Save size={20} /> Guardar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          {/* AQUI ESTÁ A CORREÇÃO DA COR INTELIGENTE NO TÍTULO */}
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>
            Inventário
          </h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>Vista de cartões e leitura de código de barras.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button style={{ backgroundColor: '#059669', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}>
            <Camera size={20} /> Ler Código (Câmara)
          </button>
          <button onClick={() => { setProdutoToEdit(null); setFormData(initialForm); setShowModal(true); }} style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}>
            <Plus size={20} /> Adicionar Produto
          </button>
        </div>
      </div>

      {/* BARRA DE PESQUISA */}
      <div style={{ marginBottom: '30px', position: 'relative', maxWidth: '400px' }}>
        <Search size={20} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '14px' }} />
        <input 
          type="text" 
          placeholder="Pesquisar produto ou digitar código..." 
          style={{ width: '100%', padding: '14px 15px 14px 45px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, outline: 'none', fontSize: '15px' }}
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />
      </div>

      {/* GRELHA DE PRODUTOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
        {produtosFiltrados.map(p => (
           <div key={p.id} style={{ backgroundColor: theme.cardBg, borderRadius: '20px', border: `1px solid ${theme.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              
              <div style={{ height: '200px', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                {p.imagem_url ? (
                  <img src={p.imagem_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
                ) : (
                  <Package size={60} color="#e2e8f0" />
                )}
              </div>
              
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: theme.isDark ? '#ffffff' : theme.text, fontWeight: 'bold', lineHeight: '1.4' }}>{p.nome}</h3>
                <p style={{ margin: '0 0 20px 0', color: theme.subText, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {p.codigo_barras || 'SEM CÓDIGO'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: theme.subText, fontWeight: 'bold', marginBottom: '4px' }}>QTD ATUAL</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '24px', fontWeight: '900', color: theme.isDark ? '#ffffff' : theme.text }}>{p.stock_atual}</span>
                      <span style={{ fontSize: '14px', color: theme.subText, fontWeight: 'bold' }}>{p.unidade_medida}</span>
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
        ))}

        {produtosFiltrados.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: theme.subText }}>
            <Package size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p>Nenhum produto encontrado.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Inventario;