// server/db.js
const { Pool, types } = require('pg');
require('dotenv').config();
const logger = require('./utils/logger');

// Return DATE columns as plain strings (YYYY-MM-DD) instead of JS Date objects.
// Without this, pg converts "2026-04-05" to a UTC midnight Date which in UTC+1
// serialises as "2026-04-04T23:00:00.000Z", shifting the date back by one day.
types.setTypeParser(1082, (val) => val);

if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
  logger.error('ERRO FATAL: DATABASE_URL ou DB_PASSWORD não está definido nas variáveis de ambiente.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  logger.error('ERRO FATAL: JWT_SECRET não está definido nas variáveis de ambiente.');
  process.exit(1);
}

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || process.env.DB_NAME || 'meclinic_db',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool({
  ...poolConfig,
  // CONFIGURAÇÕES DE RESILIÊNCIA DA BASE DE DADOS
  max: 10,                        // Serverless: menos conexões simultâneas
  idleTimeoutMillis: 30000,       // Fecha conexões inativas
  connectionTimeoutMillis: 5000,  // Tempo máximo de espera para ligar
});

// PREVENÇÃO DE CRASHES: Se a base de dados for abaixo, o Node.js não desliga, apenas regista o erro
pool.on('error', (err, client) => {
  logger.error('ERRO CRÍTICO NA BASE DE DADOS: A ligação caiu!', { message: err.message });
});

module.exports = pool;