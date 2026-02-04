import React, { useState, useEffect } from 'react'; // 1. Adicionado o useEffect
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import ProductModal from '../components/ProductModal';

const Inventory = () => {
  // --- DADOS REAIS ---
  // 2. Começamos com a lista vazia [] para receber os dados da BD
  const [products, setProducts] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [productToEdit, setProductToEdit] = useState(null);

  // 3. FUNÇÃO PARA CARREGAR DADOS DO BACKEND (Semana 2)
  const loadProducts = () => {
    fetch("http://localhost:5000/api/produtos")
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Erro ao ligar ao servidor:", err));
  };

  // 4. Carrega os produtos assim que a página abre
  useEffect(() => {
    loadProducts();
  }, []);

  // --- LÓGICA ---
  const handleScanSuccess = (code) => {
    setScannedCode(code);
    setShowScanner(false);
    setProductToEdit(null);
    setShowModal(true);
  };

  const handleOpenCreateModal = () => {
    setProductToEdit(null);
    setScannedCode('');
    setShowModal(true);
  };

  const handleEditClick = (product) => {
    setProductToEdit(product);
    setShowModal(true);
  };

  // Lógica de SALVAR (Por agora ainda local, na Semana 3 faremos o POST/PUT para a BD)
  const handleSaveProduct = (formData) => {
    // Aqui manteremos a lógica local por hoje, mas o ideal será fazer um fetch(POST)
    loadProducts(); // Recarrega da BD após salvar
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if(window.confirm("Tem a certeza que deseja apagar este produto?")) {
      // Na Semana 3 criaremos a rota de DELETE no Node.js
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // 5. Ajustado para pesquisar pelo campo 'nome' (que vem da BD)
  const filteredProducts = products.filter(product => 
    product.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerContainer}>
        <h1 style={styles.pageTitle}>Inventário MeClinic</h1>
      </div>

      <div style={styles.controlBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#9ca3af" style={styles.searchIcon} />
          <input 
            type="text"
            placeholder="Pesquisar produto..."
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button style={styles.addButton} onClick={handleOpenCreateModal}>
          <Plus size={18} color="white" style={{marginRight: '8px'}} />
          Novo Produto
        </button>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.th}>PRODUTO</th>
              <th style={styles.th}>STOCK ATUAL</th>
              <th style={styles.th}>ESTADO</th>
              <th style={styles.thRight}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} style={styles.tableRow}>
                <td style={styles.td}>
                  {/* 6. Ajustado para usar os nomes das colunas do PostgreSQL */}
                  <div style={styles.productName}>{product.nome}</div>
                  <div style={styles.productCode}>Cod: {product.codigo_barras || '---'}</div>
                </td>
                <td style={styles.td}>
                  <strong style={{color: product.stock_atual <= product.stock_minimo ? '#dc2626' : '#1f2937'}}>
                    {product.stock_atual} {product.unidade_medida}
                  </strong>
                </td>
                <td style={styles.td}>
                  {/* Lógica do Req-10 aplicada aqui */}
                  <span style={product.stock_atual > product.stock_minimo ? styles.statusNormal : styles.statusBaixo}>
                    {product.stock_atual > product.stock_minimo ? 'NORMAL' : 'BAIXO'}
                  </span>
                </td>
                <td style={styles.tdRight}>
                  <button style={styles.actionBtn} onClick={() => handleEditClick(product)}>
                    <Edit2 size={18} />
                  </button>
                  <button 
                    style={{...styles.actionBtn, color: '#ef4444'}} 
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showScanner && (
        <BarcodeScanner 
          onScan={handleScanSuccess} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <ProductModal 
        isOpen={showModal}
        initialBarcode={scannedCode}
        productToEdit={productToEdit} 
        onClose={() => setShowModal(false)}
        onSave={handleSaveProduct}
      />
    </div>
  );
};

// ... (os teus estilos mantêm-se iguais)
const styles = {
    pageContainer: { padding: '30px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: '"Inter", sans-serif' },
    headerContainer: { marginBottom: '20px' },
    pageTitle: { fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 },
    controlBar: { backgroundColor: 'white', padding: '16px 20px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    searchWrapper: { position: 'relative', width: '300px' },
    searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' },
    searchInput: { width: '100%', padding: '10px 10px 10px 40px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '14px', outline: 'none' },
    addButton: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    tableCard: { backgroundColor: 'white', borderRadius: '0 0 10px 10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    tableHeaderRow: { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
    th: { padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
    thRight: { padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' },
    tableRow: { borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.1s' },
    td: { padding: '16px 24px', verticalAlign: 'middle', fontSize: '14px', color: '#374151' },
    tdRight: { padding: '16px 24px', textAlign: 'right' },
    productName: { fontWeight: '600', color: '#111827' },
    productCode: { fontSize: '12px', color: '#9ca3af' },
    categoryBadge: { backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: '#4b5563', border: '1px solid #e5e7eb' },
    statusNormal: { backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' },
    statusBaixo: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' },
    actionBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '6px', borderRadius: '4px', marginLeft: '5px' }
};

export default Inventory;