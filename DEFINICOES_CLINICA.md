# Definições da Clínica - Guia de Utilização

## Visão Geral

O módulo de definições da clínica (`config/clinic.js`) centraliza toda a configuração específica da MeClinic, permitindo personalizações sem alterar código.

## 1. Informações da Clínica

Dados básicos usados em documentos, emails e contactos:

```javascript
const clinicConfig = require('./config/clinic');

// Obter informações da clínica
console.log(clinicConfig.clinic.name);     // "MeClinic"
console.log(clinicConfig.clinic.email);    // "contato@meclinic.pt"
console.log(clinicConfig.clinic.phone);    // "+351 XXX XXX XXX"

// Endereço completo
const endereco = clinicConfig.clinic.address;
console.log(`${endereco.street}, ${endereco.number}`);
```

### Usar em Templates de Email

```javascript
const clinic = require('./config/clinic').clinic;

const emailTemplate = `
  <h1>${clinic.fullName}</h1>
  <p>${clinic.address.street}, ${clinic.address.number}</p>
  <p>${clinic.address.postalCode} - ${clinic.address.city}</p>
  <p>Email: ${clinic.email}</p>
  <p>Telefone: ${clinic.phone}</p>
`;
```

---

## 2. Horário de Funcionamento

Controlar disponibilidade de agendamentos:

```javascript
const schedule = require('./config/clinic').schedule;

// Verificar se está aberto hoje
const today = new Date().toLocaleLowerCase('pt-PT', { weekday: 'long' });
const dayConfig = schedule[today]; // ex: schedule.monday

if (!dayConfig.closed) {
  console.log(`Aberto de ${dayConfig.start} a ${dayConfig.end}`);
} else {
  console.log('Fechado hoje');
}
```

### Implementar Validação de Agendamentos

```javascript
function canScheduleAppointment(dayOfWeek, time) {
  const dayConfig = schedule[dayOfWeek];
  
  if (dayConfig.closed) {
    return false;
  }
  
  const [openHour, openMin] = dayConfig.start.split(':');
  const [closeHour, closeMin] = dayConfig.end.split(':');
  const [appHour, appMin] = time.split(':');
  
  return time >= dayConfig.start && time <= dayConfig.end;
}
```

---

## 3. Configurações de Negócio

Definições económicas e operacionais:

```javascript
const business = require('./config/clinic').business;

// Moeda em faturas
console.log(business.currency);        // "EUR"
console.log(business.currencySymbol);  // "€"

// Formatação de datas
const formatter = new Intl.DateTimeFormat('pt-PT', {
  dateStyle: 'short'
});
```

### Usar em Cálculos Financeiros

```javascript
function formatPrice(amount) {
  const business = require('./config/clinic').business;
  return `${amount.toFixed(business.decimalPlaces)} ${business.currencySymbol}`;
}

console.log(formatPrice(150.50)); // "150.50 €"
```

---

## 4. Agendamentos

Regras automáticas para consultas:

```javascript
const appointmentConfig = require('./config/clinic').appointment;

// Duração padrão
console.log(appointmentConfig.defaultDuration);      // 30 minutos

// Limite de agendamento antecipado
console.log(appointmentConfig.maxBookingDaysAhead);  // 90 dias

// Prazo de cancelamento
console.log(appointmentConfig.cancellationDeadline); // 24 horas
```

### Bloquear Agendamentos Fora do Prazo

```javascript
function canCancelAppointment(appointmentDate) {
  const config = require('./config/clinic').appointment;
  const now = new Date();
  const diffHours = (appointmentDate - now) / (1000 * 60 * 60);
  
  return diffHours >= config.cancellationDeadline;
}
```

---

## 5. Faturação

Configuração de documentos fiscais:

```javascript
const billing = require('./config/clinic').billing;

// Prefixo e sequência
console.log(billing.invoicePrefix);      // "INV"
console.log(billing.invoiceStartNumber); // 1001

// Termos de pagamento
console.log(billing.paymentTerms);       // 30 dias (NET-30)
```

### Gerar Número de Fatura

```javascript
function generateInvoiceNumber(sequenceNumber) {
  const billing = require('./config/clinic').billing;
  const year = new Date().getFullYear();
  return `${billing.invoicePrefix}/${year}/${sequenceNumber}`;
}

console.log(generateInvoiceNumber(1)); // "INV/2024/1"
```

### Calcular Data de Vencimento

```javascript
function calculateDueDate(invoiceDate) {
  const billing = require('./config/clinic').billing;
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + billing.paymentTerms);
  return dueDate;
}
```

---

## 6. Métodos de Pagamento

Opções aceites na clínica:

```javascript
const paymentMethods = require('./config/clinic').paymentMethods;

// Listar métodos ativos
Object.entries(paymentMethods)
  .filter(([_, config]) => config.enabled)
  .forEach(([key, config]) => {
    console.log(`${key}: ${config.name}`);
  });

// Resultado:
// cash: Dinheiro
// card: Cartão
// transfer: Transferência
```

---

## 7. Segurança

Políticas de senhas e sessões:

```javascript
const security = require('./config/clinic').security;

// Validar força de senha
function validatePassword(password) {
  const sec = security;
  
  if (password.length < sec.passwordMinLength) {
    return false; // Too short
  }
  
  if (sec.passwordRequireSpecialChars && !/[!@#$%^&*]/.test(password)) {
    return false; // Missing special chars
  }
  
  if (sec.passwordRequireNumbers && !/[0-9]/.test(password)) {
    return false; // Missing numbers
  }
  
  return true;
}
```

### Lockout Automático

```javascript
const security = require('./config/clinic').security;

let loginAttempts = 0;
let lockoutUntil = null;

function handleFailedLogin() {
  loginAttempts++;
  
  if (loginAttempts >= security.maxLoginAttempts) {
    lockoutUntil = new Date(Date.now() + security.lockoutDuration * 1000);
    console.log(`Conta bloqueada até ${lockoutUntil}`);
    loginAttempts = 0;
  }
}
```

---

## 8. Categorias de Procedimentos

Especialidades e tipos de procedimentos:

```javascript
const categories = require('./config/clinic').procedureCategories;

// Listar todas
categories.forEach(cat => {
  console.log(`${cat.id} - ${cat.name}: ${cat.description}`);
});

// Resultado:
// 1 - Higiene e Profilaxia: Limpeza e higiene dentária
// 2 - Restauração: Restaurações dentárias
// ...
```

### Usar em Seletor Frontend

```javascript
// Em React
import { procedureCategories } from '../config/clinic';

<select>
  {procedureCategories.map(cat => (
    <option key={cat.id} value={cat.id}>
      {cat.name}
    </option>
  ))}
</select>
```

---

## 9. Papéis e Permissões

Sistema de controlo de acesso:

```javascript
const userRoles = require('./config/clinic').userRoles;

// Verificar permissão
function hasPermission(userRole, requiredPermission) {
  const role = userRoles[userRole];
  return role && role.permissions.includes(requiredPermission);
}

// Exemplos
hasPermission('ADMIN', 'manage_users');        // true
hasPermission('DENTIST', 'manage_users');      // false
hasPermission('DENTIST', 'view_patients');     // true
```

### Middleware de Autorização

```javascript
function authorize(...requiredPermissions) {
  return (req, res, next) => {
    const userRole = req.user.role;
    const roles = require('./config/clinic').userRoles;
    const userRoleConfig = roles[userRole];
    
    const hasPermission = requiredPermissions.every(perm =>
      userRoleConfig.permissions.includes(perm)
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    next();
  };
}

// Usar em rotas
router.delete('/invoices/:id', authorize('manage_financial'), deleteInvoice);
```

---

## 10. Notificações por Email

Configurar envios automáticos:

```javascript
const notifications = require('./config/clinic').notifications;

// Lembrete de consulta
if (notifications.appointmentReminder.enabled) {
  console.log(
    `Enviar lembrete ${notifications.appointmentReminder.hoursBeforeAppointment}h antes`
  );
}

// Confirmação de fatura
if (notifications.invoiceNotification.enabled) {
  console.log('Enviar confirmação ao emitir fatura');
}
```

---

## 11. Personalizar Definições

### Durante o Desenvolvimento

Editar diretamente `config/clinic.js`:

```javascript
module.exports = {
  clinic: {
    name: 'Sua Clínica',
    email: 'seu-email@clinica.pt',
    // ...
  },
  // ...
};
```

### Em Produção

Usar variáveis de ambiente (recomendado):

```bash
# .env
CLINIC_EMAIL=seu-email@clinica.pt
CLINIC_PHONE=+351 XXX XXX XXX
CLINIC_WEBSITE=https://clinica.pt
```

```javascript
// config/clinic.js
module.exports = {
  clinic: {
    email: process.env.CLINIC_EMAIL || 'contato@meclinic.pt',
    phone: process.env.CLINIC_PHONE || '+351 XXX XXX XXX',
    // ...
  },
};
```

---

## 12. Exemplos de Casos de Uso

### Exemplo 1: Sistema de Agendamento

```javascript
const clinic = require('./config/clinic');

async function bookAppointment(patientId, requestedDateTime) {
  const appointment = clinic.appointment;
  
  // Validar limite de dias
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + appointment.maxBookingDaysAhead);
  
  if (requestedDateTime > maxDate) {
    throw new Error('Data fora do prazo de agendamento');
  }
  
  // Ajustar para duração padrão
  const endDateTime = new Date(requestedDateTime);
  endDateTime.setMinutes(endDateTime.getMinutes() + appointment.defaultDuration);
  
  return { start: requestedDateTime, end: endDateTime };
}
```

### Exemplo 2: Validação de Fatura

```javascript
const clinic = require('./config/clinic');

function calculateInvoiceTotals(items) {
  const billing = clinic.billing;
  
  let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let discount = 0;
  if (paymentMethod === 'cash') {
    discount = subtotal * billing.discountForCash;
  }
  
  const total = subtotal - discount;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + billing.paymentTerms);
  
  return { subtotal, discount, total, dueDate };
}
```

### Exemplo 3: Controlo de Acesso

```javascript
const clinic = require('./config/clinic');

function canAccessPatientRecords(userRole) {
  const allPermissions = clinic.userRoles[userRole].permissions;
  return allPermissions.includes('view_patients');
}

function canEditPatientInfo(userRole) {
  const hasPermission = clinic.userRoles[userRole].permissions
    .includes('manage_patients');
  return userRole === 'ADMIN' || hasPermission;
}
```

---

## Referência Rápida

| Propriedade | Tipo | Exemplo | Uso |
|------------|------|---------|-----|
| `clinic.name` | String | "MeClinic" | Documentos, emails |
| `clinic.email` | String | "contato@meclinic.pt" | Contacto |
| `schedule[day]` | Object | { start: "09:00", end: "19:00" } | Validação agendamento |
| `appointment.defaultDuration` | Number | 30 | Duração consulta |
| `appointment.maxBookingDaysAhead` | Number | 90 | Limite antecipado |
| `billing.invoicePrefix` | String | "INV" | Numeração fatura |
| `billing.paymentTerms` | Number | 30 | Dias pagamento |
| `userRoles[role].permissions` | Array | ["view_patients", ...] | Autorização |
| `paymentMethods[method].enabled` | Boolean | true | Disponibilidade pagamento |

---

**Versão:** 1.0  
**Última Atualização:** 2024
