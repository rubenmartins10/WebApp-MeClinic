const Faturacao = require('../models/Faturacao');
const Consulta = require('../models/Consulta');
const Paciente = require('../models/Paciente');
const Produto = require('../models/Produto');
const { AppError } = require('../errorHandler');
const pool = require('../db');
const { sendEmail, dataUriToBuffer } = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * FaturaçãoController - Lógica de faturação e pagamentos
 */
class FaturaçãoController {
  /**
   * GET /api/faturacao
   * Listar todas as faturas
   */
  static async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.metodo_pagamento) filters.metodo_pagamento = req.query.metodo_pagamento;

      const faturas = await Faturacao.findAll(filters, limit, offset);
      const total = await Faturacao.count(filters);

      res.json({
        faturas,
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
   * GET /api/faturacao/:id
   * Obter detalhes de uma fatura
   */
  static async getById(req, res, next) {
    try {
      const fatura = await Faturacao.findById(req.params.id);
      
      if (!fatura) {
        throw new AppError('Fatura não encontrada', 404);
      }

      res.json(fatura);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/faturacao/paciente/:pacienteId
   * Listar faturas de um paciente
   */
  static async getByPaciente(req, res, next) {
    try {
      const paciente = await Paciente.findById(req.params.pacienteId);
      if (!paciente) {
        throw new AppError('Paciente não encontrado', 404);
      }

      const faturas = await Faturacao.findByPaciente(req.params.pacienteId);
      
      res.json({
        paciente_id: req.params.pacienteId,
        faturas,
        total: faturas.length
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/faturacao/pendentes
   * Listar faturas pendentes
   */
  static async getPending(req, res, next) {
    try {
      const faturas = await Faturacao.getPending();
      
      res.json({
        faturas,
        total: faturas.length
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/faturacao/estatisticas/resumo
   * Obter estatísticas de faturação
   */
  static async getStatistics(req, res, next) {
    try {
      const stats = await Faturacao.getStatistics();
      
      res.json({
        resumo: stats,
        percentual_pago: stats.total_faturas > 0 
          ? ((stats.paga / stats.total_faturas) * 100).toFixed(2) 
          : 0
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/faturacao
   * Criar fatura
   */
  static async create(req, res, next) {
    try {
      const { consulta_id, paciente_id, paciente_nome, procedimento_nome, valor_total, metodo_pagamento } = req.body;

      // Validar que consulta existe
      const consulta = await Consulta.findById(consulta_id);
      if (!consulta) {
        throw new AppError('Consulta não encontrada', 404);
      }

      const fatura = await Faturacao.create({
        consulta_id,
        paciente_id,
        paciente_nome,
        procedimento_nome,
        valor_total,
        metodo_pagamento
      });

      res.status(201).json({
        message: 'Fatura criada com sucesso!',
        fatura
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/faturacao/:id
   * Atualizar fatura
   */
  static async update(req, res, next) {
    try {
      const fatura = await Faturacao.findById(req.params.id);
      if (!fatura) {
        throw new AppError('Fatura não encontrada', 404);
      }

      const updated = await Faturacao.update(req.params.id, req.body);

      res.json({
        message: 'Fatura atualizada com sucesso!',
        fatura: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/faturacao/:id/marcar-paga
   * Marcar fatura como paga
   */
  static async marcarPaga(req, res, next) {
    try {
      const fatura = await Faturacao.findById(req.params.id);
      if (!fatura) {
        throw new AppError('Fatura não encontrada', 404);
      }

      const updated = await Faturacao.marcarPaga(req.params.id, req.body.data_pagamento || null);

      res.json({
        message: 'Fatura marcada como paga!',
        fatura: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/faturacao/checkout
   * Checkout completo - finaliza consulta, cria fatura, abate stock, envia email
   * OPERAÇÃO COMPLEXA COM TRANSAÇÃO
   */
  static async checkout(req, res, next) {
    const client = await pool.connect();
    try {
      const {
        consulta_id,
        paciente_nome,
        procedimento_nome,
        valor_total,
        metodo_pagamento,
        email_destino,
        enviar_receita_email,
        pdfBase64,
        materiais_gastos,
        exame_nome,
        exame_base64,
        receita_nome,
        receita_base64
      } = req.body;

      await client.query('BEGIN');

      try {
        // 1. Marca consulta como realizada
        await client.query(
          'UPDATE consultas SET status = $1 WHERE id = $2',
          ['realizada', consulta_id]
        );

        // 2. Regista fatura
        const faturaResult = await client.query(
          `INSERT INTO faturacao 
           (consulta_id, paciente_nome, procedimento_nome, valor_total, metodo_pagamento, data_emissao)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING *`,
          [
            consulta_id,
            paciente_nome,
            procedimento_nome || 'Consulta Geral',
            parseFloat(valor_total) || 0,
            metodo_pagamento || 'Multibanco'
          ]
        );

        // 3. Abate materiais do stock com lock pessimista para evitar race conditions
        if (materiais_gastos && Array.isArray(materiais_gastos) && materiais_gastos.length > 0) {
          for (const item of materiais_gastos) {
            if (parseFloat(item.quantidade) > 0) {
              const prodRes = await client.query(
                'SELECT id FROM produtos WHERE nome = $1 FOR UPDATE',
                [item.nome_item]
              );
              if (prodRes.rows.length > 0) {
                const deduction = parseFloat(item.quantidade);
                await client.query(
                  'UPDATE produtos SET stock_atual = GREATEST(0, stock_atual - $1) WHERE id = $2',
                  [deduction, prodRes.rows[0].id]
                );
              }
            }
          }
        }

        // 4. Guarda exames e receitas
        const getPaciente = await client.query(
          'SELECT paciente_id FROM consultas WHERE id = $1',
          [consulta_id]
        );

        if (getPaciente.rows.length > 0) {
          const pId = getPaciente.rows[0].paciente_id;

          if (exame_base64 && exame_nome) {
            await client.query(
              'INSERT INTO exames_paciente (paciente_id, nome_exame, arquivo_base64) VALUES ($1, $2, $3)',
              [pId, exame_nome, exame_base64]
            );
          }

          if (receita_base64 && receita_nome) {
            await client.query(
              'INSERT INTO exames_paciente (paciente_id, nome_exame, arquivo_base64) VALUES ($1, $2, $3)',
              [pId, receita_nome, receita_base64]
            );
          }
        }

        await client.query('COMMIT');

        // 5. Envia email com PDF em anexo (fora da transação — falha não reverte a fatura)
        if (email_destino && pdfBase64) {
          try {
            const isOrcamento = (metodo_pagamento === 'Orçamento a Aprovar');
            const attachments = [];

            if (pdfBase64) {
              attachments.push({
                filename: isOrcamento
                  ? `Orcamento_${paciente_nome.replace(/\s+/g, '_')}.pdf`
                  : `Fatura_${paciente_nome.replace(/\s+/g, '_')}.pdf`,
                content: dataUriToBuffer(pdfBase64),
              });
            }

            if (receita_base64 && receita_nome) {
              attachments.push({
                filename: receita_nome,
                content: dataUriToBuffer(receita_base64),
              });
            }

            const subject = isOrcamento
              ? `MeClinic \u2014 Plano de Tratamento e Orçamento`
              : `MeClinic \u2014 Fatura/Recibo da sua Consulta`;

            const html = `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <div style="background:#2563eb;padding:24px;border-radius:8px 8px 0 0">
                  <h1 style="color:white;margin:0;font-size:22px">MeClinic</h1>
                </div>
                <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
                  <p>Exmo(a) <strong>${paciente_nome}</strong>,</p>
                  ${
                    isOrcamento
                      ? `<p>Em anexo encontra o seu <strong>Plano de Tratamento e Orçamento</strong> detalhado, elaborado após a sua avaliação na MeClinic.</p>
                         <p>Para agendar o início do tratamento, responda a este email ou contacte-nos.</p>`
                      : `<p>Em anexo encontra a <strong>fatura/recibo</strong> referente à sua consulta de <em>${procedimento_nome || 'Consulta'}</em>.</p>
                         <p>Obrigado por nos ter escolhido. Estamos sempre disponíveis para qualquer esclarecimento.</p>`
                  }
                  <p style="margin-top:32px;color:#64748b;font-size:12px">MeClinic &mdash; Medicina Dentária Avançada</p>
                </div>
              </div>`;

            await sendEmail(email_destino, subject, html, attachments);
          } catch (emailErr) {
            // Email falhou mas a fatura já foi guardada — apenas log, não é erro fatal
            logger.error('Falha ao enviar email após checkout:', { message: emailErr.message });
          }
        }

        res.status(201).json({
          message: 'Check-out concluído com sucesso!',
          fatura: faturaResult.rows[0]
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    } catch (err) {
      next(err);
    } finally {
      client.release();
    }
  }

  /**
   * DELETE /api/faturacao/:id
   * Deletar fatura
   */
  static async delete(req, res, next) {
    try {
      const fatura = await Faturacao.findById(req.params.id);
      if (!fatura) {
        throw new AppError('Fatura não encontrada', 404);
      }

      await Faturacao.delete(req.params.id);

      res.json({
        message: 'Fatura removida com sucesso!'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = FaturaçãoController;
