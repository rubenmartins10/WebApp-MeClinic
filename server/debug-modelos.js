const pool = require('./db');

(async () => {
  try {
    console.log('🔍 Testando query de modelos...');
    
    const result = await pool.query(`
      SELECT id, nome, custo_total_estimado, preco_servico
      FROM modelos_procedimento
      ORDER BY nome ASC
    `);
    
    console.log('✅ Query bem-sucedida!');
    console.log('Resultado:', JSON.stringify(result.rows, null, 2));
    console.log(`Total de registos: ${result.rows.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na query:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
})();
