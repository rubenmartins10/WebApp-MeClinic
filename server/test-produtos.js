const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  password: '3rubendavid',
  host: 'localhost',
  port: 5432,
  database: 'meclinic_db'
});

(async () => {
  try {
    // Test findAll query como faz no modelo
    const query = 'SELECT * FROM produtos WHERE 1=1 ORDER BY nome ASC LIMIT $1 OFFSET $2';
    const result = await pool.query(query, [20, 0]);
    console.log('✅ Query resultado:', result.rows.length, 'produtos');
    console.log('📦 Primeiros 3:', result.rows.slice(0, 3).map(p => p.nome));
    
    // Test the actual API response
    console.log('\n🔍 Testando API endpoint...');
    const Produto = require('./models/Produto');
    const produtos = await Produto.findAll({}, 20, 0);
    console.log('✅ Modelo resultado:', produtos.length, 'produtos');
    console.log('📦 Primeiros 3:', produtos.slice(0, 3).map(p => p.nome));
    
    await pool.end();
  } catch(e) {
    console.error('❌ Erro:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
