/**
 * API Service - Centraliza todos os fetch calls com autenticação
 * Suporta renovação automática de access token via refresh token
 */

const getToken = () => localStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

const setToken = (token) => localStorage.setItem('token', token);

const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('meclinic_user');
  window.location.href = '/';
};

const tryRefreshToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) return false;
    const data = await res.json();
    setToken(data.token);
    return true;
  } catch {
    return false;
  }
};

const apiCall = async (url, method = 'GET', body = null, headers = {}, isRetry = false) => {
  const token = getToken();
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...headers
  };

  const config = {
    method,
    headers: defaultHeaders
  };

  if (body) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(url, config);

  // Tentar renovar token automaticamente em 401
  if (res.status === 401 && !isRetry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiCall(url, method, body, headers, true);
    clearAuth();
    throw new Error('Sessão expirada. Por favor faça login novamente.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
};

export const apiService = {
  // GET requests
  get: (url, headers) => apiCall(url, 'GET', null, headers),

  // POST requests
  post: (url, body, headers) => apiCall(url, 'POST', body, headers),

  // PUT requests
  put: (url, body, headers) => apiCall(url, 'PUT', body, headers),

  // DELETE requests
  delete: (url, headers) => apiCall(url, 'DELETE', null, headers),

  // Helper to extract array from paginated responses
  getArray: (data) => {
    if (Array.isArray(data)) return data;
    if (data && data.produtos) return data.produtos;
    if (data && data.pacientes) return data.pacientes;
    if (data && data.consultas) return data.consultas;
    if (data && data.utilizadores) return data.utilizadores;
    if (data && data.faturacao) return data.faturacao;
    return [];
  }
};

export default apiService;
