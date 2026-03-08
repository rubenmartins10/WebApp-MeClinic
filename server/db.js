// server/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  // CORREÇÃO: Adicionado o process.env.DB_DATABASE para coincidir com o teu ficheiro .env
  database: process.env.DB_DATABASE || process.env.DB_NAME || 'meclinic_db',
  password: process.env.DB_PASSWORD || '3rubendavid',
  port: process.env.DB_PORT || 5432,
  
  // CONFIGURAÇÕES DE RESILIÊNCIA DA BASE DE DADOS
  max: 20, // Limita o número de conexões em simultâneo
  idleTimeoutMillis: 30000, // Fecha conexões inativas para não sobrecarregar o PostgreSQL
  connectionTimeoutMillis: 2000, // Tempo máximo de espera para tentar ligar
});

// PREVENÇÃO DE CRASHES: Se a base de dados for abaixo, o Node.js não desliga, apenas regista o erro
pool.on('error', (err, client) => {
  console.error('⚠️ ERRO CRÍTICO NA BASE DE DADOS: A ligação caiu!', err.message);
});

module.exports = pool;