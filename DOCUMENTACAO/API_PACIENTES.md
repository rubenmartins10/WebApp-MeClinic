# Pacientes - Endpoints Refatorizados

## Endpoints Disponíveis

### Listar Pacientes
```bash
GET /api/pacientes?page=1&limit=20
Headers:
  Authorization: Bearer <token>
```

Resposta:
```json
{
  "pacientes": [
    {
      "id": 1,
      "nome": "João Silva",
      "telefone": "+351 912 345 678",
      "email": "joao@example.com",
      "total_consultas": 5,
      "total_faturado": 1250.00,
      "ultima_consulta": "2026-04-02"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Buscar Pacientes
```bash
GET /api/pacientes/search?q=João
Headers:
  Authorization: Bearer <token>
```

Resposta:
```json
{
  "query": "João",
  "results": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@example.com",
      "telefone": "+351 912 345 678"
    }
  ],
  "count": 1
}
```

### Obter Detalhes de Paciente
```bash
GET /api/pacientes/:id
Headers:
  Authorization: Bearer <token>
```

### Criar Paciente
```bash
POST /api/pacientes
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body:
{
  "nome": "Maria Santos",
  "email": "maria@example.com",
  "data_nascimento": "1990-05-15",
  "telefone": "+351 912 345 678",
  "endereco": "Rua Principal, 123",
  "cidade": "Lisboa",
  "nif": "123456789"
}
```

### Atualizar Dados
```bash
PUT /api/pacientes/:id/dados
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body:
{
  "nome": "Maria Santos",
  "telefone": "+351 913 000 000",
  "email": "maria.new@example.com"
}
```

### Atualizar Notas Clínicas
```bash
PUT /api/pacientes/:id/notas
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body:
{
  "notas": "Paciente com histórico de bruxismo. Sensibilidade em molares."
}
```

### Atualizar Odontograma
```bash
PUT /api/pacientes/:id/odontograma
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body:
{
  "dados": {
    "dente_11": { "status": "normal", "notas": "" },
    "dente_12": { "status": "cariado", "notas": "Necessita restauração" },
    "dente_21": { "status": "perdido", "notas": "" }
  }
}
```

### Histórico de Consultas
```bash
GET /api/pacientes/:id/historico
Headers:
  Authorization: Bearer <token>
```

Resposta:
```json
{
  "paciente_id": 1,
  "consultas": [
    {
      "id": 5,
      "data_consulta": "2026-04-02",
      "hora_consulta": "14:30",
      "status": "realizada",
      "diagnostico": "Limpeza de tártaro",
      "procedimento_nome": "Profilaxia",
      "dentista_nome": "Dr. Silva"
    }
  ],
  "total": 5
}
```

### Adicionar Exame
```bash
POST /api/pacientes/:id/exames
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body:
{
  "nome": "Radiografia Panorâmica",
  "base64": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

### Listar Exames
```bash
GET /api/pacientes/:id/exames
Headers:
  Authorization: Bearer <token>
```

Resposta:
```json
{
  "paciente_id": 1,
  "exames": [
    {
      "id": 1,
      "nome_exame": "Radiografia Panorâmica",
      "data_exame": "2026-04-02"
    }
  ],
  "total": 1
}
```

### Deletar Exame
```bash
DELETE /api/pacientes/exames/:idExame
Headers:
  Authorization: Bearer <token>
```

### Deletar Paciente
```bash
DELETE /api/pacientes/:id
Headers:
  Authorization: Bearer <token>
```

⚠️ **Atenção:** Remove o paciente e TODOS os seus registos (consultas, faturação, exames)

---

## Autenticação Requerida

Todos os endpoints requerem um token JWT no header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Permissões

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/api/pacientes` | Qualquer | ADMIN/DENTISTA/ASSISTENTE | - | - |
| `/api/pacientes/:id/dados` | - | - | ADMIN/DENTISTA/ASSISTENTE | - |
| `/api/pacientes/:id/notas` | - | - | ADMIN/DENTISTA | - |
| `/api/pacientes/:id/exames` | Qualquer | ADMIN/DENTISTA | - | ADMIN/DENTISTA |
| `/api/pacientes/:id` | - | - | - | ADMIN |

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | OK |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autorizado |
| 403 | Permissão insuficiente |
| 404 | Recurso não encontrado |
| 500 | Erro no servidor |
