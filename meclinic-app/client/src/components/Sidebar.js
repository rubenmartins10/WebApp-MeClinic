// client/src/components/Sidebar.js
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Users, Calendar,
  FileText, BarChart3, Settings, LogOut, Sun, Moon 
} from 'lucide-react';

import { ThemeContext } from '../ThemeContext'; 

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/inventory', label: 'Inventário', icon: <Package size={20} /> },
    { path: '/consultas', label: 'Consultas', icon: <Calendar size={20} /> },
    { path: '/fichas-tecnicas', label: 'Fichas Técnicas', icon: <FileText size={20} /> },
    { path: '/users', label: 'Utilizadores', icon: <Users size={20} /> },
    { path: '/reports', label: 'Relatórios', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div style={{ 
      width: '250px', 
      backgroundColor: theme.sidebarBg, // Cor forte dinâmica (Azul ou Preto)
      color: 'white', 
      height: '100vh', 
      position: 'fixed',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ margin: 0 }}>MeClinic</h2>
      </div>

      <nav style={{ flexGrow: 1, padding: '20px 0' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '12px 20px', 
                  color: 'white', textDecoration: 'none',
                  backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
                  borderLeft: location.pathname === item.path ? '4px solid white' : '4px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ marginRight: '15px' }}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li>
            <button 
              onClick={toggleTheme}
              style={{ 
                display: 'flex', alignItems: 'center', padding: '12px 20px', 
                color: 'white', textDecoration: 'none', background: 'none',
                border: 'none', cursor: 'pointer', width: '100%', 
                fontFamily: 'inherit', fontSize: '16px', textAlign: 'left'
              }}>
              {theme.isDark ? (
                <><Sun size={20} style={{ marginRight: '15px', color: '#fbbf24' }} /> Modo Claro</>
              ) : (
                <><Moon size={20} style={{ marginRight: '15px', color: '#e2e8f0' }} /> Modo Escuro</>
              )}
            </button>
          </li>
          <li>
            <Link to="/settings" style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', color: 'white', textDecoration: 'none' }}>
              <Settings size={20} style={{ marginRight: '15px' }} /> Definições
            </Link>
          </li>
          <li>
            <button 
              onClick={onLogout}
              style={{ 
                display: 'flex', alignItems: 'center', padding: '12px 20px', 
                color: '#fca5a5', textDecoration: 'none', background: 'none',
                border: 'none', cursor: 'pointer', width: '100%', 
                fontFamily: 'inherit', fontSize: '16px', textAlign: 'left'
              }}>
              <LogOut size={20} style={{ marginRight: '15px' }} /> Sair
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;