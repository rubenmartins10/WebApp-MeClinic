# 🛠️ Setup e Instalação

Guia completo para configurar e executar o MeClinic em seu computador.

## 📋 Pré-requisitos

Você precisa ter instalado:

- **Node.js** 16+ ([Download](https://nodejs.org/))
- **npm** ou **yarn** (vem com Node.js)
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

### Verificar Instalações

```bash
# Verificar Node.js
node --version
# Deve retornar v16.x ou superior

# Verificar npm
npm --version
# Deve retornar 7.x ou superior

# Verificar PostgreSQL
psql --version
# Deve retornar 12.x ou superior

# Verificar Git
git --version
# Deve retornar git version 2.x ou superior
```

## 📦 1. Clonar o Repositório

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/MeClinic.git

# Entre no diretório
cd MeClinic
```

## 🗄️ 2. Configurar o Banco de Dados PostgreSQL

### 2.1 Criar Database

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE meclinic_db;

# Sair
\q
```

### 2.2 Criar Arquivo .env

Crie um arquivo `.env` na raiz de `/server`:

```env
# .env (Server)
DB_USER=postgres
DB_PASSWORD=sua_senha_postgres
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=meclinic_db
DB_NAME=meclinic_db

# JWT
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# Email (opcional, para recuperação de senha)
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_app_gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Aplicação
NODE_ENV=development
PORT=5000
```

**⚠️ IMPORTANTE:**
- Altere `sua_senha_postgres` com sua senha real do PostgreSQL
- Use uma chave JWT forte (mínimo 32 caracteres aleatórios)
- Para email: use [App Password do Gmail](https://support.google.com/accounts/answer/185833)

### 2.3 Executar Scripts SQL

```bash
# Conectar ao banco
psql -U postgres -d meclinic_db -f Database/Tables.sql

# Importar outros dados (se necessário)
psql -U postgres -d meclinic_db -f Database/Consultas.sql
```

## 📥 3. Instalar Dependências

### 3.1 Root Dependencies

```bash
# Estando na pasta MeClinic
npm install

# Isso instala:
# - concurrently (para rodar backend + frontend)
# - pdfkit-table (para PDFs)
```

### 3.2 Backend Dependencies

```bash
# Entrar na pasta server
cd server

# Instalar dependências
npm install

# Dependências instaladas:
# - express: Framework web
# - cors: Habilitar CORS
# - pg: Driver PostgreSQL
# - bcryptjs: Hash de senhas
# - jsonwebtoken: JWT
# - dotenv: Variáveis de ambiente
# - speakeasy: 2FA TOTP
# - qrcode: Geração de QR codes
# - nodemailer: Envio de emails
# - node-cron: Tarefas agendadas
# - pdfkit: Geração de PDFs

# Voltar para raiz
cd ..
```

### 3.3 Frontend Dependencies

```bash
# Entrar na pasta client
cd meclinic-app/client

# Instalar dependências
npm install

# Dependências principais:
# - react: Biblioteca UI
# - react-router-dom: Roteamento
# - react-dom: Render React
# - lucide-react: Ícones
# (Outras dependências padrão do create-react-app)

# Voltar para raiz
cd ../../
```

## 🚀 4. Executar a Aplicação

### Opção A: Modo Desenvolvimento (Recomendado)

Executa backend (porta 5000) e frontend (porta 3050) simultaneamente:

```bash
# Estando na raiz (MeClinic/)
npm run dev
```

**Saída esperada:**
```
[BACKEND] Servidor rodando em http://localhost:5000
[FRONTEND] Compilado com sucesso!
[FRONTEND] Acesse em http://localhost:3050
```

### Opção B: Backend Apenas

```bash
# Estando na raiz
npm run server

# Backend rodará em http://localhost:5000
```

### Opção C: Frontend Apenas

```bash
# Estando na raiz
npm run client

# Frontend rodará em http://localhost:3050
# (Mas não funcionará sem o backend)
```

## 🔍 5. Verificar Instalação

Abra seu navegador e acesse:

```
http://localhost:3050
```

Você deve ver a **página de login**.

### Testar Login

Use credenciais padrão (se foram criadas via script SQL):

```
Email: admin@clinica.pt
Senha: admin123

2FA: Escanear QR code ou usar código de backup
```

## 🛑 6. Troubleshooting (Problemas Comuns)

### ❌ Erro: "Cannot find module 'express'"

**Solução:**
```bash
# Instale dependências novamente
cd server
npm install
cd ..
```

### ❌ Erro: "ECONNREFUSED - Connection refused (5432)"

**Problema:** PostgreSQL não está rodando

**Solução (Windows):**
```bash
# Inicie o serviço PostgreSQL
net start PostgreSQL-x64-12

# Ou use Services (Services.msc)
```

**Solução (Mac):**
```bash
# Se instalado via Homebrew
brew services start postgresql
```

**Solução (Linux):**
```bash
sudo systemctl start postgresql
```

### ❌ Erro: "Database does not exist"

**Solução:**
```bash
# Criar database
createdb -U postgres meclinic_db

# Ou via psql
psql -U postgres -c "CREATE DATABASE meclinic_db;"
```

### ❌ Frontend abre mas não carrega dados

**Problema:** Backend não está rodando

**Solução:**
```bash
# Verifique se backend está em http://localhost:5000
curl http://localhost:5000

# Inicie backend em novo terminal
npm run server
```

### ❌ Erro: "Port 3050 already in use"

**Solução:**
```bash
# Encontre processo usando porta 3050
netstat -ano | findstr :3050

# Mate o processo (Windows)
taskkill /PID <PID> /F
```

### ❌ .env file not found

**Solução:**
```bash
# Crie .env na pasta server
cd server
cat > .env << EOF
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=meclinic_db
JWT_SECRET=sua_chave_secreta
NODE_ENV=development
PORT=5000
EOF
```

## 📝 7. Estrutura de Pastas Esperada

Após setup completo, deve ter:

```
MeClinic/
├── node_modules/               # Dependencies root
├── server/
│   ├── node_modules/          # Dependencies backend
│   ├── .env                    # ✅ Variáveis de ambiente
│   ├── db.js                   # Conexão PostgreSQL
│   ├── index.js                # Servidor Express
│   └── package.json
├── meclinic-app/
│   ├── client/
│   │   ├── node_modules/       # Dependencies frontend
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   └── package.json
├── Database/
│   ├── Tables.sql              # ✅ Script principal
│   └── ...outros.sql
├── DOCUMENTACAO/               # Esta documentação
└── package.json
```

## 🧪 8. Testes de Conectividade

### Testar Backend API

```bash
# GET - Ping do servidor
curl http://localhost:5000

# POST - Test login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinica.pt","senha":"admin123"}'
```

### Testar Frontend

Abra browser → DevTools (F12) → Console

```javascript
// Verificar se localStorage tem token
console.log(localStorage.getItem('meclinic_user'));

// Testar fetch
fetch('http://localhost:5000/utilizadores', {
  headers: {
    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('meclinic_user'))?.token}`
  }
})
.then(r => r.json())
.then(console.log)
```

### Testar Database

```bash
# Conectar ao PostgreSQL
psql -U postgres -d meclinic_db

# Listar tabelas
\dt

# Ver estrutura de tabela
\d utilizadores

# Contar registros
SELECT COUNT(*) FROM utilizadores;

# Sair
\q
```

## 📦 9. Variáveis de Ambiente Detalhadas

| Variável | Valor Padrão | Descrição | Obrigatória |
|----------|--------------|-----------|------------|
| `DB_USER` | postgres | Usuário PostgreSQL | ✅ |
| `DB_PASSWORD` | - | Senha do usuário | ✅ |
| `DB_HOST` | localhost | Host do servidor PostgreSQL | ✅ |
| `DB_PORT` | 5432 | Porta PostgreSQL | ❌ |
| `DB_DATABASE` | meclinic_db | Nome do banco de dados | ✅ |
| `JWT_SECRET` | - | Chave para assinar tokens JWT | ✅ |
| `NODE_ENV` | development | Ambiente (development/production) | ❌ |
| `PORT` | 5000 | Porta do servidor Express | ❌ |
| `EMAIL_USER` | - | Email para nodemailer | ❌ |
| `EMAIL_PASSWORD` | - | Senha app do email | ❌ |
| `EMAIL_HOST` | smtp.gmail.com | Host SMTP do email | ❌ |
| `EMAIL_PORT` | 587 | Porta SMTP | ❌ |

## ✅ Checklist de Setup

- [ ] Node.js e npm instalados
- [ ] PostgreSQL instalado e rodando
- [ ] Repositório clonado
- [ ] Banco de dados criado
- [ ] Arquivo `.env` criado em `/server`
- [ ] Scripts SQL executados
- [ ] Dependências npm instaladas (todos os níveis)
- [ ] Consegue executar `npm run dev` sem erros
- [ ] Frontend carrega em `http://localhost:3050`
- [ ] Consegue fazer login
- [ ] 2FA funciona
- [ ] Dashboard carrega com dados

## 🎉 Pronto!

Seu ambiente está configurado e pronto para desenvolvimento!

### Próximos Passos

1. Leia [ESTRUTURA_PROJETO.md](ESTRUTURA_PROJETO.md) para entender a organização
2. Explore [COMPONENTES.md](COMPONENTES.md) para ver o que reutilizar
3. Consulte [API.md](API.md) se precisar criar novos endpoints
4. Veja [BANCO_DADOS.md](BANCO_DADOS.md) para entender as tabelas

---

**Última atualização:** Abril 2026
