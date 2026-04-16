import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ZoomIn, ZoomOut, Camera, Info, RefreshCw } from 'lucide-react';

const READER_ID = 'reader';
const SCAN_REGION = { width: 320, height: 180 };

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const scannerRef = useRef(null);

  const activeCamera = useMemo(
    () => cameras.find(c => c.id === selectedCameraId),
    [cameras, selectedCameraId]
  );

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.debug('[Scanner stop]', err);
      }
      try {
        await scannerRef.current.clear();
      } catch (err) {
        console.debug('[Scanner clear]', err);
      }
      scannerRef.current = null;
    }
    setIsRunning(false);
  };

  const startScanner = async (cameraId) => {
    if (!cameraId || isStarting) return;

    setIsStarting(true);
    await stopScanner();

    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { deviceId: { exact: cameraId } },
        {
          fps: 24,
          qrbox: SCAN_REGION,
          aspectRatio: 16 / 9,
          disableFlip: false,
          videoConstraints: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'environment',
            zoom
          }
        },
        (decodedText) => {
          stopScanner();
          onScanSuccess(decodedText);
        },
        () => {}
      );
      setIsRunning(true);
    } catch (err) {
      console.error('Erro ao iniciar scanner:', err);
      setIsRunning(false);
    } finally {
      setIsStarting(false);
    }
  };

  const refreshCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices || []);

      if (!devices || devices.length === 0) return;

      if (!selectedCameraId) {
        const backCam =
          devices.find(d => /back|traseira|environment|rear/i.test(d.label || '')) || devices[0];
        setSelectedCameraId(backCam.id);
      } else if (!devices.some(d => d.id === selectedCameraId)) {
        setSelectedCameraId(devices[0].id);
      }
    } catch (err) {
      console.error('Erro ao listar câmaras:', err);
    }
  };

  useEffect(() => {
    refreshCameras();
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!selectedCameraId) return;
    startScanner(selectedCameraId);
  }, [selectedCameraId, zoom]);

  return (
    <div style={{
      backgroundColor: '#162338',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
      position: 'relative',
      maxWidth: '720px',
      border: '1px solid rgba(148,163,184,0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Camera size={18} /> Scanner de Código de Barras
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
        >
          <X size={22} />
        </button>
      </div>

      <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '13px', marginBottom: '14px', lineHeight: 1.4 }}>
        Aponte a câmara para o código de barras e mantenha o dispositivo estável entre <strong>10–20cm</strong>.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px', marginBottom: '12px' }}>
        <div
          id={READER_ID}
          style={{
            width: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#0b1220',
            aspectRatio: '16/9',
            border: '1px solid #334155'
          }}
        />

        <div style={{ background: '#0f1b30', borderRadius: '12px', border: '1px solid #334155', padding: '12px' }}>
          <label style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Câmara
          </label>
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #475569',
              background: '#1e293b',
              color: '#e2e8f0',
              marginBottom: '10px'
            }}
          >
            {cameras.map(cam => (
              <option key={cam.id} value={cam.id}>
                {cam.label || `Câmara ${cam.id}`}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={refreshCameras}
            style={{
              width: '100%',
              padding: '9px 10px',
              borderRadius: '8px',
              border: '1px solid #475569',
              background: '#1e293b',
              color: '#e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px'
            }}
          >
            <RefreshCw size={15} /> Atualizar câmaras
          </button>

          <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
            <div><strong>Estado:</strong> {isStarting ? 'A iniciar...' : isRunning ? 'Ativo' : 'Parado'}</div>
            <div><strong>Câmara:</strong> {activeCamera?.label || 'Não selecionada'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
        <button
          onClick={() => setZoom(Math.max(1, Number((zoom - 0.25).toFixed(2))))}
          style={{
            padding: '10px 14px',
            backgroundColor: '#334155',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '13px',
            fontWeight: 'bold'
          }}
        >
          <ZoomOut size={16} /> Afastar
        </button>

        <span style={{
          padding: '10px 14px',
          backgroundColor: '#475569',
          color: '#e2e8f0',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '13px',
          minWidth: '100px',
          textAlign: 'center'
        }}>
          Zoom: {zoom.toFixed(2)}x
        </span>

        <button
          onClick={() => setZoom(Math.min(3, Number((zoom + 0.25).toFixed(2))))}
          style={{
            padding: '10px 14px',
            backgroundColor: '#334155',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '13px',
            fontWeight: 'bold'
          }}
        >
          <ZoomIn size={16} /> Aproximar
        </button>
      </div>

      <div style={{
        backgroundColor: '#13233b',
        padding: '12px',
        borderRadius: '10px',
        borderLeft: '4px solid #3b82f6',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start'
      }}>
        <Info size={14} color="#60a5fa" style={{ marginTop: 2 }} />
        <ul style={{ margin: 0, paddingLeft: '16px', color: '#94a3b8', fontSize: '12px', lineHeight: 1.5 }}>
          <li>Mantenha boa iluminação para melhor leitura.</li>
          <li>Centralize o código de barras dentro da área de captura.</li>
          <li>Evite inclinar o telemóvel durante a leitura.</li>
          <li>Se necessário, ajuste o zoom para focar o código.</li>
        </ul>
      </div>
    </div>
  );
};

export default BarcodeScanner;
