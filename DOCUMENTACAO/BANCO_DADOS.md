# 🗄️ Banco de Dados PostgreSQL

Documentação completa do schema, tabelas e relacionamentos do MeClinic.

## 📊 Visão Geral

**SGBD:** PostgreSQL 12+  
**Database:** meclinic_db  
**Encoding:** UTF-8  
**Timezone:** UTC  

### Estatísticas

| Métrica | Valor |
|---------|-------|
| Tabelas | 5+ principais |
| Relacionamentos | 1:N, N:M (em futuro) |
| Índices | 10+ |
| Triggers | 2+ |
| Max Conexões | 20 |
| Timeout Inativo | 30 segundos |

## 👤 Tabela: `utilizadores`

Armazena informações dos usuários do sistema com suporte a 2FA.

```sql
CREATE TABLE utilizadores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,              -- bcryptjs hash
  role VARCHAR(20) DEFAULT 'assistente',    -- admin, dentista, assistente
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT true,
  
  -- 2FA
  secret_2fa VARCHAR(32),                   -- Speakeasy secret
  backup_codes TEXT,                        -- Códigos de backup (JSON)
  
  -- Reset de senha
  reset_code VARCHAR(10),
  reset_expires TIMESTAMP,
  
  -- Assinatura digital
  assinatura_base64 TEXT,
  
  -- Auditoria
  ultimo_login TIMESTAMP,
  ip_ultimo_login VARCHAR(45)
);
```

### Colunas Importantes

- **id:** Identificador única
- **email:** Único para evitar duplicatas
- **senha:** Sempre criptografada com bcryptjs
- **role:** Define permissões:
  - `admin` - Acesso completo
  - `dentista` - Acesso clínico completo
  - `assistente` - Acesso limitado
- **secret_2fa:** Token secreto para geração de TOTP
- **assinatura_base64:** Base64 da assinatura digital do utilizador

### Índices

```sql
CREATE INDEX idx_utilizadores_email ON utilizadores(email);
CREATE INDEX idx_utilizadores_role ON utilizadores(role);
```

---

## 🏥 Tabela: `pacientes`

Dados demográficos e clínicos dos pacientes.

```sql
CREATE TABLE pacientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  data_nascimento DATE NOT NULL,
  email VARCHAR(100),
  telefone VARCHAR(20),
  morada VARCHAR(255),
  codigo_postal VARCHAR(10),
  cidade VARCHAR(50),
  nif VARCHAR(20),
  
  -- Dados clínicos
  tipo_sanguineo VARCHAR(5),
  alergias TEXT,
  medicacoes_atuais TEXT,
  historico_medico TEXT,
  notas_clinicas TEXT DEFAULT '',
  
  -- Odontograma
  odontograma_dados TEXT DEFAULT '{}',     -- JSON com estado de cada dente
  
  -- Administrativo
  utilizador_criador_id INT REFERENCES utilizadores(id),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_ultima_consulta DATE,
  
  -- Status
  ativo BOOLEAN DEFAULT true
);
```

### Colunas Importantes

- **data_nascimento:** Permite calcular idade
- **alergias/medicacoes_atuais:** Crítico para segurança
- **odontograma_dados:** JSON com estado de cada dente (32 total)
  ```json
  {
    "1": "saudavel",
    "2": "carie",
    "3": "falta",
    ...
  }
  ```
- **notas_clinicas:** Observações do dentista

### Índices

```sql
CREATE INDEX idx_pacientes_email ON pacientes(email);
CREATE INDEX idx_pacientes_nif ON pacientes(nif);
CREATE INDEX idx_pacientes_data_criacao ON pacientes(data_criacao);
```

---

## 📅 Tabela: `consultas`

Registro de todas as consultas/procedimentos realizados.

```sql
CREATE TABLE consultas (
  id SERIAL PRIMARY KEY,
  paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  utilizador_id INT NOT NULL REFERENCES utilizadores(id),
  
  data_consulta TIMESTAMP NOT NULL,
  tipo_consulta VARCHAR(50),               -- 'limpeza', 'preenchimento', 'extracção', etc
  duracao_minutos INT DEFAULT 30,
  
  -- Procedimentos
  procedimentos TEXT,                      -- Descrição dos procedimentos
  diagnostico TEXT,
  prescricao TEXT,
  notas VARCHAR(1000),
  
  -- Valores
  valor_cobrado NUMERIC(8, 2),
  desconto NUMERIC(5, 2) DEFAULT 0,
  
  -- Assinatura
  assinatura_base64 TEXT,
  assinado_por INT REFERENCES utilizadores(id),
  data_assinatura TIMESTAMP,
  
  -- Status
  confirmada BOOLEAN DEFAULT false,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Colunas Importantes

- **paciente_id:** Foreign key para pacientes
- **utilizador_id:** Dentista que atendeu
- **tipo_consulta:** Categoriza tipo de procedimento
- **assinatura_base64:** Assinatura digital do dentista
- **confirmada:** Flag se participante confirmou

### Índices

```sql
CREATE INDEX idx_consultas_paciente_id ON consultas(paciente_id);
CREATE INDEX idx_consultas_utilizador_id ON consultas(utilizador_id);
CREATE INDEX idx_consultas_data ON consultas(data_consulta);
```

---

## 📦 Tabela: `produtos`

Inventário de medicamentos, equipamentos e descartáveis.

```sql
CREATE TABLE produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  
  -- Stock
  stock_atual NUMERIC(10, 3) DEFAULT 0,
  stock_minimo NUMERIC(10, 3) DEFAULT 10,
  unidade_medida VARCHAR(20) DEFAULT 'unidade',
  
  -- Preços
  preco_unitario NUMERIC(8, 2) NOT NULL,
  preco_custounitario NUMERIC(8, 2),
  
  -- Categorização
  categoria VARCHAR(100) DEFAULT 'Descartáveis',
  
  -- Validade
  data_validade DATE,
  lote VARCHAR(50),
  
  -- Imagem
  imagem_url TEXT,
  codigo_barras VARCHAR(50),
  
  -- Fornecedor
  fornecedor VARCHAR(100),
  
  -- Administrativo
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT true
);
```

### Categorias Automáticas

O sistema categoriza automaticamente produtos por:
- **Esterilização** - Mangas, desinfetantes, autoclaves
- **Anestesia** - Agulhas, seringas, carpules
- **Materiais** - Resinas, cimentos
- **Descartáveis** - Luvas, máscaras, bibs
- **Equipamento** - Máquinas, instrumentos

### Índices

```sql
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigo_barras);
```

### Auto-Categorização

Trigger automático categoriza ao inserir:

```sql
-- Ao inserir/atualizar, verifica nome e define categoria
-- Exemplos:
-- Nome "Manga esterilização" → categoria = 'Esterilização'
-- Nome "Carpule anestesia" → categoria = 'Anestesia'
```

---

## 💰 Tabela: `faturas`

Faturação e receitas emitidas.

```sql
CREATE TABLE faturas (
  id SERIAL PRIMARY KEY,
  numero_fatura VARCHAR(20) UNIQUE NOT NULL,  -- ex: INV-2024-001
  
  -- Referências
  paciente_id INT NOT NULL REFERENCES pacientes(id),
  utilizador_id INT NOT NULL REFERENCES utilizadores(id),
  
  -- Datas
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE,
  data_pagamento DATE,
  
  -- Valores
  subtotal NUMERIC(10, 2),
  taxa_iva NUMERIC(5, 2),
  total NUMERIC(10, 2) NOT NULL,
  
  -- Detalhes
  descricao TEXT,
  condicoes_pagamento VARCHAR(50),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pendente',     -- pendente, pago, cancelado
  
  -- Notas
  notas TEXT,
  
  -- PDF
  pdf_base64 TEXT,
  
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Status Possíveis

- `pendente` - Não paga
- `pago` - Pagamento recebido
- `cancelado` - Anulada
- `atrasada` - Vencida e não paga

### Índices

```sql
CREATE INDEX idx_faturas_numero ON faturas(numero_fatura);
CREATE INDEX idx_faturas_paciente_id ON faturas(paciente_id);
CREATE INDEX idx_faturas_data_emissao ON faturas(data_emissao);
CREATE INDEX idx_faturas_status ON faturas(status);
```

---

## 📸 Tabela: `exames_paciente`

Upload e armazenamento de exames (radiografias, etc).

```sql
CREATE TABLE exames_paciente (
  id SERIAL PRIMARY KEY,
  paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  
  nome_exame VARCHAR(255) NOT NULL,
  tipo_exame VARCHAR(50),                 -- 'raio-x', 'ortopantomografia', etc
  data_exame DATE DEFAULT CURRENT_DATE,
  
  -- Arquivo
  arquivo_base64 TEXT NOT NULL,            -- Imagem em base64
  formato_arquivo VARCHAR(10),             -- 'jpg', 'png', 'pdf'
  tamanho_bytes INT,
  
  -- Metadados
  notas TEXT,
  utilizador_criador_id INT REFERENCES utilizadores(id),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tipos de Exame

- `raio-x` - Radiografia simples
- `ortopantomografia` - Panorâmica
- `tomografia` - Tomografia computadorizada
- `fotografia` - Foto clínica

---

## 🔗 Relacionamentos

### Diagrama ER

```
utilizadores (1) ────────────┐
                              │
pacientes (1) ───────┐        │
                     │        │
                     └────> consultas (N)
                              │
                              └────> utilizadores (1)


pacientes (1) ────────────────┐
                              │
                              └────> exames_paciente (N)


produtos (1) ────────────────┐
                             │
                             └────> itens_fatura (N)  [futuro]


pacientes (1) ────────────────┐
                              │
                              └────> faturas (N)
                                     │
                                     └────> utilizadores (1)
```

### Cascata de Deletar

- Deletar paciente → Deleta consultas e exames
- Deletar utilizador → Não deleta registros (preserva auditoria)
- Deletar produto → Mantém referências em faturas (histórico)

---

## 📈 Queries Úteis

### Listar Pacientes com Consultas

```sql
SELECT 
  p.nome,
  COUNT(c.id) as total_consultas,
  MAX(c.data_consulta) as ultima_consulta
FROM pacientes p
LEFT JOIN consultas c ON p.id = c.paciente_id
GROUP BY p.id
ORDER BY total_consultas DESC;
```

### Produtos com Stock Mínimo

```sql
SELECT nome, stock_atual, stock_minimo, categoria
FROM produtos
WHERE stock_atual <= stock_minimo AND ativo = true
ORDER BY stock_atual ASC;
```

### Faturação por Período

```sql
SELECT 
  DATE_TRUNC('month', data_emissao) as mes,
  COUNT(*) as total_faturas,
  SUM(total) as receita_total
FROM faturas
WHERE status = 'pago'
GROUP BY DATE_TRUNC('month', data_emissao)
ORDER BY mes DESC;
```

### Utilizadores e Consultas Realizadas

```sql
SELECT 
  u.nome,
  u.role,
  COUNT(c.id) as consultas_realizadas,
  SUM(c.valor_cobrado) as receita_gerada
FROM utilizadores u
LEFT JOIN consultas c ON u.id = c.utilizador_id
GROUP BY u.id
ORDER BY consultas_realizadas DESC;
```

### Pacientes com Alergias

```sql
SELECT nome, email, telefone, alergias
FROM pacientes
WHERE alergias IS NOT NULL AND alergias != ''
ORDER BY nome;
```

---

## 🔐 Segurança

### Chaves Estrangeiras

Todas as relações usam FK com ON DELETE CASCADE/RESTRICT:

```sql
ALTER TABLE consultas 
  ADD CONSTRAINT fk_consultas_paciente 
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE;
```

### Índices para Performance

Índices em:
- Colunas frequentemente consultadas (email, nif)
- Foreign keys (paciente_id, utilizador_id)
- Datas de filtros (data_consulta, data_emissao)

### Validação de Dados

```sql
-- Email válido (básico)
ADD CONSTRAINT ck_email_format 
  CHECK (email LIKE '%@%.%');

-- Preços positivos
ADD CONSTRAINT ck_preco_positivo 
  CHECK (preco_unitario > 0);

-- Stock não negativo
ADD CONSTRAINT ck_stock_nao_negativo 
  CHECK (stock_atual >= 0);
```

---

## 🚀 Otimizações Implementadas

### 1. Connection Pooling

```javascript
// server/db.js
const pool = new Pool({
  max: 20,                    // Máximo 20 conexões
  idleTimeoutMillis: 30000,   // Fecha após 30s inativo
  connectionTimeoutMillis: 2000
});
```

### 2. Prepared Statements

Todas as queries usam placeholders para evitar SQL injection:

```javascript
// ✅ CORRETO
await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);

// ❌ ERRADO
await pool.query(`SELECT * FROM pacientes WHERE id = ${id}`);
```

### 3. Índices Múltiplos

Índices combinados para queries comuns:

```sql
CREATE INDEX idx_consultas_paciente_data 
  ON consultas(paciente_id, data_consulta DESC);
```

---

## 📊 Migração de Dados

### Script de Setup

```bash
# Criar database
createdb -U postgres meclinic_db

# Executar script principal
psql -U postgres -d meclinic_db -f Database/Tables.sql

# Inserir dados de teste (opcional)
psql -U postgres -d meclinic_db -f Database/2\ products\ test.sql
```

### Backup

```bash
# Fazer backup
pg_dump -U postgres meclinic_db > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U postgres -d meclinic_db < backup.sql
```

---

## 📋 Próximas Melhorias

- [ ] Particionamento por ano para tabela `consultas`
- [ ] View para "últimas consultas por paciente"
- [ ] Trigger para sincronizar `data_ultima_consulta` em pacientes
- [ ] Tabela `auditoria` para rastrear todas as mudanças
- [ ] Relacionamento N:M entre produtos e faturas com quantidade

---

**Última atualização:** Abril 2026
