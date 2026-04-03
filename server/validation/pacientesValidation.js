const Joi = require('joi');

// Padrões reutilizáveis
const commonPatterns = {
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'Email é obrigatório'
  }),
  nome: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 3 caracteres',
    'string.max': 'Nome não pode exceder 100 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  telefone: Joi.string().pattern(/^[0-9+\-\s()]+$/).messages({
    'string.pattern.base': 'Telefone inválido'
  }),
  data: Joi.date().iso().messages({
    'date.iso': 'Data deve estar em formato ISO (YYYY-MM-DD)'
  })
};

// ==========================================
// --- PACIENTES SCHEMAS ---
// ==========================================

exports.createPacienteSchema = Joi.object({
  nome: commonPatterns.nome,
  data_nascimento: commonPatterns.data,
  email: commonPatterns.email,
  telefone: commonPatterns.telefone.optional(),
  endereco: Joi.string().max(200).optional(),
  cidade: Joi.string().max(100).optional(),
  nif: Joi.string().pattern(/^\d{9}$/).optional().messages({
    'string.pattern.base': 'NIF deve ter 9 dígitos'
  }),
  notas_clinicas: Joi.string().max(5000).optional()
}).strict();

exports.updatePacienteSchema = Joi.object({
  nome: commonPatterns.nome.optional(),
  data_nascimento: commonPatterns.data.optional(),
  email: commonPatterns.email.optional(),
  telefone: commonPatterns.telefone.optional(),
  endereco: Joi.string().max(200).optional(),
  cidade: Joi.string().max(100).optional(),
  nif: Joi.string().pattern(/^\d{9}$/).optional().messages({
    'string.pattern.base': 'NIF deve ter 9 dígitos'
  }),
  notas_clinicas: Joi.string().max(5000).optional()
}).strict();

// Middleware para validação de request
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: messages
      });
    }

    req.body = value;
    next();
  };
};
