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
    const result = await pool.query(
      "SELECT id, email, recovery_code, recovery_code_expires FROM utilizadores WHERE email='teste@meclinic.pt'"
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n📋 Recovery Code Encontrado:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Recovery Code: ${user.recovery_code}`);
      console.log(`   Expires: ${user.recovery_code_expires}`);
      console.log('\n✅ Use este código para resetar a password!\n');
    } else {
      console.log('❌ Utilizador não encontrado ou sem código de recovery');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
})();
