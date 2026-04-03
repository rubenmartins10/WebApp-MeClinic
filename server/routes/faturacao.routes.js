const express = require('express');
const router = express.Router();
const FaturaçãoController = require('../controllers/faturaçãoController');
const { authMiddleware } = require('../middleware/auth');
const { validateRequest } = require('../validation/faturaçãoValidation');

/**
 * ROTAS FATURAÇÃO
 * Todas requerem autenticação
 */

// Middleware de autenticação - todas as rotas requerem login
router.use(authMiddleware);

/**
 * GET /api/faturacao
 * Listar todas as faturas com filtros
 */
router.get('/', FaturaçãoController.getAll);

/**
 * GET /api/faturacao/:id
 * Obter detalhes de uma fatura
 */
router.get('/:id', FaturaçãoController.getById);

/**
 * GET /api/faturacao/paciente/:pacienteId
 * Listar faturas de um paciente
 */
router.get('/paciente/:pacienteId', FaturaçãoController.getByPaciente);

/**
 * GET /api/faturacao/pendentes
 * Listar faturas pendentes
 */
router.get('/pendentes', FaturaçãoController.getPending);

/**
 * GET /api/faturacao/estatisticas/resumo
 * Obter estatísticas de faturação
 * Requer permissões: ADMIN
 */
router.get(
  '/estatisticas/resumo',
  (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  FaturaçãoController.getStatistics
);

/**
 * POST /api/faturacao
 * Criar fatura
 * Requer permissões: ADMIN, DENTISTA, ASSISTENTE
 */
router.post(
  '/',
  (req, res, next) => {
    if (!['ADMIN', 'DENTISTA', 'ASSISTENTE'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  validateRequest('create'),
  FaturaçãoController.create
);

/**
 * POST /api/faturacao/checkout
 * Checkout completo - finaliza consulta, cria fatura, abate stock
 * Requer permissões: ADMIN, DENTISTA
 */
router.post(
  '/checkout',
  (req, res, next) => {
    if (!['ADMIN', 'DENTISTA'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  validateRequest('checkout'),
  FaturaçãoController.checkout
);

/**
 * PUT /api/faturacao/:id
 * Atualizar fatura
 * Requer permissões: ADMIN, DENTISTA
 */
router.put(
  '/:id',
  (req, res, next) => {
    if (!['ADMIN', 'DENTISTA'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  validateRequest('update'),
  FaturaçãoController.update
);

/**
 * PUT /api/faturacao/:id/marcar-paga
 * Marcar fatura como paga
 * Requer permissões: ADMIN, DENTISTA, ASSISTENTE
 */
router.put(
  '/:id/marcar-paga',
  (req, res, next) => {
    if (!['ADMIN', 'DENTISTA', 'ASSISTENTE'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  validateRequest('marcarPaga'),
  FaturaçãoController.marcarPaga
);

/**
 * DELETE /api/faturacao/:id
 * Deletar fatura
 * Requer permissões: ADMIN
 */
router.delete(
  '/:id',
  (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  FaturaçãoController.delete
);

module.exports = router;
