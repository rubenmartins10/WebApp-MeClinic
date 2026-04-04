# 📁 Estrutura do Projeto

Explicação detalhada de cada arquivo e pasta no repositório MeClinic.

## 🗂️ Árvore Completa do Projeto

```
MeClinic/                          # Raiz do projeto
│
├── 📄 README.md                   # Documentação GitHub
├── 📄 package.json                # Dependências raiz (concurrently, pdfkit-table)
├── 📄 package-lock.json           # Lock file
│
├── 📂 .github/                    # Configuração GitHub
│   └── workflows/                 # CI/CD workflows (futuro)
│
├── 📂 .vscode/                    # Configuração VS Code
│   └── settings.json              # Configurações do workspace
│
├── 📂 .git/                       # Git repository
│
├── 📂 DOCUMENTACAO/  ← TÁ AQUI!   # 📚 Documentação do projeto
│   ├── README.md                  # Índice da documentação
│   ├── VISAO_GERAL.md            # Visão geral do projeto
│   ├── ARQUITETURA.md            # Arquitetura técnica
│   ├── SETUP.md                  # Guia de instalação
│   ├── ESTRUTURA_PROJETO.md      # Este arquivo
│   ├── API.md                    # Documentação de endpoints
│   ├── BANCO_DADOS.md            # Tabelas e schema
│   ├── FRONTEND.md               # Documentação React
│   ├── COMPONENTES.md            # Componentes reutilizáveis
│   ├── PAGINAS.md                # Funcionalidade das páginas
│   ├── AUTENTICACAO.md           # Sistema de autenticação
│   ├── FEATURES.md               # Funcionalidades
│   └── DEPLOYMENT.md             # Deploy e produção
│
├── 📂 Database/                   # 📊 Scripts SQL
│   ├── Tables.sql                # Criação de tabelas
│   ├── Consultas.sql             # Consultas úteis
│   ├── Fichas\ técnicas\ -\ todas.sql
│   ├── Admin\ e\ Assistente.sql  # Setup de roles
│   ├── 2\ products\ test.sql     # Dados de teste
│   ├── Preços\ para\ teste.sql   # Dados teste preços
│   ├── Email\ na\ tabela\ pacientes.sql
│   ├── Tabela\ de\ custos-preços\ teste.sql
│   ├── Tabela\ faturação.sql
│   └── ...outros scripts úteis
│
├── 📂 server/                     # 🖥️ BACKEND (Node.js/Express)
│   ├── 📄 index.js               # ⭐ Servidor principal (IMPORTANTE)
│   ├── 📄 db.js                  # Conexão PostgreSQL
│   ├── 📄 .env                   # Variáveis de ambiente (⚠️ não commitar)
│   ├── 📄 package.json           # Dependências backend
│   ├── 📄 package-lock.json      # Lock file
│   │
│   └── 📂 node_modules/          # Pacotes NPM (não commitar)
│
├── 📂 meclinic-app/               # Frontend + estrutura compartilhada
│   ├── 📄 package.json           # Info do monorepo
│   │
│   └── 📂 client/                # ⚛️ FRONTEND (React)
│       ├── 📄 package.json       # Dependências frontend
│       ├── 📄 package-lock.json  # Lock file
│       ├── 📄 README.md          # Documentação criar-react-app
│       │
│       ├── 📂 public/
│       │   ├── index.html        # HTML template principal
│       │   ├── robots.txt        # SEO robots directive
│       │   └── favicon.ico       # Ícone do site (se existir)
│       │
│       ├── 📂 src/
│       │   ├── 📄 index.js       # Entry point React
│       │   ├── 📄 index.css      # Estilos globais
│       │   ├── 📄 App.js         # ⭐ Componente raiz
│       │   ├── 📄 App.css        # Estilos App
│       │   ├── 📄 App.test.js    # Testes App
│       │   │
│       │   ├── 📄 LanguageContext.js  # Contexto de idiomas (PT/EN)
│       │   ├── 📄 ThemeContext.js     # Contexto de temas (Light/Dark)
│       │   ├── 📄 mockData.js         # Dados fictícios para testes
│       │   ├── 📄 setupTests.js       # Setup de testes
│       │   ├── 📄 reportWebVitals.js  # Métricas de performance
│       │   │
│       │   ├── 📂 pages/              # 📄 PÁGINAS PRINCIPAIS
│       │   │   ├── Auth.js           # Login/Registro/2FA
│       │   │   ├── Dashboard.js      # Painel principal
│       │   │   ├── Pacientes.js      # Gestão de pacientes
│       │   │   ├── Consultas.js      # Agendamento consultas
│       │   │   ├── Inventory.js      # Gestão de produtos
│       │   │   ├── Faturacao.js      # Faturas/recibos
│       │   │   ├── FichasTecnicas.js # Fichas técnicas
│       │   │   ├── Report.js         # Relatórios
│       │   │   ├── Users.js          # Gestão de usuários (admin)
│       │   │   └── Settings.js       # Configurações
│       │   │
│       │   └── 📂 components/        # 🧩 COMPONENTES REUTILIZÁVEIS
│       │       ├── Sidebar.js        # Menu lateral
│       │       ├── Assinatura.js     # Canvas para assinatura
│       │       ├── BarcodeScanner.js # Leitor código barras
│       │       ├── Odontograma.js    # Odontograma dental
│       │       ├── ProductModal.js   # Modal de produtos
│       │       └── InventoryList.js  # Lista de inventário
│       │
│       ├── 📂 node_modules/         # Pacotes NPM (não commitar)
│       │
│       └── 📂 .gitignore (implícito)
│
├── 📂 node_modules/               # Pacotes root (não commitar)
│
└── 📄 .gitignore                  # Arquivos Git ignorados

```

## 📄 Detalhes dos Arquivos Principais

### Raiz

#### `package.json`
```json
{
  "name": "meclinic-master",
  "version": "1.0.0",
  "scripts": {
    "server": "cd server && npx nodemon index.js",
    "client": "cd meclinic-app/client && npm start",
    "dev": "concurrently npm:server npm:client"
  }
}
```
- **Propósito:** Definir scripts para rodar frontend + backend
- **Uso:** `npm run dev` = rodar tudo simultaneamente

---

### Backend (`/server`)

#### `index.js` ⭐ CRÍTICO
- **Linhas:** ~1000+
- **Propósito:** Servidor Express com todas as rotas e lógica
- **Principais Componentes:**
  - `initDB()` - Cria tabelas e normaliza dados
  - Rotas de autenticação `/auth/*`
  - Rotas de pacientes `/pacientes`
  - Rotas de consultas `/consultas`
  - Rotas de produtos `/produtos`
  - Rotas de faturas `/faturas`
  - Rotas de usuários `/utilizadores` (admin)
- **Dependências:** express, cors, pg, bcrypt, jwt, speakeasy, qrcode, nodemailer, cron, pdfkit-table

#### `db.js`
```javascript
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});
```
- **Propósito:** Conexão centralizada ao PostgreSQL
- **Max Conexões:** 20
- **Timeout:** 30 segundos para conexões inativas
- **Uso:** Importado por `index.js` para todas as queries

#### `.env`
```env
DB_USER=postgres
DB_PASSWORD=senha
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=meclinic_db
JWT_SECRET=chave_super_segura
NODE_ENV=development
PORT=5000
```
- **Propósito:** Variáveis de ambiente (não commitar!)
- **Segurança:** Nunca adicione ao Git

---

### Frontend (`/meclinic-app/client/src`)

#### `App.js` ⭐ CRÍTICO
- **Propósito:** Componente raiz da aplicação
- **Funcionalidades:**
  - Roteamento principal com React Router
  - Autenticação (login/logout)
  - Validação de token
  - Layout principal (Sidebar + conteúdo)
- **Contextos:** ThemeProvider, LanguageProvider
- **Rotas:**
  - `/auth` - Página de login
  - `/dashboard` - Painel principal
  - `/pacientes` - Gestão de pacientes
  - `/consultas` - Consultas
  - `/inventory` - Inventário
  - `/faturacao` - Faturação
  - `/fichas-tecnicas` - Fichas técnicas
  - `/reports` - Relatórios
  - `/users` - Gestão de usuários
  - `/settings` - Configurações

#### `LanguageContext.js`
```javascript
// Fornece suporte a múltiplos idiomas
const { t } = useContext(LanguageContext);
// Uso: t('app.well_done')
```
- **Idiomas Suportados:** Português, English
- **Tipo:** Context API para estado global

#### `ThemeContext.js`
```javascript
// Fornece tema global (claro/escuro)
const { theme, toggleTheme } = useContext(ThemeContext);
```
- **Temas:** Light (branco), Dark (escuro)
- **Proprietários:**
  - `background`, `text`, `border`, `inputBg`
  - `primary`, `secondary`, `danger`, `warning`

#### `mockData.js`
- **Propósito:** Dados fictícios para testes sem backend
- **Conteúdo:**
  - Pacientes de exemplo
  - Produtos de teste
  - Consultas pré-agendadas

#### `index.js`
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```
- **Propósito:** Ponto de entrada React
- **Monta:** Componente App na div com id=`root`

---

### Páginas (`/src/pages`)

#### `Auth.js`
- **Funcionalidades:**
  - Login com email + senha
  - Registro de novo usuário
  - Verificação 2FA (QR code)
  - Reset de senha
  - Redirecionamento após sucesso

#### `Dashboard.js`
- **Funcionalidades:**
  - KPIs principais (pacientes, consultas, receita)
  - Últimas consultas agendadas
  - Alertas de stock mínimo
  - Gráficos (se implementados)

#### `Pacientes.js`
- **Funcionalidades:**
  - Lista de pacientes com filtros
  - Criar novo paciente
  - Editar dados de paciente
  - Ver histórico clínico
  - Upload de exames (raio-X, etc)
  - Odontograma digital
  - Notas clínicas

#### `Consultas.js`
- **Funcionalidades:**
  - Agendamento de consultas
  - Calendário com datas disponíveis
  - Lista de consultas por paciente
  - Registro de procedimentos
  - Histórico de consultas

#### `Inventory.js`
- **Funcionalidades:**
  - Lista de produtos com stock
  - Adicionar/editar/remover produtos
  - Controle de stock mínimo
  - Scanner de código de barras
  - Filtros por categoria
  - Alertas de validade

#### `Faturacao.js`
- **Funcionalidades:**
  - Criar faturas/recibos
  - Lista de faturas emitidas
  - Gerar PDF
  - Histórico de pagamentos
  - Relatório de receita

#### `FichasTecnicas.js`
- **Funcionalidades:**
  - Visualizar fichas de produtos
  - Download de PDFs
  - Informação de dosagem/uso
  - Componentes/ingredientes

#### `Report.js`
- **Funcionalidades:**
  - Relatórios de vendas
  - Análise de consultas
  - Estatísticas do inventário
  - Exportar dados (CSV/PDF)
  - Gráficos analíticos

#### `Users.js`
- **Funcionalidades:**
  - Listar usuários (admin)
  - Criar novo usuário
  - Editar perfil
  - Mudar role/permissões
  - Deletar usuário
  - Reset de senha

#### `Settings.js`
- **Funcionalidades:**
  - Editar perfil pessoal
  - Mudar senha
  - Preferências de idioma/tema
  - Assinatura digital
  - Exportar dados pessoais

---

### Componentes (`/src/components`)

#### `Sidebar.js`
```javascript
// Menu lateral com navegação
// Links para todas as páginas
// Botão de logout
// Avatar do usuário
```

#### `Assinatura.js`
```javascript
// Canvas para desenhar assinatura
// Salva como base64
// Exporta para PDF
```

#### `BarcodeScanner.js`
```javascript
// Leitor de código de barras
// Integra com Inventory
// Atualiza stock automaticamente
```

#### `Odontograma.js`
```javascript
// Visualização dos dentes (32)
// Marcar procedimentos realizados
// Cores diferentes por estado
```

#### `ProductModal.js`
```javascript
// Modal para adicionar/editar produtos
// Formulário com validação
// Upload de imagem de produto
```

#### `InventoryList.js`
```javascript
// Lista reutilizável de produtos
// Sorting e filtros
// Ações (editar, deletar, atualizar stock)
```

---

### Base de Dados (`/Database`)

#### `Tables.sql` ⭐ PRINCIPAL
- Cria todas as tabelas do sistema
- Tabelas:
  - `utilizadores` - Usuários do sistema
  - `pacientes` - Dados dos pacientes
  - `consultas` - Registro de consultas
  - `produtos` - Inventário
  - `faturas` - Faturação
  - `exames_paciente` - Upload de exames

#### `Consultas.sql`
- Exemplos de queries úteis
- Relatórios pré-fabricados
- Queries para análise de dados

#### Outros Scripts
- Scripts de setup de roles/permissões
- Dados de teste
- Migrações de dados

---

## 🔄 Fluxo de Imports Típico

```javascript
// Página → Componentes
pages/Pacientes.js 
  ├─ import ProductModal from '../components/ProductModal'
  ├─ import InventoryList from '../components/InventoryList'
  ├─ import { useContext } from 'react'
  ├─ import { LanguageContext } from '../LanguageContext'
  └─ Fetch via API
      └─ axios.post('http://localhost:5000/pacientes')
          └─ server/index.js
              └─ db.js
                  └─ PostgreSQL
```

## 💡 Padrões de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `ProductModal.js` |
| Páginas | PascalCase | `Pacientes.js` |
| Funções utility | camelCase | `formatDate()` |
| Constantes | UPPER_CASE | `MAX_PRODUCTS` |
| Rotas API | kebab-case | `/get-pacientes` |
| Context | PascalCase | `ThemeContext.js` |
| CSS Classes | kebab-case | `.patient-card` |

## 📦 Tamanho Estimado dos Arquivos

```
server/index.js           ~1500+ linhas (GRANDE)
src/pages/*.js            ~300-500 linhas cada
src/components/*.js       ~100-300 linhas cada
Database/Tables.sql       ~200+ linhas
LanguageContext.js        ~200+ linhas
ThemeContext.js           ~300+ linhas
```

## ⚠️ Arquivos a NÃO Commitar

```
.env                      # Variáveis sensíveis
node_modules/            # Agora em .gitignore
server/node_modules/     # Agora em .gitignore
meclinic-app/client/node_modules/  # Agora em .gitignore
.DS_Store               # Sistema macOS
*.log                   # Log files
```

---

**Última atualização:** Abril 2026
