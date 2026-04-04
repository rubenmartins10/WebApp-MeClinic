# 🔐 Autenticação e Segurança

Documentação do sistema completo de autenticação 2FA e segurança do MeClinic.

## 🎯 Sistemas de Segurança

MeClinic implementa múltiplas camadas de segurança:

```
Camada 1: Autenticação de Senha
    ↓
Camada 2: Autenticação 2FA (TOTP)
    ↓
Camada 3: JWT Token Management
    ↓
Camada 4: Role-Based Access Control (RBAC)
    ↓
Camada 5: Validação de Dados
```

---

## 1️⃣ Primeira Fase: Autenticação de Senha

### Fluxo

```
Cliente envia:
  email
  senha (plain text via HTTPS)
        ↓
Servidor:
  1. Valida formato email
  2. Busca utilizador na BD
  3. Compara senha: bcryptjs.compare(senha_inserida, senha_hash_bd)
  4. Se válido → Gera QR Code 2FA
  5. Se inválido → Erro 401
```

### Implementação (Backend)

```javascript
// POST /auth/login
app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  
  try {
    // 1. Buscar utilizador
    const result = await pool.query(
      'SELECT * FROM utilizadores WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    const user = result.rows[0];
    
    // 2. Comparar senha com bcryptjs
    const match = await bcrypt.compare(senha, user.senha);
    if (!match) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    // 3. Se válido, gerar secret 2FA (primeira vez) e QR Code
    let secret = user.secret_2fa;
    let qr_code = null;
    
    if (!secret) {
      secret = speakeasy.generateSecret({
        name: `MeClinic (${email})`,
        issuer: 'MeClinic'
      });
      
      qr_code = await QRCode.toDataURL(secret.otpauth_url);
      
      // Salvar secret na BD
      await pool.query(
        'UPDATE utilizadores SET secret_2fa = $1 WHERE id = $2',
        [secret.base32, user.id]
      );
    }
    
    res.json({
      message: '2FA necessário',
      qr_code: qr_code,
      secret: secret.base32,
      email: email
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Hash de Senha (Bcryptjs)

```javascript
// Ao criar novo utilizador:
const hashedPassword = await bcrypt.hash(senha, 10);
// 10 = salt rounds (quanto maior, mais seguro mas mais lento)

// Ao validar:
const isMatch = await bcrypt.compare(senhaInserida, hashedPassword);
```

**Razão do bcryptjs:**
- ✅ Resistente a força bruta (lento propositalmente)
- ✅ Salt aleatório (evita rainbow tables)
- ✅ Padrão da indústria
- ✅ Impossível descriptografar (apenas comparar)

---

## 2️⃣ Segunda Fase: Autenticação 2FA (TOTP)

### O que é TOTP?

**TOTP** = Time-based One Time Password

Um código de 6 dígitos que:
- Muda a cada 30 segundos
- Baseado em segredo compartilhado (QR Code)
- Sem necessidade de servidor externo
- Funciona offline após setup

### Providers Suportados

- Google Authenticator
- Microsoft Authenticator
- Authy
- Apple Keychain
- Qualquer app TOTP padrão

### Geração de QR Code

```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Gerar segredo
const secret = speakeasy.generateSecret({
  name: `MeClinic (${email})`,
  issuer: 'MeClinic',
  length: 32
});

// secret contém:
// {
//   secret: 'ABC123...', // Base32 encoded
//   base32: 'ABC123...',
//   otpauth_url: 'otpauth://totp/...'
// }

// Gerar QR Code (PNG data URL)
const qrCode = await QRCode.toDataURL(secret.otpauth_url);

// QR Code pode ser exibido no frontend como <img src={qrCode} />
```

### Fluxo Completo 2FA

```
1. Backend gera secret com speakeasy
2. QR Code gerado com a library QRCode
3. Frontend exibe QR Code ao utilizador
4. Utilizador escaneia com app (Google Authenticator, etc)
5. App sincroniza segredo automaticamente
6. App gera código TOTP novo a cada 30s
7. Utilizador insere código no frontend
8. Frontend envia para backend
9. Backend valida:
   speakeasy.totp.verify({
     secret: secret_armazenado,
     encoding: 'base32',
     token: codigo_do_usuario
   })
10. Se válido → Gera JWT Token
```

### Verificação de 2FA (Backend)

```javascript
// POST /auth/verify-2fa
app.post('/auth/verify-2fa', async (req, res) => {
  const { email, token_2fa } = req.body;
  
  try {
    // 1. Buscar utilizador
    const result = await pool.query(
      'SELECT * FROM utilizadores WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilizador não encontrado' });
    }
    
    const user = result.rows[0];
    
    // 2. Verificar token TOTP
    const verified = speakeasy.totp.verify({
      secret: user.secret_2fa,
      encoding: 'base32',
      token: token_2fa,
      window: 2  // Permite 2 períodos (±60 segundos)
    });
    
    if (!verified) {
      return res.status(401).json({ error: 'Código 2FA inválido' });
    }
    
    // 3. Gerar JWT Token
    const token = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 4. Atualizar último login
    await pool.query(
      'UPDATE utilizadores SET ultimo_login = NOW(), ip_ultimo_login = $1 WHERE id = $2',
      [req.ip, user.id]
    );
    
    res.json({
      jwt: token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 3️⃣ Terceira Fase: JWT Token Management

### O que é JWT?

**JWT** = JSON Web Token

Um token que contém no máximo:
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": 1,
    "email": "user@clinica.pt",
    "role": "dentista",
    "iat": 1743513600,
    "exp": 1743600000
  },
  "signature": "HMACSHA256(header.payload, JWT_SECRET)"
}
```

### Ciclo de Vida do JWT

```
1. GERAÇÃO
   Após verificar 2FA ✅
   jwt.sign({ user_id, role, ... }, JWT_SECRET, { expiresIn: '24h' })
   
2. ARMAZENAMENTO (Client)
   localStorage.setItem('meclinic_token', token)
   localStorage.setItem('meclinic_user', JSON.stringify(user))
   
3. TRANSMISSÃO (Network)
   Cada requisição inclui:
   Authorization: Bearer eyJhbGc... (o token)
   
4. VALIDAÇÃO (Server)
   jwt.verify(token, JWT_SECRET)
   Retorna { user_id, email, role }
   
5. EXPIRAÇÃO
   24 horas após geração
   Utilizador refaz login
```

### Middleware de Autenticação (Backend)

```javascript
// Usado em todas as rotas protegidas
function validateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(403).json({ error: 'Token inválido' });
  }
}

// Uso nas rotas:
app.get('/pacientes', validateToken, async (req, res) => {
  // req.user contém: { user_id, email, role }
  console.log(`Requisição do utilizador:`, req.user.user_id);
});
```

### Interceptor Frontend

```javascript
// Automaticamente adiciona token a cada requisição
const makeRequest = async (url, options = {}) => {
  const token = localStorage.getItem('meclinic_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (response.status === 401) {
    // Token expirado, fazer logout
    localStorage.removeItem('meclinic_token');
    window.location.href = '/auth';
  }
  
  return response;
};
```

---

## 4️⃣ Quarta Fase: RBAC (Role-Based Access Control)

### Roles Definidas

| Role | Permissões |
|------|-----------|
| **admin** | ✅ Tudo (base de dados, usuários, relatórios) |
| **dentista** | ✅ Pacientes, consultas, faturação própria |
| **assistente** | ✅ Pacientes (leitura), inventário, agendamento |

### Middleware de Autorização

```javascript
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acesso negado. Role requerido: ${allowedRoles.join(' ou ')}`
      });
    }
    next();
  };
}

// Uso:
app.delete('/utilizadores/:id', 
  validateToken, 
  requireRole(['admin']), 
  async (req, res) => {
    // Apenas admin pode deletar utilizadores
  }
);

app.post('/consultas',
  validateToken,
  requireRole(['admin', 'dentista']),
  async (req, res) => {
    // Apenas admin e dentista podem criar consultas
  }
);
```

---

## 5️⃣ Quinta Fase: Validação de Dados

### Sanitização de Input

```javascript
// Remover caracteres perigosos
function sanitizeInput(input) {
  return input
    .trim()
    .replace(/[<>]/g, '')  // Remove < >
    .replace(/--/g, '');   // Remove --
}

// Uso:
const email = sanitizeInput(req.body.email);
```

### Validação de Email

```javascript
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

if (!validateEmail(email)) {
  return res.status(400).json({ error: 'Email inválido' });
}
```

### Prepared Statements (Previne SQL Injection)

```javascript
// ✅ CORRETO - Seguro
await pool.query(
  'SELECT * FROM utilizadores WHERE email = $1 AND role = $2',
  [email, role]
);

// ❌ ERRADO - Vulnerável a SQL Injection
await pool.query(
  `SELECT * FROM utilizadores WHERE email = '${email}' AND role = '${role}'`
);

// Exemplo de ataque:
// email = "admin' --"
// Query errada resultaria em: SELECT * FROM utilizadores WHERE email = 'admin' --'
// O -- comenta o resto e retorna todos os admins!
```

---

## 🔑 Variáveis de Ambiente Críticas

```env
# JWT
JWT_SECRET=sua_chave_super_secreta_minimo_32_caracteres_aleatorios

# Em produção, use ferramentas para gerar:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚨 Resposta a Segurança

### Checklist de Segurança

- [ ] Senhas sempre com bcryptjs (nunca plain text)
- [ ] JWT com expiração curta (24h)
- [ ] HTTPS sempre (em produção)
- [ ] CORS configurado corretamente
- [ ] Rate limiting implementado (futuro)
- [ ] Validação de todos os inputs
- [ ] Logs de operações críticas
- [ ] Backup regular do BD
- [ ] Autenticação 2FA obrigatória para admin

### Incidentes

Se suspeitar de segurança comprometida:

1. **Mudar JWT_SECRET** imediatamente
2. **Invalidar todos os tokens** (logout forçado)
3. **Force reset de 2FA** para todos os usuários
4. **Revisar logs** de acesso
5. **Fazer backup** e auditar dados

---

## 📱 Como Configurar 2FA para Novos Usuários

### Para o Utilizador

1. Fazer login com email + senha
2. Escanear QR Code com app TOTP:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
3. Inseri código de 6 dígitos do app
4. Guardar códigos de backup (offline, seguro!)
5. Confirmar acesso

### Para o Admin (Setup Manual)

```javascript
// Se quiser pré-gerar 2FA para novo utilizador:

const secret = speakeasy.generateSecret({
  name: `MeClinic (${email})`,
  issuer: 'MeClinic'
});

// Guardar secret_2fa na BD
await pool.query(
  'UPDATE utilizadores SET secret_2fa = $1 WHERE email = $2',
  [secret.base32, email]
);

// Fornecer QR Code ao utilizador para escanear
```

---

## 🔄 Reset de Senha

### Fluxo

```
1. Utilizador clica em "Esqueci a senha"
2. POST /auth/forgot-password { email }
3. Backend gera código de 10 dígitos
4. Salva em BD com expiração de 24h
5. Envia link por email: /reset?code=1234567890
6. Utilizador clica link
7. Insere nova senha
8. POST /auth/reset-password { code, new_password }
9. Backend valida código e expiração
10. Atualiza senha (bcryptjs)
11. Invalidar 2FA anterior
12. Redirect para login
```

### Implementação

```javascript
// POST /auth/forgot-password
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT * FROM utilizadores WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      // Não revelar se email existe (segurança)
      return res.json({ message: 'Se o email existe, enviará um link' });
    }
    
    // Gerar código de 10 dígitos
    const resetCode = Math.random().toString().slice(2, 12);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    
    // Guardar código
    await pool.query(
      'UPDATE utilizadores SET reset_code = $1, reset_expires = $2 WHERE email = $3',
      [resetCode, expiresAt, email]
    );
    
    // Enviar email (via nodemailer)
    // ...
    
    res.json({ message: 'Email enviado' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📊 Logs de Segurança

Recomendado registrar:

```javascript
// Tentativas de login falhadas
console.log(`[LOGIN_FAILED] Email: ${email}, IP: ${req.ip}`);

// Logins bem-sucedidos
console.log(`[LOGIN_SUCCESS] User: ${user.id}, IP: ${req.ip}`);

// Mudanças de role/permissões
console.log(`[ROLE_CHANGED] User: ${userId}, Old: ${oldRole}, New: ${newRole}`);

// Acessos deneg ados
console.log(`[ACCESS_DENIED] User: ${userId}, Resource: ${resource}`);
```

---

**Última atualização:** Abril 2026
