# 🚀 Deployment e Produção

Guia completo para colocar MeClinic em produção.

## 📋 Checklist de Pré-Deployment

### Segurança

- [ ] JWT_SECRET alterado (mínimo 32 caracteres aleatórios)
- [ ] HTTPS configurado
- [ ] CORS restrito a domínios específicos
- [ ] Rate limiting implementado
- [ ] Sanitização de inputs completada
- [ ] Senhas dos BD alteradas
- [ ] Variáveis sensíveis em .env (não em código)
- [ ] Logs removidos do código (usar logger)
- [ ] SQL Injection prevenido (prepared statements)
- [ ] CSRF tokens implementados (futuro)

### Performance

- [ ] Cache implementado (Redis)
- [ ] Índices BD otimizados
- [ ] Queries n+1 eliminadas
- [ ] Assets minificados
- [ ] Gzip habilitado
- [ ] CDN para arquivos estáticos (futuro)
- [ ] Load balancer configurado (se múltiplos servidores)

### Monitoramento

- [ ] Logs centralizados (Sentry/ELK)
- [ ] APM configurado (New Relic/Datadog)
- [ ] Alertas de erro configurados
- [ ] Métricas de performance monitoras
- [ ] Uptime checker ativo
- [ ] Backup automático testado

### Dados

- [ ] Database backup à noite
- [ ] Replicação (se missão-crítica)
- [ ] Plano de disaster recovery
- [ ] Testar restore de backup
- [ ] Dados de teste removidos do BD

### Documentação

- [ ] README.md atualizado
- [ ] Deploy guide escrito
- [ ] Runbooks criados
- [ ] Contatos de emergency definidos
- [ ] SLA documentado

---

## 🌐 Opção 1: Heroku (Mais Fácil)

### 1. Preparar Aplicação

Criar arquivo `Procfile` na raiz:

```
web: npm run prod
```

Criar `npm run prod` no root `package.json`:

```json
{
  "scripts": {
    "prod": "cd server && node index.js"
  }
}
```

### 2. Instalar Heroku CLI

```bash
# Windows
choco install heroku-cli

# macOS
brew install heroku/brew/heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

Verificar:
```bash
heroku --version
```

### 3. Deploy para Heroku

```bash
# Login
heroku login

# Criar app
heroku create meclinic-clinica-pt

# Adicionar PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Definir variáveis de ambiente
heroku config:set JWT_SECRET=sua_chave_super_secreta_aqui
heroku config:set NODE_ENV=production

# Deployar
git push heroku main

# Ver logs
heroku logs --tail
```

### 4. URL de Acesso

```
Frontend: https://meclinic-clinica-pt.herokuapp.com
API: https://meclinic-clinica-pt.herokuapp.com/api
```

---

## 🐳 Opção 2: Docker + Docker Compose

### 1. Criar Dockerfile

`server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código
COPY . .

# Expor porta
EXPOSE 5000

# Start app
CMD ["node", "index.js"]
```

`meclinic-app/client/Dockerfile`:

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Build React
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Criar .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.vscode
node_modules
coverage
```

### 3. Docker Compose

`docker-compose.yml` (raiz):

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: meclinic_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: meclinic_db
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./server:/app
      - /app/node_modules

  frontend:
    build: ./meclinic-app/client
    ports:
      - "3050:80"
    environment:
      REACT_APP_API_URL: http://backend:5000
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 4. Executar

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🖥️ Opção 3: VPS Próprio (AWS EC2, DigitalOcean, etc)

### 1. Setup Inicial

```bash
# Update sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Nginx
sudo apt install -y nginx

# Instalar Git
sudo apt install -y git
```

### 2. Clonar Repositório

```bash
# Criar pasta para projeto
mkdir -p /var/www
cd /var/www

# Clone repo
git clone https://github.com/seu-usuario/MeClinic.git
cd MeClinic

# Instalar dependências
npm install
cd server && npm install && cd ..
cd meclinic-app/client && npm install && cd ../../
```

### 3. Configurar PostgreSQL

```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Criar database
CREATE DATABASE meclinic_db;
CREATE USER meclinic WITH PASSWORD 'senha_segura';
ALTER ROLE meclinic SET client_encoding TO 'utf8';
ALTER ROLE meclinic SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE meclinic_db TO meclinic;
\q

# Restaurar schema
sudo -u postgres psql meclinic_db < Database/Tables.sql
```

### 4. Configurar .env

```bash
nano /var/www/MeClinic/server/.env
```

Adicionar:

```env
DB_USER=meclinic
DB_PASSWORD=senha_segura
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=meclinic_db
JWT_SECRET=sua_chave_super_secreta
NODE_ENV=production
PORT=5000
```

### 5. Usar PM2 para Gerenciar Processo

```bash
# Instalar PM2 globally
sudo npm install -g pm2

# Criar ecosystem.config.js
cat > /var/www/MeClinic/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: "MeClinic",
    script: "./server/index.js",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production"
    }
  }]
};
EOF

# Iniciar
cd /var/www/MeClinic
pm2 start ecosystem.config.js

# Startup automático
pm2 startup
pm2 save
```

### 6. Configurar Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/meclinic
```

Adicionar:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # SSL (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # Proxy para backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (React)
    location / {
        try_files $uri $uri/ /index.html;
        proxy_pass http://127.0.0.1:3050;
    }
}
```

Habilitar:

```bash
sudo ln -s /etc/nginx/sites-available/meclinic /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart
sudo systemctl restart nginx
```

### 7. SSL com Let's Encrypt

```bash
# Instalar certbot
sudo apt install -y certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com -d www.seu-dominio.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 🔄 CI/CD com GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          npm install
          cd server && npm install && cd ..
          cd meclinic-app/client && npm install && cd ../../

      - name: Run tests
        run: npm test

      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: ${{secrets.HEROKU_APP_NAME}}
          heroku_email: ${{secrets.HEROKU_EMAIL}}
```

---

## 📊 Monitoramento em Produção

### 1. Sentry (Error Tracking)

```bash
# Instalar
npm install @sentry/node @sentry/tracing

# Configurar no server/index.js
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(Sentry.Handlers.errorHandler());
```

### 2. UptimeRobot (Monitoring)

1. Cadastrar em https://uptimerobot.com
2. Adicionar URL: https://seu-dominio.com
3. Alertas: Email, SMS, Slack
4. Checker a cada 5 minutos

### 3. Logs com Papertrail

```javascript
// server/index.js
const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new (require('winston-papertrail')).Papertrail({
      host: 'logs.papertrailapp.com',
      port: 12345,
      logFormat: (level, message) => `${level}: ${message}`
    })
  ]
});

// Uso
logger.info('Servidor iniciado');
logger.error('Erro crítico:', erro);
```

---

## 🔐 Variáveis de Ambiente em Produção

```env
# Obrigatórios
JWT_SECRET=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_DATABASE=...

# Recomendados
NODE_ENV=production
SENTRY_DSN=...
LOG_LEVEL=info

# Opcionais
EMAIL_USER=...
EMAIL_PASSWORD=...
REDIS_URL=...
```

**⚠️ NUNCA commitar `.env` ou secrets!**

---

## 🔄 Atualizar em Produção

```bash
# SSH para servidor
ssh user@seu-dominio.com

# Parar aplicação
pm2 stop MeClinic

# Atualizar código
cd /var/www/MeClinic
git pull origin main

# Instalar novos pacotes
npm install
cd server && npm install && cd ..

# Iniciar novamente
pm2 start MeClinic

# Ver logs
pm2 logs MeClinic
```

---

## 📈 Performance em Produção

### 1. Habilitar Gzip

Nginx:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### 2. Cache Headers

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 3. Connection Pooling

```javascript
// server/db.js
const pool = new Pool({
  max: 30,                    // Aumentar em produção
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 🛡️ Segurança em Produção

### 1. Helmet (Headers de Segurança)

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 2. CORS Restrito

```javascript
app.use(cors({
  origin: ['https://seu-dominio.com', 'https://www.seu-dominio.com'],
  credentials: true
}));
```

### 3. Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 📋 Runbook de Incidentes

### Site Fora do Ar

```bash
# 1. Verificar status
curl https://seu-dominio.com

# 2. SSH e conferir logs
ssh user@server
pm2 logs MeClinic

# 3. Reiniciar
pm2 restart MeClinic

# 4. Se erro de BD
psql meclinic_db -c "SELECT 1"

# 5. Se sem resposta, fazer rollback
git reset --hard HEAD~1
pm2 restart MeClinic
```

### Backup Corrompido

```bash
# 1. Restaurar último backup bom
psql meclinic_db < /backups/2024-01-10.sql

# 2. Verificar integridade
psql meclinic_db -c "SELECT COUNT(*) FROM pacientes;"

# 3. Se OKnon reiniciar app
pm2 restart MeClinic
```

---

## 📞 Contatos Emergência

- **DevOps:** [email]
- **DBA:** [email]
- **CTO:** [email]
- **Suporte:** [phone/email]

---

**Última atualização:** Abril 2026
