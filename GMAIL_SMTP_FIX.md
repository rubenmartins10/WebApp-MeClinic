# Resolução do Erro SMTP Gmail

## Erro Atual
```
Error: Missing credentials for "PLAIN"
Nodemailer SMTP auth failing: EAUTH
```

---

## Solução Rápida (Recomendada): Usar Mailtrap

Mailtrap é um serviço GRATUITO para testar emails sem enviar realmente.

### Passo 1: Criar Conta
1. Aceda a https://mailtrap.io/
2. Registe-se gratuitamente (GitHub ou email)
3. Crie um novo projeto (ex: "MeClinic")
4. Não é necessário cartão de crédito!

### Passo 2: Copiar Credenciais
Na dashboard, encontrará:
```
Host: smtp.mailtrap.io
Port: 2525 ou 587
Username: [número grande, ex: 1234567890]
Password: [token, ex: abcdef123456]
```

### Passo 3: Atualizar .env
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meclinic_db
DB_USER=postgres
DB_PASS=password

EMAIL_USER=seu_email_mailtrap_username
EMAIL_PASS=seu_email_mailtrap_password
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525

JWT_SECRET=sua_secret_key
JWT_EXPIRES_IN=7d

NODE_ENV=development
```

### Passo 4: Atualizar Backend
Editar `routes/auth.routes.js` no topo (procure "nodemailer.createTransport"):

**Antes:**
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false }
});
```

**Depois:**
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false }
});
```

### Passo 5: Testar
1. Reinicie servidor: `node server/index.js`
2. Chame forgot-password
3. Veja em Mailtrap: https://mailtrap.io/inboxes (verá o email!)

---

## Solução Alternativa 1: Gmail App Password (Mais Difícil)

Se quer usar Gmail mesmo:

### Passo 1: Ativar 2FA no Gmail
1. Aceda a https://myaccount.google.com/
2. "Segurança" (lado esquerdo)
3. "Verificação em 2 etapas" → Ativar

### Passo 2: Gerar App Password
1. Volte a "Segurança"
2. Procure "Palavra-passe de aplicação" (só aparece se 2FA ativo)
3. Selecione "Correio" e "Windows"
4. Google gera senha como: `xxxx xxxx xxxx xxxx` (16 caracteres)
5. Guarde essa senha!

### Passo 3: .env
```env
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=xxxxxxxxxxxx  # (16 caracteres, sem espaços)
```

### Passo 4: Reinicie servidor

---

## Solução Alternativa 2: Console Mode (Desenvolvimento)

Se só quer que funcione em desenvolvimento e não precisa enviar email:

Editar `routes/auth.routes.js`:

```javascript
const transporter = {
  sendMail: async (options) => {
    console.log("📧 MODO CONSOLE - Email NÃO enviado (desenvolvimento)");
    console.log(`   Para: ${options.to}`);
    console.log(`   Assunto: ${options.subject}`);
    console.log(`   Corpo: ${options.html.substring(0, 100)}...`);
    return { messageId: 'console-mode' };
  }
};
```

Assim, `sendMail()` apenas loga no console sem tentar SMTP.

---

## Recomendação

🏆 **Use Mailtrap** (gratuito, rápido, não precisa mudar código muito)

**Razão:** Gmail está complicado com autenticação 2FA + app passwords. Mailtrap é feito para exatamente isto.

---

## Status Implementação

- ✅ Código de recuperação: FUNCIONA
- ✅ Response com testCode: FUNCIONA  
- ✅ Console log visual: FUNCIONA
- ❌ Email SMTP: AGUARDA configuração (Gmail ou Mailtrap)

**Escolha a solução acima, atualize o .env, e volte!**
