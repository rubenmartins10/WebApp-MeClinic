const Consulta = require('../models/Consulta');
const Paciente = require('../models/Paciente');
const pool = require('../db');
const { AppError } = require('../errorHandler');

/**
 * ConsultasController - Lógica de consultas
 */
class ConsultasController {
  /**
   * GET /api/consultas
   * Listar todas as consultas
   */
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.data) filters.data_consulta = req.query.data;
      if (req.query.paciente_id) filters.paciente_id = req.query.paciente_id;

      const consultas = await Consulta.findAll(filters, limit, offset);
      const total = await Consulta.count(filters);

      res.json({
        consultas,
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
   * GET /api/consultas/:id
   * Obter detalhes de uma consulta
   */
  static async getById(req, res, next) {
    try {
      const consulta = await Consulta.findById(req.params.id);
      
      if (!consulta) {
        throw new AppError('Consulta não encontrada', 404);
      }

      res.json(consulta);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/consultas/paciente/:pacienteId
   * Listar consultas de um paciente
   */
  static async getByPaciente(req, res, next) {
    try {
      const pacienteId = req.params.pacienteId;

      const paciente = await Paciente.findById(pacienteId);
      if (!paciente) {
        throw new AppError('Paciente não encontrado', 404);
      }

      const consultas = await Consulta.findByPaciente(pacienteId);
      
      res.json({
        paciente_id: pacienteId,
        consultas,
        total: consultas.length
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/consultas/data/:data
   * Listar consultas por data (agenda do dia)
   */
  static async getByData(req, res, next) {
    try {
      const data = req.params.data;

      // Validar formato YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        throw new AppError('Data deve estar em formato YYYY-MM-DD', 400);
      }

      const consultas = await Consulta.findByData(data);
      
      res.json({
        data,
        consultas,
        total: consultas.length
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/consultas
   * Criar nova consulta
   */
  static async create(req, res, next) {
    try {
      const { nome, email, telefone, data, hora, motivo, procedimento_id } = req.body;

      // Encontrar paciente pelo telefone, ou criar se não existir
      const existingResult = await pool.query(
        'SELECT id FROM pacientes WHERE telefone = $1 LIMIT 1',
        [telefone]
      );

      let paciente_id;
      if (existingResult.rows.length > 0) {
        paciente_id = existingResult.rows[0].id;
      } else {
        const novoPaciente = await Paciente.create({ nome, telefone, email: email || null });
        paciente_id = novoPaciente.id;
      }

      // Validar conflito de horário
      const hasConflict = await Consulta.hasConflict(data, hora);
      if (hasConflict) {
        throw new AppError('Já existe uma consulta nesta data e hora', 409);
      }

      const procedimentoId = procedimento_id && procedimento_id !== '' ? parseInt(procedimento_id, 10) : null;

      const consulta = await Consulta.create({
        paciente_id,
        data_consulta: data,
        hora_consulta: hora,
        motivo: motivo || null,
        procedimento_id: procedimentoId,
      });

      res.status(201).json({
        message: 'Consulta criada com sucesso!',
        consulta
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/consultas/:id
   * Atualizar consulta
   */
  static async update(req, res, next) {
    try {
      const consulta = await Consulta.findById(req.params.id);
      if (!consulta) {
        throw new AppError('Consulta não encontrada', 404);
      }

      // Mapear campos do cliente para campos da BD
      const data_consulta = req.body.data || req.body.data_consulta;
      const hora_consulta = req.body.hora || req.body.hora_consulta;

      // Se mudou data/hora, verificar conflito
      if (data_consulta || hora_consulta) {
        const data = data_consulta || consulta.data_consulta;
        const hora = hora_consulta || consulta.hora_consulta;
        const hasConflict = await Consulta.hasConflict(data, hora, req.params.id);
        if (hasConflict) {
          throw new AppError('Já existe uma consulta nesta data e hora', 409);
        }
      }

      const procedimentoId = req.body.procedimento_id && req.body.procedimento_id !== ''
        ? parseInt(req.body.procedimento_id, 10)
        : undefined;

      const updated = await Consulta.update(req.params.id, {
        data_consulta,
        hora_consulta,
        motivo: req.body.motivo,
        procedimento_id: procedimentoId,
      });

      // Atualizar email/telefone do paciente se foram enviados
      if (consulta.paciente_id) {
        const camposAtualizar = [];
        const valoresAtualizar = [];
        if (req.body.email !== undefined && req.body.email !== null) {
          camposAtualizar.push(`email = $${valoresAtualizar.length + 1}`);
          valoresAtualizar.push(req.body.email);
        }
        if (req.body.telefone !== undefined && req.body.telefone !== null) {
          camposAtualizar.push(`telefone = $${valoresAtualizar.length + 1}`);
          valoresAtualizar.push(req.body.telefone);
        }
        if (camposAtualizar.length > 0) {
          valoresAtualizar.push(consulta.paciente_id);
          await pool.query(
            `UPDATE pacientes SET ${camposAtualizar.join(', ')} WHERE id = $${valoresAtualizar.length}`,
            valoresAtualizar
          );
        }
      }

      res.json({
        message: 'Consulta atualizada com sucesso!',
        consulta: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/consultas/:id/marcar-realizada
   * Marcar consulta como realizada com diagnóstico
   */
  static async marcarRealizada(req, res, next) {
    try {
      const { diagnostico, tratamento } = req.body;

      if (!diagnostico) {
        throw new AppError('Diagnóstico é obrigatório', 400);
      }

      const updated = await Consulta.marcarRealizada(req.params.id, diagnostico, tratamento || null);

      res.json({
        message: 'Consulta marcada como realizada!',
        consulta: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/consultas/:id/confirmar
   * Confirmar consulta
   */
  static async confirmar(req, res, next) {
    try {
      const updated = await Consulta.confirmar(req.params.id);

      res.json({
        message: 'Consulta confirmada!',
        consulta: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/consultas/:id/cancelar
   * Cancelar consulta
   */
  static async cancelar(req, res, next) {
    try {
      const updated = await Consulta.cancelar(req.params.id);

      res.json({
        message: 'Consulta cancelada!',
        consulta: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/consultas/:id
   * Deletar consulta
   */
  static async delete(req, res, next) {
    try {
      const consulta = await Consulta.findById(req.params.id);
      if (!consulta) {
        throw new AppError('Consulta não encontrada', 404);
      }

      await Consulta.delete(req.params.id);

      res.json({
        message: 'Consulta removida com sucesso!'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ConsultasController;
