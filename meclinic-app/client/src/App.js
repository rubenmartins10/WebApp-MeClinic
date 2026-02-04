import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Componentes
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Users from './pages/Users';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        
        {/* A BARRA LATERAL (Fixa à esquerda) */}
        <Sidebar />
        
        {/* O CONTEÚDO DAS PÁGINAS */}
        {/* marginLeft: '260px' é OBRIGATÓRIO para não ficar escondido atrás do menu */}
        <main style={{ flex: 1, marginLeft: '260px', width: 'calc(100% - 260px)' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/users" element={<Users />} />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;