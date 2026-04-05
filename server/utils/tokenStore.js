/**
 * Token Store - armazenamento em memória de refresh tokens
 * Adequado para instalação de clínica single-server.
 * Os tokens são invalidados no restart do servidor (comportamento esperado).
 */

/**
 * Map de refreshToken → { userId, expiresAt }
 */
const store = new Map();

/**
 * Registar um novo refresh token
 * @param {string} token
 * @param {number} userId
 * @param {number} ttlMs - duração em milissegundos
 */
function set(token, userId, ttlMs) {
  store.set(token, { userId, expiresAt: Date.now() + ttlMs });
}

/**
 * Verificar se um refresh token é válido e não expirou
 * @param {string} token
 * @returns {{ userId: number }|null}
 */
function get(token) {
  const entry = store.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(token);
    return null;
  }
  return { userId: entry.userId };
}

/**
 * Invalidar um refresh token (logout)
 * @param {string} token
 */
function revoke(token) {
  store.delete(token);
}

/**
 * Limpar tokens expirados (executar periodicamente)
 */
function purgeExpired() {
  const now = Date.now();
  for (const [token, entry] of store) {
    if (now > entry.expiresAt) store.delete(token);
  }
}

// Limpar expirados a cada 30 minutos
setInterval(purgeExpired, 30 * 60 * 1000);

module.exports = { set, get, revoke };
