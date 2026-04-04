/**
 * Configuração Profissional da Clínica - MeClinic
 * Informações e definições específicas da clínica dental
 *
 * @version 2.0
 * @updated 2024
 */

module.exports = {
  // ============================================
  // INFORMAÇÕES CORPORATIVAS DA CLÍNICA
  // ============================================
  clinic: {
    // Dados Básicos
    name: 'MeClinic',
    fullName: 'MeClinic - Clínica Dentária Profissional',
    tagline: 'Saúde Oral, Excelência em Tratamento',
    description: 'Clínica dentária de referência com tecnologia avançada e profissionais qualificados',

    // Contactos Profissionais
    email: process.env.CLINIC_EMAIL || 'contato@meclinic.pt',
    emailSupport: process.env.CLINIC_EMAIL_SUPPORT || 'suporte@meclinic.pt',
    phone: process.env.CLINIC_PHONE || '+351 XXX XXX XXX',
    phoneAlternative: process.env.CLINIC_PHONE_ALT || '',
    fax: process.env.CLINIC_FAX || '',
    website: process.env.CLINIC_WEBSITE || 'www.meclinic.pt',

    // Localização Completa
    address: {
      street: process.env.CLINIC_STREET || 'Rua Principal',
      number: process.env.CLINIC_NUMBER || '123',
      complement: process.env.CLINIC_COMPLEMENT || '',
      city: process.env.CLINIC_CITY || 'Lisboa',
      district: process.env.CLINIC_DISTRICT || '',
      postalCode: process.env.CLINIC_POSTAL_CODE || '1000-000',
      country: 'Portugal',
      coordinates: {
        latitude: parseFloat(process.env.CLINIC_LAT) || 38.7223,
        longitude: parseFloat(process.env.CLINIC_LNG) || -9.1393,
      },
    },

    // Identificação Legal
    taxId: process.env.CLINIC_TAX_ID || '',
    companyNumber: process.env.CLINIC_COMPANY_NUMBER || '',
    legalRepresentative: process.env.CLINIC_LEGAL_REP || '',
    legalForm: 'Sociedade Unipessoal por Quotas',
    foundedYear: parseInt(process.env.CLINIC_FOUNDED_YEAR) || 2024,

    // Certificações e Licenças
    licenses: {
      minSaudeNumber: process.env.CLINIC_MIN_SAUDE_NUMBER || '',
      healthLicenseExpiry: process.env.CLINIC_LICENSE_EXPIRY || '',
      isosCertifications: ['ISO 9001:2015', 'ISO 27001:2013'],
      accreditations: [],
    },

    // Dados Bancários
    banking: {
      accountHolder: process.env.CLINIC_BANK_HOLDER || 'MeClinic - Clínica Dentária',
      bankName: process.env.CLINIC_BANK_NAME || 'Banco Nacional',
      iban: process.env.CLINIC_IBAN || 'PT50XXXX0000XX0000XXX00',
      swift: process.env.CLINIC_SWIFT || 'BXXXXXPT',
    },

    // Logo e Branding
    branding: {
      logoUrl: process.env.CLINIC_LOGO_URL || '/assets/logo.png',
      logoSmallUrl: process.env.CLINIC_LOGO_SMALL || '/assets/logo-small.png',
      favicon: '/assets/favicon.ico',
      brandColor: '#0066cc',
      accentColor: '#ff6b6b',
    },
  },

  // ============================================
  // HORÁRIO OPERACIONAL
  // ============================================
  schedule: {
    monday: {
      closed: false,
      start: '09:00',
      end: '19:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      notes: 'Horário normal',
    },
    tuesday: {
      closed: false,
      start: '09:00',
      end: '19:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      notes: 'Horário normal',
    },
    wednesday: {
      closed: false,
      start: '09:00',
      end: '19:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      notes: 'Horário normal',
    },
    thursday: {
      closed: false,
      start: '09:00',
      end: '19:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      notes: 'Horário normal',
    },
    friday: {
      closed: false,
      start: '09:00',
      end: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      notes: 'Encerramento mais cedo',
    },
    saturday: {
      closed: false,
      start: '09:00',
      end: '13:00',
      breakStart: null,
      breakEnd: null,
      notes: 'Horário reduzido',
    },
    sunday: {
      closed: true,
      notes: 'Encerrado ao domingo',
    },
  },

  holidays: [
    { date: '01-01', name: 'Ano Novo' },
    { date: '04-25', name: 'Dia da Liberdade' },
    { date: '05-01', name: 'Dia do Trabalhador' },
    { date: '08-15', name: 'Assunção de Nossa Senhora' },
    { date: '10-05', name: 'Proclamação da República' },
    { date: '11-01', name: 'Dia de Todos os Santos' },
    { date: '12-01', name: 'Restauração da Independência' },
    { date: '12-25', name: 'Natal' },
  ],

  // ============================================
  // CONFIGURAÇÕES DE NEGÓCIO
  // ============================================
  business: {
    currency: 'EUR',
    currencySymbol: '€',
    currencyLocale: 'pt-PT',
    decimals: 2,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    language: 'pt-PT',
    timezone: 'Europe/Lisbon',
    locale: 'pt_PT',
  },

  // ============================================
  // POL ÍTICAS DE AGENDAMENTO
  // ============================================
  appointment: {
    defaultDuration: 30,
    minInterval: 10,
    maxBookingDaysAhead: 90,
    cancellationDeadline: 24,
    noShowPenalty: 0.10,
  },

  // ============================================
  // FATURAÇÃO
  // ============================================
  billing: {
    invoicePrefix: 'INV',
    invoiceStartNumber: 1001,
    paymentTerms: 30,
    latePaymentFee: 0.02,
    discountForCash: 0.05,
    taxRate: 0.23,
  },

  // ============================================
  // MÉTODOS DE PAGAMENTO
  // ============================================
  paymentMethods: {
    cash: { id: 'cash', name: 'Dinheiro', enabled: true, fees: 0 },
    card: { id: 'card', name: 'Cartão', enabled: true, fees: 0.029 },
    transfer: { id: 'transfer', name: 'Transferência', enabled: true, fees: 0 },
    check: { id: 'check', name: 'Cheque', enabled: false, fees: 0 },
  },

  // ============================================
  // SEGURANÇA
  // ============================================
  security: {
    passwordMinLength: 12,
    passwordMaxLength: 50,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    lockoutDuration: 900,
    mfaRequired: true,
  },

  // ============================================
  // NOTIFICAÇÕES
  // ============================================
  notifications: {
    appointmentReminder: {
      enabled: true,
      hoursBeforeAppointment: 24,
      channels: ['email', 'sms'],
    },
    invoiceNotification: {
      enabled: true,
      channels: ['email'],
    },
    paymentReminder: {
      enabled: true,
      daysBeforeDue: 3,
      channels: ['email'],
    },
  },

  // ============================================
  // RELATÓRIOS
  // ============================================
  reports: {
    defaultFormat: 'pdf',
    fiscalYearStart: 'January',
  },

  // ============================================
  // CONFORMIDADE
  // ============================================
  compliance: {
    gdprCompliant: true,
    dataRetentionDays: 365,
    enableEncryption: true,
  },

  // ============================================
  // CATEGORIAS DE PROCEDIMENTOS
  // ============================================
  procedureCategories: [
    {
      id: 1,
      name: 'Higiene e Profilaxia',
      description: 'Limpeza e higiene dentária profissional',
      complexity: 'baixa',
      duration: 45,
    },
    {
      id: 2,
      name: 'Restauração Dentária',
      description: 'Restaurações com resinas e compósitos',
      complexity: 'média',
      duration: 60,
    },
    {
      id: 3,
      name: 'Endodontia',
      description: 'Tratamento de canal',
      complexity: 'alta',
      duration: 90,
    },
    {
      id: 4,
      name: 'Periodontia',
      description: 'Tratamento de gengivas',
      complexity: 'média',
      duration: 60,
    },
    {
      id: 5,
      name: 'Implantologia',
      description: 'Implantes dentários',
      complexity: 'muito_alta',
      duration: 120,
    },
    {
      id: 6,
      name: 'Prótese Dentária',
      description: 'Próteses removíveis e fixas',
      complexity: 'média',
      duration: 45,
    },
    {
      id: 7,
      name: 'Ortodontia',
      description: 'Correção de alinhamento',
      complexity: 'média',
      duration: 45,
    },
    {
      id: 8,
      name: 'Estética Dentária',
      description: 'Tratamentos cosméticos',
      complexity: 'média',
      duration: 60,
    },
  ],

  // ============================================
  // PAPÉIS E PERMISSÕES
  // ============================================
  userRoles: {
    SUPER_ADMIN: {
      id: 'super_admin',
      name: 'Super Administrador',
      level: 5,
      permissions: [
        'manage_users',
        'manage_system',
        'view_all_reports',
        'manage_financial',
        'manage_clinic_settings',
      ],
    },
    ADMIN: {
      id: 'admin',
      name: 'Administrador',
      level: 4,
      permissions: [
        'manage_users',
        'manage_clinic_settings',
        'view_reports',
        'manage_financial',
        'manage_patients',
        'manage_appointments',
      ],
    },
    DENTIST: {
      id: 'dentist',
      name: 'Médico Dentista',
      level: 3,
      permissions: [
        'view_patients',
        'create_appointments',
        'create_procedures',
        'view_patient_history',
        'create_invoices',
      ],
    },
    RECEPTIONIST: {
      id: 'receptionist',
      name: 'Recepcionista',
      level: 1,
      permissions: [
        'view_patients',
        'create_appointments',
        'manage_appointments',
        'create_invoices',
      ],
    },
  },
};
