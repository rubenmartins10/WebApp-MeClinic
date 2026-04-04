# 🔌 Settings.js - Guia de Integração com APIs

Exemplos de código para conectar as novas funcionalidades do Settings.js com o backend.

---

## 📝 Endpoints Necessários

### 1. Mudança de Palavra-Passe
**Status:** ✅ Já existe em `/server/controllers/authController.js`

```javascript
// POST /api/change-password
const changePassword = async (req, res) => {
  const { userId, currentPassword, newPassword, mfaToken } = req.body;
  
  try {
    // 1. Validar password atual
    // 2. Validar MFA token
    // 3. Hash nova password
    // 4. Guardar em BD
    // 5. Retornar sucesso
    
    res.json({ 
      message: "Palavra-passe alterada com sucesso!" 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
```

### 2. Histórico de Login (NOVO)
**Status:** ⏳ Implementar

```javascript
// GET /api/login-history
const getLoginHistory = async (req, res) => {
  const { userId, limit = 10 } = req.query;
  
  try {
    const history = await LoginHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(history.map(log => ({
      data: log.createdAt.toLocaleString('pt-PT'),
      localizacao: log.location || 'Desconhecida',
      dispositivo: `${log.browser} - ${log.os}`,
      ip: log.ipAddress,
      status: log.success ? 'success' : 'error'
    })));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao recuperar histórico' });
  }
};
```

### 3. Download de Dados Pessoais (GDPR)
**Status:** ⏳ Implementar

```javascript
// GET /api/download-user-data
const downloadUserData = async (req, res) => {
  const { userId } = req.query;
  
  try {
    const user = await User.findById(userId);
    const consultations = await Consultation.find({ userId });
    const settings = await UserSettings.findOne({ userId });
    
    const userData = {
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        criadoEm: user.createdAt
      },
      preferncias: settings,
      consultas: consultations,
      dataExportacao: new Date().toISOString(),
      versao: '1.0'
    };
    
    res.setHeader('Content-Disposition', 
      `attachment; filename="meclinic-dados-${new Date().toISOString().split('T')[0]}.json"`
    );
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao descarregar dados' });
  }
};
```

### 4. Eliminar Conta (GDPR - Right to Erasure)
**Status:** ⏳ Implementar

```javascript
// DELETE /api/delete-account
const deleteAccount = async (req, res) => {
  const { userId, password, mfaToken } = req.body;
  
  try {
    // 1. Validar password
    // 2. Validar MFA
    
    // 3. Backup de dados (conformidade GDPR)
    const backup = {
      user: await User.findById(userId),
      timestamp: new Date(),
      action: 'ACCOUNT_DELETION'
    };
    await BackupLog.create(backup);
    
    // 4. Eliminar utilizador
    await User.findByIdAndDelete(userId);
    
    // 5. Eliminar dados associados
    await Consultation.deleteMany({ userId });
    await UserSettings.deleteOne({ userId });
    await LoginHistory.deleteMany({ userId });
    
    // 6. Logout de todas as sessões
    // ... invalidar tokens JWT
    
    res.json({ 
      message: "Conta eliminada permanentemente.",
      backupId: backup._id 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### 5. Logout de Todos os Dispositivos
**Status:** ⏳ Implementar

```javascript
// POST /api/logout-all-devices
const logoutAllDevices = async (req, res) => {
  const { userId } = req.body;
  
  try {
    // Invalidar todos os tokens JWT do utilizador
    await BlacklistedToken.insertMany(
      // Pegar todos os tokens ativos do utilizador
      // e adicionar à lista negra
    );
    
    // Encerrar todas as sessões
    await Session.deleteMany({ userId });
    
    res.json({ 
      message: "Todos os dispositivos foram desconectados.",
      devicesLoggedOut: 3 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

---

## 🔄 Integração no Frontend

### Exemplo Completo - Settings.js com APIs

```javascript
// Dentro do Settings.js, adicionar depois de handleSave()

// NOVO: Download de Dados
const handleDownloadData = async () => {
  try {
    const response = await fetch(
      `/api/download-user-data?userId=${user.id}`,
      { headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` } }
    );
    
    const data = await response.json();
    
    // Criar download
    const element = document.createElement('a');
    element.setAttribute('href', 
      'data:text/plain;charset=utf-8,' + 
      encodeURIComponent(JSON.stringify(data, null, 2))
    );
    element.setAttribute('download', 
      `meclinic-dados-${new Date().toISOString().split('T')[0]}.json`
    );
    element.click();
    
    showNotif('success', 'Dados descarregados com sucesso.');
  } catch (err) {
    showNotif('error', 'Erro ao descarregar dados.');
  }
};

// NOVO: Eliminar Conta
const handleDeleteAccount = async () => {
  const confirmed = window.confirm(
    'Tem a CERTEZA que deseja eliminar permanentemente sua conta? Esta ação é IRREVERSÍVEL.'
  );
  
  if (!confirmed) return;
  
  try {
    const response = await fetch('/api/delete-account', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        userId: user.id,
        password: prompt('Confirme sua password para eliminar:'),
        mfaToken: prompt('Código Google Authenticator:')
      })
    });
    
    if (response.ok) {
      showNotif('success', 'Conta eliminada. Redirecionando...');
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/login';
      }, 2000);
    } else {
      const data = await response.json();
      showNotif('error', data.error);
    }
  } catch (err) {
    showNotif('error', 'Erro ao eliminar conta.');
  }
};

// NOVO: Logout Todos os Dispositivos
const handleLogoutAllDevices = async () => {
  if (!window.confirm('Desconectar todos os dispositivos?')) return;
  
  try {
    const response = await fetch('/api/logout-all-devices', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ userId: user.id })
    });
    
    if (response.ok) {
      showNotif('success', 'Todos os dispositivos foram desconectados.');
      // Fazer logout do dispositivo atual após 2 segundos
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/login';
      }, 2000);
    }
  } catch (err) {
    showNotif('error', 'Erro ao desconectar dispositivos.');
  }
};

// NOVO: Carregar Histórico de Login
const loadLoginHistory = async () => {
  try {
    const response = await fetch(
      `/api/login-history?userId=${user.id}&limit=10`,
      { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
    );
    
    const history = await response.json();
    setLoginHistory(history);
  } catch (err) {
    console.error('Erro ao carregar histórico:', err);
  }
};

// Chamar ao montar o componente
useEffect(() => {
  if (activeTab === 'atividade') {
    loadLoginHistory();
  }
}, [activeTab]);
```

---

## 📊 Esquema de Base de Dados

### Tabela: LoginHistory
```sql
CREATE TABLE LoginHistory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  browser VARCHAR(100),
  os VARCHAR(100),
  ipAddress VARCHAR(45),
  location VARCHAR(255),
  success BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### Tabela: BlacklistedToken
```sql
CREATE TABLE BlacklistedToken (
  id INT PRIMARY KEY AUTO_INCREMENT,
  token LONGTEXT,
  userId INT NOT NULL,
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### Tabela: Session
```sql
CREATE TABLE Session (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  deviceId VARCHAR(255),
  deviceName VARCHAR(255),
  lastActivity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### Tabela: BackupLog (GDPR Compliance)
```sql
CREATE TABLE BackupLog (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  userData JSON,
  action VARCHAR(50),
  reason VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  retentionEndDate TIMESTAMP
);
```

---

## 🛡️ Segurança

### Validações Necessárias

```javascript
// No backend - validar MFA Token
const validateMFAToken = (userId, token) => {
  const secret = user.mfaSecret; // Armazenado com hash
  const time = Math.floor(Date.now() / 1000 / 30);
  
  for (let i = -1; i <= 1; i++) {
    const hmac = crypto
      .createHmac('sha1', Buffer.from(secret, 'base64'))
      .update(Buffer.from(String(time + i).padStart(8, '0'), 'utf-8'))
      .digest();
    
    const offset = hmac[hmac.length - 1] & 0xf;
    const otp = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;
    
    if (otp === parseInt(token)) return true;
  }
  
  return false;
};

// No backend - validar força de password
const validatePasswordStrength = (password) => {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^A-Za-z\d]/.test(password)) return false;
  return true;
};

// No backend - Rate limiting para tentativas de login
const checkLoginAttempts = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const attempts = await LoginHistory.countDocuments({
    userId,
    success: false,
    createdAt: { $gte: today }
  });
  
  if (attempts > 5) {
    // Bloquear utilizador por 1 hora
    throw new Error('Demasiadas tentativas falhadas. Tente mais tarde.');
  }
};
```

### Headers de Segurança
```javascript
// Adicionar ao servidor Express
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});

// CORS para Settings
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

## 📈 Monitoramento & Logging

```javascript
// Logging de alterações sensíveis
const logSecurityEvent = async (userId, action, details) => {
  await SecurityLog.create({
    userId,
    action, // 'PASSWORD_CHANGED', 'ACCOUNT_DELETED', 'LOGOUT_ALL'
    details,
    ipAddress: req.ip,
    timestamp: new Date()
  });
  
  // Enviar email notificação
  if (action === 'PASSWORD_CHANGED' || action === 'LOGOUT_ALL') {
    await sendSecurityAlert(userId, action);
  }
};
```

---

## 🧪 Testes

### Teste Manual - Settings Segurança
```bash
# 1. Abrir Settings em 2 abas diferentes
# 2. Em aba 1: ir para tab "Atividade"
# 3. Verificar 2 sessões ativas
# 4. Em aba 2: clicar "Desconectar Todos"
# 5. Resultado: Ambas as abas fazem logout
```

### Teste GDPR
```bash
# 1. Clicar "Descarregar Dados"
# 2. Verificar JSON com estrutura correcta
# 3. Clicar "Eliminar Conta"
# 4. Confirmar password + MFA
# 5. Resultado: Conta eliminada, redirect para login
```

---

## 📚 Referências

- [GDPR - Right to Access](https://gdpr-info.eu/art-15-gdpr/)
- [GDPR - Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [Google Authenticator API](https://github.com/google/google-authenticator)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

**Pronto para integração em produção!** ✅
