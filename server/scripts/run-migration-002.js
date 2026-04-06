require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || process.env.DB_NAME || 'meclinic_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE modelo_procedimento_itens
        ADD COLUMN IF NOT EXISTS produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL
    `);
    console.log('Coluna produto_id adicionada (ou já existia).');

    const res = await client.query(`
      UPDATE modelo_procedimento_itens mpi
      SET produto_id = p.id
      FROM produtos p
      WHERE mpi.produto_id IS NULL
        AND LOWER(TRIM(mpi.nome_item)) = LOWER(TRIM(p.nome))
      RETURNING mpi.id, mpi.nome_item, p.id AS produto_id
    `);
    console.log(`Back-fill: ${res.rowCount} item(s) ligados ao produto.`);
    if (res.rows.length > 0) {
      res.rows.forEach(r => console.log(`  - "${r.nome_item}" → produto_id ${r.produto_id}`));
    }

    await client.query('COMMIT');
    console.log('Migration concluída com sucesso.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro na migration:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
