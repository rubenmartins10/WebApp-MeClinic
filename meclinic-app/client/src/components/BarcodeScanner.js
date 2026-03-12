import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess }) => {
  useEffect(() => {
    // Configuração do scanner (10 frames por segundo, caixa de leitura retangular para códigos de barras)
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 } },
      false
    );

    // O que acontece quando ele consegue ler um código
    const handleSuccess = (decodedText) => {
      // Pára a câmara e esconde o scanner
      scanner.clear();
      // Envia o código lido para o teu formulário!
      onScanSuccess(decodedText);
    };

    const handleError = (err) => {
      // Ignoramos os erros de "ainda não encontrei nada", é normal enquanto foca
    };

    // Inicia o scanner na tela
    scanner.render(handleSuccess, handleError);

    // Limpeza quando fechamos a janela
    return () => {
      scanner.clear().catch(error => console.error("Erro ao fechar o scanner", error));
    };
  }, [onScanSuccess]);

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#0f172a' }}>
        Aponte a câmara ou carregue uma foto
      </h3>
      {/* É aqui dentro que a magia da câmara vai aparecer */}
      <div id="reader" style={{ width: '100%' }}></div>
    </div>
  );
};

export default BarcodeScanner;