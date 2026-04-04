# 🌐 Server - Estrutura Profissional Organizada

## 📁 Organização de Pastas

```
server/
├─ 📄 index.js                        ← 🔴 FICHEIRO CRÍTICO - Servidor principal
├─ 📄 db.js                           ← 🔴 FICHEIRO CRÍTICO - Pool de BD
├─ 📄 errorHandler.js                 ← 🔴 FICHEIRO CRÍTICO - Tratamento erros
├─ 📄 package.json
├─ 📄 tsconfig.json
├─ 📄 .env                            ← 🔴 Variáveis de ambiente (SECRETO)
├─ 📄 .env.production.example
│
├─ 📁 config/                         ← Configuração centralizada
│  ├─ database.config.js              ← Configuração BD
│  ├─ mailer.config.js                ← Configuração email (Mailtrap)
│  └─ constants.js                    ← Constantes globais
│
├─ 📁 routes/                         ← Rotas API (endpoints)
│  ├─ auth.routes.js                  ← POST /api/auth/*
│  ├─ pacientes.routes.js             ← GET/POST /api/pacientes/*
│  ├─ consultas.routes.js             ← GET/POST /api/consultas/*
│  ├─ faturacao.routes.js             ← Faturação
│  ├─ produtos.routes.js              ← Produtos
│  ├─ modelos.routes.js               ← Modelos
│  ├─ settings.routes.js              ← Configurações do utilizador
│  ├─ stats.routes.js                 ← Estatísticas
│  ├─ reports.routes.js               ← Relatórios
│  └─ utilizadores.routes.js          ← Gestão de utilizadores
│
├─ 📁 controllers/                    ← Lógica de negócio das rotas
│  ├─ authController.js               ← Autenticação
│  ├─ pacientesController.js
│  ├─ consultasController.js
│  ├─ faturaçãoController.js
│  ├─ produtosController.js
│  ├─ reportsController.js            ← Geração de PDFs/Relatórios
│  └─ settingsController.js
│
├─ 📁 models/                         ← Modelos de dados/ORM
│  ├─ Paciente.js
│  ├─ Consulta.js
│  ├─ Produto.js
│  ├─ Fatura.js
│  └─ Utilizador.js
│
├─ 📁 middleware/                     ← Middlewares de requisição
│  ├─ auth.js                         ← Autenticação JWT
│  ├─ errorHandler.js                 ← Tratamento de erros
│  ├─ rateLimiter.js                  ← Rate limiting
│  └─ cors.js                         ← CORS configuration
│
├─ 📁 services/                       ← Lógica de negócio reutilizável
│  ├─ authService.js                  ← Serviços de autenticação
│  ├─ emailService.js                 ← Envio de emails (Nodemailer)
│  ├─ pdfService.js                   ← Geração de PDFs (PDFKit)
│  ├─ reportService.js                ← Lógica de relatórios
│  └─ storageService.js               ← Gestão de ficheiros
│
├─ 📁 validation/                     ← Schemas Joi de validação
│  ├─ authValidation.js               ← Validação de login/registro
│  ├─ pacientesValidation.js
│  ├─ consultasValidation.js
│  └─ produtosValidation.js
│
├─ 📁 utils/                          ← Funções auxiliares
│  ├─ pdfTemplate.js                  ← Template profissional para PDFs
│  ├─ validators.js                   ← Funções de validação custom
│  ├─ formatters.js                   ← Formatação de dados
│  └─ helpers.js                      ← Funções auxiliares gerais
│
├─ 📁 exceptions/                     ← Exceções customizadas
│  ├─ AppException.js                 ← Exceção base
│  ├─ ValidationException.js          ← Erros de validação
│  ├─ AuthenticationException.js      ← Erros de autenticação
│  └─ NotFoundException.js            ← Recurso não encontrado
│
├─ 📁 constants/                      ← Constantes globais
│  ├─ http.constants.js               ← Status HTTP
│  ├─ error.constants.js              ← Mensagens de erro
│  ├─ database.constants.js           ← Queries constantes
│  └─ email.constants.js              ← Templates de email
│
└─ 📁 node_modules/                   ← Dependências (ignore)
```

---

## 🔄 Fluxo de uma Requisição

```
Cliente (React) 
  ↓
API Request → routes/ (auth.routes.js)
  ↓
middleware/ (auth.js) - valida JWT
  ↓
validation/ - valida dados (Joi schemas)
  ↓
controllers/ (authController.js) - orquestra fluxo
  ↓
services/ - lógica de negócio (ex: emailService.js)
  ↓
models/ - operações BD
  ↓
utils/ (pdfTemplate.js, validators.js, etc)
  ↓
response com dados ou erro ← Client
```

---

## 🎯 Responsabilidade de Cada Pasta

### 📁 **routes/**
Define os endpoints da API. 
- Mapeia URLs para controllers
- Define métodos HTTP (GET, POST, etc)

```javascript
// auth.routes.js
router.post('/login', authController.login);
router.post('/register', authController.register);
```

### 📁 **controllers/**
Orquestra o fluxo de uma requisição.
- Valida entrada
- Chama services
- Retorna resposta

```javascript
// authController.js
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.authenticate(email, password);
  res.json(result);
};
```

### 📁 **services/**
Lógica de negócio reutilizável.
- Operações complexas
- Integração externa (email, PDF, etc)
- Chamadas à BD

```javascript
// emailService.js
exports.sendWeeklyReport = async (recipient, pdfBuffer) => {
  await transporter.sendMail({...});
};
```

### 📁 **models/**
Representação de dados + operações BD.
- Consultas à BD
- Relações entre tabelas
- Validações de BD

```javascript
// Paciente.js
exports.getById = async (id) => {
  return await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);
};
```

### 📁 **middleware/**
Processamento de requisições antes de chegar à rota.
- Autenticação (JWT)
- Rate limiting
- CORS
- Logging

```javascript
// auth.js - valida JWT
router.use((req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  // ...
});
```

### 📁 **validation/**
Schemas Joi para validação de entrada.
- Login/registro
- Dados de pacientes
- Dados de consultas

```javascript
// authValidation.js
exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});
```

### 📁 **utils/**
Funções auxiliares reutilizáveis.
- Formatação de dados
- Templates (PDFs)
- Funções de validação custom

```javascript
// pdfTemplate.js
class PDFTemplate {
  addHeader(title) { ... }
  addSection(title) { ... }
  finish() { ... }
}
```

### 📁 **exceptions/**
Exceções customizadas para melhor tratamento de erros.

```javascript
// authService.js
if (!user) throw new NotFoundException('User not found');
```

### 📁 **constants/**
Constantes usadas em várias partes do servidor.

```javascript
// error.constants.js
module.exports = {
  INVALID_CREDENTIALS: 'Email ou password incorretos',
  USER_NOT_FOUND: 'Utilizador não encontrado'
};
```

---

## 🚀 Como Adicionar uma Nova Feature

Exemplo: **API de agendamento de salas**

1. **Criar route** (`rooms.routes.js`)
   ```javascript
   router.get('/api/rooms', roomsController.list);
   router.post('/api/rooms', roomsController.create);
   ```

2. **Criar controller** (`roomsController.js`)
   ```javascript
   exports.list = async (req, res) => {
     const rooms = await roomService.getAllRooms();
     res.json(rooms);
   };
   ```

3. **Criar service** (`roomService.js`)
   ```javascript
   exports.getAllRooms = async () => {
     return await Room.getAll();
   };
   ```

4. **Criar model** (`Room.js`)
   ```javascript
   exports.getAll = async () => {
     return await pool.query('SELECT * FROM rooms');
   };
   ```

5. **Criar validação** (`roomValidation.js`)
   ```javascript
   exports.createRoomSchema = Joi.object({
     name: Joi.string().required(),
     ...
   });
   ```

6. **Registar na API** (index.js)
   ```javascript
   app.use('/api', roomsRoutes);
   ```

---

## ✅ Boas Práticas

✅ **Controllers** orquestram, não fazem lógica complexa  
✅ **Services** contêm lógica de negócio  
✅ **Models** accesso à BD  
✅ **Validation** antes de processar  
✅ **Error handling** centralizado  
✅ **Middleware** para segurança  
✅ **Constantes** para strings repetidas  

---

**Desenvolvido com ❤️ para código backend profissional**
