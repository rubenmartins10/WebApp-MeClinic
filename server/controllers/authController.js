const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const User = require('../models/User');
const { AppError } = require('../errorHandler');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

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
      const { user, mfaSecret, mfaUrl } = await User.create(nome, email, password, 'USER');

      // Gerar QR code para MFA
      const qrCodeUrl = await QRCode.toDataURL(mfaUrl);

      // Gerar token JWT
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRY
      });

      res.status(201).json({
        message: 'Conta criada com sucesso!',
        user,
        token,
        mfa: {
          enabled: true,
          qrCodeUrl,
          secret: mfaSecret
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
      const { email, password, mfaToken } = req.body;

      // Buscar utilizador
      const user = await User.findByEmail(email);
      if (!user) {
        throw new AppError('Credenciais incorretas.', 401);
      }

      // Verificar password
      const validPassword = await User.verifyPassword(password, user.password_hash);
      if (!validPassword) {
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

      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      // Registar atividade de login (async, sem await para não bloquear resposta)
      this.logLoginActivity(user.id, req).catch(err => console.error('Log de login falhou:', err));

      res.json({
        message: 'Login realizado com sucesso!',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role
        },
        token
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
   */
  static async logLoginActivity(userId, req) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';
      
      // Tentar extrair informações do dispositivo do user-agent
      let deviceInfo = 'Browser Desconhecido';
      if (userAgent.includes('Chrome')) deviceInfo = 'Chrome';
      if (userAgent.includes('Firefox')) deviceInfo = 'Firefox';
      if (userAgent.includes('Safari')) deviceInfo = 'Safari';
      if (userAgent.includes('Edge')) deviceInfo = 'Edge';
      if (userAgent.includes('Windows')) deviceInfo += ' - Windows';
      if (userAgent.includes('Mac')) deviceInfo += ' - macOS';
      if (userAgent.includes('Android')) deviceInfo = 'Android App';
      if (userAgent.includes('iPhone')) deviceInfo = 'iPhone Safari';
      
      const sessionId = require('crypto').randomBytes(16).toString('hex');

      await pool.query(
        `INSERT INTO activity_log (user_id, action_type, description, device_info, ip_address, user_agent, status, session_id, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, 'LOGIN', 'Login bem-sucedido', deviceInfo, ipAddress, userAgent, 'success', sessionId, 'Portugal']
      );
    } catch (err) {
      // Falhar silenciosamente para não interromper o login
      console.error('Erro ao registar atividade de login:', err);
    }
  }

  /**
   * Logout (client-side, mas deixamos a rota por simetria)
   */
  static async logout(req, res, next) {
    try {
      // Em uma app com sessões, aqui removería do servidor
      // Como usamos JWT, a remoção é client-side (delete token)
      res.json({
        message: 'Logout realizado com sucesso!',
        note: 'Token JWT removido do cliente'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
