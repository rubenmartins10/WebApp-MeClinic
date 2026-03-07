import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Consultas from './pages/Consultas';
import Users from './pages/Users';
import FichasTecnicas from './pages/FichasTecnicas';
import Report from './pages/Report';
import Auth from './pages/Auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // 1. Verificar se já existe um utilizador guardado ao carregar a página
  useEffect(() => {
    const storedUser = localStorage.getItem('meclinic_user');
    if (storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser)); // Converte o texto guardado de volta para um Objeto
    }
  }, []);

  // 2. Função de Login: Atualiza o estado e guarda no Local Storage
  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('meclinic_user', JSON.stringify(userData));
  };

  // 3. Função de Logout: Limpa o estado e apaga do Local Storage
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('meclinic_user');
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar onLogout={handleLogout} />
        
        <main style={{ flexGrow: 1, padding: '20px', marginLeft: '250px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
          
          {/* Opcional: Uma pequena saudação para saberes quem está logado */}
          {user && (
             <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', color: '#666', fontSize: '0.9rem' }}>
               Logado como: <strong>{user.nome}</strong> ({user.email})
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;