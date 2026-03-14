import React, { useRef, useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../ThemeContext';
import { Eraser, Save, Edit3, CheckCircle } from 'lucide-react';

const Assinatura = ({ onSaveSignature, onNotification }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { theme } = useContext(ThemeContext);
  
  const currentUser = JSON.parse(localStorage.getItem('meclinic_user')) || {};
  const [savedSignature, setSavedSignature] = useState(null);
  const [mode, setMode] = useState('loading');

  useEffect(() => {
    if (currentUser.id) {
      fetch(`/api/utilizadores/${currentUser.id}/assinatura`)
        .then(res => res.json())
        .then(data => {
          if (data.assinatura) {
            setSavedSignature(data.assinatura);
            setMode('view');
            onSaveSignature(data.assinatura);
          } else {
            setMode('draw');
          }
        })
        .catch(() => setMode('draw'));
    } else {
      setMode('draw');
    }
  }, [currentUser.id, onSaveSignature]);

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = theme.isDark ? '#e2e8f0' : '#0f172a';
    }
  }, [mode, theme]);

  const getCoordinates = (event) => {
    if (event.touches && event.touches.length > 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top
      };
    }
    return { offsetX: event.nativeEvent.offsetX, offsetY: event.nativeEvent.offsetY };
  };

  const startDrawing = (event) => {
    const { offsetX, offsetY } = getCoordinates(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing) return;
    event.preventDefault(); 
    const { offsetX, offsetY } = getCoordinates(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
    onSaveSignature(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSaveSignature(null); 
  };

  // MAGIA: Usa a notificação bonita em vez do "alert()"
  const saveAsDefault = async () => {
    if (!canvasRef.current) return;
    const base64 = canvasRef.current.toDataURL('image/png');
    
    try {
      const res = await fetch(`/api/utilizadores/${currentUser.id}/assinatura`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assinatura: base64 })
      });
      
      if (res.ok) {
        setSavedSignature(base64);
        setMode('view');
        onSaveSignature(base64);
        if (onNotification) {
          onNotification("Assinatura guardada como Padrão com sucesso!", "success");
        }
      }
    } catch (e) {
      if (onNotification) onNotification("Erro ao guardar assinatura.", "error");
    }
  };

  if (mode === 'loading') {
    return <div style={{ padding: '20px', textAlign: 'center', color: theme.subText, fontSize: '13px' }}>A carregar a sua assinatura digital...</div>;
  }

  if (mode === 'view') {
    return (
      <div style={{ border: `2px solid #10b981`, borderRadius: '12px', padding: '15px', backgroundColor: 'rgba(16, 185, 129, 0.05)', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '15px', backgroundColor: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle size={12} /> Assinatura Padrão Carregada
        </div>
        <img src={savedSignature} alt="Assinatura" style={{ maxHeight: '90px', maxWidth: '100%', opacity: theme.isDark ? 0.8 : 1, filter: theme.isDark ? 'invert(1)' : 'none' }} />
        
        <button type="button" onClick={() => { setMode('draw'); setSavedSignature(null); onSaveSignature(null); }} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', marginTop: '15px' }}>
          <Edit3 size={16}/> Usar outra (Redesenhar)
        </button>
      </div>
    );
  }

  return (
    <div style={{ border: `2px dashed ${theme.border}`, borderRadius: '12px', padding: '10px', backgroundColor: theme.pageBg, display: 'flex', flexDirection: 'column' }}>
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        style={{ width: '100%', height: '120px', cursor: 'crosshair', touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onMouseLeave={finishDrawing}
        onTouchStart={startDrawing}
        onTouchEnd={finishDrawing}
        onTouchMove={draw}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', borderTop: `1px solid ${theme.border}`, paddingTop: '10px', flexWrap: 'wrap', gap: '10px' }}>
        <button type="button" onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
          <Eraser size={14}/> Limpar
        </button>
        <button type="button" onClick={saveAsDefault} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#10b981', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}>
          <Save size={14}/> Guardar como Minha Assinatura Padrão
        </button>
      </div>
    </div>
  );
};

export default Assinatura;