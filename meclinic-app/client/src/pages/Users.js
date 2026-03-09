import React, { useState, useEffect, useContext } from 'react';
import { Shield, User, Trash2, Mail, Plus, Search, CheckCircle, XCircle, AlertTriangle, X, QrCode } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';

const Users = () => {
  const { theme } = useContext(ThemeContext);
  const [utilizadores, setUtilizadores] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [novoUser, setNovoUser] = useState({ nome: '', email: '', password: '', role: 'ASSISTENTE' });
  const [qrCodeCriado, setQrCodeCriado] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SABER QUEM ESTÁ LOGADO
  const currentUser = JSON.parse(localStorage.getItem('meclinic_user') || '{}');
  // VARIÁVEL MÁGICA DE SEGURANÇA
  const isCurrentUserAdmin = currentUser.role === 'ADMIN';

  useEffect(() => {
    carregarUtilizadores();
  }, []);

  const carregarUtilizadores = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/utilizadores');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setUtilizadores(data);
      } else {
        console.error("Erro retornado pelo backend:", data);
        setUtilizadores([]);
      }
    } catch (err) {
      console.error("Erro ao carregar utilizadores:", err);
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
      showNotif('error', 'Não podes apagar a tua própria conta enquanto tens sessão iniciada.');
      setShowDeleteConfirm(null);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/utilizadores/${showDeleteConfirm}`, { method: 'DELETE' });
      if (res.ok) {
        showNotif('success', 'Utilizador removido do sistema com sucesso.');
        carregarUtilizadores();
      } else {
        showNotif('error', 'Erro ao remover utilizador.');
      }
    } catch (err) {
      showNotif('error', 'Falha ao ligar ao servidor.');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/utilizadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoUser)
      });
      const data = await res.json();
      
      if (res.ok) {
        setQrCodeCriado(data.qrCodeUrl); 
        carregarUtilizadores();
        setNovoUser({ nome: '', email: '', password: '', role: 'ASSISTENTE' }); 
        showNotif('success', 'Membro adicionado com sucesso!');
      } else {
        showNotif('error', data.error || 'Erro ao criar utilizador.');
      }
    } catch (err) {
      showNotif('error', 'Erro de ligação ao servidor.');
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
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto' }}>
      
      {notification.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '40px', borderRadius: '20px', border: `1px solid ${theme.border}`, textAlign: 'center', minWidth: '350px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease-out' }}>
            {notification.type === 'success' ? <CheckCircle size={60} color="#059669" style={{ marginBottom: '20px' }} /> : <XCircle size={60} color="#ef4444" style={{ marginBottom: '20px' }} />}
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold', color: theme.isDark ? '#ffffff' : theme.text }}>
              {notification.type === 'success' ? 'Sucesso!' : 'Atenção'}
            </h2>
            <p style={{ margin: '0 0 30px 0', color: theme.subText, fontSize: '15px' }}>{notification.message}</p>
            <button onClick={() => setNotification({show: false})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: notification.type === 'success' ? '#059669' : '#ef4444', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              OK, entendi
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '15px', width: '350px', textAlign: 'center', border: `1px solid ${theme.border}` }}>
            <AlertTriangle size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>Remover Utilizador?</h2>
            <p style={{ color: theme.subText, marginBottom: '25px' }}>O acesso deste membro será revogado permanentemente.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#64748b', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarEliminacao} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>Remover</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && isCurrentUserAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, width: '450px', borderRadius: '20px', padding: '30px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px' }}>Novo Membro</h2>
              <button onClick={() => { setShowAddModal(false); setQrCodeCriado(null); }} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer' }}><X size={24} /></button>
            </div>

            {qrCodeCriado ? (
              <div style={{ textAlign: 'center' }}>
                <QrCode size={50} color="#059669" style={{ marginBottom: '15px' }} />
                <h3 style={{ margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>Segurança Obrigatória (MFA)</h3>
                <p style={{ color: theme.subText, fontSize: '13px', marginBottom: '20px' }}>O membro foi criado. Peça a essa pessoa para abrir a <strong>App Google Authenticator</strong> e ler este código agora mesmo.</p>
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '15px', display: 'inline-block', marginBottom: '25px' }}>
                  <img src={qrCodeCriado} alt="MFA QR Code" style={{ width: '200px', height: '200px' }} />
                </div>
                <button onClick={() => { setShowAddModal(false); setQrCodeCriado(null); }} style={{ width: '100%', padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Concluir Registo
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser}>
                <label style={labelStyle}>Nome Completo</label>
                <input required type="text" placeholder="Ex: Dra. Ana Silva" style={inputStyle} value={novoUser.nome} onChange={e => setNovoUser({...novoUser, nome: e.target.value})} />

                <label style={labelStyle}>Endereço de E-mail</label>
                <input required type="email" placeholder="ana.silva@meclinic.com" style={inputStyle} value={novoUser.email} onChange={e => setNovoUser({...novoUser, email: e.target.value})} />

                <label style={labelStyle}>Palavra-Passe Inicial</label>
                <input required type="text" placeholder="Uma password para o primeiro acesso..." style={inputStyle} value={novoUser.password} onChange={e => setNovoUser({...novoUser, password: e.target.value})} />

                <label style={labelStyle}>Função no Sistema (Acesso)</label>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                  <label style={{ flex: 1, border: `2px solid ${novoUser.role === 'ASSISTENTE' ? '#3b82f6' : theme.border}`, borderRadius: '10px', padding: '15px', cursor: 'pointer', textAlign: 'center', backgroundColor: novoUser.role === 'ASSISTENTE' ? 'rgba(59, 130, 246, 0.1)' : theme.pageBg }}>
                    <input type="radio" name="role" value="ASSISTENTE" checked={novoUser.role === 'ASSISTENTE'} onChange={() => setNovoUser({...novoUser, role: 'ASSISTENTE'})} style={{ display: 'none' }} />
                    <User size={24} color={novoUser.role === 'ASSISTENTE' ? '#3b82f6' : theme.subText} style={{ marginBottom: '5px' }} />
                    <div style={{ fontWeight: 'bold', color: novoUser.role === 'ASSISTENTE' ? '#3b82f6' : theme.text }}>Assistente</div>
                    <div style={{ fontSize: '11px', color: theme.subText, marginTop: '5px' }}>Agenda e Consultas</div>
                  </label>
                  <label style={{ flex: 1, border: `2px solid ${novoUser.role === 'ADMIN' ? '#8b5cf6' : theme.border}`, borderRadius: '10px', padding: '15px', cursor: 'pointer', textAlign: 'center', backgroundColor: novoUser.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.1)' : theme.pageBg }}>
                    <input type="radio" name="role" value="ADMIN" checked={novoUser.role === 'ADMIN'} onChange={() => setNovoUser({...novoUser, role: 'ADMIN'})} style={{ display: 'none' }} />
                    <Shield size={24} color={novoUser.role === 'ADMIN' ? '#8b5cf6' : theme.subText} style={{ marginBottom: '5px' }} />
                    <div style={{ fontWeight: 'bold', color: novoUser.role === 'ADMIN' ? '#8b5cf6' : theme.text }}>Admin</div>
                    <div style={{ fontSize: '11px', color: theme.subText, marginTop: '5px' }}>Acesso Total e Financeiro</div>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#64748b', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? 'A Criar...' : 'Criar Membro'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>Acessos e Equipa</h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>Gere quem tem acesso ao sistema da clínica.</p>
        </div>
        
        {/* BLOQUEIO DE SEGURANÇA: Só renderiza o botão se for ADMIN */}
        {isCurrentUserAdmin && (
          <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}>
            <Plus size={20} /> Adicionar Membro
          </button>
        )}
      </div>

      <div style={{ marginBottom: '30px', position: 'relative', maxWidth: '400px' }}>
        <Search size={20} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '14px' }} />
        <input 
          type="text" 
          placeholder="Pesquisar por nome ou email..." 
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
                <span style={{ fontSize: '11px', color: theme.subText, fontWeight: 'bold' }}>{currentUser.id === u.id ? 'TU' : 'OFFLINE'}</span>
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
                  <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{u.role || 'ASSISTENTE'}</span>
                </div>

                {/* BLOQUEIO DE SEGURANÇA: Só Admins podem apagar os outros */}
                {isCurrentUserAdmin && currentUser.id !== u.id && (
                  <button 
                    onClick={() => setShowDeleteConfirm(u.id)}
                    style={{ width: '35px', height: '35px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { backgroundColor: '#fee2e2' })}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent' })}
                    title="Remover Utilizador"
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
            <p>Nenhum utilizador encontrado com essa pesquisa.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Users;