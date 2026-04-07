# 🗂️ Guia Rápido - Estrutura Reorganizada (MeClinic)

**Última Atualização:** 2025  
**Status:** ✅ Implementado e Testado

---

## 📁 Localização Rápida de Ficheiros

### 🎨 **Frontend (React)**

| Tipo | Local | Exemplo |
|---|---|---|
| **Contextos Globais** | `client/src/contexts/` | `LanguageContext.js` |
| **Componentes Reutilizáveis** | `client/src/components/common/` | `Sidebar.js`, `BarcodeScanner.js` |
| **Componentes Específicos** | `client/src/components/specialized/` | `Assinatura.js`, `Odontograma.js` |
| **Páginas** | `client/src/pages/` | `Dashboard.js`, `Pacientes.js` |
| **Chamadas à API** | `client/src/services/` | `fetchWithToken.js` |
| **Estilos** | `client/src/styles/` | `App.css`, `index.css` |
| **Recursos** | `client/src/assets/` | `logo.png` |
| **Dados Mock** | `client/src/data/` | `mockData.js` |
| **Testes** | `client/src/__tests__/` | `App.test.js` |
| **Hooks Custom** | `client/src/hooks/` | (criar aqui) |

---

### 🔧 **Backend (Node.js)**

| Tipo | Local | Exemplo |
|---|---|---|
| **Rotas API** | `server/routes/` | `auth.routes.js` |
| **Lógica Rotas** | `server/controllers/` | `authController.js` |
| **Lógica Negócio** | `server/services/` | (criar aqui) |
| **Modelos/ORM** | `server/models/` | `Paciente.js` |
| **Middlewares** | `server/middleware/` | `auth.js` |
| **Validação** | `server/validation/` | `authValidation.js` |
| **Configuração** | `server/config/` | (criar aqui) |
| **Exceções** | `server/exceptions/` | (criar aqui) |
| **Constantes** | `server/constants/` | (criar aqui) |
| **Utilitários** | `server/utils/` | `pdfTemplate.js` |
| **BD** | `server/db.js` | Pool PostgreSQL |
| **Erros** | `server/errorHandler.js` | Tratamento global |

---

## 🔄 Fluxo de uma Nova Feature

### Frontend - Adicionar Componente
```javascript
// 1. Se é genérico (reutilizável)
// 📁 client/src/components/common/MyComponent.js
export default function MyComponent() {
  const { theme } = useContext(ThemeContext);
  return <>...</>;
}

// 2. Se é específico (domínio médico)
// 📁 client/src/components/specialized/MedicalComponent.js
import { ThemeContext } from '../../contexts/ThemeContext';

// 3. Importar em página
// 📁 client/src/pages/Dashboard.js
import MyComponent from '../components/common/MyComponent';
```

### Backend - Adicionar Endpoint
```javascript
// 1. Criar rota
// 📁 server/routes/feature.routes.js
router.post('/feature', featureController.create);

// 2. Criar controller
// 📁 server/controllers/featureController.js
exports.create = async (req, res) => {
  const result = await featureService.create(req.body);
};

// 3. Criar service
// 📁 server/services/featureService.js
exports.create = async (data) => {
  return await Feature.create(data);
};

// 4. Registar em index.js
// 📁 server/index.js
app.use('/api', featureRoutes);
```

---

## 📦 Imports Corretos

### ✅ Cliente
```javascript
// Em páginas (pages/)
import { ThemeContext } from '../contexts/ThemeContext';
import Sidebar from '../components/common/Sidebar';
import Assinatura from '../components/specialized/Assinatura';
import logo from '../assets/logo.png';

// Em componentes comuns (components/common/)
import { ThemeContext } from '../../contexts/ThemeContext';

// Em componentes especializados (components/specialized/)
import { ThemeContext } from '../../contexts/ThemeContext';
```

### ✅ Servidor
```javascript
// No index.js
const authRoutes = require('./routes/auth.routes');
const pool = require('./db');
const { errorHandler } = require('./errorHandler');

// Em controllers
const authService = require('../services/authService');

// Em services
const User = require('../models/User');
```

---

## 🎯 Checklist para Manutenção

### Antes de Fazer Commit
- [ ] Novos ficheiros estão na pasta correta?
- [ ] Imports estão com caminho correto?
- [ ] Código segue o padrão da pasta?
- [ ] Não há `console.log` em produção?
- [ ] Tests passam? (`npm test`)
- [ ] Build compila? (`npm run build`)

### Antes de Deploy
- [ ] Build React sem errors?
- [ ] Server inicia sem errors?
- [ ] Conexão BD funciona?
- [ ] Email está configurado?
- [ ] HTTPS está ativo (production)?
- [ ] Variables de ambiente definidas?

---

## 🚀 Comandos Principais

```bash
# 🎨 Cliente
cd meclinic-app/client
npm run dev        # Desenvolvimento
npm run build      # Build produção
npm test           # Testes
npm run lint       # ESLint

# 🔧 Servidor
cd server
node index.js      # Inicia servidor
npm run dev        # Com nodemon (dev)

# 🗄️ Base de dados
psql -U admin -d meclinic          # Conectar psql
node scripts/database/setup.js     # Setup tabelas
```

---

## 📞 FAQ

**P: Onde adicionar um novo componente de navegação?**  
R: Se é genérico → `components/common/`, se é específico → `components/specialized/`

**P: Como organizar um novo ficheiro CSS?**  
R: Coloca em `styles/` e importa em `index.js` ou componente específico

**P: Onde adiciona constantes globais?**  
R: Backend → `server/constants/`, Frontend → `client/src/data/` ou `utils/`

**P: Como estrutura um novo service?**  
R: Backend → `server/services/featureService.js`, exports das funções principais

**P: Preciso de adicionar um ficheiro de configuração?**  
R: Backend → `server/config/`, Frontend → passar como env

---

## 📚 Referência Completa

**Cliente:** [📖 Ler README em `client/src/README.md`](./meclinic-app/client/src/README.md)  
**Servidor:** [📖 Ler README em `server/README.md`](./server/README.md)  
**Estrutura:** [📖 Ler Relatório em `REORGANIZACAO_ESTRUTURA.md`](./REORGANIZACAO_ESTRUTURA.md)

---

**Estrutura Profesional Implementada ✅** | **Pronto para Produção 🚀**
