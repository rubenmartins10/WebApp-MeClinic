/**
 * Script para aplicar migrations ao banco de dados
 * Execute com: node apply-migrations.js
 */

const pool = require('./db');

async function runMigrations() {
  console.log('🔄 Iniciando migrations...\n');

  try {
    // Migration 1: Criar tabela activity_log
    console.log('📋 Criando tabela activity_log...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
        action_type VARCHAR(50) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        device_info VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        status VARCHAR(20) DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(100)
      );
    `);
    console.log('✅ Tabela activity_log criada com sucesso\n');

    // Criar índices para melhor performance
    console.log('📑 Criando índices...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
      CREATE INDEX IF NOT EXISTS idx_activity_log_session_id ON activity_log(session_id);
      CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON activity_log(action_type);
    `);
    console.log('✅ Índices criados com sucesso\n');

    console.log('✨ Todas as migrations foram aplicadas com sucesso!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Erro ao aplicar migrations:', err.message);
    process.exit(1);
  }
}

runMigrations();
