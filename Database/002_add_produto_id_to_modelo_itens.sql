-- Add produto_id FK to modelo_procedimento_itens so stock deduction is reliable.
-- Run once. Safe to re-run (IF NOT EXISTS guard).

ALTER TABLE modelo_procedimento_itens
  ADD COLUMN IF NOT EXISTS produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL;

-- Back-fill existing rows where nome_item matches a product name exactly
UPDATE modelo_procedimento_itens mpi
SET produto_id = p.id
FROM produtos p
WHERE mpi.produto_id IS NULL
  AND LOWER(TRIM(mpi.nome_item)) = LOWER(TRIM(p.nome));
