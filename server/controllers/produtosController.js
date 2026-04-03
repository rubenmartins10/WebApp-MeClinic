const Produto = require('../models/Produto');
const { AppError } = require('../errorHandler');

/**
 * ProdutosController - Lógica de produtos e stock
 */
class ProdutosController {
  /**
   * GET /api/produtos
   * Listar todos os produtos
   */
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const filters = {};
      if (req.query.categoria) filters.categoria = req.query.categoria;
      if (req.query.search) filters.search = req.query.search;

      const produtos = await Produto.findAll(filters, limit, offset);
      const total = await Produto.count(filters);

      res.json({
        produtos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/produtos/:id
   * Obter detalhes de um produto
   */
  static async getById(req, res, next) {
    try {
      const produto = await Produto.findById(req.params.id);
      
      if (!produto) {
        throw new AppError('Produto não encontrado', 404);
      }

      res.json(produto);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/produtos/categoria/:categoria
   * Listar produtos por categoria
   */
  static async getByCategory(req, res, next) {
    try {
      const produtos = await Produto.findByCategory(req.params.categoria);
      
      res.json({
        categoria: req.params.categoria,
        produtos,
        total: produtos.length
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/produtos/stock/alerts
   * Obter alertas de stock baixo
   */
  static async getStockAlerts(req, res, next) {
    try {
      const alertas = await Produto.getLowStockAlerts();
      
      res.json({
        alertas,
        total: alertas.length,
        message: `${alertas.length} produto(s) com stock baixo`
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/produtos/search/:termo
   * Procurar produto por nome ou código de barras
   */
  static async search(req, res, next) {
    try {
      const termo = req.params.termo;

      if (termo.length < 2) {
        throw new AppError('Termo de busca deve ter pelo menos 2 caracteres', 400);
      }

      const produtos = await Produto.findByName(termo);
      
      res.json({
        termo,
        produtos,
        total: produtos.length
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/produtos
   * Criar novo produto
   */
  static async create(req, res, next) {
    try {
      const { nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, imagem_url, categoria, data_validade } = req.body;

      const produto = await Produto.create({
        nome,
        codigo_barras,
        stock_atual,
        stock_minimo,
        unidade_medida,
        imagem_url,
        categoria,
        data_validade
      });

      res.status(201).json({
        message: 'Produto criado com sucesso!',
        produto
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/produtos/:id
   * Atualizar produto
   */
  static async update(req, res, next) {
    try {
      const produto = await Produto.findById(req.params.id);
      if (!produto) {
        throw new AppError('Produto não encontrado', 404);
      }

      const updated = await Produto.update(req.params.id, req.body);

      res.json({
        message: 'Produto atualizado com sucesso!',
        produto: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/produtos/:id/stock
   * Atualizar stock do produto
   */
  static async updateStock(req, res, next) {
    try {
      const { quantity, operation } = req.body;

      if (!quantity || quantity <= 0) {
        throw new AppError('Quantidade deve ser maior que 0', 400);
      }

      if (operation !== 'add' && operation !== 'remove') {
        throw new AppError('Operação deve ser "add" ou "remove"', 400);
      }

      const produto = await Produto.findById(req.params.id);
      if (!produto) {
        throw new AppError('Produto não encontrado', 404);
      }

      // Validar se há stock suficiente para remover
      if (operation === 'remove' && produto.stock_atual < quantity) {
        throw new AppError(`Stock insuficiente. Disponível: ${produto.stock_atual}`, 400);
      }

      const updated = await Produto.updateStock(req.params.id, quantity, operation);

      res.json({
        message: `Stock ${operation === 'add' ? 'adicionado' : 'removido'} com sucesso!`,
        produto: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/produtos/:id
   * Deletar produto
   */
  static async delete(req, res, next) {
    try {
      const produto = await Produto.findById(req.params.id);
      if (!produto) {
        throw new AppError('Produto não encontrado', 404);
      }

      await Produto.delete(req.params.id);

      res.json({
        message: 'Produto removido com sucesso!'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/produtos/categorias/list
   * Obter lista de categorias
   */
  static async getCategories(req, res, next) {
    try {
      const categorias = await Produto.getCategories();
      
      res.json({
        categorias,
        total: categorias.length
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProdutosController;
