import React, { useState } from 'react';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // ADICIONADO: Estado para o Token MFA e para o QR Code após o registo
  const [mfaToken, setMfaToken] = useState('');
  const [qrCode, setQrCode] = useState(null); 
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(''); 

    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    // ADICIONADO: O mfaToken agora é enviado durante o login
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
          // Se for REGISTO com sucesso, mostramos o QR Code gerado pelo backend
          setQrCode(data.qrCodeUrl);
        } else {
          // Se for LOGIN com sucesso e código válido, entra na App
          onLogin(data.user);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao ligar ao servidor. Verifica se o backend está a correr.');
    }
  };

  // ECRÃ DO QR CODE: Mostrado imediatamente após o registo com sucesso
  if (qrCode) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
        <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '320px', textAlign: 'center' }}>
          <h2 style={{ color: '#1976d2', marginBottom: '1rem', fontSize: '1.5rem' }}>Conta Criada!</h2>
          <p style={{ color: '#333', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>
            Abre a aplicação <strong>Google Authenticator</strong> (ou Authy) e lê este QR Code para ativares a segurança da conta.
          </p>
          
          <img src={qrCode} alt="QR Code MFA" style={{ width: '200px', height: '200px', margin: '0 auto 1rem auto', display: 'block' }} />
          
          <p style={{ color: '#d32f2f', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Atenção: Não percas este acesso. O código da app será pedido sempre que fizeres login!
          </p>
          
          <button 
            onClick={() => { 
              setQrCode(null); 
              setIsLogin(true); 
              setErrorMsg(''); 
              setPassword(''); 
              setMfaToken(''); 
            }}
            style={{ width: '100%', padding: '0.85rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Já li o código, ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '320px' }}>
        <h1 style={{ textAlign: 'center', margin: '0 0 0.5rem 0', color: '#1976d2', fontSize: '2.2rem' }}>
          MeClinic
        </h1>
        
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1976d2' }}>
          {isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}
        </h2>
        
        {errorMsg && (
          <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Nome Completo</label>
              <input 
                type="text" 
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                required 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                placeholder="O teu nome"
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              placeholder="exemplo@email.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Palavra-passe</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              placeholder="••••••••"
            />
          </div>

          {/* ADICIONADO: Caixa para o código MFA apenas no momento do Login */}
          {isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Código da App (Google Authenticator)</label>
              <input 
                type="text" 
                value={mfaToken} 
                onChange={(e) => setMfaToken(e.target.value)} 
                required 
                maxLength="6"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem' }}
                placeholder="000000"
              />
            </div>
          )}

          <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem', fontSize: '1rem', fontWeight: 'bold' }}>
            {isLogin ? 'Entrar' : 'Registar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
          {isLogin ? 'Ainda não tens conta? ' : 'Já tens uma conta? '}
          <span 
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg(''); 
            }} 
            style={{ color: '#1976d2', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
          >
            {isLogin ? 'Regista-te' : 'Entra aqui'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;