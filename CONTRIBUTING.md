# Guia de Contribuição

Obrigado por considerar contribuir para o MeClinic. Este documento descreve o processo e as normas que devem ser seguidas para garantir qualidade e consistência no projecto.

Ao participar, é esperado que cumpra o [Código de Conduta](./CODE_OF_CONDUCT.md).

---

## Como Contribuir

### Reportar Problemas

Ao identificar um bug, crie uma issue com os seguintes elementos:

- Descrição clara e objectiva do problema
- Passos para reproduzir o comportamento
- Comportamento esperado versus comportamento observado
- Screenshots ou logs relevantes (se aplicável)
- Informações de ambiente: sistema operativo, versão do Node.js, browser

### Sugerir Melhorias

Para propor novas funcionalidades:

- Descreva o caso de uso que justifica a funcionalidade
- Forneça exemplos concretos de utilização
- Explique o impacto esperado para os utilizadores finais
- Inclua qualquer contexto técnico relevante

### Submeter Pull Requests

**Processo de desenvolvimento:**

1. **Fazer fork do repositório**
   ```bash
   git clone https://github.com/teu-usuario/meclinic.git
   cd meclinic
   ```

2. **Criar uma branch de trabalho**
   ```bash
   git checkout -b feature/GH-123-descricao-clara
   ```

3. **Seguir as normas de estilo** — consulte [CODE_STYLE.md](./docs/CODE_STYLE.md)

4. **Escrever commits semânticos**
   ```bash
   git commit -m "feat: adiciona validação de email

   - Implementa validação segundo RFC 5322
   - Adiciona testes unitários
   - Actualiza documentação relevante"
   ```

5. **Enviar para a fork**
   ```bash
   git push origin feature/GH-123-descricao-clara
   ```

6. **Criar um Pull Request** com:
   - Título descritivo
   - Referência à issue correspondente (ex: `Closes #123`)
   - Descrição das alterações realizadas
   - Screenshots para alterações de interface

---

## Normas de Desenvolvimento

### Commits

Este projecto adopta a convenção [Conventional Commits](https://www.conventionalcommits.org/):

| Prefixo | Utilização |
|---------|------------|
| `feat:` | Nova funcionalidade |
| `fix:` | Correcção de bug |
| `docs:` | Alterações em documentação |
| `style:` | Formatação, sem alteração de lógica |
| `refactor:` | Refactorização sem alteração de comportamento |
| `perf:` | Optimizações de desempenho |
| `test:` | Adição ou correcção de testes |
| `chore:` | Dependências, scripts de build, tarefas de manutenção |

### Branches

| Branch | Propósito |
|--------|-----------|
| `main` | Código de produção estável |
| `develop` | Desenvolvimento activo |
| `feature/*` | Novas funcionalidades |
| `bugfix/*` | Correcção de bugs |
| `hotfix/*` | Correcções críticas em produção |

---

## Ambiente de Desenvolvimento

**Requisitos:**

- Node.js v18 ou superior
- PostgreSQL 14 ou superior
- npm ou yarn

**Configuração inicial:**

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp server/.env.example server/.env

# Executar migrations
npm run db:migrate

# Iniciar em modo de desenvolvimento
npm run dev
```

---

## Critérios de Qualidade

- **Testes** — Toda nova funcionalidade deve incluir testes adequados
- **Documentação** — Alterações significativas devem ser documentadas
- **Desempenho** — Avaliar o impacto de cada alteração no desempenho geral
- **Segurança** — Nunca incluir credenciais ou dados sensíveis em commits
- **Acessibilidade** — As interfaces devem cumprir WCAG 2.1 nível AA

---

## Recursos

- [Documentação Técnica](./docs/)
- [Arquitectura do Sistema](./docs/referencia/ESTRUTURA_PROJETO.md)
- [Segurança e GDPR](./docs/roadmap/PROTECAO_DADOS_GDPR_COMPLIANCE.md)
- [Documentação da API](./docs/referencia/API.md)

---

## Dúvidas

- Abra uma **Discussion** no GitHub
- Contacte os mantenedores através das issues
- Consulte a documentação disponível em `docs/`
