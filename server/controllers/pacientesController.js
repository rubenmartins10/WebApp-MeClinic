const Paciente = require('../models/Paciente');
const { AppError } = require('../errorHandler');

/**
 * PacientesController - Lógica de pacientes
 */
class PacientesController {
  /**
   * POST /api/pacientes
   * Criar novo paciente
   */
  static async create(req, res, next) {
    try {
      const paciente = await Paciente.create(req.body);
      
      res.status(201).json({
        message: 'Paciente criado com sucesso!',
        paciente
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/pacientes
   * Listar todos os pacientes com estatísticas
   */
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const pacientes = await Paciente.findAll(limit, offset);
      const total = await Paciente.count();

      res.json({
        pacientes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/pacientes/search
   * Buscar pacientes por nome ou email
   */
  static async search(req, res, next) {
    try {
      const term = req.query.q;
      
      if (!term || term.length < 2) {
        throw new AppError('Termo de busca deve ter pelo menos 2 caracteres', 400);
      }

      const pacientes = await Paciente.search(term);
      
      res.json({
        query: term,
        results: pacientes,
        count: pacientes.length
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/pacientes/:id
   * Obter detalhes de um paciente
   */
  static async getById(req, res, next) {
    try {
      const paciente = await Paciente.findById(req.params.id);
      
      if (!paciente) {
        throw new AppError('Paciente não encontrado', 404, { id: req.params.id });
      }

      res.json(paciente);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/pacientes/:id/dados
   * Atualizar dados do paciente
   */
  static async updateDados(req, res, next) {
    try {
      const paciente = await Paciente.findById(req.params.id);
      
      if (!paciente) {
        throw new AppError('Paciente não encontrado', 404);
      }

      const updated = await Paciente.update(req.params.id, req.body);
      
      res.json({
        message: 'Dados atualizados com sucesso!',
        paciente: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/pacientes/:id/notas
   * Atualizar notas clínicas
   */
  static async updateNotas(req, res, next) {
    try {
      const paciente = await Paciente.findById(req.params.id);
      
      if (!paciente) {
        throw new AppError('Paciente não encontrado', 404);
      }

      const { notas } = req.body;
      
      if (!notas || typeof notas !== 'string') {
        throw new AppError('Campo notas é obrigatório e deve ser texto', 400);
      }

      const updated = await Paciente.updateNotas(req.params.id, notas);
      
      res.json({
        message: 'Notas atualizadas com sucesso!',
        paciente: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/pacientes/:id/odontograma
   * Atualizar odontograma
   */
  static async updateOdontograma(req, res, next) {
    try {
      const paciente = await Paciente.findById(req.params.id);
      
      if (!paciente) {
        throw new AppError('Paciente não encontrado', 404);
      }

      const { dados } = req.body;
      
      if (!dados) {
        throw new AppError('Campo dados do odontograma é obrigatório', 400);
      }

      const updated = await Paciente.updateOdontograma(req.params.id, dados);
      
      res.json({
        message: 'Odontograma guardado com sucesso!',
        paciente: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/pacientes/:id/historico
   * Obter histórico de consultas
   */
  static async getHistorico(req, res, next) {
    try {
      const paciente = await Paciente.findById(req.params.id);
      
      if (!paciente) {
        throw new AppError('Paciente não encontrado', 404);
      }

      const historico = await Paciente.getHistorico(req.params.id);
      
      res.json({
        paciente_id: req.params.id,
        consultas: historico,
        total: historico.length
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/pacientes/:id/exames
   * Adicionar exame
   */
  static async addExame(req, res, next) {
    try {
      const paciente = await Paciente.findById(req.params.id);
      
      if (!paciente) {
        throw new AppError('Paciente não encontrado', 404);
      }

      const { nome, base64 } = req.body;
      
      if (!nome || !base64) {
        throw new AppError('Nome e base64 do exame são obrigatórios', 400);
      }

      const exame = await Paciente.addExame(req.params.id, nome, base64);
      
      res.status(201).json({
        message: 'Exame adicionado com sucesso!',
        exame
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/pacientes/:id/exames
   * Listar exames
   */
  static async getExames(req, res, next) {
    try {
      const paciente = await Paciente.findById(req.params.id);
      
      if (!paciente) {
        throw new AppError('Paciente não encontrado', 404);
      }

      const exames = await Paciente.getExames(req.params.id);
      
      res.json({
        paciente_id: req.params.id,
        exames,
        total: exames.length
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/pacientes/exames/:idExame
   * Deletar exame
   */
  static async deleteExame(req, res, next) {
    try {
      await Paciente.deleteExame(req.params.idExame);
      
      res.json({
        message: 'Exame removido com sucesso!'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/pacientes/:id
   * Deletar paciente (e todas as dependências)
   */
  static async delete(req, res, next) {
    try {
      const paciente = await Paciente.findById(req.params.id);
      
      if (!paciente) {
        throw new AppError('Paciente não encontrado', 404);
      }

      await Paciente.delete(req.params.id);
      
      res.json({
        message: 'Paciente e todos os seus registos foram removidos com sucesso!'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PacientesController;
