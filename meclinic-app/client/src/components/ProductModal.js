import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSave, initialBarcode, productToEdit }) => {
  // Estado inicial vazio
  const initialData = {
    name: '',
    category: '',
    stock: '',
    barcode: ''
  };

  const [formData, setFormData] = useState(initialData);

  // EFEITO MÁGICO: Preenche o formulário automaticamente
  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        // MODO EDIÇÃO: Carrega os dados do produto clicado
        setFormData(productToEdit);
      } else {
        // MODO CRIAÇÃO: Limpa tudo (e coloca o código de barras se tiver sido lido)
        setFormData({ ...initialData, barcode: initialBarcode || '' });
      }
    }
  }, [isOpen, productToEdit, initialBarcode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData); // Manda os dados de volta para o Inventário
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          {/* Título muda dinamicamente */}
          <h3>{productToEdit ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
          <button onClick={onClose} style={styles.iconBtn}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Código de Barras</label>
            <input 
              name="barcode" 
              value={formData.barcode} 
              onChange={handleChange} 
              style={{...styles.input, backgroundColor: '#f9fafb'}} 
              placeholder="Scan ou digite..."
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Nome do Produto</label>
            <input 
              name="name" 
              value={formData.name}
              placeholder="Ex: Luvas de Látex" 
              onChange={handleChange} 
              required 
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Categoria</label>
              <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
                <option value="">Selecione...</option>
                <option value="Consumíveis">Consumíveis</option>
                <option value="Medicamentos">Medicamentos</option>
                <option value="Restaurador">Restaurador</option>
                <option value="Higiene">Higiene</option>
                <option value="Equipamentos">Equipamentos</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Stock</label>
              <input 
                name="stock" 
                value={formData.stock}
                type="number" 
                placeholder="0" 
                onChange={handleChange} 
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancelar</button>
            <button type="submit" style={styles.saveBtn}>
              <Save size={16} style={{marginRight: 5}}/> 
              {productToEdit ? 'Guardar Alterações' : 'Criar Produto'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// Estilos
const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modal: {
    backgroundColor: 'white', width: '500px', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' },
  row: { display: 'flex', gap: '16px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' },
  saveBtn: { backgroundColor: '#2563eb', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '500' },
  cancelBtn: { backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }
};

export default ProductModal;