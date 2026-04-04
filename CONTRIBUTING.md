# Contribuindo para MeClinic

## Bem-vindo ao MeClinic! 👋

Obrigado por considerar contribuir para o MeClinic, um sistema de gestão de clínica dentária de código aberto.

### Código de Conduta

Este projeto adota um [Código de Conduta](./CODE_OF_CONDUCT.md). Ao participar, espera-se que cumpra estas orientações.

### Como Posso Contribuir?

#### 1. **Reportar Erros** 🐛

Se encontrar um erro, crie uma issue com:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs. atual
- Screenshots/logs se aplicável
- Ambiente (SO, navegador, versão Node.js)

#### 2. **Sugerir Melhorias** 💡

Para sugestões de novas funcionalidades:
- Explique o caso de uso
- Forneça exemplos de uso
- Considere quando seria útil
- Adicione qualquer contexto adicional

#### 3. **Submeter Code Pull Requests** 🔧

**Processo de Desenvolvimento:**

1. **Fork o repositório**
   ```bash
   git clone https://github.com/teu-usuario/meclinic.git
   cd meclinic
   ```

2. **Crie uma branch de feature**
   ```bash
   git checkout -b feature/GH-123-descricao-clara
   ```

3. **Siga o Guia de Estilo** (ver [CODE_STYLE.md](./CODE_STYLE.md))

4. **Faça commits semânticos**
   ```bash
   git commit -m "feat: adiciona validação de email
   
   - Implementa RFC 5322 para validação
   - Adiciona testes unitários
   - Atualiza documentação"
   ```

5. **Envie para sua fork**
   ```bash
   git push origin feature/GH-123-descricao-clara
   ```

6. **Crie um Pull Request** com:
   - Título descritivo
   - Referência à issue (ex: Closes #123)
   - Descrição clara das mudanças
   - Screenshots de UI changes

### Padrões de Desenvolvimento

#### 📝 Commits

Utilizamos **Conventional Commits**:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação, missing semicolons, etc.
- `refactor:` Refatoração de código sem mudanças de funcionalidade
- `perf:` Melhorias de desempenho
- `test:` Adicionar testes
- `chore:` Atualizações de dependências, build scripts

#### 🌳 Branches

- `main` - Produção estável
- `develop` - Desenvolvimento ativo
- `feature/*` - Novas funcionalidades
- `bugfix/*` - Correções de bugs
- `hotfix/*` - Correções críticas de produção

#### 📋 Estrutura

Veja [ARCHITECTURE.md](./DOCUMENTACAO/ARQUITETURA.md) para entender a estrutura do projeto.

### Diretrizes de Qualidade

- **Testes**: Sempre escreva testes para novos recursos
- **Documentação**: Documente mudanças significativas
- **Performance**: Considere o impacto no desempenho
- **Segurança**: Nunca commit credenciais ou dados sensíveis
- **Acessibilidade**: Garanta que UI seja acessível (WCAG 2.1 AA)

### Ambiente de Desenvolvimento

**Requisitos:**
- Node.js v18+
- PostgreSQL 14+
- npm ou yarn

**Setup:**

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp server/.env.example server/.env

# Executar migrations (se aplicável)
npm run db:migrate

# Iniciar em desenvolvimento
npm run dev
```

### Recursos

- 📚 [Documentação Técnica](./DOCUMENTACAO/)
- 🏗️ [Arquitetura do Sistema](./DOCUMENTACAO/ARQUITETURA.md)
- 🔐 [Segurança](./DOCUMENTACAO/SUMARIO_SEGURANCA.md)
- 📖 [API Documentation](./DOCUMENTACAO/API.md)

### Dúvidas?

- Abra uma **discussion** no GitHub
- Contacte o time de maintainers
- Consulte a documentação

---

**Obrigado por contribuir para tornar MeClinic melhor! 🚀**
