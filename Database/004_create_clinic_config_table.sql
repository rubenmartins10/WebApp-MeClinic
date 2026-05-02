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
  ('nif',       '501234567'),
  ('telefone',  '+351 912 345 678'),
  ('email',     'geral@meclinic.pt'),
  ('morada',    'Avenida da Liberdade, Lisboa\nPortugal'),
  ('timezone',  'Europe/Lisbon')
ON CONFLICT (chave) DO NOTHING;
