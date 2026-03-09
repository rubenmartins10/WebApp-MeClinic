// client/src/pages/Settings.js
import React, { useState, useContext } from 'react';
import { User, Building, Shield, Bell, Save, CheckCircle, XCircle, Smartphone } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';

const Settings = () => {
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('perfil');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const user = JSON.parse(localStorage.getItem('meclinic_user') || '{}');

  const [perfilData, setPerfilData] = useState({ nome: user.nome || '', email: user.email || '', cargo: user.role || 'Assistente' });
  const [clinicaData, setClinicaData] = useState({ nome: 'MeClinic', nif: '501234567', telefone: '+351 912 345 678', morada: 'Avenida da Liberdade, Lisboa' });
  
  // ADICIONADO O CAMPO mfaToken
  const [segurancaData, setSegurancaData] = useState({ passwordAtual: '', novaPassword: '', confirmarPassword: '', mfaToken: '' });

  const showNotif = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // SE ESTIVER NA ABA DE SEGURANÇA, FAZ O PEDIDO REAL AO SERVIDOR
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
          // Limpa os campos de segurança após sucesso
          setSegurancaData({ passwordAtual: '', novaPassword: '', confirmarPassword: '', mfaToken: '' });
        } else {
          showNotif('error', data.error);
        }
      } catch (err) {
        showNotif('error', 'Erro ao ligar ao servidor.');
      }
      return; // Impede que o código abaixo (das outras abas) corra
    }

    // PARA AS OUTRAS ABAS (Simulação)
    showNotif('success', 'Definições guardadas com sucesso!');
  };

  const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, outline: 'none', fontSize: '15px', marginTop: '8px' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const tabStyle = (isActive) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', width: '100%', textAlign: 'left', border: 'none', background: isActive ? '#2563eb' : 'transparent', color: isActive ? 'white' : theme.text, borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease' });

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto' }}>
      
      {notification.show && (
        <div style={{ position: 'fixed', top: 30, right: 30, backgroundColor: notification.type === 'success' ? '#059669' : '#ef4444', color: 'white', padding: '15px 25px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 9999, fontWeight: 'bold' }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />} {notification.message}
        </div>
      )}

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 10px 0' }}>Definições</h1>
        <p style={{ color: theme.subText, margin: 0, fontSize: '16px' }}>Gere as tuas preferências, dados da clínica e segurança da conta.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '40px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setActiveTab('perfil')} style={tabStyle(activeTab === 'perfil')}><User size={20} /> O Meu Perfil</button>
          <button onClick={() => setActiveTab('clinica')} style={tabStyle(activeTab === 'clinica')}><Building size={20} /> Dados da Clínica</button>
          <button onClick={() => setActiveTab('seguranca')} style={tabStyle(activeTab === 'seguranca')}><Shield size={20} /> Segurança & MFA</button>
          <button onClick={() => setActiveTab('notificacoes')} style={tabStyle(activeTab === 'notificacoes')}><Bell size={20} /> Notificações</button>
        </div>

        <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, padding: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          
          <form onSubmit={handleSave}>
            
            {activeTab === 'perfil' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: '0 0 30px 0', borderBottom: `2px solid ${theme.border}`, paddingBottom: '15px' }}>O Meu Perfil</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                  <div><label style={labelStyle}>Nome Completo</label><input type="text" style={inputStyle} value={perfilData.nome} onChange={e => setPerfilData({...perfilData, nome: e.target.value})} /></div>
                  <div><label style={labelStyle}>Endereço de E-mail</label><input type="email" style={inputStyle} value={perfilData.email} disabled /><span style={{ fontSize: '11px', color: theme.subText, marginTop: '5px', display: 'block' }}>* O e-mail não pode ser alterado.</span></div>
                </div>
                <div><label style={labelStyle}>Cargo no Sistema</label><input type="text" style={{...inputStyle, backgroundColor: theme.pageBg, opacity: 0.7}} value={perfilData.cargo} disabled /></div>
              </div>
            )}

            {activeTab === 'clinica' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: '0 0 30px 0', borderBottom: `2px solid ${theme.border}`, paddingBottom: '15px' }}>Dados da Clínica</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                  <div><label style={labelStyle}>Nome da Clínica</label><input type="text" style={inputStyle} value={clinicaData.nome} onChange={e => setClinicaData({...clinicaData, nome: e.target.value})} /></div>
                  <div><label style={labelStyle}>NIF (Para Faturação)</label><input type="text" style={inputStyle} value={clinicaData.nif} onChange={e => setClinicaData({...clinicaData, nif: e.target.value})} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                  <div><label style={labelStyle}>Telefone Principal</label><input type="text" style={inputStyle} value={clinicaData.telefone} onChange={e => setClinicaData({...clinicaData, telefone: e.target.value})} /></div>
                  <div><label style={labelStyle}>Morada Completa</label><input type="text" style={inputStyle} value={clinicaData.morada} onChange={e => setClinicaData({...clinicaData, morada: e.target.value})} /></div>
                </div>
              </div>
            )}

            {activeTab === 'seguranca' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: '0 0 30px 0', borderBottom: `2px solid ${theme.border}`, paddingBottom: '15px' }}>Segurança</h2>
                
                <div style={{ backgroundColor: theme.isDark ? '#064e3b' : '#d1fae5', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', border: `1px solid ${theme.isDark ? '#059669' : '#10b981'}` }}>
                  <Smartphone size={30} color={theme.isDark ? '#34d399' : '#059669'} />
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: theme.isDark ? '#a7f3d0' : '#065f46' }}>Autenticação de 2 Fatores (MFA) Ativa</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: theme.isDark ? '#6ee7b7' : '#047857' }}>Precisas do teu telemóvel para alterar a palavra-passe.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Palavra-passe Atual</label>
                    <input type="password" style={inputStyle} placeholder="••••••••" value={segurancaData.passwordAtual} onChange={e => setSegurancaData({...segurancaData, passwordAtual: e.target.value})} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                    <div>
                      <label style={labelStyle}>Nova Palavra-passe</label>
                      <input type="password" style={inputStyle} placeholder="••••••••" value={segurancaData.novaPassword} onChange={e => setSegurancaData({...segurancaData, novaPassword: e.target.value})} />
                    </div>
                    <div>
                      <label style={labelStyle}>Confirmar Nova Palavra-passe</label>
                      <input type="password" style={inputStyle} placeholder="••••••••" value={segurancaData.confirmarPassword} onChange={e => setSegurancaData({...segurancaData, confirmarPassword: e.target.value})} />
                    </div>
                  </div>
                  
                  {/* NOVO CAMPO: AUTENTICADOR DO GOOGLE */}
                  <div style={{ marginTop: '10px' }}>
                    <label style={{...labelStyle, color: '#059669'}}>Código Google Authenticator</label>
                    <input 
                      type="text" 
                      maxLength="6"
                      style={{ ...inputStyle, borderColor: '#059669', borderWidth: '2px', fontWeight: 'bold', letterSpacing: '5px', fontSize: '18px' }} 
                      placeholder="123456" 
                      value={segurancaData.mfaToken} 
                      onChange={e => setSegurancaData({...segurancaData, mfaToken: e.target.value.replace(/\D/g, '')})} 
                    />
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: theme.subText }}>Abre a app Authenticator no telemóvel para obter o código de 6 dígitos.</p>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'notificacoes' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: '0 0 30px 0', borderBottom: `2px solid ${theme.border}`, paddingBottom: '15px' }}>Notificações e Alertas</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', padding: '15px', backgroundColor: theme.pageBg, borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                    <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#2563eb' }} />
                    <div><span style={{ fontWeight: 'bold', display: 'block' }}>Alertas de Stock Baixo</span><span style={{ fontSize: '12px', color: theme.subText }}>Avisa-me quando um material chegar ao limite mínimo.</span></div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', padding: '15px', backgroundColor: theme.pageBg, borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                    <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#2563eb' }} />
                    <div><span style={{ fontWeight: 'bold', display: 'block' }}>Resumo Semanal</span><span style={{ fontSize: '12px', color: theme.subText }}>Envia o relatório financeiro para o meu e-mail às sextas-feiras.</span></div>
                  </label>
                </div>
              </div>
            )}

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: `1px solid ${theme.border}` }}>
              <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 25px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 'bold' }}>
                <Save size={20} /> Guardar Alterações
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;