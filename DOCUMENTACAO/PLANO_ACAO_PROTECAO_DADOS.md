# 📋 Plano de Ação: Proteção de Dados (EXECUTIVO)

**Status:** 🔴 CRÍTICO - Não pronto para produção  
**Data:** 2026-04-02  
**Prioridade:** 1️⃣ ANTES de qualquer deploy com dados reais

---

## 🎯 O que fazer ESTE MÊS

### SEMANA 1: PROTEÇÃO CRÍTICA

#### ✅ Task 1: HTTPS/TLS (2-3 horas)

```bash
# Desenvolvimento - Self-signed certificate
cd c:\temp\MeClinic\server
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Responder às perguntas ou usar -subj
openssl req -x509 -newkey rsa:4096 -nodes \
  -out cert.pem -keyout key.pem -days 365 \
  -subj "/C=PT/ST=PT/L=PT/O=MeClinic/CN=localhost"

# npm install para suporte HTTPS
npm install https
```

**Ficheiro `index.js` - Adicionar HTTPS:**

```javascript
// No topo
const https = require('https');
const fs = require('fs');

// No final, substituir app.listen por:
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === 'production') {
  // Production: HTTPS obrigatório
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
  https.createServer(options, app).listen(443, () => {
    console.log('🔒 HTTPS server running on port 443');
  });
} else {
  // Dev: HTTP (OK para testes)
  // Production fallback mantém HTTPS redirect
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
```

**Resultado esperado:**
- ✅ Certificado gerado
- ✅ Server inicia em HTTPS
- ✅ Warning de certificado auto-assinado (esperado em dev)

---

#### ✅ Task 2: Encriptação em Repouso (4-6 horas)

**2.1 - Instalar dependências:**

```bash
npm install crypto-js dotenv
```

**2.2 - Criar utility `utils/encryption.js`:**

```javascript
const crypto = require('crypto');

// Usar variável de ambiente para chave
// Gerar: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 64) {
  console.warn('⚠️ ENCRYPTION_KEY not set or too short. Using default (DEV ONLY)');
}

const algorithm = 'aes-256-cbc';

exports.encrypt = (text) => {
  if (!text) return null;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

exports.decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

**2.3 - Adicionar ao `.env`:**

```bash
# Gerar chave: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef90

# Ou copiar desta chave de exemplo (NÃO USAR EM PRODUÇÃO)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

**2.4 - Atualizar Model Paciente para encriptar campos sensíveis:**

```javascript
// models/Paciente.js
const encryption = require('../utils/encryption');

// Onde inserir/atualizar paciente
exports.create = async (pacienteData) => {
  // Encriptar campos sensíveis ANTES de guardar
  const encrypted = {
    ...pacienteData,
    nif: encryption.encrypt(pacienteData.nif),
    email: encryption.encrypt(pacienteData.email),
    notas_clinicas: encryption.encrypt(pacienteData.notas_clinicas)
  };
  
  const query = `
    INSERT INTO pacientes (nome, nif, email, notas_clinicas, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    pacienteData.nome, // nome não encriptar (precisa ser searchable)
    encrypted.nif,
    encrypted.email,
    encrypted.notas_clinicas
  ]);
  
  return result.rows[0];
};

// Onde ler paciente
exports.findById = async (id) => {
  const query = 'SELECT * FROM pacientes WHERE id = $1';
  const result = await pool.query(query, [id]);
  
  if (!result.rows[0]) return null;
  
  // Descriptografar APÓS ler da BD
  const paciente = result.rows[0];
  return {
    ...paciente,
    nif: encryption.decrypt(paciente.nif),
    email: encryption.decrypt(paciente.email),
    notas_clinicas: encryption.decrypt(paciente.notas_clinicas)
  };
};
```

**Resultado esperado:**
- ✅ Dados encriptados na BD (hexadecimal)
- ✅ Descriptografados automaticamente ao ler
- ✅ NIF, email, notas protegidos

**Verificar:**
```sql
-- BD conterá dados encriptados
SELECT id, nome, nif, email FROM pacientes;
-- Saída: id | nome | nif (hex) | email (hex)
```

---

#### ✅ Task 3: GDPR Endpoints (3 horas)

**3.1 - Criar modelo AuditLog:**

```javascript
// models/GdprLog.js
const pool = require('../db');

exports.createLog = async (userId, action, resource, ipAddress) => {
  const query = `
    INSERT INTO gdpr_logs (user_id, action, resource, ip_address, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `;
  
  return pool.query(query, [userId, action, resource, ipAddress]);
};
```

**3.2 - Criar controller GDPR:**

```javascript
// controllers/gdprController.js
const pool = require('../db');
const Paciente = require('../models/Paciente');
const Consulta = require('../models/Consulta');
const Faturacao = require('../models/Faturacao');

exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Coletar todos os dados do utilizador
    const userData = {
      exportedAt: new Date().toISOString(),
      utilizador: await pool.query(
        'SELECT id, nome, email FROM utilizadores WHERE id = $1', 
        [userId]
      ).then(r => r.rows[0]),
      pacientes: await pool.query(
        'SELECT * FROM pacientes WHERE created_by = $1 OR utilizador_id = $1',
        [userId]
      ).then(r => r.rows),
      consultas: await pool.query(
        'SELECT * FROM consultas WHERE created_by = $1',
        [userId]
      ).then(r => r.rows),
      faturas: await pool.query(
        'SELECT * FROM faturacao WHERE created_by = $1',
        [userId]
      ).then(r => r.rows)
    };
    
    // Log para audit trail
    await pool.query(
      'INSERT INTO gdpr_logs (user_id, action, resource, ip_address) VALUES ($1, $2, $3, $4)',
      [userId, 'DATA_EXPORT', 'all', req.ip]
    );
    
    // Enviar como download
    res.json({
      success: true,
      message: 'Dados exportados com sucesso',
      data: userData
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
};

exports.requestDeletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmPassword } = req.body;
    
    // Verificar password (segurança adicional)
    const user = await pool.query('SELECT * FROM utilizadores WHERE id = $1', [userId])
      .then(r => r.rows[0]);
    
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(confirmPassword, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Palavra-passe inválida' });
    }
    
    // Agendar deleção (soft delete)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30); // 30 dias para reconsiderar
    
    await pool.query(
      `UPDATE utilizadores 
       SET deleted_at = NOW(), 
           deletion_scheduled = $1,
           nome = 'ANONYMIZED_' || id,
           email = 'deleted_' || id || '@archived.local'
       WHERE id = $2`,
      [deletionDate, userId]
    );
    
    // Log
    await pool.query(
      'INSERT INTO gdpr_logs (user_id, action, resource, ip_address) VALUES ($1, $2, $3, $4)',
      [userId, 'DELETION_REQUESTED', 'account', req.ip]
    );
    
    res.json({
      success: true,
      message: 'Conta marcada para eliminação. Será apagada em 30 dias.',
      deletionDate
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao processar deleção' });
  }
};
```

**3.3 - Adicionar rotas:**

```javascript
// routes/gdpr.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const gdprController = require('../controllers/gdprController');

router.post('/export-data', authMiddleware, gdprController.exportUserData);
router.post('/request-deletion', authMiddleware, gdprController.requestDeletion);

module.exports = router;
```

**3.4 - Registar rotas no `index.js`:**

```javascript
const gdprRoutes = require('./routes/gdpr.routes');
app.use('/api/gdpr', gdprRoutes);
```

**Resultado esperado:**
- ✅ `POST /api/gdpr/export-data` - Download JSON com todos dados
- ✅ `POST /api/gdpr/request-deletion` - Agendar deleção em 30 dias
- ✅ GDPR logs criados automaticamente

---

### SEMANA 2: AUDITORIA & SECRETS

#### ✅ Task 4: Audit Logging (3 horas)

**4.1 - Criar tabela audit:**

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES utilizadores(id) ON DELETE SET NULL,
  action VARCHAR(50),
  resource_type VARCHAR(100),
  resource_id INTEGER,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status_code INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
```

**4.2 - Criar middleware de auditoria:**

```javascript
// middleware/auditLogging.js
const pool = require('../db');

exports.auditLog = (action, resource) => {
  return async (req, res, next) => {
    const oldData = req.body;
    
    // Interceptar response
    const originalJson = res.json;
    res.json = function(data) {
      // Guardar após resposta bem-sucedida
      if (res.statusCode >= 200 && res.statusCode < 300) {
        pool.query(
          `INSERT INTO audit_logs 
           (user_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent, status_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            req.user?.id,
            action,
            resource,
            req.params.id,
            JSON.stringify(oldData),
            JSON.stringify(data),
            req.ip,
            req.get('user-agent'),
            res.statusCode
          ]
        ).catch(err => console.error('Audit log error:', err));
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};
```

**4.3 - Aplicar em rotas críticas:**

```javascript
// routes/pacientes.routes.js
const { auditLog } = require('../middleware/auditLogging');

router.post(
  '/',
  authMiddleware,
  validateRequest(createPacienteSchema),
  auditLog('CREATE', 'pacientes'), // ← Adicionar aqui
  asyncHandler(PacientesController.create)
);

router.put(
  '/:id',
  authMiddleware,
  validateRequest(updatePacienteSchema),
  auditLog('UPDATE', 'pacientes'), // ← Adicionar aqui
  asyncHandler(PacientesController.update)
);

router.delete(
  '/:id',
  authMiddleware,
  auditLog('DELETE', 'pacientes'), // ← Adicionar aqui
  asyncHandler(PacientesController.delete)
);
```

**Resultado esperado:**
- ✅ Todos CREATE/UPDATE/DELETE logados
- ✅ Auditoria de quem fez o quê, quando
- ✅ Recuperação de dados possível

---

#### ✅ Task 5: Secrets Management (2 horas)

**5.1 - Validar .env:**

```bash
# .env (NUNCA commit isto! Adicionar a .gitignore)
NODE_ENV=development
PORT=5000

# Segurança - OBRIGATÓRIO gerar valores seguros
JWT_SECRET=seu_secret_muito_longo_e_aleatorio_aqui_32_chars_minimo
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Base de dados
DATABASE_URL=postgresql://user:password@localhost:5432/meclinic

# Frontend
FRONTEND_URL=http://localhost:3050

# SSL (produção)
SSL_KEY_PATH=/etc/ssl/private/meclinic.key
SSL_CERT_PATH=/etc/ssl/certs/meclinic.crt
```

**5.2 - Gerar secrets seguros:**

```bash
# Terminal - Executar isto para gerar valores
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

**5.3 - Adicionar a .gitignore:**

```bash
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
*.cert
npm-debug.log
node_modules/
```

**Resultado esperado:**
- ✅ Secrets seguros e aleatórios
- ✅ Nunca commitados ao git
- ✅ Diferentes em dev/prod

---

### SEMANA 3-4: COMPLIANCE & BACKUP

#### ✅ Task 6: Backup Automático Encriptado (2 horas)

**6.1 - Criar script `scripts/backup.sh`:**

```bash
#!/bin/bash
# backup.sh - Backup automático encriptado

BACKUP_DIR="/var/backups/meclinic"
DB_NAME="meclinic"
DB_USER="postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 1. Verificar directory
mkdir -p $BACKUP_DIR

# 2. Fazer backup da BD
echo "📦 Iniciando backup de BD..."
pg_dump -U $DB_USER $DB_NAME | \
  gzip | \
  openssl enc -aes-256-cbc -salt -pbkdf2 \
  -out "$BACKUP_DIR/meclinic_$DATE.sql.gz.enc" \
  -pass env:BACKUP_PASSWORD

# 3. Verificar sucesso
if [ -f "$BACKUP_DIR/meclinic_$DATE.sql.gz.enc" ]; then
  SIZE=$(du -h "$BACKUP_DIR/meclinic_$DATE.sql.gz.enc" | cut -f1)
  echo "✅ Backup criado com sucesso: $SIZE"
else
  echo "❌ Falha ao criar backup"
  exit 1
fi

# 4. Limpar backups antigos (>30 dias)
echo "🗑️ Limpando backups antigos..."
find $BACKUP_DIR -name "*.enc" -mtime +$RETENTION_DAYS -delete

# 5. Contar backups
BACKUP_COUNT=$(ls -1 $BACKUP_DIR/*.enc 2>/dev/null | wc -l)
echo "📊 Backups disponíveis: $BACKUP_COUNT"
```

**6.2 - Adicionar cron job (agendador Linux):**

```bash
# Para executar diariamente às 2 da manhã
# crontab -e
0 2 * * * /var/backups/meclinic/backup.sh >> /var/log/meclinic-backup.log 2>&1

# Para testar
./scripts/backup.sh
```

**Resultado esperado:**
- ✅ Backup automático encriptado diário
- ✅ Backups antigos apagados
- ✅ Log de backup criado

---

#### ✅ Task 7: Documentação Legal (4 horas)

**Ficheiros a criar:**

1. **Política de Privacidade** (`POLITICA_PRIVACIDADE.md`)
2. **Termos de Serviço** (`TERMOS_SERVICO.md`)
3. **Política de Cookies** (`POLITICA_COOKIES.md`)
4. **Manual de Conformidade** (`MANUAL_COMPLIANCE_GDPR.md`)

**Mínimo necessário em Política de Privacidade:**

```markdown
# Política de Privacidade

## 1. Controlador de Dados
MeClinic Clínica Dentária
[Morada]
[Email]

## 2. Dados Processados
- Nome completo
- Email e telefone
- NIF
- Data de nascimento
- Dados clínicos (consultas, diagnósticos)
- Dados de faturação

## 3. Base Legal
- Consentimento do utilizador
- Contrato de serviço de saúde
- Obrigação legal (registos médicos - 10 anos)

## 4. Retenção de Dados
- Dados clínicos: 10 anos após última consulta
- Dados de faturação: 7 anos (lei fiscal)
- Dados de auditoria: 3 anos

## 5. Direitos do Utilizador
- Direito de acesso (exportar dados)
- Direito de retificação
- Direito ao esquecimento
- Direito à portabilidade
- Direito de oposição

## 6. Segurança
- Encriptação em repouso (AES-256)
- Encriptação em trânsito (HTTPS/TLS)
- Backups encriptados
- Audit logging completo

## 7. Contactar
Para exercer direitos: privacy@meclinic.pt
```

---

## 📊 Resumo de Tarefas

| Semana | Tarefa | Duração | Crítico |
|--------|--------|---------|---------|
| **1** | HTTPS/TLS | 2-3h | 🔴 SIM |
| **1** | Encriptação em repouso | 4-6h | 🔴 SIM |
| **1** | GDPR endpoints | 3h | 🔴 SIM |
| **2** | Audit Logging | 3h | 🟠 ALTO |
| **2** | Secrets Management | 2h | 🟠 ALTO |
| **3** | Backup Encriptado | 2h | 🟠 ALTO |
| **3-4** | Documentação Legal | 4h | 🟠 ALTO |
| | **TOTAL** | **~25 horas** | |

---

## ✅ Checklist Final (antes de PRODUÇÃO)

- [ ] HTTPS/TLS funcionando
- [ ] Dados sensíveis encriptados
- [ ] Audit logging ativo
- [ ] GDPR endpoints testados
- [ ] Backups funcionando
- [ ] Secrets em .env seguro
- [ ] Documentação legal escrita
- [ ] Teste de penetração feito
- [ ] Compliance GDPR documentada
- [ ] Security audit realizado

---

## 🎯 Conclusão

**Timeline realista:** 2-3 semanas para estar pronto para produção com dados reais

**Sem isto, NÃO pode ir live com dados de saúde!**

Próximo passo: Começar pela Task 1 (HTTPS) hoje 👇
