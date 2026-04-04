# Definições Profissionais da Clínica - Documentação Completa

## Índice
1. [Visão Geral](#visão-geral)
2. [Informações Corporativas](#informações-corporativas)
3. [Operações e Horários](#operações-e-horários)
4. [Agendamentos e Consultas](#agendamentos-e-consultas)
5. [Faturação e Pagamentos](#faturação-e-pagamentos)
6. [Segurança e Conformidade](#segurança-e-conformidade)
7. [Notificações e Comunicação](#notificações-e-comunicação)
8. [Papéis e Permissões](#papéis-e-permissões)
9. [Procedimentos e Categorias](#procedimentos-e-categorias)
10. [API de Definições](#api-de-definições)

---

## Visão Geral

O sistema de definições da MeClinic permite uma configuração profissional e completa de todos os aspectos operacionais da clínica dentária. Todas as definições são centralizadas, validadas e acessíveis via API segura.

### Ficheiros Principais

| Ficheiro | Objetivo |
|----------|----------|
| `config/clinic.js` | Configurações operacionais e de negócio |
| `config/constants.js` | Enumerações e constantes da aplicação |
| `config/frontend.js` | Configurações específicas do cliente React |
| `config/validation.js` | Validação de integridade das definições |
| `controllers/settingsController.js` | Controller para gerenciar definições |
| `routes/settings.routes.js` | Rotas da API de definições |

---

## Informações Corporativas

### Dados Básicos
```javascript
const { clinic } = require('./config/clinic');

console.log(clinic.name);           // "MeClinic"
console.log(clinic.fullName);       // "MeClinic - Clínica Dentária Profissional"
console.log(clinic.tagline);        // "Saúde Oral, Excelência em Tratamento"
console.log(clinic.description);    // Descrição completa
```

### Contactos Profissionais
```javascript
// Email
clinic.email;              // contato@meclinic.pt (geral)
clinic.emailSupport;       // suporte@meclinic.pt (suporte)

// Telefone
clinic.phone;              // +351 XXX XXX XXX
clinic.phoneAlternative;   // Número alternativo
clinic.fax;                // Fax (se disponível)

// Web
clinic.website;            // www.meclinic.pt
```

### Localização e Georreferenciação
```javascript
const { address, coordinates } = clinic;

// Endereço Completo
address.street;            // "Rua Principal"
address.number;            // "123"
address.complement;        // Complemento (apto, loja, etc)
address.city;              // "Lisboa"
address.district;          // Distrito (opcional)
address.postalCode;        // "1000-000"
address.country;           // "Portugal"

// GPS
coordinates.latitude;      // 38.7223
coordinates.longitude;     // -9.1393
```

### Identificação Legal
```javascript
clinic.taxId;              // NIF (9 dígitos)
clinic.companyNumber;      // NIPC/Pessoa Coletiva
clinic.legalRepresentative;// Nome do representante
clinic.legalForm;          // Forma jurídica
clinic.foundedYear;        // Ano de fundação
```

### Certificações e Licenças
```javascript
// Licenças de Saúde
licenses.minSaudeNumber;   // Número de registo Ministério Saúde
licenses.healthLicenseExpiry; // Data de validade

// Certificações ISO
licenses.isosCertifications; // ISO 9001:2015, ISO 27001:2013

// Acreditações Profissionais
licenses.accreditations;   // Acreditações específicas
```

### Branding e Identidade Visual
```javascript
branding.logoUrl;          // URL da logo completa
branding.logoSmallUrl;     // Logo reduzida
branding.favicon;          // Favicon
branding.brandColor;       // Cor corporativa #0066cc
branding.accentColor;      // Cor de destaque #ff6b6b
```

---

## Operações e Horários

### Estrutura de Horário Diário
```javascript
const schedule = require('./config/clinic').schedule;

// Exemplo: Segunda-feira
schedule.monday = {
  closed: false,           // Aberto/Fechado
  start: '09:00',          // Hora de abertura
  end: '19:00',            // Hora de encerramento
  breakStart: '13:00',     // Hora início pausa
  breakEnd: '14:00',       // Hora fim pausa
  notes: 'Horário normal'  // Notas adicionais
};
```

### Dias Especiais e Feriados
```javascript
// Feriados Automáticos
holidays: [
  { date: '01-01', name: 'Ano Novo' },
  { date: '04-25', name: 'Dia da Liberdade' },
  { date: '05-01', name: 'Dia do Trabalhador' },
  // ... mais feriados
]

// Períodos Especiais (Férias, Encerramento)
closures: [
  {
    startDate: '2024-08-01',
    endDate: '2024-08-31',
    reason: 'Férias de Verão'
  }
]
```

### Validação de Horário
```javascript
const { ClinicConfigValidator } = require('./config/validation');

// Validar integridade do horário
const errors = ClinicConfigValidator.validateScheduleHours(schedule);
// Verifica se start < end, se pausas são válidas, etc.
```

---

## Agendamentos e Consultas

### Políticas de Agendamento
```javascript
const { appointment } = require('./config/clinic');

// Duração padrão
appointment.defaultDuration;           // 30 minutos
appointment.minInterval;               // 10 min entre consultas
appointment.maxConcurrentAppointments; // 1 consulta simultânea
appointment.bufferTimeBetweenAppointments; // 5 min pausa

// Limites de Agendamento
appointment.maxBookingDaysAhead;       // 90 dias de antecipação máxima
appointment.minBookingHoursBefore;     // 24 horas mínimas antes
appointment.maxAppointmentsPerDay;     // 1 por paciente/dia
appointment.maxAppointmentsPerWeek;    // 2 por paciente/semana

// Cancelamentos
appointment.cancellationDeadline;      // 24 horas antes para cancelar
appointment.allowCancellationSameDay;  // false = não permite no mesmo dia
appointment.noShowPenalty;             // 10% da tarifa como penalidade

// Confirmação
appointment.autoConfirmation;          // true = confirmar automaticamente
appointment.confirmationDeadlineHours; // 24 horas para confirmar
appointment.reminderHoursBefore;       // 24 horas antes do lembrete
```

### Transições de Estado Válidas
```javascript
// Estados possíveis e transições permitidas
allowedStatusTransitions: {
  'scheduled':   ['confirmed', 'cancelled', 'rescheduled'],
  'confirmed':   ['in_progress', 'cancelled', 'rescheduled'],
  'in_progress': ['completed', 'cancelled'],
  'completed':   ['rescheduled'],
  'cancelled':   ['rescheduled'],
  'no_show':     ['rescheduled']
}
```

---

## Faturação e Pagamentos

### Política de Faturação
```javascript
const { billing } = require('./config/clinic');

// Documentos
billing.invoicePrefix;       // "INV"
billing.invoiceStartNumber;  // 1001
billing.invoiceSequence;     // 'yearly' ou 'continuous'

// Termos
billing.paymentTerms;        // 30 dias (NET-30)
billing.latePaymentFee;      // 2% ao mês após vencimento
billing.earlyPaymentDiscount;// 2% se pago 10 dias antes
billing.discountForCash;     // 5% desconto para pagamento imediato

// Impostos
billing.taxRate;             // 23% (IVA)
billing.taxNumber;           // NIF para faturação
```

### Métodos de Pagamento Disponíveis
```javascript
const { paymentMethods } = require('./config/clinic');

// Dinheiro
paymentMethods.cash: {
  name: 'Dinheiro',
  enabled: true,
  instantPayment: true,
  fees: 0  // Sem taxa
}

// Cartão
paymentMethods.card: {
  name: 'Cartão de Crédito/Débito',
  enabled: true,
  fees: 0.029  // 2.9% de taxa
  providers: ['stripe', 'square']
}

// Transferência
paymentMethods.transfer: {
  name: 'Transferência Bancária',
  enabled: true,
  requiresReference: true,
  referenceFormat: 'INVOICE_NUMBER'
}
```

### Política de Crédito e Cobrança
```javascript
const { receivables } = require('./config/clinic');

// Crédito
receivables.creditLimitPerPatient;    // 5000€
receivables.allowCredit;              // true
receivables.requireAdvancePayment;    // false

// Cobrança
receivables.allowReminders;           // true
receivables.reminderDaysBefore;       // 3 dias antes do vencimento
receivables.maxReminders;             // 5 lembretes máximo
receivables.suspendServicesOnOverdue; // Suspender após 30 dias
```

---

## Segurança e Conformidade

### Política de Senhas
```javascript
const { security } = require('./config/clinic');

// Requisitos
security.passwordMinLength;            // 12 caracteres
security.passwordRequireUppercase;     // A-Z obrigatório
security.passwordRequireLowercase;     // a-z obrigatório
security.passwordRequireNumbers;       // 0-9 obrigatório
security.passwordRequireSpecialChars;  // !@#$%^&*() obrigatório

// Política de Expiração
security.passwordExpiryDays;           // 90 dias
security.passwordHistoryCount;         // Não repetir últimas 5
```

### Autenticação Multifator (MFA)
```javascript
// MFA Obrigatório
security.mfaRequired;                  // true
security.mfaRequiredForAdmin;          // true
security.mfaMethods;                   // ['totp', 'sms', 'email']
security.mfaGracePeriodDays;           // 7 dias para configurar
```

### Sesões e Timeout
```javascript
// Timeout
security.sessionTimeout;               // 3600 segundos (1 hora)
security.sessionWarningMinutes;        // Avisar 5 min antes

// Bloqueio de Acesso
security.maxLoginAttempts;             // 5 tentativas
security.lockoutDuration;              // 900 seg (15 min)
security.lockoutEscalation;            // true = aumentar duração
```

### GDPR e Conformidade Legal
```javascript
const { compliance } = require('./config/clinic');

// GDPR
compliance.gdprCompliant;              // true
compliance.gdprContactEmail;
compliance.dataProcessingAgreement;    // true
compliance.privacyPolicyUrl;           // /privacy-policy
compliance.termsOfServiceUrl;          // /terms-of-service

// Lei NIS (Necessitador)
compliance.nisCompliant;               // true
compliance.dataBackupFrequency;        // 'daily'
compliance.disasterRecoveryPlan;       // true

// Healthcare
compliance.healthDataEncryption;       // true
compliance.patientDataAnonymization;   // true
compliance.dataRetentionPolicy;        // '365 days'
compliance.rightToBeForgettenImplemented; // true
```

---

## Notificações e Comunicação

### Canais de Notificação
```javascript
const { notifications } = require('./config/clinic');

// Canais Disponíveis
notifications.channels: {
  email: {
    enabled: true,
    provider: 'mailtrap',
    from: 'noreply@meclinic.pt'
  },
  sms: {
    enabled: false,
    provider: 'twilio'
  },
  push: {
    enabled: false,
    provider: 'firebase'
  }
}
```

### Tipos de Notificações

#### Consultas
```javascript
// Lembrete
appointmentReminder: {
  enabled: true,
  hoursBeforeAppointment: 24,
  channels: ['email', 'sms'],
  subject: 'Lembrete: Consulta em MeClinic'
}

// Confirmação
appointmentConfirmation: {
  enabled: true,
  channels: ['email'],
  subject: 'Consulta Confirmada - MeClinic'
}

// Cancelamento
appointmentCancellation: {
  enabled: true,
  channels: ['email', 'sms'],
  subject: 'Consulta Cancelada - MeClinic'
}
```

#### Faturação
```javascript
// Nova Fatura
invoiceNotification: {
  enabled: true,
  channels: ['email'],
  includeAttachment: true,
  subject: 'Fatura Emitida - MeClinic'
}

// Lembrete de Pagamento
paymentReminder: {
  enabled: true,
  daysBeforeDue: 3,
  channels: ['email'],
  maxReminders: 3,
  subject: 'Lembrete: Fatura a Vencer'
}
```

---

## Papéis e Permissões

### Sistema RBAC (Role-Based Access Control)

#### Super Administrador
```javascript
userRoles.SUPER_ADMIN: {
  level: 5,
  name: 'Super Administrador',
  permissions: [
    'manage_users',
    'manage_system',
    'system_configuration',
    'manage_backups',
    'manage_audit_logs',
    // ... todas as permissões
  ]
}
```

#### Administrador
```javascript
userRoles.ADMIN: {
  level: 4,
  name: 'Administrador',
  permissions: [
    'manage_users',
    'manage_clinic_settings',
    'view_reports',
    'manage_financial',
    'manage_inventory'
  ]
}
```

#### Médico Dentista
```javascript
userRoles.DENTIST: {
  level: 3,
  name: 'Médico Dentista',
  permissions: [
    'view_patients',
    'create_procedures',
    'manage_own_schedule',
    'create_prescriptions'
  ],
  canView: ['patient_records', 'clinical_notes', 'imaging'],
  canCreate: ['procedures', 'prescriptions'],
  canEdit: ['own_procedures']
}
```

#### Higienista
```javascript
userRoles.HYGIENIST: {
  level: 2,
  name: 'Higienista Dentário',
  permissions: [
    'view_patients',
    'create_hygiene_procedures',
    'record_vital_signs'
  ]
}
```

#### Recepcionista
```javascript
userRoles.RECEPTIONIST: {
  level: 1,
  name: 'Recepcionista',
  permissions: [
    'view_patients',
    'create_appointments',
    'manage_appointments',
    'create_invoices'
  ]
}
```

#### Paciente
```javascript
userRoles.PATIENT: {
  level: 0,
  name: 'Paciente',
  permissions: [
    'view_own_profile',
    'manage_own_appointments',
    'view_own_records'
  ],
  accessLevel: 'self_only'
}
```

---

## Procedimentos e Categorias

### Categorias Disponíveis

| ID | Categoria | Duração | Complexidade |
|----|-----------|---------|-------------|
| 1 | Higiene e Profilaxia | 45 min | Baixa |
| 2 | Diagnóstico e Imaging | 30 min | Baixa |
| 3 | Restauração Dentária | 60 min | Média |
| 4 | Endodontia | 90 min | Alta |
| 5 | Periodontia | 60 min | Média |
| 6 | Oral Surgery | 45 min | Alta |
| 7 | Implantologia | 120 min | Muito Alta |
| 8 | Prótese Dentária | 45 min | Média |
| 9 | Ortodontia | 45 min | Média |
| 10 | Estética Dentária | 60 min | Média |
| 11 | Pediatria Dentária | 30 min | Baixa |
| 12 | Tratamentos Especiais | 45 min | Média |

---

## API de Definições

### Rotas Públicas (Sem Autenticação)

#### Obter Informações Públicas
```http
GET /api/settings/public
```
Retorna: nome, endereço, contactos, branding

#### Horário de Funcionamento
```http
GET /api/settings/operating-hours
```
Retorna: horário completo da semana

#### Status Atual da Clínica
```http
GET /api/settings/clinic-status
```
Retorna: `{ isOpen: boolean, status: string, currentTime: string }`

#### Termos de Pagamento
```http
GET /api/settings/payment-terms
```
Retorna: dias de pagamento, taxas, descontos

### Rotas Autenticadas

#### Definições Gerais
```http
GET /api/settings/clinic
Authorization: Bearer <token>
```
Requer: Admin, Dentist

#### Configurações Financeiras
```http
GET /api/settings/financial
Authorization: Bearer <token>
```
Requer: Admin

#### Configurações de Segurança
```http
GET /api/settings/security
Authorization: Bearer <token>
```
Requer: Super Admin

#### Procedimentos
```http
GET /api/settings/procedures
Authorization: Bearer <token>
```
Requer: Autenticação

#### Papéis e Permissões
```http
GET /api/settings/user-roles
Authorization: Bearer <token>
```
Requer: Admin

#### Validar Configuração
```http
POST /api/settings/validate
Authorization: Bearer <token>
```
Requer: Super Admin

---

## Validação de Definições

### Executar Validação Completa

```javascript
const { ClinicConfigValidator } = require('./config/validation');
const clinicConfig = require('./config/clinic');

const validation = ClinicConfigValidator.validateAllConfigs(clinicConfig);

if (validation.isValid) {
  console.log('✅ Configuração válida');
} else {
  console.log('❌ Erros encontrados:');
  validation.errors.forEach(error => console.log(`  - ${error}`));
}
```

### Validações Efetuadas

- ✅ Hora de início < hora de fim
- ✅ Horas de pausa consistentes
- ✅ Métodos de pagamento ativados corretamente
- ✅ Permissões de papéis válidas
- ✅ Configurações de segurança completas
- ✅ Termos de pagamento consistentes

---

## Exemplos de Uso

### Exemplo 1: Verificar se Clínica Está Aberta
```javascript
const settings = require('./routes/settings.routes');

async function isClinicOpen() {
  const response = await fetch('/api/settings/clinic-status');
  const { data } = await response.json();
  return data.isOpen;
}
```

### Exemplo 2: Obter Permissões de Utilizador
```javascript
function getUserPermissions(userRole) {
  const { userRoles } = require('./config/clinic');
  return userRoles[userRole].permissions;
}

// Uso
const dentistPermissions = getUserPermissions('DENTIST');
```

### Exemplo 3: Calcular Desconto Automático
```javascript
function calculateDiscount(paymentMethod, paymentDaysEarly = 0) {
  const { billing } = require('./config/clinic');
  let discount = 0;

  if (paymentMethod === 'cash') {
    discount += billing.discountForCash;
  }

  if (paymentDaysEarly >= billing.earlyPaymentDays) {
    discount += billing.earlyPaymentDiscount;
  }

  return discount;
}
```

---

## Boas Práticas

1. **Nunca hardcode** valores operacionais - sempre usar as definições
2. **Validar** antes de usar definições críticas
3. **Cache** definições em memória após validação
4. **Auditar** mudanças em definições sensíveis
5. **Documentar** customizações específicas da clínica
6. **Testar** validações ao alterar definições

---

**Versão:** 2.0  
**Última Atualização:** Abril 2024  
**Status:** Pronto para Produção ✅
