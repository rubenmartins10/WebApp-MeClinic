import React, { useState, useContext } from 'react';
import { User, Building, Shield, Bell, Save, CheckCircle, XCircle, Smartphone, Moon, Sun, Globe, Clock, Key, Mail, Phone, MapPin, FileText, ShieldAlert } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';

const Settings = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('perfil');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const user = JSON.parse(localStorage.getItem('meclinic_user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  const [perfilData, setPerfilData] = useState({ nome: user.nome || '', email: user.email || '', cargo: user.role || 'Assistente', idioma: 'pt-PT' });
  const [segurancaData, setSegurancaData] = useState({ passwordAtual: '', novaPassword: '', confirmarPassword: '', mfaToken: '' });
  const [notificacoesData, setNotificacoesData] = useState({ stock: true, relatorios: true, consultas: false, marketing: false });
  
  // Dados da Clínica
  const [clinicaData, setClinicaData] = useState(() => {
    const saved = localStorage.getItem('meclinic_settings');
    return saved ? JSON.parse(saved) : { nome: 'MeClinic', nif: '501234567', telefone: '+351 912 345 678', email: 'geral@meclinic.pt', morada: 'Avenida da Liberdade, Lisboa\nPortugal', timezone: 'Europe/Lisbon' };
  });

  const showNotif = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (activeTab === 'seguranca') {
      if (!segurancaData.passwordAtual || !segurancaData.novaPassword || !segurancaData.confirmarPassword) {
        showNotif('error', 'Preencha todos os campos da palavra-passe.');
        return;
      }
      if (segurancaData.novaPassword !== segurancaData.confirmarPassword) {
        showNotif('error', 'A nova palavra-passe e a confirmação não coincidem.');
        return;
      }
      if (!segurancaData.mfaToken) {
        showNotif('error', 'Por favor, insira o código do Google Authenticator.');
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            currentPassword: segurancaData.passwordAtual,
            newPassword: segurancaData.novaPassword,
            mfaToken: segurancaData.mfaToken
          })
        });

        const data = await response.json();

        if (response.ok) {
          showNotif('success', data.message);
          setSegurancaData({ passwordAtual: '', novaPassword: '', confirmarPassword: '', mfaToken: '' });
        } else {
          showNotif('error', data.error);
        }
      } catch (err) {
        showNotif('error', 'Erro ao ligar ao servidor.');
      }
      return; 
    }

    if (activeTab === 'clinica') {
      if (!isAdmin) return; // Segurança extra
      localStorage.setItem('meclinic_settings', JSON.stringify(clinicaData));
      showNotif('success', 'Dados da entidade atualizados com sucesso!');
      return;
    }

    showNotif('success', 'Definições guardadas com sucesso!');
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome || 'User')}&background=2563eb&color=fff&rounded=true&bold=true&size=128`;

  const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, outline: 'none', fontSize: '15px', marginTop: '8px', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.5px' };
  
  const tabStyle = (isActive) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', width: '100%', textAlign: 'left', border: 'none', backgroundColor: isActive ? (theme.isDark ? '#1e3a8a' : '#dbeafe') : 'transparent', color: isActive ? '#2563eb' : theme.text, borderRadius: '10px', cursor: 'pointer', fontWeight: isActive ? 'bold' : 'normal', transition: 'all 0.2s ease', marginBottom: '5px' });

  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: theme.pageBg, borderRadius: '12px', border: `1px solid ${theme.border}`, marginBottom: '15px' }}>
      <div>
        <span style={{ fontWeight: 'bold', display: 'block', color: theme.isDark ? '#ffffff' : theme.text, marginBottom: '5px' }}>{label}</span>
        <span style={{ fontSize: '12px', color: theme.subText, lineHeight: '1.4', display: 'block' }}>{description}</span>
      </div>
      <div 
        onClick={onChange} 
        style={{ width: '46px', height: '26px', backgroundColor: checked ? '#10b981' : (theme.isDark ? '#475569' : '#cbd5e1'), borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s' }}
      >
        <div style={{ width: '22px', height: '22px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: checked ? '22px' : '2px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto' }}>
      
      {notification.show && (
        <div style={{ position: 'fixed', top: 30, right: 30, backgroundColor: notification.type === 'success' ? '#059669' : '#ef4444', color: 'white', padding: '15px 25px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 9999, fontWeight: 'bold', animation: 'fadeIn 0.3s ease-out' }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />} {notification.message}
        </div>
      )}

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>Definições Gerais</h1>
        <p style={{ color: theme.subText, margin: 0, fontSize: '16px' }}>Gere as tuas preferências, interface e segurança da conta.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '40px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => setActiveTab('perfil')} style={tabStyle(activeTab === 'perfil')}><User size={18} /> O Meu Perfil</button>
          <button onClick={() => setActiveTab('seguranca')} style={tabStyle(activeTab === 'seguranca')}><Shield size={18} /> Segurança & MFA</button>
          <button onClick={() => setActiveTab('aparencia')} style={tabStyle(activeTab === 'aparencia')}><Moon size={18} /> Aparência e Interface</button>
          <button onClick={() => setActiveTab('notificacoes')} style={tabStyle(activeTab === 'notificacoes')}><Bell size={18} /> Notificações</button>
          
          <div style={{ height: '1px', backgroundColor: theme.border, margin: '15px 0' }}></div>
          <button onClick={() => setActiveTab('clinica')} style={tabStyle(activeTab === 'clinica')}><Building size={18} /> Dados da Clínica</button>
        </div>

        <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, padding: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '500px' }}>
          
          <form onSubmit={handleSave}>
            
            {activeTab === 'perfil' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: '0 0 30px 0', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px', color: theme.isDark ? '#ffffff' : theme.text }}>O Meu Perfil</h2>
                
                <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', border: `4px solid ${theme.pageBg}` }} />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ padding: '6px 12px', borderRadius: '20px', backgroundColor: isAdmin ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: isAdmin ? '#a78bfa' : '#60a5fa', fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.5px', alignSelf: 'flex-start', marginBottom: '10px' }}>
                      {perfilData.cargo}
                    </div>
                    <p style={{ margin: 0, color: theme.subText, fontSize: '13px' }}>A tua fotografia é gerada automaticamente com base no teu nome.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                  <div>
                    <label style={labelStyle}>Nome Completo</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                      <input type="text" style={{ ...inputStyle, paddingLeft: '45px', opacity: 0.7, cursor: 'not-allowed' }} value={perfilData.nome} readOnly disabled />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Endereço de E-mail</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                      <input type="email" style={{ ...inputStyle, paddingLeft: '45px', opacity: 0.7, cursor: 'not-allowed' }} value={perfilData.email} readOnly disabled />
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '-10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Shield size={14} /> Contacta o Administrador para alterar dados sensíveis da conta.
                </p>
              </div>
            )}

            {activeTab === 'seguranca' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: '0 0 30px 0', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px', color: theme.isDark ? '#ffffff' : theme.text }}>Segurança & Autenticação</h2>
                
                <div style={{ backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#d1fae5', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', border: `1px solid rgba(16, 185, 129, 0.3)` }}>
                  <Smartphone size={32} color="#10b981" />
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: theme.isDark ? '#34d399' : '#065f46', fontSize: '16px' }}>Autenticação de 2 Fatores (MFA) Ativa</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: theme.isDark ? '#a7f3d0' : '#047857' }}>A tua conta está protegida. O telemóvel é obrigatório para fazer alterações.</p>
                  </div>
                </div>

                <div style={{ maxWidth: '500px' }}>
                  <label style={labelStyle}>Palavra-passe Atual</label>
                  <div style={{ position: 'relative', marginBottom: '25px' }}>
                    <Key size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                    <input type="password" style={{ ...inputStyle, paddingLeft: '45px' }} placeholder="••••••••" value={segurancaData.passwordAtual} onChange={e => setSegurancaData({...segurancaData, passwordAtual: e.target.value})} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                    <div>
                      <label style={labelStyle}>Nova Palavra-passe</label>
                      <input type="password" style={inputStyle} placeholder="Mín. 8 caracteres" value={segurancaData.novaPassword} onChange={e => setSegurancaData({...segurancaData, novaPassword: e.target.value})} />
                    </div>
                    <div>
                      <label style={labelStyle}>Confirmar Nova</label>
                      <input type="password" style={inputStyle} placeholder="Repita a password" value={segurancaData.confirmarPassword} onChange={e => setSegurancaData({...segurancaData, confirmarPassword: e.target.value})} />
                    </div>
                  </div>

                  <label style={{ ...labelStyle, color: '#10b981' }}>Código Google Authenticator</label>
                  <input 
                    type="text" 
                    maxLength="6"
                    style={{ ...inputStyle, borderColor: '#10b981', borderWidth: '2px', fontWeight: 'bold', letterSpacing: '8px', fontSize: '20px', textAlign: 'center', backgroundColor: theme.pageBg, marginBottom: '10px' }} 
                    placeholder="123456" 
                    value={segurancaData.mfaToken} 
                    onChange={e => setSegurancaData({...segurancaData, mfaToken: e.target.value.replace(/\D/g, '')})} 
                  />
                  <p style={{ margin: '0', fontSize: '12px', color: theme.subText, textAlign: 'center' }}>Insere o código de 6 dígitos gerado pela aplicação.</p>
                </div>
              </div>
            )}

            {activeTab === 'aparencia' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: '0 0 30px 0', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px', color: theme.isDark ? '#ffffff' : theme.text }}>Aparência e Interface</h2>
                
                <h3 style={{ fontSize: '14px', color: theme.subText, textTransform: 'uppercase', marginBottom: '15px' }}>Tema do Sistema</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                  <div onClick={() => theme.isDark && toggleTheme && toggleTheme()} style={{ padding: '25px', borderRadius: '16px', border: `2px solid ${!theme.isDark ? '#2563eb' : theme.border}`, backgroundColor: '#ffffff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', position: 'relative' }}>
                    {!theme.isDark && <div style={{ position: 'absolute', top: '15px', right: '15px', color: '#2563eb' }}><CheckCircle size={24} /></div>}
                    <Sun size={36} color="#f59e0b" style={{ margin: '0 auto 15px auto' }} />
                    <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '16px' }}>Modo Claro</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Design limpo para ambientes iluminados.</p>
                  </div>

                  <div onClick={() => !theme.isDark && toggleTheme && toggleTheme()} style={{ padding: '25px', borderRadius: '16px', border: `2px solid ${theme.isDark ? '#2563eb' : theme.border}`, backgroundColor: '#0f172a', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', position: 'relative' }}>
                    {theme.isDark && <div style={{ position: 'absolute', top: '15px', right: '15px', color: '#2563eb' }}><CheckCircle size={24} /></div>}
                    <Moon size={36} color="#60a5fa" style={{ margin: '0 auto 15px auto' }} />
                    <h3 style={{ margin: '0 0 5px 0', color: '#ffffff', fontSize: '16px' }}>Modo Escuro</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Ambiente focado que descansa a vista.</p>
                  </div>
                </div>

                <h3 style={{ fontSize: '14px', color: theme.subText, textTransform: 'uppercase', marginBottom: '15px' }}>Localização</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                  <div>
                    <label style={labelStyle}>Idioma da Interface</label>
                    <div style={{ position: 'relative' }}>
                      <Globe size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                      <select style={{ ...inputStyle, paddingLeft: '45px', appearance: 'none' }} value={perfilData.idioma} onChange={e => setPerfilData({...perfilData, idioma: e.target.value})}>
                        <option value="pt-PT">Português (Portugal)</option>
                        <option value="en-US">English (United States)</option>
                        <option value="es-ES">Español (España)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Formato de Hora</label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                      <select style={{ ...inputStyle, paddingLeft: '45px', appearance: 'none' }}>
                        <option value="24h">24 Horas (14:30)</option>
                        <option value="12h">12 Horas (02:30 PM)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notificacoes' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: '0 0 30px 0', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px', color: theme.isDark ? '#ffffff' : theme.text }}>Preferências de Alertas</h2>
                
                <ToggleSwitch 
                  label="Alertas de Stock Baixo" 
                  description="Recebe notificações na plataforma quando um material atinge o limite mínimo definido no inventário."
                  checked={notificacoesData.stock} 
                  onChange={() => setNotificacoesData({...notificacoesData, stock: !notificacoesData.stock})} 
                />
                
                <ToggleSwitch 
                  label="Resumo Financeiro Semanal" 
                  description="Envia um PDF com o relatório de faturação para o teu e-mail de forma automática todas as sextas-feiras."
                  checked={notificacoesData.relatorios} 
                  onChange={() => setNotificacoesData({...notificacoesData, relatorios: !notificacoesData.relatorios})} 
                />

                <ToggleSwitch 
                  label="Lembretes de Consultas" 
                  description="Recebe um aviso no telemóvel/computador 15 minutos antes de uma consulta começar."
                  checked={notificacoesData.consultas} 
                  onChange={() => setNotificacoesData({...notificacoesData, consultas: !notificacoesData.consultas})} 
                />
              </div>
            )}

            {activeTab === 'clinica' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px', marginBottom: '30px' }}>
                  <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>Dados Oficiais da Entidade</h2>
                  {!isAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '12px', fontWeight: 'bold', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                      <ShieldAlert size={14} /> Modo Leitura
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                  {/* Cartão Visual à Esquerda */}
                  <div style={{ width: '250px', backgroundColor: theme.pageBg, borderRadius: '12px', border: `1px solid ${theme.border}`, padding: '20px', textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto' }}>
                      <Building size={30} color="#2563eb" />
                    </div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: theme.isDark ? '#ffffff' : theme.text }}>{clinicaData.nome}</h3>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: theme.subText, backgroundColor: theme.cardBg, padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>NIF: {clinicaData.nif}</div>
                  </div>

                  {/* Formulário à Direita */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={labelStyle}>Nome da Entidade</label>
                        <div style={{ position: 'relative' }}>
                          <FileText size={16} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                          <input type="text" style={{ ...inputStyle, paddingLeft: '45px', opacity: isAdmin ? 1 : 0.6 }} value={clinicaData.nome} onChange={e => setClinicaData({...clinicaData, nome: e.target.value})} readOnly={!isAdmin} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>NIF</label>
                        <input type="text" maxLength="9" style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.6 }} value={clinicaData.nif} onChange={e => setClinicaData({...clinicaData, nif: e.target.value.replace(/\D/g, '')})} readOnly={!isAdmin} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={labelStyle}>Telefone Principal</label>
                        <div style={{ position: 'relative' }}>
                          <Phone size={16} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                          <input type="text" style={{ ...inputStyle, paddingLeft: '45px', opacity: isAdmin ? 1 : 0.6 }} value={clinicaData.telefone} onChange={e => setClinicaData({...clinicaData, telefone: e.target.value})} readOnly={!isAdmin} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>E-mail Geral</label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={16} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                          <input type="email" style={{ ...inputStyle, paddingLeft: '45px', opacity: isAdmin ? 1 : 0.6 }} value={clinicaData.email} onChange={e => setClinicaData({...clinicaData, email: e.target.value})} readOnly={!isAdmin} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Morada Completa</label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={16} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                        <textarea rows="3" style={{ ...inputStyle, paddingLeft: '45px', resize: 'none', opacity: isAdmin ? 1 : 0.6 }} value={clinicaData.morada} onChange={e => setClinicaData({...clinicaData, morada: e.target.value})} readOnly={!isAdmin} />
                      </div>
                      <p style={{ fontSize: '11px', color: theme.subText, marginTop: '-10px' }}>Esta informação é utilizada no cabeçalho das Fichas Técnicas e Relatórios.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BOTÃO DE GUARDAR (Não aparece na aba da Clínica se não fores Admin) */}
            {!(activeTab === 'clinica' && !isAdmin) && (
              <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end', paddingTop: '25px', borderTop: `1px solid ${theme.border}` }}>
                <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '14px 28px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 'bold', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
                  <Save size={18} /> {activeTab === 'seguranca' ? 'Atualizar Segurança' : 'Guardar Alterações'}
                </button>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;