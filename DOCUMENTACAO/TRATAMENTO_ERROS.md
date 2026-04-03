# Tratamento de Erros Estruturado

## Visão Geral

Sistema centralizado de tratamento de erros que:
- ✅ Captura TODOS os erros da aplicação
- ✅ Retorna respostas padronizadas
- ✅ Log estruturado em desenvolvimento
- ✅ Sem exposição de detalhes em produção
- ✅ Mensagens de erro consistentes

---

## Ficheiros

```
server/
├── errorHandler.js  ← ✨ NOVO - Middleware de erro
├── index.js         ← Integração dos middlewares
└── validation.js
```

---

## Como Funciona

### 1. **Middleware de Erro Global**

Todos os erros não capturados são tratados automaticamente:

```javascript
// No final do index.js
app.use(notFoundHandler);      // Captura 404s
app.use(errorHandler);         // Middleware central (deve ser ÚLTIMO)
```

### 2. **Respostas Padronizadas**

**Sucesso:**
```json
{ "message": "Conta criada com sucesso!", "user": {...} }
```

**Em Desenvolvimento (erro 400):**
```json
{
  "error": "Email inválido",
  "code": 400,
  "details": { 
    "validationErrors": [...]
  },
  "stack": "Error at..."
}
```

**Em Produção (erro 400):**
```json
{
  "error": "Email inválido",
  "code": 400
}
```

**Endpoint não encontrado (404):**
```json
{
  "error": "Endpoint não encontrado: POST /api/inexistente",
  "code": 404
}
```

---

## Usando AppError em Novos Endpoints

### Importar
```javascript
const { AppError, asyncHandler } = require("./errorHandler");
```

### Exemplo: Usar AppError
```javascript
app.post("/api/exemplo", async (req, res, next) => {
  try {
    const id = req.params.id;
    
    // Validação
    if (!id) {
      throw new AppError("ID é obrigatório", 400, { field: "id" });
    }
    
    const result = await pool.query("SELECT * FROM tabela WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      throw new AppError("Recurso não encontrado", 404, { id });
    }
    
    res.json(result.rows[0]);
    
  } catch (err) {
    // Erros AppError ou de banco de dados - passa para errorHandler
    next(err);
  }
});
```

### Exemplo: Usar asyncHandler (mais limpo)
```javascript
app.get("/api/exemplo/:id", asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM tabela WHERE id = $1", [req.params.id]);
  
  if (result.rows.length === 0) {
    throw new AppError("Recurso não encontrado", 404, { id: req.params.id });
  }
  
  res.json(result.rows[0]);
}));
```

---

## Estatutos HTTP Comuns

| Código | Uso | Exemplo |
|--------|-----|---------|
| 400 | Bad Request (validação) | Email inválido |
| 401 | Não autenticado | Token JWT expirado |
| 403 | Não autorizado | Sem permissão |
| 404 | Não encontrado | Paciente não existe |
| 409 | Conflito | Email já existe |
| 422 | Unprocessable Entity | Dados inválidos |
| 429 | Too Many Requests | Rate limit |
| 500 | Erro servidor | Database connection error |

---

## Logs em Desenvolvimento

Quando NODE_ENV !== 'production':

```
🔴 ERRO: {
  timestamp: "2026-04-02T14:30:00.000Z",
  method: "POST",
  url: "/api/login",
  statusCode: 401,
  message: "Credenciais incorretas.",
  details: { email: "user@example.com" },
  stack: "Error at..."
}
```

---

## Alerta de Segurança

Certos erros são registados como suspeitos:
- ❌ 429 - Rate limit exceeded (possível ataque)
- ❌ SQL injection attempts
- ❌ Múltiplas tentativas de autenticação falhadas

```
⚠️  ALERTA DE SEGURANÇA: {
  timestamp: "2026-04-02T14:30:00.000Z",
  ip: "192.168.1.1",
  method: "POST",
  url: "/api/login",
  reason: "Muitas tentativas de login",
  headers: {...}
}
```

---

## Ciclo de Vida de um Erro

```
      Endpoint
         ↓
    Validação Joi ← ❌ Erro validação → 400 Bad Request
         ↓
   Lógica de negócio
         ↓
  throw new AppError() ← ❌ Erro operacional → [statusCode] 
         ↓
  catch (err) → next(err)
         ↓
  errorHandler middleware
         ↓
  Log estruturado + resposta JSON
         ↓
     Cliente
```

---

## Exemplo Real: Login com Tratamento de Erro

```javascript
app.post("/api/login", 
  authLimiter,
  validateRequest(validation.loginSchema), // ← Validação
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Buscar utilizador
    const result = await pool.query(
      "SELECT * FROM utilizadores WHERE email = $1", 
      [email]
    );
    
    if (result.rows.length === 0) {
      throw new AppError("Credenciais incorretas.", 401);
    }
    
    const user = result.rows[0];
    
    // Validar password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new AppError("Credenciais incorretas.", 401);
    }
    
    // ... resto do código
    res.json({ token, user });
  })
);
```

---

## Migração Gradual

**Endpoints antigos** (continue funcionando):
```javascript
app.post("/api/exemplo", async (req, res) => {
  try {
    // ...
  } catch (err) {
    res.status(500).json({ error: err.message }); // ← Old style
  }
});
```

O errorHandler captura estes erros também! Mas é melhor migrar gradualmente para AppError.

---

## Próximos Passos

1. ✅ **Feito:** Middleware centralizado de erro
2. 📋 **Próximo:** Migrar endpoints críticos para AppError
3. 📋 **Depois:** Adicionar logging a ficheiro (Winston)
4. 📋 **Depois:** Integração com Sentry para monitorização

---

## Testes Rápidos

```bash
# ✅ Sucesso
curl http://localhost:5000/api/pacientes

# ❌ 404
curl http://localhost:5000/api/inexistente

# ❌ 400 (validação)
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Jo","email":"invalid"}'

# ❌ 401 (não autenticado)
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrong"}'
```
