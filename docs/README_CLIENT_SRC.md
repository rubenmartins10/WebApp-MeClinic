# 💻 Client/SRC - Estrutura Profissional Organizada

## 📁 Organização de Pastas

```
src/
├─ 📄 index.js                        ← Ponto de entrada da aplicação
├─ 📄 App.js                          ← Componente raiz
├─ 📄 reportWebVitals.js
│
├─ 📁 assets/                         ← Imagens e ícones estáticos
│  └─ logo.png
│
├─ 📁 contexts/                       ← Contextos globais React
│  ├─ LanguageContext.js              ← Gestão de idiomas (PT, EN, ES)
│  └─ ThemeContext.js                 ← Gestão de dark/light mode
│
├─ 📁 data/                           ← Dados mockados para testes
│  └─ mockData.js
│
├─ 📁 hooks/                          ← Custom React Hooks
│  └─ (adicionar hooks reutilizáveis aqui)
│
├─ 📁 services/                       ← Chamadas HTTP e API
│  └─ (auth.service.js, pacientes.service.js, etc)
│
├─ 📁 styles/                         ← Ficheiros CSS globais
│  ├─ index.css                       ← Estilos raiz
│  └─ App.css                         ← Estilos do App
│
├─ 📁 utils/                          ← Funções auxiliares
│  └─ fetchWithToken.js               ← Fetch com autenticação JWT
│
├─ 📁 components/                     ← Componentes React
│  ├─ 📁 common/                      ← Componentes reutilizáveis
│  │  ├─ Sidebar.js                   ← Barra lateral de navegação│  │  └─ BarcodeScanner.js             ← Scanner de código de barras
│  │
│  └─ 📁 specialized/                 ← Componentes específicos do domínio
│     ├─ Assinatura.js                ← Componente de assinatura
│     ├─ Odontograma.js               ← Visualização odontológica
│     ├─ ProductModal.js              ← Modal de produtos
│     └─ InventoryList.js             ← Lista de inventário
│
├─ 📁 pages/                          ← Páginas/Rotas
│  ├─ Auth.js                         ← Login e autenticação
│  ├─ Dashboard.js                    ← Dashboard principal
│  ├─ Pacientes.js                    ← Gestão de pacientes
│  ├─ Consultas.js                    ← Agendamento de consultas
│  ├─ Faturacao.js                    ← Gestão de faturação
│  ├─ Inventory.js                    ← Gestão de inventário
│  ├─ Produtos.js                     ← Catálogo de produtos
│  ├─ Relatorios.js                   ← Relatórios
│  ├─ Utilizadores.js                 ← Gestão de utilizadores
│  ├─ Settings.js                     ← Configurações do utilizador
│  └─ FichasTecnicas.js               ← Fichas técnicas
│
└─ 📁 __tests__/                      ← Testes unitários
   ├─ setupTests.js
   └─ App.test.js
```

---

## 🎯 Como Usar Cada Pasta

### 📁 **assets/**
Local para imagens, ícones e ficheiros estáticos.
```javascript
import logo from '../assets/logo.png';
```

### 📁 **contexts/**
Contextos globais de React para estado compartilhado.
```javascript
import { ThemeContext } from '../contexts/ThemeContext';
```

### 📁 **services/**
Chamadas HTTP para a API backend.
```javascript
// exemplo: services/pacientes.service.js
export const getPacientes = async () => { ... }
```

### 📁 **components/common/**
Componentes reutilizáveis em toda a aplicação.
- Sidebar
- Header
- Footer
- etc.

### 📁 **components/specialized/**
Componentes específicos do domínio clinico.
- Odontograma
- ProductModal
- Assinatura
- InventoryList

### 📁 **pages/**
Componentes de página (rotas). Um por página.

### 📁 **hooks/**
Custom React Hooks reutilizáveis.
```javascript
// exemplo: hooks/useAuth.js
export const useAuth = () => { ... }
```

### 📁 **utils/**
Funções auxiliares e utilitários.
```javascript
// fetchWithToken.js - Fetch com JWT automaticamente
```

### 📁 **__tests__/**
Testes unitários com Jest.

---

## 📋 Padrões de Código

### Importar contexto:
```javascript
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

const Component = () => {
  const { theme } = useContext(ThemeContext);
  // ...
};
```

### Importar serviço:
```javascript
import * as pacientesService from '../services/pacientes.service';

useEffect(() => {
  pacientesService.getPacientes();
}, []);
```

### Importar componente comum:
```javascript
import Sidebar from '../components/common/Sidebar';
```

### Importar componente especializado:
```javascript
import Odontograma from '../components/specialized/Odontograma';
```

---

## ✅ Estrutura Profissional

✅ **Separação clara de responsabilidades**
- Components: Reutilizáveis vs. Especializados
- Contexts: Estado global
- Services: Comunicação API
- Utils: Funções auxiliares
- Hooks: Lógica reutilizável

✅ **Fácil de navegar e manter**
- Cada ficheiro no seu lugar correto
- Nomes descritivos
- Estrutura consistente

✅ **Escalável**
- Fácil adicionar novos componentes
- Fácil adicionar novos services
- Padrão industria

---

**Desenvolvido com ❤️ para uma base de código profissional**
