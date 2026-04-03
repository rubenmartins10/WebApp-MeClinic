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
    // Obter schema da tabela
    const schemaResult = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='utilizadores' ORDER BY ordinal_position"
    );
    
    console.log('\n📋 Colunas da tabela utilizadores:');
    schemaResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Tentar obter dados do utilizador
    console.log('\n📊 Dados do utilizador:');
    const userResult = await pool.query(
      "SELECT * FROM utilizadores WHERE email='teste@meclinic.pt'"
    );
    
    if (userResult.rows.length > 0) {
      console.log(JSON.stringify(userResult.rows[0], null, 2));
    } else {
      console.log('❌ Utilizador não encontrado');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
})();
