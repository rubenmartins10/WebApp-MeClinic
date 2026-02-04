import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import ProductModal from '../components/ProductModal';

const Inventory = () => {
  // --- DADOS ---
  const [products, setProducts] = useState([
    { id: 1, name: 'Luvas de Látex', category: 'Consumíveis', stock: 150, status: 'NORMAL', barcode: '123456' },
    { id: 2, name: 'Anestesia Local', category: 'Medicamentos', stock: 12, status: 'BAIXO', barcode: '987654' },
    { id: 3, name: 'Resina A3', category: 'Restaurador', stock: 8, status: 'NORMAL', barcode: '456123' },
    { id: 4, name: 'Máscaras Cirúrgicas', category: 'Consumíveis', stock: 320, status: 'NORMAL', barcode: '789123' },
  ]);

  const [showScanner, setShowScanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // NOVO ESTADO: Qual produto estamos a editar? (null = nenhum)
  const [productToEdit, setProductToEdit] = useState(null);

  // --- LÓGICA ---
  const handleScanSuccess = (code) => {
    setScannedCode(code);
    setShowScanner(false);
    setProductToEdit(null); // Garante que é modo criação
    setShowModal(true);
  };

  const handleOpenCreateModal = () => {
    setProductToEdit(null); // Limpa edição anterior
    setScannedCode('');
    setShowModal(true);
  };

  // Lógica para abrir a EDIÇÃO
  const handleEditClick = (product) => {
    setProductToEdit(product); // Define qual produto vamos editar
    setShowModal(true);        // Abre o formulário
  };

  // Lógica inteligente de SALVAR (Cria ou Atualiza)
  const handleSaveProduct = (formData) => {
    const stockValue = parseInt(formData.stock, 10) || 0;
    
    // Calcula os dados processados
    const processedData = {
      name: formData.name,
      category: formData.category,
      stock: stockValue,
      status: stockValue < 15 ? 'BAIXO' : 'NORMAL',
      barcode: formData.barcode
    };

    if (productToEdit) {
      // --- ATUALIZAR EXISTENTE ---
      // Percorre a lista e substitui apenas o produto com o ID certo
      setProducts(products.map(p => 
        p.id === productToEdit.id ? { ...processedData, id: productToEdit.id } : p
      ));
    } else {
      // --- CRIAR NOVO ---
      const newProduct = {
        ...processedData,
        id: Date.now(),
      };
      setProducts([...products, newProduct]);
    }
  };

  const handleDelete = (id) => {
    if(window.confirm("Tem a certeza que deseja apagar este produto?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.pageContainer}>
      
      {/* CABEÇALHO */}
      <div style={styles.headerContainer}>
        <h1 style={styles.pageTitle}>Inventário</h1>
      </div>

      {/* BARRA DE CONTROLO */}
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

        <button 
          style={styles.addButton}
          onClick={handleOpenCreateModal} // Alterado para a nova função
        >
          <Plus size={18} color="white" style={{marginRight: '8px'}} />
          Novo Produto
        </button>
      </div>

      {/* TABELA */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.th}>PRODUTO</th>
              <th style={styles.th}>CATEGORIA</th>
              <th style={styles.th}>STOCK ATUAL</th>
              <th style={styles.th}>ESTADO</th>
              <th style={styles.thRight}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <div style={styles.productName}>{product.name}</div>
                  <div style={styles.productCode}>Cod: {product.barcode || '---'}</div>
                </td>
                <td style={styles.td}>
                  <span style={styles.categoryBadge}>{product.category}</span>
                </td>
                <td style={styles.td}>
                  <strong style={{color: product.stock < 15 ? '#dc2626' : '#1f2937'}}>
                    {product.stock} un
                  </strong>
                </td>
                <td style={styles.td}>
                  <span style={product.status === 'NORMAL' ? styles.statusNormal : styles.statusBaixo}>
                    {product.status}
                  </span>
                </td>
                <td style={styles.tdRight}>
                  {/* BOTÃO DE EDITAR AGORA FUNCIONA */}
                  <button 
                    style={styles.actionBtn} 
                    onClick={() => handleEditClick(product)}
                    title="Editar Produto"
                  >
                    <Edit2 size={18} />
                  </button>
                  
                  <button 
                    style={{...styles.actionBtn, color: '#ef4444'}} 
                    onClick={() => handleDelete(product.id)}
                    title="Apagar Produto"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAIS */}
      {showScanner && (
        <BarcodeScanner 
          onScan={handleScanSuccess} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* O Modal agora recebe o productToEdit */}
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

// --- ESTILOS ---
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