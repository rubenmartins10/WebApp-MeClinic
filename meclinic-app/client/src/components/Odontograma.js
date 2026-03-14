import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../ThemeContext';
import { AlertCircle, XCircle, Eraser, Save } from 'lucide-react';

const Tooth = ({ number, data, onSurfaceClick }) => {
  const { theme } = useContext(ThemeContext);

  // MAGIA: AS NOVAS CORES CLÍNICAS
  const getColor = (state) => {
    switch (state) {
      case 'CARIE': return '#ef4444';       // Vermelho
      case 'RESTAURACAO': return '#3b82f6'; // Azul
      case 'ENDO': return '#f97316';        // Laranja
      case 'COROA': return '#a855f7';       // Roxo
      case 'IMPLANTE': return '#10b981';    // Verde
      default: return theme.isDark ? '#334155' : '#ffffff';
    }
  };

  const getStroke = () => theme.isDark ? '#475569' : '#cbd5e1';
  const isExtracted = data?.EXTRACTED;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 2px', cursor: 'pointer' }}>
      <span style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: theme.text }}>{number}</span>
      <div style={{ position: 'relative', width: '28px', height: '28px' }}>
        {isExtracted ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => onSurfaceClick(number, 'EXTRACTED')}>
            <XCircle size={28} color={theme.isDark ? '#94a3b8' : '#64748b'} strokeWidth={1} />
          </div>
        ) : (
          <svg width="28" height="28" viewBox="0 0 40 40">
            <polygon points="0,0 40,0 30,10 10,10" fill={getColor(data?.T)} stroke={getStroke()} strokeWidth="1" onClick={() => onSurfaceClick(number, 'T')} style={{ transition: 'fill 0.2s' }} />
            <polygon points="40,0 40,40 30,30 30,10" fill={getColor(data?.R)} stroke={getStroke()} strokeWidth="1" onClick={() => onSurfaceClick(number, 'R')} style={{ transition: 'fill 0.2s' }} />
            <polygon points="0,40 40,40 30,30 10,30" fill={getColor(data?.B)} stroke={getStroke()} strokeWidth="1" onClick={() => onSurfaceClick(number, 'B')} style={{ transition: 'fill 0.2s' }} />
            <polygon points="0,0 0,40 10,30 10,10" fill={getColor(data?.L)} stroke={getStroke()} strokeWidth="1" onClick={() => onSurfaceClick(number, 'L')} style={{ transition: 'fill 0.2s' }} />
            <polygon points="10,10 30,10 30,30 10,30" fill={getColor(data?.C)} stroke={getStroke()} strokeWidth="1" onClick={() => onSurfaceClick(number, 'C')} style={{ transition: 'fill 0.2s' }} />
          </svg>
        )}
      </div>
    </div>
  );
};

const Odontograma = ({ onSave, initialData = {}, onChange }) => {
  const { theme } = useContext(ThemeContext);
  const [tool, setTool] = useState('CARIE');
  const [teethData, setTeethData] = useState(initialData);

  useEffect(() => {
    setTeethData(initialData);
  }, [initialData]);

  const upperLeft = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperRight = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerLeft = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerRight = [31, 32, 33, 34, 35, 36, 37, 38];

  const handleSurfaceClick = (toothNum, surface) => {
    setTeethData(prev => {
      const currentTooth = prev[toothNum] || {};
      let newState;
      
      if (tool === 'LIMPAR') {
        if (surface === 'EXTRACTED') {
          const newData = { ...currentTooth };
          delete newData.EXTRACTED;
          newState = { ...prev, [toothNum]: newData };
        } else {
          newState = { ...prev, [toothNum]: { ...currentTooth, [surface]: null } };
        }
      } else if (tool === 'EXTRACAO') {
        newState = { ...prev, [toothNum]: { EXTRACTED: true } };
      } else {
        newState = { ...prev, [toothNum]: { ...currentTooth, EXTRACTED: false, [surface]: tool } };
      }

      if (onChange) onChange(newState);
      return newState;
    });
  };

  const toolButtonStyle = (currentTool) => ({
    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${theme.border}`,
    backgroundColor: tool === currentTool ? (theme.isDark ? '#1e293b' : '#e2e8f0') : 'transparent',
    color: theme.text, cursor: 'pointer', fontWeight: tool === currentTool ? 'bold' : 'normal', transition: 'all 0.2s', fontSize: '12px'
  });

  return (
    <div style={{ backgroundColor: theme.cardBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}`, marginTop: '10px', display: 'flex', flexDirection: 'column' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0', color: theme.text, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
            <AlertCircle size={18} color="#3b82f6" /> Odontograma Digital
          </h3>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setTool('CARIE')} style={toolButtonStyle('CARIE')}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div> Cárie
            </button>
            <button onClick={() => setTool('RESTAURACAO')} style={toolButtonStyle('RESTAURACAO')}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div> Restauro
            </button>
            <button onClick={() => setTool('ENDO')} style={toolButtonStyle('ENDO')}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }}></div> Endo
            </button>
            <button onClick={() => setTool('COROA')} style={toolButtonStyle('COROA')}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }}></div> Coroa
            </button>
            <button onClick={() => setTool('IMPLANTE')} style={toolButtonStyle('IMPLANTE')}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div> Implante
            </button>
            <button onClick={() => setTool('EXTRACAO')} style={toolButtonStyle('EXTRACAO')}>
              <XCircle size={12} color="#64748b" /> Extração
            </button>
            <button onClick={() => setTool('LIMPAR')} style={toolButtonStyle('LIMPAR')}>
              <Eraser size={12} color={theme.text} /> Limpar
            </button>
          </div>
        </div>

        {onSave && (
          <button onClick={() => onSave(teethData)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16,185,129,0.2)', fontSize: '14px' }}>
            <Save size={16} /> Guardar
          </button>
        )}
      </div>

      <div className="custom-scrollbar" style={{ width: '100%', overflowX: 'auto', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', minWidth: '480px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '0px' }}>
              {upperLeft.map(num => <Tooth key={num} number={num} data={teethData[num]} onSurfaceClick={handleSurfaceClick} />)}
            </div>
            <div style={{ width: '2px', backgroundColor: theme.border }}></div>
            <div style={{ display: 'flex', gap: '0px' }}>
              {upperRight.map(num => <Tooth key={num} number={num} data={teethData[num]} onSurfaceClick={handleSurfaceClick} />)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '0px' }}>
              {lowerLeft.map(num => <Tooth key={num} number={num} data={teethData[num]} onSurfaceClick={handleSurfaceClick} />)}
            </div>
            <div style={{ width: '2px', backgroundColor: theme.border }}></div>
            <div style={{ display: 'flex', gap: '0px' }}>
              {lowerRight.map(num => <Tooth key={num} number={num} data={teethData[num]} onSurfaceClick={handleSurfaceClick} />)}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Odontograma;