import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { ThemeProvider, ThemeContext } from './contexts/ThemeContext'; 
import { LanguageProvider, LanguageContext } from './contexts/LanguageContext'; 
import { TimeFormatProvider, TimeFormatContext } from './contexts/TimeFormatContext';

// Mudamos o nome do ícone para "UsersIcon" para não chocar com a página "Users"
import { Users as UsersIcon } from 'lucide-react';

import Sidebar from './components/common/Sidebar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory'; // Certifica-te que o nome do ficheiro é este
import Consultas from './pages/Consultas';
import UsersPage from './pages/Users'; // Mudamos aqui também para evitar conflito
import FichasTecnicas from './pages/FichasTecnicas';
import Faturacao from './pages/Faturacao';
import Settings from './pages/Settings';
import Report from './pages/Report';
import Pacientes from './pages/Pacientes'; // <-- A NOVA PÁGINA AQUI    
import ConsultaReminders from './components/ConsultaReminders';

const MainLayout = ({ user, onLogout }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  return (
    <div style={{ 
      display: 'flex', 
      backgroundColor: theme.pageBg,
      color: theme.text,
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    }}>
      <Sidebar onLogout={onLogout} user={user} />
      
      <main style={{ flexGrow: 1, padding: '20px', marginLeft: '250px' }}>
        {user && (
           <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', color: theme.subText, fontSize: '0.9rem' }}>
             {t('app.logged_as')} <strong style={{ marginLeft: '5px', color: theme.text }}>{user.nome}</strong>
           </div>
        )}

        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/consultas" element={<Consultas />} />
          <Route path="/users" element={isAdmin ? <UsersPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/fichas-tecnicas" element={<FichasTecnicas />} />
          <Route path="/reports" element={<Report />} />
          <Route path="/faturacao" element={<Faturacao />} />
          <Route path="/pacientes" element={<Pacientes />} /> {/* <-- ROTA NOVA */}
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Lembretes de consultas — aparecem no canto inferior direito */}
      <ConsultaReminders />
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('meclinic_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        if (!localStorage.getItem('meclinic_login_at')) {
          localStorage.setItem('meclinic_login_at', new Date().toISOString());
        }
      } catch {
        localStorage.removeItem('meclinic_user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('meclinic_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    // Marcar sessão como inativa no backend
    const sessionId = localStorage.getItem('meclinic_session_id');
    const token = localStorage.getItem('token');
    if (sessionId && token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sessionId })
      }).catch(() => {});
    }
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('meclinic_user');
    localStorage.removeItem('meclinic_login_at');
    localStorage.removeItem('meclinic_session_id');
  };

  return (
    <LanguageProvider>
      <ThemeProvider>
        <TimeFormatProvider>
          <Router>
            {!isAuthenticated ? (
              <Routes>
                <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
                <Route path="*" element={<Navigate to="/auth" replace />} />
              </Routes>
            ) : (
              <MainLayout user={user} onLogout={handleLogout} />
            )}
          </Router>
        </TimeFormatProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;