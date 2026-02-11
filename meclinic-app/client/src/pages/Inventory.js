import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Moon, Sun } from 'lucide-react';
import ProductModal from '../components/ProductModal';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [productToEdit, setProductToEdit] = useState(null);
  
  // ESTADOS PARA O MODO ESCURO E MODAL PERSONALIZADO
  const [darkMode, setDarkMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  const loadProducts = () => {
    fetch("http://localhost:5000/api/produtos")
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Erro ao ligar ao servidor:", err));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSaveProduct = async (formData) => {
    try {
      const isEditing = !!productToEdit;
      const url = isEditing 
        ? `http://localhost:5000/api/produtos/${productToEdit.id}` 
        : "http://localhost:5000/api/produtos";
      
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.name,
          codigo_barras: formData.barcode,
          stock_atual: parseInt(formData.stock, 10),
          stock_minimo: 15,
          unidade_medida: "un",
          categoria_id: 1
        })
      });

      if (response.ok) {
        loadProducts();
        setShowModal(false);
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  };

  const openDeleteModal = (id) => {
    setIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/produtos/${idToDelete}`, {
        method: "DELETE"
      });
      if (response.ok) {
        loadProducts();
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error("Erro ao apagar:", err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CORES DINÂMICAS BASEADAS NO MODO ESCURO
  const theme = {
    bg: darkMode ? '#111827' : '#f3f4f6',
    card: darkMode ? '#1f2937' : '#white',
    text: darkMode ? '#f9fafb' : '#111827',
    border: darkMode ? '#374151' : '#e5e7eb',
    subtext: darkMode ? '#9ca3af' : '#6b7280',
    tableHead: darkMode ? '#374151' : '#f9fafb'
  };

  return (
    <div style={{...styles.pageContainer, backgroundColor: theme.bg, color: theme.text}}>
      <div style={styles.headerRow}>
        <h1 style={{...styles.pageTitle, color: theme.text}}>Inventário MeClinic</h1>
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          style={{...styles.themeBtn, backgroundColor: theme.card, border: `1px solid ${theme.border}`}}
        >
          {darkMode ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#4b5563" />}
        </button>
      </div>

      <div style={{...styles.controlBar, backgroundColor: theme.card, borderBottom: `1px solid ${theme.border}`}}>
        <div style={styles.searchWrapper}>
          <Search size={18} color={theme.subtext} style={styles.searchIcon} />
          <input 
            type="text"
            placeholder="Pesquisar produto..."
            style={{...styles.searchInput, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button style={styles.addButton} onClick={() => {setProductToEdit(null); setShowModal(true);}}>
          <Plus size={18} color="white" style={{marginRight: '8px'}} />
          Novo Produto
        </button>
      </div>

      <div style={{...styles.tableCard, backgroundColor: theme.card, borderColor: theme.border}}>
        <table style={styles.table}>
          <thead>
            <tr style={{...styles.tableHeaderRow, backgroundColor: theme.tableHead}}>
              <th style={{...styles.th, color: theme.subtext}}>PRODUTO</th>
              <th style={{...styles.th, color: theme.subtext}}>STOCK ATUAL</th>
              <th style={{...styles.th, color: theme.subtext}}>ESTADO</th>
              <th style={{...styles.thRight, color: theme.subtext}}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id} style={{...styles.tableRow, borderBottom: `1px solid ${theme.border}`}}>
                <td style={styles.td}>
                  <div style={{...styles.productName, color: theme.text}}>{p.nome}</div>
                  <div style={styles.productCode}>Cod: {p.codigo_barras || '---'}</div>
                </td>
                <td style={styles.td}>
                  <strong style={{color: p.stock_atual <= p.stock_minimo ? '#ef4444' : theme.text}}>
                    {p.stock_atual} {p.unidade_medida}
                  </strong>
                </td>
                <td style={styles.td}>
                  <span style={p.stock_atual > p.stock_minimo ? styles.statusNormal : styles.statusBaixo}>
                    {p.stock_atual > p.stock_minimo ? 'NORMAL' : 'BAIXO'}
                  </span>
                </td>
                <td style={styles.tdRight}>
                  <button style={styles.actionBtn} onClick={() => {setProductToEdit(p); setShowModal(true);}}>
                    <Edit2 size={18} color={theme.subtext} />
                  </button>
                  <button style={styles.actionBtn} onClick={() => openDeleteModal(p.id)}>
                    <Trash2 size={18} color="#ef4444" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CONFIRMAÇÃO PERSONALIZADO NO CENTRO */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.deleteModal, backgroundColor: theme.card}}>
            <div style={styles.warningIconCircle}>
              <AlertTriangle size={32} color="#ef4444" />
            </div>
            <h3 style={{margin: '10px 0', color: theme.text}}>Apagar Produto?</h3>
            <p style={{color: theme.subtext, textAlign: 'center', fontSize: '14px', marginBottom: '24px'}}>
              Tem a certeza que deseja remover este item? Esta ação não pode ser desfeita.
            </p>
            <div style={styles.modalButtons}>
              <button 
                style={{...styles.cancelBtn, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button style={styles.confirmBtn} onClick={confirmDelete}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <ProductModal 
        isOpen={showModal} 
        productToEdit={productToEdit} 
        onClose={() => setShowModal(false)} 
        onSave={handleSaveProduct} 
      />
    </div>
  );
};

const styles = {
  pageContainer: { padding: '30px', minHeight: '100vh', transition: 'all 0.3s ease' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  pageTitle: { fontSize: '26px', fontWeight: '800', margin: 0 },
  themeBtn: { padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' },
  controlBar: { padding: '16px 20px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  searchWrapper: { position: 'relative', width: '320px' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' },
  searchInput: { width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid', outline: 'none' },
  addButton: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  tableCard: { borderRadius: '0 0 12px 12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '16px 24px', fontSize: '11px', fontWeight: '700', textAlign: 'left', textTransform: 'uppercase' },
  thRight: { padding: '16px 24px', fontSize: '11px', fontWeight: '700', textAlign: 'right', textTransform: 'uppercase' },
  td: { padding: '16px 24px' },
  tdRight: { padding: '16px 24px', textAlign: 'right' },
  productName: { fontWeight: '600', fontSize: '15px' },
  productCode: { fontSize: '12px', color: '#9ca3af' },
  statusNormal: { backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' },
  statusBaixo: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' },
  
  // MODAL PERSONALIZADO
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' },
  deleteModal: { padding: '32px', borderRadius: '16px', width: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  warningIconCircle: { width: '64px', height: '64px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' },
  modalButtons: { display: 'flex', gap: '12px', width: '100%' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontWeight: '600' },
  confirmBtn: { flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '600' }
};

export default Inventory;