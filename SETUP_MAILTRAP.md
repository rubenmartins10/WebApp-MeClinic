# 🚀 Setup Mailtrap - Guia Passo a Passo

## Objetivo
Configurar email profissional com Mailtrap para produção (sem problemas de Gmail).

---

## PASSO 1️⃣: Registar em Mailtrap (2 min)

### 1. Aceder a Mailtrap
Abra: https://mailtrap.io

### 2. Clicar "Sign Up"
- Email: seu_email@clinica.pt (ou qualquer email pessoal)
- Password: senha forte
- Confirmar email (verifique spam)

### 3. Pronto!
Dashboard aberto.

---

## PASSO 2️⃣: Obter Credenciais SMTP (2 min)

### No Dashboard do Mailtrap:

1. **Lado esquerdo:** Clique em "Inboxes"
2. **"Demo inbox"** (ou crie novo projeto)
3. **Clique no inbox**
4. **Topo direito:** Clique "Integrations"
5. **Dropdown:** Selecione "Nodemailer"

### Verá algo como:
```
Host: smtp.mailtrap.io
Port: 2525
Username: a1b2c3d4e5  ← (6 dígitos/letras)
Password: xxxxxxxxxxx ← (token longo)
```

⚠️ **IMPORTANTE:** 
- Username NÃO é email!
- Copie exatamente, sem espaços

### Guardar:
Abra bloco de notas e copie:
```
smtp.mailtrap.io
2525
abc123def456  (seu username)
xxxxxxxxxxxxxxxxxxx (seu password)
```

---

## PASSO 3️⃣: Atualizar .env (Backend)

Abra: `c:\temp\MeClinic\server\.env`

**Procure:**
```env
EMAIL_MODE=console
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=rubendavidsilvamartins@gmail.com
EMAIL_PASS=qaawfohiwubhlxwe
```

**Substitua por:**
```env
EMAIL_MODE=smtp
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
EMAIL_USER=abc123def456
EMAIL_PASS=xxxxxxxxxxxxxxxxxxx
SMTP_SECURE=false
GMAIL_MODE=false
NODE_ENV=production
```

Salve arquivo (Ctrl+S).

---

## PASSO 4️⃣: Testar Configuração

### Terminal:

```powershell
cd c:\temp\MeClinic\server

# Mata processos Node anteriores
Get-Process | Where-Object {$_.Name -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Inicia servidor
node index.js
```

Deve ver:
```
📧 EMAIL MODE: SMTP (smtp.mailtrap.io)
✅ HTTP Servidor ativo em http://localhost:5000
```

---

## PASSO 5️⃣: Teste End-to-End

### Terminal PowerShell (novo):

```powershell
$ProgressPreference='SilentlyContinue'

# 1. Login
$loginResp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (ConvertTo-Json @{email="teste@meclinic.pt"; password="Teste123!"}) `
  -UseBasicParsing -ErrorAction SilentlyContinue

$token = ($loginResp.Content | ConvertFrom-Json).token
Write-Host "✅ Login OK, token:", $token.Substring(0, 20) + "..."

# 2. Solicitar recuperação de password
$resp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/forgot-password" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $token"} `
  -Body (ConvertTo-Json @{email="teste@meclinic.pt"}) `
  -UseBasicParsing -ErrorAction SilentlyContinue

Write-Host "✅ Resposta:", ($resp.Content | ConvertFrom-Json).message
```

### Resultado Esperado:
```
✅ Login OK, token: eyJhbGciOiJIUzI1NiIs...
✅ Resposta: Código enviado para o seu e-mail.
```

---

## PASSO 6️⃣: Verificar Email em Mailtrap

1. **Abra** https://mailtrap.io/inboxes
2. **Clique no seu inbox**
3. **Deve ver email com:**
   - From: rubendavidsilvamartins@gmail.com
   - To: teste@meclinic.pt
   - Subject: Recuperação de Palavra-passe - MeClinic
   - Corpo: Código 6 dígitos

### Copie o código (ex: 123456)

---

## PASSO 7️⃣: Testar Reset de Password

```powershell
$ProgressPreference='SilentlyContinue'

# Usar o CÓDIGO do email anterior
$resp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/reset-password" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (ConvertTo-Json @{
    email = "teste@meclinic.pt"
    code = "123456"  # ← Use o código do email
    newPassword = "NovaPassword123!"
    confirmPassword = "NovaPassword123!"
  }) `
  -UseBasicParsing -ErrorAction SilentlyContinue

Write-Host ($resp.Content | ConvertFrom-Json).message
```

### Resultado:
```
Palavra-passe atualizada com sucesso.
```

---

## PASSO 8️⃣: Login com Nova Senha

```powershell
$ProgressPreference='SilentlyContinue'

$loginResp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (ConvertTo-Json @{
    email="teste@meclinic.pt"
    password="NovaPassword123!"
  }) `
  -UseBasicParsing -ErrorAction SilentlyContinue

$data = $loginResp.Content | ConvertFrom-Json
Write-Host "✅ Login bem-sucedido!"
Write-Host "User:", $data.user.nome
```

### Resultado:
```
✅ Login bem-sucedido!
User: Utilizador Teste
```

---

## ✅ Checklist Mailtrap

- [ ] Registei em Mailtrap (https://mailtrap.io)
- [ ] Copiei SMTP credenciais (Host, Port, Username, Password)
- [ ] Atualizei `.env` com dados do Mailtrap
- [ ] Servidor iniciou com "EMAIL MODE: SMTP (smtp.mailtrap.io)"
- [ ] Teste forgot-password funcionou
- [ ] Email recebido em Mailtrap dashboard
- [ ] Reset password funcionou
- [ ] Login com nova senha funcionou

---

## 🎯 Próximos Passos (Após confirmação)

1. ✅ Mailtrap configurado
2. ⏳ Corrigir outros componentes React (token headers)
3. ⏳ HTTPS/TLS certificados
4. ⏳ Encryption at Rest
5. ⏳ Deploy em produção

---

## ⚠️ Troubleshooting

### "SMTP Error: connect ECONNREFUSED"
→ Copiar credenciais erradas. Verifique no dashboard Mailtrap.

### Email não chega em Mailtrap
→ Verifique em "Spam" também. Se nada, restart server.

### "Invalid credentials"
→ Username/Password com espaços. Copy-paste novamente, remova espaços.

### Password reset code expira rápido
→ Normal, 15 minutos. Testes normalmente, produção também.

---

**Pronto para começar? Siga os 8 passos acima!** 🚀
