const pool = require('../db');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');

/**
 * Modelo de Utilizador
 * Centraliza todas as operações de BD relacionadas com utilizadores
 */
class User {
  /**
   * Buscar utilizador por email
   */
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT id, nome, email, role, ativo, password_hash, mfa_enabled, mfa_secret, telefone FROM utilizadores WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Buscar utilizador por ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT id, nome, email, role, mfa_enabled FROM utilizadores WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Verificar se um email já existe
   */
  static async emailExists(email) {
    const result = await pool.query(
      'SELECT id FROM utilizadores WHERE email = $1',
      [email]
    );
    return result.rows.length > 0;
  }

  /**
   * Criar novo utilizador
   */
  static async create(nome, email, password, role = 'USER') {
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);
    const secret = speakeasy.generateSecret({ name: `MeClinic (${email})` });

    const result = await pool.query(
      `INSERT INTO utilizadores (nome, email, password_hash, mfa_enabled, mfa_secret, role, perfil) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, nome, email, role`,
      [nome, email, password_hash, true, secret.base32, role, role === 'ADMIN' ? 'Admin' : 'Assistente']
    );

    return {
      user: result.rows[0],
      mfaSecret: secret.base32,
      mfaUrl: secret.otpauth_url
    };
  }

  /**
   * Verificar password
   */
  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Gerar MFA secret
   */
  static async generateMFASecret(email) {
    return speakeasy.generateSecret({ name: `MeClinic (${email})` });
  }

  /**
   * Verificar MFA token
   */
  static async verifyMFAToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
  }

  /**
   * Atualizar MFA secret
   */
  static async updateMFASecret(userId, secret) {
    await pool.query(
      'UPDATE utilizadores SET mfa_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );
    return secret;
  }
}

module.exports = User;
