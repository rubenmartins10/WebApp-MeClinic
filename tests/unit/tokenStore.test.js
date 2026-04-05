/**
 * Testes unitários — tokenStore (refresh token store)
 */

const tokenStore = require('../../server/utils/tokenStore');

describe('tokenStore', () => {
  afterEach(() => {
    // Limpar entre testes usando revoke (sem expor clear)
  });

  test('set e get retornam userId correto', () => {
    tokenStore.set('tok1', 42, 60_000);
    const entry = tokenStore.get('tok1');
    expect(entry).not.toBeNull();
    expect(entry.userId).toBe(42);
    tokenStore.revoke('tok1');
  });

  test('get devolve null para token desconhecido', () => {
    expect(tokenStore.get('nao-existe')).toBeNull();
  });

  test('revoke invalida o token', () => {
    tokenStore.set('tok2', 99, 60_000);
    tokenStore.revoke('tok2');
    expect(tokenStore.get('tok2')).toBeNull();
  });

  test('token expirado é removido no get', () => {
    tokenStore.set('tok3', 7, 1); // 1ms TTL
    return new Promise(resolve => setTimeout(() => {
      expect(tokenStore.get('tok3')).toBeNull();
      resolve();
    }, 10));
  });
});
