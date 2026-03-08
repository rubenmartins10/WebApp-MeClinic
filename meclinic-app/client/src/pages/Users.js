// client/src/pages/Users.js
import React, { useState, useContext } from 'react';
import { Search, Trash2, Shield, User, Circle, AlertCircle } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';

// CORREÇÃO: Foram removidos os imports do jsPDF e autoTable que não pertencem a esta página

const Users = () => {
  const { theme } = useContext(ThemeContext);
  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. António Silva', email: 'antonio.silva@meclinic.com', role: 'ADMIN', status: 'online', lastSeen: 'Agora mesmo' },
    { id: 2, name: 'Mariana Costa', email: 'mariana.costa@meclinic.com', role: 'ASSISTENTE', status: 'busy', lastSeen: 'Há 5 min' },
    { id: 3, name: 'João Pereira', email: 'joao.pereira@meclinic.com', role: 'ASSISTENTE', status: 'offline', lastSeen: 'Há 2 dias' },
    { id: 4, name: 'Dra. Sofia Martins', email: 'sofia.martins@meclinic.com', role: 'ADMIN', status: 'offline', lastSeen: 'Ontem' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('ADMIN'); 

  const handleDeleteUser = (id) => {
    if (window.confirm('Tem a certeza que deseja remover este acesso?')) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'online': return '#22c55e';
      case 'busy': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  // CORREÇÃO: Adicionada a função que estava a faltar para dar o nome da etiqueta
  const getStatusLabel = (status) => {
    switch(status) {
      case 'online': return 'Online';
      case 'busy': return 'Ocupado';
      case 'offline': return 'Offline';
      default: return 'Desconhecido';
    }
  };

  const styles = {
    headerContainer: { marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    pageTitle: { fontSize: '24px', fontWeight: '700', color: theme.text, margin: 0 },
    subTitle: { fontSize: '14px', color: theme.subText, marginTop: '5px' },
    roleToggleBtn: { padding: '8px 16px', backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
    controlBar: { backgroundColor: theme.cardBg, padding: '16px 20px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}` },
    searchWrapper: { position: 'relative', width: '300px' },
    searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' },
    searchInput: { width: '100%', padding: '10px 10px 10px 40px', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.pageBg, color: theme.text, fontSize: '14px', outline: 'none' },
    userCount: { fontSize: '13px', color: theme.subText, display: 'flex', alignItems: 'center', fontWeight: '500' },
    tableCard: { backgroundColor: theme.cardBg, borderRadius: '0 0 10px 10px', border: `1px solid ${theme.border}`, borderTop: 'none', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    tableHeaderRow: { backgroundColor: theme.tableHead, borderBottom: `1px solid ${theme.border}` },
    th: { padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: theme.subText, textTransform: 'uppercase' },
    thRight: { padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: theme.subText, textTransform: 'uppercase', textAlign: 'right' },
    tableRow: { borderBottom: `1px solid ${theme.border}` },
    td: { padding: '16px 24px', verticalAlign: 'middle', fontSize: '14px', color: theme.text },
    tdRight: { padding: '16px 24px', textAlign: 'right' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: theme.isDark ? '#1e3a8a' : '#dbeafe', color: theme.isDark ? '#bfdbfe' : '#1e40af', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
    userName: { fontWeight: '600', color: theme.text },
    userEmail: { fontSize: '12px', color: theme.subText },
    badgeAdmin: { display: 'inline-flex', alignItems: 'center', backgroundColor: theme.isDark ? '#4c1d95' : '#f3e8ff', color: theme.isDark ? '#ddd6fe' : '#6b21a8', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
    badgeAssist: { display: 'inline-flex', alignItems: 'center', backgroundColor: theme.isDark ? '#075985' : '#e0f2fe', color: theme.isDark ? '#bae6fd' : '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
    lastSeen: { fontSize: '12px', color: theme.subText },
    deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px' },
    warningBox: { marginTop: '20px', padding: '15px', backgroundColor: theme.isDark ? '#451a03' : '#fff7ed', border: `1px solid ${theme.isDark ? '#78350f' : '#ffedd5'}`, borderRadius: '8px', color: theme.isDark ? '#fdba74' : '#c2410c', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }
  };

  return (
    <div style={{ padding: '10px', transition: 'all 0.3s ease' }}>
      
      <div style={styles.headerContainer}>
        <div>
          <h1 style={styles.pageTitle}>Utilizadores e Acessos</h1>
          <p style={styles.subTitle}>Gerencie quem tem acesso ao sistema da clínica.</p>
        </div>
        <button onClick={() => setCurrentUserRole(currentUserRole === 'ADMIN' ? 'ASSISTENTE' : 'ADMIN')} style={styles.roleToggleBtn}>
          Simular: Sou {currentUserRole} (Mudar)
        </button>
      </div>

      <div style={styles.controlBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color={theme.subText} style={styles.searchIcon} />
          <input 
            type="text" placeholder="Procurar por nome ou email..." style={styles.searchInput}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={styles.userCount}>
          <User size={16} style={{marginRight: 5}}/> {users.length} Utilizadores Ativos
        </div>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.th}>UTILIZADOR</th>
              <th style={styles.th}>FUNÇÃO</th>
              <th style={styles.th}>ATIVIDADE</th>
              <th style={styles.th}>ÚLTIMO ACESSO</th>
              <th style={styles.thRight}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={styles.avatar}>{user.name.charAt(0)}</div>
                    <div>
                      <div style={styles.userName}>{user.name}</div>
                      <div style={styles.userEmail}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={user.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeAssist}>
                    {user.role === 'ADMIN' && <Shield size={12} style={{marginRight: 4}} />}
                    {user.role}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <Circle size={10} fill={getStatusColor(user.status)} stroke="none" />
                    <span style={{fontSize: '13px', color: theme.text}}>{getStatusLabel(user.status)}</span>
                  </div>
                </td>
                <td style={styles.td}><span style={styles.lastSeen}>{user.lastSeen}</span></td>
                <td style={styles.tdRight}>
                  {currentUserRole === 'ADMIN' ? (
                    <button style={styles.deleteBtn} onClick={() => handleDeleteUser(user.id)} title="Remover Acesso"><Trash2 size={18} /></button>
                  ) : (
                    <span style={{fontSize: '11px', color: theme.subText, fontStyle: 'italic'}}>Sem permissão</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentUserRole !== 'ADMIN' && (
        <div style={styles.warningBox}>
          <AlertCircle size={18} />
          <span>Modo de visualização: Apenas Administradores podem remover utilizadores.</span>
        </div>
      )}

    </div>
  );
};

export default Users;