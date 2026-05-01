-- Migration 006: Colunas em falta nas tabelas existentes
-- Seguro para re-executar (IF NOT EXISTS em todos)

-- utilizadores: MFA
ALTER TABLE utilizadores
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mfa_secret  VARCHAR(255);

-- utilizadores: telefone
ALTER TABLE utilizadores
  ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);

-- utilizadores: perfil (nome legível do role, ex: 'Admin', 'Assistente')
ALTER TABLE utilizadores
  ADD COLUMN IF NOT EXISTS perfil VARCHAR(50);

-- produtos: imagem
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS imagem_url TEXT;
