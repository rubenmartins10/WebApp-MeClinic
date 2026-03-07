-- 1. Tabela com os nomes dos procedimentos (Fichas Técnicas)
CREATE TABLE IF NOT EXISTS modelos_procedimento (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL UNIQUE,
    custo_total_estimado DECIMAL(10,2) DEFAULT 0.00
);

-- 2. Tabela com os itens detalhados de cada ficha técnica
CREATE TABLE IF NOT EXISTS modelo_procedimento_itens (
    id SERIAL PRIMARY KEY,
    modelo_id INTEGER REFERENCES modelos_procedimento(id) ON DELETE CASCADE,
    nome_item VARCHAR(150) NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    preco_total_item DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

-- Inserir Consulta de Avaliação
WITH proc AS (
    INSERT INTO modelos_procedimento (nome, custo_total_estimado) 
    VALUES ('Consulta Avaliação', 0.62) RETURNING id
)
INSERT INTO modelo_procedimento_itens (modelo_id, nome_item, quantidade, preco_unitario)
SELECT id, item, qtd, preco FROM proc, (VALUES 
    ('Kit Prospecção', 1, 0.33),
    ('Luvas', 2, 0.15),
    ('Aspirador Saliva', 1, 0.03),
    ('Babete', 1, 0.03),
    ('Copo Plástico', 1, 0.02),
    ('Colutório', 1, 0.02),
    ('Água', 1, 0.02),
    ('Luz', 1, 0.02)
) AS t(item, qtd, preco);

-- Inserir Exodontia
WITH proc AS (
    INSERT INTO modelos_procedimento (nome, custo_total_estimado) 
    VALUES ('Exodontia', 7.74) RETURNING id
)
INSERT INTO modelo_procedimento_itens (modelo_id, nome_item, quantidade, preco_unitario)
SELECT id, item, qtd, preco FROM proc, (VALUES 
    ('Sutura Seda', 1, 1.53),
    ('Spongostan', 1, 2.11),
    ('Anestesia x2', 1, 3.00),
    ('Agulha', 1, 0.12),
    ('Lâmina', 1, 0.33),
    ('Kit Cirurgia', 1, 0.33),
    ('Luvas x2', 1, 0.15),
    ('Consumíveis Base (Copo, Babete, etc)', 1, 0.17)
) AS t(item, qtd, preco);