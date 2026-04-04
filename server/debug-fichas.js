const pool = require('./db');

async function debugFichas() {
  try {
    console.log('\n📋 === DEBUG FICHAS TÉCNICAS ===\n');

    // Verificar modelos existentes
    const modelos = await pool.query('SELECT * FROM modelos_procedimento');
    console.log('📌 Modelos de Procedimento:');
    console.log(JSON.stringify(modelos.rows, null, 2));

    // Se houver modelos, verificar seus itens
    if (modelos.rows.length > 0) {
      for (const modelo of modelos.rows) {
        console.log(`\n📦 Itens do Modelo: "${modelo.nome}" (ID: ${modelo.id})`);
        const itens = await pool.query(
          `SELECT id, modelo_id, nome_item, quantidade, preco_unitario, preco_total_item
           FROM modelo_procedimento_itens
           WHERE modelo_id = $1
           ORDER BY nome_item ASC`,
          [modelo.id]
        );
        console.log(`   Total: ${itens.rows.length} item(ns)`);
        if (itens.rows.length > 0) {
          console.log(JSON.stringify(itens.rows, null, 2));
        } else {
          console.log('   ⚠️  SEM ITENS REGISTRADOS!');
        }
      }
    } else {
      console.log('  ⚠️  NENHUM MODELO ENCONTRADO!');
    }

    console.log('\n✅ Debug concluído!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
    process.exit(1);
  }
}

debugFichas();
