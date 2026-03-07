
-- 1. categorias 
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- 2. utilizadores
CREATE TABLE IF NOT EXISTS utilizadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- Req-02: Segurança 
    role VARCHAR(20) CHECK (role IN ('Admin', 'Assistente')), 
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. pacientes 
CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    nif VARCHAR(20) UNIQUE,
    sns_numero VARCHAR(20),
    data_nascimento DATE,
    telefone VARCHAR(20),
    email VARCHAR(150)
);

-- 4. fornecedores 
CREATE TABLE IF NOT EXISTS fornecedores (
    id SERIAL PRIMARY KEY,
    nome_empresa VARCHAR(200) NOT NULL,
    nif VARCHAR(20) UNIQUE,
    email_contacto VARCHAR(150),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE
);

-- 5. produtos
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER REFERENCES categorias(id),
    nome VARCHAR(200) NOT NULL,
    codigo_barras VARCHAR(50) UNIQUE, -- Para o leitor  
    stock_atual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5, -- Para os alertas Req-10 
    unidade_medida VARCHAR(20),
    descricao TEXT,
    deleted_at TIMESTAMP
);

-- 6. fichas_tecnicas 
CREATE TABLE IF NOT EXISTS fichas_tecnicas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id),
    user_id INTEGER REFERENCES utilizadores(id),
    data_procedimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes_clinicas TEXT
);

-- 7. ficha_itens [cite: 378, 407]
CREATE TABLE IF NOT EXISTS ficha_itens (
    id SERIAL PRIMARY KEY,
    ficha_id INTEGER REFERENCES fichas_tecnicas(id),
    produto_id INTEGER REFERENCES produtos(id),
    quantidade_consumida INTEGER NOT NULL,
    lote_utilizado VARCHAR(50)
);

-- 8. movimentos_stock 
CREATE TABLE IF NOT EXISTS movimentos_stock (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos(id),
    user_id INTEGER REFERENCES utilizadores(id),
    fornecedor_id INTEGER REFERENCES fornecedores(id),
    tipo VARCHAR(10) CHECK (tipo IN ('Entrada', 'Saída')),
    quantidade INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. logs_sistema 
CREATE TABLE IF NOT EXISTS logs_sistema (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES utilizadores(id),
    acao TEXT NOT NULL,
    detalhes JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);