import React, { useRef, useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../ThemeContext';
import { Eraser } from 'lucide-react';

const Assinatura = ({ onSaveSignature }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // Prepara o pincel para ficar bonito e suave
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = theme.isDark ? '#e2e8f0' : '#0f172a';
  }, [theme]);

  // Função para desenhar com o rato ou com o dedo no telemóvel/tablet
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
    event.preventDefault(); // Evita scroll no telemóvel enquanto assinas
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
    // Guarda a imagem e envia para a página principal
    onSaveSignature(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSaveSignature(null); 
  };

  return (
    <div style={{ border: `2px dashed ${theme.border}`, borderRadius: '12px', padding: '10px', backgroundColor: theme.pageBg, display: 'flex', flexDirection: 'column' }}>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        style={{ width: '100%', height: '150px', cursor: 'crosshair', touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onMouseLeave={finishDrawing}
        onTouchStart={startDrawing}
        onTouchEnd={finishDrawing}
        onTouchMove={draw}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', borderTop: `1px solid ${theme.border}`, paddingTop: '10px' }}>
        <button type="button" onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
          <Eraser size={16}/> Limpar Assinatura
        </button>
      </div>
    </div>
  );
};

export default Assinatura;