const Joi = require('joi');

/**
 * Validação de Faturação
 */

// Schema para criar fatura
const createFaturaSchema = Joi.object({
  consulta_id: Joi.number().integer().positive().required().messages({
    'number.positive': 'ID da consulta inválido',
    'any.required': 'ID da consulta é obrigatório'
  }),
  paciente_id: Joi.number().integer().positive().optional(),
  paciente_nome: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Nome do paciente deve ter pelo menos 3 caracteres',
    'any.required': 'Nome do paciente é obrigatório'
  }),
  procedimento_nome: Joi.string().max(200).optional(),
  valor_total: Joi.number().positive().required().messages({
    'number.positive': 'Valor deve ser positivo',
    'any.required': 'Valor total é obrigatório'
  }),
  metodo_pagamento: Joi.string().max(50).optional().default('Multibanco')
}).strict();

// Schema para checkout (mais completo)
const checkoutSchema = Joi.object({
  consulta_id: Joi.number().integer().positive().required(),
  paciente_nome: Joi.string().min(3).max(200).required(),
  procedimento_nome: Joi.string().max(200).optional(),
  valor_total: Joi.number().positive().required(),
  metodo_pagamento: Joi.string().max(50).optional(),
  email_destino: Joi.string().email().optional(),
  enviar_receita_email: Joi.boolean().optional(),
  pdfBase64: Joi.string().optional(),
  materiais_gastos: Joi.array().items(
    Joi.object({
      nome_item: Joi.string().required(),
      quantidade: Joi.number().positive().required()
    })
  ).optional(),
  exame_nome: Joi.string().optional(),
  exame_base64: Joi.string().optional(),
  receita_nome: Joi.string().optional(),
  receita_base64: Joi.string().optional()
}).strict();

// Schema para atualizar fatura
const updateFaturaSchema = Joi.object({
  status: Joi.string().valid('PENDENTE', 'PAGA', 'PARCIAL', 'CANCELADA').optional(),
  metodo_pagamento: Joi.string().max(50).optional(),
  valor_total: Joi.number().positive().optional(),
  procedimento_nome: Joi.string().max(200).optional()
}).strict();

// Schema para marcar como paga
const marcarPagaSchema = Joi.object({
  data_pagamento: Joi.date().iso().optional()
}).strict();

// Middleware de validação
const validateRequest = (operation) => {
  return (req, res, next) => {
    let schema;

    switch (operation) {
      case 'create':
        schema = createFaturaSchema;
        break;
      case 'checkout':
        schema = checkoutSchema;
        break;
      case 'update':
        schema = updateFaturaSchema;
        break;
      case 'marcarPaga':
        schema = marcarPagaSchema;
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
  createFaturaSchema,
  checkoutSchema,
  updateFaturaSchema,
  marcarPagaSchema,
  validateRequest
};
