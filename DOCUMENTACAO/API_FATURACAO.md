# API de Faturação - Documentação

## Visão Geral

A API de Faturação gerencia todo o sistema de faturas, pagamentos e receitas da clínica odontológica MeClinic.

**Base URL:** `http://localhost:5000/api/faturacao`

**Autenticação:** Requerida em todas as rotas (JWT)

**Paginação:** Suportada via `page` e `limit` query parameters

---

## Endpoints

### 1. Listar Todas as Faturas

**GET** `/api/faturacao`

Retorna todas as faturas com suporte a filtros e paginação.

#### Parâmetros Query
- `page` (número, opcional): Página (padrão: 1)
- `limit` (número, opcional): Limite por página (padrão: 20)
- `status` (string, opcional): Filtrar por status (PENDENTE, PAGA, PARCIAL, CANCELADA)
- `metodo_pagamento` (string, opcional): Filtrar por método de pagamento

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/faturacao?page=1&limit=10&status=PAGA" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "faturas": [
    {
      "id": 1,
      "consulta_id": 5,
      "paciente_nome": "João Silva",
      "procedimento_nome": "Limpeza e Detartarização",
      "valor_total": 75.00,
      "status": "PAGA",
      "metodo_pagamento": "Multibanco",
      "data_emissao": "2024-12-01T10:30:00Z",
      "data_pagamento": "2024-12-02T14:20:00Z"
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

### 2. Obter Detalhes de Uma Fatura

**GET** `/api/faturacao/:id`

Retorna informações completas de uma fatura específica.

#### Parâmetros
- `id` (número, obrigatório): ID da fatura

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/faturacao/1" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "id": 1,
  "consulta_id": 5,
  "paciente_nome": "João Silva",
  "procedimento_nome": "Limpeza e Detartarização",
  "valor_total": 75.00,
  "status": "PAGA",
  "metodo_pagamento": "Multibanco",
  "data_emissao": "2024-12-01T10:30:00Z",
  "data_pagamento": "2024-12-02T14:20:00Z"
}
```

#### Respostas de Erro
- **404 Not Found**: Fatura não encontrada

---

### 3. Listar Faturas de um Paciente

**GET** `/api/faturacao/paciente/:pacienteId`

Retorna todas as faturas de um paciente específico.

#### Parâmetros
- `pacienteId` (número, obrigatório): ID do paciente

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/faturacao/paciente/5" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "paciente_id": 5,
  "faturas": [
    {
      "id": 1,
      "procedimento_nome": "Limpeza",
      "valor_total": 75.00,
      "status": "PAGA"
    },
    {
      "id": 2,
      "procedimento_nome": "Restauração",
      "valor_total": 150.00,
      "status": "PENDENTE"
    }
  ],
  "total": 2
}
```

#### Respostas de Erro
- **404 Not Found**: Paciente não encontrado

---

### 4. Listar Faturas Pendentes

**GET** `/api/faturacao/pendentes`

Retorna todas as faturas com status pendente (não pagas).

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/faturacao/pendentes" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "faturas": [
    {
      "id": 2,
      "paciente_nome": "Maria Santos",
      "valor_total": 150.00,
      "status": "PENDENTE",
      "data_emissao": "2024-12-01T15:45:00Z"
    }
  ],
  "total": 1
}
```

---

### 5. Obter Estatísticas de Faturação

**GET** `/api/faturacao/estatisticas/resumo`

Retorna resumo estatístico de toda a faturação.

#### Permissões Requeridas
- ADMIN

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/faturacao/estatisticas/resumo" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "resumo": {
    "total_faturas": 45,
    "paga": 35,
    "pendente": 8,
    "parcial": 2,
    "total_recebido": 2625.00,
    "total_pendente": 625.00,
    "valor_total": 3250.00
  },
  "percentual_pago": "77.78"
}
```

---

### 6. Criar Fatura

**POST** `/api/faturacao`

Cria uma fatura/recibo para uma consulta realizada.

#### Permissões Requeridas
- ADMIN, DENTISTA, ASSISTENTE

#### Parâmetros Body
- `consulta_id` (número, obrigatório): ID da consulta
- `paciente_id` (número, opcional): ID do paciente
- `paciente_nome` (string, obrigatório): Nome do paciente (min 3, max 200 caracteres)
- `procedimento_nome` (string, opcional): Nome do procedimento realizado
- `valor_total` (número, obrigatório): Valor da fatura
- `metodo_pagamento` (string, opcional): Método de pagamento (padrão: 'Multibanco')

#### Exemplo de Request
```bash
curl -X POST "http://localhost:5000/api/faturacao" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "consulta_id": 5,
    "paciente_nome": "João Silva",
    "procedimento_nome": "Limpeza e Detartarização",
    "valor_total": 75.00,
    "metodo_pagamento": "Multibanco"
  }'
```

#### Exemplo de Response (201 Created)
```json
{
  "message": "Fatura criada com sucesso!",
  "fatura": {
    "id": 10,
    "consulta_id": 5,
    "paciente_nome": "João Silva",
    "valor_total": 75.00,
    "status": "PENDENTE",
    "data_emissao": "2024-12-03T09:15:00Z"
  }
}
```

#### Respostas de Erro
- **400 Bad Request**: Validação falhou (dados inválidos)
- **403 Forbidden**: Sem permissão
- **404 Not Found**: Consulta não encontrada

---

### 7. Checkout Completo

**POST** `/api/faturacao/checkout`

Operação complexa que finaliza a consulta, cria fatura, abate stock e envia documentos por email.

#### Permissões Requeridas
- ADMIN, DENTISTA

#### Parâmetros Body
- `consulta_id` (número, obrigatório): ID da consulta
- `paciente_nome` (string, obrigatório): Nome do paciente
- `procedimento_nome` (string, opcional): Nome do procedimento
- `valor_total` (número, obrigatório): Valor total
- `metodo_pagamento` (string, opcional): Método de pagamento
- `email_destino` (string, opcional): Email para envio de documentos
- `enviar_receita_email` (boolean, opcional): Se deve enviar receita por email
- `pdfBase64` (string, opcional): PDF da fatura em base64
- `materiais_gastos` (array, opcional): Materiais para abater do stock
- `exame_nome` (string, opcional): Nome do exame
- `exame_base64` (string, opcional): Exame em base64
- `receita_nome` (string, opcional): Nome da receita
- `receita_base64` (string, opcional): Receita em base64

#### Exemplo de Request
```bash
curl -X POST "http://localhost:5000/api/faturacao/checkout" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "consulta_id": 5,
    "paciente_nome": "João Silva",
    "procedimento_nome": "Limpeza e Detartarização",
    "valor_total": 75.00,
    "metodo_pagamento": "Multibanco",
    "email_destino": "joao@email.com",
    "pdfBase64": "data:application/pdf;base64,...",
    "materiais_gastos": [
      {
        "nome_item": "Luvas de Latex",
        "quantidade": 2
      }
    ]
  }'
```

#### Exemplo de Response (201 Created)
```json
{
  "message": "Check-out concluído com sucesso!",
  "fatura": {
    "id": 11,
    "consulta_id": 5,
    "paciente_nome": "João Silva",
    "valor_total": 75.00,
    "status": "PENDENTE",
    "data_emissao": "2024-12-03T10:20:00Z"
  }
}
```

#### Operações Incluídas
1. ✅ Marca consulta como realizada
2. ✅ Cria fatura
3. ✅ Abate materiais do stock
4. ✅ Guarda exames e receitas no perfil do paciente
5. ✅ Envia documentos por email (opcional)

---

### 8. Atualizar Fatura

**PUT** `/api/faturacao/:id`

Atualiza informações de uma fatura existente.

#### Permissões Requeridas
- ADMIN, DENTISTA

#### Parâmetros
- `id` (número, obrigatório): ID da fatura

#### Parâmetros Body (todos opcionais)
- `status` (string): Novo status (PENDENTE, PAGA, PARCIAL, CANCELADA)
- `metodo_pagamento` (string): Novo método de pagamento
- `valor_total` (número): Novo valor
- `procedimento_nome` (string): Novo nome do procedimento

#### Exemplo de Request
```bash
curl -X PUT "http://localhost:5000/api/faturacao/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "procedimento_nome": "Limpeza Premium",
    "valor_total": 85.00
  }'
```

#### Exemplo de Response (200 OK)
```json
{
  "message": "Fatura atualizada com sucesso!",
  "fatura": {
    "id": 1,
    "procedimento_nome": "Limpeza Premium",
    "valor_total": 85.00,
    "updated_at": "2024-12-03T10:25:00Z"
  }
}
```

#### Respostas de Erro
- **404 Not Found**: Fatura não encontrada

---

### 9. Marcar Fatura Como Paga

**PUT** `/api/faturacao/:id/marcar-paga`

Marca uma fatura como paga e registra a data de pagamento.

#### Permissões Requeridas
- ADMIN, DENTISTA, ASSISTENTE

#### Parâmetros
- `id` (número, obrigatório): ID da fatura

#### Parâmetros Body (opcionais)
- `data_pagamento` (string, opcional): Data do pagamento (YYYY-MM-DD). Se não fornecida, usa data atual.

#### Exemplo de Request
```bash
curl -X PUT "http://localhost:5000/api/faturacao/1/marcar-paga" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data_pagamento": "2024-12-02"
  }'
```

#### Exemplo de Response (200 OK)
```json
{
  "message": "Fatura marcada como paga!",
  "fatura": {
    "id": 1,
    "status": "PAGA",
    "data_pagamento": "2024-12-02T00:00:00Z"
  }
}
```

---

### 10. Deletar Fatura

**DELETE** `/api/faturacao/:id`

Remove uma fatura do sistema.

#### Permissões Requeridas
- ADMIN

#### Exemplo de Request
```bash
curl -X DELETE "http://localhost:5000/api/faturacao/1" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "message": "Fatura removida com sucesso!"
}
```

#### Respostas de Erro
- **404 Not Found**: Fatura não encontrada
- **403 Forbidden**: Sem permissão

---

## Status de Fatura

As faturas podem ter os seguintes status:

- **PENDENTE**: Fatura emitida, aguardando pagamento
- **PAGA**: Fatura totalmente paga
- **PARCIAL**: Fatura parcialmente paga
- **CANCELADA**: Fatura cancelada

---

## Métodos de Pagamento

- **Multibanco** (padrão)
- **Dinheiro**
- **Cartão de Débito**
- **Cartão de Crédito**
- **Cheque**
- **Transferência Bancária**

---

## Validações

### Paciente Nome
- Mínimo: 3 caracteres
- Máximo: 200 caracteres
- Obrigatório

### Valor Total
- Deve ser positivo
- Obrigatório

### Consulta ID
- Deve ser um ID válido de consulta existente
- Obrigatório

### Data de Pagamento
- Formato ISO (YYYY-MM-DD)
- Opcional (usa data atual se não fornecida)

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
GET /api/faturacao?page=1&limit=20
```

Resposta inclui:
- `page`: Página atual
- `limit`: Limite por página
- `total`: Total de registos
- `pages`: Total de páginas

---

## Exemplos Completos

### Fluxo Completo de Faturação

```bash
# 1. Criar fatura simples
curl -X POST "http://localhost:5000/api/faturacao" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "consulta_id": 5,
    "paciente_nome": "João Silva",
    "procedimento_nome": "Limpeza",
    "valor_total": 75.00
  }'

# 2. Marcar como paga
curl -X PUT "http://localhost:5000/api/faturacao/10/marcar-paga" \
  -H "Authorization: Bearer <token>"

# 3. Ver detalhes
curl -X GET "http://localhost:5000/api/faturacao/10" \
  -H "Authorization: Bearer <token>"
```

### Checkout Completo com Abate de Stock

```bash
curl -X POST "http://localhost:5000/api/faturacao/checkout" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "consulta_id": 5,
    "paciente_nome": "João Silva",
    "procedimento_nome": "Limpeza",
    "valor_total": 75.00,
    "materiais_gastos": [
      {
        "nome_item": "Luvas de Latex",
        "quantidade": 2
      },
      {
        "nome_item": "Sugador Saliva",
        "quantidade": 1
      }
    ],
    "email_destino": "joao@email.com",
    "pdfBase64": "data:application/pdf;base64,..."
  }'
```

### Ver Estatísticas

```bash
curl -X GET "http://localhost:5000/api/faturacao/estatisticas/resumo" \
  -H "Authorization: Bearer <token>"
```

### Ver Faturas Pendentes

```bash
curl -X GET "http://localhost:5000/api/faturacao/pendentes" \
  -H "Authorization: Bearer <token>"
```

---

## Notas

- Todas as operações são registadas com timestamps (data_emissao, data_pagamento)
- O checkout é uma operação transacional (rollback se alguma etapa falhar)
- Faturas deletadas são removidas permanentemente
- Apenas ADMINs podem deletar faturas
- Emails são enviados de forma assíncrona (não bloqueia a resposta)
- O sistema registra automaticamente a data de emissão ao criar uma fatura
