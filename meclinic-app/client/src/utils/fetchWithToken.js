/**
 * Fetch wrapper que adiciona Bearer token automaticamente
 * Substitui o fetch global para garantir autenticação em todos os requests
 */

const originalFetch = window.fetch;

export const fetchWithToken = (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  return originalFetch(url, options)
    .then(res => {
      if (res.status === 401) {
        console.error('[FETCH] 401 Unauthorized - Token inválido ou expirado');
        localStorage.removeItem('token');
        localStorage.removeItem('meclinic_user');
        window.location.href = '/auth';
      }
      return res;
    })
    .catch(err => {
      console.error('[FETCH ERROR]', err);
      throw err;
    });
};

// Substituir o fetch global
window.fetch = fetchWithToken;

export default fetchWithToken;
