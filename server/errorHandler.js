// ==========================================
// --- ERROR HANDLING MIDDLEWARE ---
// ==========================================

const logger = require('./utils/logger');

/**
 * Classe de erro customizada para a aplicação
 */
class AppError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de erro centralizado
 * - Captura todos os erros da aplicação
 * - Log estruturado (console/ficheiro)
 * - Respostas consistentes
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // Log detalhado em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    logger.error('ERRO:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: err.statusCode,
      message: err.message,
      stack: err.stack,
      details: err.details
    });
  }

  // Respostas padronizadas
  const response = {
    error: err.message,
    code: err.statusCode
  };

  // Adicionar detalhes em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    response.details = err.details;
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
};

/**
 * Wrapper para converter promises em try-catch
 * Modo de uso: router.get('/path', asyncHandler(async (req, res) => {...}))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware que captura erros 404
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Endpoint não encontrado: ${req.method} ${req.originalUrl}`,
    404,
    { method: req.method, path: req.originalUrl }
  );
  next(err);
};

/**
 * Erros de Validação (Joi)
 */
const validationErrorHandler = (error, req, res, next) => {
  if (error.isJoi) {
    const messages = error.details.map(d => d.message).join(', ');
    const err = new AppError(messages, 400, { validationErrors: error.details });
    return errorHandler(err, req, res, next);
  }
  next(error);
};

/**
 * Log de Segurança - registar tentativas suspeitas
 */
const securityLogger = (err, req, res, next) => {
  // Rate limit violations, SQL injection attempts, etc
  if (err.statusCode === 429 || err.message?.includes('SQL') || err.message?.includes('injection')) {
    logger.warn('ALERTA DE SEGURANÇA:', {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      reason: err.message,
      headers: req.headers
    });
  }
  next(err);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  validationErrorHandler,
  securityLogger
};
