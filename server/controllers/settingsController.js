/**
 * Controller de Definições da Clínica - MeClinic
 * Gerencia e controla o acesso às definições operacionais da clínica
 *
 * @version 1.0
 */

const clinicConfig = require('../config/clinic');
const constants = require('../config/constants');
const frontendConfig = require('../config/frontend');
const { ClinicConfigValidator } = require('../config/validation');
const pool = require('../db');

/**
 * Obter Definições Gerais da Clínica
 * @access Admin, Dentist
 */
exports.getClinicSettings = (req, res) => {
  try {
    const settings = {
      clinic: {
        name: clinicConfig.clinic.name,
        fullName: clinicConfig.clinic.fullName,
        email: clinicConfig.clinic.email,
        phone: clinicConfig.clinic.phone,
        website: clinicConfig.clinic.website,
        address: clinicConfig.clinic.address,
        branding: clinicConfig.clinic.branding,
      },
      business: clinicConfig.business,
      schedule: clinicConfig.schedule,
      appointment: clinicConfig.appointment,
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Configurações de Faturação
 * @access Admin, Dentist
 */
exports.getFinancialSettings = (req, res) => {
  try {
    const settings = {
      billing: clinicConfig.billing,
      paymentMethods: clinicConfig.paymentMethods,
      receivables: clinicConfig.receivables,
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Configurações de Segurança
 * @access Super Admin Only
 */
exports.getSecuritySettings = (req, res) => {
  try {
    // Apenas super admin pode ver configurações de segurança
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas administradores podem aceder a estas definições.',
      });
    }

    const settings = {
      security: clinicConfig.security,
      compliance: clinicConfig.compliance,
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Configurações de Notificações
 * @access Admin
 */
exports.getNotificationSettings = (req, res) => {
  try {
    const settings = {
      notifications: clinicConfig.notifications,
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Configurações de Relatórios
 * @access Admin
 */
exports.getReportSettings = (req, res) => {
  try {
    const settings = {
      reports: clinicConfig.reports,
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Categorias de Procedimentos
 * @access All authenticated users
 */
exports.getProcedureCategories = (req, res) => {
  try {
    const categories = clinicConfig.procedureCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      subcategories: cat.subcategories,
      complexity: cat.complexity,
      averageDuration: cat.averageDuration,
      icon: cat.icon,
    }));

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Papéis e Permissões de Utilizadores
 * @access Admin
 */
exports.getUserRoles = (req, res) => {
  try {
    const roles = Object.entries(clinicConfig.userRoles).map(([key, role]) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      level: role.level,
      permissions: role.permissions,
      accessLevel: role.accessLevel,
    }));

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Termos de Pagamento
 * @access Reception, Admin
 */
exports.getPaymentTerms = (req, res) => {
  try {
    const terms = {
      paymentDays: clinicConfig.billing.paymentTerms,
      paymentTermsText: clinicConfig.billing.paymentTermsText,
      latePaymentFee: clinicConfig.billing.latePaymentFee,
      earlyPaymentDiscount: clinicConfig.billing.earlyPaymentDiscount,
      earlyPaymentDays: clinicConfig.billing.earlyPaymentDays,
      discountForCash: clinicConfig.billing.discountForCash,
    };

    res.json({
      success: true,
      data: terms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Horário de Funcionamento
 * @access Public
 */
exports.getOperatingHours = (req, res) => {
  try {
    const hours = clinicConfig.schedule;

    res.json({
      success: true,
      data: hours,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Validar Configuração Completa
 * @access Super Admin Only
 */
exports.validateConfiguration = (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Apenas super administrador pode validar configurações.',
      });
    }

    const validation = ClinicConfigValidator.validateAllConfigs(clinicConfig);

    res.json({
      success: validation.isValid,
      data: {
        isValid: validation.isValid,
        errorsCount: validation.errors.length,
        errors: validation.errors,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Informações Públicas da Clínica
 * @access Public
 */
exports.getPublicInfo = (req, res) => {
  try {
    const publicInfo = {
      name: clinicConfig.clinic.name,
      fullName: clinicConfig.clinic.fullName,
      tagline: clinicConfig.clinic.tagline,
      description: clinicConfig.clinic.description,
      email: clinicConfig.clinic.email,
      phone: clinicConfig.clinic.phone,
      website: clinicConfig.clinic.website,
      address: clinicConfig.clinic.address,
      branding: clinicConfig.clinic.branding,
      schedule: clinicConfig.schedule,
      licenses: clinicConfig.clinic.licenses,
    };

    res.json({
      success: true,
      data: publicInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Constantes da Aplicação
 * @access All authenticated users
 */
exports.getApplicationConstants = (req, res) => {
  try {
    res.json({
      success: true,
      data: constants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Configurações Frontend
 * @access All authenticated users
 */
exports.getFrontendConfig = (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        theme: frontendConfig.UI_CONFIG.theme,
        clinic: frontendConfig.UI_CONFIG.clinic,
        routes: frontendConfig.APP_ROUTES,
        pagination: frontendConfig.PAGINATION_CONFIG,
        notification: frontendConfig.NOTIFICATION_CONFIG,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obter Status da Clínica
 * @access Admin
 */
exports.getClinicStatus = (req, res) => {
  try {
    const now = new Date();
    const dayName = now
      .toLocaleLowerCase('pt-PT', { weekday: 'long' })
      .replace('ç', 'c')
      .replace('ã', 'a');
    const dayConfig = clinicConfig.schedule[dayName];

    let status = 'Verificando...';
    let isOpen = true;

    if (dayConfig && dayConfig.closed) {
      status = 'Encerrado';
      isOpen = false;
    } else if (dayConfig) {
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      if (currentTime < dayConfig.start) {
        status = `Abrirá às ${dayConfig.start}`;
        isOpen = false;
      } else if (currentTime >= dayConfig.start && currentTime <= dayConfig.end) {
        status = `Aberto até às ${dayConfig.end}`;
        isOpen = true;
      } else {
        status = 'Encerrado por hoje';
        isOpen = false;
      }

      // Verificar se está em pausa
      if (
        dayConfig.breakStart &&
        dayConfig.breakEnd &&
        currentTime >= dayConfig.breakStart &&
        currentTime <= dayConfig.breakEnd
      ) {
        status = `Pausa: Reabre às ${dayConfig.breakEnd}`;
        isOpen = false;
      }
    }

    res.json({
      success: true,
      data: {
        isOpen,
        status,
        currentTime: now.toLocaleTimeString('pt-PT'),
        day: dayName,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


/**
 * Obter configura��o da cl�nica da base de dados
 * @access Admin
 */
exports.getClinicConfig = async (req, res) => {
  try {
    const result = await pool.query('SELECT chave, valor FROM clinic_config ORDER BY chave');
    const config = {};
    result.rows.forEach(row => { config[row.chave] = row.valor; });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Atualizar configura��o da cl�nica na base de dados
 * @access Admin
 */
exports.updateClinicConfig = async (req, res) => {
  try {
    const allowed = ['nome', 'nif', 'telefone', 'email', 'morada', 'timezone'];
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const chave of allowed) {
        if (req.body[chave] !== undefined) {
          await client.query(
            `INSERT INTO clinic_config (chave, valor, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
            [chave, req.body[chave]]
          );
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
