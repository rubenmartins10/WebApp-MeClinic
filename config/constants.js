/**
 * Constantes da Aplicação - MeClinic
 * Valores fixos e enumerações usadas em toda a aplicação
 */

// Estados de Consulta
const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled', // Agendada
  CONFIRMED: 'confirmed', // Confirmada
  IN_PROGRESS: 'in_progress', // Em progresso
  COMPLETED: 'completed', // Concluída
  CANCELLED: 'cancelled', // Cancelada
  NO_SHOW: 'no_show', // Falta (não compareceu)
  RESCHEDULED: 'rescheduled', // Remarcada
};

// Estados de Fatura
const INVOICE_STATUS = {
  DRAFT: 'draft', // Rascunho
  ISSUED: 'issued', // Emitida
  SENT: 'sent', // Enviada
  PAID: 'paid', // Paga
  PARTIAL_PAID: 'partial_paid', // Parcialmente paga
  OVERDUE: 'overdue', // Vencida
  CANCELLED: 'cancelled', // Cancelada
  REFUNDED: 'refunded', // Reembolsada
};

// Estados de Paciente
const PATIENT_STATUS = {
  ACTIVE: 'active', // Ativo
  INACTIVE: 'inactive', // Inativo
  ARCHIVED: 'archived', // Arquivado
  SUSPENDED: 'suspended', // Suspenso
};

// Tipos de Identificação
const IDENTIFICATION_TYPES = {
  CC: { code: 'CC', name: 'Cartão de Cidadão' },
  BI: { code: 'BI', name: 'Bilhete de Identidade' },
  PASSPORT: { code: 'PASSPORT', name: 'Passaporte' },
  NIF: { code: 'NIF', name: 'Número de Identificação Fiscal' },
};

// Géneros
const GENDERS = {
  MALE: { code: 'M', name: 'Masculino' },
  FEMALE: { code: 'F', name: 'Feminino' },
  OTHER: { code: 'O', name: 'Outro' },
  PREFER_NOT_TO_SAY: { code: 'N', name: 'Prefiro não dizer' },
};

// Tipos de Contato
const CONTACT_TYPES = {
  PHONE: 'phone', // Telefone
  EMAIL: 'email', // Email
  SMS: 'sms', // SMS
  WHATSAPP: 'whatsapp', // WhatsApp
  POSTAL: 'postal', // Correio
};

// Prioridades de Consulta
const APPOINTMENT_PRIORITY = {
  LOW: { level: 1, name: 'Baixa' },
  NORMAL: { level: 2, name: 'Normal' },
  HIGH: { level: 3, name: 'Alta' },
  URGENT: { level: 4, name: 'Urgente' },
};

// Tipo de Problemas Dentários
const DENTAL_PROBLEMS = {
  CAVITY: 'cárie',
  PLAQUE: 'tártaro',
  INFLAMMATION: 'inflamação',
  BLEEDING: 'sangramento',
  SENSITIVITY: 'sensibilidade',
  MISSING_TOOTH: 'falta de dente',
  MISALIGNMENT: 'desalinhamento',
  DISCOLORATION: 'descoloração',
  CRACK_OR_CHIP: 'rachadura/fratura',
  PERIODONTITIS: 'periodontite',
};

// Cobertura de Seguros Dentários
const INSURANCE_COVERAGE = {
  BASIC: {
    code: 'BASIC',
    name: 'Cobertura Básica',
    coverage: 0.5, // 50%
  },
  STANDARD: {
    code: 'STANDARD',
    name: 'Cobertura Padrão',
    coverage: 0.65, // 65%
  },
  PREMIUM: {
    code: 'PREMIUM',
    name: 'Cobertura Premium',
    coverage: 0.8, // 80%
  },
};

// Códigos de Erro HTTP Personalizados
const ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  PATIENT_NOT_FOUND: 'PATIENT_NOT_FOUND',
  APPOINTMENT_CONFLICT: 'APPOINTMENT_CONFLICT',
  INVALID_APPOINTMENT_STATUS: 'INVALID_APPOINTMENT_STATUS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
};

// Mensagens de Erro Padrão
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Credenciais inválidas.',
  USER_NOT_FOUND: 'Utilizador não encontrado.',
  UNAUTHORIZED: 'Não autorizado. Por favor, faça login.',
  FORBIDDEN: 'Acesso negado.',
  PATIENT_NOT_FOUND: 'Paciente não encontrado.',
  APPOINTMENT_CONFLICT: 'Conflito de horário com outra consulta.',
  INVALID_APPOINTMENT_STATUS: 'Estado de consulta inválido.',
  INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes.',
  DATABASE_ERROR: 'Erro na base de dados. Tente novamente.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  DUPLICATE_ENTRY: 'Entrada duplicada. Esse valor já existe.',
};

// Limites de Validação
const VALIDATION_LIMITS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 50,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_PHONE_LENGTH: 9,
  MAX_PHONE_LENGTH: 20,
  MAX_FILE_SIZE: 10000000, // 10MB em bytes
  MAX_DESCRIPTION_LENGTH: 500,
};

// Formatos Aceites
const ACCEPTED_FORMATS = {
  IMAGES: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
  DOCUMENTS: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
  ARCHIVES: ['zip', 'rar', '7z', 'tar', 'gz'],
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
};

// Cache
const CACHE_DURATION = {
  SHORT: 300, // 5 minutos
  MEDIUM: 1800, // 30 minutos
  LONG: 3600, // 1 hora
  VERY_LONG: 86400, // 1 dia
};

module.exports = {
  APPOINTMENT_STATUS,
  INVOICE_STATUS,
  PATIENT_STATUS,
  IDENTIFICATION_TYPES,
  GENDERS,
  CONTACT_TYPES,
  APPOINTMENT_PRIORITY,
  DENTAL_PROBLEMS,
  INSURANCE_COVERAGE,
  ERROR_CODES,
  ERROR_MESSAGES,
  VALIDATION_LIMITS,
  ACCEPTED_FORMATS,
  PAGINATION,
  CACHE_DURATION,
};
