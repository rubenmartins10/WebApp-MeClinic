import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../ThemeContext';
import { Sun, Moon, Mail, Lock, User, Shield, ArrowRight, Activity } from 'lucide-react';
import logo from '../logo.png';

const Auth = ({ onLogin }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ nome: '', email: '', password: '', mfaToken: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para mostrar o QR Code quando um novo utilizador se regista
  const [qrCode, setQrCode] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isRegistering ? 'http://localhost:5000/api/register' : 'http://localhost:5000/api/login';
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro.');
      }

      if (isRegistering) {
        // Se for registo, mostra o QR Code do Google Authenticator
        setQrCode(data.qrCodeUrl);
        setFormData({ ...formData, password: '', mfaToken: '' }); // Limpa a pass
      } else {
        // Se for login com sucesso, avança para o Dashboard
        localStorage.setItem('meclinic_user', JSON.stringify(data.user));
        if (onLogin) onLogin(data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ESTILOS BASEADOS NO TEMA
  const inputStyle = {
    width: '100%', padding: '14px 14px 14px 45px', borderRadius: '10px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc',
    color: theme.text, fontSize: '15px', outline: 'none',
    transition: 'all 0.2s', boxSizing: 'border-box'
  };

  const iconStyle = {
    position: 'absolute', left: '15px', top: '15px', color: '#64748b'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: theme.pageBg, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      transition: 'background-color 0.3s ease',
      position: 'relative',
      padding: '20px'
    }}>
      
      {/* BOTÃO MODO ESCURO / CLARO NO TOPO */}
      <button 
        onClick={toggleTheme}
        style={{
          position: 'absolute', top: '30px', right: '30px',
          backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`,
          color: theme.text, padding: '12px', borderRadius: '50%',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s'
        }}
        title="Alternar Tema"
      >
        {theme.isDark ? <Sun size={24} color="#fbbf24" /> : <Moon size={24} color="#64748b" />}
      </button>

      <div style={{
        backgroundColor: theme.cardBg,
        padding: '50px 40px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: theme.isDark ? '0 25px 50px -12px rgba(0,0,0,0.8)' : '0 25px 50px -12px rgba(0,0,0,0.1)',
        border: `1px solid ${theme.border}`,
        transition: 'all 0.3s ease'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img src={logo} alt="MeClinic Logo" style={{ height: '60px', marginBottom: '15px', filter: theme.isDark ? 'drop-shadow(0px 0px 2px rgba(255,255,255,0.3))' : 'none' }} />
          <h1 style={{ margin: '0 0 10px 0', color: theme.text, fontSize: '24px', fontWeight: '800' }}>
            {isRegistering ? 'Criar Conta' : 'Bem-vindo de volta'}
          </h1>
          <p style={{ margin: 0, color: theme.subText, fontSize: '15px' }}>
            {isRegistering ? 'Registe-se no portal de gestão clínica.' : 'Introduza as suas credenciais para aceder.'}
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', border: '1px solid #f87171' }}>
            {error}
          </div>
        )}

        {/* SE FOR REGISTO E TIVER SUCESSO, MOSTRA QR CODE */}
        {qrCode ? (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
            <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold' }}>Conta criada com sucesso!</div>
            <p style={{ color: theme.text, marginBottom: '20px' }}>Leia este QR Code com a sua App <b>Google Authenticator</b> para ativar a segurança da conta.</p>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', display: 'inline-block', marginBottom: '20px' }}>
              <img src={qrCode} alt="QR Code MFA" style={{ width: '200px', height: '200px' }} />
            </div>
            <button 
              onClick={() => { setQrCode(null); setIsRegistering(false); }}
              style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
              Ir para o Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            {isRegistering && (
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <User size={20} style={iconStyle} />
                <input type="text" name="nome" placeholder="Nome Completo" value={formData.nome} onChange={handleChange} style={inputStyle} required />
              </div>
            )}

            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <Mail size={20} style={iconStyle} />
              <input type="email" name="email" placeholder="E-mail" value={formData.email} onChange={handleChange} style={inputStyle} required />
            </div>

            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <Lock size={20} style={iconStyle} />
              <input type="password" name="password" placeholder="Palavra-passe" value={formData.password} onChange={handleChange} style={inputStyle} required />
            </div>

            {!isRegistering && (
              <div style={{ position: 'relative', marginBottom: '30px' }}>
                <Shield size={20} style={iconStyle} />
                <input type="text" name="mfaToken" placeholder="Código Google Authenticator" value={formData.mfaToken} onChange={handleChange} style={inputStyle} />
              </div>
            )}

            <button type="submit" disabled={loading} style={{ 
              width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', 
              borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', 
              cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: '10px', opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
              marginBottom: '20px'
            }}>
              {loading ? <Activity className="animate-spin" size={20} /> : (isRegistering ? 'Registar Conta' : 'Entrar no Sistema')}
              {!loading && <ArrowRight size={20} />}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button 
                type="button" 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); setFormData({ nome: '', email: '', password: '', mfaToken: '' }); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                {isRegistering ? 'Já tem conta? Iniciar Sessão' : 'Não tem conta? Registe-se aqui'}
              </button>
            </div>

          </form>
        )}
      </div>

    </div>
  );
};

export default Auth;