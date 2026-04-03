const express = require('express');
const router = express.Router();
const ProdutosController = require('../controllers/produtosController');
const { authMiddleware } = require('../middleware/auth');
const { validateRequest } = require('../validation/produtosValidation');

/**
 * ROTAS PRODUTOS
 * Todas requerem autenticação
 */

// Middleware de autenticação - todas as rotas requerem login
router.use(authMiddleware);

/**
 * GET /api/produtos
 * Listar todos os produtos com filtros
 */
router.get('/', ProdutosController.getAll);

/**
 * GET /api/produtos/:id
 * Obter detalhes de um produto
 */
router.get('/:id', ProdutosController.getById);

/**
 * GET /api/produtos/categorias/list
 * Obter lista de categorias disponíveis
 */
router.get('/categorias/list', ProdutosController.getCategories);

/**
 * GET /api/produtos/categoria/:categoria
 * Listar produtos por categoria
 */
router.get('/categoria/:categoria', ProdutosController.getByCategory);

/**
 * GET /api/produtos/stock/alerts
 * Obter alertas de stock baixo
 */
router.get('/stock/alerts', ProdutosController.getStockAlerts);

/**
 * GET /api/produtos/search/:termo
 * Procurar produto por nome ou código de barras
 */
router.get('/search/:termo', ProdutosController.search);

/**
 * POST /api/produtos
 * Criar novo produto
 * Requer permissões: ADMIN, DENTISTA
 */
router.post(
  '/',
  (req, res, next) => {
    if (!['ADMIN', 'DENTISTA'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  validateRequest('create'),
  ProdutosController.create
);

/**
 * PUT /api/produtos/:id
 * Atualizar produto
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
  ProdutosController.update
);

/**
 * PUT /api/produtos/:id/stock
 * Atualizar stock do produto
 * Requer permissões: ADMIN, DENTISTA, ASSISTENTE
 */
router.put(
  '/:id/stock',
  (req, res, next) => {
    if (!['ADMIN', 'DENTISTA', 'ASSISTENTE'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  },
  validateRequest('updateStock'),
  ProdutosController.updateStock
);

/**
 * DELETE /api/produtos/:id
 * Deletar produto
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
  ProdutosController.delete
);

module.exports = router;
