-- ============================================
-- Migração 004: Tabela de Configuração da Clínica
-- Substitui localStorage por persistência na base de dados
-- ============================================

CREATE TABLE IF NOT EXISTS clinic_config (
  id           SERIAL PRIMARY KEY,
  chave        VARCHAR(100) NOT NULL UNIQUE,
  valor        TEXT,
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- Dados iniciais (ajustar conforme necessário)
INSERT INTO clinic_config (chave, valor) VALUES
  ('nome',      'MeClinic'),
  ('nif',       ''),
  ('telefone',  '+351 910 802 555'),
  ('email',     'geral@meclinic.pt'),
  ('morada',    'Rua Professora Rita Lopes Ribeiro Fonseca, 28
                4400-694 Vila Nova de Gaia'),
  ('timezone',  'Europe/Lisbon')
ON CONFLICT (chave) DO NOTHING;
