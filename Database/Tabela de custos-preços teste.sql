-- Garante que a coluna existe
ALTER TABLE modelos_procedimento ADD COLUMN IF NOT EXISTS preco_servico DECIMAL(10,2) DEFAULT 0.00;

-- Atualiza os preços de venda para cada procedimento
UPDATE modelos_procedimento SET preco_servico = 45.00 WHERE nome = 'Consulta Avaliação';
UPDATE modelos_procedimento SET preco_servico = 65.00 WHERE nome = 'Exodontia';
UPDATE modelos_procedimento SET preco_servico = 55.00 WHERE nome = 'Restauracao';
UPDATE modelos_procedimento SET preco_servico = 85.00 WHERE nome = 'Endo Sessão 1';
UPDATE modelos_procedimento SET preco_servico = 75.00 WHERE nome = 'Endo Sessão 2';
UPDATE modelos_procedimento SET preco_servico = 1450.00 WHERE nome = 'Ortodontia Tradicional TP';
UPDATE modelos_procedimento SET preco_servico = 1200.00 WHERE nome = 'Cirurgia Implante';

-- Verifica se os dados estão corretos
SELECT nome, custo_total_estimado as custo_material, preco_servico as preco_venda 
FROM modelos_procedimento;