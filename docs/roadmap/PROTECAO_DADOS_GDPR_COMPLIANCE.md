# 🔐 Proteção de Dados - Análise Completa

**Data:** 2026-04-02  
**Criticidade:** 🔴 ALTA (Dados de Saúde)  
**Status:** Análise de Gap Security

---

## 1️⃣ RESUMO EXECUTIVO

A MeClinic trata **dados de saúde pessoais** (dados sensíveis). Portanto, **OBRIGATÓRIA** conformidade com:

- 🇪🇺 **GDPR** (General Data Protection Regulation) - EU, aplicável se utilizadores EU
- 🏥 **HIPAA** (Health Insurance Portability and Accountability Act) - USA
- 🇵🇹 **Lei Proteção de Dados - Lei 58/2019** - Portugal
- 🏢 **PCI-DSS** (se processar pagamentos com cartão)

### ⚠️ Risco Atual: **CRÍTICO**

| Aspecto | Status | Risco |
|---------|--------|-------|
| Encriptação em repouso | ❌ Não | 🔴 CRÍTICO |
| Encriptação em trânsito | ⚠️ Parcial (HTTP) | 🔴 CRÍTICO |
| Audit logging | ❌ Não | 🟠 ALTO |
| GDPR compliance | ❌ Não | 🔴 CRÍTICO |
| Backup encriptado | ❓ Desconhecido | 🟠 ALTO |
| Rate limiting | ✅ Sim | 🟢 OK |
| Validação dados | ✅ Sim | 🟢 OK |
| Autenticação JWT | ✅ Sim | 🟢 OK |

---

## 2️⃣ O QUE JÁ TEMOS ✅

### Backend Security (Implementado)

| Proteção | Detalhe | Status |
|----------|---------|--------|
| **Helmet.js** | 8 proteções de HTTP header (CSP, X-Frame, X-Content-Type, etc) | ✅ |
| **CORS Whitelist** | Apenas localhost:3050, localhost:3000 | ✅ |
| **Rate Limiting** | 100 req/15min global, limite em auth | ✅ |
| **Validação Joi** | 14 schemas, validação de entrada em todos endpoints | ✅ |
| **Password Hashing** | bcryptjs (12 salt rounds) | ✅ |
| **JWT Auth** | Token-based, expiração configurável | ✅ |
| **HTTPS Redirect** | Automático em produção (x-forwarded-proto check) | ✅ |
| **Compression** | GZIP/Brotli para reduzir payload | ✅ |
| **Prepared Statements** | Em todas queries SQL (pg parameterized) | ✅ |
| **Error Handling** | Centralizado, sem stack traces em produção | ✅ |

### Boas Práticas (Parcial)

- ✅ Separação frontend/backend
- ✅ Variáveis de ambiente (.env)
- ✅ MVC architecture
- ✅ Modular code structure

---

## 3️⃣ O QUE FALTA ❌ (CRÍTICO)

### A. ENCRIPTAÇÃO DE DADOS

#### 🔴 **CRÍTICO: Encriptação em Repouso**

**Problema:** Dados de saúde (nome, NIF, datas nascimento, notas clínicas) estão em **plain text** na BD

```sql
-- ATUAL (inseguro)
SELECT nome, nif, email, notas_clinicas FROM pacientes;
-- Dados visíveis para qualquer pessoa com acesso à BD
```

**Solução 1: Encriptação a nível de aplicação (RECOMENDADO)**

```bash
npm install crypto-js dotenv
```

```javascript
// crypto.utils.js
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 char hex string

exports.encrypt = (data) => {
  if (!data) return null;
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

exports.decrypt = (encrypted) => {
  if (!encrypted) return null;
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

**Solução 2: Encriptação a nível de BD (PostgreSQL)**

```sql
-- Criar extensão pgcrypto
CREATE EXTENSION pgcrypto;

-- Trigger para encriptar automaticamente
CREATE TRIGGER before_insert_pacientes
BEFORE INSERT ON pacientes
FOR EACH ROW
EXECUTE FUNCTION encrypt_sensitive_fields();

-- Query com dados encriptados
SELECT nome, 
       pgp_sym_encrypt(nif, 'encryption_key') as nif_encrypted,
       pgp_sym_decrypt(nif_encrypted, 'encryption_key') as nif_decrypted
FROM pacientes;
```

**Solução 3: Cloud KMS (Recomendado para produção)**

```bash
npm install @azure/keyvault-secrets @azure/identity
```

---

#### 🔴 **CRÍTICO: HTTPS/TLS (Encriptação em Trânsito)**

**Problema:** Dados em trânsito pelo HTTP (não encriptado)

**Solução:**

```bash
# 1. Certificado SSL/TLS
# Desenvolvimento: self-signed
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Produção: Let's Encrypt (gratuito)
npm install letsencrypt-express
```

```javascript
// index.js - Production HTTPS
if (process.env.NODE_ENV === 'production') {
  const https = require('https');
  const fs = require('fs');
  
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
  
  https.createServer(options, app).listen(443, () => {
    console.log('🔒 HTTPS server running on port 443');
  });
}
```

---

### B. GDPR COMPLIANCE 🇪🇺

#### 🔴 **CRÍTICO: Direitos dos Utilizadores**

GDPR exige que utilize possa:

1. **Obter exportação de dados** (data export)
2. **Pedir eliminação** (right to be forgotten)
3. **Transportabilidade de dados** (data portability)
4. **Consentimento explícito** (consent management)

```javascript
// controllers/gdprController.js
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Coletar todos os dados do utilizador
    const userData = {
      usuario: await User.findById(userId),
      pacientes: await Paciente.findByUserId(userId),
      consultas: await Consulta.findByUserId(userId),
      faturas: await Faturacao.findByUserId(userId)
    };
    
    // Exportar como JSON
    res.json({
      exportedAt: new Date(),
      data: userData
    });
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
};

exports.deleteUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Soft delete (manter para audit trail)
    await User.update(userId, { 
      deleted_at: new Date(),
      nome: 'ANONYMIZED',
      email: `deleted_${userId}@archived.local`
    });
    
    res.json({ message: 'User data scheduled for deletion' });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed' });
  }
};
```

---

### C. AUDIT LOGGING 📋

#### 🔴 **CRÍTICO: Rastreamento de Ações**

GDPR e HIPAA exigem audit trail completo

```javascript
// models/AuditLog.js
exports.createAuditLog = async (userId, action, resource, oldValue, newValue) => {
  const query = `
    INSERT INTO audit_logs 
    (user_id, action, resource_type, old_value, new_value, ip_address, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    userId,
    action, // CREATE, READ, UPDATE, DELETE, LOGIN, EXPORT
    resource,
    JSON.stringify(oldValue),
    JSON.stringify(newValue),
    context.ipAddress
  ]);
  
  return result.rows[0];
};

// middleware/auditMiddleware.js
exports.auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    // Guardar dados originais
    req.auditData = {
      userId: req.user?.id,
      action,
      resource,
      oldValue: req.body,
      timestamp: new Date(),
      ip: req.ip
    };
    
    // Interceptar response para guardar novo valor
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode === 200 || res.statusCode === 201) {
        req.auditData.newValue = JSON.parse(data);
        AuditLog.createAuditLog(req.auditData);
      }
      originalSend.call(this, data);
    };
    
    next();
  };
};
```

Exemplo de tabela:
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES utilizadores(id),
  action VARCHAR(50), -- CREATE, READ, UPDATE, DELETE, LOGIN, EXPORT, DELETE_REQUEST
  resource_type VARCHAR(100), -- pacientes, consultas, faturas
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

---

### D. DATA RETENTION & ARCHIVAL 🗂️

#### 🟠 **ALTO: Política de Retenção**

```javascript
// services/dataRetention.js
// GDPR: Manter dados apenas enquanto necessário

const retentionPolicies = {
  pacientes: 7, // years after last consultation
  consultas: 10, // years (sometimes legal requirement)
  audit_logs: 3, // years minimum
  temp_sessions: 0.003, // 1 hour in days
  backups: 5 // years rotation
};

// Cron job para cleanup
cron.schedule('0 2 * * 0', async () => {
  // Toda a segunda-feira às 2 da manhã
  console.log('🗑️ Iniciando data retention cleanup...');
  
  // Anonymize old deleted pacientes
  const sevenyearsAgo = new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000);
  await pool.query(
    'DELETE FROM pacientes WHERE deleted_at < $1',
    [sevenyearsAgo]
  );
  
  // Archive old consultas
  const tenYearsAgo = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000);
  await pool.query(
    'DELETE FROM consultas WHERE data_consulta < $1',
    [tenYearsAgo]
  );
  
  console.log('✅ Data retention cleanup completed');
});
```

---

### E. SENSITIVE DATA MASKING 🎭

#### 🟠 **ALTO: Proteção de Dados Sensíveis em Logs/Responses**

```javascript
// utils/dataMasking.js
exports.maskPII = (data) => {
  const masked = { ...data };
  
  // Maskar email: user@email.com -> u***@email.com
  if (masked.email) {
    masked.email = masked.email.replace(/(?<=.).(?=[^@]*@)/, '*');
  }
  
  // Maskar NIF: 123456789 -> 123456***
  if (masked.nif) {
    masked.nif = masked.nif.substring(0, 6) + '***';
  }
  
  // Maskar telefone: 912345678 -> 912***678
  if (masked.telefone) {
    masked.telefone = masked.telefone.replace(/(\d{3})(.*?)(\d{3})/, '$1***$3');
  }
  
  // Maskar CC
  if (masked.cc) {
    masked.cc = masked.cc.substring(0, 4) + '*'.repeat(4) + masked.cc.substring(8);
  }
  
  return masked;
};

// Usar em logs
logger.info('Patient data accessed', dataMasking.maskPII(patientData));

// Usar em responses de erro
app.use((err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    user: dataMasking.maskPII({ email: req.user?.email }),
    timestamp: new Date()
  });
});
```

---

### F. BACKUP ENCRIPTADO 💾

#### 🟠 **ALTO: Backups Seguros**

```bash
#!/bin/bash
# backup.sh - Daily backup com encriptação

BACKUP_DIR="/backups/meclinic"
DB_NAME="meclinic"
ENCRYPTION_KEY=$(cat /etc/meclinic/.backup-key)
DATE=$(date +%Y%m%d_%H%M%S)

# 1. Backup BD
pg_dump $DB_NAME | \
  gzip | \
  openssl enc -aes-256-cbc -salt -in - \
  -out "$BACKUP_DIR/meclinic_$DATE.sql.gz.enc" \
  -k "$ENCRYPTION_KEY"

# 2. Upload para cloud seguro (Azure Blob Storage com encriptação)
az storage blob upload \
  --account-name meclinic-backups \
  --container-name encrypted \
  --name "meclinic_$DATE.sql.gz.enc" \
  --file "$BACKUP_DIR/meclinic_$DATE.sql.gz.enc"

# 3. Limpar backups locais antigos (14 dias)
find $BACKUP_DIR -name "*.enc" -mtime +14 -delete

echo "✅ Backup completo em $DATE"
```

---

### G. SECURE SECRETS MANAGEMENT 🔑

#### 🟠 **ALTO: Gestão de Credenciais**

```bash
# ❌ ERRADO - Secrets em .env file
DATABASE_PASSWORD=mypassword123
JWT_SECRET=secret123

# ✅ CORRETO - Usar Azure Key Vault / HashiCorp Vault
npm install @azure/keyvault-secrets @azure/identity
```

```javascript
// config/secrets.js
const { SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");

const vaultUrl = "https://meclinic-vault.vault.azure.net/";
const client = new SecretClient(vaultUrl, new DefaultAzureCredential());

exports.getSecret = async (secretName) => {
  try {
    const secret = await client.getSecret(secretName);
    return secret.value;
  } catch (err) {
    console.error(`Error getting secret ${secretName}`);
    throw err;
  }
};

// Usar em index.js
const dbPassword = await getSecret('db-password');
const jwtSecret = await getSecret('jwt-secret');
```

---

## 4️⃣ PLANO DE IMPLEMENTAÇÃO

### Fase 1: CRÍTICO (Semana 1)

**Priority:** 🔴 URGENTE - Sem isto, não ir para produção

- [ ] **Implementar HTTPS/TLS**
  - Dev: Self-signed cert
  - Prod: Let's Encrypt
  - Tempo: 2h

- [ ] **Encriptação em Repouso (Sensitive Fields)**
  - Implementar crypto utils
  - Encriptar: NIF, notas clínicas, email (opcional)
  - Migrations: Encriptar dados históricos
  - Tempo: 4h

- [ ] **GDPR Basic**
  - Endpoint /api/gdpr/export-data
  - Endpoint /api/gdpr/delete-account
  - Tempo: 3h

### Fase 2: ALTO (Semana 2)

- [ ] **Audit Logging**
  - Tabela audit_logs
  - Middleware de auditoria
  - Tempo: 3h

- [ ] **Secrets Management**
  - Migrar .env para Azure Key Vault
  - Tempo: 2h

- [ ] **Data Retention Policy**
  - Cron job para cleanup automático
  - Tempo: 2h

### Fase 3: MÉDIO (Semana 3-4)

- [ ] **Backup Automatizado**
  - Script de backup encriptado
  - Upload para cloud
  - Tempo: 3h

- [ ] **Data Masking**
  - Implementar masking de PII
  - Aplicar em logs
  - Tempo: 2h

- [ ] **Compliance Documentation**
  - Documentar conformidade GDPR
  - Documentar conformidade HIPAA
  - Tempo: 4h

---

## 5️⃣ CHECKLIST SECURITY PRÉ-PRODUÇÃO

### Dados

- [ ] ✅ Encriptação em repouso ativa
- [ ] ✅ HTTPS/TLS configurado
- [ ] ✅ Backups encriptados e testados
- [ ] ✅ Retenção de dados configurada
- [ ] ✅ GDPR endpoints implementados
- [ ] ✅ Audit logging ativo

### Aplicação

- [ ] ✅ Helmet.js ativo
- [ ] ✅ CORS whitelist correto (não * )
- [ ] ✅ Rate limiting ativo
- [ ] ✅ Validação Joi em todos endpoints
- [ ] ✅ Prepared statements em SQL
- [ ] ✅ Error handling sem stack traces
- [ ] ✅ JWT secrets forte (32+ chars random)
- [ ] ✅ Senha password min 8 chars + complexity

### Infraestrutura

- [ ] ✅ Database password forte
- [ ] ✅ Database backups automáticos
- [ ] ✅ Database apenas acesso interno
- [ ] ✅ Firewall configurado
- [ ] ✅ Secrets em Azure Key Vault
- [ ] ✅ Logging centralizado
- [ ] ✅ Monitoring & alertas ativo
- [ ] ✅ WAF (Web Application Firewall) ativo

### Compliance

- [ ] ✅ Privacy Policy escrita
- [ ] ✅ Terms of Service escrito
- [ ] ✅ Data Processing Agreement (DPA)
- [ ] ✅ Security audit realizado
- [ ] ✅ Penetration testing realizado
- [ ] ✅ GDPR compliance documentado
- [ ] ✅ Incidente response plan escrito

---

## 6️⃣ COMPARAÇÃO: AGORA vs. PÓS-IMPLEMENTAÇÃO

### Estado Atual ⚠️

```
┌─────────────────────┐
│   Frontend (React)  │
│   (http://...)      │
│                     │
└──────────┬──────────┘
           │ HTTP (não encriptado)
           ▼
┌─────────────────────┐
│  Backend (Express)  │
│  - Helmet ✅        │
│  - Rate Limit ✅    │
│  - Validação ✅     │
│  - JWT ✅           │
│                     │
└──────────┬──────────┘
           │ SQL queries
           ▼
┌─────────────────────┐
│  PostgreSQL         │
│  Dados plain text   │
│  Sem backup crypto  │
│  Sem audit log      │
└─────────────────────┘
```

### Estado Futuro ✅

```
┌─────────────────────┐
│   Frontend (React)  │
│   (https://...)     │
│                     │
└──────────┬──────────┘
           │ HTTPS/TLS (encriptado)
           ▼
┌─────────────────────┐
│  Backend (Express)  │
│  - Helmet ✅        │
│  - Rate Limit ✅    │
│  - Validação ✅     │
│  - JWT ✅           │
│  - Encryption ✅    │
│  - Audit Log ✅     │
│  - GDPR ✅          │
│                     │
└──────────┬──────────┘
           │ Prepared statements
           ▼
┌─────────────────────┐
│  PostgreSQL         │
│  Dados encriptados  │
│  Backup automático  │
│  Audit trail        │
│  Data retention     │
│  GDPR ready         │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Azure Key Vault    │
│  Secrets seguros    │
└─────────────────────┘
```

---

## 7️⃣ LEGAL & COMPLIANCE

### Requisitos GDPR

| Requisito | Implementação |
|-----------|---------------|
| Lawful basis | Consentimento formulário |
| Consent management | Implemented |
| Data subject rights | /gdpr/export, /gdpr/delete |
| Data protection impact | DPIA needed |
| Privacy notice | Privacy Policy document |
| International transfers | Adequacy decision |
| Data retention | 7y clinical + 3y audit |
| Breach notification | 72h procedure documented |
| DPA with processor | Assinada com Azure |

### Requisitos HIPAA (se aplicável)

- [ ] Confidentiality - Encryptio at rest & transit
- [ ] Integrity - Audit logs + checksums
- [ ] Availability - Backups + redundancy
- [ ] Authentication - Multi-factor (nice to have)
- [ ] Access control - RBAC implemented
- [ ] Audit trail - Complete logging
- [ ] Business associate agreements - Signed

---

## 8️⃣ PRÓXIMOS PASSOS IMEDIATOS

### Para esta semana:

1. **Implementar HTTPS/TLS** (hoje/amanhã)
   - Self-signed para dev
   - Let's Encrypt para prod

2. **Encriptação em Repouso** (amanhã/dia seguinte)
   - Começar por NIF + email
   - Depois notas clínicas

3. **Endpoints GDPR** (dia seguinte)
   - /api/gdpr/export-data
   - /api/gdpr/delete-account

4. **Documentação Legal** (paralelo)
   - Privacy Policy
   - Terms of Service
   - GDPR notice

---

## ✅ Conclusão

**Crítico:** A aplicação atual é **insegura para produção** com dados de saúde sem encriptação e auditing.

**Recomendação:** Implementar Fase 1 (Crítico) antes de qualquer deploy em produção.

**Timeline realista:** 2-3 semanas para Phase 1 + 2

**Custo:** Maioritariamente tempo de dev (ferramentas são open-source/grátis)

---

*Documento preparado para MeClinic com dados sensíveis de saúde*
