/**
 * Validação de Configurações da Clínica - MeClinic
 * Valida integridade e conformidade das definições operacionais
 *
 * @version 1.0
 */

const Joi = require('joi');

/**
 * Esquema de Validação para Informações da Clínica
 */
const clinicInfoSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  fullName: Joi.string().required().min(5).max(200),
  tagline: Joi.string().optional().max(200),
  email: Joi.string().email().required(),
  emailSupport: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+?[0-9]{9,15}$/)
    .required(),
  website: Joi.string().uri().optional(),
  taxId: Joi.string().pattern(/^\d{9}$/).required(),
});

/**
 * Esquema de Validação para Horário
 */
const scheduleSchema = Joi.object({
  monday: validateDaySchedule(),
  tuesday: validateDaySchedule(),
  wednesday: validateDaySchedule(),
  thursday: validateDaySchedule(),
  friday: validateDaySchedule(),
  saturday: validateDaySchedule(),
  sunday: validateDaySchedule(),
});

function validateDaySchedule() {
  return Joi.object({
    closed: Joi.boolean().required(),
    start: Joi.string()
      .when('closed', {
        is: false,
        then: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
        otherwise: Joi.string().optional(),
      }),
    end: Joi.string()
      .when('closed', {
        is: false,
        then: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
        otherwise: Joi.string().optional(),
      }),
    breakStart: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional()
      .allow(null),
    breakEnd: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional()
      .allow(null),
    notes: Joi.string().optional(),
  });
}

/**
 * Esquema de Validação para Agendamentos
 */
const appointmentConfigSchema = Joi.object({
  defaultDuration: Joi.number().min(15).max(180).required(),
  minInterval: Joi.number().min(0).max(60).required(),
  maxBookingDaysAhead: Joi.number().min(1).max(365).required(),
  cancellationDeadline: Joi.number().min(1).max(72).required(),
  noShowPenalty: Joi.number().min(0).max(1).required(),
});

/**
 * Esquema de Validação para Configurações Financeiras
 */
const billingConfigSchema = Joi.object({
  invoicePrefix: Joi.string().min(2).max(10).required(),
  invoiceStartNumber: Joi.number().min(1).required(),
  paymentTerms: Joi.number().min(0).max(120).required(),
  latePaymentFee: Joi.number().min(0).max(0.2).required(),
  discountForCash: Joi.number().min(0).max(0.2).required(),
  taxRate: Joi.number().min(0).max(1).required(),
});

/**
 * Esquema de Validação para Segurança
 */
const securityConfigSchema = Joi.object({
  passwordMinLength: Joi.number().min(8).max(20).required(),
  passwordMaxLength: Joi.number().min(20).max(100).required(),
  passwordRequireUppercase: Joi.boolean().required(),
  passwordRequireLowercase: Joi.boolean().required(),
  passwordRequireNumbers: Joi.boolean().required(),
  passwordRequireSpecialChars: Joi.boolean().required(),
  sessionTimeout: Joi.number().min(300).max(86400).required(),
  maxLoginAttempts: Joi.number().min(1).max(10).required(),
  lockoutDuration: Joi.number().min(60).max(3600).required(),
  mfaRequired: Joi.boolean().optional(),
});

/**
 * Validações Customizadas
 */
class ClinicConfigValidator {
  /**
   * Valida se hora de início é menor que hora de fim
   */
  static validateScheduleHours(schedule) {
    const errors = [];

    Object.entries(schedule).forEach(([day, dayConfig]) => {
      if (!dayConfig.closed && dayConfig.start && dayConfig.end) {
        if (dayConfig.start >= dayConfig.end) {
          errors.push(
            `${day}: Hora de início não pode ser maior ou igual à hora de fim`
          );
        }
      }

      // Validar hora de pausa
      if (
        dayConfig.breakStart &&
        dayConfig.breakEnd &&
        dayConfig.breakStart >= dayConfig.breakEnd
      ) {
        errors.push(
          `${day}: Hora início pausa não pode ser maior que hora fim pausa`
        );
      }
    });

    return errors;
  }

  /**
   * Valida consistência de métodos de pagamento
   */
  static validatePaymentMethods(paymentMethods) {
    const errors = [];

    Object.values(paymentMethods).forEach(method => {
      if (method.enabled && method.requiresReference && !method.referenceFormat) {
        errors.push(
          `Método ${method.name}: referência obrigatória mas formato não definido`
        );
      }

      if (!Number.isFinite(method.fees) || method.fees < 0 || method.fees > 1) {
        errors.push(`Método ${method.name}: taxa de pagamento inválida`);
      }
    });

    return errors;
  }

  /**
   * Valida combinação de permissões por papel
   */
  static validateUserRoles(userRoles) {
    const errors = [];
    const allPermissions = [
      'manage_users',
      'manage_clinic_settings',
      'view_all_reports',
      'manage_financial',
      'manage_patients',
      'manage_appointments',
      'manage_procedures',
      'manage_system',
      'view_patients',
      'create_appointments',
      'view_own_profile',
    ];

    Object.entries(userRoles).forEach(([roleId, roleConfig]) => {
      roleConfig.permissions?.forEach(perm => {
        if (!allPermissions.includes(perm)) {
          errors.push(`Papel ${roleId}: permissão desconhecida "${perm}"`);
        }
      });

      // Super Admin deve ter todas as permissões
      if (roleId === 'SUPER_ADMIN' && roleConfig.permissions.length < 8) {
        errors.push('SUPER_ADMIN: deve ter permissões administrativas suficientes');
      }

      // Patient não deve gerir ninguém
      if (roleId === 'PATIENT' && roleConfig.permissions.includes('manage_users')) {
        errors.push('PATIENT: não pode gerir utilizadores');
      }
    });

    return errors;
  }

  /**
   * Validação completa da configuração
   */
  static validateAllConfigs(clinicConfig) {
    const allErrors = [];

    // Validações de Schema Joi
    try {
      const { error } = clinicInfoSchema.validate(clinicConfig.clinic);
      if (error) {
        allErrors.push(`Informações da clínica: ${error.message}`);
      }
    } catch (e) {
      allErrors.push(`Validação info clínica: ${e.message}`);
    }

    try {
      const { error } = scheduleSchema.validate(clinicConfig.schedule);
      if (error) {
        allErrors.push(`Horário: ${error.message}`);
      }
    } catch (e) {
      allErrors.push(`Validação horário: ${e.message}`);
    }

    // Validações Customizadas
    allErrors.push(...this.validateScheduleHours(clinicConfig.schedule));
    allErrors.push(
      ...this.validatePaymentMethods(clinicConfig.paymentMethods)
    );
    allErrors.push(...this.validateUserRoles(clinicConfig.userRoles));

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

module.exports = {
  clinicInfoSchema,
  scheduleSchema,
  appointmentConfigSchema,
  billingConfigSchema,
  securityConfigSchema,
  ClinicConfigValidator,
};
