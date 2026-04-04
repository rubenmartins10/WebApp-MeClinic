# ⚛️ Frontend - Stack React

Documentação completa do frontend MeClinic desenvolvido em React.

## 🎯 Overview

**Framework:** React 18+  
**Roteamento:** React Router v6  
**Ícones:** Lucide React  
**CSS:** Pure CSS com Temas Customizáveis  
**State Management:** React Hooks + Context API  
**HTTP Client:** Fetch API  

---

## 📦 Dependências Principais

### Package.json

```json
{
  "name": "meclinic-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.0",
    "lucide-react": "^0.263.0",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

---

## 🏗️ Estrutura de Pastas

```
src/
├── pages/
│   ├── Auth.js              # Login/Registro/2FA
│   ├── Dashboard.js         # Painel principal
│   ├── Pacientes.js         # Gestão de pacientes
│   ├── Consultas.js         # Agendamento
│   ├── Inventory.js         # Inventário
│   ├── Faturacao.js         # Faturas
│   ├── FichasTecnicas.js    # Fichas técnicas
│   ├── Report.js            # Relatórios
│   ├── Users.js             # Gestão de usuários (admin)
│   └── Settings.js          # Configurações
│
├── components/
│   ├── Sidebar.js           # Menu lateral
│   ├── Assinatura.js        # Canvas de assinatura
│   ├── BarcodeScanner.js    # Leitor de código de barras
│   ├── Odontograma.js       # Mapa dental
│   ├── ProductModal.js      # Modal de produtos
│   └── InventoryList.js     # Lista de inventário
│
├── App.js                   # Componente raiz
├── App.css                  # Estilos globais
├── LanguageContext.js       # Contexto de idiomas
├── ThemeContext.js          # Contexto de temas
├── index.js                 # Entry point
├── index.css                # CSS global
├── mockData.js              # Dados de teste
└── setupTests.js            # Config de testes
```

---

## 🚀 Iniciando o Desenvolvimento

### 1. Setup Inicial

```bash
# Entrar na pasta
cd meclinic-app/client

# Instalar dependências
npm install

# Iniciar servidor de dev
npm start

# Acessar em http://localhost:3050
```

### 2. Compilar para Produção

```bash
npm run build

# Output em: build/
# Otimizado e minificado
```

### 3. Rodar Testes

```bash
npm test

# Modo watch
npm test -- --watch
```

---

## 🎨 Sistema de Temas

### Como Funciona

```javascript
// ThemeContext.js
import React, { createContext, useState } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = isDarkMode ? {
    background: '#1e1e1e',
    text: '#ffffff',
    border: '#404040',
    inputBg: '#2d2d2d',
    primary: '#007bff',
    danger: '#dc3545'
  } : {
    background: '#ffffff',
    text: '#000000',
    border: '#ddd',
    inputBg: '#f5f5f5',
    primary: '#007bff',
    danger: '#dc3545'
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Usando o Tema

```javascript
import { useContext } from 'react';
import { ThemeContext } from '../ThemeContext';

export default function MyComponent() {
  const { theme } = useContext(ThemeContext);

  return (
    <div style={{
      backgroundColor: theme.background,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      padding: '20px',
      borderRadius: '8px'
    }}>
      Conteúdo com tema aplicado
    </div>
  );
}
```

---

## 🌍 Sistema de Idiomas

### Como Funciona

```javascript
// LanguageContext.js
import React, { createContext, useState } from 'react';

const translations = {
  pt: {
    app: {
      title: 'MeClinic',
      welcome: 'Bem-vindo',
      logout: 'Sair'
    },
    pages: {
      dashboard: {
        title: 'Dashboard',
        kpis: 'Métricas Principais'
      }
    }
  },
  en: {
    app: {
      title: 'MeClinic',
      welcome: 'Welcome',
      logout: 'Logout'
    },
    pages: {
      dashboard: {
        title: 'Dashboard',
        kpis: 'Main Metrics'
      }
    }
  }
};

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('pt');

  const t = (key) => {
    return key.split('.').reduce((obj, k) => obj?.[k], translations[language]) || key;
  };

  return (
    <LanguageContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

### Usando Idiomas

```javascript
import { useContext } from 'react';
import { LanguageContext } from '../LanguageContext';

export default function Dashboard() {
  const { t, language, setLanguage } = useContext(LanguageContext);

  return (
    <>
      <h1>{t('pages.dashboard.title')}</h1>
      <p>{t('pages.dashboard.kpis')}</p>
      
      <button onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}>
        {language === 'pt' ? '🇬🇧 English' : '🇵🇹 Português'}
      </button>
    </>
  );
}
```

---

## 🔐 Autenticação no Frontend

### Fluxo de Login

```javascript
// pages/Auth.js
const handleLogin = async (email, senha) => {
  try {
    // 1. Login inicial (recebe QR Code)
    const loginRes = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      setError(loginData.error);
      return;
    }

    // 2. Exibir QR Code
    setQRCode(loginData.qr_code);
    setEmail(email);
    setStep('2fa'); // Avançar para etapa 2FA

  } catch (error) {
    setError('Erro ao fazer login: ' + error.message);
  }
};

const handleVerify2FA = async (token_2fa) => {
  try {
    // 2. Verificar código 2FA
    const verifyRes = await fetch('http://localhost:5000/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token_2fa })
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      setError(verifyData.error);
      return;
    }

    // 3. Salvar token e dados do utilizador
    localStorage.setItem('meclinic_token', verifyData.jwt);
    localStorage.setItem('meclinic_user', JSON.stringify(verifyData.user));

    // 4. Callback para App.js
    onLogin(verifyData.user);

    // 5. Redirecionar para Dashboard
    navigate('/dashboard');

  } catch (error) {
    setError('Erro ao verificar 2FA: ' + error.message);
  }
};
```

### Interceptor de Requisições

```javascript
// Função helper para requisições autenticadas
const makeAuthRequest = async (url, options = {}) => {
  const token = localStorage.getItem('meclinic_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Se token expirou
  if (response.status === 401) {
    localStorage.removeItem('meclinic_token');
    localStorage.removeItem('meclinic_user');
    window.location.href = '/auth';
    throw new Error('Token expirado');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
};
```

### Uso em Componentes

```javascript
// pages/Pacientes.js
import { useEffect, useState } from 'react';

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPacientes();
  }, []);

  const loadPacientes = async () => {
    try {
      setLoading(true);
      const data = await makeAuthRequest('http://localhost:5000/pacientes');
      setPacientes(data.pacientes || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <p>Carregando...</p>}
      {error && <p style={{color: 'red'}}>Erro: {error}</p>}
      {pacientes.map(p => (
        <div key={p.id}>
          <h3>{p.nome}</h3>
          <p>{p.email}</p>
        </div>
      ))}
    </>
  );
}
```

---

## 🎯 Padrões e Boas Práticas

### 1. Componentes Funcionais com Hooks

```javascript
// ✅ BOM - Componente funcional moderno
import React, { useState, useEffect } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Efeito colateral
    document.title = `Count: ${count}`;
  }, [count]); // Dependency array

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicagens: {count}
    </button>
  );
}

// ❌ EVITAR - Componentes de classe
class MyComponentOld extends React.Component {
  state = { count: 0 };

  render() {
    return <button>...</button>;
  }
}
```

### 2. Separar Lógica do Render

```javascript
// ✅ BOM - Separação clara
export default function Pacientes() {
  // Lógica
  const [pacientes, setPacientes] = useState([]);
  const loadData = async () => { /* ... */ };
  
  useEffect(() => {
    loadData();
  }, []);

  // Render
  return (
    <table>
      <tbody>
        {pacientes.map(p => (
          <tr key={p.id}>
            <td>{p.nome}</td>
            <td>{p.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 3. Memoização para Performance

```javascript
import React, { memo } from 'react';

// Evita re-render desnecessário quando props não mudam
export const PatientCard = memo(({ paciente, onEdit }) => {
  return (
    <div>
      <h3>{paciente.nome}</h3>
      <button onClick={() => onEdit(paciente.id)}>Editar</button>
    </div>
  );
});

PatientCard.displayName = 'PatientCard';
```

### 4. Custom Hooks

```javascript
// hooks/useAuth.js
import { useState, useCallback } from 'react';

export function useAuth() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('meclinic_user'))
  );

  const login = useCallback((userData) => {
    localStorage.setItem('meclinic_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('meclinic_token');
    localStorage.removeItem('meclinic_user');
    setUser(null);
  }, []);

  return { user, login, logout };
}

// Uso em componentes
import { useAuth } from './hooks/useAuth';

export default function MyComponent() {
  const { user, logout } = useAuth();

  return (
    <>
      <p>Olá, {user?.nome}!</p>
      <button onClick={logout}>Sair</button>
    </>
  );
}
```

### 5. Tratamento de Erros

```javascript
// ✅ BOM - Try/catch com feedback
export default function CreatePacient() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch('http://localhost:5000/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('meclinic_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar paciente');
      }

      // Sucesso
      alert('Paciente criado com sucesso!');

    } catch (err) {
      setError(err.message);
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={e => {
      e.preventDefault();
      handleSubmit(new FormData(e.target));
    }}>
      {error && <div style={{color:'red'}}>{error}</div>}
      {loading && <div>Salvando...</div>}
      {/* Campos do form */}
      <button disabled={loading}>Criar</button>
    </form>
  );
}
```

---

## 📱 Responsividade

### Media Queries Essenciais

```css
/* Desktop (default) */
.container {
  max-width: 1200px;
  padding: 20px;
}

/* Tablet */
@media (max-width: 768px) {
  .container {
    max-width: 100%;
    padding: 15px;
  }
  
  .sidebar {
    position: fixed;
    left: -250px;
    transition: left 0.3s;
  }
  
  main {
    margin-left: 0;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .container {
    padding: 10px;
  }
  
  button {
    width: 100%;
  }
  
  table {
    font-size: 12px;
  }
}
```

---

## 🧪 Testando Componentes

### Setup

```javascript
// setupTests.js
import '@testing-library/jest-dom';
```

### Exemplo de Teste

```javascript
// components/__tests__/Sidebar.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';

test('renderiza links de navegação', () => {
  render(<Sidebar onLogout={() => {}} />);
  
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Pacientes')).toBeInTheDocument();
});

test('chama onLogout ao clicar botão', () => {
  const mockLogout = jest.fn();
  render(<Sidebar onLogout={mockLogout} />);
  
  const logoutBtn = screen.getByText('Sair');
  logoutBtn.click();
  
  expect(mockLogout).toHaveBeenCalled();
});
```

---

## 🐛 Debugging

### React DevTools

1. Instalar extensão no Chrome: [React Developer Tools](https://chrome.google.com/webstore)
2. Abrira DevTools (F12)
3. Aba "Components" mostra componentes React
4. Inspecionar props e state em tempo real

### Console Logging

```javascript
// ✅ BOM - Logs estruturados
console.group('Dados Carregados');
console.log('Pacientes:', pacientes);
console.log('Total:', pacientes.length);
console.groupEnd();

// ❌ EVITAR - Logs desorganizados
console.log('test');
console.log(data);
```

---

## 📊 Performance Dicas

1. **Lazy Load de Rotas**
   ```javascript
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   ```

2. **Memoização de Callbacks**
   ```javascript
   const handleClick = useCallback(() => {...}, [dependency]);
   ```

3. **Virtual Scrolling para Listas Grandes**
   - Usar biblioteca: `react-window`

4. **Code Splitting**
   - Webpack faz automaticamente com Lazy Load

---

**Última atualização:** Abril 2026
