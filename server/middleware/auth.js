const jwt = require('jsonwebtoken');
const { AppError } = require('../errorHandler');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e extrai os dados do utilizador
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AppError('Token não fornecido', 401, { reason: 'missing_token' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
    
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Token expirado', 401, { reason: 'token_expired' });
    }
    throw new AppError('Token inválido', 401, { reason: 'invalid_token' });
  }
};

/**
 * Middleware para verificar role (permissões)
 * Uso: requireRole('ADMIN', 'DENTISTA')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Não autenticado', 401);
    }
    
    if (!roles.includes(req.user.role)) {
      throw new AppError('Permissão insuficiente', 403, { 
        required_roles: roles, 
        user_role: req.user.role 
      });
    }
    
    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole
};
