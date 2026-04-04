# 📡 API REST - Documentação Completa

Referência de todos os endpoints da API MeClinic.

## 📋 Informações Gerais

**Base URL:** `http://localhost:5000` (desenvolvimento)  
**Tipo de Dados:** JSON  
**Autenticação:** JWT via header `Authorization: Bearer <token>`  
**Rate Limit:** Sem limite (implementar em produção)  

### Headers Padrão

```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGc...'  // Opcional para /auth/*
}
```

### Códigos de Resposta

| Código | Significado |
|--------|-----------|
| 200 | ✅ Sucesso |
| 201 | ✅ Criado com sucesso |
| 400 | ❌ Request inválido |
| 401 | ❌ Não autenticado |
| 403 | ❌ Acesso negado |
| 404 | ❌ Recurso não encontrado |
| 500 | ❌ Erro do servidor |

---

## 🔐 Autenticação

### POST `/auth/register`

Registrar novo utilizador.

**Request:**
```javascript
{
  nome: "João Silva",
  email: "joao@clinica.pt",
  senha: "senhaSegura123",
  role: "assistente"  // admin, dentista, assistente
}
```

**Response (200):**
```javascript
{
  message: "Utilizador registado com sucesso",
  user: {
    id: 1,
    nome: "João Silva",
    email: "joao@clinica.pt",
    role: "assistente"
  }
}
```

---

### POST `/auth/login`

Fazer login (Fase 1 de 2FA).

**Request:**
```javascript
{
  email: "admin@clinica.pt",
  senha: "admin123"
}
```

**Response (200):**
```javascript
{
  message: "2FA necessário",
  qr_code: "data:image/png;base64,iVBORw0KG...",
  secret: "ABC123XYZ789",
  email: "admin@clinica.pt"
}
```

**Errors (401):**
```javascript
{ error: "Email ou senha incorretos" }
```

---

### POST `/auth/verify-2fa`

Verificar código 2FA (Fase 2 de autenticação).

**Request:**
```javascript
{
  email: "admin@clinica.pt",
  token_2fa: "123456"  // Código do Google Authenticator
}
```

**Response (200):**
```javascript
{
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: 1,
    nome: "Admin User",
    email: "admin@clinica.pt",
    role: "admin"
  }
}
```

**Errors (401):**
```javascript
{ error: "Código 2FA inválido" }
{ error: "Código 2FA expirado" }
```

---

### POST `/auth/forgot-password`

Solicitar reset de senha.

**Request:**
```javascript
{
  email: "user@clinica.pt"
}
```

**Response (200):**
```javascript
{
  message: "Se o email existe, será enviado um link de reset"
}
```

*Nota: Não revela se o email existe (segurança)*

---

### POST `/auth/reset-password`

Resetar senha com código enviado por email.

**Request:**
```javascript
{
  email: "user@clinica.pt",
  reset_code: "1234567890",
  new_password: "novaSenha123"
}
```

**Response (200):**
```javascript
{
  message: "Senha atualizada com sucesso"
}
```

---

## 👥 Utilizadores

### GET `/utilizadores`

Listar todos os utilizadores (admin only).

**Query Params:**
- `role` - Filtro por role (admin/dentista/assistente)
- `ativo` - Filtro por status (true/false)

**Response (200):**
```javascript
[
  {
    id: 1,
    nome: "Admin",
    email: "admin@clinica.pt",
    role: "admin",
    ativo: true,
    ultimo_login: "2024-01-15 14:30:00"
  },
  ...
]
```

---

### GET `/utilizadores/:id`

Obter dados de utilizador específico.

**Response (200):**
```javascript
{
  id: 1,
  nome: "João Silva",
  email: "joao@clinica.pt",
  role: "dentista",
  ativo: true,
  ultimo_login: "2024-01-16 10:00:00"
}
```

---

### POST `/utilizadores`

Criar novo utilizador (admin only).

**Request:**
```javascript
{
  nome: "Nova Pessoa",
  email: "nova@clinica.pt",
  role: "assistente"
}
```

**Response (201):**
```javascript
{
  message: "Utilizador criado com sucesso",
  user: { id: 2, nome: "Nova Pessoa", ... }
}
```

---

### PUT `/utilizadores/:id`

Atualizar dados de utilizador.

**Request:**
```javascript
{
  nome: "João Silva Atualizado",
  role: "dentista",
  ativo: true,
  assinatura_base64: "data:image/png;base64,..."
}
```

**Response (200):**
```javascript
{ message: "Utilizador atualizado com sucesso" }
```

---

### DELETE `/utilizadores/:id`

Deletar utilizador (admin only).

**Response (200):**
```javascript
{ message: "Utilizador deletado com sucesso" }
```

---

## 🏥 Pacientes

### GET `/pacientes`

Listar todos os pacientes.

**Query Params:**
- `search` - Busca por nome/email/NIF
- `limit` - Número de resultados (padrão: 20)
- `offset` - Paginação (padrão: 0)

**Response (200):**
```javascript
{
  total: 45,
  pacientes: [
    {
      id: 1,
      nome: "João Silva",
      email: "joao@email.pt",
      telefone: "912345678",
      data_nascimento: "1990-05-15",
      nif: "123456789",
      data_ultima_consulta: "2024-01-10"
    },
    ...
  ]
}
```

---

### GET `/pacientes/:id`

Obter detalhes completos de paciente.

**Response (200):**
```javascript
{
  id: 1,
  nome: "João Silva",
  data_nascimento: "1990-05-15",
  email: "joao@email.pt",
  telefone: "912345678",
  morada: "Rua da Paz 123",
  codigo_postal: "1000-001",
  cidade: "Lisboa",
  nif: "123456789",
  tipo_sanguineo: "O+",
  alergias: "Penicilina",
  medicacoes_atuais: "Paracetamol 500mg",
  historico_medico: "Hypertensão",
  notas_clinicas: "Paciente cooperante",
  odontograma_dados: {
    "1": "saudavel",
    "2": "carie",
    ...
  },
  data_ultima_consulta: "2024-01-10",
  utilizador_criador_id: 1
}
```

---

### POST `/pacientes`

Criar novo paciente.

**Request:**
```javascript
{
  nome: "Maria Santos",
  data_nascimento: "1995-03-20",
  email: "maria@email.pt",
  telefone: "918765432",
  morada: "Av. Principal 456",
  codigo_postal: "2000-001",
  cidade: "Lisbon"
}
```

**Response (201):**
```javascript
{
  message: "Paciente criado com sucesso",
  paciente: { id: 46, ... }
}
```

---

### PUT `/pacientes/:id`

Atualizar dados de paciente.

**Request:**
```javascript
{
  nome: "João Silva Atualizado",
  email: "novo_email@pt",
  alergias: "Penicilina, Ibuprofeno",
  notas_clinicas: "Novo diagnóstico: diabetes"
}
```

**Response (200):**
```javascript
{ message: "Paciente atualizado com sucesso" }
```

---

### DELETE `/pacientes/:id`

Deletar paciente.

**Response (200):**
```javascript
{ message: "Paciente deletado com sucesso" }
```

---

### GET `/pacientes/:id/consultas`

Listar histórico de consultas de paciente.

**Response (200):**
```javascript
[
  {
    id: 1,
    data_consulta: "2024-01-10 10:00",
    tipo_consulta: "Limpeza",
    valor_cobrado: 50.00,
    confirmada: true
  },
  ...
]
```

---

### POST `/pacientes/:id/exames`

Upload de exame (radiografia, etc).

**Request (FormData):**
```
arquivo: <binary image data>
nome_exame: "Radiografia panorâmica"
tipo_exame: "ortopantomografia"
notas: "Observar região 4-5"
```

**Response (201):**
```javascript
{
  message: "Exame uploaded com sucesso",
  exame: { id: 1, nome_exame: "...", ... }
}
```

---

### GET `/pacientes/:id/odonto`

Obter dados do odontograma.

**Response (200):**
```javascript
{
  "1": "saudavel",
  "2": "saudavel",
  "3": "carie",
  "4": "preenchimento",
  ...
  "32": "falta"
}
```

---

### PUT `/pacientes/:id/odonto`

Atualizar odontograma.

**Request:**
```javascript
{
  "1": "saudavel",
  "2": "carie",
  "3": "preenchimento",
  // ... todos os 32 dentes
}
```

**Response (200):**
```javascript
{ message: "Odontograma atualizado com sucesso" }
```

---

## 📅 Consultas

### GET `/consultas`

Listar consultas.

**Query Params:**
- `data_inicio` - Data início (YYYY-MM-DD)
- `data_fim` - Data fim (YYYY-MM-DD)
- `status` - Filtro por status
- `paciente_id` - Filtro por paciente

**Response (200):**
```javascript
[
  {
    id: 1,
    paciente_id: 1,
    paciente_nome: "João Silva",
    data_consulta: "2024-01-15 10:00",
    tipo_consulta: "Limpeza",
    duracao_minutos: 30,
    valor_cobrado: 50.00,
    confirmada: true
  },
  ...
]
```

---

### POST `/consultas`

Criar nova consulta.

**Request:**
```javascript
{
  paciente_id: 1,
  data_consulta: "2024-02-01 10:00",
  tipo_consulta: "Restauração",
  duracao_minutos: 45,
  procedimentos: "Preenchimento dente 6"
}
```

**Response (201):**
```javascript
{
  message: "Consulta agendada com sucesso",
  consulta: { id: 100, ... }
}
```

---

### PUT `/consultas/:id`

Atualizar consulta (marcar como realizada).

**Request:**
```javascript
{
  procedimentos: "Limpeza realizada",
  diagnostico: "Cárie no dente 5",
  prescricao: "Fluoreto 0.5% - 2x/dia",
  valor_cobrado: 60.00,
  assinatura_base64: "data:image/png;base64,..."
}
```

**Response (200):**
```javascript
{ message: "Consulta atualizada com sucesso" }
```

---

### DELETE `/consultas/:id`

Cancelar consulta.

**Response (200):**
```javascript
{ message: "Consulta cancelada com sucesso" }
```

---

### GET `/consultas/:id/pdf`

Gerar receita em PDF.

**Response (200):**
- Content-Type: application/pdf
- Arquivo binário da receita

---

## 📦 Produtos

### GET `/produtos`

Listar todos os produtos.

**Query Params:**
- `categoria` - Filtro por categoria
- `search` - Busca por nome/código de barras
- `stock_critico` - Apenas com stock < mínimo
- `limit` - Número de resultados
- `offset` - Paginação

**Response (200):**
```javascript
{
  total: 150,
  produtos: [
    {
      id: 1,
      nome: "Luvas Nitrilo M",
      categoria: "Descartáveis",
      stock_atual: 45.0,
      stock_minimo: 50.0,
      preco_unitario: 0.25,
      data_validade: "2025-06-30",
      codigo_barras: "5901235012345",
      ativo: true
    },
    ...
  ]
}
```

---

### GET `/produtos/:id`

Obter detalhes de um produto.

**Response (200):**
```javascript
{
  id: 1,
  nome: "Luvas Nitrilo M",
  descricao: "Luvas médicas de nitrilo",
  categoria: "Descartáveis",
  stock_atual: 45.0,
  stock_minimo: 50.0,
  unidade_medida: "caixa",
  preco_unitario: 0.25,
  preco_custo: 0.15,
  data_validade: "2025-06-30",
  codigo_barras: "5901235012345",
  fornecedor: "João Distribuidora",
  imagem_url: "data:image/png;base64,..."
}
```

---

### POST `/produtos`

Criar novo produto.

**Request:**
```javascript
{
  nome: "Novo Produto",
  categoria: "Anestesia",
  stock_atual: 100,
  stock_minimo: 20,
  preco_unitario: 5.50,
  unidade_medida: "unidade"
}
```

**Response (201):**
```javascript
{
  message: "Produto criado com sucesso",
  produto: { id: 151, ... }
}
```

---

### PUT `/produtos/:id`

Atualizar produto (ex: stock).

**Request:**
```javascript
{
  stock_atual: 85,  // Novo stock
  preco_unitario: 5.75  // Novo preço
}
```

**Response (200):**
```javascript
{ message: "Produto atualizado com sucesso" }
```

---

### DELETE `/produtos/:id`

Deletar produto.

**Response (200):**
```javascript
{ message: "Produto deletado com sucesso" }
```

---

## 💰 Faturas

### GET `/faturas`

Listar faturas.

**Query Params:**
- `status` - Filtrar por status (pendente/pago/cancelado)
- `data_inicio` - Data início
- `data_fim` - Data fim
- `paciente_id` - Filtro por paciente

**Response (200):**
```javascript
[
  {
    id: 1,
    numero_fatura: "INV-2024-0001",
    paciente_id: 1,
    paciente_nome: "João Silva",
    data_emissao: "2024-01-15",
    total: 150.00,
    status: "pago"
  },
  ...
]
```

---

### POST `/faturas`

Criar nova fatura.

**Request:**
```javascript
{
  paciente_id: 1,
  data_emissao: "2024-01-15",
  items: [
    { descricao: "Limpeza dental", quantidade: 1, preco_unitario: 75.00 },
    { descricao: "Fluoreto", quantidade: 1, preco_unitario: 25.00 }
  ],
  taxa_iva: 23,
  condicoes_pagamento: "Pagamento imediato"
}
```

**Response (201):**
```javascript
{
  message: "Fatura criada com sucesso",
  fatura: {
    id: 1,
    numero_fatura: "INV-2024-0001",
    total: 123.00,
    ...
  }
}
```

---

### GET `/faturas/:id`

Obter detalhes da fatura.

**Response (200):**
```javascript
{
  id: 1,
  numero_fatura: "INV-2024-0001",
  paciente_nome: "João Silva",
  data_emissao: "2024-01-15",
  items: [{...}],
  subtotal: 100.00,
  taxa_iva: 23.00,
  total: 123.00,
  status: "pago",
  descricao: "Serviços dentários"
}
```

---

### PUT `/faturas/:id`

Atualizar status da fatura.

**Request:**
```javascript
{
  status: "pago",
  data_pagamento: "2024-01-16"
}
```

**Response (200):**
```javascript
{ message: "Fatura atualizada com sucesso" }
```

---

### GET `/faturas/:id/pdf`

Gerar fatura em PDF.

**Response (200):**
- Content-Type: application/pdf
- Arquivo binário

---

## 📊 Dashboard

### GET `/dashboard`

Obter dados do dashboard.

**Response (200):**
```javascript
{
  kpis: {
    total_pacientes: 45,
    total_consultas: 128,
    receita_mes: 8450.50,
    pacientes_novo_mes: 3,
    consultas_novo_mes: 12
  },
  proximas_consultas: [
    {
      id: 1,
      paciente: "João Silva",
      hora: "10:00",
      tipo: "Limpeza",
      dentista: "Dr. Pedro"
    }
  ],
  alertas_stock: [
    {
      produto: "Luvas M",
      stock: 2,
      minimo: 10,
      urgencia: "critico"
    }
  ],
  stats_consultas: [
    { mes: "Janeiro", total: 15, receita: 1200 },
    ...
  ]
}
```

---

## 🔍 Busca e Filtros

### Query Params Comuns

```javascript
// Paginação
?limit=20&offset=0

// Ordenação
?sort=nome&order=asc

// Filtros
?status=pago&categoria=Anestesia

// Search
?search=termo
```

---

## ⏱️ Timeouts e Rate Limiting

- **Connection Timeout:** 2 segundos
- **Read Timeout:** 30 segundos
- **Rate Limit:** A implementar (sugerido: 100 req/min por IP)

---

## 🐛 Exemplos de Erro

### 400 Bad Request

```javascript
{
  error: "Campo obrigatório faltando",
  field: "email"
}
```

### 401 Unauthorized

```javascript
{
  error: "Token não fornecido"
}
```

### 403 Forbidden

```javascript
{
  error: "Acesso negado. Apenas admin pode acessar."
}
```

### 404 Not Found

```javascript
{
  error: "Paciente com ID 999 não encontrado"
}
```

### 500 Internal Server Error

```javascript
{
  error: "Erro interno do servidor",
  message: "Database connection failed"
}
```

---

## 📱 Exemplos de Requisições (cURL)

### Login

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinica.pt",
    "senha": "admin123"
  }'
```

### Listar Pacientes

```bash
curl http://localhost:5000/pacientes \
  -H "Authorization: Bearer eyJhbGc..."
```

### Criar Fatura

```bash
curl -X POST http://localhost:5000/faturas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "paciente_id": 1,
    "data_emissao": "2024-01-15",
    "items": [...],
    "taxa_iva": 23
  }'
```

---

**Última atualização:** Abril 2026
