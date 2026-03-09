-- 1. Cria a coluna 'role' e define que, por defeito, toda a gente nova é 'ASSISTENTE'
ALTER TABLE utilizadores ADD COLUMN role VARCHAR(50) DEFAULT 'ASSISTENTE';

-- 2. Transforma a tua própria conta (o primeiro utilizador do sistema) no ADMIN supremo para não perderes o acesso!
UPDATE utilizadores SET role = 'ADMIN' WHERE id = 1;