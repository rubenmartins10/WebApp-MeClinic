// client/src/ThemeContext.js
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // PALETA DE CORES GLOBAL: Garante contraste entre a Sidebar e a Página
  const theme = {
    isDark: isDarkMode,
    
    // MODO CLARO: Sidebar Azul Forte | Página Cinza Claro
    // MODO ESCURO: Sidebar Quase Preta | Página Azul Escuro/Cinza
    sidebarBg: isDarkMode ? '#020617' : '#1976d2', 
    pageBg: isDarkMode ? '#0f172a' : '#f3f4f6',    
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',    
    
    text: isDarkMode ? '#f8fafc' : '#111827',
    subText: isDarkMode ? '#94a3b8' : '#6b7280',
    border: isDarkMode ? '#334155' : '#e5e7eb',
    tableHead: isDarkMode ? '#334155' : '#f9fafb'
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};