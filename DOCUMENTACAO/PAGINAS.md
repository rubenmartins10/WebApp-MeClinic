# 📄 Páginas Principais

Documentação detalhada de cada página/funcionalidade do MeClinic.

## 🏠 Visão Geral das Páginas

```
├── Auth         → Login/Registro/2FA
├── Dashboard    → Painel principal
├── Pacientes    → Gestão de pacientes
├── Consultas    → Agendamento e histórico
├── Inventory    → Gestão de produtos
├── Faturacao    → Faturas e recibos
├── FichasTecnicas → Documentação de produtos
├── Report       → Relatórios e análises
├── Users        → Gestão de usuários (admin)
└── Settings     → Configurações pessoais
```

---

## 🔐 `Auth.js`

Sistema de autenticação com email, senha e 2FA.

### Funcionalidades

#### 1. Login
- Email + Senha
- Validação em tempo real
- Mensagens de erro descritas
- Remember me (localStorage)

#### 2. Registro
- Formulário de novo utilizador
- Validação de email único
- Confirmação de senha
- Termos de serviço

#### 3. Autenticação 2FA
- QR Code para escanear
- Código TOTP (6 dígitos)
- Códigos de backup para recuperação
- Enable/disable 2FA após primeiro login

#### 4. Reset de Senha
- Email com link de reset
- Código único de 10 dígitos
- Nova senha com confirmação
- Expiração de 24 horas

### Fluxo de Login

```
┌──────────────────┐
│ Página de Login  │
└────────┬─────────┘
         │ Email + Senha
         ▼
┌──────────────────────────────┐
│ POST /auth/login             │
│ - Validar email              │
│ - Validar senha (bcryptjs)   │
│ - Retornar QR Code 2FA       │
└────────┬─────────────────────┘
         │ QR Code exibido
         ▼
┌──────────────────────────────┐
│ Utilizador escaneia QR       │
│ Insere código TOTP (6 dig)   │
└────────┬─────────────────────┘
         │ Código + Email
         ▼
┌──────────────────────────────┐
│ POST /auth/verify-2fa        │
│ - Validar código TOTP        │
│ - Retornar JWT Token         │
└────────┬─────────────────────┘
         │ JWT + Utilizador
         ▼
┌──────────────────────────────┐
│ localStorage.setItem(token)  │
│ setState(authenticated=true) │
│ Redirecionado para Dashboard │
└──────────────────────────────┘
```

### Componentes Internos

- **EmailInput** - Validação email
- **PasswordInput** - Mascarar senha
- **QRCodeViewer** - Exibe QR code 2FA
- **TOTPInput** - Input para 6 dígitos
- **BackupCodes** - Display de códigos de backup

### Exemplo de Uso da API

```javascript
// 1. Login inicial
const loginResponse = await fetch('http://localhost:5000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@clinica.pt',
    senha: 'senhaSegura123'
  })
});
// Retorna: { qr_code: '...', secret: '...', message: 'Escanee QR code' }

// 2. Verificar 2FA
const verifyResponse = await fetch('http://localhost:5000/auth/verify-2fa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@clinica.pt',
    token_2fa: '123456'  // Código do Google Authenticator
  })
});
// Retorna: { jwt: '...', user: { id: 1, nome: '...', role: 'admin' } }
```

---

## 📊 `Dashboard.js`

Painel principal com visão geral do sistema.

### Componentes do Dashboard

#### 1. KPI Cards
```
┌─────────────────────────────────────────────────┐
│  📊 MÉTRICAS PRINCIPAIS                         │
├─────────────────────────────────────────────────┤
│ [👥 Pacientes]  [📅 Consultas]  [💰 Receita]   │
│  Total: 45      Total: 128      Total: €8,450  │
│  +3 este mês    +12 este mês    +€1,200        │
└─────────────────────────────────────────────────┘
```

#### 2. Próximas Consultas
```
┌─────────────────────────────────────────────────┐
│  📅 PRÓXIMAS CONSULTAS HOJE                     │
├─────────────────────────────────────────────────┤
│ 10:00 - João Silva - Limpeza                    │
│ 10:30 - Maria Santos - Restauração             │
│ 11:00 - Pedro Oliveira - Extraç... (truncado)  │
└─────────────────────────────────────────────────┘
```

#### 3. Alertas de Stock
```
┌─────────────────────────────────────────────────┐
│  ⚠️ PRODUTOS COM STOCK CRÍTICO                  │
├─────────────────────────────────────────────────┤
│ 🔴 Luvas Tamanho M - Stock: 2/10               │
│ 🟡 Anestésico - Stock: 5/20                    │
│ 🟡 Resina A2 - Stock: 8/15                     │
└─────────────────────────────────────────────────┘
```

#### 4. Calendário Mini
- Vista mensal
- Cliques rápidos para datas
- Highlighting de dias com consultas

#### 5. Estatísticas
- Gráfico de consultas por mês
- Distribuição por tipo
- Receita ao longo do tempo

### Dados Exibidos

```javascript
GET /dashboard
Retorna:
{
  kpis: {
    total_pacientes: 45,
    total_consultas: 128,
    receita_mes: 8450.50,
    pacientes_novo_mes: 3,
    consultas_novo_mes: 12
  },
  proximas_consultas: [
    { id: 1, paciente: 'João', hora: '10:00', tipo: 'Limpeza' },
    ...
  ],
  alertas_stock: [
    { produto: 'Luvas M', stock: 2, minimo: 10 },
    ...
  ],
  stats_consultas: [ /* dados para gráfico */ ]
}
```

---

## 👥 `Pacientes.js`

Gestão completa de dados de pacientes.

### Funcionalidades

#### 1. Lista de Pacientes
- Tabela com sorting
- Busca por nome/email/NIF
- Filtros por data de criação
- Paginação (20 por página)
- Indicadores de último contacto

#### 2. Criar Paciente
```
Formulário:
├── Dados Pessoais
│  ├── Nome *
│  ├── Data de Nascimento *
│  ├── Email
│  ├── Telefone
│  └── NIF
├── Morada
│  ├── Rua
│  ├── Código Postal
│  └── Cidade
└── Dados Clínicos
   ├── Tipo Sanguíneo
   ├── Alergias
   ├── Medicações Atuais
   └── Histórico Médico
```

#### 3. Vista de Paciente
- **Infopanel** - Dados pessoais
- **Odontograma** - Mapa dental
- **Histórico de Consultas** - Últimas 10
- **Exames** - Upload/visualização
- **Notas Clínicas** - Observações do dentista
- **Ações** - Editar, deletar, agendar consulta

#### 4. Upload de Exames
- Drag-and-drop ou file picker
- Tipos suportados: JPG, PNG, PDF
- Armazenamento em base64 (BD)
- Visualizador inline

#### 5. Odontograma Digital
- 32 dentes (16 superiores, 16 inferiores)
- Estados: saudável, cárie, preenchimento, falta, implante, coroa
- Edição ao clicar
- Histórico de alterações
- Exportar para PDF

### Endpoints Utilizados

```javascript
GET /pacientes                           // Lista
GET /pacientes/:id                       // Detalhes
POST /pacientes                          // Criar
PUT /pacientes/:id                       // Atualizar
DELETE /pacientes/:id                    // Deletar
GET /pacientes/:id/consultas             // Histórico
POST /pacientes/:id/exames               // Upload exame
GET /pacientes/:id/odonto                // Odontograma
PUT /pacientes/:id/odonto                // Atualizar odonto
```

---

## 📅 `Consultas.js`

Agendamento e registro de consultas.

### Funcionalidades

#### 1. Calendário de Agendamento
- Vista semanal/mensal
- Drag-and-drop para agendar
- Horários disponíveis
- Times slots de 30 min (customizável)

#### 2. Agendar Consulta
```
Formulário:
├── Paciente * (autocomplete)
├── Dentista * (dropdown de disponíveis)
├── Data * (date picker)
├── Hora * (time picker)
├── Tipo * (limpeza, restauração, ext...)
├── Duração (30, 45, 60 min)
├── Notas
└── Confirmação via SMS/Email
```

#### 3. Registro de Procedimento (Durante consulta)
```
Formulário:
├── Procedimentos Realizados
├── Diagnostico
├── Prescricao Medicamentos
├── Notas Adicionais
├── Odontograma (marcar dentes tratados)
├── Valor Cobrado
├── Assinatura Digital
└── [Salvar] [Gerar Receita]
```

#### 4. Lista de Consultas
- Filtro por período
- Busca por paciente
- Status (confirmada, realizada, cancelada)
- Ações rápidas (editar, cancelar, receita)

#### 5. Geração de Receita
- Base em template
- Assinatura digital integrada
- Download automático
- Envio por email (opcional)

### Endpoints Utilizados

```javascript
GET /consultas                           // Lista
GET /consultas/:id                       // Detalhes
POST /consultas                          // Criar
PUT /consultas/:id                       // Atualizar
DELETE /consultas/:id                    // Cancelar
GET /consultas/:id/pdf                   // Gerar receita
```

---

## 📦 `Inventory.js`

Gestão de inventário de medicamentos e descartáveis.

### Funcionalidades

#### 1. Lista de Produtos
- Tabela com: Nome, Categoria, Stock, Preço, Validade
- Filtros por categoria
- Busca por nome/código de barras
- Sorting por qualquer coluna
- Alertas visuais de stock mínimo (🔴🟡)

#### 2. CRUD de Produtos
- **Criar:** Botão + ProductModal
- **Editar:** Clique na linha + ProductModal
- **Deletar:** Confirmação de segurança
- **Atualizar Stock:** Edição inline ou modal

#### 3. Scanner de Código de Barras
- Input de hardware scanner
- Auto-busca de produto
- Incremento rápido de stock
- Feedback visual/sonoro

#### 4. Categorização
Automática quando inserir produto:
- "Luva" → "Descartáveis"
- "Anestesia" → "Anestesia"
- "Desinfe" → "Esterilização"

#### 5. Relatório de Stock
- Produtos com stock crítico
- Movimentação mês anterior
- Valor total do inventário
- Produtos próximos do vencimento

### Exemplo: Fluxo de Entrada de Stock

```
Recebimento de Encomenda
    ↓
1. Escanear n código de barras do produto
    ↓
2. Sistema encontra produto
    ↓
3. Utilizador insere quantidade recebida
    ↓
4. PUT /produtos/:id { stock_atual: stock + quantidade }
    ↓
5. Stock atualizado em tempo real
```

---

## 💰 `Faturacao.js`

Geração e gestão de faturas.

### Funcionalidades

#### 1. Criar Fatura
```
Formulário (AutoFill de Consulta):
├── Paciente * (pre-filled)
├── Data *
├── Itens * (produtos/serviços)
│  ├── Descrição
│  ├── Unidade/Quantidade
│  ├── Preço Unitário
│  └── Subtotal
├── Taxa IVA (dropdown 6/13/23%)
├── Total
├── Notas (condições pagamento)
└── [Gerar PDF] [Enviar Email]
```

#### 2. Lista de Faturas
- Filtros: período, status (pendente/pago/cancelado)
- Busca por número/paciente
- Status visual (cores)
- Ações: visualizar, editar, pagar, cancelar

#### 3. Visualizar Fatura
- PDF inline
- Dados completos
- Assinatura ou carimbo
- Histórico de pagamentos

#### 4. Geração de PDF
- Layout profissional
- Logo da clínica (se configurado)
- QR code de pagamento (futuro)
- Assinatura digital
- Auditoria de geração

#### 5. Relatórios Financeiros
- Receita por período
- Faturas não pagas
- Clientes com atraso
- Gráficos de tendência

---

## 📋 `FichasTecnicas.js`

Documentação técnica de produtos.

### Funcionalidades

#### 1. Lista de Fichas
- Busca por nome/produto
- Categorização
- Versão/data de atualização
- Ícone de PDF disponível

#### 2. Visualizar Ficha
- Informação técnica
- Instruções de uso
- Composição/ingredientes
- Segurança (pictogramas)
- Armazenamento
- Referências/datasheet

#### 3. Download
- PDF individual
- Pack por categoria
- Histórico de versões

---

## 📊 `Report.js`

Relatórios e análises de dados.

### Tipos de Relatórios

#### 1. Relatório de Vendas
- Receita por período
- Produtos mais vendidos
- Margens de lucro
- Sazonalidade

#### 2. Análise de Consultas
- Total por mês
- Distribuição por tipo
- Especialidade mais procurada
- Taxa de ocupação

#### 3. Performance de Dentistas
- Consultas realizadas
- Receita gerada
- Avaliações (futuro)
- Taxa de retenção

#### 4. Inventário
- Movimentação
- Produtos parados
- Produtos próximos do vencimento
- Custo total

#### 5. Pacientes
- Novos por período
- Retenção
- Lifetime value
- Distribuição geográfica

### Funcionalidades

- Filtros de período
- Exportar para CSV/Excel
- Gráficos interativos
- Comparação período anterior
- Agendamento de envio automático

---

## 👤 `Users.js` (Admin Only)

Gestão de utilizadores do sistema.

### Funcionalidades

#### 1. Lista de Utilizadores
- Nome, email, role, último login
- Filtro por role (admin, dentista, assistente)
- Status (ativo/inativo)
- Ações: editar, deletar, reset senha

#### 2. Criar Utilizador
```
Formulário:
├── Nome *
├── Email *
├── Role * (admin/dentista/assistente)
├── Gerar Password Temporária
├── Enviar Email de Ativação
└── [Criar]
```

#### 3. Editar Utilizador
- Mudar dados
- Mudar role
- Ativar/desativar
- Reset de 2FA
- Limpar tokens

#### 4. Logs de Acesso
- Último login
- Número de sessões
- Atividade recente

---

## ⚙️ `Settings.js`

Configurações pessoais do utilizador.

### Funcionalidades

#### 1. Perfil Pessoal
- Editar nome
- Alterar email
- Foto de perfil
- Assinatura digital

#### 2. Segurança
- Mudar password
- Ativar/desativar 2FA
- Downloads de backup codes
- Logout de todas as sessões

#### 3. Preferências
- Idioma (PT/EN)
- Tema (Light/Dark)
- Notificações (email, SMS)
- Formato de data/hora

#### 4. Dados Pessoais
- Exportar dados em JSON
- Deletar conta (irreversível)
- Histórico de atividade

---

## 🔗 Fluxo de Navegação

```
           Auth
            ↓
        Dashboard (home)
       /    |     \      \
      /     |      \      \
   Pac.  Consultas Invent. Faturação
     |       |        |        |
    ├──────┬─────────┴───────┬─┘
    │      │                 │
   Exames Procedimentos      PDFs
           + Receita
```

---

**Última atualização:** Abril 2026
