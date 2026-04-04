# Refactoring Backend - Nova Arquitetura Modular

## Visão Geral

O backend monolítico foi decomposto em uma arquitetura modular com separação de responsabilidades:

```
server/
├── index.js                 ← ORIGINAL (mantém endpoints legados)
├── index-refactored.js      ← ✨ NOVO - Server refatorizado (usar em produção)
├── 
├── routes/                  ← Definições de rotas
│   ├── auth.routes.js       ✅ Autenticação (4 endpoints)
│   ├── pacientes.routes.js  ✅ Pacientes (12 endpoints)
│   ├── consultas.routes.js  ✅ Consultas (10 endpoints)
│   ├── produtos.routes.js   ✅ Produtos (10 endpoints)
│   └── faturacao.routes.js  ✅ Faturação (8 endpoints)
│
├── controllers/             ← Lógica de negócio
│   ├── authController.js    ✅ Auth (4 actions)
│   ├── pacientesController.js  ✅ Pacientes (11 actions)
│   ├── consultasController.js  ✅ Consultas (10 actions)
│   └── produtosController.js   📋 (próximo)
│
├── models/                  ← Modelos (BD)
│   ├── User.js              ✅ Utilizadores (9 methods)
│   ├── Paciente.js          ✅ Pacientes (15 methods)
│   ├── Consulta.js          ✅ Consultas (16 methods)
│   ├── Produto.js           ✅ Produtos (11 methods)
│   └── Faturacao.js         ✅ Faturação (8 methods)
│
├── middleware/              ← Middlewares
│   ├── auth.js              ✅ JWT + Roles
│   ├── validation.js        ✅ Joi schemas
│   └── errorHandler.js      ✅ Tratamento de erros
│
├── db.js                    ← Conexão PostgreSQL
├── validation.js            ← Schemas Joi
├── errorHandler.js          ← Error handling
└── package.json
```

---

## Arquitetura de Camadas

```
REQUEST
  ↓
ROUTER (routes/auth.routes.js)
  ├─ Rate Limiting (authLimiter)
  ├─ Validação (validateRequest)
  ├─ Middleware de Auth (authMiddleware)
  └─ Handler (asyncHandler)
  ↓
CONTROLLER (controllers/authController.js)
  └─ Lógica de Negócio
  ↓
MODEL (models/User.js)
  └─ Queries de BD
  ↓
DATABASE (PostgreSQL)
  ↓
RESPONSE
```

---

## Mudanças Principais

### 1. **Routes** (`routes/auth.routes.js`)

Antes (index.js monolítico):
```javascript
app.post("/api/register", authLimiter, validateRequest(...), async (req, res) => {
  try {
    // 50 linhas aqui
  } catch (err) { ... }
});
```

Depois (routes/auth.routes.js):
```javascript
router.post(
  '/register',
  validateRequest(validation.registerSchema),
  asyncHandler(AuthController.register)
);
```

✅ **Vantagens:**
- Rotas centralizadas
- Mais legível
- Fácil de adicionar novo middleware
- Padronizado

### 2. **Controllers** (`controllers/authController.js`)

Lógica de negócio isolada:
```javascript
class AuthController {
  static async register(req, res, next) {
    // Lógica aqui
  }
  
  static async login(req, res, next) {
    // Lógica aqui
  }
}
```

✅ **Vantagens:**
- Fácil de testar (unit tests)
- Reutilizável
- Sem duplicação
- Responsabilidade única

### 3. **Models** (`models/User.js`)

Queries centralizadas:
```javascript
class User {
  static async findByEmail(email) { ... }
  static async create(nome, email, password) { ... }
  static async verifyPassword(password, hash) { ... }
}
```

✅ **Vantagens:**
- DRY principle
- Fácil manutenção de queries
- Lógica de BD isolada
- Testável

### 4. **Middleware** (`middleware/auth.js`)

Autenticação reusável:
```javascript
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  next();
};
```

✅ **Vantagens:**
- Aplicável a qualquer rota
- Protege endpoints automaticamente
- Centralizado

---

## Como Usar

### 1. Iniciar o Servidor Refatorizado

```bash
cd server
node index-refactored.js
```

Saída:
```
✅ Servidor ativo na porta 5000
🔒 CORS: Origens permitidas [http://localhost:3050, http://localhost:3000]
📦 NODE_ENV: development

📚 Documentação:
   POST   /api/auth/register  - Registar
   POST   /api/auth/login     - Login
   GET    /api/auth/profile   - Profile (requer token)
   POST   /api/auth/logout    - Logout
```

### 2. APIs Refatorizadas

#### POST `/api/auth/register`
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123"
  }'
```

Resposta:
```json
{
  "message": "Conta criada com sucesso!",
  "user": { "id": 1, "nome": "João Silva", "email": "joao@example.com", "role": "USER" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mfa": {
    "enabled": true,
    "qrCodeUrl": "data:image/png;base64,...",
    "secret": "JBSWY3DPEBLW64T..."
  }
}
```

#### POST `/api/auth/login`
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "SecurePass123",
    "mfaToken": "123456"
  }'
```

#### GET `/api/auth/profile` (Requer Token)
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:5000/api/auth/profile
```

---

## Próximas Etapas

### Fase 1: Refactoring Auth ✅ COMPLETO

- [x] Criar estrutura de pastas (routes, controllers, models, middleware)
- [x] Modelo User (queries centralizadas)
- [x] Controller AuthController (lógica de negócio)
- [x] Rotas auth.routes.js (endpoints)
- [x] Middleware auth.js (JWT + roles)
- [x] Testar sintaxe

### Fase 2: Refactoring Pacientes ✅ COMPLETO

- [x] Criar modelo Paciente (15 métodos)
- [x] Criar controller PacientesController (11 actions)
- [x] Criar rotas pacientes.routes.js (12 endpoints)
- [x] Integrar em index-refactored.js
- [x] Testar sintaxe

### Fase 3: Refactoring Consultas (✅ COMPLETO)

- [x] Modelo Consulta (16 métodos)
- [x] Controller Consultas (10 actions)
- [x] Rotas consultas.routes.js (10 endpoints)
- [x] Integrar em index-refactored.js
- [x] Testar sintaxe
- [x] Documentação API_CONSULTAS.md

### Fase 4: Refactoring Produtos (✅ COMPLETO)

- [x] Modelo Produto (11 métodos)
- [x] Controller Produtos (9 actions)
- [x] Rotas produtos.routes.js (10 endpoints)
- [x] Integrar em index-refactored.js
- [x] Testar sintaxe
- [x] Documentação API_PRODUTOS.md

### Fase 5: Refactoring Faturação (✅ COMPLETO)

- [x] Modelo Faturacao (8 métodos)
- [x] Controller Faturacao (7 actions)
- [x] Rotas faturacao.routes.js (10 endpoints)
- [x] Integrar em index-refactored.js
- [x] Testar sintaxe
- [x] Documentação API_FATURACAO.md

---

## Benefícios da Nova Arquitetura

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Linhas index.js | ~1000+ | ~120 (refactored) |
| Reutilização de código | ❌ Baixa | ✅ Alta |
| Testabilidade | ❌ Difícil | ✅ Fácil |
| Manutenção | ❌ Difícil | ✅ Fácil |
| Escalabilidade | ❌ Limitada | ✅ Escalável |
| Onboarding | ❌ Confuso | ✅ Claro |
| Testes Unitários | ❌ Impossível | ✅ Possível |
| CI/CD | ❌ Arriscado | ✅ Seguro |

---

## Padrões Utilizados

### 1. **Controller Pattern**
Centraliza lógica de negócio da rota

### 2. **Model Pattern**
Abstrai acesso à base de dados

### 3. **Router Pattern**
Organiza rotas em ficheiros separados

### 4. **Middleware Pattern**
Compartilha funcionalidade entre rotas

### 5. **Error Handling Pattern**
Centraliza tratamento de erros

### 6. **Dependency Injection**
Modelos e middlewares injetados onde necessários

---

## Migração Gradual

O ficheiro `index.js` mantém-se funcional durante a transição:

```bash
# Servidor antigo (ainda funciona)
npm start              # node index.js

# Servidor novo (refatorizado)
npm run dev:refactored # node index-refactored.js
```

Quando todos os endpoints estiverem refatorizados:
```bash
# Substituir index.js pelo refatorizado
mv index.js index.backup.js
mv index-refactored.js index.js
npm start
```

---

## Estrutura de Ficheiros Final Esperada

```
server/
├── index.js                     ← Versão final (refactored)
│
├── routes/
│   ├── auth.routes.js           ✅ 4 endpoints
│   ├── pacientes.routes.js      ✅ 12 endpoints
│   ├── consultas.routes.js      ✅ 10 endpoints
│   ├── produtos.routes.js       ✅ 10 endpoints
│   └── faturacao.routes.js      ✅ 8 endpoints
│
├── controllers/
│   ├── authController.js        ✅ 4 actions
│   ├── pacientesController.js   ✅ 11 actions
│   ├── consultasController.js   ✅ 10 actions
│   ├── produtosController.js    ✅ 9 actions
│   └── faturaçãoController.js   ✅ 7 actions
│
├── models/
│   ├── User.js                  ✅ 9 métodos
│   ├── Paciente.js              ✅ 15 métodos
│   ├── Consulta.js              ✅ 16 métodos
│   ├── Produto.js               ✅ 11 métodos
│   └── Faturacao.js             ✅ 8 métodos
│   ├── auth.js                  ✅ JWT + Roles
│   └── validation.js            ✅ Joi schemas
│
├── errorHandler.js              ✅ Error handling
├── validation.js                ✅ Schemas Joi
├── db.js                        ✅ Pool PostgreSQL
└── package.json                 ✅
```

---

## Próxima Ação

Continue refatorando seguindo o mesmo padrão:

1. **Criar modelo** (models/Paciente.js)
2. **Criar controller** (controllers/pacientesController.js)
3. **Criar rotas** (routes/pacientes.routes.js)
4. **Integrar** em index-refactored.js

Pronto para próximo módulo? 🚀
