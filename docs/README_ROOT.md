# 🏥 MeClinic - Sistema de Gestão Clínica Profissional

[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-blue)](./docs/roadmap/STATUS_PROJETO.md)
[![Segurança](https://img.shields.io/badge/Segurança-GDPR%20Compliant-green)](./docs/roadmap/PROTECAO_DADOS_GDPR_COMPLIANCE.md)
[![Documentação](https://img.shields.io/badge/Docs-100%25%20Cobertura-blueviolet)](./docs/README.md)

Um sistema moderno, seguro e escalável para gestão completa de clínicas e consultórios.

---

## 🚀 Características Principais

✅ **Gestão de Pacientes** - Perfil completo, histórico clínico e consultas  
✅ **Agendamento de Consultas** - Sistema inteligente de calendário  
✅ **Faturação Automática** - Geração de facturas e relatórios financeiros  
✅ **Gestão de Inventário** - Controlo de produtos e materiais  
✅ **Relatórios Automáticos** - PDF e análise financeira semanal  
✅ **Autenticação Segura** - JWT + Role-based access control  
✅ **GDPR Compliant** - Conformidade total com regulamentação  
✅ **Interface Moderna** - React 19 com dark mode e multi-idioma  

---

## 📋 Documentação

**Toda a documentação está organizada em `docs/`** com estrutura profissional:

| Tipo | Localização | Descrição |
|------|------------|-----------|
| 📖 Guias | `docs/guias/` | Setup, desenvolvimento, best practices |
| 🔖 Referência | `docs/referencia/` | APIs, banco de dados, arquitetura |
| 🚀 Roadmap | `docs/roadmap/` | Planos, deployment, segurança |

👉 **[Aceder à Documentação](./docs/README.md)**

---

## ⚙️ Quick Start

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Instalação

```bash
# 1. Clonar repositório
git clone <repo-url>
cd MeClinic

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com tus credenciais

# 4. Iniciar base de dados
npm run db:init

# 5. Iniciar desenvolvimento
npm run dev
```

### Estrutura de Diretórios

```
MeClinic/
│
├─ 📚 docs/                 ← Toda a documentação
│  ├─ guias/
│  ├─ referencia/
│  └─ roadmap/
│
├─ 💻 meclinic-app/         ← Aplicação completa
│  ├─ client/               ← Frontend React (port 3000)
│  └─ server/               ← Backend Node.js (port 5000)
│
├─ 🗄️ Database/             ← Scripts SQL e migrations
├─ ⚙️ config/               ← Ficheiros de configuração
├─ 🔧 scripts/              ← Scripts de automatização
├─ ✅ tests/                ← Suite de testes
│
└─ 📄 Ficheiros de Configuração
   ├─ .env                  ← Variáveis de ambiente
   ├─ package.json
   ├─ tsconfig.json
   └─ .eslintrc
```

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19.2.3** - UI moderna e responsiva
- **Lucide React** - Ícones profissionais
- **jsPDF** - Geração de PDFs
- **React Router 7** - Navegação

### Backend
- **Node.js + Express 5** - Servidor web
- **PostgreSQL** - Base de dados relacional
- **Nodemailer** - Envio de emails
- **JWT** - Autenticação segura
- **node-cron** - Tarefas agendadas

### DevOps
- **HTTPS/SSL** - Comunicação encriptada
- **CORS** - Segurança cross-origin
- **Rate Limiting** - Proteção DDoS
- **Helmet.js** - Headers de segurança

---

## 🔐 Segurança

✅ Autenticação JWT com expiração  
✅ Controlo de acesso baseado em papéis (RBAC)  
✅ Validação com Joi em todos os inputs  
✅ Protecção CSRF  
✅ Rate limiting  
✅ Conformidade GDPR  

📖 **[Ver detalhes de segurança](./docs/roadmap/PROTECAO_DADOS_GDPR_COMPLIANCE.md)**

---

## 📊 API Overview

A API está completamente documentada em `docs/referencia/API.md`

```
POST   /api/auth/login              - Login do utilizador
GET    /api/pacientes               - Listar pacientes
POST   /api/consultas               - Criar consulta
GET    /api/reports/weekly-detail   - Relatório financeiro
POST   /api/reports/send-email      - Enviar email com relatório
```

📖 **[API Completa](./docs/referencia/API.md)**

---

## 📈 Roadmap

- ✅ Sistema de autenticação
- ✅ Gestão de pacientes e consultas
- ✅ Faturação e relatórios
- 🔄 Integração de pagamentos online
- 🔄 App mobile (React Native)
- 🔄 Dashboard analytics avançado
- 🔄 Integração com sistemas de lab

📖 **[Ver roadmap completo](./docs/roadmap/ROADMAP.md)**

---

## 🤝 Contribuição

Consulta [CONTRIBUTING.md](./docs/CONTRIBUTING.md) para guia completo.

```bash
1. Fork o repositório
2. Cria uma branch feature (git checkout -b feature/AmazingFeature)
3. Commit mudanças (git commit -m 'Add AmazingFeature')
4. Push para a branch (git push origin feature/AmazingFeature)
5. Abre um Pull Request
```

---

## 📝 Licença

Este projeto está sob licença ISC. Ver LICENSE para detalhes.

---

## 📞 Contacto & Suporte

- 📧 Email: support@meclinic.dev
- 📋 Issues: GitHub Issues
- 💬 Discussões: GitHub Discussions

---

## 📚 Documentação Adicional

- [Setup Completo](./docs/guias/SETUP.md)
- [Arquitetura do Projeto](./docs/referencia/ESTRUTURA_PROJETO.md)
- [Deploy em Produção](./docs/roadmap/DEPLOYMENT.md)
- [Segurança & GDPR](./docs/roadmap/PROTECAO_DADOS_GDPR_COMPLIANCE.md)
- [Código de Conduta](./docs/CODE_OF_CONDUCT.md)

---

**Desenvolvido com ❤️ para clínicas modernas**

*Última atualização: Abril 2026*
