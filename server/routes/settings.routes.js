/**
 * Rotas de Definições da Clínica - MeClinic
 * API para gerenciar e obter definições operacionais
 *
 * @version 1.0
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');

// ============================================
// ROTAS PÚBLICAS (Sem autenticação)
// ============================================

/**
 * GET /api/settings/public
 * Obter informações públicas da clínica
 */
router.get('/public', settingsController.getPublicInfo);

/**
 * GET /api/settings/operating-hours
 * Obter horário de funcionamento da clínica
 */
router.get('/operating-hours', settingsController.getOperatingHours);

/**
 * GET /api/settings/clinic-status
 * Obter status atual da clínica (aberto/fechado)
 */
router.get('/clinic-status', settingsController.getClinicStatus);

/**
 * GET /api/settings/payment-terms
 * Obter termos de pagamento
 */
router.get('/payment-terms', settingsController.getPaymentTerms);

// ============================================
// ROTAS AUTENTICADAS
// ============================================

/**
 * GET /api/settings/clinic
 * Obter definições gerais da clínica
 * @access Admin, Dentist
 */
router.get('/clinic', authMiddleware, settingsController.getClinicSettings);

/**
 * GET /api/settings/financial
 * Obter configurações financeiras
 * @access Admin
 */
router.get(
  '/financial',
  authMiddleware,
  (req, res, next) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  },
  settingsController.getFinancialSettings
);

/**
 * GET /api/settings/security
 * Obter configurações de segurança
 * @access Super Admin Only
 */
router.get(
  '/security',
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  },
  settingsController.getSecuritySettings
);

/**
 * GET /api/settings/notifications
 * Obter configurações de notificações
 * @access Admin
 */
router.get(
  '/notifications',
  authMiddleware,
  (req, res, next) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  },
  settingsController.getNotificationSettings
);

/**
 * GET /api/settings/reports
 * Obter configurações de relatórios
 * @access Admin
 */
router.get(
  '/reports',
  authMiddleware,
  (req, res, next) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  },
  settingsController.getReportSettings
);

/**
 * GET /api/settings/procedures
 * Obter categorias de procedimentos
 * @access All authenticated
 */
router.get('/procedures', authMiddleware, settingsController.getProcedureCategories);

/**
 * GET /api/settings/user-roles
 * Obter papéis e permissões de utilizadores
 * @access Admin
 */
router.get(
  '/user-roles',
  authMiddleware,
  (req, res, next) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  },
  settingsController.getUserRoles
);

/**
 * GET /api/settings/constants
 * Obter constantes da aplicação
 * @access All authenticated
 */
router.get('/constants', authMiddleware, settingsController.getApplicationConstants);

/**
 * GET /api/settings/frontend-config
 * Obter configurações do frontend
 * @access All authenticated
 */
router.get(
  '/frontend-config',
  authMiddleware,
  settingsController.getFrontendConfig
);

/**
 * POST /api/settings/validate
 * Validar configuração completa do sistema
 * @access Super Admin Only
 */
router.post(
  '/validate',
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  },
  settingsController.validateConfiguration
);

// ============================================
// TRATAMENTO DE ERROS
// ============================================

/**
 * 404 - Rota não encontrada
 */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada: ' + req.originalUrl,
  });
});

module.exports = router;
