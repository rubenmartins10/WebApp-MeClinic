-- Tabelas em falta no Tables.sql original
-- Correr DEPOIS de Tables.sql

-- modelos_procedimento (fichas técnicas / procedimentos)
CREATE TABLE IF NOT EXISTS modelos_procedimento (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL UNIQUE,
    custo_total_estimado DECIMAL(10,2) DEFAULT 0.00
);

-- modelo_procedimento_itens (itens de cada procedimento)
CREATE TABLE IF NOT EXISTS modelo_procedimento_itens (
    id SERIAL PRIMARY KEY,
    modelo_id INTEGER REFERENCES modelos_procedimento(id) ON DELETE CASCADE,
    nome_item VARCHAR(150) NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    preco_total_item DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

-- consultas
CREATE TABLE IF NOT EXISTS consultas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    procedimento_id INTEGER REFERENCES modelos_procedimento(id) ON DELETE SET NULL,
    data_consulta DATE NOT NULL,
    hora_consulta TIME,
    motivo TEXT,
    notas TEXT,
    status VARCHAR(20) DEFAULT 'agendada',
    preco DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id   ON consultas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data_consulta ON consultas (data_consulta);

-- faturacao
CREATE TABLE IF NOT EXISTS faturacao (
    id SERIAL PRIMARY KEY,
    consulta_id INTEGER REFERENCES consultas(id) ON DELETE SET NULL,
    paciente_nome VARCHAR(150),
    procedimento_nome VARCHAR(150),
    valor_total DECIMAL(10,2) DEFAULT 0.00,
    metodo_pagamento VARCHAR(50) DEFAULT 'Multibanco',
    status VARCHAR(20) DEFAULT 'pago',
    notas TEXT,
    data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_faturacao_consulta_id  ON faturacao (consulta_id);
CREATE INDEX IF NOT EXISTS idx_faturacao_data_emissao ON faturacao (data_emissao);

-- exames_paciente
CREATE TABLE IF NOT EXISTS exames_paciente (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    nome_exame VARCHAR(255),
    data_exame DATE DEFAULT CURRENT_DATE,
    arquivo_base64 TEXT
);
