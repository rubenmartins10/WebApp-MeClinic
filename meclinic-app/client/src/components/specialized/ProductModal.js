// client/src/components/ProductModal.js
import React, { useState, useEffect, useContext } from 'react';
import { X, Save, Image as ImageIcon, Plus, Minus, Search } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';

const imagensInteligentes = [
  { palavras: ['luva', 'luvas', 'nitrilo', 'latex'], foto: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=500&q=80' },
  { palavras: ['máscara', 'mascara', 'cirurgica'], foto: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=500&q=80' },
  { palavras: ['seringa', 'agulha', 'agulhas', 'injetavel'], foto: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=500&q=80' },
  { palavras: ['resina', 'filtek', 'z350', 'composito', 'compósito'], foto: 'https://images.unsplash.com/photo-1609840112855-8bf8c1605335?w=500&q=80' },
  { palavras: ['broca', 'fresa', 'turbina'], foto: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&q=80' },
  { palavras: ['espelho', 'sonda', 'exploradora', 'pinça', 'pinca'], foto: 'https://images.unsplash.com/photo-1598256989800-fea5ce5146c2?w=500&q=80' },
  { palavras: ['desinfetante', 'álcool', 'alcool', 'hipoclorito'], foto: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&q=80' },
  { palavras: ['anestesia', 'lidocaina', 'mepivacaina', 'articaina'], foto: 'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?w=500&q=80' },
  { palavras: ['compressa', 'compressas', 'algodão', 'algodao', 'rolo'], foto: 'https://images.unsplash.com/photo-1584308666744-24d5e4a1a364?w=500&q=80' },
  { palavras: ['bracket', 'ortodontia', 'arco', 'elástico', 'elastico'], foto: 'https://images.unsplash.com/photo-1593052445831-2fb9bbaf0d24?w=500&q=80' }
];

const isValidBarcode = (code) => {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  const digits = code.split('').map(Number);
  const checkDigit = digits.pop(); 
  digits.reverse(); 
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  return ((10 - (sum % 10)) % 10) === checkDigit;
};

const ProductModal = ({ isOpen, onClose, onSave, productToEdit, scannedBarcode, allProducts, showNotification }) => {
  const { theme } = useContext(ThemeContext);

  const initialData = { nome: '', codigo_barras: '', stock_atual: 0, stock_minimo: 5, unidade_medida: 'un', imagem_url: '', categoria_id: 1 };
  const [formData, setFormData] = useState(initialData);
  const [isExisting, setIsExisting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData(productToEdit); 
        setIsExisting(true);
      } else {
        setFormData({ ...initialData, codigo_barras: scannedBarcode || '' });
        setIsExisting(false);
        if (scannedBarcode) processarCodigoBarras(scannedBarcode);
      }
    }
  }, [isOpen, productToEdit, scannedBarcode]);

  const handleNameChange = (e) => {
    const novoNome = e.target.value;
    let urlSugestao = formData.imagem_url;

    if (!urlSugestao || urlSugestao.includes('unsplash.com') || urlSugestao.includes('openfoodfacts')) {
      const nomeBaixo = novoNome.toLowerCase();
      for (const item of imagensInteligentes) {
        if (item.palavras.some(palavra => new RegExp(`\\b${palavra}\\b`, 'i').test(nomeBaixo))) {
          urlSugestao = item.foto;
          break;
        }
      }
    }
    setFormData({ ...formData, nome: novoNome, imagem_url: urlSugestao });
  };

  const processarCodigoBarras = async (code) => {
    if (!code) return;

    if (!isValidBarcode(code)) {
      showNotification('error', 'Código de Barras Inválido! Insira um código autêntico.');
      return;
    }

    const localProd = allProducts?.find(p => p.codigo_barras === code);
    if (localProd && (!productToEdit || localProd.id !== productToEdit.id)) {
      setFormData(localProd);
      setIsExisting(true);
      showNotification('success', `O produto "${localProd.nome}" já existe! Pode gerir o stock agora.`);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        setFormData(prev => ({
          ...prev,
          nome: data.product.product_name || prev.nome,
          imagem_url: data.product.image_url || prev.imagem_url
        }));
        showNotification('success', 'Produto detetado na rede global!');
      }
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.codigo_barras && formData.codigo_barras.trim() !== '' && !isValidBarcode(formData.codigo_barras)) {
      showNotification('error', 'Não é possível guardar. O Código de Barras inserido é inválido.');
      return;
    }

    const dataToSend = {
      ...formData,
      stock_atual: parseInt(formData.stock_atual || 0, 10),
      stock_minimo: parseInt(formData.stock_minimo || 5, 10),
      codigo_barras: formData.codigo_barras || null,
      categoria_id: 1 
    };
    onSave(dataToSend);
  };

  if (!isOpen) return null;

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, outline: 'none', marginBottom: '15px' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: theme.subText, marginBottom: '6px', textTransform: 'uppercase' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
      <div style={{ backgroundColor: theme.cardBg, width: '500px', borderRadius: '20px', padding: '30px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          {/* TÍTULO A BRANCO AQUI! */}
          <h2 style={{ margin: 0, color: '#ffffff', fontSize: '22px' }}>{isExisting ? 'Atualizar Inventário' : 'Registar Novo Produto'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          
          <label style={labelStyle}>Código de Barras (Opcional)</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input 
              type="text" 
              style={{ ...inputStyle, marginBottom: 0, borderColor: (formData.codigo_barras && !isValidBarcode(formData.codigo_barras)) ? '#ef4444' : '#2563eb', fontWeight: 'bold', letterSpacing: '2px', fontSize: '16px' }} 
              value={formData.codigo_barras || ''} 
              onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })} 
              placeholder="Ler ou digitar código (opcional)" 
              autoFocus={!isExisting} 
            />
            <button 
              type="button" 
              onClick={() => processarCodigoBarras(formData.codigo_barras)}
              style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isSearching ? '...' : <><Search size={18} /> Procurar</>}
            </button>
          </div>
          {formData.codigo_barras && formData.codigo_barras.trim() !== '' && !isValidBarcode(formData.codigo_barras) && (
            <p style={{ color: '#ef4444', fontSize: '12px', margin: '-10px 0 15px 0', fontWeight: 'bold' }}>⚠️ O código inserido não é válido.</p>
          )}

          <label style={labelStyle}>Nome do Produto</label>
          <input 
            required type="text" style={{ ...inputStyle, fontSize: '16px' }} 
            value={formData.nome} 
            onChange={handleNameChange} 
            placeholder="Ex: Resina Filtek Z350" 
          />

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Quantidade / Stock</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={() => setFormData({...formData, stock_atual: Math.max(0, parseInt(formData.stock_atual || 0) - 1)})} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: theme.pageBg, color: theme.text, cursor: 'pointer' }}><Minus size={18}/></button>
                <input type="number" style={{ ...inputStyle, marginBottom: 0, textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }} value={formData.stock_atual} onChange={e => setFormData({...formData, stock_atual: e.target.value})} />
                <button type="button" onClick={() => setFormData({...formData, stock_atual: parseInt(formData.stock_atual || 0) + 1})} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}><Plus size={18}/></button>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Alerta de Fim (Mínimo)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={() => setFormData({...formData, stock_minimo: Math.max(0, parseInt(formData.stock_minimo || 0) - 1)})} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: theme.pageBg, color: theme.text, cursor: 'pointer' }}><Minus size={18}/></button>
                <input type="number" style={{ ...inputStyle, marginBottom: 0, textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }} value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: e.target.value})} />
                <button type="button" onClick={() => setFormData({...formData, stock_minimo: parseInt(formData.stock_minimo || 0) + 1})} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}><Plus size={18}/></button>
              </div>
            </div>
          </div>

          <label style={labelStyle}>Fotografia do Produto</label>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '10px', marginBottom: '10px' }}>
            <div style={{ width: '96px', height: '96px', borderRadius: '12px', backgroundColor: theme.pageBg, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${theme.border}`, overflow: 'hidden', flexShrink: 0 }}>
              {formData.imagem_url ? <img src={formData.imagem_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={34} color={theme.subText} />}
            </div>
            <div style={{ fontSize: '12px', color: theme.subText, lineHeight: '1.5' }}>
              A imagem é sugerida automaticamente com base no nome do produto.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#64748b', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ flex: 1, padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Save size={20} /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;