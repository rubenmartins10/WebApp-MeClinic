# Configurações da Aplicação MeClinic

Este diretório contém todas as configurações centralizadas para a aplicação MeClinic.

## Ficheiros de Configuração

### `database.js`
Configuração de conexão com PostgreSQL.

**Variáveis de Ambiente:**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=meclinic
DB_POOL_SIZE=10
DB_SSL=false
```

**Uso:**
```javascript
const pool = require('./database');
await pool.query('SELECT * FROM pacientes');
```

---

### `clinic.js`
Informações e configurações específicas da clínica.

**Contém:**
- Dados da clínica (nome, email, morada, telefone)
- Horário de funcionamento
- Configurações de negócio (moeda, idioma, timezone)
- Regras de agendamento
- Configurações de faturação
- Métodos de pagamento
- Categorias de procedimentos
- Papéis e permissões de utilizadores
- Notificações por email
- Configurações de relatórios

**Uso:**
```javascript
const clinicConfig = require('./clinic');
console.log(clinicConfig.clinic.name); // "MeClinic"
console.log(clinicConfig.business.currency); // "EUR"
```

---

### `constants.js`
Enumerações e valores constantes da aplicação.

**Contém:**
- Estados de consulta (SCHEDULED, CONFIRMED, COMPLETED...)
- Estados de fatura (DRAFT, ISSUED, PAID...)
- Estados de paciente (ACTIVE, INACTIVE...)
- Tipos de identificação (CC, BI, PASSPORT...)
- Géneros
- Tipos de contacto
- Prioridades de consulta
- Problemas dentários
- Coberturas de seguros
- Códigos e mensagens de erro
- Limites de validação
- Formatos aceites

**Uso:**
```javascript
const { APPOINTMENT_STATUS, INVOICE_STATUS } = require('./constants');
if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
  // Criar fatura...
}
```

---

### `frontend.js`
Configurações específicas para a aplicação React Frontend.

**Contém:**
- URL da API
- Configurações de UI/Temas
- Configurações de paginação
- Configurações de tabelas e formulários
- Configurações de notificações e modais
- Configurações de dashboard e calendário
- Autenticação frontend
- Armazenamento local
- Rotas da aplicação
- Políticas de retenção de dados
- Integrações externas
- Configurações de desenvolvimento

**Uso (em componentes React):**
```javascript
import { APP_ROUTES, PAGINATION_CONFIG } from '../config/frontend';
<Link to={APP_ROUTES.PRIVATE.PATIENTS} />
```

---

### `database.js`
Configuração centralizada do pool PostgreSQL.

**Características:**
- Pool de conexões configurável
- Suporte a SSL para produção
- Tratamento de erros
- Variáveis de ambiente

---

## Estrutura de Ficheiros de Configuração

```
config/
├── clinic.js          # Informações da clínica
├── constants.js       # Enumerações e constantes
├── frontend.js        # Configurações React
├── database.js        # Pool PostgreSQL
├── README.md          # Este ficheiro
├── development.env    # Variáveis de desenvolvimento
├── production.env     # Variáveis de produção
└── test.env          # Variáveis de testes
```

## Variáveis de Ambiente

### Desenvolvimento

Criar ficheiro `.env` na raiz do projeto:

```bash
# Base de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=meclinic

# Clínica
CLINIC_EMAIL=contato@meclinic.pt
CLINIC_PHONE=+351 XXX XXX XXX
CLINIC_WEBSITE=https://meclinic.pt

# API
PORT=5000
NODE_ENV=development

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development

# Email
EMAIL_SERVICE=mailtrap
EMAIL_FROM=noreply@meclinic.pt
MAILTRAP_API_TOKEN=seu_token

# Segurança
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
SESSION_SECRET=sua_outra_chave_secreta
```

### Produção

Em ambiente de produção, as variáveis devem ser configuradas no servidor/plataforma de hosting:

```bash
DB_HOST=seu-db-host.azure.com
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha_segura
DB_NAME=meclinic
DB_SSL=true

NODE_ENV=production
PORT=80

# ... outras variáveis específicas da produção
```

## Boas Práticas

### 1. **Usar Configurações Centralizadas**
```javascript
// ✅ CORRETO
const { userRoles } = require('./config/clinic');

// ❌ EVITAR
const roles = { ADMIN: 'admin', DENTIST: 'dentist' };
```

### 2. **Validar Variáveis de Ambiente na Inicialização**
```javascript
// server/index.js
if (!process.env.JWT_SECRET) {
  console.error('ERRO: JWT_SECRET não está definido');
  process.exit(1);
}
```

### 3. **Usar Constantes para Estados**
```javascript
// ✅ CORRETO
const { APPOINTMENT_STATUS } = require('./config/constants');
if (status === APPOINTMENT_STATUS.COMPLETED) { }

// ❌ EVITAR
if (status === 'completed') { }
```

### 4. **Não Commitar Dados Sensíveis**
- Nunca commit ficheiros `.env`
- Usar `.env.example` para documentar variáveis necessárias
- Rodar: `echo ".env" >> .gitignore`

## Exemplo de Uso Integrado

```javascript
// Backend - Criar agendamento
const pool = require('./database');
const { APPOINTMENT_STATUS } = require('./constants');
const clinicConfig = require('./clinic');

const createAppointment = async (patientId, dateTime) => {
  const maxDaysAhead = clinicConfig.appointment.maxBookingDaysAhead;
  const minInterval = clinicConfig.appointment.minIntervalBetweenAppointments;
  
  const result = await pool.query(
    `INSERT INTO consultas (paciente_id, data_hora, estado) 
     VALUES ($1, $2, $3) RETURNING *`,
    [patientId, dateTime, APPOINTMENT_STATUS.SCHEDULED]
  );
  
  return result.rows[0];
};
```

## Suporte

Para dúvidas sobre configurações:
1. Consulte a documentação técnica em `DOCUMENTACAO/`
2. Verifique exemplos em ficheiros de rotas
3. Execute scripts de debug em `server/debug-*.js`

---

**Última Atualização:** 2024
**Versão:** 1.0
