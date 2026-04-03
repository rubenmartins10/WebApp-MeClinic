# 🎯 Visão Geral do Projeto MeClinic

## O que é MeClinic?

**MeClinic** é uma plataforma integrada de gestão para clínicas dentárias que combina:
- 🏥 Gestão de pacientes
- 📅 Agendamento de consultas
- 💊 Inventário de produtos/medicamentos
- 💰 Faturação e relatórios financeiros
- 📊 Fichas técnicas de produtos
- 📋 Odontograma digital
- 🔐 Segurança com autenticação 2FA

## 🎓 Objetivo do Projeto

Criar um sistema moderno, intuitivo e seguro que permita aos profissionais de saúde dentária:
1. Gerenciar pacientes e históricos clínicos
2. Controlar inventário de produtos/medicamentos
3. Registrar consultas e procedimentos
4. Gerar faturas e relatórios
5. Acessar dados de forma segura e rápida

## 👥 Público-Alvo

- **Dentistas** - Acesso completo ao sistema
- **Assistentes de Dentário** - Gestão de pacientes e inventory
- **Administradores** - Controle de usuários e sistema

## 🌟 Principais Funcionalidades

### 1. **Autenticação e Segurança**
- Login com email/senha
- Autenticação 2FA (Two-Factor Authentication)
- Recuperação de senha por email
- Diferentes níveis de permissão por role

### 2. **Gestão de Pacientes**
- Criação e edição de perfis de pacientes
- Histórico clínico completo
- Notas clínicas personalizadas
- Odontograma digital interativo
- Upload de exames (radiografias, etc)

### 3. **Consultas e Procedimentos**
- Agendamento de consultas
- Registro de procedimentos realizados
- Histórico de consultas por paciente
- Assinatura digital de receitas

### 4. **Inventário**
- Gestão de produtos/medicamentos
- Controle de stock (mínimo e atual)
- Categorização automática
- Rastreamento de validades
- Código de barras para produtos

### 5. **Faturação**
- Criação de faturas/recibos
- Histórico de transações
- Relatórios financeiros
- Exportação de dados

### 6. **Relatórios**
- Relatórios de vendas
- Estatísticas de consultas
- Análise de inventário
- Geração de PDFs

### 7. **Dashboard**
- Visão geral de métricas principais
- Últimas consultas agendadas
- Status do inventário crítico
- Alertas e notificações

## 🏗️ Arquitetura em Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│         NAVEGADOR DO UTILIZADOR (Cliente)               │
│  React SPA - Interface responsiva e intuitiva            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ HTTP/REST API
                   │
┌──────────────────▼──────────────────────────────────────┐
│          SERVIDOR NODE.JS/EXPRESS (Backend)              │
│  - Autenticação JWT                                      │
│  - Lógica de negócio                                     │
│  - Geração de PDFs                                       │
│  - Envio de emails                                       │
├──────────────────────────────────────────────────────────┤
│          BASE DE DADOS POSTGRESQL                         │
│  - Utilizadores, pacientes, consultas                    │
│  - Produtos, faturas, exames                             │
└──────────────────────────────────────────────────────────┘
```

## 🛠️ Stack Tecnológico

### Frontend
```
React 18             - Framework UI
React Router v6      - Roteamento
Lucide React         - Ícones
CSS Puro            - Estilização com temas customizáveis
LocalStorage         - Persistência de sessão
```

### Backend
```
Node.js             - Runtime JavaScript
Express.js          - Framework web
PostgreSQL          - Banco de dados
JWT                 - Autenticação
Bcryptjs            - Hash de senhas
Speakeasy           - 2FA TOTP
Nodemailer          - Envio de emails
PDFKit              - Geração de PDFs
node-cron           - Tarefas agendadas
```

### Banco de Dados
```
PostgreSQL 12+      - SGBD relacional
Tabelas principais:
- utilizadores      - Usuários do sistema
- pacientes         - Dados dos pacientes
- consultas         - Registro de consultas
- produtos          - Inventário
- faturas           - Faturação
- exames_paciente   - Uploads de exames
```

## 📊 Fluxo de Dados Principal

```
1. Utilizador acessa a aplicação
   ↓
2. Faz login com email + senha
   ↓
3. Backend valida credenciais no PostgreSQL
   ↓
4. Gera token JWT + QR Code 2FA
   ↓
5. Utilizador escaneia QR ou insere código 2FA
   ↓
6. Backend verifica 2FA
   ↓
7. Frontend armazena token JWT
   ↓
8. Utilizador acede às funcionalidades (com token em cada requisição)
```

## 🔐 Segurança

### Camadas de Proteção

1. **Autenticação 2FA**
   - Email + Senha (primeira camada)
   - Código TOTP + QR Code (segunda camada)

2. **Controle de Acesso**
   - Tokens JWT com expiração
   - Roles: Admin, Dentista, Assistente
   - Verificação de permissões por endpoint

3. **Criptografia**
   - Senhas com bcryptjs (salt rounds)
   - Comunicação HTTPS (em produção)

4. **Validação de Dados**
   - Validação no frontend
   - Validação no backend
   - Prepared statements contra SQL Injection

## 📈 Escalabilidade

A arquitetura permite escalar para:
- Múltiplas clínicas (multi-tenant no futuro)
- Sincronização em tempo real (WebSockets)
- Cache distribuído (Redis)
- Load balancing
- Replicação do banco de dados

## 🚀 Status do Projeto

**Versão:** 1.0.0  
**Status:** Em desenvolvimento ativo  

### Funcionalidades Implementadas ✅
- ✅ Autenticação com 2FA
- ✅ Gestão de pacientes
- ✅ Inventário de produtos
- ✅ Consultas e procedimentos
- ✅ Faturação básica
- ✅ Dashboard com métricas
- ✅ Suporte a múltiplos idiomas
- ✅ Sistema de temas (claro/escuro)

### Em Desenvolvimento 🔄
- 🔄 Relatórios avançados
- 🔄 Agendamento automático
- 🔄 Integração com APIs externas

### Futuro 📋
- 📋 Mobile app (React Native)
- 📋 Backup automático
- 📋 Analytics avançado
- 📋 Integração com pagamentos

## 📞 Próximos Passos

1. Leia [ARQUITETURA.md](ARQUITETURA.md) para entender a estrutura
2. Siga [SETUP.md](SETUP.md) para configurar seu ambiente
3. Explore [ESTRUTURA_PROJETO.md](ESTRUTURA_PROJETO.md) para conhecer os arquivos
4. Consulte os outros documentos conforme necessário

---

**Última atualização:** Abril 2026
