# 🧩 Componentes Reutilizáveis

Documentação de todos os componentes React disponíveis para reutilização no MeClinic.

## 📂 Localização

Todos os componentes estão em:
```
meclinic-app/client/src/components/
```

---

## 🎨 `Sidebar.js`

Menu lateral com navegação principal.

### Propósito

Fornece navegação global e informações do utilizador logado.

### Props

```jsx
<Sidebar onLogout={handleLogout} />
```

| Prop | Tipo | Obrigatório | Descrição |
|------|------|------------|-----------|
| `onLogout` | Function | ✅ | Callback para fazer logout |

### Funcionalidades

- ✅ Links para todas as páginas
- ✅ Avatar do utilizador
- ✅ Botão de logout
- ✅ Suporte a temas (adaptável a ThemeContext)
- ✅ Suporte a idiomas (lê de LanguageContext)

### Exemplo de Uso

```jsx
import Sidebar from './components/Sidebar';

export default function App() {
  const handleLogout = () => {
    localStorage.removeItem('meclinic_user');
    navigate('/auth');
  };

  return (
    <div>
      <Sidebar onLogout={handleLogout} />
      <main>{/* conteúdo */}</main>
    </div>
  );
}
```

### Estrutura Interna

```
Sidebar
├── UserInfo (avatar, nome)
├── NavLinks
│   ├── Dashboard
│   ├── Pacientes
│   ├── Consultas
│   ├── Inventory
│   ├── Faturação
│   ├── Fichas Técnicas
│   ├── Reports
│   ├── Users (se admin)
│   ├── Settings
│   └── Logout
└── ThemeToggle
```

---

## ✍️ `Assinatura.js`

Canvas para capturar assinatura digital do utilizador.

### Propósito

Permitir assinatura digital em receitas e documentos clínicos.

### Props

```jsx
<Assinatura onSave={handleSave} onClear={handleClear} />
```

| Prop | Tipo | Obrigatório | Descrição |
|------|------|------------|-----------|
| `onSave` | Function | ✅ | Callback com assinatura em base64 |
| `onClear` | Function | ❌ | Callback para limpar canvas |
| `inicializar` | String (base64) | ❌ | Carregar assinatura prévia |

### Funcionalidades

- ✅ Canvas para desenho livre
- ✅ Exportar como base64
- ✅ Limpar canvas
- ✅ Salvar em localStorage
- ✅ Desenho com mouse/touch

### Exemplo de Uso

```jsx
import Assinatura from './components/Assinatura';
import { useState } from 'react';

export default function Consultas() {
  const [assinatura, setAssinatura] = useState('');

  const handleSave = (base64) => {
    setAssinatura(base64);
    console.log('Assinatura salva:', base64);
  };

  return (
    <div>
      <Assinatura onSave={handleSave} />
      {assinatura && <p>✅ Assinatura capturada</p>}
    </div>
  );
}
```

### Propriedades do Canvas

- **Tamanho:** 400x200 px (responsivo)
- **Cor do Traço:** Preta (#000)
- **Espessura:** 2px
- **Formato de Saída:** PNG em base64

---

## 📱 `BarcodeScanner.js`

Leitor de código de barras para produtos.

### Propósito

Permitir rápida entrada de produtos en Inventory via scanner.

### Props

```jsx
<BarcodeScanner onDetect={handleDetect} />
```

| Prop | Tipo | Obrigatório | Descrição |
|------|------|------------|-----------|
| `onDetect` | Function | ✅ | Callback com código lido |
| `ativo` | Boolean | ❌ | Ativar/desativar scanner |

### Funcionalidades

- ✅ Lê código de barras
- ✅ Busca produto no BD
- ✅ Auto-incrementa quantidade
- ✅ Validação de produto
- ✅ Feedback visual/sonoro

### Exemplo de Uso

```jsx
import BarcodeScanner from './components/BarcodeScanner';

export default function Inventory() {
  const handleDetect = (codigo_barras) => {
    // Buscar produto
    fetch(`/api/produtos?codigo=${codigo_barras}`)
      .then(r => r.json())
      .then(produto => {
        console.log('Produto detectado:', produto.nome);
        // Adicionar ao carrinho/lista
      });
  };

  return <BarcodeScanner onDetect={handleDetect} />;
}
```

### Fluxo de Funcionamento

```
Scanner lê código
    ↓
onDetect chamado
    ↓
Fetch à API
    ↓
Produto encontrado
    ↓
Atualizar lista/carrinho
```

---

## 🦷 `Odontograma.js`

Visualização e edição de odontograma (mapa dental).

### Propósito

Registrar estado de cada dente e procedimentos realizados.

### Props

```jsx
<Odontograma 
  dados={odontogramaDados} 
  onUpdate={handleUpdate}
  editavel={true}
/>
```

| Prop | Tipo | Obrigatório | Descrição |
|------|------|------------|-----------|
| `dados` | Object | ✅ | Estado dos dentes (JSON) |
| `onUpdate` | Function | ✅ | Callback ao atualizar |
| `editavel` | Boolean | ❌ | Permitir edição (default: true) |

### Formato dos Dados

```javascript
{
  "1": "saudavel",       // Dente superior direito
  "2": "saudavel",
  "3": "carie",          // Com cárie
  "4": "preenchimento",  // Com preenchimento
  "5": "falta",          // Ausente
  "6": "implante",       // Implante
  "7": "coroa",          // Com coroa
  ...
  "32": "saudavel"       // Dente inferior esquerdo
}
```

### Estados Possíveis

- `saudavel` - Dente sem problemas (verde)
- `carie` - Com cárie (vermelho)
- `preenchimento` - Com restauração (amarelo)
- `falta` - Dente ausente (cinza)
- `implante` - Implante (azul claro)
- `coroa` - Com coroa (azul escuro)
- `tratado` - Endodontia realizada (roxo)

### Exemplo de Uso

```jsx
import Odontograma from './components/Odontograma';
import { useState } from 'react';

export default function Pacientes() {
  const [odonto, setOdonto] = useState({});

  const handleUpdate = (novosDados) => {
    setOdonto(novosDados);
    // Salvar no BD
    fetch(`/api/pacientes/${id}/odonto`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ odontograma_dados: novosDados })
    });
  };

  return <Odontograma dados={odonto} onUpdate={handleUpdate} />;
}
```

### Visual

```
Maxila (Superior)
  1 2 3 4 5 6 7 8
  └─────────────┘
  
  └─────────────┐
  25 26 27 28 29 30 31 32

Mandíbula (Inferior)

Cada dente é um quadrado clicável com cor
```

---

## 🛍️ `ProductModal.js`

Modal para adicionar/editar produtos no inventário.

### Props

```jsx
<ProductModal 
  isOpen={true}
  produto={null}
  onSave={handleSave}
  onClose={handleClose}
/>
```

| Prop | Tipo | Obrigatório | Descrição |
|------|------|------------|-----------|
| `isOpen` | Boolean | ✅ | Modal visível |
| `produto` | Object | ❌ | Produto para editar (null = novo) |
| `onSave` | Function | ✅ | Callback ao salvar |
| `onClose` | Function | ✅ | Callback para fechar |

### Funcionalidades

- ✅ Formulário de produto
- ✅ Validação de campos
- ✅ Upload de imagem
- ✅ Auto-categorização
- ✅ Cálculo de validade
- ✅ Código de barras

### Campos do Formulário

```
Nome *
Descrição
Categoria (auto)
Stock Atual *
Stock Mínimo
Preço Unitário €
Preço Custo €
Unidade de Medida
Data de Validade
Código de Barras
Fornecedor
Imagem
```

### Exemplo de Uso

```jsx
import ProductModal from './components/ProductModal';
import { useState } from 'react';

export default function Inventory() {
  const [modalOpen, setModalOpen] = useState(false);
  const [produto, setProduto] = useState(null);

  const handleSave = (produtoData) => {
    fetch('/api/produtos', {
      method: produto ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produtoData)
    })
    .then(r => r.json())
    .then(() => setModalOpen(false));
  };

  return (
    <>
      <button onClick={() => setModalOpen(true)}>
        + Novo Produto
      </button>
      <ProductModal 
        isOpen={modalOpen}
        produto={produto}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
```

---

## 📊 `InventoryList.js`

Lista reutilizável para produtos com filtros e ações.

### Props

```jsx
<InventoryList 
  produtos={[...]}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onUpdateStock={handleStock}
/>
```

| Prop | Tipo | Obrigatório | Descrição |
|------|------|------------|-----------|
| `produtos` | Array | ✅ | Array de produtos |
| `onEdit` | Function | ❌ | Callback para editar |
| `onDelete` | Function | ❌ | Callback para deletar |
| `onUpdateStock` | Function | ❌ | Callback para atualizar stock |

### Funcionalidades

- ✅ Tabela com sorting
- ✅ Filtros por categoria
- ✅ Busca por nome
- ✅ Alert de stock mínimo
- ✅ Ações (editar, deletar)
- ✅ Paginação (opcional)

### Exemplo de Uso

```jsx
import InventoryList from './components/InventoryList';
import { useEffect, useState } from 'react';

export default function Inventory() {
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    fetch('/api/produtos')
      .then(r => r.json())
      .then(setProdutos);
  }, []);

  return (
    <InventoryList 
      produtos={produtos}
      onEdit={(p) => console.log('Editar:', p.id)}
      onDelete={(id) => console.log('Deletar:', id)}
    />
  );
}
```

### Estrutura da Tabela

| Coluna | Tipo | Filtro |
|--------|------|--------|
| Nome | Text | ✅ Busca |
| Categoria | Select | ✅ Dropdown |
| Stock | Number | ⚠️ Alerta se < mínimo |
| Preço | Currency | ✅ Range |
| Validade | Date | ✅ Date picker |
| Ações | Buttons | - |

---

## 🌍 Contextos Globais

### `LanguageContext`

Fornece suporte a múltiplos idiomas.

```jsx
import { useContext } from 'react';
import { LanguageContext } from '../LanguageContext';

export default function MyComponent() {
  const { t, language, setLanguage } = useContext(LanguageContext);

  return (
    <>
      <h1>{t('pages.dashboard.title')}</h1>
      <button onClick={() => setLanguage('en')}>
        {t('languages.english')}
      </button>
    </>
  );
}
```

**Idiomas Suportados:**
- `pt` - Português
- `en` - English

### `ThemeContext`

Fornece temas personalizados (claro/escuro).

```jsx
import { useContext } from 'react';
import { ThemeContext } from '../ThemeContext';

export default function MyComponent() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div style={{
      backgroundColor: theme.background,
      color: theme.text
    }}>
      <button onClick={toggleTheme}>
        🌙 Alternar Tema
      </button>
    </div>
  );
}
```

**Propriedades de Tema:**

```javascript
{
  background: '#fff',
  text: '#000',
  border: '#ddd',
  inputBg: '#f5f5f5',
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107'
}
```

---

## 💡 Padrões de Reutilização

### ✅ BOM PADRÃO

```jsx
// Componente genérico e reutilizável
import ProductModal from './components/ProductModal';

function Page1() {
  const handleSave = (dados) => { /* ... */ };
  return <ProductModal onSave={handleSave} />;
}

function Page2() {
  const handleSave = (dados) => { /* ... */ };
  return <ProductModal onSave={handleSave} />;
}
```

### ❌ PADRÃO A EVITAR

```jsx
// Componente acoplado a uma página específica
// NÃO REUTILIZÁVEL!
function ProductModalInventoryOnly() {
  const [produtos, setProdutos] = useState([]);
  // Lógica específica do Inventory
  return <div>...</div>;
}
```

---

## 📚 Componentes Futuros

Componentes a serem criados:

- [ ] `DatePicker.js` - Selecionador de datas
- [ ] `ImageUpload.js` - Upload de imagens
- [ ] `DataTable.js` - Tabela avançada com paginação
- [ ] `FormValidator.js` - Validação de formulários
- [ ] `Notifications.js` - Sistema de notificações
- [ ] `ExamViewer.js` - Visualizador de imagens médicas (DICOM)
- [ ] `ReportGenerator.js` - Gerador de relatórios PDF

---

## 🎯 Checklist para Novo Componente

Ao criar um novo componente reutilizável:

- [ ] Componente funcional com hooks
- [ ] Props bem documentadas
- [ ] Suporte a thema (ThemeContext)
- [ ] Suporte a idiomas (LanguageContext)
- [ ] Tratamento de erros
- [ ] Testes básicos (.test.js)
- [ ] Exemplos de uso em comentário
- [ ] Sem dependências externos (usar Lucide para ícones)

---

**Última atualização:** Abril 2026
