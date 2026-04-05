# ✅ CHECKLIST PRÉ-DEPLOY PRODUÇÃO

## 📋 Fase 1: Email & Comunicação

### Mailtrap Setup ✅
- [ ] Registei em https://mailtrap.io
- [ ] Copiei SMTP credenciais (Host, Port, User, Pass)
- [ ] Atualizei `.env` com dados Mailtrap
- [ ] Teste `node test-mailtrap.js` passou
- [ ] Email teste recebido em Mailtrap dashboard

### Backend Email
- [ ] `EMAIL_MODE=smtp` (não console)
- [ ] `SMTP_HOST=smtp.mailtrap.io`
- [ ] `SMTP_PORT=2525`
- [ ] Forgot-password funciona (código enviado)
- [ ] Reset-password funciona com código
- [ ] Login com nova senha funciona

---

## 🔐 Fase 2: Segurança CRITICAL

### Authentication
- [x] `JWT_SECRET` sem fallback inseguro — servidor recusa arrancar sem ele ✅ *(corrigido 04/04/2026)*
- [x] `JWT_EXPIRES_IN` padrão reduzido para `8h` ✅ *(corrigido 04/04/2026)*
- [ ] `JWT_SECRET` gerado com entropia adequada (mín. 64 chars)
  ```bash
  # Gerar chave segura:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [x] Tokens verificados em requests ✅

### Frontend Auth Headers
- [x] Inventory.js tem token Bearer ✅
- [x] Pacientes.js tem token Bearer ✅
- [x] Consultas.js tem token Bearer ✅ *(DELETE corrigido 04/04/2026)*
- [ ] Faturacao.js tem token Bearer ⏳
- [ ] Users.js tem token Bearer ⏳
- [ ] FichasTecnicas.js tem token Bearer ⏳
- [ ] Dashboard.js tem token Bearer ⏳
- [ ] Report.js tem token Bearer ⏳

### Helmet & CORS
- [x] Helmet.js ativo (headers de segurança) ✅
- [x] CORS whitelist corrigida — `origin: true` removido ✅ *(corrigido 04/04/2026)*
- [x] Rate limiting ativo: 200 req/15min geral, 20 req/15min em `/api/auth` ✅ *(corrigido 04/04/2026)*
- [x] Input validation com Joi ativo ✅

### Database
- [x] `DB_PASSWORD` hardcoded removido — servidor termina sem ele ✅ *(corrigido 04/04/2026)*
- [ ] Password da BD PostgreSQL alterada em produção
- [ ] Backups configurados
- [x] Prepared statements em todas queries (proteção SQL injection) ✅
- [x] Race condition no stock resolvida com `SELECT ... FOR UPDATE` ✅ *(corrigido 04/04/2026)*

---

## 🔒 Fase 3: HTTPS/TLS (Recomendado antes de deploy)

### Certificados ✅ ou ⏳?
- [ ] Certificado SSL válido (Let's Encrypt gratuito)
- [ ] `SSL_KEY_PATH` definido
- [ ] `SSL_CERT_PATH` definido
- [ ] HTTPS redirecionamento configurado
- [ ] Testar HTTPS funciona sem warnings

### Se não tiver certificados ainda:
```
DigitalOcean, Heroku, AWS - fornecem automática
Alternativa: Let's Encrypt (gratuito, automático com Certbot)
```

---

## 📦 Fase 4: Frontend Pronto

### Build Production
- [ ] `npm run build` em `client/` funciona sem erros
- [ ] Build sem warnings (verificar console)
- [ ] Arquivo `build/` gerado (~150MB)

### API Service (Recomendado)
- [ ] `client/src/services/api.js` criado
- [ ] Componentes usando apiService
- [ ] Tokens sendo enviados automaticamente

### Environment Frontend
- [x] `proxy` em package.json aponta ao backend ✅
- [x] Sem hardcodes de URLs — `http://localhost:5000` removido de `Auth.js` ✅ *(corrigido 04/04/2026)*
- [x] `console.log` de requests HTTP removido de `fetchWithToken.js` ✅ *(corrigido 04/04/2026)*

### Quality & Robustness (Sprint Seguinte)
- [x] `/* eslint-disable */` removido de `App.js`, `Consultas.js`, `Inventory.js`, `Pacientes.js` ✅
- [x] `JSON.parse` do localStorage envolto em `try/catch` em todos os componentes ✅
- [x] Tokens de autenticação ausentes corrigidos em `Pacientes.js` (6 chamadas fetch) ✅
- [x] Upload de ficheiros com validação de tipo (PDF/JPG/PNG/GIF) e tamanho (máx 10 MB) ✅
- [x] Paginação activada em `Inventory.js` com filtros server-side ✅
- [x] Parâmetros de paginação sanitizados no `produtosController.js` ✅
- [x] Preços de tratamento movidos para `utils/treatmentPrices.js` ✅
- [x] Locale centralizado em `utils/locale.js` (6 componentes actualizados) ✅
- [x] Chave localStorage incorreta `meclinic_token` → `token` corrigida em `Settings.js` ✅

---

## 🚀 Fase 5: Dados & GDPR

### Dados de Teste
- [ ] ❌ Removida dados sensíveis reais
- [ ] ✅ Apenas dados de teste
- [ ] ❌ Não expostos logs privados

### GDPR Básico
- [ ] Encryption em trânsito (HTTPS) ✅ ou ⏳
- [ ] Política de privacidade pronta
- [ ] Termos de serviço prontos
- [ ] GDPR consent na primeira auth

### Logging
- [ ] Logs de erro (não senhas/tokens)
- [ ] Logs de acesso (para audit)
- [ ] Retention policy definida (ex: 30 dias)

---

## 💾 Fase 6: Backup & Recovery

### Database Backup
- [ ] Sistema de backup configurado
- [ ] Testes de restore funciona
- [ ] Backup encriptado (próxima fase)
- [ ] Guardar em local seguro

### Disaster Recovery
- [ ] Plano de recuperação definido
- [ ] Contatos de suporte definidos
- [ ] Procedimento rollback pronto

---

## 🧪 Fase 7: Testing Completo

### Functional Testing
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Forgot password funciona (Mailtrap!)
- [ ] Inventory CRUD operacional
- [ ] Pacientes CRUD operacional
- [ ] Consultas CRUD operacional
- [ ] Faturação CRUD operacional
- [ ] Dashboard mostra dados
- [ ] Relatórios geram

### Security Testing
- [ ] SQL injection bloqueada
- [ ] XSS bloqueada
- [ ] CSRF bloqueada
- [ ] Tokens expiram corretamente
- [ ] Invalid tokens rejeitados
- [ ] Rate limiting funciona

### Performance
- [ ] Backend responde < 200ms
- [ ] Frontend carrega < 3s
- [ ] Sem memory leaks (verificar)
- [ ] Sem erros 404/500

---

## 🌐 Fase 8: Deployment Pronto

### Infraestrutura Escolhida
- [ ] Heroku / DigitalOcean / AWS / Outro?
- [ ] Node.js v22 ou compatível
- [ ] PostgreSQL 12+ disponível
- [ ] Email SMTP (Mailtrap) acessível

### Environment Variables
- [ ] Todas as vars de .env configuradas na plataforma
- [ ] Database credenciais seguro (Secrets Manager)
- [ ] JWT_SECRET seguro
- [ ] EMAIL_PASS seguro
- [ ] NODE_ENV=production

### Pre-Deploy Checklist
- [x] Código limpo — `console.log` de debug removidos ✅ *(corrigido 04/04/2026)*
- [ ] `.env` NÃO commitado (verificar .gitignore)
- [ ] Build size verificado
- [ ] Dependencies auditadas (`npm audit`)
- [ ] Packages sem vulnerabilidades conhecidas

---

## ✅ Pré-Deploy Final

```bash
# 1. Verificar tudo compila
cd c:\temp\MeClinic\server
npm install
node index.js  # Deve iniciar sem erros

cd c:\temp\MeClinic\meclinic-app\client
npm install
npm run build  # Deve criar build/ sem erros

# 2. Verificar Database
# Confirmar PostgreSQL rodando e accessible

# 3. Verificar Email
cd c:\temp\MeClinic\server
node test-mailtrap.js  # Deve enviar email

# 4. Testar API completa
# 5. Testar Frontend
# 6. Revisar segurança
```

---

## 🎯 Order of Priority

1. **CRITICAL** (Esta semana)
   - [ ] Email Mailtrap funcionando
   - [ ] All components com token headers
   - [ ] JWT_SECRET alterado
   - [ ] Nem uma credential hardcoded

2. **HIGH** (Próxima semana)
   - [ ] HTTPS/TLS certificado
   - [ ] Database backups
   - [ ] GDPR policy pronta

3. **MEDIUM** (Após deploy)
   - [ ] Encryption at Rest
   - [ ] Advanced audit logging
   - [ ] CDN para assets estáticos

4. **LOW** (Iteração future)
   - [ ] 2FA implementada
   - [ ] Single Sign-On (SSO)
   - [ ] Advanced analytics

---

## 📞 Suporte Pós-Deploy

- [ ] Plano de monitoramento ativo
- [ ] Alertas configurados (erros, CPU, memória)
- [ ] Procedure para rollback rápido
- [ ] Contato para emergências

---

## ✨ Pronto para Deploy!

Quando completar ✅ sobre a maioria dos itens:
→ **READY FOR PRODUCTION DEPLOYMENT!** 🚀
