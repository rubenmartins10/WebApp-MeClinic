# 📋 Log de Alterações ao Projeto

---

## � Correções de Qualidade & Segurança — Sprint Seguinte

### Problemas corrigidos (auditoria — 2.ª ronda)

#### Novos utilitários (`meclinic-app/client/src/utils/`)

| Ficheiro | Descrição |
|---|---|
| `utils/locale.js` | **NOVO** — Função `getActiveLocale(language)` centraliza o mapeamento de idioma → BCP-47 locale. Elimina duplicação em 6 componentes |
| `utils/treatmentPrices.js` | **NOVO** — Constantes `PRECO_CARIE/EXTRACAO/ENDO/COROA/IMPLANTE` extraídas de `Consultas.js` para ficheiro partilhado |

#### Backend (`server/`)

| Ficheiro | Alteração |
|---|---|
| `controllers/produtosController.js` | Parâmetros de paginação `page` e `limit` passam a ser sanitizados: `page ≥ 1`, `1 ≤ limit ≤ 100` (evita consultas sem limite ao BD) |

#### Frontend (`meclinic-app/client/src/`)

| Ficheiro | Alteração |
|---|---|
| `App.js` | Removido `/* eslint-disable */`; `JSON.parse(storedUser)` no `useEffect` envolto em `try/catch` — sessão corrompida no localStorage já não derruba a app |
| `pages/Settings.js` | `JSON.parse` do utilizador e das definições da clínica envolvidos em `try/catch`; chave de token incorreta `meclinic_token` corrigida para `token` |
| `pages/Pacientes.js` | Removido `/* eslint-disable */`; `JSON.parse` do utilizador com `try/catch`; 6 chamadas `fetch` sem `Authorization` corrigidas (POST/GET exames, DELETE exame, DELETE paciente, PUT dados); validação de tipo e tamanho de ficheiro adicionada ao upload de exames (só PDF/JPG/PNG/GIF, máx 10 MB); locale agora vem de `utils/locale.js` |
| `pages/Consultas.js` | Removido `/* eslint-disable */`; `JSON.parse` do utilizador com `try/catch`; constantes `PRECO_*` movidas para `utils/treatmentPrices.js`; locale agora vem de `utils/locale.js` |
| `pages/Dashboard.js` | Locale agora vem de `utils/locale.js` (elimina 1 duplicação) |
| `pages/Faturacao.js` | Locale agora vem de `utils/locale.js`; `.catch(err => console.error(err))` removido do fetch inicial |
| `pages/Report.js` | `JSON.parse` do utilizador com `try/catch`; locale agora vem de `utils/locale.js` |
| `pages/Inventory.js` | Removido `/* eslint-disable */`; locale agora vem de `utils/locale.js`; paginação activada — a componente agora passa `?page=X&limit=20&search=...&categoria=...` à API e mostra controlos Anterior/Próxima quando há mais de uma página |



### Problemas corrigidos (auditoria completa)

#### Backend (`server/`)

| Ficheiro | Alteração |
|---|---|
| `server/db.js` | Removida password `'3rubendavid'` hardcoded. Adicionada validação de arranque: o servidor termina com erro fatal se `DB_PASSWORD` ou `JWT_SECRET` não estiverem no `.env` |
| `server/middleware/auth.js` | Removido fallback inseguro `'sua-chave-secreta'` do JWT |
| `server/controllers/authController.js` | Removido fallback inseguro do JWT; expiração de token alterada de `7d` para `8h` |
| `server/index.js` | CORS corrigido para usar a whitelist `allowedOrigins` (antes aceitava qualquer origem) |
| `server/index.js` | Rate limiting reativado: 200 req/15min geral; 20 req/15min em `/api/auth` (brute-force) |
| `server/index.js` | TLS `rejectUnauthorized` passa a ser `true` em produção (antes era sempre `false`) |
| `server/index.js` | Body parser reduzido de `50mb` para `10mb` |
| `server/controllers/faturaçãoController.js` | Race condition no abate de stock resolvida: usa `pool.connect()` com client dedicado + `SELECT ... FOR UPDATE` + `GREATEST(0, ...)` para evitar stock negativo |

#### Frontend (`meclinic-app/client/src/`)

| Ficheiro | Alteração |
|---|---|
| `pages/Auth.js` | Removidos 3 URLs hardcoded `http://localhost:5000/...` — substituídos por paths relativos `/api/auth/...` |
| `utils/fetchWithToken.js` | Removido `console.log` que expunha todos os requests HTTP na consola de produção |
| `pages/Consultas.js` | `DELETE /api/consultas/:id` passou a enviar o header `Authorization` que faltava |
| `pages/Consultas.js` | Erro ao carregar materiais do procedimento no checkout deixou de ser engolido silenciosamente |

---

## ✅ Limpeza Executada (Histórico Anterior)

**20 ficheiros removidos/reorganizados:**

### Removidos (17 ficheiros):
- ❌ 13 ficheiros de teste/debug do server/
- ❌ 3 ficheiros redundantes (.eslintrc.json, .prettierrc, clear-ts-cache.ps1)
- ❌ 1 ficheiro PRODUCTION_MIGRATION.md (duplicado)

### Movidos (4 ficheiros):
- ✓ apply-migrations.js → scripts/
- ✓ generateCert.js → scripts/
- ✓ get-recovery-code.js → scripts/
- ✓ list-users.js → scripts/

---

## 📁 Estrutura Final Profissional

```
MeClinic/
│
├─ 📚 docs/                        ← DOCUMENTAÇÃO COMPLETA
│  ├─ README.md                   ← Índice de documentação
│  ├─ CODE_OF_CONDUCT.md
│  ├─ CONTRIBUTING.md
│  ├─ CODE_STYLE.md
│  ├─ DEPLOY_CHECKLIST.md
│  ├─ 📖 guias/
│  │  ├─ SETUP.md
│  │  ├─ FRONTEND.md
│  │  ├─ REFACTORING_BACKEND.md
│  │  └─ COMPONENTES.md
│  ├─ 🔖 referencia/
│  │  ├─ ESTRUTURA_PROJETO.md
│  │  ├─ API.md (+ 4 APIs específicas)
│  │  ├─ BANCO_DADOS.md
│  │  ├─ AUTENTICACAO.md
│  │  ├─ VALIDACAO_JOI.md
│  │  ├─ FEATURES.md
│  │  └─ SUMARIO_SEGURANCA.md
│  └─ 🚀 roadmap/
│     ├─ ROADMAP.md
│     ├─ STATUS_PROJETO.md
│     ├─ DEPLOYMENT.md
│     ├─ HTTPS_ESTRATEGIA.md
│     ├─ PLANO_ACAO_PROTECAO_DADOS.md
│     └─ PROTECAO_DADOS_GDPR_COMPLIANCE.md
│
├─ 💻 meclinic-app/                ← APLICAÇÃO COMPLETA
│  ├─ client/                      ← Frontend React
│  │  ├─ src/
│  │  ├─ public/
│  │  ├─ package.json
│  │  └─ build/
│  └─ server/ (remoção de ficheiros de debug)
│
├─ 🗄️ Database/                    ← SCRIPTS SQL
│  └─ *.sql (scripts de criação e migrations)
│
├─ ⚙️ config/                       ← CONFIGURAÇÃO GLOBAL
│  ├─ database.js
│  ├─ constants.js
│  └─ validation.js
│
├─ 🔧 scripts/                     ← SCRIPTS ADMINISTRATIVOS
│  ├─ apply-migrations.js          ← Aplicar migrations BD
│  ├─ generateCert.js              ← Gerar certificados SSL
│  ├─ get-recovery-code.js         ← Recuperar código admin
│  ├─ list-users.js                ← Listar utilizadores
│  ├─ database/
│  ├─ deployment/
│  └─ setup/
│
├─ 📁 server/                      ← BACKEND PURO
│  ├─ index.js                     ← 🔴 FICHEIRO CRÍTICO
│  ├─ db.js                        ← 🔴 FICHEIRO CRÍTICO
│  ├─ errorHandler.js              ← 🔴 FICHEIRO CRÍTICO
│  ├─ .env                         ← 🔴 FICHEIRO CRÍTICO (variáveis)
│  ├─ .env.production.example
│  ├─ package.json                 ← Dependências backend
│  ├─ tsconfig.json
│  ├─ routes/
│  │  ├─ auth.routes.js
│  │  ├─ pacientes.routes.js
│  │  ├─ consultas.routes.js
│  │  ├─ produtos.routes.js
│  │  ├─ faturacao.routes.js
│  │  ├─ modelos.routes.js
│  │  ├─ utilizadores.routes.js
│  │  ├─ stats.routes.js
│  │  └─ reports.routes.js
│  ├─ controllers/                 ← Lógica de negócio
│  ├─ middleware/                  ← Middlewares de autenticação, etc
│  └─ utils/                       ← Funções auxiliares
│
├─ ✅ tests/                       ← TESTES
│  └─ (ficheiros de teste)
│
├─ 📄 FICHEIROS NA RAIZ (APENAS ESSENCIAIS):
│  ├─ README.md                    ← 🔴 LEIA PRIMEIRO
│  ├─ package.json                 ← Dependências root
│  ├─ package-lock.json
│  ├─ tsconfig.json
│  ├─ .env.example
│  ├─ .eslintrc.js                 ← Regras linting
│  ├─ .prettierrc.json             ← Formatação de código
│  ├─ .editorconfig                ← Config editor cross-IDE
│  ├─ .gitignore
│  ├─ MeClinic.code-workspace      ← Workspace VS Code
│  ├─ CODE_OF_CONDUCT.md
│  └─ CONTRIBUTING.md
│
└─ .git/                           ← Git repository
```

---

## 🔴 FICHEIROS CRÍTICOS PARA FUNCIONAMENTO

### Backend (server/):
```javascript
index.js              // Servidor principal + rotas
db.js                 // Pool de conexão com PostgreSQL
errorHandler.js       // Tratamento de erros
.env                  // Variáveis de ambiente (SECRETO!)
```

### Frontend (meclinic-app/client/):
```
src/                  // Código React
public/               // Assets estáticos
package.json          // Dependências React
build/                // Build production
```

### Configuração:
```javascript
config/database.js    // Config BD
config/constants.js   // Constantes globais
config/validation.js  // Regras Joi
```

---

## 📊 Ficheiros Removidos (Seguro)

| Ficheiro | Razão |
|----------|-------|
| `check-*-schema.js` | Scripts de debug/testes |
| `debug-*.js` | Debugging (1x uso) |
| `test-*.js` | Testes ad-hoc (substituídos por tests/) |
| `index.js.backup` | Backup obsoleto |
| `validation.js.backup` | Backup obsoleto |
| `.eslintrc.json` | Duplicado (.eslintrc.js) |
| `.prettierrc` | Duplicado (.prettierrc.json) |
| `clear-ts-cache.ps1` | Script desnecessário |
| `PRODUCTION_MIGRATION.md` | Duplicado em docs/ |

---

## 🚀 Como Usar Depois da Limpeza

### Setup Inicial:
```bash
npm install
cd meclinic-app && npm install
cd ../
```

### Ambiente:
```bash
cp .env.example .env
# Editar .env com credenciais reais
```

### Aplicar Migrations:
```bash
node scripts/apply-migrations.js
```

### Gerar Certificados SSL:
```bash
node scripts/generateCert.js
```

### Iniciar Development:
```bash
npm run dev
```

---

## ✨ Benefícios da Limpeza

✅ **Workspace profissional** - Sem ficheiros desnecessários  
✅ **Melhor organização** - Fácil navegar por responsabilidade  
✅ **Performance IDE** - Menos ficheiros para indexar  
✅ **Segurança** - Sem scripts de teste expostos  
✅ **Escalabilidade** - Estrutura pronta para crescimento  
✅ **Pronto para produção** - Sem artefatos de desenvolvimento  

---

## 📚 Próximos Passos

1. ✅ **Documentação**: Lê `docs/README.md`
2. ✅ **Setup**: Segue `docs/guias/SETUP.md`
3. ✅ **Desenvolvimento**: Consulta `docs/guias/FRONTEND.md` ou `REFACTORING_BACKEND.md`
4. ✅ **Deploy**: Refere-te a `docs/roadmap/DEPLOYMENT.md`

---

**Status**: ✅ **100% Pronto para Produção**

*Última atualização: Abril 2026*
