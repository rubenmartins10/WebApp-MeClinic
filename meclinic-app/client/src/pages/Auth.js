import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { Sun, Moon, Mail, Lock, User, Shield, ArrowRight, Activity, ArrowLeft, Key, CheckCircle, XCircle } from 'lucide-react';
import logo from '../assets/logo.png';

const Auth = ({ onLogin }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  
  const [authMode, setAuthMode] = useState('LOGIN'); 
  
  const [formData, setFormData] = useState({ nome: '', email: '', password: '', mfaToken: '' });
  const [resetCode, setResetCode] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);

  const showNotif = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Usar path relativo para funcionar em qualquer ambiente
    const url = authMode === 'REGISTER' ? '/api/auth/register' : '/api/auth/login';
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || data.errors || data.message || 'Ocorreu um erro.');

      if (authMode === 'REGISTER') {
        setQrCode(data.mfa?.qrCodeUrl || data.qrCodeUrl);
        setFormData({ ...formData, password: '', mfaToken: '' });
      } else {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('meclinic_user', JSON.stringify(data.user));
        if (onLogin) onLogin(data.user);
        navigate('/dashboard');
      }
    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();
      if (response.ok) {
        showNotif('success', data.message);
        setAuthMode('FORGOT_CODE'); 
      } else { setError(data.error); }
    } catch (err) { setError("Erro ao enviar e-mail."); } 
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (formData.password !== confirmPassword) {
      showNotif('error', t('auth.reset.mismatch'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: resetCode, newPassword: formData.password })
      });
      const data = await response.json();
      if (response.ok) {
        showNotif('success', data.message);
        setAuthMode('LOGIN'); 
        setFormData({ ...formData, password: '', mfaToken: '' });
        setResetCode('');
        setConfirmPassword(''); 
      } else { setError(data.error); }
    } catch (err) { setError("Erro ao alterar palavra-passe."); } 
    finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', padding: '14px 14px 14px 45px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '15px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', marginBottom: '20px' };
  const iconStyle = { position: 'absolute', left: '15px', top: '15px', color: '#64748b' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.3s ease', position: 'relative', padding: '20px' }}>
      
      <button onClick={toggleTheme} style={{ position: 'absolute', top: '30px', right: '30px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text, padding: '12px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s' }}>
        {theme.isDark ? <Sun size={24} color="#fbbf24" /> : <Moon size={24} color="#64748b" />}
      </button>

      {notification.show && (
        <div style={{ position: 'fixed', top: '30px', backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '15px 25px', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.3s' }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span style={{ fontWeight: 'bold' }}>{notification.message}</span>
        </div>
      )}

      <div style={{ backgroundColor: theme.cardBg, padding: '50px 40px', borderRadius: '24px', width: '100%', maxWidth: '420px', boxShadow: theme.isDark ? '0 25px 50px -12px rgba(0,0,0,0.8)' : '0 25px 50px -12px rgba(0,0,0,0.1)', border: `1px solid ${theme.border}`, transition: 'all 0.3s ease' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img src={logo} alt="MeClinic Logo" style={{ height: '60px', marginBottom: '15px', filter: theme.isDark ? 'drop-shadow(0px 0px 2px rgba(255,255,255,0.3))' : 'none' }} />
          
          {authMode === 'REGISTER' && (
            <><h1 style={{ margin: '0 0 10px 0', color: theme.text, fontSize: '24px', fontWeight: '800' }}>{t('auth.register.title')}</h1>
            <p style={{ margin: 0, color: theme.subText, fontSize: '15px' }}>{t('auth.register.subtitle')}</p></>
          )}

          {authMode === 'LOGIN' && (
            <><h1 style={{ margin: '0 0 10px 0', color: theme.text, fontSize: '24px', fontWeight: '800' }}>{t('auth.login.title')}</h1>
            <p style={{ margin: 0, color: theme.subText, fontSize: '15px' }}>{t('auth.login.subtitle')}</p></>
          )}

          {authMode === 'FORGOT_EMAIL' && (
            <><h1 style={{ margin: '0 0 10px 0', color: theme.text, fontSize: '24px', fontWeight: '800' }}>{t('auth.forgot.title')}</h1>
            <p style={{ margin: 0, color: theme.subText, fontSize: '15px' }}>{t('auth.forgot.subtitle')}</p></>
          )}

          {authMode === 'FORGOT_CODE' && (
            <><h1 style={{ margin: '0 0 10px 0', color: theme.text, fontSize: '24px', fontWeight: '800' }}>{t('auth.reset.title')}</h1>
            <p style={{ margin: 0, color: theme.subText, fontSize: '15px' }}>{t('auth.reset.subtitle')}</p></>
          )}
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', border: '1px solid #f87171' }}>
            {error}
          </div>
        )}

        {qrCode && authMode === 'REGISTER' ? (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
            <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold' }}>{t('auth.success.created')}</div>
            <p style={{ color: theme.text, marginBottom: '20px' }}>{t('auth.success.mfa_desc')}</p>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', display: 'inline-block', marginBottom: '20px' }}>
              <img src={qrCode} alt="QR Code MFA" style={{ width: '200px', height: '200px' }} />
            </div>
            <button onClick={() => { setQrCode(null); setAuthMode('LOGIN'); }} style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
              {t('auth.success.btn_login')}
            </button>
          </div>
        ) : (
          
          <>
            {(authMode === 'LOGIN' || authMode === 'REGISTER') && (
              <form onSubmit={handleSubmit} style={{ animation: 'fadeIn 0.3s' }}>
                {authMode === 'REGISTER' && (
                  <div style={{ position: 'relative' }}>
                    <User size={20} style={iconStyle} />
                    <input type="text" name="nome" placeholder={t('auth.register.name')} value={formData.nome} onChange={handleChange} style={inputStyle} required />
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <Mail size={20} style={iconStyle} />
                  <input type="email" name="email" placeholder={t('auth.login.email')} value={formData.email} onChange={handleChange} style={inputStyle} required />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={20} style={iconStyle} />
                  <input type="password" name="password" placeholder={t('auth.login.pass')} value={formData.password} onChange={handleChange} style={inputStyle} required />
                </div>
                {authMode === 'LOGIN' && (
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <Shield size={20} style={iconStyle} />
                    <input type="text" name="mfaToken" placeholder={t('auth.login.mfa')} value={formData.mfaToken} onChange={handleChange} style={inputStyle} />
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', marginBottom: '20px' }}>
                  {loading ? <Activity className="animate-spin" size={20} /> : (authMode === 'REGISTER' ? t('auth.register.btn') : t('auth.login.btn'))}
                  {!loading && <ArrowRight size={20} />}
                </button>
                
                <div style={{ textAlign: 'center' }}>
                  {authMode === 'LOGIN' && (
                    <button type="button" onClick={() => { setAuthMode('FORGOT_EMAIL'); setError(''); }} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginBottom: '15px', display: 'block', width: '100%' }}>
                      {t('auth.login.forgot')}
                    </button>
                  )}
                  <button type="button" onClick={() => { setAuthMode(authMode === 'REGISTER' ? 'LOGIN' : 'REGISTER'); setError(''); setFormData({ nome: '', email: '', password: '', mfaToken: '' }); }} style={{ background: 'none', border: 'none', color: theme.subText, fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    {authMode === 'REGISTER' ? t('auth.switch.login') : t('auth.switch.register')}
                  </button>
                </div>
              </form>
            )}

            {authMode === 'FORGOT_EMAIL' && (
              <form onSubmit={handleForgotPassword} style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={20} style={iconStyle} />
                  <input type="email" placeholder={t('auth.login.email')} required style={inputStyle} value={formData.email} onChange={handleChange} name="email" />
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', backgroundColor: '#10b981', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: loading ? 0.7 : 1 }}>
                  {t('auth.forgot.btn')}
                </button>

                <div style={{ textAlign: 'center', marginTop: '25px' }}>
                  <button type="button" onClick={() => setAuthMode('LOGIN')} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', margin: '0 auto' }}>
                    <ArrowLeft size={16} /> {t('auth.forgot.back')}
                  </button>
                </div>
              </form>
            )}

            {authMode === 'FORGOT_CODE' && (
              <form onSubmit={handleResetPassword} style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ position: 'relative' }}>
                  <Key size={20} style={iconStyle} />
                  <input type="text" placeholder={t('auth.reset.code')} required style={{ ...inputStyle, letterSpacing: '2px', fontWeight: 'bold' }} value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))} maxLength="6" />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={20} style={iconStyle} />
                  <input type="password" placeholder={t('auth.reset.new_pass')} required style={inputStyle} value={formData.password} onChange={handleChange} name="password" />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={20} style={iconStyle} />
                  <input type="password" placeholder={t('auth.reset.confirm_pass')} required style={inputStyle} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} name="confirmPassword" />
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px', opacity: loading ? 0.7 : 1 }}>
                  {t('auth.reset.btn')}
                </button>

                <div style={{ textAlign: 'center', marginTop: '25px' }}>
                  <button type="button" onClick={() => setAuthMode('LOGIN')} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', margin: '0 auto' }}>
                    <ArrowLeft size={16} /> {t('auth.forgot.back')}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;