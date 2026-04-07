const express = require('express');
const router = express.Router();
const ConsultasController = require('../controllers/consultasController');
const { authMiddleware } = require('../middleware/auth');
const { validateRequest } = require('../validation/consultasValidation');

/**
 * ROTAS CONSULTAS
 * Todas requerem autenticação
 */

// Middleware de autenticação - todas as rotas requerem login
router.use(authMiddleware);

/**
 * GET /api/consultas
 * Listar todas as consultas com filtros
 */
router.get('/', ConsultasController.getAll);

/**
 * GET /api/consultas/:id
 * Obter detalhes de uma consulta
 */
router.get('/:id', ConsultasController.getById);

/**
 * GET /api/consultas/paciente/:pacienteId
 * Listar consultas de um paciente
 */
router.get('/paciente/:pacienteId', ConsultasController.getByPaciente);

/**
 * GET /api/consultas/data/:data
 * Listar consultas por data (agenda)
 */
router.get('/data/:data', ConsultasController.getByData);

/**
 * POST /api/consultas
 * Criar nova consulta
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
  ConsultasController.create
);

/**
 * PUT /api/consultas/:id
 * Atualizar consulta
 * Requer permissões: ADMIN, DENTISTA
 */
router.put(
  '/:id',
  (req, res, next) => {
    if (!['ADMIN', 'DENTISTA', 'ASSISTENTE'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  validateRequest('update'),
  ConsultasController.update
);

/**
 * PUT /api/consultas/:id/marcar-realizada
 * Marcar consulta como realizada
 * Requer permissões: ADMIN, DENTISTA
 */
router.put(
  '/:id/marcar-realizada',
  (req, res, next) => {
    if (!['ADMIN', 'DENTISTA', 'ASSISTENTE'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  ConsultasController.marcarRealizada
);

/**
 * PUT /api/consultas/:id/confirmar
 * Confirmar consulta
 * Requer permissões: ADMIN, DENTISTA, ASSISTENTE
 */
router.put(
  '/:id/confirmar',
  (req, res, next) => {
    if (!['ADMIN', 'DENTISTA', 'ASSISTENTE'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  ConsultasController.confirmar
);

/**
 * PUT /api/consultas/:id/cancelar
 * Cancelar consulta
 * Requer permissões: ADMIN, DENTISTA
 */
router.put(
  '/:id/cancelar',
  (req, res, next) => {
    if (!['ADMIN', 'DENTISTA', 'ASSISTENTE'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  ConsultasController.cancelar
);

/**
 * DELETE /api/consultas/:id
 * Deletar consulta
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
  ConsultasController.delete
);

module.exports = router;
