# 🏗️ Arquitetura do MeClinic

## Visão Geral da Arquitetura

MeClinic segue uma arquitetura em **3 camadas**:

```
┌─────────────────────────────────────────────────────────────────┐
│                          CAMADA 1: APRESENTAÇÃO                 │
│                    React SPA (Single Page Application)           │
│          ├─ Componentes de UI reutilizáveis                     │
│          ├─ Páginas principais                                   │
│          └─ Temas e internacionalização                         │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP REST API (Port 5000)
┌────────────────────────▼────────────────────────────────────────┐
│                     CAMADA 2: LÓGICA DE NEGÓCIO                 │
│                  Node.js/Express (Backend API)                   │
│          ├─ Autenticação & Autorização                          │
│          ├─ Validação de dados                                   │
│          ├─ Regras de negócio                                    │
│          ├─ Geração de PDFs                                      │
│          ├─ Envio de emails                                      │
│          └─ Tarefas agendadas                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │ SQL Queries
┌────────────────────────▼────────────────────────────────────────┐
│                    CAMADA 3: PERSISTÊNCIA                        │
│                    PostgreSQL Database                           │
│          ├─ Tabelas de dados                                     │
│          ├─ Triggers e stored functions                          │
│          └─ Índices e otimizações                                │
└─────────────────────────────────────────────────────────────────┘
```

## 🖥️ Backend (Node.js/Express)

### Estrutura de Diretórios

```
server/
├── index.js                 # Servidor principal
├── db.js                    # Conexão PostgreSQL & pool
├── .env                     # Variáveis de ambiente
├── package.json             # Dependências
└── node_modules/            # Pacotes instalados
```

### Arquivo Principal: index.js

O arquivo `server/index.js` contém:

1. **Inicialização Express**
   ```javascript
   const app = express();
   app.use(cors());           // Habilita CORS
   app.use(express.json());   // Parser JSON
   ```

2. **Inicialização BD**
   - Função `initDB()` que cria tabelas e normaliza dados
   - Triggers automáticos para categorização de produtos
   - Verificação de stocks mínimos

3. **Rotas de Autenticação**
   - POST `/auth/register` - Registro de usuário
   - POST `/auth/login` - Login simples
   - POST `/auth/verify-2fa` - Verificar código 2FA
   - POST `/auth/forgot-password` - Reset de senha

4. **Rotas de Pacientes**
   - GET `/pacientes` - Listar todos
   - POST `/pacientes` - Criar novo
   - GET `/pacientes/:id` - Buscar por ID
   - PUT `/pacientes/:id` - Atualizar
   - DELETE `/pacientes/:id` - Deletar

5. **Rotas de Consultas**
   - GET `/consultas` - Listar
   - POST `/consultas` - Criar
   - PUT `/consultas/:id` - Atualizar

6. **Rotas de Produtos**
   - GET `/produtos` - Listar com filtros
   - POST `/produtos` - Criar
   - PUT `/produtos/:id` - Atualizar stock
   - DELETE `/produtos/:id` - Deletar

7. **Rotas de Faturação**
   - GET `/faturas` - Listar
   - POST `/faturas` - Criar
   - GET `/faturas/:id/pdf` - Gerar PDF

8. **Rotas de Utilizadores**
   - GET `/utilizadores` - Listar (admin)
   - POST `/utilizadores` - Criar (admin)
   - PUT `/utilizadores/:id` - Atualizar
   - DELETE `/utilizadores/:id` - Deletar (admin)

### Fluxo de Requisição

```
1. Cliente faz requisição HTTP
   ↓
2. Express recebe no endpoint correspondente
   ↓
3. Middleware de validação (se aplicável)
   ↓
4. Verificar autenticação (JWT token)
   ↓
5. Verificar autorização (role/permissão)
   ↓
6. Executar lógica de negócio
   ↓
7. Query ao PostgreSQL (usando pool.query)
   ↓
8. Processar resultado
   ↓
9. Enviar resposta JSON
```

## ⚛️ Frontend (React)

### Estrutura de Diretórios

```
meclinic-app/client/src/
├── pages/                   # Páginas principais
│   ├── Auth.js             # Login/Registro
│   ├── Dashboard.js        # Painel principal
│   ├── Pacientes.js        # Gestão de pacientes
│   ├── Consultas.js        # Consultas
│   ├── Inventory.js        # Inventário
│   ├── Faturacao.js        # Faturação
│   ├── FichasTecnicas.js   # Fichas técnicas
│   ├── Report.js           # Relatórios
│   ├── Users.js            # Gestão de usuários
│   └── Settings.js         # Configurações
│
├── components/              # Componentes reutilizáveis
│   ├── Sidebar.js          # Menu lateral
│   ├── Odontograma.js      # Odontograma dental
│   ├── BarcodeScanner.js   # Scanner código barras
│   ├── ProductModal.js     # Modal de produtos
│   ├── InventoryList.js    # Lista de inventory
│   └── Assinatura.js       # Canvas assinatura digital
│
├── App.js                   # Componente raiz
├── App.css                  # Estilos globais
├── index.js                 # Entry point
├── LanguageContext.js       # Contexto de idiomas (PT/EN)
├── ThemeContext.js          # Contexto de temas (Light/Dark)
└── mockData.js              # Dados fictícios para testes
```

### Fluxo de Componentes

```
App.js
├── ThemeProvider/LanguageProvider
│   ├── Auth (quando não autenticado)
│   └── MainLayout
│       ├── Sidebar
│       └── Routes
│           ├── Dashboard
│           ├── Pacientes
│           ├── Consultas
│           ├── Inventory
│           ├── Faturacao
│           ├── FichasTecnicas
│           ├── Report
│           ├── Users
│           └── Settings
```

### Gestão de Estado

**Contextos utilizados:**
- `ThemeContext` - Tema global (claro/escuro)
- `LanguageContext` - Idioma global (PT/EN)
- `useState` local - Estados de componentes
- `localStorage` - Persistência de sessão do usuário

## 📊 Fluxos de Dados Críticos

### 1. Fluxo de Autenticação

```javascript
┌─ PAGE LOGIN
│  └─ Utilizador insere email + senha
│     └─ POST /auth/login
│        └─ Backend valida + retorna QR Code 2FA
│           └─ Utilizador escaneia QR
│              └─ POST /auth/verify-2fa
│                 └─ Backend valida + retorna JWT
│                    └─ Frontend armazena JWT em localStorage
│                       └─ Redirecionado para Dashboard
```

### 2. Fluxo de Paciente

```javascript
Pacientes Page
└─ GET /pacientes               // Lista todos
└─ Utilizador clica em paciente
   └─ GET /pacientes/:id        // Detalhes
      └─ Renderiza dados + opções
         ├─ PUT /pacientes/:id  // Atualizar
         ├─ Upload exames
         └─ Ver histórico em componentes
```

### 3. Fluxo de Consulta

```javascript
Consultas Page
└─ GET /consultas
   └─ Renderiza tabela
      └─ Usuário preenche formulário
         └─ POST /consultas      // Criar
            └─ Backend registra em BD
               └─ Sucesso → Atualiza lista
```

### 4. Fluxo de Inventário

```javascript
Inventory Page
└─ GET /produtos                // Lista com filtros
   └─ Renderiza tabela/grid
      ├─ PUT /produtos/:id      // Atualizar stock
      ├─ DELETE /produtos/:id   // Remover
      ├─ POST /produtos         // Adicionar
      └─ BarcodeScanner para rápida entrada
```

## 🔐 Fluxo de Segurança

### Estrutura JWT

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": 1,
    "email": "admin@clinica.pt",
    "role": "admin",
    "exp": 1743600000,
    "iat": 1743513600
  },
  "signature": "HMAC-SHA256(...)"
}
```

### Verificação em Cada Requisição

```javascript
// Middleware de autenticação
function validateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sem token' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}
```

## 🗄️ Banco de Dados - Relacionamentos

```
utilizadores (1) ───────────── (many) consultas
    |
    └─ (admin, dentista, assistente)

pacientes (1) ─────────────── (many) consultas
    |
    └─ historico clinico
    └─ (many) exames_paciente

produtos (1) ─────────────── (many) faturas
    |
    └─ inventario
    └─ categorias autom.

faturas (1) ───────────────── (many) itens_fatura
    |
    └─ (many) pacientes (N:M)
```

## ⚡ Performance & Otimizações

### No Backend
- **Connection Pooling** - Máximo 20 conexões simultâneas
- **Índices** - Em colunas frequentemente consultadas
- **Caching** - Dados estáticos em memória
- **Paginação** - Queries com LIMIT/OFFSET

### No Frontend
- **Code Splitting** - Lazy loading de páginas
- **Memoização** - Componentes com React.memo
- **LocalStorage** - Cache de dados do utilizador

### No Database
- **Prepared Statements** - Previne SQL injection
- **Triggers** - Validações automáticas
- **Índices** - Acelera queries frequentes

## 🔄 Ciclo de Vida da Requisição Completo

```
1. CLIENTE (React)
   - Utilizador interage (clique, submit)
   - Componente chama fetch() com token JWT
   
2. HTTP TRANSPORT
   - Requisição viaja para servidor
   - Headers incluem: Content-Type, Authorization
   
3. SERVIDOR (Express)
   - Recebe em /endpoint
   - Middleware de CORS valida origme  - Middleware de parse JSON
   - Middleware de autenticação valida JWT
   
4. LÓGICA DE NEGÓCIO
   - Validação de dados
   - Aplicação de regras
   
5. BANCO DE DADOS
   - Query preparada (evita SQL injection)
   - Executa e retorna resultados
   
6. RESPOSTA SERVIDOR
   - Formata em JSON
   - Envia status HTTP apropriado
   
7. BROWSER
   - Recebe resposta
   - React atualiza estado
   - Componentes renderizam
   
8. UI
   - Utilizador vê resultado
```

## 🚀 Escalabilidade Futura

### Mudanças Recomendadas para Scale

1. **Frontend**
   - Redux/Zustand para estado global melhor
   - React Query para cache de dados
   - Webpack optimization

2. **Backend**
   - Separar imports em múltiplos arquivos
   - Usar GraphQL (além de REST)
   - Implementar cache com Redis
   - Usar Message Queue (RabbitMQ/Kafka)

3. **Database**
   - Read replicas para consultas
   - Sharding por clínica
   - Backup automático e redundância

4. **DevOps**
   - Docker & Kubernetes
   - CI/CD com GitHub Actions
   - Monitoring com Prometheus/Grafana
   - Load balancer (Nginx)

---

**Última atualização:** Abril 2026
