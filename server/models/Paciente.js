const pool = require('../db');

/**
 * Modelo Paciente
 * Centraliza todas as operações de BD relacionadas com pacientes
 */
class Paciente {
  /**
   * Criar novo paciente
   */
  static async create(data) {
    const { nome, telefone, email, data_nascimento, nif, sns_numero, notas_clinicas } = data;
    
    const result = await pool.query(
      `INSERT INTO pacientes (nome, telefone, email, data_nascimento, nif, sns_numero, notas_clinicas, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [nome, telefone || null, email || null, data_nascimento || null, nif || null, sns_numero || null, notas_clinicas || '']
    );
    
    return result.rows[0];
  }

  /**
   * Buscar paciente por ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM pacientes WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Listar todos os pacientes com estatísticas
   */
  static async findAll(limit = 100, offset = 0) {
    const result = await pool.query(`
      SELECT 
        p.id, p.nome, p.telefone, p.email, p.data_nascimento, p.nif, p.sns_numero,
        p.notas_clinicas, p.odontograma_dados, p.created_at,
        COUNT(c.id)::int as total_consultas,
        COALESCE(SUM(f.valor_total), 0)::float as total_faturado,
        MAX(c.data_consulta) as ultima_consulta
      FROM pacientes p
      LEFT JOIN consultas c ON p.id = c.paciente_id
      LEFT JOIN faturacao f ON c.id = f.consulta_id
      GROUP BY p.id
      ORDER BY p.nome ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    return result.rows;
  }

  /**
   * Buscar pacientes por nome (search)
   */
  static async search(term) {
    const result = await pool.query(
      `SELECT p.id, p.nome, p.email, p.telefone, p.created_at
       FROM pacientes p
       WHERE p.nome ILIKE $1 OR p.email ILIKE $1
       ORDER BY p.nome ASC
       LIMIT 50`,
      [`%${term}%`]
    );
    
    return result.rows;
  }

  /**
   * Atualizar dados do paciente
   */
  static async update(id, data) {
    const { nome, telefone, email, data_nascimento, endereco, cidade, nif, notas_clinicas } = data;
    
    const result = await pool.query(
      `UPDATE pacientes 
       SET nome = COALESCE($1, nome),
           telefone = COALESCE($2, telefone),
           email = COALESCE($3, email),
           data_nascimento = COALESCE($4, data_nascimento),
           endereco = COALESCE($5, endereco),
           cidade = COALESCE($6, cidade),
           nif = COALESCE($7, nif),
           notas_clinicas = COALESCE($8, notas_clinicas)
       WHERE id = $9
       RETURNING *`,
      [nome, telefone, email, data_nascimento, endereco, cidade, nif, notas_clinicas, id]
    );
    
    return result.rows[0];
  }

  /**
   * Atualizar notas clínicas
   */
  static async updateNotas(id, notas) {
    const result = await pool.query(
      'UPDATE pacientes SET notas_clinicas = $1 WHERE id = $2 RETURNING *',
      [notas, id]
    );
    
    return result.rows[0];
  }

  /**
   * Atualizar odontograma
   */
  static async updateOdontograma(id, dados) {
    const result = await pool.query(
      'UPDATE pacientes SET odontograma_dados = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(dados), id]
    );
    
    return result.rows[0];
  }

  /**
   * Buscar histórico de consultas
   */
  static async getHistorico(id) {
    const result = await pool.query(`
      SELECT 
        c.id, c.data_consulta, c.hora_consulta, c.status, c.diagnostico,
        m.nome as procedimento_nome,
        u.nome as dentista_nome
      FROM consultas c
      LEFT JOIN modelos_procedimento m ON c.procedimento_id = m.id
      LEFT JOIN utilizadores u ON c.dentista_id = u.id
      WHERE c.paciente_id = $1
      ORDER BY c.data_consulta DESC, c.hora_consulta DESC
    `, [id]);
    
    return result.rows;
  }

  /**
   * Adicionar exame
   */
  static async addExame(pacienteId, nome, base64) {
    const result = await pool.query(
      `INSERT INTO exames_paciente (paciente_id, nome_exame, arquivo_base64, data_exame)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, nome_exame, data_exame`,
      [pacienteId, nome, base64]
    );
    
    return result.rows[0];
  }

  /**
   * Listar exames do paciente
   */
  static async getExames(id) {
    const result = await pool.query(
      `SELECT id, nome_exame, data_exame, arquivo_base64
       FROM exames_paciente
       WHERE paciente_id = $1
       ORDER BY data_exame DESC`,
      [id]
    );
    
    return result.rows;
  }

  /**
   * Deletar exame
   */
  static async deleteExame(id) {
    await pool.query(
      'DELETE FROM exames_paciente WHERE id = $1',
      [id]
    );
  }

  /**
   * Deletar paciente e todas as dependências
   */
  static async delete(id) {
    // Iniciar transação
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Deletar em cascata
      await client.query('DELETE FROM exames_paciente WHERE paciente_id = $1', [id]);
      await client.query('DELETE FROM faturacao WHERE consulta_id IN (SELECT id FROM consultas WHERE paciente_id = $1)', [id]);
      await client.query('DELETE FROM consultas WHERE paciente_id = $1', [id]);
      await client.query('DELETE FROM pacientes WHERE id = $1', [id]);
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Contar total de pacientes
   */
  static async count() {
    const result = await pool.query('SELECT COUNT(*) as total FROM pacientes');
    return parseInt(result.rows[0].total);
  }
}

module.exports = Paciente;
