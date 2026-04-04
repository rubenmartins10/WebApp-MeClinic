/**
 * Configuração de Base de Dados - MeClinic
 * Centraliza configurações para desenvolvimento, testes e produção
 */

const Pool = require('pg').Pool;

/**
 * Pool de conexão para PostgreSQL
 * Variáveis de Ambiente Esperadas:
 * - DB_HOST: localhost (padrão)
 * - DB_PORT: 5432 (padrão)
 * - DB_USER: postgres
 * - DB_PASSWORD: senha da BD
 * - DB_NAME: meclinic
 * - DB_POOL_SIZE: 10 (padrão)
 * - DB_SSL: false (padrão em dev)
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'meclinic',
  max: parseInt(process.env.DB_POOL_SIZE) || 10,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Tratamento de erros
pool.on('error', (err) => {
  console.error('Erro na chamada de cliente idle:', err);
});

module.exports = pool;
