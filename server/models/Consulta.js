const pool = require('../db');

/**
 * Modelo Consulta
 * Centraliza todas as operações de BD relacionadas com consultas
 */
class Consulta {
  /**
   * Criar nova consulta
   */
  static async create(data) {
    const { paciente_id, data_consulta, hora_consulta, motivo, procedimento_id, diagnostico, tratamento, preco } = data;
    
    const result = await pool.query(
      `INSERT INTO consultas (paciente_id, data_consulta, hora_consulta, motivo, procedimento_id, diagnostico, tratamento, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'agendada', NOW())
       RETURNING *`,
      [paciente_id, data_consulta, hora_consulta, motivo || null, procedimento_id || null, diagnostico || null, tratamento || null]
    );
    
    return result.rows[0];
  }

  /**
   * Buscar consulta por ID
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT c.*, p.nome as paciente_nome, p.telefone, p.email, m.nome as procedimento_nome, m.custo_total_estimado
       FROM consultas c
       LEFT JOIN pacientes p ON c.paciente_id = p.id
       LEFT JOIN modelos_procedimento m ON c.procedimento_id = m.id
       WHERE c.id = $1`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Listar todas as consultas com filtros opcionais
   */
  static async findAll(filters = {}, limit = 100, offset = 0) {
    let query = `
      SELECT c.id, p.nome as paciente_nome, p.telefone, p.email,
             c.data_consulta, c.hora_consulta, c.motivo, c.status, c.procedimento_id,
             m.nome as procedimento_nome, m.custo_total_estimado as preco_estimado
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN modelos_procedimento m ON c.procedimento_id = m.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.status) {
      query += ` AND c.status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    if (filters.data_consulta) {
      query += ` AND c.data_consulta = $${params.length + 1}`;
      params.push(filters.data_consulta);
    }
    
    if (filters.paciente_id) {
      query += ` AND c.paciente_id = $${params.length + 1}`;
      params.push(filters.paciente_id);
    }
    
    query += ` ORDER BY c.data_consulta ASC, c.hora_consulta ASC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Listar consultas de um paciente
   */
  static async findByPaciente(pacienteId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT c.*, m.nome as procedimento_nome
       FROM consultas c
       LEFT JOIN modelos_procedimento m ON c.procedimento_id = m.id
       WHERE c.paciente_id = $1
       ORDER BY c.data_consulta DESC
       LIMIT $2 OFFSET $3`,
      [pacienteId, limit, offset]
    );
    
    return result.rows;
  }

  /**
   * Listar consultas por data
   */
  static async findByData(data) {
    const result = await pool.query(
      `SELECT c.id, p.nome as paciente_nome, c.hora_consulta, c.status, c.motivo
       FROM consultas c
       JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.data_consulta = $1
       ORDER BY c.hora_consulta ASC`,
      [data]
    );
    
    return result.rows;
  }

  /**
   * Atualizar consulta
   */
  static async update(id, data) {
    const { paciente_id, data_consulta, hora_consulta, motivo, procedimento_id, diagnostico, tratamento, status } = data;
    
    const result = await pool.query(
      `UPDATE consultas
       SET paciente_id = COALESCE($1, paciente_id),
           data_consulta = COALESCE($2, data_consulta),
           hora_consulta = COALESCE($3, hora_consulta),
           motivo = COALESCE($4, motivo),
           procedimento_id = COALESCE($5, procedimento_id),
           diagnostico = COALESCE($6, diagnostico),
           tratamento = COALESCE($7, tratamento),
           status = COALESCE($8, status),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [paciente_id, data_consulta, hora_consulta, motivo, procedimento_id, diagnostico, tratamento, status, id]
    );
    
    return result.rows[0];
  }

  /**
   * Atualizar status da consulta
   */
  static async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE consultas SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    return result.rows[0];
  }

  /**
   * Marcar como realizada
   */
  static async marcarRealizada(id, diagnostico, tratamento) {
    const result = await pool.query(
      `UPDATE consultas
       SET status = 'realizada', diagnostico = $1, tratamento = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [diagnostico, tratamento, id]
    );
    
    return result.rows[0];
  }

  /**
   * Confirmar consulta
   */
  static async confirmar(id) {
    return this.updateStatus(id, 'confirmada');
  }

  /**
   * Cancelar consulta
   */
  static async cancelar(id) {
    return this.updateStatus(id, 'cancelada');
  }

  /**
   * Deletar consulta
   */
  static async delete(id) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Deletar faturação associada
      await client.query('DELETE FROM faturacao WHERE consulta_id = $1', [id]);
      
      // Deletar consulta
      await client.query('DELETE FROM consultas WHERE id = $1', [id]);
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Contar total de consultas
   */
  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM consultas WHERE 1=1';
    const params = [];
    
    if (filters.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].total);
  }

  /**
   * Verificar conflito de horário
   */
  static async hasConflict(data_consulta, hora_consulta, excludeId = null) {
    let query = `SELECT COUNT(*) as count FROM consultas 
                 WHERE data_consulta = $1 AND hora_consulta = $2`;
    const params = [data_consulta, hora_consulta];
    
    if (excludeId) {
      query += ` AND id != $3`;
      params.push(excludeId);
    }
    
    const result = await pool.query(query, params);
    return result.rows[0].count > 0;
  }
}

module.exports = Consulta;
