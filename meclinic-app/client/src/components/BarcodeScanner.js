import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const scannerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Configuração otimizada para código de barras com melhor qualidade
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 30, // Aumentado de 10 para 30 FPS (melhor detecção)
        qrbox: { width: 350, height: 200 }, // Caixa maior para código de barras
        aspectRatio: 1.333,
        showTorchButtonIfSupported: true, // Mostrar lanterna se disponível
        zoom: zoom,
        
        // Constraints avançadas para câmara
        facingMode: { ideal: 'environment' }, // Câmara traseira
        deviceId: undefined,

        // Opções de qualidade de vídeo
        videoConstraints: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment',
          aspectRatio: { ideal: 16/9 }
        }
      },
      false
    );

    const handleSuccess = (decodedText) => {
      console.log('✅ Código de barras lido:', decodedText);
      scanner.clear();
      onScanSuccess(decodedText);
    };

    const handleError = (err) => {
      // Log apenas se for um erro real, não cada frame vazio
      if (err && !err.message?.includes('No MultiFormat')) {
        console.debug('[Scanner]', err.message);
      }
    };

    scanner.render(handleSuccess, handleError);
    scannerRef.current = scanner;

    // Tentar melhorar a qualidade do vídeo após loading
    const improveVideoQuality = () => {
      const videoElement = document.querySelector('#reader video');
      if (videoElement) {
        videoElement.style.objectFit = 'cover';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.filter = 'contrast(1.2) brightness(1.1)';
      }
    };

    // Esperar um pouco para o vídeo carregar
    setTimeout(improveVideoQuality, 500);
    const interval = setInterval(improveVideoQuality, 1000);

    return () => {
      clearInterval(interval);
      scanner.clear().catch(error => console.error('Erro ao fechar scanner:', error));
    };
  }, [onScanSuccess, zoom]);

  return (
    <div style={{
      backgroundColor: '#1e293b',
      padding: '20px',
      borderRadius: '15px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      position: 'relative',
      maxWidth: '600px'
    }}>
      {/* Header com título e botão fechar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ textAlign: 'center', flex: 1, margin: 0, color: '#e2e8f0', fontSize: '18px' }}>
          📱 Scanner de Código de Barras
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '24px',
            padding: '0 5px'
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Instruções */}
      <p style={{
        textAlign: 'center',
        color: '#cbd5e1',
        fontSize: '13px',
        marginBottom: '15px',
        lineHeight: '1.4'
      }}>
        Aponte a câmara para o código de barras. Mantenha o dispositivo estável a <strong>10-20cm</strong> de distância.
      </p>

      {/* Scanner */}
      <div id="reader" style={{
        width: '100%',
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        aspectRatio: '16/9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '15px',
        border: '2px solid #475569'
      }} ref={videoRef} />

      {/* Controles de Zoom */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '10px'
      }}>
        <button
          onClick={() => setZoom(Math.max(1, zoom - 0.5))}
          style={{
            padding: '10px 15px',
            backgroundColor: '#334155',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#475569'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#334155'}
        >
          <ZoomOut size={18} /> Afastar
        </button>

        <span style={{
          padding: '10px 15px',
          backgroundColor: '#475569',
          color: '#e2e8f0',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          Zoom: {zoom.toFixed(1)}x
        </span>

        <button
          onClick={() => setZoom(Math.min(3, zoom + 0.5))}
          style={{
            padding: '10px 15px',
            backgroundColor: '#334155',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#475569'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#334155'}
        >
          <ZoomIn size={18} /> Aproximar
        </button>
      </div>

      {/* Dicas */}
      <div style={{
        backgroundColor: '#1e293b',
        padding: '12px',
        borderRadius: '8px',
        borderLeft: '4px solid #3b82f6',
        marginTop: '10px'
      }}>
        <p style={{
          color: '#cbd5e1',
          fontSize: '12px',
          margin: '0 0 5px 0',
          fontWeight: 'bold'
        }}>
          💡 Dicas para melhor detecção:
        </p>
        <ul style={{
          margin: '5px 0 0 0',
          paddingLeft: '20px',
          color: '#94a3b8',
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
          <li>Mantenha boa iluminação (use a lanterna se necessário)</li>
          <li>Código deve estar dentro da linha branca</li>
          <li>Não incline muito o celular - mantenha paralelo</li>
          <li>Se ainda não funcionar, use zoom para aproximar</li>
        </ul>
      </div>
    </div>
  );
};

export default BarcodeScanner;