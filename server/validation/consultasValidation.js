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
  paciente_id: Joi.number().integer().positive().required().messages({
    'number.positive': 'ID do paciente inválido',
    'any.required': 'ID do paciente é obrigatório'
  }),
  data_consulta: commonPatterns.data.required(),
  hora_consulta: commonPatterns.hora.required(),
  motivo: Joi.string().min(3).max(500).required().messages({
    'string.min': 'Motivo deve ter pelo menos 3 caracteres',
    'string.max': 'Motivo não pode exceder 500 caracteres',
    'any.required': 'Motivo é obrigatório'
  }),
  procedimento_id: Joi.number().integer().positive().optional(),
  diagnostico: Joi.string().max(1000).optional(),
  tratamento: Joi.string().max(1000).optional()
}).strict();

// Schema para atualizar consulta
const updateConsultaSchema = Joi.object({
  data_consulta: commonPatterns.data.optional(),
  hora_consulta: commonPatterns.hora.optional(),
  motivo: Joi.string().min(3).max(500).optional(),
  procedimento_id: Joi.number().integer().positive().optional(),
  diagnostico: Joi.string().max(1000).optional(),
  tratamento: Joi.string().max(1000).optional()
}).strict();

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
