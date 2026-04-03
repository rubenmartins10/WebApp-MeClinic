# 📋 Documentação MeClinic

Bem-vindo à documentação completa do projeto **MeClinic** - uma plataforma moderna de gestão para clínicas dentárias.

## 📚 Índice de Documentação

| Documento | Descrição |
|-----------|-----------|
| [VISAO_GERAL.md](VISAO_GERAL.md) | Apresentação completa do projeto, objetivos e escopo |
| [ARQUITETURA.md](ARQUITETURA.md) | Arquitetura técnica, componentes e fluxo de dados |
| [SETUP.md](SETUP.md) | Guia de instalação e configuração do ambiente |
| [ESTRUTURA_PROJETO.md](ESTRUTURA_PROJETO.md) | Organização de pastas e arquivos |
| [API.md](API.md) | Documentação completa da API REST |
| [BANCO_DADOS.md](BANCO_DADOS.md) | Schema, tabelas e relacionamentos PostgreSQL |
| [FRONTEND.md](FRONTEND.md) | Stack tecnológico e arquitetura React |
| [COMPONENTES.md](COMPONENTES.md) | Componentes reutilizáveis disponíveis |
| [PAGINAS.md](PAGINAS.md) | Funcionalidade de cada página |
| [AUTENTICACAO.md](AUTENTICACAO.md) | Sistema de autenticação, JWT e 2FA |
| [FEATURES.md](FEATURES.md) | Funcionalidades principais implementadas |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Guia de deployment e produção |

## 🎯 Início Rápido

### Para Desenvolvedores Novos

1. **Comece por:** [VISAO_GERAL.md](VISAO_GERAL.md) - Entenda o que é MeClinic
2. **Depois:** [ARQUITETURA.md](ARQUITETURA.md) - Veja como está estruturado
3. **Setup:** [SETUP.md](SETUP.md) - Configure seu ambiente
4. **Explore:** [ESTRUTURA_PROJETO.md](ESTRUTURA_PROJETO.md) - Conheça os arquivos

### Para Trabalhar em Features

1. [FRONTEND.md](FRONTEND.md) - Entenda o stack React
2. [COMPONENTES.md](COMPONENTES.md) - Componentes para reutilizar
3. [API.md](API.md) - Como chamar o backend
4. [BANCO_DADOS.md](BANCO_DADOS.md) - Estrutura de dados

### Para Trabalhar no Backend

1. [API.md](API.md) - Endpoints disponíveis
2. [BANCO_DADOS.md](BANCO_DADOS.md) - Schema do banco
3. [AUTENTICACAO.md](AUTENTICACAO.md) - Sistema de segurança

## 🏗️ Estrutura do Projeto

```
MeClinic/
├── DOCUMENTACAO/              # 📚 Esta documentação
├── server/                    # 🖥️ Backend Node.js/Express
│   ├── index.js              # Servidor principal
│   ├── db.js                 # Conexão ao PostgreSQL
│   ├── .env                  # Variáveis de ambiente
│   └── package.json          # Dependências
├── meclinic-app/
│   ├── client/               # ⚛️ Frontend React
│   │   ├── src/
│   │   │   ├── pages/        # Páginas principais
│   │   │   ├── components/   # Componentes reutilizáveis
│   │   │   ├── App.js        # Componente raiz
│   │   │   └── index.js      # Entry point
│   │   └── public/           # Ativos estáticos
│   └── package.json
├── Database/                 # 📊 Scripts SQL
└── package.json              # Root package.json
```

## 🔧 Informações Técnicas

### Stack Tecnológico

**Frontend:**
- React 18+
- React Router v6
- Lucide React (ícones)
- CSS puro (com temas personalizados)

**Backend:**
- Node.js com Express.js
- PostgreSQL (banco principal)
- JWT para autenticação
- 2FA com Speakeasy
- Email com Nodemailer
- PDF com PDFKit

### Portas

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | 3050 | http://localhost:3050 |
| Backend | 5000 | http://localhost:5000 |
| Database | 5432 | localhost |

## 🚀 Comandos Principais

```bash
# Instalar dependências
npm install
cd meclinic-app/client && npm install
cd ../../server && npm install

# Desenvolvimento (ambos frontend e backend)
npm run dev

# Apenas backend
npm run server

# Apenas frontend
npm run client
```

## 👤 Usuários de Teste

Verifique [FEATURES.md](FEATURES.md) para credenciais de teste padrão.

## 📞 Suporte

Para dúvidas específicas sobre:
- **Estrutura:** Veja [ESTRUTURA_PROJETO.md](ESTRUTURA_PROJETO.md)
- **Dados:** Veja [BANCO_DADOS.md](BANCO_DADOS.md)
- **API:** Veja [API.md](API.md)
- **UI:** Veja [COMPONENTES.md](COMPONENTES.md)

---

**Última atualização:** Abril 2026  
**Versão do Projeto:** 1.0.0
