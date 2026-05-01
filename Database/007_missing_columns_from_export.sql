-- Migration 007: Colunas em falta descobertas durante exportação de dados
-- Executar ANTES do data_import_supabase.sql

-- pacientes: campos clínicos e de registo
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS notas_clinicas TEXT,
  ADD COLUMN IF NOT EXISTS odontograma_dados JSONB DEFAULT '{}';

-- consultas: campos adicionais
ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS diagnostico TEXT,
  ADD COLUMN IF NOT EXISTS tratamento TEXT;

-- modelos_procedimento: preço de serviço
ALTER TABLE modelos_procedimento
  ADD COLUMN IF NOT EXISTS preco_servico DECIMAL(10,2) DEFAULT 0.00;

-- produtos: categoria (texto) e data de validade
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
  ADD COLUMN IF NOT EXISTS data_validade DATE;

-- faturacao: a tabela local tem menos colunas que a do Supabase,
-- as colunas extra (status, notas, created_at) já existem com DEFAULT, não há problema

-- utilizadores: campos de reset de password e assinatura
ALTER TABLE utilizadores
  ADD COLUMN IF NOT EXISTS reset_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP,
  ADD COLUMN IF NOT EXISTS assinatura TEXT,
  ADD COLUMN IF NOT EXISTS assinatura_base64 TEXT;
