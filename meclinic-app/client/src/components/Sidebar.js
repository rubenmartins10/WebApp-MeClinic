import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Calendar,   // Para Consultas
  Heart,      // Para Pacientes
  PlusCircle  // Para Novo Produto
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Estilos dos botões para Fundo Escuro
  const getButtonStyle = (path, isAction = false) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    marginBottom: '8px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontSize: '14px',
    // Botão de Ação (Novo Produto) fica verde ou azul brilhante para destacar
    backgroundColor: isAction 
      ? '#059669' // Verde para destacar a ação
      : (isActive(path) ? '#3b82f6' : 'transparent'), 
    color: 'white',
    opacity: isAction ? 1 : (isActive(path) ? 1 : 0.7),
    transition: 'all 0.2s ease',
    fontWeight: isAction ? '600' : 'normal',
  });

  return (
    <div style={styles.container}>
      
      {/* LOGO */}
      <div style={styles.logoArea}>
        <div style={styles.logoIcon}>M</div>
        <h2 style={styles.logoText}>MeClinic</h2>
      </div>

      {/* MENU PRINCIPAL */}
      <nav style={{ flex: 1 }}>
        
        {/* Dashboard */}
        <div style={getButtonStyle('/dashboard')} onClick={() => navigate('/dashboard')}>
          <LayoutDashboard size={20} style={{ marginRight: '12px' }} />
          Dashboard
        </div>

        {/* Consultas ("A outra") */}
        <div style={getButtonStyle('/consultas')} onClick={() => navigate('/consultas')}>
          <Calendar size={20} style={{ marginRight: '12px' }} />
          Consultas
        </div>

        {/* Pacientes */}
        <div style={getButtonStyle('/pacientes')} onClick={() => navigate('/users')}>
          <Heart size={20} style={{ marginRight: '12px' }} />
          Pacientes
        </div>

        {/* Inventário */}
        <div style={getButtonStyle('/inventory')} onClick={() => navigate('/inventory')}>
          <Package size={20} style={{ marginRight: '12px' }} />
          Inventário
        </div>

        {/* ITEM ESPECIAL: Registar Produto */}
        {/* Este botão leva ao inventário, mas visualmente destaca-se */}
        <div 
          style={{...getButtonStyle('/new-product', true), marginTop: '20px', marginBottom: '20px'}} 
          onClick={() => navigate('/inventory')}
        >
          <PlusCircle size={20} style={{ marginRight: '12px' }} />
          Registar Produto
        </div>

        {/* Utilizadores (Admin) */}
        <div style={getButtonStyle('/users')} onClick={() => navigate('/users')}>
          <Users size={20} style={{ marginRight: '12px' }} />
          Utilizadores
        </div>
      </nav>

      {/* RODAPÉ */}
      <div style={styles.footer}>
        <div style={getButtonStyle('/settings')}>
          <Settings size={20} style={{ marginRight: '12px' }} />
          Definições
        </div>
        <div style={{ ...getButtonStyle('/logout'), color: '#fca5a5' }}>
          <LogOut size={20} style={{ marginRight: '12px' }} />
          Sair
        </div>
      </div>

    </div>
  );
};

// ESTILOS (TEMA ESCURO)
const styles = {
  container: {
    width: '260px',
    height: '100vh',
    backgroundColor: '#111827', // Fundo Escuro
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 50
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '30px',
    paddingLeft: '5px'
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: '20px'
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'white',
    margin: 0
  },
  footer: {
    borderTop: '1px solid #374151',
    paddingTop: '20px',
    marginTop: 'auto'
  }
};

export default Sidebar;