const pool = require('../db');

/**
 * Produto Model - Gestão de produtos e stock
 */
class Produto {
  /**
   * Criar novo produto
   */
  static async create(data) {
    const {
      nome,
      codigo_barras,
      stock_atual,
      stock_minimo,
      unidade_medida,
      imagem_url,
      categoria,
      data_validade
    } = data;

    const query = `
      INSERT INTO produtos 
      (nome, codigo_barras, stock_atual, stock_minimo, unidade_medida, imagem_url, categoria, data_validade)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      nome,
      codigo_barras || null,
      stock_atual || 0,
      stock_minimo || 5,
      unidade_medida || 'un',
      imagem_url || '',
      categoria || 'Descartáveis',
      data_validade || null
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Erro ao criar produto: ${err.message}`);
    }
  }

  /**
   * Obter produto por ID
   */
  static async findById(id) {
    const query = `
      SELECT * FROM produtos WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (err) {
      throw new Error(`Erro ao buscar produto: ${err.message}`);
    }
  }

  /**
   * Obter todos os produtos com paginação
   */
  static async findAll(filters = {}, limit = 20, offset = 0) {
    let query = 'SELECT * FROM produtos WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.categoria) {
      paramCount++;
      query += ` AND categoria = $${paramCount}`;
      values.push(filters.categoria);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (nome ILIKE $${paramCount} OR codigo_barras = $${paramCount + 1})`;
      values.push(`%${filters.search}%`, filters.search);
      paramCount++;
    }

    query += ` ORDER BY nome ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (err) {
      throw new Error(`Erro ao listar produtos: ${err.message}`);
    }
  }

  /**
   * Procurar produto por código de barras exato
   */
  static async findByBarcode(codigo_barras) {
    const query = `SELECT * FROM produtos WHERE codigo_barras = $1 LIMIT 1`;
    try {
      const result = await pool.query(query, [codigo_barras]);
      return result.rows[0] || null;
    } catch (err) {
      throw new Error(`Erro ao procurar produto por código de barras: ${err.message}`);
    }
  }

  /**
   * Procurar produtos por nome ou código de barras
   */
  static async findByName(nome) {
    const query = `
      SELECT * FROM produtos 
      WHERE nome ILIKE $1 OR codigo_barras = $2
      ORDER BY nome ASC
    `;

    try {
      const result = await pool.query(query, [`%${nome}%`, nome]);
      return result.rows;
    } catch (err) {
      throw new Error(`Erro ao procurar produto: ${err.message}`);
    }
  }

  /**
   * Atualizar produto
   */
  static async update(id, data) {
    const allowedFields = [
      'nome',
      'codigo_barras',
      'stock_atual',
      'stock_minimo',
      'unidade_medida',
      'imagem_url',
      'categoria',
      'data_validade'
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
      UPDATE produtos 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Erro ao atualizar produto: ${err.message}`);
    }
  }

  /**
   * Atualizar stock do produto
   */
  static async updateStock(id, quantity, operation = 'add') {
    if (operation !== 'add' && operation !== 'remove') {
      throw new Error('Operação inválida. Use "add" ou "remove"');
    }

    const operator = operation === 'add' ? '+' : '-';
    const query = `
      UPDATE produtos 
      SET stock_atual = stock_atual ${operator} $1
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [quantity, id]);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Erro ao atualizar stock: ${err.message}`);
    }
  }

  /**
   * Obter alertas de stock baixo
   */
  static async getLowStockAlerts() {
    const query = `
      SELECT id, nome, stock_atual, stock_minimo, categoria
      FROM produtos
      WHERE stock_atual <= stock_minimo
      ORDER BY stock_atual ASC
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (err) {
      throw new Error(`Erro ao obter alertas de stock: ${err.message}`);
    }
  }

  /**
   * Obter produtos por categoria
   */
  static async findByCategory(categoria) {
    const query = `
      SELECT * FROM produtos 
      WHERE categoria = $1
      ORDER BY nome ASC
    `;

    try {
      const result = await pool.query(query, [categoria]);
      return result.rows;
    } catch (err) {
      throw new Error(`Erro ao buscar categoria: ${err.message}`);
    }
  }

  /**
   * Contar total de produtos
   */
  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM produtos WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.categoria) {
      paramCount++;
      query += ` AND categoria = $${paramCount}`;
      values.push(filters.categoria);
    }

    if (filters.lowStock) {
      query += ` AND stock_atual <= stock_minimo`;
    }

    try {
      const result = await pool.query(query, values);
      return parseInt(result.rows[0].total, 10);
    } catch (err) {
      throw new Error(`Erro ao contar produtos: ${err.message}`);
    }
  }

  /**
   * Deletar produto
   */
  static async delete(id) {
    const query = `
      DELETE FROM produtos WHERE id = $1 RETURNING id
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Erro ao deletar produto: ${err.message}`);
    }
  }

  /**
   * Obter categorias únicas
   */
  static async getCategories() {
    const query = `
      SELECT DISTINCT categoria FROM produtos WHERE categoria IS NOT NULL
      ORDER BY categoria ASC
    `;

    try {
      const result = await pool.query(query);
      return result.rows.map(row => row.categoria);
    } catch (err) {
      throw new Error(`Erro ao obter categorias: ${err.message}`);
    }
  }

  /**
   * Verificar se produto tem stock disponível
   */
  static async hasStock(id, quantity = 1) {
    const query = `
      SELECT stock_atual FROM produtos WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      if (!result.rows[0]) return false;
      return result.rows[0].stock_atual >= quantity;
    } catch (err) {
      throw new Error(`Erro ao verificar stock: ${err.message}`);
    }
  }
}

module.exports = Produto;
