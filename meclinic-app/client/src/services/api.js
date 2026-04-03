/**
 * API Service - Centraliza todos os fetch calls com autenticação
 */

const getToken = () => localStorage.getItem('token');

const apiCall = async (url, method = 'GET', body = null, headers = {}) => {
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
  const data = await res.json();

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
