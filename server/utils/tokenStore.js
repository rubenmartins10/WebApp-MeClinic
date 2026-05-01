/**
 * Token Store — persistência de refresh tokens na base de dados.
 * Compatível com ambientes serverless (Vercel) e servidores tradicionais.
 * Requer a tabela `refresh_tokens` (ver Database/004_create_refresh_tokens.sql).
 */
const pool = require('../db');
const logger = require('./logger');

/**
 * Registar um novo refresh token
 * @param {string} token
 * @param {number} userId
 * @param {number} ttlMs - duração em milissegundos
 */
async function set(token, userId, ttlMs) {
  const expiresAt = new Date(Date.now() + ttlMs);
  await pool.query(
    `INSERT INTO refresh_tokens (token, user_id, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET expires_at = $3`,
    [token, userId, expiresAt]
  );
}

/**
 * Verificar se um refresh token é válido e não expirou
 * @param {string} token
 * @returns {Promise<{ userId: number }|null>}
 */
async function get(token) {
  const result = await pool.query(
    `SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );
  if (result.rows.length === 0) return null;
  return { userId: result.rows[0].user_id };
}

/**
 * Invalidar um refresh token (logout)
 * @param {string} token
 */
async function revoke(token) {
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}

/**
 * Limpar tokens expirados (executar periodicamente via cron)
 */
async function purgeExpired() {
  try {
    const result = await pool.query('DELETE FROM refresh_tokens WHERE expires_at <= NOW()');
    if (result.rowCount > 0) {
      logger.info(`[tokenStore] ${result.rowCount} refresh token(s) expirado(s) removido(s)`);
    }
  } catch (err) {
    logger.error('[tokenStore] Erro ao limpar tokens expirados:', { message: err.message });
  }
}

module.exports = { set, get, revoke, purgeExpired };
