/**
 * Testes unitários — Validação de Consultas
 */

const { createConsultaSchema, updateConsultaSchema } = require('../../server/validation/consultasValidation');

describe('createConsultaSchema', () => {
  const valid = {
    nome: 'João Silva',
    email: 'joao@example.com',
    telefone: '+351 912345678',
    data: '2026-06-01',
    hora: '10:30',
    motivo: 'Avaliação geral',
    procedimento_id: 1
  };

  test('aceita payload válido', () => {
    const { error } = createConsultaSchema.validate(valid);
    expect(error).toBeUndefined();
  });

  test('rejeita sem nome', () => {
    const { error } = createConsultaSchema.validate({ ...valid, nome: undefined });
    expect(error).toBeDefined();
  });

  test('rejeita sem telefone', () => {
    const { error } = createConsultaSchema.validate({ ...valid, telefone: undefined });
    expect(error).toBeDefined();
  });

  test('rejeita sem data', () => {
    const { error } = createConsultaSchema.validate({ ...valid, data: undefined });
    expect(error).toBeDefined();
  });

  test('rejeita data inválida', () => {
    const { error } = createConsultaSchema.validate({ ...valid, data: 'nao-e-data' });
    expect(error).toBeDefined();
  });

  test('rejeita hora em formato inválido', () => {
    const { error } = createConsultaSchema.validate({ ...valid, hora: '25:99' });
    expect(error).toBeDefined();
  });

  test('aceita sem email e sem motivo (opcionais)', () => {
    const { nome, telefone, data, hora } = valid;
    const { error } = createConsultaSchema.validate({ nome, telefone, data, hora });
    expect(error).toBeUndefined();
  });

  test('aceita procedimento_id como string numérica', () => {
    const { error } = createConsultaSchema.validate({ ...valid, procedimento_id: '3' });
    expect(error).toBeUndefined();
  });

  test('aceita procedimento_id como null', () => {
    const { error } = createConsultaSchema.validate({ ...valid, procedimento_id: null });
    expect(error).toBeUndefined();
  });
});

describe('updateConsultaSchema', () => {
  test('aceita payload parcial', () => {
    const { error } = updateConsultaSchema.validate({ motivo: 'Revisão' });
    expect(error).toBeUndefined();
  });

  test('aceita objeto vazio', () => {
    const { error } = updateConsultaSchema.validate({});
    expect(error).toBeUndefined();
  });

  test('rejeita hora inválida', () => {
    const { error } = updateConsultaSchema.validate({ hora: 'abc' });
    expect(error).toBeDefined();
  });

  test('aceita data no formato ISO', () => {
    const { error } = updateConsultaSchema.validate({ data: '2026-06-15' });
    expect(error).toBeUndefined();
  });
});
