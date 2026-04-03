const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../errorHandler');
const { validateRequest, createPacienteSchema, updatePacienteSchema } = require('../validation/pacientesValidation');
const PacientesController = require('../controllers/pacientesController');
const { authMiddleware, requireRole } = require('../middleware/auth');

/**
 * Rotas de Pacientes
 * 
 * GET    /api/pacientes          - Listar todos
 * GET    /api/pacientes/search   - Buscar por nome/email
 * GET    /api/pacientes/:id      - Obter detalhes
 * POST   /api/pacientes          - Criar novo
 * PUT    /api/pacientes/:id/dados - Atualizar dados
 * PUT    /api/pacientes/:id/notas - Atualizar notas
 * PUT    /api/pacientes/:id/odontograma - Atualizar odontograma
 * GET    /api/pacientes/:id/historico - Histórico de consultas
 * POST   /api/pacientes/:id/exames - Adicionar exame
 * GET    /api/pacientes/:id/exames - Listar exames
 * DELETE /api/pacientes/exames/:idExame - Deletar exame
 * DELETE /api/pacientes/:id - Deletar paciente
 */

/**
 * GET /api/pacientes
 * Listar todos os pacientes com pagination
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(PacientesController.getAll)
);

/**
 * GET /api/pacientes/search?q=termo
 * Buscar pacientes por nome ou email
 */
router.get(
  '/search',
  authMiddleware,
  asyncHandler(PacientesController.search)
);

/**
 * POST /api/pacientes
 * Criar novo paciente
 */
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'DENTISTA', 'ASSISTENTE'),
  validateRequest(createPacienteSchema),
  asyncHandler(PacientesController.create)
);

/**
 * GET /api/pacientes/:id
 * Obter detalhes de um paciente
 */
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(PacientesController.getById)
);

/**
 * PUT /api/pacientes/:id/dados
 * Atualizar dados do paciente
 */
router.put(
  '/:id/dados',
  authMiddleware,
  requireRole('ADMIN', 'DENTISTA', 'ASSISTENTE'),
  validateRequest(updatePacienteSchema),
  asyncHandler(PacientesController.updateDados)
);

/**
 * PUT /api/pacientes/:id/notas
 * Atualizar notas clínicas
 */
router.put(
  '/:id/notas',
  authMiddleware,
  requireRole('ADMIN', 'DENTISTA'),
  asyncHandler(PacientesController.updateNotas)
);

/**
 * PUT /api/pacientes/:id/odontograma
 * Atualizar odontograma
 */
router.put(
  '/:id/odontograma',
  authMiddleware,
  requireRole('ADMIN', 'DENTISTA'),
  asyncHandler(PacientesController.updateOdontograma)
);

/**
 * GET /api/pacientes/:id/historico
 * Obter histórico de consultas
 */
router.get(
  '/:id/historico',
  authMiddleware,
  asyncHandler(PacientesController.getHistorico)
);

/**
 * POST /api/pacientes/:id/exames
 * Adicionar exame
 */
router.post(
  '/:id/exames',
  authMiddleware,
  requireRole('ADMIN', 'DENTISTA'),
  asyncHandler(PacientesController.addExame)
);

/**
 * GET /api/pacientes/:id/exames
 * Listar exames
 */
router.get(
  '/:id/exames',
  authMiddleware,
  asyncHandler(PacientesController.getExames)
);

/**
 * DELETE /api/pacientes/exames/:idExame
 * Deletar exame
 */
router.delete(
  '/exames/:idExame',
  authMiddleware,
  requireRole('ADMIN', 'DENTISTA'),
  asyncHandler(PacientesController.deleteExame)
);

/**
 * DELETE /api/pacientes/:id
 * Deletar paciente (e todas as dependências)
 */
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(PacientesController.delete)
);

module.exports = router;
