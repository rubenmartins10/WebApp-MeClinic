# 🚀 AÇÃO IMEDIATA - MAILTRAP + PRODUÇÃO

## ⏱️ Timeline Recomendada: 2-4 Semanas

---

## SEMANA 1: Email & Security

### Dia 1-2: Setup Mailtrap
1. Registar em https://mailtrap.io (2 min)
2. Copiar credenciais SMTP (3 min)
3. Atualizar `.env` com dados Mailtrap (2 min)
4. Testar com `node test-mailtrap.js` (5 min)
5. Testar forgot-password end-to-end (10 min)

**Total: 30 minutos** ✅

---

## Dia 3-5: Frontend Component Headers

### FIX: Adicionar token Bearer aos componentes

**Padrão a usar em TODOS:**
```javascript
// Template
const token = localStorage.getItem('token');
const res = await fetch('/api/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Componentes a corrigir:**
- [ ] Pacientes.js (linha 45)
- [ ] Consultas.js (linha 55+)
- [ ] Dashboard.js (linha 50+)
- [ ] Faturacao.js (linha 18)
- [ ] FichasTecnicas.js (linha 30+)
- [ ] Users.js (linha 29+)
- [ ] Report.js (linha 133)

**Tempo estim.:** 1-2 horas (copia/cola mesma solução)

---

## Dia 6-7: JWT Security

### Gerar JWT_SECRET seguro:

```powershell
# Terminal PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Resultado será algo como:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Atualizar `.env`:
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Tempo:** 5 min

---

## SEMANA 2-3: HTTPS & Deployment Prep

### HTTPS Setup:

**Opção 1: Let's Encrypt (Gratuito)**
```
curl https://get.acme.sh | sh
# (Se for Linux/Mac)
```

**Opção 2: Plataforma fornece (Heroku, DigitalOcean)**
- Automático após deploy ✅

**Opção 3: Comprado**
- Upload manual dos certificados

### Database Backup:
```sql
-- Backup PostgreSQL
pg_dump -U postgres -d meclinic_db > backup_3_abril_2026.sql

-- Restore (se precisar)
psql -U postgres -d meclinic_db < backup_3_abril_2026.sql
```

---

## SEMANA 4: Deploy

### Escolher Plataforma:

#### 🔵 **RECOMENDADO: Heroku** (Mais fácil)
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create meclinic-prod

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=xxxxx
heroku config:set SMTP_HOST=smtp.mailtrap.io
heroku config:set SMTP_PORT=2525
heroku config:set EMAIL_USER=xxxxx
heroku config:set EMAIL_PASS=xxxxx

# Deploy
git push heroku main
```

#### 🟠 **ALTERNATIVA: DigitalOcean App Platform**
- Mais barato (€5/mês)
- Interface visual
- PostgreSQL incluído

#### 🟢 **ALTERNATIVA: AWS**
- Mais complexo
- Mais poderoso
- Mais caro

---

## CHECKLIST RÁPIDO (Esta Semana)

- [ ] Mailtrap conta criada
- [ ] Email funcionando
- [ ] JWT_SECRET alterado
- [ ] Token headers em todos componentes
- [ ] DEPLOY_CHECKLIST completado 80%+

---

## 📝 Próximas Actions

### 1️⃣ Primeira Ação:
```
Aceda a: https://mailtrap.io → Registar → Copiar credenciais
```

### 2️⃣ Segunda Ação:
```
Atualizar .env com:
  EMAIL_MODE=smtp
  SMTP_HOST=smtp.mailtrap.io
  SMTP_PORT=2525
  EMAIL_USER=seu_username
  EMAIL_PASS=seu_token
```

### 3️⃣ Terceira Ação:
```powershell
cd c:\temp\MeClinic\server
node test-mailtrap.js
```

### 4️⃣ Quarta Ação:
```
Testar forgot-password → Receber email em Mailtrap
```

---

## 🎯 GO/NO-GO para Deploy

### GO: Se tiver ✅
- ✅ Email funcionando (Mailtrap)
- ✅ Todos componentes com tokens
- ✅ JWT_SECRET alterado
- ✅ Sem hardcodes de credenciais
- ✅ Test de segurança básica passou

### NO-GO: Se faltar
- ❌ Email ainda em CONSOLE
- ❌ Componentes sem tokens
- ❌ Credenciais hardcoded
- ❌ Testes falhando

---

## 💬 Chat de Suporte

Quando chegar à cada fase:
1. Mailtrap - "Consegui configurar email"
2. Frontend - "Componentes com tokens pronto"
3. Deploy - "Qual plataforma?"

Eu ajudo em cada passo! 👍

---

**COMECE HOJE MESMO COM PASSO 1! 🚀**
