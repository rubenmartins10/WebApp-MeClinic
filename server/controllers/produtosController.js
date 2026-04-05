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
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
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

  /**
   * GET /api/produtos/barcode/:codigo
   * Procurar produto por código de barras (local DB + Open Food Facts)
   */
  static async lookupBarcode(req, res, next) {
    try {
      const codigo = req.params.codigo;

      if (!codigo || codigo.length < 6) {
        throw new AppError('Código de barras deve ter pelo menos 6 dígitos', 400);
      }

      // 1. Procurar na base de dados local
      const produtoLocal = await Produto.findByBarcode(codigo);
      if (produtoLocal) {
        return res.json({
          source: 'local',
          found: true,
          product: {
            nome: produtoLocal.nome,
            categoria: produtoLocal.categoria,
            unidade_medida: produtoLocal.unidade_medida,
            stock_minimo: produtoLocal.stock_minimo,
            imagem_url: produtoLocal.imagem_url
          }
        });
      }

      // 2. Procurar na API Open Food Facts (gratuita)
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json`,
          { signal: controller.signal, headers: { 'User-Agent': 'MeClinic/1.0' } }
        );
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          if (data.status === 1 && data.product) {
            const p = data.product;

            // Melhor imagem: front > selected front > raw uploaded image
            let imagem = p.image_front_url || p.image_url || '';
            if (!imagem) {
              // Tentar imagem do selected_images (qualquer língua)
              const selectedFront = p.selected_images?.front?.display;
              if (selectedFront) {
                imagem = Object.values(selectedFront)[0] || '';
              }
            }
            if (!imagem && p.images) {
              // Última tentativa: construir URL da primeira imagem raw carregada
              const barcodeStr = String(codigo);
              let pathPart;
              if (barcodeStr.length > 8) {
                pathPart = `${barcodeStr.slice(0,3)}/${barcodeStr.slice(3,6)}/${barcodeStr.slice(6,9)}/${barcodeStr.slice(9)}`;
              } else {
                pathPart = barcodeStr;
              }
              // Encontrar a primeira imagem numérica (não "nutrition_xx", "front_xx" etc.)
              const numericKeys = Object.keys(p.images).filter(k => /^\d+$/.test(k)).sort((a,b) => Number(b) - Number(a));
              if (numericKeys.length > 0) {
                const imgId = numericKeys[0];
                imagem = `https://images.openfoodfacts.org/images/products/${pathPart}/${imgId}.400.jpg`;
              }
            }

            // Inferir categoria a partir das tags do Open Food Facts
            const catTags = (p.categories_tags || []).map(t => t.toLowerCase());
            const catText = (p.categories || '').toLowerCase();

            let categoria = '';
            const categoryRules = [
              { match: ['anestesi', 'anesthetic', 'pharma', 'medicament', 'medication'], cat: 'Anestesia' },
              { match: ['syringe', 'needle', 'glove', 'mask', 'disposab', 'luva', 'seringa', 'agulha', 'descartav'], cat: 'Descartáveis' },
              { match: ['steril', 'esteril', 'desinfe', 'disinfect', 'autoclave'], cat: 'Esterilizacao' },
              { match: ['orthodon', 'ortodon', 'bracket', 'archwire'], cat: 'Ortodontia' },
              { match: ['surgical', 'cirurg', 'scalpel', 'bisturi', 'sutur'], cat: 'Cirurgia' },
              { match: ['composite', 'resin', 'resina', 'restaur', 'endodon', 'root canal', 'lima'], cat: 'Endo_Restauro' },
              { match: ['equip', 'instrument', 'tool', 'handpiece', 'turbina'], cat: 'Equipamento' },
              { match: ['water', 'agua', 'água', 'beverage', 'drink', 'food', 'aliment'], cat: 'Descartáveis' },
            ];

            const allText = catTags.join(' ') + ' ' + catText + ' ' + (p.product_name || '').toLowerCase();
            for (const rule of categoryRules) {
              if (rule.match.some(keyword => allText.includes(keyword))) {
                categoria = rule.cat;
                break;
              }
            }

            // Construir nome completo com marca e quantidade
            let nome = p.product_name || '';
            if (p.brands && nome && !nome.toLowerCase().includes(p.brands.toLowerCase())) {
              nome = `${p.brands} ${nome}`;
            }
            if (p.quantity && !nome.includes(p.quantity)) {
              nome = `${nome} ${p.quantity}`;
            }

            return res.json({
              source: 'openfoodfacts',
              found: true,
              product: {
                nome: nome.trim(),
                categoria,
                unidade_medida: 'un',
                stock_minimo: 5,
                imagem_url: imagem,
                marca: p.brands || ''
              }
            });
          }
        }
      } catch (fetchErr) {
        // API externa falhou - não é erro crítico
        console.debug('[Barcode Lookup] Open Food Facts unavailable:', fetchErr.message);
      }

      // 3. Tentar UPC Item DB como fallback
      try {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 5000);

        const upcResp = await fetch(
          `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(codigo)}`,
          { signal: controller2.signal, headers: { 'User-Agent': 'MeClinic/1.0', 'Accept': 'application/json' } }
        );
        clearTimeout(timeout2);

        if (upcResp.ok) {
          const upcData = await upcResp.json();
          if (upcData.items && upcData.items.length > 0) {
            const item = upcData.items[0];
            return res.json({
              source: 'upcitemdb',
              found: true,
              product: {
                nome: item.title || '',
                categoria: '',
                unidade_medida: 'un',
                stock_minimo: 5,
                imagem_url: (item.images && item.images.length > 0) ? item.images[0] : '',
                marca: item.brand || ''
              }
            });
          }
        }
      } catch (fetchErr2) {
        console.debug('[Barcode Lookup] UPC Item DB unavailable:', fetchErr2.message);
      }

      // 3. Não encontrado em nenhuma fonte
      res.json({
        source: null,
        found: false,
        product: null
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProdutosController;
