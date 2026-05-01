import React, { useState, useContext, useEffect } from 'react';
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
  const [userLocation, setUserLocation] = useState(null);

  // Pedir geolocalização ao carregar a página
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
              headers: { 'Accept-Language': 'pt' }
            });
            const geo = await resp.json();
            const city = geo.address?.city || geo.address?.town || geo.address?.village || '';
            const country = geo.address?.country || '';
            setUserLocation(city && country ? `${city}, ${country}` : country || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          } catch {
            setUserLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          }
        },
        () => { /* Permissão recusada — localização ficará como 'Desconhecido' no backend */ }
      );
    }
  }, []);

  const pwdRules = [
    { key: 'len',     label: 'Mínimo 7 caracteres',  test: v => v.length >= 7 },
    { key: 'upper',   label: '1 letra maiúscula',     test: v => /[A-Z]/.test(v) },
    { key: 'num',     label: '1 número',              test: v => /[0-9]/.test(v) },
    { key: 'special', label: '1 carácter especial',   test: v => /[^A-Za-z0-9]/.test(v) },
  ];
  const pwdValid = (v) => pwdRules.every(r => r.test(v));

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
        body: JSON.stringify({
          ...formData,
          ...(authMode === 'LOGIN' && userLocation ? { location: userLocation } : {}),
          // Omitir mfaToken se vazio para não falhar validação Joi
          ...(formData.mfaToken === '' ? { mfaToken: undefined } : {})
        })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || data.errors || data.message || 'Ocorreu um erro.');

      if (authMode === 'REGISTER') {
        if (!pwdValid(formData.password)) { setError('A palavra-passe não cumpre os requisitos de segurança.'); setLoading(false); return; }
        setQrCode(data.mfa?.qrCodeUrl || data.qrCodeUrl);
        setFormData({ ...formData, password: '', mfaToken: '' });
      } else {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
        if (data.sessionId) localStorage.setItem('meclinic_session_id', data.sessionId);
        localStorage.setItem('meclinic_user', JSON.stringify(data.user));
        localStorage.setItem('meclinic_login_at', new Date().toISOString());
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
    if (!pwdValid(formData.password)) {
      showNotif('error', 'A palavra-passe não cumpre os requisitos de segurança.');
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
    <div style={{
      minHeight: '100vh',
      background: theme.isDark
        ? '#060d1f'
        : 'radial-gradient(circle at 15% 15%, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0) 35%), radial-gradient(circle at 85% 20%, rgba(124,58,237,0.14) 0%, rgba(124,58,237,0) 35%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0) 35%), linear-gradient(135deg, #f8fbff 0%, #eef4ff 45%, #f4f0ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.3s ease',
      position: 'relative',
      padding: '20px',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes floatOrb { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-60px) scale(1.1)} 66%{transform:translate(-30px,40px) scale(0.95)} }
        @keyframes floatOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,40px) scale(0.9)} 66%{transform:translate(60px,-30px) scale(1.05)} }
        @keyframes floatOrb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,50px) scale(1.08)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      {/* Background orbs */}
      <div style={{ position:'fixed', top:'-10%', left:'-5%', width:'420px', height:'420px', borderRadius:'50%', background: theme.isDark ? 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(37,99,235,0.24) 0%, transparent 72%)', animation:'floatOrb 14s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'-5%', width:'500px', height:'500px', borderRadius:'50%', background: theme.isDark ? 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 72%)', animation:'floatOrb2 18s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', top:'40%', right:'15%', width:'300px', height:'300px', borderRadius:'50%', background: theme.isDark ? 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 72%)', animation:'floatOrb3 22s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', top:'20%', left:'20%', width:'250px', height:'250px', borderRadius:'50%', background: theme.isDark ? 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(245,158,11,0.14) 0%, transparent 72%)', animation:'floatOrb2 26s ease-in-out infinite reverse', pointerEvents:'none', zIndex:0 }} />
      
      <button onClick={toggleTheme} style={{ position: 'absolute', top: '30px', right: '30px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text, padding: '12px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s' }}>
        {theme.isDark ? <Sun size={24} color="#fbbf24" /> : <Moon size={24} color="#64748b" />}
      </button>

      {notification.show && (
        <div style={{ position: 'fixed', top: '30px', backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '15px 25px', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.3s' }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span style={{ fontWeight: 'bold' }}>{notification.message}</span>
        </div>
      )}

      <div style={{ backgroundColor: theme.cardBg, padding: '50px 40px', borderRadius: '24px', width: '100%', maxWidth: '420px', boxShadow: theme.isDark ? '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' : '0 25px 50px -12px rgba(0,0,0,0.12)', border: `1px solid ${theme.border}`, transition: 'all 0.3s ease', position: 'relative', zIndex: 1 }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img src={logo} alt="MeClinic Logo" style={{ height: '150px', marginBottom: '10px', filter: theme.isDark ? 'drop-shadow(0px 4px 12px rgba(180,120,60,0.5)) drop-shadow(0px 0px 3px rgba(255,255,255,0.15))' : 'drop-shadow(0px 4px 16px rgba(180,120,60,0.35))', transition: 'filter 0.3s' }} />
          
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
                {authMode === 'REGISTER' && formData.password.length > 0 && (() => {
                  const met = pwdRules.filter(r => r.test(formData.password)).length;
                  const strengthColor = met <= 1 ? '#ef4444' : met === 2 ? '#f59e0b' : met === 3 ? '#3b82f6' : '#10b981';
                  return (
                    <div style={{ marginTop: '-14px', marginBottom: '18px' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                        {[0,1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: i < met ? strengthColor : theme.border, transition: 'background-color 0.3s' }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {pwdRules.map(r => {
                          const ok = r.test(formData.password);
                          return (
                            <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `1.5px solid ${ok ? '#10b981' : theme.border}`, backgroundColor: ok ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                                {ok && <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1.5,4 3,5.5 6.5,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                              <span style={{ fontSize: '12px', color: ok ? theme.subText : theme.subText, opacity: ok ? 1 : 0.5, transition: 'opacity 0.2s' }}>{r.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
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
                {formData.password.length > 0 && (() => {
                  const met = pwdRules.filter(r => r.test(formData.password)).length;
                  const strengthColor = met <= 1 ? '#ef4444' : met === 2 ? '#f59e0b' : met === 3 ? '#3b82f6' : '#10b981';
                  return (
                    <div style={{ marginTop: '-14px', marginBottom: '18px' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                        {[0,1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: i < met ? strengthColor : theme.border, transition: 'background-color 0.3s' }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {pwdRules.map(r => {
                          const ok = r.test(formData.password);
                          return (
                            <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `1.5px solid ${ok ? '#10b981' : theme.border}`, backgroundColor: ok ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                                {ok && <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1.5,4 3,5.5 6.5,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                              <span style={{ fontSize: '12px', color: theme.subText, opacity: ok ? 1 : 0.5, transition: 'opacity 0.2s' }}>{r.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
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