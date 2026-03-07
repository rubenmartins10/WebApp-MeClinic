-- Adicionar preço que a clínica cobra ao paciente por cada procedimento
ALTER TABLE modelos_procedimento ADD COLUMN preco_servico DECIMAL(10,2) DEFAULT 0.00;

-- Exemplo: Atualizar alguns preços para teste
UPDATE modelos_procedimento SET preco_servico = 50.00 WHERE nome = 'Consulta Avaliação';
UPDATE modelos_procedimento SET preco_servico = 80.00 WHERE nome = 'Exodontia';
UPDATE modelos_procedimento SET preco_servico = 1500.00 WHERE nome = 'Ortodontia Tradicional TP';