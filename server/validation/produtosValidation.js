const Joi = require('joi');

/**
 * Validação de Produtos
 */

// Schema para criar produto
const createProdutoSchema = Joi.object({
  nome: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Nome deve ter pelo menos 3 caracteres',
    'string.max': 'Nome não pode exceder 200 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  codigo_barras: Joi.string().max(50).optional(),
  stock_atual: Joi.number().min(0).optional().default(0),
  stock_minimo: Joi.number().min(0).optional().default(5),
  unidade_medida: Joi.string().max(20).optional().default('un').messages({
    'string.max': 'Unidade de medida não pode exceder 20 caracteres'
  }),
  imagem_url: Joi.string().uri().optional(),
  categoria: Joi.string().max(100).optional().default('Descartáveis'),
  data_validade: Joi.date().iso().optional()
}).strict();

// Schema para atualizar produto
const updateProdutoSchema = Joi.object({
  nome: Joi.string().min(3).max(200).optional(),
  codigo_barras: Joi.string().max(50).optional(),
  stock_atual: Joi.number().min(0).optional(),
  stock_minimo: Joi.number().min(0).optional(),
  unidade_medida: Joi.string().max(20).optional(),
  imagem_url: Joi.string().uri().optional(),
  categoria: Joi.string().max(100).optional(),
  data_validade: Joi.date().iso().optional()
}).strict();

// Schema para atualizar stock
const updateStockSchema = Joi.object({
  quantity: Joi.number().integer().positive().required().messages({
    'number.positive': 'Quantidade deve ser maior que 0',
    'any.required': 'Quantidade é obrigatória'
  }),
  operation: Joi.string().valid('add', 'remove').required().messages({
    'any.only': 'Operação deve ser "add" ou "remove"',
    'any.required': 'Operação é obrigatória'
  })
}).strict();

// Middleware de validação
const validateRequest = (operation) => {
  return (req, res, next) => {
    let schema;

    switch (operation) {
      case 'create':
        schema = createProdutoSchema;
        break;
      case 'update':
        schema = updateProdutoSchema;
        break;
      case 'updateStock':
        schema = updateStockSchema;
        break;
      default:
        schema = Joi.object().strict();
    }

    const { error, value } = schema.validate(req.body);

    if (error) {
      const messages = error.details.map(d => d.message).join(', ');
      return res.status(400).json({ message: `Erro de validação: ${messages}` });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  createProdutoSchema,
  updateProdutoSchema,
  updateStockSchema,
  validateRequest
};
