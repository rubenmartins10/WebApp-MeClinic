import React, { useState } from 'react';
import logo from '../logo.png'; // <--- LOGÓTIPO NO ECRÃ DE LOGIN!

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [mfaToken, setMfaToken] = useState('');
  const [qrCode, setQrCode] = useState(null); 
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(''); 

    const endpoint = isLogin ? '/api/login' : '/api/register';
    const payload = isLogin ? { email, password, mfaToken } : { nome, email, password };
    
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Erro na autenticação.');
      } else {
        if (!isLogin) {
          setQrCode(data.qrCodeUrl);
        } else {
          onLogin(data.user);
        }
      }
    } catch (err) {
      setErrorMsg('Falha ao conectar ao servidor. Verifique se o backend está a correr.');
    }
  };

  const inputStyle = {
    width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', 
    boxSizing: 'border-box', marginBottom: '15px', fontSize: '15px', outline: 'none'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      
      <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '420px' }}>
        
        {/* CABEÇALHO DO LOGIN COM O LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <img src={logo} alt="Logótipo da Clínica" style={{ maxWidth: '220px', height: 'auto', marginBottom: '10px' }} />
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Bem-vindo(a) ao seu portal de gestão</p>
        </div>

        {qrCode ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#059669', marginBottom: '10px' }}>Conta criada com sucesso!</h2>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
              Para a sua segurança, ative o Google Authenticator. Leia o QR Code abaixo com a aplicação no seu telemóvel.
            </p>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', display: 'inline-block' }}>
              <img src={qrCode} alt="QR Code MFA" style={{ width: '200px', height: '200px' }} />
            </div>
            <button 
              onClick={() => { setIsLogin(true); setQrCode(null); setPassword(''); setMfaToken(''); }} 
              style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' }}
            >
              Ir para o Login
            </button>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {!isLogin && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '13px', fontWeight: 'bold' }}>Nome Completo</label>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} placeholder="O seu nome..." />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '13px', fontWeight: 'bold' }}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="exemplo@clinica.pt" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '13px', fontWeight: 'bold' }}>Palavra-passe</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} placeholder="••••••••" />
              </div>

              {isLogin && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>Código App (Authenticator)</label>
                  <input 
                    type="text" 
                    value={mfaToken} 
                    onChange={(e) => setMfaToken(e.target.value)} 
                    required 
                    maxLength="6"
                    style={{ ...inputStyle, letterSpacing: '8px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', borderColor: '#10b981', borderWidth: '2px' }}
                    placeholder="000000"
                  />
                </div>
              )}

              <button type="submit" style={{ padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px', fontSize: '16px', fontWeight: 'bold', transition: 'background-color 0.2s' }}>
                {isLogin ? 'Entrar no Sistema' : 'Registar Conta'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', color: '#6b7280' }}>
              {isLogin ? 'Ainda não tens conta? ' : 'Já tens uma conta? '}
              <span 
                onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} 
                style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'none', fontWeight: 'bold' }}
              >
                {isLogin ? 'Registar' : 'Fazer Login'}
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;