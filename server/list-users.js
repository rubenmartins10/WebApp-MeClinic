const pool = require('./db');

(async () => {
  try {
    console.log('🔍 Utilizadores na base de dados:\n');
    
    const result = await pool.query(`
      SELECT id, nome, email, role
      FROM utilizadores
      ORDER BY id ASC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhum utilizador encontrado');
    } else {
      result.rows.forEach(user => {
        console.log(`  ID: ${user.id}`);
        console.log(`  Nome: ${user.nome}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role}`);
        console.log('---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
})();
