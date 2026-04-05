# MeClinic — Relatório Técnico do Projeto

> Documento de referência para relatório académico/profissional.  
> Abrange arquitetura, segurança, backend, base de dados, frontend e testes.

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Segurança — Medidas Implementadas](#3-segurança--medidas-implementadas)
4. [Backend — Estrutura e Componentes](#4-backend--estrutura-e-componentes)
5. [Base de Dados](#5-base-de-dados)
6. [Frontend — React](#6-frontend--react)
7. [Autenticação e Autorização](#7-autenticação-e-autorização)
8. [Rate Limiting](#8-rate-limiting)
9. [Validação de Dados](#9-validação-de-dados)
10. [Sistema de Testes](#10-sistema-de-testes)
11. [Auditoria de Segurança — Problemas Encontrados e Corrigidos](#11-auditoria-de-segurança--problemas-encontrados-e-corrigidos)
12. [Funcionalidades Implementadas (Roadmap)](#12-funcionalidades-implementadas-roadmap)
13. [Como Executar o Projeto](#13-como-executar-o-projeto)
14. [Referências e Standards Utilizados](#14-referências-e-standards-utilizados)

---

## 1. Visão Geral do Projeto

O **MeClinic** é uma aplicação web de gestão para clínicas dentárias, desenvolvida com Node.js/Express no backend e React no frontend, com PostgreSQL como base de dados relacional.

### Funcionalidades principais
| Módulo | Descrição |
|--------|-----------|
| Autenticação | Login/registo com JWT, MFA por e-mail, refresh tokens |
| Pacientes | CRUD completo, pesquisa, paginação |
| Consultas | Agendamento, estado (pendente/confirmada/concluída/cancelada) |
| Produtos/Stock | Controlo de inventário, alertas de stock baixo |
| Faturação | Criação e listagem de faturas por paciente |
| Relatórios | Relatórios automáticos semanais por e-mail |

---

## 2. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│                    Cliente (React)                   │
│  porta 5000 (dev) / build estática servida no 4000  │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/HTTPS + JSON
                     ▼
┌─────────────────────────────────────────────────────┐
│               Servidor (Node.js/Express)             │
│  porta 4000 (prod) / 3000 (dev)                     │
│                                                     │
│  Middleware: Helmet · CORS · Rate Limit · Auth JWT  │
│  Rotas: /api/auth · /api/pacientes · /api/consultas │
│         /api/produtos · /api/faturacao · /api/reports│
└────────────────────┬────────────────────────────────┘
                     │ pg (node-postgres)
                     ▼
┌─────────────────────────────────────────────────────┐
│                  PostgreSQL (meclinic_db)            │
│  Tabelas: utilizadores · pacientes · consultas      │
│           produtos · faturas · activity_log         │
└─────────────────────────────────────────────────────┘
```

### Estrutura de pastas relevante
```
server/
├── controllers/      ← lógica de negócio por domínio
├── models/           ← acesso direto à BD (queries SQL parameterizadas)
├── routes/           ← definição de rotas e aplicação de middleware
├── middleware/       ← autenticação JWT, funções reutilizáveis
├── validation/       ← schemas Joi para cada endpoint
├── utils/            ← logger, tokenStore, helpers
└── services/         ← envio de e-mail, relatórios agendados
meclinic-app/client/src/
├── pages/            ← componentes de página (Auth, Pacientes, Consultas…)
├── components/       ← componentes reutilizáveis
└── services/api.js   ← camada centralizada de chamadas HTTP
```

---

## 3. Segurança — Medidas Implementadas

### 3.1 Cabeçalhos HTTP — Helmet
O middleware **Helmet** é aplicado globalmente e configura automaticamente os seguintes cabeçalhos de segurança:

| Cabeçalho | Proteção |
|-----------|----------|
| `Content-Security-Policy` | Previne XSS e injeção de scripts |
| `X-Frame-Options: DENY` | Previne clickjacking |
| `X-Content-Type-Options: nosniff` | Previne MIME-sniffing |
| `Strict-Transport-Security` | Obriga HTTPS (em produção) |
| `Referrer-Policy` | Limita informação de referrer |

### 3.2 CORS (Cross-Origin Resource Sharing)
Configuração restrita: apenas origens explicitamente autorizadas podem fazer pedidos.

```js
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3050',
  'http://localhost:3051',
  'http://localhost:5000',
];
```

- Normalização de trailing slash (evita contornar whitelist com `/`)
- Método + cabeçalhos permitidos especificados explicitamente
- Credenciais (`credentials: true`) ativas apenas para origens autorizadas

### 3.3 Autenticação e Tokens JWT
- **Access token**: expiração de 1 hora (reduzida de 24h → 1h)
- **Refresh token**: expiração de 7 dias, armazenado em `tokenStore` (revogável)
- Tokens assinados com `HS256` e secret gerado aleatoriamente (mínimo 32 bytes)
- Verificação do secret mínimo na inicialização do servidor
- `Bearer` token exigido em todos os endpoints protegidos

### 3.4 Passwords — bcrypt
- Hashing com bcrypt, **fator de custo 12** (brute-force resistente)
- Nunca armazenadas em texto claro
- Comparação segura com `bcrypt.compare()` (timing-safe)

### 3.5 Autenticação Multi-Fator (MFA)
- Código de 6 dígitos enviado por e-mail no login
- Código com validade de 10 minutos
- Máximo 3 tentativas antes de bloqueio
- Tabela `mfa_attempts` na BD para auditoria

### 3.6 Proteção contra SQL Injection
- **100% queries parameterizadas** com `node-postgres` (`$1, $2, ...`)
- Sem concatenação de strings nas queries
- Validação Joi antes de chegar ao modelo

### 3.7 Proteção contra XSS
- Sanitização de inputs com `xss` antes de persistir texto livre
- Cabeçalhos CSP via Helmet
- React escapa JSX por defeito no frontend

### 3.8 Proteção contra CSRF
- SPA com JWT stateless: não há cookies de sessão, logo CSRF não é aplicável
- Tokens JWT em `Authorization: Bearer` (não em cookies)

### 3.9 Exposição de Informação
- Mensagens de erro genéricas para o cliente
- Stack traces enviados apenas em `NODE_ENV=development`
- Sem `X-Powered-By` (removido pelo Helmet)
- IDs internos de BD não expostos em mensagens de erro

### 3.10 Registo de Atividade (Activity Log)
- Tabela `activity_log` regista todas as ações criticas
- Logger estruturado com níveis: `INFO`, `WARN`, `ERROR`
- Formato JSON para fácil ingestão em ferramentas de monitoring

---

## 4. Backend — Estrutura e Componentes

### 4.1 Controladores (`controllers/`)
Cada domínio tem o seu controlador. Seguem o padrão:
1. Validação Joi do `req.body`/`req.params`
2. Chamada ao model (SQL)
3. Resposta JSON com código HTTP apropriado

| Ficheiro | Responsabilidade |
|----------|-----------------|
| `authController.js` | Login, registo, MFA, refresh, logout, perfil |
| `pacientesController.js` | CRUD de pacientes, pesquisa |
| `consultasController.js` | Agendamento, atualização de estado |
| `produtosController.js` | Produtos, stock, alertas |
| `faturaçãoController.js` | Faturas por paciente |
| `reportsController.js` | Geração de relatórios |

### 4.2 Modelos (`models/`)
Camada de acesso à base de dados. Apenas SQL parameterizado.

```js
// Exemplo — User.findByEmail (seguro contra SQL injection)
static async findByEmail(email) {
  const res = await db.query(
    'SELECT * FROM utilizadores WHERE email = $1',
    [email]
  );
  return res.rows[0] || null;
}
```

### 4.3 Middleware
| Middleware | Função |
|------------|--------|
| `auth.js` | Verifica JWT em `Authorization: Bearer`, injeta `req.user` |
| Helmet | Cabeçalhos de segurança HTTP |
| CORS | Whitelist de origens |
| express-rate-limit | Proteção contra força bruta e abuso |
| `errorHandler.js` | Tratamento centralizado de erros, logging |

### 4.4 Tratamento de Erros
- `asyncHandler` — wrapper que captura erros assíncronos sem `try/catch` em cada controlador
- `AppError` — classe de erro customizada com `statusCode` e `details`
- Handler global em `errorHandler.js` formata resposta consistente:

```json
{
  "success": false,
  "message": "Mensagem legível",
  "details": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 5. Base de Dados

### 5.1 Tecnologia
PostgreSQL 15+, acesso via `node-postgres` (pool de conexões).

### 5.2 Principais Tabelas

| Tabela | Colunas relevantes |
|--------|-------------------|
| `utilizadores` | `id, nome, email, password_hash, role, mfa_enabled` |
| `pacientes` | `id, nome, email, telefone, data_nascimento, created_at` |
| `consultas` | `id, paciente_id, data_consulta, hora_consulta, motivo, status, diagnostico, tratamento, updated_at` |
| `produtos` | `id, nome, quantidade, preco, stock_minimo` |
| `faturas` | `id, paciente_id, total, data_emissao, estado` |
| `activity_log` | `id, user_id, action, target_type, target_id, timestamp` |

### 5.3 Migrações Aplicadas
Durante o desenvolvimento, foram aplicadas as seguintes alterações:

```sql
-- Adicionar colunas em falta na tabela consultas
ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS diagnostico  TEXT,
  ADD COLUMN IF NOT EXISTS tratamento   TEXT,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP;

-- Tabela de registo de atividade
-- (ver Database/001_create_activity_log_table.sql)
```

### 5.4 Pool de Conexões
```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,               // máximo de conexões concurrent
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 6. Frontend — React

### 6.1 Tecnologia e Dependências
- React 19, React Router v6
- Axios-free: chamadas HTTP com `fetch` nativo via `api.js`
- Build com Create React App

### 6.2 Camada de API Centralizada (`services/api.js`)
Todas as chamadas HTTP passam por `api.js`. Funcionalidades:

| Função | Comportamento |
|--------|--------------|
| `apiCall(url, options)` | Wrapper fetch com auth header automático |
| `tryRefreshToken()` | Renova access token via refresh token |
| Auto-retry em 401 | Em resposta 401, tenta refresh e repete o pedido |
| `clearAuth()` | Limpa localStorage e redireciona para `/` |

```js
// Fluxo automático de renovação de token
async function apiCall(url, options = {}, isRetry = false) {
  // ... adiciona Authorization header ...
  const res = await fetch(url, options);
  if (res.status === 401 && !isRetry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiCall(url, options, true); // retry
    clearAuth();
  }
  return res;
}
```

### 6.3 Paginação em Pacientes
A página de pacientes suporta carregamento paginado do servidor:

- Parâmetros: `?page=1&limit=20`  
- Estado: `page`, `hasMore`, `loadingMore`  
- Botão "Carregar mais" aparece quando `hasMore && !pesquisa`  
- Pesquisa local nos pacientes já carregados

### 6.4 Gestão de Autenticação (`pages/Auth.js`)
- Salva `token` e `refresh_token` no `localStorage` após login
- Suporta fluxo MFA: pede código de 6 dígitos após credenciais válidas
- Redireciona para `/dashboard` após autenticação completa

### 6.5 Páginas Disponíveis
| Página | Rota |
|--------|------|
| Login/Registo | `/` |
| Dashboard | `/dashboard` |
| Pacientes | `/pacientes` |
| Consultas | `/consultas` |
| Produtos | `/produtos` |
| Faturação | `/faturacao` |
| Relatórios | `/relatorios` |
| Perfil | `/perfil` |

---

## 7. Autenticação e Autorização

### 7.1 Fluxo de Login Completo

```
Cliente                          Servidor
   │                                │
   ├─ POST /api/auth/login ─────────►│
   │  {email, password}             │ Verifica bcrypt
   │                                │ Gera código MFA
   │◄─ {requiresMFA: true} ─────────┤ Envia e-mail
   │                                │
   ├─ POST /api/auth/verify-mfa ────►│
   │  {code}                        │ Valida código
   │                                │ Gera access + refresh token
   │◄─ {token, refreshToken} ───────┤
   │                                │
   ├─ GET /api/... ─────────────────►│
   │  Authorization: Bearer {token} │ Verifica JWT
   │◄─ {dados} ─────────────────────┤
   │                                │
   │ (token expira em 1h)           │
   ├─ POST /api/auth/refresh ────────►│
   │  {refreshToken}                │ Valida em tokenStore + JWT
   │◄─ {token} ─────────────────────┤ Novo access token
```

### 7.2 Controlo de Acesso por Papel (RBAC)
| Papel | Permissões |
|-------|-----------|
| `admin` | Acesso total |
| `assistente` | Pacientes, Consultas, Faturação (sem gestão de utilizadores) |

### 7.3 tokenStore (Refresh Tokens)
```js
// server/utils/tokenStore.js
// Map em memória: token → { userId, expiresAt }
// Auto-purge a cada 30 minutos de tokens expirados
// API: set(token, userId, ttlMs), get(token), revoke(token)
```

---

## 8. Rate Limiting

Três níveis de proteção:

| Limiter | Rota | Limite | Janela |
|---------|------|--------|--------|
| `loginLimiter` | `POST /api/auth/login`, `POST /api/auth/register` | 10 pedidos | 15 min |
| `authLimiter` (geral) | Todas as rotas `/api/auth/*` | 20 pedidos | 15 min |
| `apiLimiter` (global) | Todas as rotas `/api/*` | 100 pedidos | 15 min |

Resposta ao exceder:
```json
HTTP 429 Too Many Requests
{ "success": false, "message": "Muitos pedidos. Tente mais tarde." }
```

---

## 9. Validação de Dados

Todas as entradas do utilizador são validadas com **Joi** antes de chegar à base de dados.

### Exemplo — Schema de criação de consulta
```js
const createConsultaSchema = Joi.object({
  nome:           Joi.string().trim().min(2).max(100).required(),
  email:          Joi.string().email().optional().allow(''),
  telefone:       Joi.string().pattern(/^[0-9+\s\-()]{7,20}$/).required(),
  data:           Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  hora:           Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  motivo:         Joi.string().trim().min(3).max(500).optional(),
  procedimento_id: Joi.number().integer().positive().optional(),
});
```

Regras aplicadas:
- Tipos explícitos (string, number, boolean)
- Tamanhos mínimos e máximos
- Padrões regex para datas, horas, telefones
- Campos opcionais vs obrigatórios claramente definidos
- `.unknown(false)` em schemas onde campos extra não são permitidos

---

## 10. Sistema de Testes

### 10.1 Tecnologia
- **Jest** — framework de testes
- **Supertest** — testes de integração HTTP (sem servidor real)

### 10.2 Estrutura
```
tests/
├── unit/
│   ├── consultasValidation.test.js   ← 10 testes de schemas Joi
│   └── tokenStore.test.js            ← 4 testes de tokenStore
└── integration/
    └── auth.test.js                  ← 8 testes de rotas de auth
```

### 10.3 Resultados
```
Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
```

### 10.4 Cobertura dos Testes

**Testes unitários — `consultasValidation.test.js`**
- Payload válido aceite
- Campos obrigatórios em falta → 400
- Formato de data inválido → rejeitado
- Formato de hora inválido → rejeitado
- Campos opcionais omitidos → aceite
- Schema de atualização com campos parciais

**Testes unitários — `tokenStore.test.js`**
- `set` + `get` retorna `userId` correto
- Token desconhecido retorna `null`
- `revoke` invalida o token
- Token expirado retorna `null` no `get`

**Testes de integração — `auth.test.js`**
- `POST /api/auth/login` — body vazio → 400
- `POST /api/auth/login` — email inválido → 400
- `POST /api/auth/login` — credenciais erradas → 401
- `POST /api/auth/refresh` — sem token → 401
- `POST /api/auth/refresh` — token inválido → 401
- `GET /api/auth/profile` — sem token → 401
- `GET /api/auth/profile` — token inválido → 401
- `GET /api/health` — responde 200

### 10.5 Executar os Testes
```bash
cd server
npm test                          # todos os testes
npm test -- tests/unit/           # apenas unitários
npm test -- tests/integration/    # apenas integração
```

---

## 11. Auditoria de Segurança — Problemas Encontrados e Corrigidos

### 11.1 Vulnerabilidades Críticas (resolvidas)

| # | Vulnerabilidade | OWASP | Solução Aplicada |
|---|----------------|-------|-----------------|
| 1 | SQL Injection — concatenação de strings em queries | A03 | Migração para queries 100% parametrizadas |
| 2 | Exposição de stack traces em produção | A05 | `NODE_ENV` condiciona resposta de erro |
| 3 | JWT sem expiração (tokens eternos) | A07 | Access token 1h + refresh token 7d |
| 4 | Secret JWT curto / hardcoded | A02 | Validação de comprimento mínimo + `.env` |
| 5 | Passwords com bcrypt fator 10 | A02 | Aumentado para fator 12 |
| 6 | Rate limiting ausente em `/login` | A07 | loginLimiter 10/15min |
| 7 | CORS `*` (wildcard) em produção | A05 | Whitelist explícita de origens |
| 8 | Sem cabeçalhos de segurança HTTP | A05 | Helmet adicionado |
| 9 | Informação sensível em logs | A09 | Sanitização de logs, sem passwords |
| 10 | Validação de input ausente/incompleta | A03 | Joi em todos os endpoints |

### 11.2 Vulnerabilidades Médias (resolvidas)

| # | Problema | Solução |
|---|----------|---------|
| 11 | `console.log` com dados de utilizadores | Substituído por logger estruturado |
| 12 | Rotas sem autenticação (`/api/pacientes` público) | middleware `auth` aplicado |
| 13 | Sem controlo de acesso por papel | RBAC com `requireRole()` |
| 14 | Sem limite de tamanho no body | `express.json({ limit: '10kb' })` |
| 15 | Tokens de refresh não revogáveis | tokenStore com revogação explícita |
| 16 | Sem registo de atividade | Tabela `activity_log` + middleware |
| 17 | Passwords em variáveis de ambiente expostas | `.env` no `.gitignore` |
| 18 | Mensagens de erro revelam estrutura BD | Mensagens genéricas para o cliente |

### 11.3 Bugs Funcionais (resolvidos)

| # | Problema | Causa | Solução |
|---|----------|-------|---------|
| 19 | `POST /api/consultas` retornava 400 | Schema esperava `paciente_id` mas cliente enviava `nome/email/telefone` | Schema e controller reescritos |
| 20 | `column "diagnostico" does not exist` | Colunas em falta na tabela `consultas` | `ALTER TABLE` para adicionar colunas |
| 21 | `Consulta.update()` usava colunas inexistentes | Model desatualizado | Model corrigido |
| 22 | CORS bloqueava `http://localhost:5000/` | Trailing slash não normalizado | Normalização adicionada |
| 23 | `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` | `trust proxy` não configurado | `app.set('trust proxy', 'loopback')` |

---

## 12. Funcionalidades Implementadas (Roadmap)

### ✅ Item 1 — Correto mapeamento de campos em consultas
Os schemas Joi e controllers foram alinhados com o payload real enviado pelo frontend:
- Schema: `nome, email, telefone, data, hora, motivo, procedimento_id`
- Controller: find-or-create de paciente por telefone, mapeia `data`/`hora` → colunas BD

### ✅ Item 2 — Rate Limiting diferenciado
Rate limit mais restrito nas rotas de autenticação:
```js
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutos
  max: 10,                     // máximo 10 tentativas
  message: { success: false, message: 'Demasiadas tentativas de login.' }
});
```

### ✅ Item 3 — Sistema de Refresh Tokens
Implementação completa do fluxo de renovação de tokens:

**Backend:**
- `server/utils/tokenStore.js` — Map em memória com TTL
- `authController.login()` — retorna `{ token, refreshToken }`
- `POST /api/auth/refresh` — valida e renova access token
- `authController.logout()` — revoga refresh token

**Frontend:**
- `api.js` — auto-retry em 401 com renovação transparente
- `Auth.js` — guarda `refresh_token` em localStorage

### ✅ Item 4 — Paginação no Frontend (Pacientes)
```js
// 20 pacientes por página, carregamento progressivo
const PAGE_SIZE = 20;
// GET /api/pacientes?page=1&limit=20
// Botão "Carregar mais" quando hasMore === true
```

### ✅ Item 5 — Suite de Testes Automatizados
25 testes automatizados cobrindo:
- Validação de schemas
- tokenStore (unit)  
- Rotas de autenticação (integration)

---

## 13. Como Executar o Projeto

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 1. Configuração de variáveis de ambiente
```bash
# Copiar template
cp server/.env.example server/.env

# Variáveis obrigatórias:
DATABASE_URL=postgresql://user:pass@localhost:5432/meclinic_db
JWT_SECRET=<string aleatória com mínimo 32 caracteres>
EMAIL_USER=<smtp user>
EMAIL_PASS=<smtp password>
NODE_ENV=development
```

### 2. Base de Dados
```bash
# Criar base de dados
createdb meclinic_db

# Aplicar schema
psql meclinic_db < Database/Tables.sql
psql meclinic_db < Database/001_create_activity_log_table.sql
```

### 3. Instalar dependências
```bash
npm install           # raiz (workspace)
cd server && npm install
cd ../meclinic-app/client && npm install
```

### 4. Desenvolvimento
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd meclinic-app/client && npm start
```

### 5. Produção
```bash
# Build do frontend
cd meclinic-app/client && npm run build

# Iniciar servidor (serve o build estático)
cd server && npm start
```

### 6. Testes
```bash
cd server
npm test              # todos os 25 testes
```

---

## 14. Referências e Standards Utilizados

| Standard / Biblioteca | Versão | Uso |
|-----------------------|--------|-----|
| OWASP Top 10 (2021) | — | Guia principal de segurança |
| express-validator / Joi | 17.x | Validação de inputs |
| bcrypt | 5.x | Hashing de passwords |
| jsonwebtoken | 9.x | Geração e verificação de JWT |
| helmet | 8.x | Cabeçalhos de segurança HTTP |
| express-rate-limit | 7.x | Proteção bruta-força |
| xss | 1.x | Sanitização contra XSS |
| node-postgres (pg) | 8.x | Queries parameterizadas |
| Jest | 30.x | Framework de testes |
| Supertest | 7.x | Testes de integração HTTP |
| React | 19.x | Interface de utilizador |

---

*Documento gerado em: Abril 2025*  
*Versão: 1.0*
