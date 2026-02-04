import React, { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Inicializa o Quagga assim que o componente abre
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current, // Onde o vídeo vai aparecer
        constraints: {
          width: 1280,
          height: 720,
          facingMode: "environment", // Tenta usar a câmara traseira em telemóveis
        },
      },
      locator: {
        patchSize: "medium",
        halfSample: true,
      },
      numOfWorkers: 2,
      decoder: {
        // Lista de leitores para produtos comuns
        readers: ["ean_reader", "ean_8_reader", "upc_reader", "code_128_reader"]
      },
      locate: true, // Ajuda a encontrar o código na imagem
    }, (err) => {
      if (err) {
        console.error("Erro ao iniciar Quagga:", err);
        setError("Erro ao iniciar a câmara. Verifique as permissões.");
        return;
      }
      Quagga.start();
    });

    // O que fazer quando deteta um código
    Quagga.onDetected((data) => {
      if (data && data.codeResult && data.codeResult.code) {
        // Toca um som de sucesso (opcional, mas ajuda)
        Quagga.stop(); // Para a câmara
        onScan(data.codeResult.code); // Envia o código para o Inventário
      }
    });

    // Função de limpeza quando fechamos a janela
    return () => {
      Quagga.stop();
    };
  }, [onScan]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>Scanner de Alta Precisão</h3>
        <p style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
          Aproxime e afaste lentamente até aparecer uma <strong>caixa verde</strong>.
        </p>
        
        <div style={styles.cameraContainer}>
          {/* O Quagga vai injetar o vídeo aqui dentro */}
          <div ref={scannerRef} style={styles.videoWrapper} />
          
          {/* Linha vermelha fixa para ajudar a mirar */}
          <div style={styles.laserLine}></div>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <button onClick={onClose} style={styles.closeButton}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modal: {
    backgroundColor: 'white', padding: '20px', borderRadius: '12px',
    textAlign: 'center', maxWidth: '600px', width: '90%',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
  },
  cameraContainer: {
    position: 'relative',
    marginTop: '10px', marginBottom: '20px', 
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    height: '300px', // Altura fixa
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden' // Garante que o vídeo não sai fora
  },
  laserLine: {
    position: 'absolute',
    top: '50%', left: '10%', right: '10%',
    height: '2px',
    backgroundColor: 'red',
    boxShadow: '0 0 4px red',
    pointerEvents: 'none',
    zIndex: 10
  },
  closeButton: {
    padding: '10px 30px', backgroundColor: '#e5e7eb', border: 'none', 
    borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#374151'
  }
};

export default BarcodeScanner;