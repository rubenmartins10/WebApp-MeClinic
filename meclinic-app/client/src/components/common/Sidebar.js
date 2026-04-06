import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Users, Calendar,
  FileText, BarChart3, Settings, LogOut, Sun, Moon, DollarSign 
} from 'lucide-react';

import { ThemeContext } from '../../contexts/ThemeContext'; 
import { LanguageContext } from '../../contexts/LanguageContext';
import { TimeFormatContext } from '../../contexts/TimeFormatContext';

const Sidebar = ({ onLogout, user }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const { timeFormat } = useContext(TimeFormatContext);
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clockStr = (() => {
    if (timeFormat === '12h') {
      let h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      const period = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m} ${period}`;
    }
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  })();

  const dateStr = now.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' });

  const navItems = [
    { path: '/dashboard', label: t('sidebar.dashboard'), icon: <LayoutDashboard size={20} /> },
    { path: '/inventory', label: t('sidebar.inventory'), icon: <Package size={20} /> },
    { path: '/consultas', label: t('sidebar.consultations'), icon: <Calendar size={20} /> },
    { path: '/pacientes', label: t('sidebar.patients'), icon: <Users size={20} /> },
    { path: '/fichas-tecnicas', label: t('sidebar.technical_sheets'), icon: <FileText size={20} /> },
    { path: '/users', label: t('sidebar.users'), icon: <Users size={20} />, adminOnly: true },
    { path: '/faturacao', label: t('sidebar.billing'), icon: <DollarSign size={20} /> },
    { path: '/reports', label: t('sidebar.reports'), icon: <BarChart3 size={20} /> },
  ].filter(item => !item.adminOnly || isAdmin);

  return (
    <div style={{ 
      width: '250px', 
      backgroundColor: theme.sidebarBg,
      color: 'white', 
      height: '100vh', 
      position: 'fixed',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background-color 0.3s ease',
      borderRight: `1px solid ${theme.border}`,
      zIndex: 100 // Garante que a barra fica por cima
    }}>
      
      <div style={{ padding: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '0.5px', textAlign: 'center' }}>MeClinic</h2>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 600, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>
            {clockStr}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px', textTransform: 'capitalize' }}>
            {dateStr}
          </div>
        </div>
      </div>

      <nav style={{ flexGrow: 1, padding: '20px 0', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '14px 20px', 
                  color: location.pathname === item.path ? '#ffffff' : 'rgba(255,255,255,0.7)', 
                  textDecoration: 'none',
                  backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
                  borderLeft: location.pathname === item.path ? '4px solid white' : '4px solid transparent',
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
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
                fontFamily: 'inherit', fontSize: '15px', textAlign: 'left', opacity: 0.8
              }}>
              {theme.isDark ? (
                <><Sun size={20} style={{ marginRight: '15px', color: '#fbbf24' }} /> {t('sidebar.light_mode')}</>
              ) : (
                <><Moon size={20} style={{ marginRight: '15px', color: '#e2e8f0' }} /> {t('sidebar.dark_mode')}</>
              )}
            </button>
          </li>
          <li>
            <Link to="/settings" style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', color: 'white', textDecoration: 'none', opacity: 0.8 }}>
              <Settings size={20} style={{ marginRight: '15px' }} /> {t('sidebar.settings')}
            </Link>
          </li>
          <li>
            <button 
              onClick={onLogout}
              style={{ 
                display: 'flex', alignItems: 'center', padding: '12px 20px', 
                color: '#fca5a5', textDecoration: 'none', background: 'none',
                border: 'none', cursor: 'pointer', width: '100%', 
                fontFamily: 'inherit', fontSize: '15px', textAlign: 'left', marginTop: '10px'
              }}>
              <LogOut size={20} style={{ marginRight: '15px' }} /> {t('sidebar.logout')}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;