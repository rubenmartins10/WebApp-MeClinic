# Guia de Estilo de Código - MeClinic

## Objetivo

Este documento define os padrões de código para manter consistência, legibilidade e qualidade em todo o projeto MeClinic.

---

## 📋 JavaScript/Node.js

### Formatação

```javascript
// ✅ BOM: Espaçamento clara, nomes significativos
if (usuario.estaAutenticado) {
  const dados = await carregarDados(usuario.id);
  return processarDados(dados);
}

// ❌ EVITAR: Sem espaçamento, nomes obscuros
if(u.a){const d=carregarDados(u.i);return p(d);}
```

### Nomenclatura

**Variáveis e Funções**: camelCase
```javascript
const nomeUtilizador = 'João';
function carregarPacientes() { }
const contadorSessoes = 0;
```

**Constantes**: UPPER_SNAKE_CASE
```javascript
const PORTA_SERVIDOR = 5000;
const TIMEOUT_DB = 30000;
const TAMANHO_MAXIMO_FICHEIRO = 5 * 1024 * 1024; // 5MB
```

**Classes**: PascalCase
```javascript
class GestorPacientes { }
class ConexaoBD { }
```

**Booleans**: Prefixo com `eh`, `esta`, `vai`
```javascript
const estaAutenticado = true;
const vaiBuscarDados = false;
const ehAdmin = usuario.role === 'ADMIN';
```

### Estrutura

```javascript
// 1. Imports/Requires
const express = require('express');
const { authMiddleware } = require('../middleware/auth');

// 2. Constantes
const PORTA = process.env.PORT || 5000;

// 3. Middleware
router.use(authMiddleware);

// 4. Rotas/Funções
router.get('/api/pacientes', async (req, res) => {
  // Código...
});

// 5. Error Handling
router.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// 6. Exports
module.exports = router;
```

### Async/Await vs Promessas

**Preferir Async/Await:**
```javascript
// ✅ BOM
async function buscarPaciente(id) {
  try {
    const paciente = await baseDados.query('SELECT * FROM pacientes WHERE id = $1', [id]);
    return paciente;
  } catch (erro) {
    logger.erro('Erro ao buscar paciente:', erro);
    throw erro;
  }
}

// ❌ EVITAR: Callback hell
```

### Tratamento de Erros

```javascript
// ✅ BOM: Mensagens claras em português
try {
  validarDados(dados);
} catch (erro) {
  if (erro.nome === 'ErroValidacao') {
    res.status(400).json({ erro: 'Dados inválidos: ' + erro.mensagem });
  } else {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}
```

---

## ⚛️ React/JavaScript Frontend

### Componentes

**Nomenclatura**: PascalCase
```javascript
// ✅ BOM
function CartaoPaciente({ paciente, onClique }) {
  return (
    <div className="cartao-paciente" onClick={onClique}>
      <h2>{paciente.nome}</h2>
    </div>
  );
}

export default CartaoPaciente;
```

### Props e State

```javascript
// ✅ BOM: Nomes descritivos
function ListaPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [estaCarregando, setEstaCarregando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(null);

  return <div>{/* ... */}</div>;
}
```

### Styles

```javascript
// ✅ BOM: Estilos organizados
const estilos = {
  container: {
    padding: '20px',
    backgroundColor: tema.fundoPagina,
    borderRadius: '8px'
  },
  titulo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: tema.text
  }
};

function Componente() {
  return <div style={estilos.container}></div>;
}
```

### Conditionals

```javascript
// ✅ BOM: Claro e legível
function StatusPaciente({ paciente }) {
  if (!paciente) return <p>Paciente não encontrado</p>;
  
  if (paciente.estaInativo) return <p className="inativo">Inativo</p>;
  
  return <p className="ativo">Ativo</p>;
}

// ❌ EVITAR: Ternários aninhados
return paciente ? (paciente.estaInativo ? <p>Inativo</p> : <p>Ativo</p>) : null;
```

---

## 🗄️ SQL/PostgreSQL

### Convenções

```sql
-- ✅ BOM: Maiúscula para keywords, nomes significativos
SELECT id, nome, email, data_criacao
FROM utilizadores
WHERE role = 'ADMIN'
ORDER BY nome ASC;

-- ❌ EVITAR: Tudo minúsculo, nomes obscuros
select u_id, nm, em, d_cr from u where r = 'A' order by nm;
```

### Nomes de Tabelas

- Plural, snake_case em minúsculas
- Prefixos semânticos quando apropriado

```sql
CREATE TABLE utilizadores (id SERIAL PRIMARY KEY, ...);
CREATE TABLE pacientes (id SERIAL PRIMARY KEY, ...);
CREATE TABLE consultas (id SERIAL PRIMARY KEY, ...);
CREATE TABLE modelo_procedimento_itens (...);
```

### Índices

```sql
-- Nomear com padrão: idx_tabela_coluna
CREATE INDEX idx_pacientes_email ON pacientes(email);
CREATE INDEX idx_consultas_utilizador_id ON consultas(utilizador_id);
```

---

## 📝 Comentários e Documentação

### JavaScript

```javascript
/**
 * Carrega dados de pacientes do servidor
 * @param {number} id - ID do utilizador
 * @returns {Promise<Array>} Array de pacientes
 * @throws {Error} Se falhar a conexão com o servidor
 */
async function carregarPacientes(id) {
  // Implementação...
}

// ✅ BOM: Comenta o "porquê", não o "quê"
// Timeout de 30s porque a query pode ser pesada em BD grande
const TIMEOUT_QUERY = 30000;

// ❌ EVITAR: Comentários óbvios
const contador = 0; // Incrementa o contador
```

### React

```javascript
/**
 * CartaoPaciente
 * 
 * Exibe informações de um paciente em formato de cartão.
 * Permite clicar para expandir detalhes.
 * 
 * @component
 * @example
 * <CartaoPaciente paciente={paciente} onClique={() => {}} />
 */
function CartaoPaciente({ paciente, onClique }) {
  // Implementação...
}
```

---

## 🎯 Boas Práticas

### DRY (Don't Repeat Yourself)
```javascript
// ❌ REPETIDO
const preco1 = produto1.preco * 0.9;
const preco2 = produto2.preco * 0.9;
const preco3 = produto3.preco * 0.9;

// ✅ REUTILIZÁVEL
function aplicarDesconto(preco, desconto = 0.1) {
  return preco * (1 - desconto);
}
const precos = [produto1, produto2, produto3].map(p => aplicarDesconto(p.preco));
```

### SOLID Principles
- **S**ingle Responsibility: Uma função = um propósito
- **O**pen/Closed: Aberto para extensão, fechado para modificação
- **L**iskov Substitution: Objetos derivados podem substituir a base
- **I**nterface Segregation: Interfaces específicas em vez de genéricas
- **D**ependency Inversion: Dependa de abstrações, não de implementações

### Evitar
- ❌ Variáveis globais (exceto constantes)
- ❌ Magic numbers (sempre use constantes)
- ❌ Console.log em produção
- ❌ Comparações com `==` (use `===`)
- ❌ Funções muito longas (max 50 linhas)

---

## 🧪 Testes

```javascript
// ✅ BOM: Nomes descritivos do teste
describe('GestorPacientes', () => {
  it('deve adicionar um novo paciente com dados válidos', async () => {
    const novoP = { nome: 'João', email: 'joao@example.com' };
    const resultado = await gestor.adicionar(novoP);
    expect(resultado).toBeDefined();
  });

  it('deve lançar erro ao tentar adicionar paciente sem email', async () => {
    const pacienteInvalido = { nome: 'João' };
    await expect(gestor.adicionar(pacienteInvalido)).rejects.toThrow();
  });
});
```

---

## 📏 Limites

| Aspecto | Limite |
|---------|--------|
| Tamanho linha | 100 caracteres |
| Linhas função | 50 |
| Tamanho ficheiro | 500 linhas |
| Parâmetros função | 5 |
| Complexidade ciclomática | 10 |

---

## ✅ Checklist Antes de Submeter PR

- [ ] Código segue este guia de estilo
- [ ] Não há console.log em produção
- [ ] Variáveis têm nomes significativos em português de Portugal
- [ ] Funções têm documentação JSDoc
- [ ] Sem vulnerabilidades de segurança
- [ ] Testes passam
- [ ] Sem erros no linter (ESLint)
- [ ] Commits seguem Conventional Commits
- [ ] Sem ficheiros não rastreados

---

**Última atualização: 2026-04-04**
**Versão: 1.0**
