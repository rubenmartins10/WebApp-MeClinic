# API de Consultas - Documentação

## Visão Geral

A API de Consultas gerencia todos os agendamentos e consultas odontológicas do sistema MeClinic. 

**Base URL:** `http://localhost:5000/api/consultas`

**Autenticação:** Requerida em todas as rotas (JWT)

**Paginação:** Suportada via `page` e `limit` query parameters

---

## Endpoints

### 1. Listar Todas as Consultas

**GET** `/api/consultas`

Retorna todas as consultas com suporte a filtros e paginação.

#### Parâmetros Query
- `page` (número, opcional): Página (padrão: 1)
- `limit` (número, opcional): Limite por página (padrão: 20)
- `status` (string, opcional): Filtrar por status (pendente, confirmada, realizada, cancelada)
- `data` (string, opcional): Filtrar por data (YYYY-MM-DD)
- `paciente_id` (número, opcional): Filtrar por ID do paciente

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/consultas?page=1&limit=10&status=confirmada" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "consultas": [
    {
      "id": 1,
      "paciente_id": 5,
      "paciente_nome": "João Silva",
      "data_consulta": "2024-12-15",
      "hora_consulta": "10:30",
      "motivo": "Limpeza e detartarização",
      "status": "confirmada",
      "diagnostico": null,
      "tratamento": null,
      "created_at": "2024-12-01T09:15:00Z"
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

### 2. Obter Detalhes de Uma Consulta

**GET** `/api/consultas/:id`

Retorna informações completas de uma consulta específica.

#### Parâmetros
- `id` (número, obrigatório): ID da consulta

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/consultas/1" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "id": 1,
  "paciente_id": 5,
  "paciente_nome": "João Silva",
  "data_consulta": "2024-12-15",
  "hora_consulta": "10:30",
  "motivo": "Limpeza e detartarização",
  "procedimento_id": 3,
  "status": "confirmada",
  "diagnostico": "Placa bacteriana abundante, cálculo dental",
  "tratamento": "Detartarização e instrução de higiene oral",
  "created_at": "2024-12-01T09:15:00Z",
  "updated_at": "2024-12-01T09:15:00Z"
}
```

#### Respostas de Erro
- **404 Not Found**: Consulta não encontrada

---

### 3. Listar Consultas por Paciente

**GET** `/api/consultas/paciente/:pacienteId`

Retorna todas as consultas de um paciente específico.

#### Parâmetros
- `pacienteId` (número, obrigatório): ID do paciente

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/consultas/paciente/5" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "paciente_id": 5,
  "consultas": [
    {
      "id": 1,
      "data_consulta": "2024-12-15",
      "hora_consulta": "10:30",
      "motivo": "Limpeza e detartarização",
      "status": "confirmada"
    },
    {
      "id": 2,
      "data_consulta": "2024-12-22",
      "hora_consulta": "14:00",
      "motivo": "Restauração",
      "status": "pendente"
    }
  ],
  "total": 2
}
```

#### Respostas de Erro
- **404 Not Found**: Paciente não encontrado

---

### 4. Listar Consultas por Data (Agenda do Dia)

**GET** `/api/consultas/data/:data`

Retorna todas as consultas agendadas para uma data específica.

#### Parâmetros
- `data` (string, obrigatório): Data em formato YYYY-MM-DD

#### Exemplo de Request
```bash
curl -X GET "http://localhost:5000/api/consultas/data/2024-12-15" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "data": "2024-12-15",
  "consultas": [
    {
      "id": 1,
      "hora_consulta": "10:30",
      "paciente_nome": "João Silva",
      "motivo": "Limpeza",
      "status": "confirmada"
    },
    {
      "id": 3,
      "hora_consulta": "11:15",
      "paciente_nome": "Maria Santos",
      "motivo": "Tratamento de canal",
      "status": "confirmada"
    }
  ],
  "total": 2
}
```

#### Respostas de Erro
- **400 Bad Request**: Data em formato inválido

---

### 5. Criar Nova Consulta

**POST** `/api/consultas`

Cria uma nova consulta/agendamento.

#### Permissões Requeridas
- ADMIN, DENTISTA, ASSISTENTE

#### Parâmetros Body
- `paciente_id` (número, obrigatório): ID do paciente
- `data_consulta` (string, obrigatório): Data em formato YYYY-MM-DD
- `hora_consulta` (string, obrigatório): Hora em formato HH:mm
- `motivo` (string, obrigatório): Motivo da consulta (min 3, max 500 caracteres)
- `procedimento_id` (número, opcional): ID do procedimento
- `diagnostico` (string, opcional): Diagnóstico (max 1000 caracteres)
- `tratamento` (string, opcional): Tratamento (max 1000 caracteres)

#### Exemplo de Request
```bash
curl -X POST "http://localhost:5000/api/consultas" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paciente_id": 5,
    "data_consulta": "2024-12-15",
    "hora_consulta": "10:30",
    "motivo": "Limpeza e detartarização",
    "procedimento_id": 3
  }'
```

#### Exemplo de Response (201 Created)
```json
{
  "message": "Consulta criada com sucesso!",
  "consulta": {
    "id": 10,
    "paciente_id": 5,
    "data_consulta": "2024-12-15",
    "hora_consulta": "10:30",
    "motivo": "Limpeza e detartarização",
    "status": "pendente",
    "created_at": "2024-12-01T09:15:00Z"
  }
}
```

#### Respostas de Erro
- **400 Bad Request**: Validação falhou (dados inválidos)
- **404 Not Found**: Paciente não encontrado
- **409 Conflict**: Já existe consulta nesta data e hora

---

### 6. Atualizar Consulta

**PUT** `/api/consultas/:id`

Atualiza informações de uma consulta existente.

#### Permissões Requeridas
- ADMIN, DENTISTA

#### Parâmetros
- `id` (número, obrigatório): ID da consulta

#### Parâmetros Body (todos opcionais)
- `data_consulta` (string): Nova data
- `hora_consulta` (string): Nova hora
- `motivo` (string): Novo motivo
- `procedimento_id` (número): Novo procedimento
- `diagnostico` (string): Novo diagnóstico
- `tratamento` (string): Novo tratamento

#### Exemplo de Request
```bash
curl -X PUT "http://localhost:5000/api/consultas/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "motivo": "Restauração de cárie",
    "procedimento_id": 5
  }'
```

#### Exemplo de Response (200 OK)
```json
{
  "message": "Consulta atualizada com sucesso!",
  "consulta": {
    "id": 1,
    "paciente_id": 5,
    "motivo": "Restauração de cárie",
    "procedimento_id": 5,
    "status": "confirmada",
    "updated_at": "2024-12-01T10:20:00Z"
  }
}
```

#### Respostas de Erro
- **404 Not Found**: Consulta não encontrada
- **409 Conflict**: Conflito de horário com outra consulta

---

### 7. Marcar Consulta como Realizada

**PUT** `/api/consultas/:id/marcar-realizada`

Marca uma consulta como realizada e adiciona diagnóstico e tratamento.

#### Permissões Requeridas
- ADMIN, DENTISTA

#### Parâmetros Body
- `diagnostico` (string, obrigatório): Diagnóstico da consulta
- `tratamento` (string, opcional): Tratamento realizado

#### Exemplo de Request
```bash
curl -X PUT "http://localhost:5000/api/consultas/1/marcar-realizada" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "diagnostico": "Placa bacteriana, gengivite leve",
    "tratamento": "Detartarização, instrução de higiene"
  }'
```

#### Exemplo de Response (200 OK)
```json
{
  "message": "Consulta marcada como realizada!",
  "consulta": {
    "id": 1,
    "status": "realizada",
    "diagnostico": "Placa bacteriana, gengivite leve",
    "tratamento": "Detartarização, instrução de higiene",
    "updated_at": "2024-12-01T11:30:00Z"
  }
}
```

---

### 8. Confirmar Consulta

**PUT** `/api/consultas/:id/confirmar`

Confirma uma consulta agendada.

#### Permissões Requeridas
- ADMIN, DENTISTA, ASSISTENTE

#### Exemplo de Request
```bash
curl -X PUT "http://localhost:5000/api/consultas/1/confirmar" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "message": "Consulta confirmada!",
  "consulta": {
    "id": 1,
    "status": "confirmada",
    "updated_at": "2024-12-01T09:20:00Z"
  }
}
```

---

### 9. Cancelar Consulta

**PUT** `/api/consultas/:id/cancelar`

Cancela uma consulta agendada.

#### Permissões Requeridas
- ADMIN, DENTISTA

#### Exemplo de Request
```bash
curl -X PUT "http://localhost:5000/api/consultas/1/cancelar" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "message": "Consulta cancelada!",
  "consulta": {
    "id": 1,
    "status": "cancelada",
    "updated_at": "2024-12-01T09:25:00Z"
  }
}
```

---

### 10. Deletar Consulta

**DELETE** `/api/consultas/:id`

Remove uma consulta do sistema.

#### Permissões Requeridas
- ADMIN

#### Exemplo de Request
```bash
curl -X DELETE "http://localhost:5000/api/consultas/1" \
  -H "Authorization: Bearer <token>"
```

#### Exemplo de Response (200 OK)
```json
{
  "message": "Consulta removida com sucesso!"
}
```

#### Respostas de Erro
- **404 Not Found**: Consulta não encontrada
- **403 Forbidden**: Sem permissão

---

## Status de Consulta

As consultas podem ter os seguintes status:

- **pendente**: Consulta acabou de ser criada, ainda não confirmada
- **confirmada**: Paciente confirmou presença
- **realizada**: Consulta foi realizada
- **cancelada**: Consulta foi cancelada

### Fluxo de Status
```
pendente → confirmada → realizada
     ↓
  cancelada
```

---

## Validações

### Data e Hora
- Data deve estar em formato ISO (YYYY-MM-DD)
- Hora deve estar em formato HH:mm (00:00 a 23:59)
- Não é permitido agendar consultas para datas passadas

### Conflito de Horário
- O sistema valida automaticamente para evitar dupla marcação
- Não é possível agendar dois pacientes no mesmo horário

### Motivo
- Mínimo: 3 caracteres
- Máximo: 500 caracteres
- Obrigatório

---

## Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | Sucesso (GET, PUT, DELETE) |
| 201 | Recurso criado (POST) |
| 400 | Bad Request (validação) |
| 403 | Forbidden (sem permissão) |
| 404 | Not Found |
| 409 | Conflict (conflito de horário) |
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
GET /api/consultas?page=1&limit=20
```

Resposta inclui:
- `page`: Página atual
- `limit`: Limite por página
- `total`: Total de registos
- `pages`: Total de páginas

---

## Ordenação

Consultas são retornadas ordenadas por:
1. `data_consulta` (ascendente)
2. `hora_consulta` (ascendente)

---

## Exemplos Completos

### Criar e Confirmar Consulta

```bash
# 1. Criar consulta
curl -X POST "http://localhost:5000/api/consultas" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paciente_id": 5,
    "data_consulta": "2024-12-15",
    "hora_consulta": "10:30",
    "motivo": "Limpeza e detartarização"
  }'

# 2. Confirmar consulta
curl -X PUT "http://localhost:5000/api/consultas/10/confirmar" \
  -H "Authorization: Bearer <token>"

# 3. Marcar como realizada
curl -X PUT "http://localhost:5000/api/consultas/10/marcar-realizada" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "diagnostico": "Placa bacteriana",
    "tratamento": "Detartarização"
  }'
```

### Ver Agenda do Dia

```bash
curl -X GET "http://localhost:5000/api/consultas/data/2024-12-15" \
  -H "Authorization: Bearer <token>"
```

### Ver Histórico de Paciente

```bash
curl -X GET "http://localhost:5000/api/consultas/paciente/5" \
  -H "Authorization: Bearer <token>"
```

---

## Notas

- Todas as datas e horas são armazenadas em UTC
- Os IDs são únicos por consulta
- As consultas deletadas recebem um soft delete (marcadas como deletadas mas preservadas)
- Apenas ADMINs podem deletar consultas
