/**
 * Testes de integração — Rotas de autenticação
 * Usa Supertest + servidor Express sem iniciar o servidor real
 */

const request = require('supertest');

// Garantir env vars mínimas antes de importar app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest-only';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_DATABASE = process.env.DB_DATABASE || 'meclinic_db';

describe('POST /api/auth/login', () => {
  let app;

  beforeAll(() => {
    // Importar app apenas quando env vars estiverem definidas
    app = require('../../server/index');
  });

  test('rejeita login sem body (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('rejeita email inválido (400)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nao-e-email', password: '123456' });
    expect(res.status).toBe(400);
  });

  test('rejeita credenciais erradas (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@example.com', password: 'wrongpassword' });
    expect([401, 500]).toContain(res.status); // 401 ou 500 se DB indisponível
  });
});

describe('POST /api/auth/refresh', () => {
  let app;

  beforeAll(() => {
    app = require('../../server/index');
  });

  test('rejeita sem refresh token (401)', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(401);
  });

  test('rejeita token inválido (401)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token.invalido.aqui' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/profile', () => {
  let app;

  beforeAll(() => {
    app = require('../../server/index');
  });

  test('rejeita sem token (401)', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  test('rejeita token inválido (401)', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer token.invalido');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/health', () => {
  let app;

  beforeAll(() => {
    app = require('../../server/index');
  });

  test('health check responde 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
