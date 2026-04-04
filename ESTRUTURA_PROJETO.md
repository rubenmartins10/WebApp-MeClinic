# MeClinic - Estrutura Profissional de Projeto

## 📁 Organização de Directórios

```
meclinic/
├── 📂 .github/
│   ├── workflows/              # GitHub Actions CI/CD
│   ├── ISSUE_TEMPLATE/         # Templates para issues
│   └── pull_request_template.md # Template para PRs
├── 📂 config/                  # Ficheiros de configuração
│   ├── database.js             # Configuração BD
│   ├── email.js                # Configuração email
│   └── security.js             # Configurações segurança
├── 📂 server/                  # Backend Node.js/Express
│   ├── controllers/            # Lógica de negócio
│   ├── models/                 # Modelos de dados
│   ├── routes/                 # Definição de rotas
│   ├── middleware/             # Middlewares
│   ├── validation/             # Schemas de validação
│   ├── utils/                  # Utilitários
│   └── index.js                # Entrada do servidor
├── 📂 meclinic-app/client/     # Frontend React
│   ├── src/
│   │   ├── pages/              # Páginas
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── hooks/              # React hooks custom
│   │   ├── contexts/           # Context API
│   │   ├── utils/              # Funções utilitárias
│   │   ├── styles/             # Estilos globais
│   │   └── App.js              # Componente raiz
│   └── public/                 # Ficheiros estáticos
├── 📂 Database/                # Scripts SQL
│   ├── migrations/             # Migrações BD
│   └── seeds/                  # Seeds de dados
├── 📂 DOCUMENTACAO/            # Documentação técnica
│   ├── API.md                  # Documentação API
│   ├── ARQUITETURA.md          # Arquitetura do sistema
│   ├── DATABASE.md             # Schema BD
│   └── ...
├── 📂 scripts/                 # Scripts de automação
│   ├── setup/                  # Setup inicial
│   ├── database/               # Scripts BD
│   └── deployment/             # Scripts deploy
├── 📂 tests/                   # Testes automatizados
│   ├── unit/                   # Testes unitários
│   └── integration/            # Testes integração
├── 📂 node_modules/            # Dependências npm
├── .env.example                # Exemplo variáveis ambiente
├── .gitignore                  # Ficheiros ignorados git
├── .eslintrc.json              # Configuração ESLint
├── tsconfig.json               # Configuração TypeScript
├── CODE_STYLE.md               # Guia de estilo
├── CONTRIBUTING.md             # Guia de contribuição
├── CODE_OF_CONDUCT.md          # Código de conduta
├── LICENSE                     # Licença do projeto
├── package.json                # Dependências npm
└── README.md                   # README principal
```

## 🎯 Padrões por Directório

### Backend (`server/`)
- Controllers: Lógica de negócio, sem acesso direto a BD
- Models: Operações de BD, queries
- Routes: Definição de endpoints HTTP
- Middleware: Autenticação, validação, CORS
- Validation: Schemas Joi para validação

### Frontend (`meclinic-app/client/src/`)
- Pages: Páginas completas da aplicação
- Components: Componentes reutilizáveis
- Contexts: Context API para estado global
- Hooks: Custom hooks React
- Utils: Funções auxiliares

## 📋 Checklist Organização

- [x] Estrutura de pastas criada
- [x] Configuração TypeScript
- [x] ESLint configurado
- [x] Code style definido
- [x] Contributing guidelines
- [x] Código de conduta
- [ ] GitHub Actions workflows
- [ ] Templates de issues/PRs
- [ ] Testes setup

---

**Última atualização: 2026-04-04** ✨
