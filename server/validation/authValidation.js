const Joi = require('joi');

// Padrões reutilizáveis
const commonPatterns = {
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Palavra-passe deve ter pelo menos 6 caracteres',
    'any.required': 'Palavra-passe é obrigatória'
  }),
  nome: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 3 caracteres',
    'string.max': 'Nome não pode exceder 100 caracteres',
    'any.required': 'Nome é obrigatório'
  })
};

// ==========================================
// --- AUTH SCHEMAS ---
// ==========================================

exports.registerSchema = Joi.object({
  nome: commonPatterns.nome,
  email: commonPatterns.email,
  password: commonPatterns.password,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords não correspondem',
    'any.required': 'Confirmação de password é obrigatória'
  })
}).strict();

exports.loginSchema = Joi.object({
  email: commonPatterns.email,
  password: commonPatterns.password,
  mfaToken: Joi.string().optional().pattern(/^\d{6}$/).messages({
    'string.pattern.base': 'MFA token deve ter 6 dígitos'
  })
}).strict();

exports.verifyMfaSchema = Joi.object({
  token: Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'Token deve ter 6 dígitos',
    'any.required': 'Token é obrigatório'
  })
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
