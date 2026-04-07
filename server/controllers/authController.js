const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const User = require('../models/User');
const { AppError } = require('../errorHandler');
const pool = require('../db');
const logger = require('../utils/logger');
const tokenStore = require('../utils/tokenStore');

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_EXPIRY || '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
// Per-account brute-force protection (M-04)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

/**
 * AuthController - Lógica de autenticação
 */
class AuthController {
  /**
   * Registar novo utilizador
   */
  static async register(req, res, next) {
    try {
      const { nome, email, password } = req.body;

      // Verificar se email já existe
      if (await User.emailExists(email)) {
        throw new AppError('Já existe uma conta com este email.', 409, { field: 'email' });
      }

      // Criar utilizador
      const { user, mfaSecret, mfaUrl } = await User.create(nome, email, password, 'ASSISTENTE');

      // Gerar QR code para MFA
      const qrCodeUrl = await QRCode.toDataURL(mfaUrl);

      // Gerar token JWT
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY
      });

      res.status(201).json({
        message: 'Conta criada com sucesso!',
        user,
        token,
        mfa: {
          enabled: true,
          qrCodeUrl
        }
      });

    } catch (err) {
      next(err);
    }
  }

  /**
   * Login
   */
  static async login(req, res, next) {
    try {
      const { email, password, mfaToken, location } = req.body;

      // Verificar lockout por conta (M-04)
      const attemptKey = (email || '').toLowerCase();
      const attempts = loginAttempts.get(attemptKey) || { count: 0, lockedUntil: null };
      if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
        const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
        throw new AppError(`Conta temporariamente bloqueada. Tente novamente em ${remaining} min.`, 429);
      }

      // Buscar utilizador
      const user = await User.findByEmail(email);
      if (!user) {
        attempts.count++;
        if (attempts.count >= MAX_LOGIN_ATTEMPTS) { attempts.lockedUntil = Date.now() + LOCKOUT_MS; attempts.count = 0; }
        loginAttempts.set(attemptKey, attempts);
        throw new AppError('Credenciais incorretas.', 401);
      }

      // Verificar password
      const validPassword = await User.verifyPassword(password, user.password_hash);
      if (!validPassword) {
        attempts.count++;
        if (attempts.count >= MAX_LOGIN_ATTEMPTS) { attempts.lockedUntil = Date.now() + LOCKOUT_MS; attempts.count = 0; }
        loginAttempts.set(attemptKey, attempts);
        throw new AppError('Credenciais incorretas.', 401);
      }

      // Verificar MFA se necessário
      if (user.mfa_enabled && user.mfa_secret) {
        if (!mfaToken) {
          throw new AppError('MFA token necessário', 401, { reason: 'mfa_required' });
        }

        const mfaValid = User.verifyMFAToken(user.mfa_secret, mfaToken);
        if (!mfaValid) {
          throw new AppError('MFA token inválido', 401);
        }
      }

      // Auth bem-sucedida — limpar lockout (M-04)
      loginAttempts.delete(attemptKey);

      // Gerar access token (1h) + refresh token (7d)
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      const refreshToken = jwt.sign(
        { id: user.id, type: 'refresh' },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );
      tokenStore.set(refreshToken, user.id, REFRESH_TOKEN_TTL_MS);

      // Registar atividade de login e obter session_id
      const sessionId = await AuthController.logLoginActivity(user.id, req, location);

      res.json({
        message: 'Login realizado com sucesso!',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          telefone: user.telefone || null
        },
        token,
        refreshToken,
        sessionId
      });

    } catch (err) {
      next(err);
    }
  }

  /**
   * Verificar se utilizador está autenticado
   */
  static async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        throw new AppError('Utilizador não encontrado', 404);
      }

      res.json({
        user,
        authenticated: true
      });

    } catch (err) {
      next(err);
    }
  }

  /**
   * Registar atividade de login
   * @returns {string|null} session_id criado
   */
  static async logLoginActivity(userId, req, location) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';
      
      // Browser detection (order matters: Edge/Opera before Chrome)
      let browser = 'Browser Desconhecido';
      if (userAgent.includes('Edg/')) browser = 'Edge';
      else if (userAgent.includes('OPR/') || userAgent.includes('Opera')) browser = 'Opera';
      else if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';

      let os = '';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
      else if (userAgent.includes('Linux')) os = 'Linux';

      const deviceInfo = os ? `${browser} · ${os}` : browser;
      const sessionId = require('crypto').randomBytes(16).toString('hex');
      const loc = (typeof location === 'string' && location.trim()) ? location.trim().substring(0, 200) : 'Desconhecido';

      await pool.query(
        `INSERT INTO activity_log (user_id, action_type, description, device_info, ip_address, user_agent, status, session_id, location, is_active, last_seen)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW())`,
        [userId, 'LOGIN', 'Login bem-sucedido', deviceInfo, ipAddress, userAgent.substring(0, 499), 'success', sessionId, loc]
      );
      return sessionId;
    } catch (err) {
      logger.error('Erro ao registar atividade de login:', { message: err.message });
      return null;
    }
  }

  /**
   * Renovar access token com refresh token válido
   */
  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new AppError('Refresh token não fornecido', 401);

      // Validar no store (revogável)
      const stored = tokenStore.get(refreshToken);
      if (!stored) throw new AppError('Refresh token inválido ou expirado', 401, { reason: 'invalid_refresh' });

      // Validar assinatura JWT
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] });
      } catch {
        tokenStore.revoke(refreshToken);
        throw new AppError('Refresh token inválido', 401, { reason: 'invalid_refresh' });
      }

      if (decoded.type !== 'refresh') throw new AppError('Token inválido', 401);

      const user = await User.findById(decoded.id);
      if (!user) throw new AppError('Utilizador não encontrado', 404);

      const newToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      res.json({ token: newToken });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Logout (revoga refresh token)
   */
  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) tokenStore.revoke(refreshToken);
      res.json({ message: 'Logout realizado com sucesso!' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
