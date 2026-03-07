import React, { useState } from 'react';
import { Search, Trash2, Shield, User, Circle, AlertCircle } from 'lucide-react';

const Users = () => {
  // --- SIMULAÇÃO DE DADOS ---
  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. António Silva', email: 'antonio.silva@meclinic.com', role: 'ADMIN', status: 'online', lastSeen: 'Agora mesmo' },
    { id: 2, name: 'Mariana Costa', email: 'mariana.costa@meclinic.com', role: 'ASSISTENTE', status: 'busy', lastSeen: 'Há 5 min' },
    { id: 3, name: 'João Pereira', email: 'joao.pereira@meclinic.com', role: 'ASSISTENTE', status: 'offline', lastSeen: 'Há 2 dias' },
    { id: 4, name: 'Dra. Sofia Martins', email: 'sofia.martins@meclinic.com', role: 'ADMIN', status: 'offline', lastSeen: 'Ontem' },
  ]);

  // --- ESTADO DA PÁGINA ---
  const [searchTerm, setSearchTerm] = useState('');
  
  // ESTADO PARA TESTE: Mude isto para 'ASSISTENTE' para ver os botões sumirem
  const [currentUserRole, setCurrentUserRole] = useState('ADMIN'); 

  // --- LÓGICA ---
  const handleDeleteUser = (id) => {
    if (window.confirm('Tem a certeza que deseja remover este acesso?')) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função auxiliar para cor do status
  const getStatusColor = (status) => {
    switch(status) {
      case 'online': return '#22c55e'; // Verde
      case 'busy': return '#ef4444';   // Vermelho
      default: return '#9ca3af';       // Cinza
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'online': return 'Online';
      case 'busy': return 'Ocupado';
      default: return 'Offline';
    }
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* CABEÇALHO */}
      <div style={styles.headerContainer}>
        <div>
          <h1 style={styles.pageTitle}>Utilizadores e Acessos</h1>
          <p style={styles.subTitle}>Gerencie quem tem acesso ao sistema da clínica.</p>
        </div>

        {/* BOTÃO DE TESTE (APENAS PARA DEMONSTRAÇÃO) */}
        <button 
          onClick={() => setCurrentUserRole(currentUserRole === 'ADMIN' ? 'ASSISTENTE' : 'ADMIN')}
          style={styles.roleToggleBtn}
        >
          Simular: Sou {currentUserRole} (Mudar)
        </button>
      </div>

      {/* BARRA DE CONTROLO */}
      <div style={styles.controlBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#9ca3af" style={styles.searchIcon} />
          <input 
            type="text"
            placeholder="Procurar por nome ou email..."
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={styles.userCount}>
          <User size={16} style={{marginRight: 5}}/>
          {users.length} Utilizadores Ativos
        </div>
      </div>

      {/* TABELA DE UTILIZADORES */}
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
                {/* Coluna Nome + Email */}
                <td style={styles.td}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={styles.avatar}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div style={styles.userName}>{user.name}</div>
                      <div style={styles.userEmail}>{user.email}</div>
                    </div>
                  </div>
                </td>

                {/* Coluna Função (Badge) */}
                <td style={styles.td}>
                  <span style={user.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeAssist}>
                    {user.role === 'ADMIN' && <Shield size={12} style={{marginRight: 4}} />}
                    {user.role}
                  </span>
                </td>

                {/* Coluna Atividade (Bolinha colorida) */}
                <td style={styles.td}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <Circle size={10} fill={getStatusColor(user.status)} stroke="none" />
                    <span style={{fontSize: '13px', color: '#374151'}}>
                      {getStatusLabel(user.status)}
                    </span>
                  </div>
                </td>

                {/* Coluna Último Acesso */}
                <td style={styles.td}>
                  <span style={styles.lastSeen}>{user.lastSeen}</span>
                </td>

                {/* Coluna Ações (Lógica de Permissão) */}
                <td style={styles.tdRight}>
                  {currentUserRole === 'ADMIN' ? (
                    <button 
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteUser(user.id)}
                      title="Remover Acesso"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <span style={styles.disabledText}>Sem permissão</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Aviso para Assistentes */}
      {currentUserRole !== 'ADMIN' && (
        <div style={styles.warningBox}>
          <AlertCircle size={18} />
          <span>Modo de visualização: Apenas Administradores podem remover utilizadores.</span>
        </div>
      )}

    </div>
  );
};

// --- ESTILOS (Mesmo DNA do Inventory.js) ---
const styles = {
  pageContainer: { padding: '30px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: '"Inter", sans-serif' },
  headerContainer: { marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 },
  subTitle: { fontSize: '14px', color: '#6b7280', marginTop: '5px' },
  
  // Botão de simulação (apenas para teste)
  roleToggleBtn: { padding: '8px 16px', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },

  controlBar: { backgroundColor: 'white', padding: '16px 20px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  searchWrapper: { position: 'relative', width: '300px' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' },
  searchInput: { width: '100%', padding: '10px 10px 10px 40px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '14px', outline: 'none' },
  userCount: { fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', fontWeight: '500' },

  tableCard: { backgroundColor: 'white', borderRadius: '0 0 10px 10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeaderRow: { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  th: { padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
  thRight: { padding: '16px 24px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' },
  tableRow: { borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.1s' },
  td: { padding: '16px 24px', verticalAlign: 'middle', fontSize: '14px', color: '#374151' },
  tdRight: { padding: '16px 24px', textAlign: 'right' },

  // Estilos Específicos de Usuário
  avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#dbeafe', color: '#1e40af', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '14px' },
  userName: { fontWeight: '600', color: '#111827' },
  userEmail: { fontSize: '12px', color: '#6b7280' },
  
  badgeAdmin: { display: 'inline-flex', alignItems: 'center', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  badgeAssist: { display: 'inline-flex', alignItems: 'center', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  
  lastSeen: { fontSize: '12px', color: '#6b7280' },

  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '6px', borderRadius: '4px', transition: '0.2s' },
  disabledText: { fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' },
  
  warningBox: { marginTop: '20px', padding: '15px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', color: '#c2410c', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }
};

export default Users;