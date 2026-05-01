# MeClinic — Sistema de Gestão Clínica

[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-blue)](./docs/roadmap/STATUS_PROJETO.md)
[![Segurança](https://img.shields.io/badge/Segurança-GDPR%20Compliant-green)](./docs/roadmap/PROTECAO_DADOS_GDPR_COMPLIANCE.md)
[![Documentação](https://img.shields.io/badge/Docs-100%25%20Cobertura-blueviolet)](./docs/README.md)

Sistema moderno, seguro e escalável para gestão completa de clínicas e consultórios médicos.

---

## Características Principais

| Módulo | Descrição |
|--------|-----------|
| **Gestão de Pacientes** | Perfil completo, histórico clínico e registo de consultas |
| **Agendamento de Consultas** | Sistema de calendário com controlo de disponibilidade |
| **Faturação Automática** | Emissão de facturas e relatórios financeiros |
| **Gestão de Inventário** | Controlo de produtos, materiais e alertas de stock |
| **Relatórios Automáticos** | Geração de PDF e análise financeira semanal |
| **Autenticação Segura** | JWT com MFA e controlo de acesso por função (RBAC) |
| **Conformidade GDPR** | Implementação completa dos requisitos regulamentares |
| **Interface Moderna** | React 19 com suporte a tema escuro e múltiplos idiomas |

---

## Documentação

Toda a documentação está organizada em `docs/`:

| Tipo | Localização | Conteúdo |
|------|-------------|----------|
| Guias | `docs/guias/` | Setup, desenvolvimento, boas práticas |
| Referência | `docs/referencia/` | APIs, base de dados, arquitectura |
| Roadmap | `docs/roadmap/` | Planeamento, deployment, segurança |

**[Aceder à Documentação Completa](./docs/README.md)**

---

## Quick Start

### Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 14 ou superior
- npm ou yarn

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd MeClinic

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Preencher .env com as credenciais adequadas

# Inicializar base de dados
npm run db:init

# Iniciar em modo de desenvolvimento
npm run dev
```

### Estrutura de Diretórios

```
MeClinic/
│
├── docs/                   # Documentação do projecto
│   ├── guias/
│   ├── referencia/
│   └── roadmap/
│
├── meclinic-app/           # Aplicação principal
│   ├── client/             # Frontend React (porta 3000)
│   └── server/             # Backend Node.js (porta 5000)
│
├── Database/               # Scripts SQL e migrations
├── config/                 # Ficheiros de configuração
├── scripts/                # Scripts de automatização
└── tests/                  # Suite de testes
```

---

## Tecnologias

### Frontend
- **React 19.2.3** — Interface de utilizador responsiva
- **React Router 7** — Navegação entre vistas
- **Lucide React** — Biblioteca de ícones
- **jsPDF** — Geração de documentos PDF no cliente

### Backend
- **Node.js + Express 5** — Servidor HTTP
- **PostgreSQL** — Base de dados relacional
- **JWT** — Autenticação stateless com refresh tokens
- **Nodemailer** — Envio de emails transaccionais
- **node-cron** — Tarefas agendadas

### Segurança e Infraestrutura
- **HTTPS/SSL** — Comunicação encriptada
- **Helmet.js** — Cabeçalhos HTTP de segurança
- **CORS** — Controlo de acesso entre origens
- **Rate Limiting** — Protecção contra abuso de API

---

## Segurança

- Autenticação JWT com expiração e refresh tokens
- Autenticação multi-factor (MFA/TOTP)
- Controlo de acesso baseado em funções (RBAC)
- Validação de inputs com Joi em todos os endpoints
- Rate limiting nas rotas de autenticação
- Conformidade com GDPR

**[Ver documentação de segurança](./docs/roadmap/PROTECAO_DADOS_GDPR_COMPLIANCE.md)**

---

## API

Documentação completa disponível em `docs/referencia/API.md`.

```
POST   /api/auth/login              # Autenticação de utilizador
GET    /api/pacientes               # Listagem de pacientes
POST   /api/consultas               # Criação de consulta
GET    /api/reports/weekly-detail   # Relatório financeiro semanal
POST   /api/reports/send-email      # Envio de relatório por email
```

**[Documentação completa da API](./docs/referencia/API.md)**

---

## Roadmap

**Implementado**
- Sistema de autenticação com MFA
- Gestão de pacientes e consultas
- Faturação e relatórios PDF

**Em desenvolvimento**
- Integração com processadores de pagamento
- Aplicação móvel (React Native)
- Dashboard de analytics avançado
- Integração com sistemas laboratoriais

**[Ver roadmap completo](./docs/roadmap/ROADMAP.md)**

---

## Contribuição

Consulte [CONTRIBUTING.md](./CONTRIBUTING.md) para informações sobre o processo de contribuição.

---

## Licença

Este projecto está licenciado sob a licença ISC. Consulte o ficheiro LICENSE para detalhes.

---

## Contacto e Suporte

- **Email:** support@meclinic.dev
- **Issues:** GitHub Issues
- **Discussões:** GitHub Discussions

---

## Documentação Adicional

- [Guia de Setup](./docs/guias/SETUP.md)
- [Arquitectura do Projecto](./docs/referencia/ESTRUTURA_PROJETO.md)
- [Guia de Deployment](./docs/roadmap/DEPLOYMENT.md)
- [Segurança e GDPR](./docs/roadmap/PROTECAO_DADOS_GDPR_COMPLIANCE.md)
- [Código de Conduta](./CODE_OF_CONDUCT.md)

---

*Última actualização: Maio 2026*
