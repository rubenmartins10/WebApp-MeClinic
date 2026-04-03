const pool = require('../db');

/**
 * Faturacao Model - Gestão de faturas e pagamentos
 */
class Faturacao {
  /**
   * Criar fatura
   */
  static async create(data) {
    const {
      consulta_id,
      paciente_id,
      paciente_nome,
      procedimento_nome,
      valor_total,
      metodo_pagamento
    } = data;

    const query = `
      INSERT INTO faturacao
      (consulta_id, paciente_nome, procedimento_nome, valor_total, metodo_pagamento, data_emissao)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const values = [
      consulta_id,
      paciente_nome,
      procedimento_nome || 'Consulta Geral',
      parseFloat(valor_total) || 0,
      metodo_pagamento || 'Multibanco'
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Erro ao criar fatura: ${err.message}`);
    }
  }

  /**
   * Obter fatura por ID
   */
  static async findById(id) {
    const query = `
      SELECT * FROM faturacao WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (err) {
      throw new Error(`Erro ao buscar fatura: ${err.message}`);
    }
  }

  /**
   * Obter todas as faturas com paginação
   */
  static async findAll(filters = {}, limit = 20, offset = 0) {
    let query = 'SELECT * FROM faturacao WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.paciente_id) {
      paramCount++;
      query += ` AND paciente_id = $${paramCount}`;
      values.push(filters.paciente_id);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters.metodo_pagamento) {
      paramCount++;
      query += ` AND metodo_pagamento = $${paramCount}`;
      values.push(filters.metodo_pagamento);
    }

    query += ` ORDER BY data_emissao DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (err) {
      throw new Error(`Erro ao listar faturas: ${err.message}`);
    }
  }

  /**
   * Obter faturas de um paciente
   */
  static async findByPaciente(paciente_id) {
    const query = `
      SELECT f.* FROM faturacao f
      JOIN consultas c ON f.consulta_id = c.id
      WHERE c.paciente_id = $1
      ORDER BY f.data_emissao DESC
    `;

    try {
      const result = await pool.query(query, [paciente_id]);
      return result.rows;
    } catch (err) {
      throw new Error(`Erro ao buscar faturas do paciente: ${err.message}`);
    }
  }

  /**
   * Atualizar fatura
   */
  static async update(id, data) {
    const allowedFields = [
      'status',
      'metodo_pagamento',
      'valor_total',
      'procedimento_nome'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    values.push(id);
    const query = `
      UPDATE faturacao 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Erro ao atualizar fatura: ${err.message}`);
    }
  }

  /**
   * Marcar fatura como paga
   */
  static async marcarPaga(id, data_pagamento = null) {
    const query = `
      UPDATE faturacao 
      SET status = 'PAGA', data_pagamento = COALESCE($1, NOW())
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [data_pagamento, id]);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Erro ao marcar fatura como paga: ${err.message}`);
    }
  }

  /**
   * Obter faturas pendentes
   */
  static async getPending() {
    const query = `
      SELECT * FROM faturacao 
      WHERE status = 'PENDENTE'
      ORDER BY data_emissao ASC
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (err) {
      throw new Error(`Erro ao buscar faturas pendentes: ${err.message}`);
    }
  }

  /**
   * Contar total de faturas
   */
  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM faturacao WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    try {
      const result = await pool.query(query, values);
      return parseInt(result.rows[0].total, 10);
    } catch (err) {
      throw new Error(`Erro ao contar faturas: ${err.message}`);
    }
  }

  /**
   * Obter estatísticas de faturação
   */
  static async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_faturas,
        COUNT(CASE WHEN status = 'PAGA' THEN 1 END) as paga,
        COUNT(CASE WHEN status = 'PENDENTE' THEN 1 END) as pendente,
        COUNT(CASE WHEN status = 'PARCIAL' THEN 1 END) as parcial,
        COALESCE(SUM(CASE WHEN status = 'PAGA' THEN valor_total ELSE 0 END), 0) as total_recebido,
        COALESCE(SUM(CASE WHEN status = 'PENDENTE' THEN valor_total ELSE 0 END), 0) as total_pendente,
        COALESCE(SUM(valor_total), 0) as valor_total
      FROM faturacao
    `;

    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Erro ao obter estatísticas: ${err.message}`);
    }
  }

  /**
   * Obter faturas por período
   */
  static async findByPeriod(data_inicio, data_fim) {
    const query = `
      SELECT * FROM faturacao 
      WHERE data_emissao >= $1 AND data_emissao <= $2
      ORDER BY data_emissao DESC
    `;

    try {
      const result = await pool.query(query, [data_inicio, data_fim]);
      return result.rows;
    } catch (err) {
      throw new Error(`Erro ao buscar faturas por período: ${err.message}`);
    }
  }

  /**
   * Deletar fatura
   */
  static async delete(id) {
    const query = `
      DELETE FROM faturacao WHERE id = $1 RETURNING id
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Erro ao deletar fatura: ${err.message}`);
    }
  }
}

module.exports = Faturacao;
