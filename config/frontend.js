/**
 * Configuração da Aplicação Frontend - MeClinic
 * Definições da interface e comportamento do cliente React
 */

// Ambiente
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Configurações de UI
const UI_CONFIG = {
  // Temas
  theme: {
    primary: '#0066cc',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
  },

  // Paleta de cores específica da clínica
  clinic: {
    primary: '#007bff', // Azul corporativo
    accent: '#ff6b6b', // Cor de destaque
    neutral: '#f5f5f5', // Fundo neutro
  },

  // Componentes
  components: {
    datePickerFormat: 'DD/MM/YYYY',
    timePickerFormat: 'HH:mm',
    currencyFormat: 'EUR',
    decimalPlaces: 2,
  },

  // Animações
  animations: {
    enabled: true,
    duration: 300, // ms
    easing: 'ease-in-out',
  },

  // Responsive Breakpoints (Bootstrap-like)
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
  },
};

// Configurações de Paginação Frontend
const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
  defaultSortField: 'createdAt',
  defaultSortOrder: 'descending',
};

// Configurações de Tabelas
const TABLE_CONFIG = {
  rowsPerPageOptions: [5, 10, 20, 50],
  defaultRowsPerPage: 10,
  stripedRows: true,
  hoverable: true,
  densityOptions: ['compact', 'standard', 'comfortable'],
  defaultDensity: 'standard',
};

// Configurações de Formulários
const FORM_CONFIG = {
  submitButtonText: 'Guardar',
  cancelButtonText: 'Cancelar',
  confirmDeleteMessage: 'Tem a certeza que deseja eliminar?',
  showValidationOnBlur: true,
  showValidationOnChange: false,
  validateOnSubmit: true,
};

// Configurações de Notificações
const NOTIFICATION_CONFIG = {
  position: 'top-right',
  autoCloseDuration: 5000, // 5 segundos
  defaultType: 'info',
  maxNotifications: 5,
  // Tipos de notificação
  types: {
    success: {
      icon: 'check-circle',
      color: '#28a745',
    },
    error: {
      icon: 'alert-circle',
      color: '#dc3545',
    },
    warning: {
      icon: 'alert-triangle',
      color: '#ffc107',
    },
    info: {
      icon: 'info',
      color: '#17a2b8',
    },
  },
};

// Configurações de Modal
const MODAL_CONFIG = {
  backdropClosable: false,
  showCloseButton: true,
  animationDuration: 300,
  maxWidth: '600px',
};

// Configurações de Dashboard
const DASHBOARD_CONFIG = {
  refreshInterval: 30000, // 30 segundos
  chartsType: 'line', // 'line', 'bar', 'pie', 'area'
  defaultMetrics: [
    'total_patients',
    'appointments_today',
    'revenue_month',
    'pending_invoices',
  ],
  widgetLayout: 'grid',
};

// Configurações de Agenda/Calendário
const CALENDAR_CONFIG = {
  view: 'week', // 'day', 'week', 'month'
  workWeekStart: 'Monday',
  workWeekEnd: 'Friday',
  workHoursStart: 9, // 09:00
  workHoursEnd: 19, // 19:00
  slotDuration: 30, // minutos
  showWeekends: false,
};

// Configurações de Autenticação Frontend
const AUTH_CONFIG = {
  tokenKey: 'meclinic_token',
  refreshTokenKey: 'meclinic_refresh_token',
  userKey: 'meclinic_user',
  rememberMeKey: 'meclinic_remember_me',
  sessionTimeoutMinutes: 60,
  warningBeforeLogoutMinutes: 5,
};

// Configurações de Armazenamento Local
const STORAGE_CONFIG = {
  enableLocalStorage: true,
  enableSessionStorage: true,
  enableIndexedDB: true,
  cacheExpiration: 86400000, // 24 horas em ms
  allowedStorageKeys: [
    'meclinic_token',
    'meclinic_user',
    'meclinic_preferences',
    'meclinic_cache',
  ],
};

// Rotas da Aplicação
const APP_ROUTES = {
  PUBLIC: {
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    REGISTER: '/register',
  },
  PRIVATE: {
    DASHBOARD: '/dashboard',
    PATIENTS: '/patients',
    PATIENTS_CREATE: '/patients/new',
    PATIENTS_EDIT: '/patients/:id/edit',
    APPOINTMENTS: '/appointments',
    APPOINTMENTS_CREATE: '/appointments/new',
    APPOINTMENTS_EDIT: '/appointments/:id/edit',
    PROCEDURES: '/procedures',
    INVOICES: '/invoices',
    REPORTS: '/reports',
    SETTINGS: '/settings',
    USERS: '/users',
    PROFILE: '/profile',
    TECHNICAL_SHEETS: '/technical-sheets',
    PRODUCTS: '/products',
  },
  ADMIN: {
    CLINIC_SETTINGS: '/admin/clinic-settings',
    USER_MANAGEMENT: '/admin/users',
    SYSTEM_LOGS: '/admin/logs',
    BACKUP: '/admin/backup',
  },
};

// Politicas de Retenção de Dados
const DATA_RETENTION = {
  LOGS: 90, // dias
  DELETED_PATIENTS: 365, // dias
  DELETED_INVOICES: 2555, // 7 anos por lei fiscal
  SESSION_DATA: 30, // dias
  ACTIVITY_LOG: 365, // dias
};

// Integrações Externas
const INTEGRATIONS = {
  // Google API (se usar calendário, mapas, etc)
  GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY,

  // Email
  EMAIL_SERVICE: process.env.REACT_APP_EMAIL_SERVICE || 'mailtrap',
  EMAIL_FROM: process.env.REACT_APP_EMAIL_FROM || 'noreply@meclinic.pt',

  // SMS (se usar notificações SMS)
  SMS_PROVIDER: process.env.REACT_APP_SMS_PROVIDER,

  // Pagamentos
  PAYMENT_GATEWAY: process.env.REACT_APP_PAYMENT_GATEWAY,
  STRIPE_PUBLIC_KEY: process.env.REACT_APP_STRIPE_PUBLIC_KEY,
  PAYPAL_CLIENT_ID: process.env.REACT_APP_PAYPAL_CLIENT_ID,

  // Analytics
  GOOGLE_ANALYTICS_ID: process.env.REACT_APP_GOOGLE_ANALYTICS_ID,
  SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
};

// Configurações de Desenvolvimento
const DEV_CONFIG = {
  enableRequestLogger: ENVIRONMENT === 'development',
  enableNetworkLogger: ENVIRONMENT === 'development',
  enableConsoleLogging: ENVIRONMENT === 'development',
  enableReactDevTools: ENVIRONMENT === 'development',
  enableApiResponseLogging: ENVIRONMENT === 'development',
};

module.exports = {
  API_BASE_URL,
  ENVIRONMENT,
  UI_CONFIG,
  PAGINATION_CONFIG,
  TABLE_CONFIG,
  FORM_CONFIG,
  NOTIFICATION_CONFIG,
  MODAL_CONFIG,
  DASHBOARD_CONFIG,
  CALENDAR_CONFIG,
  AUTH_CONFIG,
  STORAGE_CONFIG,
  APP_ROUTES,
  DATA_RETENTION,
  INTEGRATIONS,
  DEV_CONFIG,
};
