# API de Produtos - Documentação

## Visão Geral

A API de Produtos gerencia todo o catálogo de produtos, inventário e stock da clínica odontológica MeClinic.

**Base URL:** `http://localhost:5000/api/produtos`

**Autenticação:** Requerida em todas as rotas (JWT)

**Paginação:** Suportada via `page` e `limit` query parameters

---

## Endpoints

### 1. Listar Todos os Produtos

**GET** `/api/produtos`

Retorna todos os produtos com suporte a filtros e paginação.

#### Parâmetros Query
- `page` (número, opcional): Página (padrão: 1)
- `limit` (número, opcional): Limite por página (padrão: 20)
- `categoria` (string, opcional): Filtrar por categoria
- `search` (string, opcional): Procurar por nome ou código de barras

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/produtos?page=1&limit=10&categoria=Descartáveis" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "produtos": [
    {
      "id": 1,
      "nome": "Luvas de Latex",
      "codigo_barras": "123456789",
      "stock_atual": 150,
      "stock_minimo": 50,
      "unidade_medida": "pares",
      "categoria": "Descartáveis",
      "imagem_url": "https://...",
      "data_validade": "2025-12-31"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### 2. Obter Detalhes de Um Produto

**GET** `/api/produtos/:id`

Retorna informações completas de um produto específico.

#### Parâmetros
- `id` (número, obrigatório): ID do produto

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/produtos/1" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "id": 1,
  "nome": "Luvas de Latex",
  "codigo_barras": "123456789",
  "stock_atual": 150,
  "stock_minimo": 50,
  "unidade_medida": "pares",
  "categoria": "Descartáveis",
  "imagem_url": "https://...",
  "data_validade": "2025-12-31"
}
```

#### Respostas de Erro
- **404 Not Found**: Produto não encontrado

---

### 3. Listar Produtos por Categoria

**GET** `/api/produtos/categoria/:categoria`

Retorna todos os produtos de uma categoria específica.

#### Parâmetros
- `categoria` (string, obrigatório): Nome da categoria

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/produtos/categoria/Descartáveis" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "categoria": "Descartáveis",
  "produtos": [
    {
      "id": 1,
      "nome": "Luvas de Latex",
      "stock_atual": 150
    }
  ],
  "total": 5
}
```

---

### 4. Obter Alertas de Stock Baixo

**GET** `/api/produtos/stock/alerts`

Retorna lista de produtos com stock abaixo do mínimo.

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/produtos/stock/alerts" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "alertas": [
    {
      "id": 5,
      "nome": "Sugador Saliva",
      "stock_atual": 8,
      "stock_minimo": 15,
      "categoria": "Instrumentos"
    }
  ],
  "total": 1,
  "message": "1 produto(s) com stock baixo"
}
```

---

### 5. Procurar Produto

**GET** `/api/produtos/search/:termo`

Procura produtos por nome ou código de barras.

#### Parâmetros
- `termo` (string, obrigatório): Termo de busca (min 2 caracteres)

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/produtos/search/Luvas" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "termo": "Luvas",
  "produtos": [
    {
      "id": 1,
      "nome": "Luvas de Latex",
      "codigo_barras": "123456789",
      "stock_atual": 150
    },
    {
      "id": 2,
      "nome": "Luvas Nitrílicas",
      "codigo_barras": "123456790",
      "stock_atual": 200
    }
  ],
  "total": 2
}
```

#### Respostas de Erro
- **400 Bad Request**: Termo com menos de 2 caracteres

---

### 6. Obter Categorias

**GET** `/api/produtos/categorias/list`

Retorna lista de todas as categorias de produtos.

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/produtos/categorias/list" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "categorias": [
    "Descartáveis",
    "Instrumentos",
    "Materiais de Restituição",
    "Medicamentos"
  ],
  "total": 4
}
```

---

### 7. Criar Novo Produto

**POST** `/api/produtos`

Cria um novo produto no sistema.

#### Permissões Requeridas
- ADMIN, DENTISTA

#### Parâmetros Body
- `nome` (string, obrigatório): Nome do produto (min 3, max 200 caracteres)
- `codigo_barras` (string, opcional): Código de barras (max 50 caracteres)
- `stock_atual` (número, opcional): Stock atual (padrão: 0)
- `stock_minimo` (número, opcional): Stock mínimo (padrão: 5)
- `unidade_medida` (string, opcional): Unidade de medida (padrão: 'un')
- `categoria` (string, opcional): Categoria (padrão: 'Descartáveis')
- `imagem_url` (string, opcional): URL da imagem
- `data_validade` (string, opcional): Data de validade (YYYY-MM-DD)

#### Exemplo de Request
```bash
curl -X POST "http://localhost:5000/api/produtos" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Luvas de Latex",
    "codigo_barras": "123456789",
    "stock_atual": 150,
    "stock_minimo": 50,
    "unidade_medida": "pares",
    "categoria": "Descartáveis",
    "data_validade": "2025-12-31"
  }'
```

#### Exemplo de Response (201 Created)
```json
{
  "message": "Produto criado com sucesso!",
  "produto": {
    "id": 10,
    "nome": "Luvas de Latex",
    "categoria": "Descartáveis",
    "stock_atual": 150
  }
}
```

#### Respostas de Erro
- **400 Bad Request**: Validação falhou (dados inválidos)
- **403 Forbidden**: Sem permissão

---

### 8. Atualizar Produto

**PUT** `/api/produtos/:id`

Atualiza informações de um produto existente.

#### Permissões Requeridas
- ADMIN, DENTISTA

#### Parâmetros
- `id` (número, obrigatório): ID do produto

#### Parâmetros Body (todos opcionais)
- `nome` (string): Novo nome
- `codigo_barras` (string): Novo código de barras
- `unidade_medida` (string): Nova unidade de medida
- `categoria` (string): Nova categoria
- `imagem_url` (string): Nova URL de imagem
- `data_validade` (string): Nova data de validade

#### Exemplo de Request
```bash
curl -X PUT "http://localhost:5000/api/produtos/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "stock_minimo": 100,
    "categoria": "Descartáveis Premium"
  }'
```

#### Exemplo de Response (200 OK)
```json
{
  "message": "Produto atualizado com sucesso!",
  "produto": {
    "id": 1,
    "nome": "Luvas de Latex",
    "stock_minimo": 100,
    "categoria": "Descartáveis Premium"
  }
}
```

#### Respostas de Erro
- **404 Not Found**: Produto não encontrado

---

### 9. Atualizar Stock do Produto

**PUT** `/api/produtos/:id/stock`

Atualiza o stock de um produto (adiciona ou remove stock).

#### Permissões Requeridas
- ADMIN, DENTISTA, ASSISTENTE

#### Parâmetros
- `id` (número, obrigatório): ID do produto

#### Parâmetros Body
- `quantity` (número, obrigatório): Quantidade a adicionar/remover
- `operation` (string, obrigatório): 'add' para adicionar ou 'remove' para remover

#### Exemplo de Request - Adicionar Stock
```bash
curl -X PUT "http://localhost:5000/api/produtos/1/stock" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50,
    "operation": "add"
  }'
```

#### Exemplo de Request - Remover Stock
```bash
curl -X PUT "http://localhost:5000/api/produtos/1/stock" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 30,
    "operation": "remove"
  }'
```

#### Exemplo de Response (200 OK)
```json
{
  "message": "Stock adicionado com sucesso!",
  "produto": {
    "id": 1,
    "nome": "Luvas de Latex",
    "stock_atual": 200
  }
}
```

#### Respostas de Erro
- **400 Bad Request**: Quantidade inválida ou stock insuficiente
- **404 Not Found**: Produto não encontrado

---

### 10. Deletar Produto

**DELETE** `/api/produtos/:id`

Remove um produto do sistema.

#### Permissões Requeridas
- ADMIN

#### Exemplo de Request
```bash
curl -X DELETE "http://localhost:5000/api/produtos/1" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "message": "Produto removido com sucesso!"
}
```

#### Respostas de Erro
- **404 Not Found**: Produto não encontrado
- **403 Forbidden**: Sem permissão

---

## Categorias Padrão

- **Descartáveis**: Luvas, máscaras, aventais, etc.
- **Instrumentos**: Espelhos, sondas, fórceps, etc.
- **Materiais de Restituição**: Cimentos, resinas, compósitos, etc.
- **Medicamentos**: Anestésicos, antibióticos, etc.
- **Outros**: Outros produtos

---

## Validações

### Nome
- Mínimo: 3 caracteres
- Máximo: 200 caracteres
- Obrigatório

### Stock
- Não pode ser negativo
- Stock atual >= 0
- Stock mínimo >= 0

### Unidade de Medida
- Exemplos: 'un', 'pares', 'caixas', 'tubos', etc.
- Máximo: 20 caracteres

### Categoria
- Máximo: 100 caracteres
- Padrão: 'Descartáveis'

### Data de Validade
- Formato ISO (YYYY-MM-DD)
- Opcional

---

## Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | Sucesso (GET, PUT, DELETE) |
| 201 | Recurso criado (POST) |
| 400 | Bad Request (validação) |
| 403 | Forbidden (sem permissão) |
| 404 | Not Found |
| 500 | Server Error |

---

## Autenticação

Todos os endpoints requerem um token JWT válido passado no header:

```
Authorization: Bearer <token>
```

---

## Paginação

Para endpoints que retornam listas, use:

```
GET /api/produtos?page=1&limit=20
```

Resposta inclui:
- `page`: Página atual
- `limit`: Limite por página
- `total`: Total de registos
- `pages`: Total de páginas

---

## Exemplos Completos

### Criar Produto e Atualizar Stock

```bash
# 1. Criar produto
curl -X POST "http://localhost:5000/api/produtos" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Luvas de Latex",
    "stock_atual": 150,
    "stock_minimo": 50,
    "categoria": "Descartáveis"
  }'

# 2. Adicionar stock
curl -X PUT "http://localhost:5000/api/produtos/10/stock" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50,
    "operation": "add"
  }'

# 3. Remover stock
curl -X PUT "http://localhost:5000/api/produtos/10/stock" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 20,
    "operation": "remove"
  }'
```

### Ver Alertas de Stock

```bash
curl -X GET "http://localhost:5000/api/produtos/stock/alerts" \
  -H "Authorization: Bearer <token>"
```

### Procurar Produtos

```bash
curl -X GET "http://localhost:5000/api/produtos/search/Luvas" \
  -H "Authorization: Bearer <token>"
```

### Filtrar por Categoria

```bash
curl -X GET "http://localhost:5000/api/produtos?categoria=Instrumentos" \
  -H "Authorization: Bearer <token>"
```

---

## Notas

- Todos os IDs são únicos por produto
- O sistema não permite stock negativo (remove retorna erro se insuficiente)
- Produtos com stock_atual <= stock_minimo aparecem nos alertas
- Produtos deletados são removidos permanentemente da base de dados
- stock_atual é atualizado automaticamente em operações (não atualizar manualmente)
- Imagens devem estar hospedadas externamente (URL pública)
