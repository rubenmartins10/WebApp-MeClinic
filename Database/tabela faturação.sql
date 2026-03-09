-- 1. Adiciona o estado à consulta (para sabermos se já foi paga)
ALTER TABLE consultas ADD COLUMN status VARCHAR(50) DEFAULT 'AGENDADA';

-- 2. Cria a tabela do Histórico de Faturação
CREATE TABLE faturacao (
    id SERIAL PRIMARY KEY,
    consulta_id INT REFERENCES consultas(id) ON DELETE SET NULL,
    paciente_nome VARCHAR(255),
    procedimento_nome VARCHAR(255),
    valor_total DECIMAL(10,2),
    metodo_pagamento VARCHAR(50) DEFAULT 'Multibanco',
    data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);