# ✅ Sistema de Recuperação de Password - FUNCIONANDO!

## Status Atual

✅ **Código de recuperação:** FUNCIONANDO  
✅ **Console logging:** FUNCIONANDO  
✅ **Email em modo CONSOLE:** FUNCIONANDO  
⏳ **Email SMTP real:** CONFIGURÁVEL (Gmail ou Mailtrap)

---

## Como Funciona Agora (Modo Console)

### Frontend → Backend Flow

1. **Utilizador solicita código:**
   - Clica "Esqueci a Palavra-passe"
   - Insere `teste@meclinic.pt`
   - Clica "Enviar"

2. **Backend gera código:**
   - Código armazenado na BD (reset_code, reset_expires)
   - Aparece no console do servidor (modo CONSOLE)
   - Response: `{"message":"Código enviado para o seu e-mail."}`

3. **Utilizador recebe código:**
   - **Modo CONSOLE:** Ver no terminal do servidor
   - **Modo SMTP:** Receberia no email real

4. **Utilizador insere código:**
   - Insere código no frontend
   - Insere nova password
   - Clica confirmar

5. **Backend valida e atualiza:**
   - Valida código e expiry
   - Atualiza password na BD
   - Retorna sucesso

---

## Testes Rápidos

### Teste 1: Gerar Código (via curl/PowerShell)

```powershell
$ProgressPreference='SilentlyContinue'
$resp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/forgot-password" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (ConvertTo-Json @{email="teste@meclinic.pt"}) `
  -UseBasicParsing
$resp.Content | ConvertFrom-Json
```

**Response:**
```json
{
  "message": "Código enviado para o seu e-mail."
}
```

👁️ **Ver código no servidor terminal** → Caixa bonitinha com "CÓDIGO DE RECUPERAÇÃO"

### Teste 2: Usar Código para Reset

```powershell
$ProgressPreference='SilentlyContinue'
$resp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/reset-password" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (ConvertTo-Json @{
    email = "teste@meclinic.pt"
    code = "801034"  # ← Use o código do passo anterior
    newPassword = "novaSenha123!"
    confirmPassword = "novaSenha123!"
  }) `
  -UseBasicParsing
$resp.Content | ConvertFrom-Json
```

**Response:**
```json
{
  "message": "Palavra-passe atualizada com sucesso."
}
```

### Teste 3: Fazer Login com Nova Senha

```powershell
$ProgressPreference='SilentlyContinue'
$resp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (ConvertTo-Json @{
    email = "teste@meclinic.pt"
    password = "novaSenha123!"
  }) `
  -UseBasicParsing
$resp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
```

**Response:**
```json
{
  "message": "Login bem-sucedido",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 6,
    "nome": "Utilizador Teste",
    "email": "teste@meclinic.pt"
  }
}
```

---

## Configurar Email Real (Próximo Passo)

Você tem 3 opções:

### Opção 1: Gmail (Com App Password)

1. Ativar 2FA no Gmail: https://myaccount.google.com/
2. Gerar "App Password" (16 caracteres)
3. Atualizar `.env`:
   ```env
   EMAIL_MODE=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx  # (app password)
   ```
4. Reiniciar servidor: `node server/index.js`

### Opção 2: Mailtrap (Recomendado - Gratuito)

1. Registar-se (grátis): https://mailtrap.io/
2. Copiar SMTP credentials do dashboard
3. Atualizar `.env`:
   ```env
   EMAIL_MODE=smtp
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   EMAIL_USER=seu_username_mailtrap
   EMAIL_PASS=seu_password_mailtrap
   ```
4. Reiniciar servidor

### Opção 3: Manter Modo Console (Desenvolvimento)

```env
EMAIL_MODE=console
```

Emails apenas são logados no servidor, nenhum envio real.

---

## Arquivo de Configuração

**Localização:** `c:\temp\MeClinic\server\.env`

```env
# ======= EMAIL CONFIGURATION =======
EMAIL_MODE=console           # Mude para 'smtp' quando pronto

# Gmail SMTP (quando usar Gmail)
EMAIL_USER=rubendavidsilvamartins@gmail.com
EMAIL_PASS=qaawfohiwubhlxwe

# SMTP Genérico (Mailtrap, SendGrid, etc)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

---

## Checklist de Funcionalidades

- ✅ Solicitar código de recuperação (`/api/auth/forgot-password`)
- ✅ Validar código e reset password (`/api/auth/reset-password`)
- ✅ Fazer login com nova senha
- ✅ Código expira após 15 minutos
- ✅ Console logging (modo CONSOLE)
- ✅ Configurável para SMTP real

---

## Próximos Passos

1. ✅ Sistema funcionando em modo CONSOLE
2. ⏳ **Escolha:** Gmail, Mailtrap, ou manter CONSOLE?
3. ⏳ Testar via Frontend (React)
4. ⏳ Implementar Encryption at Rest (fase seguinte)
5. ⏳ GDPR compliance endpoints

**Qual preferência para email?** (console, Gmail App Password, ou Mailtrap?)
