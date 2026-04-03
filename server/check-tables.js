const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE
});

(async () => {
  try {
    // Listar todas as tabelas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas na base de dados:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Verificar se modelos_procedimento existe
    const modelosTable = await pool.query(`
      SELECT * FROM modelos_procedimento LIMIT 5
    `).catch(() => ({ rows: [] }));
    
    console.log(`\n📊 Procedimentos em modelos_procedimento: ${modelosTable.rows.length}`);
    if (modelosTable.rows.length > 0) {
      modelosTable.rows.forEach(row => {
        console.log(`   - ${row.id}: ${row.nome}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
})();
