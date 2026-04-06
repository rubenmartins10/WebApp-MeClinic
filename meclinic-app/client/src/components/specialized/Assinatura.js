import React, { useRef, useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { LanguageContext } from '../../contexts/LanguageContext';
import { Eraser, Save, Edit3, Plus, Trash2, User, X, Star } from 'lucide-react';



const Assinatura = ({ onSaveSignature, onNotification }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);

  const currentUser = JSON.parse(localStorage.getItem('meclinic_user')) || {};
  // Array of { id, signature, nome }
  const [signatures, setSignatures] = useState([]);
  const [mode, setMode] = useState('loading'); // 'loading' | 'view' | 'draw'
  const [editingId, setEditingId] = useState(null); // null = new, id = editing existing
  const [nomeInput, setNomeInput] = useState('');

  const parseStored = (raw) => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.signatures)) return parsed.signatures;
      // legacy: single { signature, nome }
      if (parsed.signature) return [{ id: Date.now(), signature: parsed.signature, nome: parsed.nome || '' }];
    } catch {
      // legacy: plain base64 string
      if (typeof raw === 'string' && raw.startsWith('data:')) return [{ id: Date.now(), signature: raw, nome: '' }];
    }
    return [];
  };

  const persistSignatures = async (newList) => {
    const payload = JSON.stringify({ signatures: newList });
    const token = localStorage.getItem('meclinic_token');
    const res = await fetch(`/api/utilizadores/${currentUser.id}/assinatura`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ assinatura: payload })
    });
    return res.ok;
  };

  useEffect(() => {
    if (!currentUser.id) { setMode('view'); return; }
    const token = localStorage.getItem('meclinic_token');
    fetch(`/api/utilizadores/${currentUser.id}/assinatura`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        const list = parseStored(data.assinatura);
        setSignatures(list);
        if (list.length > 0) onSaveSignature(list[0].signature);
        setMode('view');
      })
      .catch(() => setMode('view'));
  }, [currentUser.id]);

  // Init canvas when entering draw mode
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (editingId) {
        // load existing signature into canvas
        const existing = signatures.find(s => s.id === editingId);
        if (existing) {
          const img = new Image();
          img.onload = () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = existing.signature;
        }
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1e293b';
    }
  }, [mode, editingId]);

  const getCoordinates = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    if (event.touches && event.touches.length > 0) {
      return { offsetX: (event.touches[0].clientX - rect.left) * scaleX, offsetY: (event.touches[0].clientY - rect.top) * scaleY };
    }
    return { offsetX: (event.clientX - rect.left) * scaleX, offsetY: (event.clientY - rect.top) * scaleY };
  };

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    canvasRef.current.getContext('2d').closePath();
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const save = async () => {
    if (!canvasRef.current) return;
    const nomeTrimmed = nomeInput.trim();
    if (nomeTrimmed.split(/\s+/).filter(Boolean).length < 2) {
      if (onNotification) onNotification('Introduza o primeiro e último nome.', 'error');
      return;
    }
    const base64 = canvasRef.current.toDataURL('image/png');
    let newList;
    if (editingId) {
      newList = signatures.map(s => s.id === editingId ? { ...s, signature: base64, nome: nomeTrimmed } : s);
    } else {
      newList = [...signatures, { id: Date.now(), signature: base64, nome: nomeTrimmed }];
    }
    try {
      const ok = await persistSignatures(newList);
      if (ok) {
        setSignatures(newList);
        onSaveSignature(newList[0].signature);
        setMode('view');
        setEditingId(null);
        setNomeInput('');
        if (onNotification) onNotification(t('settings.signature.saved_ok'), 'success');
      }
    } catch {
      if (onNotification) onNotification(t('settings.signature.error_save'), 'error');
    }
  };

  const setAsDefault = async (id) => {
    const newList = [signatures.find(s => s.id === id), ...signatures.filter(s => s.id !== id)];
    try {
      const ok = await persistSignatures(newList);
      if (ok) {
        setSignatures(newList);
        onSaveSignature(newList[0].signature);
        if (onNotification) onNotification(t('settings.signature.saved_preferred'), 'success');
      }
    } catch {
      if (onNotification) onNotification(t('settings.signature.error_preferred'), 'error');
    }
  };

  const deleteSignature = async (id) => {
    const newList = signatures.filter(s => s.id !== id);
    try {
      const ok = await persistSignatures(newList);
      if (ok) {
        setSignatures(newList);
        onSaveSignature(newList.length > 0 ? newList[0].signature : null);
        if (onNotification) onNotification(t('settings.signature.removed'), 'success');
      }
    } catch {
      if (onNotification) onNotification(t('settings.signature.error_remove'), 'error');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.cardBg || theme.pageBg,
    color: theme.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  if (mode === 'loading') {
    return <div style={{ padding: '20px', textAlign: 'center', color: theme.subText, fontSize: '13px', animation: 'fadeIn 0.2s' }}>{t('settings.signature.loading')}</div>;
  }

  if (mode === 'draw') {
    return (
      <div key="draw" style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>
            {editingId ? t('settings.signature.edit_title') : t('settings.signature.new')}
          </span>
          <button type="button" onClick={() => { setMode('view'); setEditingId(null); setNomeInput(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.subText, display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: theme.subText, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('settings.signature.responsible')}
          </label>
          <input type="text" value={nomeInput} onChange={e => setNomeInput(e.target.value)}
            placeholder={t('settings.signature.responsible_ph')} style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: theme.subText, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('settings.signature.draw')}
          </label>
          <div style={{ border: `2px dashed ${theme.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            <canvas ref={canvasRef} width={600} height={150}
              style={{ width: '100%', height: '150px', cursor: 'crosshair', touchAction: 'none', display: 'block', backgroundColor: '#ffffff' }}
              onMouseDown={startDrawing} onMouseUp={finishDrawing} onMouseMove={draw} onMouseLeave={finishDrawing}
              onTouchStart={startDrawing} onTouchEnd={finishDrawing} onTouchMove={draw}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <button type="button" onClick={clear}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            <Eraser size={14} /> {t('settings.signature.clear')}
          </button>
          <button type="button" onClick={save}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#10b981', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            <Save size={14} /> {t('settings.signature.save')}
          </button>
        </div>
      </div>
    );
  }

  // view mode
  return (
    <div key="view" style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button"
          onClick={() => { setEditingId(null); setNomeInput(''); setMode('draw'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: '7px 14px', borderRadius: '8px' }}>
          <Plus size={15} /> {t('settings.signature.add')}
        </button>
      </div>

      {signatures.length === 0 && (
        <p style={{ color: theme.subText, fontSize: '13px', margin: 0 }}>{t('settings.signature.none')}</p>
      )}

      {signatures.map((sig, idx) => (
        <div key={sig.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px', borderBottom: idx < signatures.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
          {/* Cabeçalho: nome + badge preferida */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            {sig.nome ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.subText, fontSize: '13px' }}>
                <User size={13} /> <span>{sig.nome}</span>
              </div>
            ) : <span />}
            {idx === 0 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(234,179,8,0.15)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.35)', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '600' }}>
                <Star size={11} fill="#ca8a04" /> {t('settings.signature.preferred')}
              </span>
            ) : (
              <button type="button" onClick={() => setAsDefault(sig.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid rgba(234,179,8,0.35)', color: '#ca8a04', cursor: 'pointer', fontSize: '11px', fontWeight: '600', padding: '2px 10px', borderRadius: '20px' }}>
                <Star size={11} /> {t('settings.signature.set_preferred')}
              </button>
            )}
          </div>

          <img src={sig.signature} alt="Assinatura" style={{ maxHeight: '90px', maxWidth: '100%', display: 'block' }} />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button"
              onClick={() => { setEditingId(sig.id); setNomeInput(sig.nome); setMode('draw'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: `1px solid ${theme.border}`, color: theme.text, cursor: 'pointer', fontSize: '12px', padding: '5px 10px', borderRadius: '7px' }}>
              <Edit3 size={13} /> {t('settings.signature.edit')}
            </button>
            <button type="button" onClick={() => deleteSignature(sig.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '5px 10px', borderRadius: '7px' }}>
              <Trash2 size={13} /> {t('settings.signature.remove')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Assinatura;