const Joi = require('joi');

/**
 * Validação de Consultas
 */

// Padrões reutilizáveis
const commonPatterns = {
  data: Joi.date().iso().messages({
    'date.iso': 'Data deve estar em formato ISO (YYYY-MM-DD)'
  }),
  hora: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
    'string.pattern.base': 'Hora deve estar em formato HH:mm'
  })
};

// Schema para criar consulta
const createConsultaSchema = Joi.object({
  nome: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'any.required': 'Nome do paciente é obrigatório'
  }),
  email: Joi.string().email().optional().allow('', null),
  telefone: Joi.string().min(5).max(30).required().messages({
    'any.required': 'Telefone é obrigatório'
  }),
  data: Joi.date().iso().required().messages({
    'date.iso': 'Data deve estar em formato ISO (YYYY-MM-DD)',
    'any.required': 'Data é obrigatória'
  }),
  hora: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'Hora deve estar em formato HH:mm',
    'any.required': 'Hora é obrigatória'
  }),
  motivo: Joi.string().min(0).max(500).optional().allow('', null),
  procedimento_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().allow('', null),
    Joi.valid(null)
  ).optional()
});

// Schema para atualizar consulta
const updateConsultaSchema = Joi.object({
  nome: Joi.string().min(2).max(200).optional(),
  email: Joi.string().email().optional().allow('', null),
  telefone: Joi.string().min(5).max(30).optional(),
  data: Joi.date().iso().optional(),
  hora: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'Hora deve estar em formato HH:mm'
  }),
  motivo: Joi.string().min(0).max(500).optional().allow('', null),
  procedimento_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().allow('', null),
    Joi.valid(null)
  ).optional()
});

// Middleware de validação
const validateRequest = (operation) => {
  return (req, res, next) => {
    let schema;

    switch (operation) {
      case 'create':
        schema = createConsultaSchema;
        break;
      case 'update':
        schema = updateConsultaSchema;
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
  createConsultaSchema,
  updateConsultaSchema,
  validateRequest
};
