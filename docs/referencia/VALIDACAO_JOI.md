# Guia de Uso - Validação Joi

## Referência Rápida de Validações

A validação está centralizada em `server/validation.js`. Cada endpoint agora valida automaticamente os dados de entrada.

---

## APIs Protegidas com Validação

### 🔐 Autenticação

#### POST `/api/register`
**Campos obrigatórios:**
```json
{
  "nome": "João Silva",           // String: 3-100 caracteres
  "email": "joao@example.com",   // Email válido
  "password": "SecurePass123",   // Mínimo 6 caracteres
  "confirmPassword": "SecurePass123"  // Deve corresponder a password
}
```

**Respostas:**
```json
// ✅ Sucesso
{ "message": "Conta criada com sucesso!", "user": {...}, "qrCodeUrl": "..." }

// ❌ Erro
{ "error": "Email inválido, Passwords não correspondem" }
```

---

#### POST `/api/login`
**Campos:**
```json
{
  "email": "joao@example.com",   // Email válido
  "password": "SecurePass123",   // String
  "mfaToken": "123456"           // Opcional: 6 dígitos
}
```

**Validações:**
- ✅ Email em formato válido
- ✅ Password tem pelo menos 6 caracteres
- ✅ MFA Token (se presente): exatamente 6 dígitos

---

### 👥 Pacientes

#### POST `/api/pacientes`
**Campos obrigatórios:**
```json
{
  "nome": "José Silva",
  "data_nascimento": "1990-05-15",
  "email": "jose@example.com"
}
```

**Campos opcionais:**
```json
{
  "telefone": "+351 912 345 678",
  "endereco": "Rua Principal, 123",
  "cidade": "Lisboa",
  "nif": "123456789",          // Exatamente 9 dígitos
  "notas_clinicas": "..."      // Máximo 5000 caracteres
}
```

---

#### PUT `/api/pacientes/:id/dados`
Por favor, ver campos de `POST /api/pacientes` - todas as validações são iguais.

---

### 📋 Consultas

#### POST `/api/consultas`
**Campos obrigatórios:**
```json
{
  "paciente_id": 1,                    // Número positivo
  "data_consulta": "2026-04-15",      // Formato ISO
  "diagnostico": "Cárie em dente 16"  // 3-1000 caracteres
}
```

**Campos opcionais:**
```json
{
  "tratamento": "Restauração em resina",
  "preco": 150.00
}
```

---

### 📦 Produtos

#### POST `/api/produtos`
**Campos obrigatórios:**
```json
{
  "nome": "Resina Composite Microhíbrida",
  "preco_unitario": 45.50,
  "stock_atual": 50,
  "stock_minimo": 10
}
```

**Campos opcionais:**
```json
{
  "descricao": "Resina de alta resistência",
  "categoria": "Endo_Restauro",
  "data_validade": "2026-12-31"
}
```

---

### 💳 Faturação

#### POST `/api/faturacao/checkout`
**Campos obrigatórios:**
```json
{
  "paciente_id": 1,
  "valor_total": 250.00
}
```

**Campos opcionais:**
```json
{
  "consulta_id": 5,
  "status": "PENDENTE",              // PENDENTE | PAGA | PARCIAL
  "notas": "Pagamento por referência"
}
```

---

## Mensagens de Erro

Cada campo inválido gera uma mensagem clara:

```
"Nome deve ter pelo menos 3 caracteres"
"Email inválido"
"Palavra-passe deve ter pelo menos 6 caracteres"
"Passwords não correspondem"
"NIF deve ter 9 dígitos"
"Telefone inválido"
"Data deve estar em formato ISO (YYYY-MM-DD)"
"Preço deve ser positivo"
"ID do paciente inválido"
```

---

## Adicionando Novas Validações

### Passo 1: Adicionar Schema em `validation.js`
```javascript
exports.meuNovoSchema = Joi.object({
  campo1: Joi.string().required(),
  campo2: Joi.number().positive(),
  campo3: Joi.date().iso().optional()
}).strict();
```

### Passo 2: Integrar em `index.js`
```javascript
app.post('/api/meu-endpoint', 
  validateRequest(validation.meuNovoSchema),
  async (req, res) => {
    // Dados já validados em req.body
  }
);
```

### Passo 3: Testar
```bash
curl -X POST http://localhost:5000/api/meu-endpoint \
  -H "Content-Type: application/json" \
  -d '{"campo1":"valor","campo2":100}'
```

---

## Padrões Reutilizáveis

Existem padrões pré-configurados em `validation.js` que podem ser reutilizados:

```javascript
commonPatterns.email      // Email válido
commonPatterns.password   // Mínimo 6 caracteres
commonPatterns.nome       // 3-100 caracteres
commonPatterns.telefone   // Padrão de telefone
commonPatterns.data       // Formato ISO (YYYY-MM-DD)
```

---

## Configuração de Ambiente

Adicionar ao `.env` para produção:
```env
NODE_ENV=production
FRONTEND_URL=https://seu-dominio.com
```

A validação é agnóstica de ambiente - funciona em desenvolvimento e produção igual.
