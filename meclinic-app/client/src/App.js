// client/src/App.js
import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { ThemeProvider, ThemeContext } from './ThemeContext'; 
import { LanguageProvider, LanguageContext } from './LanguageContext'; // <-- NOVO

import Sidebar from './components/Sidebar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Consultas from './pages/Consultas';
import Users from './pages/Users';
import FichasTecnicas from './pages/FichasTecnicas';
import Faturacao from './pages/Faturacao';
import Settings from './pages/Settings';
import Report from './pages/Report';

// COMPONENTE DE LAYOUT: Aplica a cor de fundo e texto a TODA a aplicação
const MainLayout = ({ user, onLogout }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext); // <-- Tradutor ativo!

  return (
    <div style={{ 
      display: 'flex', 
      backgroundColor: theme.pageBg,
      color: theme.text,
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    }}>
      <Sidebar onLogout={onLogout} />
      
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
          <Route path="/users" element={<Users />} />
          <Route path="/fichas-tecnicas" element={<FichasTecnicas />} />
          <Route path="/reports" element={<Report />} />
          <Route path="/faturacao" element={<Faturacao />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('meclinic_user');
    if (storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('meclinic_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('meclinic_user');
  };

  return (
    // O SISTEMA AGORA É ENVOLVIDO PELO MOTOR DE IDIOMAS
    <LanguageProvider>
      <ThemeProvider>
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
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;