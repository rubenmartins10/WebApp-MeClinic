const pool = require('./db');

async function checkSchema() {
  try {
    console.log('\n📋 === VERIFICAR SCHEMA DAS TABELAS ===\n');

    // Verificar colunas de modelo_procedimento_itens
    console.log('📌 Colunas em modelo_procedimento_itens:');
    const itemsSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'modelo_procedimento_itens'
      ORDER BY ordinal_position
    `);
    console.log(itemsSchema.rows);

    // Verificar se há dados na tabela
    console.log('\n📌 Dados na tabela modelo_procedimento_itens:');
    const allItems = await pool.query('SELECT * FROM modelo_procedimento_itens');
    console.log(`Total de registos: ${allItems.rows.length}`);
    if (allItems.rows.length > 0) {
      console.log('Primeiros 5 registos:');
      console.log(JSON.stringify(allItems.rows.slice(0, 5), null, 2));
    }

    console.log('\n✅ Schema verificado!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkSchema();
