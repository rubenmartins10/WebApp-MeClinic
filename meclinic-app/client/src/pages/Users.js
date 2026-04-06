import React, { useState, useEffect, useContext } from 'react';
import { Shield, User, Trash2, Mail, Plus, Search, CheckCircle, XCircle, AlertTriangle, X, QrCode } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { LanguageContext } from '../contexts/LanguageContext'; // <-- Importar o motor de idiomas
import apiService from '../services/api';

const Users = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext); // <-- Tradutor

  const [utilizadores, setUtilizadores] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [novoUser, setNovoUser] = useState({ nome: '', email: '', password: '', role: 'ASSISTENTE' });
  const [qrCodeCriado, setQrCodeCriado] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('meclinic_user') || '{}'); } catch { return {}; } })();
  const isCurrentUserAdmin = currentUser.role === 'ADMIN';

  useEffect(() => {
    carregarUtilizadores();
  }, []);

  const carregarUtilizadores = async () => {
    try {
      const data = await apiService.get('/api/utilizadores');
      setUtilizadores(Array.isArray(data) ? data : []);
    } catch {
      setUtilizadores([]);
    }
  };

  const showNotif = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };

  const confirmarEliminacao = async () => {
    if (!showDeleteConfirm) return;
    
    if (showDeleteConfirm === currentUser.id) {
      showNotif('error', t('users.msg.del_self'));
      setShowDeleteConfirm(null);
      return;
    }

    try {
      await apiService.delete(`/api/utilizadores/${showDeleteConfirm}`);
      showNotif('success', t('users.msg.removed'));
      carregarUtilizadores();
    } catch (err) {
      showNotif('error', t('users.msg.remove_err'));
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await apiService.post('/api/utilizadores', novoUser);
      setQrCodeCriado(data.qrCodeUrl); 
      carregarUtilizadores();
      setNovoUser({ nome: '', email: '', password: '', role: 'ASSISTENTE' }); 
      showNotif('success', t('users.msg.added'));
    } catch (err) {
      showNotif('error', err.message || t('users.msg.add_err'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, outline: 'none', marginBottom: '15px' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: theme.subText, marginBottom: '6px', textTransform: 'uppercase' };

  const utilizadoresFiltrados = (utilizadores || []).filter(u => 
    u.nome.toLowerCase().includes(pesquisa.toLowerCase()) || 
    u.email.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1400px', margin: '0 auto' }}>
      
      {notification.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '40px', borderRadius: '20px', border: `1px solid ${theme.border}`, textAlign: 'center', minWidth: '350px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease-out' }}>
            {notification.type === 'success' ? <CheckCircle size={60} color="#059669" style={{ marginBottom: '20px' }} /> : <XCircle size={60} color="#ef4444" style={{ marginBottom: '20px' }} />}
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold', color: theme.isDark ? '#ffffff' : theme.text }}>
              {notification.type === 'success' ? t('inventory.alert.success') : t('inventory.alert.warning')}
            </h2>
            <p style={{ margin: '0 0 30px 0', color: theme.subText, fontSize: '15px' }}>{notification.message}</p>
            <button onClick={() => setNotification({show: false})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: notification.type === 'success' ? '#059669' : '#ef4444', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t('inventory.alert.btn_ok')}
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '15px', width: '350px', textAlign: 'center', border: `1px solid ${theme.border}` }}>
            <AlertTriangle size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>{t('users.delete.title')}</h2>
            <p style={{ color: theme.subText, marginBottom: '25px' }}>{t('users.delete.desc')}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#64748b', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>{t('users.delete.cancel')}</button>
              <button onClick={confirmarEliminacao} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>{t('users.delete.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && isCurrentUserAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, width: '450px', borderRadius: '20px', padding: '30px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px' }}>{t('users.modal.title')}</h2>
              <button onClick={() => { setShowAddModal(false); setQrCodeCriado(null); }} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer' }}><X size={24} /></button>
            </div>

            {qrCodeCriado ? (
              <div style={{ textAlign: 'center' }}>
                <QrCode size={50} color="#059669" style={{ marginBottom: '15px' }} />
                <h3 style={{ margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>{t('users.mfa.title')}</h3>
                <p style={{ color: theme.subText, fontSize: '13px', marginBottom: '20px' }}>{t('users.mfa.desc')}</p>
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '15px', display: 'inline-block', marginBottom: '25px' }}>
                  <img src={qrCodeCriado} alt="MFA QR Code" style={{ width: '200px', height: '200px' }} />
                </div>
                <button onClick={() => { setShowAddModal(false); setQrCodeCriado(null); }} style={{ width: '100%', padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {t('users.mfa.btn')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser}>
                <label style={labelStyle}>{t('users.modal.name')}</label>
                <input required type="text" placeholder={t('users.modal.name_ph')} style={inputStyle} value={novoUser.nome} onChange={e => setNovoUser({...novoUser, nome: e.target.value})} />

                <label style={labelStyle}>{t('users.modal.email')}</label>
                <input required type="email" placeholder={t('users.modal.email_ph')} style={inputStyle} value={novoUser.email} onChange={e => setNovoUser({...novoUser, email: e.target.value})} />

                <label style={labelStyle}>{t('users.modal.pass')}</label>
                <input required type="text" placeholder={t('users.modal.pass_ph')} style={inputStyle} value={novoUser.password} onChange={e => setNovoUser({...novoUser, password: e.target.value})} />

                <label style={labelStyle}>{t('users.modal.role')}</label>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                  <label style={{ flex: 1, border: `2px solid ${novoUser.role === 'ASSISTENTE' ? '#3b82f6' : theme.border}`, borderRadius: '10px', padding: '15px', cursor: 'pointer', textAlign: 'center', backgroundColor: novoUser.role === 'ASSISTENTE' ? 'rgba(59, 130, 246, 0.1)' : theme.pageBg }}>
                    <input type="radio" name="role" value="ASSISTENTE" checked={novoUser.role === 'ASSISTENTE'} onChange={() => setNovoUser({...novoUser, role: 'ASSISTENTE'})} style={{ display: 'none' }} />
                    <User size={24} color={novoUser.role === 'ASSISTENTE' ? '#3b82f6' : theme.subText} style={{ marginBottom: '5px' }} />
                    <div style={{ fontWeight: 'bold', color: novoUser.role === 'ASSISTENTE' ? '#3b82f6' : theme.text }}>{t('users.card.role.assistant')}</div>
                    <div style={{ fontSize: '11px', color: theme.subText, marginTop: '5px' }}>{t('users.modal.role.assistant_desc')}</div>
                  </label>
                  <label style={{ flex: 1, border: `2px solid ${novoUser.role === 'ADMIN' ? '#8b5cf6' : theme.border}`, borderRadius: '10px', padding: '15px', cursor: 'pointer', textAlign: 'center', backgroundColor: novoUser.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.1)' : theme.pageBg }}>
                    <input type="radio" name="role" value="ADMIN" checked={novoUser.role === 'ADMIN'} onChange={() => setNovoUser({...novoUser, role: 'ADMIN'})} style={{ display: 'none' }} />
                    <Shield size={24} color={novoUser.role === 'ADMIN' ? '#8b5cf6' : theme.subText} style={{ marginBottom: '5px' }} />
                    <div style={{ fontWeight: 'bold', color: novoUser.role === 'ADMIN' ? '#8b5cf6' : theme.text }}>{t('users.card.role.admin')}</div>
                    <div style={{ fontSize: '11px', color: theme.subText, marginTop: '5px' }}>{t('users.modal.role.admin_desc')}</div>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#64748b', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>{t('users.modal.cancel')}</button>
                  <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? t('users.modal.creating') : t('users.modal.create')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>{t('users.title')}</h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>{t('users.subtitle')}</p>
        </div>
        
        {isCurrentUserAdmin && (
          <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}>
            <Plus size={20} /> {t('users.btn.add')}
          </button>
        )}
      </div>

      <div style={{ marginBottom: '30px', position: 'relative', maxWidth: '400px' }}>
        <Search size={20} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '14px' }} />
        <input 
          type="text" 
          placeholder={t('users.search.placeholder')} 
          style={{ width: '100%', padding: '14px 15px 14px 45px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, outline: 'none', fontSize: '15px' }}
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
        {utilizadoresFiltrados.map(u => {
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome)}&background=2563eb&color=fff&rounded=true&bold=true&size=128`;
          const isThisCardAdmin = u.role === 'ADMIN';

          return (
            <div key={u.id} style={{ backgroundColor: theme.cardBg, borderRadius: '20px', border: `1px solid ${theme.border}`, padding: '25px', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              
              <div style={{ position: 'absolute', top: '25px', right: '25px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: currentUser.id === u.id ? '#10b981' : '#64748b' }}></span>
                <span style={{ fontSize: '11px', color: theme.subText, fontWeight: 'bold' }}>{currentUser.id === u.id ? t('users.card.you') : t('users.card.offline')}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '25px', marginTop: '10px' }}>
                <img src={avatarUrl} alt={u.nome} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '15px', border: `4px solid ${theme.pageBg}` }} />
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: theme.isDark ? '#ffffff' : theme.text }}>{u.nome}</h3>
                <p style={{ margin: 0, color: theme.subText, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} /> {u.email}
                </p>
              </div>

              <div style={{ height: '1px', backgroundColor: theme.border, marginBottom: '20px', width: '100%' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', backgroundColor: isThisCardAdmin ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: isThisCardAdmin ? '#a78bfa' : '#60a5fa', border: `1px solid ${isThisCardAdmin ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)'}` }}>
                  {isThisCardAdmin ? <Shield size={14} /> : <User size={14} />}
                  <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    {isThisCardAdmin ? t('users.card.role.admin') : t('users.card.role.assistant')}
                  </span>
                </div>

                {isCurrentUserAdmin && currentUser.id !== u.id && (
                  <button 
                    onClick={() => setShowDeleteConfirm(u.id)}
                    style={{ width: '35px', height: '35px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { backgroundColor: '#fee2e2' })}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent' })}
                    title={t('users.card.tooltip.remove')}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

            </div>
          );
        })}

        {utilizadoresFiltrados.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: theme.subText }}>
            <User size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p>{t('users.empty')}</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Users;