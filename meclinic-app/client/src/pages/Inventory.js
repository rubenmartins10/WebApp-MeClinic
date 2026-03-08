// client/src/pages/Inventory.js
import React, { useState, useEffect, useContext } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, ScanLine, Image as ImageIcon, CheckCircle, XCircle, X } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import BarcodeScanner from '../components/BarcodeScanner';
import { ThemeContext } from '../ThemeContext';

const Inventory = () => {
  const { theme } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  const [productToEdit, setProductToEdit] = useState(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [idToDelete, setIdToDelete] = useState(null);

  const loadProducts = () => {
    fetch("http://localhost:5000/api/produtos")
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Erro ao ligar ao servidor:", err));
  };

  useEffect(() => { loadProducts(); }, []);

  const showNotif = (type, message) => setNotification({ show: true, type, message });
  const closeNotif = () => setNotification({ show: false, type: '', message: '' });

  // --- LÓGICA DO SCANNER DA CÂMARA ---
  const handleBarcodeDetected = (code) => {
    setShowScanner(false);
    setScannedBarcode(code);
    setProductToEdit(null); // Limpa para o Modal assumir a lógica de verificação
    setShowModal(true);
  };

  // --- LÓGICA DE GUARDAR ---
  const handleSaveProduct = async (formData) => {
    try {
      const isEditing = !!formData.id;
      const url = isEditing ? `http://localhost:5000/api/produtos/${formData.id}` : "http://localhost:5000/api/produtos";
      
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        loadProducts();
        setShowModal(false);
        showNotif('success', `Produto ${isEditing ? 'atualizado' : 'registado'} com sucesso!`);
      } else {
        showNotif('error', 'Erro ao guardar no servidor. Verifique a base de dados.');
      }
    } catch (err) {
      showNotif('error', 'Sem ligação ao servidor.');
    }
  };

  // --- LÓGICA DE APAGAR ---
  const confirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/produtos/${idToDelete}`, { method: "DELETE" });
      if (response.ok) { 
        loadProducts(); 
        setShowDeleteConfirm(false); 
        showNotif('success', 'Produto removido do sistema.');
      }
    } catch (err) { showNotif('error', 'Erro ao apagar.'); }
  };

  const filteredProducts = products.filter(p => 
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.codigo_barras?.includes(searchTerm)
  );

  const btnStyle = { color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };

  return (
    <div style={{ padding: '10px', transition: 'all 0.3s ease', color: theme.text }}>
      
      {/* NOTIFICAÇÃO BONITA NO CENTRO DO ECRÃ */}
      {notification.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '40px 30px', borderRadius: '15px', border: `1px solid ${theme.border}`, textAlign: 'center', minWidth: '320px', position: 'relative' }}>
            <button onClick={closeNotif} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: theme.subText }}><X size={24} /></button>
            {notification.type === 'success' ? <CheckCircle size={56} color="#059669" style={{ marginBottom: '15px' }} /> : <XCircle size={56} color="#ef4444" style={{ marginBottom: '15px' }} />}
            <h3 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: 'bold', color: theme.text }}>{notification.type === 'success' ? 'Sucesso!' : 'Erro'}</h3>
            <p style={{ margin: 0, color: theme.subText, fontSize: '15px' }}>{notification.message}</p>
          </div>
        </div>
      )}

      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Inventário Ponto de Venda</h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>Vista de cartões e leitura de código de barras.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setShowScanner(true)} style={{ ...btnStyle, backgroundColor: '#0f766e', fontSize: '15px' }}>
            <ScanLine size={22} /> Ler Código (Câmara)
          </button>
          
          <button onClick={() => { setProductToEdit(null); setScannedBarcode(''); setShowModal(true); }} style={{ ...btnStyle, backgroundColor: '#2563eb', fontSize: '15px' }}>
            <Plus size={22} /> Adicionar Produto
          </button>
        </div>
      </div>

      {/* BARRA DE PESQUISA */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
          <Search size={20} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" placeholder="Pesquisar produto ou digitar código..."
            style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '12px', border: `2px solid ${theme.border}`, background: theme.cardBg, color: theme.text, outline: 'none', fontSize: '16px' }}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* A NOVA VISTA EM QUADRADOS (GRID DE CARTÕES) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '25px', paddingBottom: '50px' }}>
        {filteredProducts.map((p) => (
          <div key={p.id} style={{ backgroundColor: theme.cardBg, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'default' }}>
            
            {/* Imagem Grande no Topo */}
            <div style={{ height: '180px', backgroundColor: theme.pageBg, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              {p.imagem_url ? (
                <img src={p.imagem_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ImageIcon size={50} color={theme.border} />
              )}
              
              {/* Alerta de Stock em cima da foto se estiver baixo */}
              {p.stock_atual <= p.stock_minimo && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={12} /> STOCK BAIXO
                </div>
              )}
            </div>

            {/* Informações Em Baixo */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: theme.text, lineHeight: '1.3' }}>{p.nome}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: theme.subText, letterSpacing: '1px' }}>{p.codigo_barras || 'SEM CÓDIGO'}</p>
              
              <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '10px', color: theme.subText, textTransform: 'uppercase', fontWeight: 'bold' }}>Qtd Atual</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: p.stock_atual <= p.stock_minimo ? '#ef4444' : theme.text }}>
                    {p.stock_atual} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>{p.unidade_medida}</span>
                  </span>
                </div>
                
                {/* Botões de Ação */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => {setProductToEdit(p); setShowModal(true);}} style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', backgroundColor: theme.isDark ? '#1e3a8a' : '#dbeafe', color: '#2563eb', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => {setIdToDelete(p.id); setShowDeleteConfirm(true);}} style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', backgroundColor: theme.isDark ? '#450a0a' : '#fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Apagar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* COMPONENTES SECUNDÁRIOS */}
      {showScanner && (
        <BarcodeScanner 
          onScan={handleBarcodeDetected} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <ProductModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSave={handleSaveProduct} 
        productToEdit={productToEdit} 
        scannedBarcode={scannedBarcode}
        allProducts={products}
        showNotification={showNotif}
      />

      {/* MODAL DE APAGAR */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '15px', width: '350px', textAlign: 'center', border: `1px solid ${theme.border}` }}>
            <AlertTriangle size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', color: theme.text }}>Apagar Produto?</h2>
            <p style={{ color: theme.subText, marginBottom: '25px' }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ ...btnStyle, backgroundColor: '#64748b', flex: 1, justifyContent: 'center' }}>Cancelar</button>
              <button onClick={confirmDelete} style={{ ...btnStyle, backgroundColor: '#ef4444', flex: 1, justifyContent: 'center' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;