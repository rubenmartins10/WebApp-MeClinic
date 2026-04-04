# ✨ Funcionalidades do MeClinic

Visão geral de todas as funcionalidades implementadas e em desenvolvimento.

## ✅ Funcionalidades Implementadas

### 🔐 Autenticação e Segurança

- [x] **Login com Email + Senha**
  - Validação em tempo real
  - Mensagens de erro claras
  - Remember me (localStorage)

- [x] **Autenticação 2FA (TOTP)**
  - Geração de QR Code
  - Suporte a Google Authenticator, Microsoft, Authy
  - Códigos de backup para recuperação
  - Window de sincronização (±60 segundos)

- [x] **JWT Token Management**
  - Expiração de 24h
  - Refresh automático (futuro)
  - Logout em todas as sessões

- [x] **Role-Based Access Control (RBAC)**
  - Roles: admin, dentista, assistente
  - Validação de permissões por endpoint
  - Redirecionamento de acesso negado

- [x] **Reset de Senha**
  - Código de 10 dígitos via email
  - Expiração de 24h
  - Segurança: não revela se email existe

- [x] **Criptografia de Senhas**
  - Bcryptjs com salt rounds
  - Nunca armazenar plain text
  - Comparação segura em login

### 👥 Gestão de Pacientes

- [x] **CRUD de Pacientes**
  - Criar, ler, atualizar, deletar
  - Validação de dados obrigatórios
  - Soft delete (manter histórico)

- [x] **Dados Demográficos**
  - Nome, data nascimento, email, telefone
  - Morada completa
  - NIF/CPF
  - Foto de perfil (base64)

- [x] **Dados Clínicos**
  - Tipo sanguíneo
  - Alergias conhecidas
  - Medicações atuais
  - Histórico médico

- [x] **Notas Clínicas**
  - Observações livre
  - Data de atualização
  - Utilizador que atualizou

- [x] **Odontograma Digital**
  - 32 dentes mapeados
  - Estados: saudável, cárie, preenchimento, falta, implante, coroa
  - Histórico de alterações
  - Visualização durante consulta

- [x] **Upload de Exames**
  - Suporta: JPG, PNG, PDF
  - Armazenamento em base64
  - Visualizador inline
  - Metadados (data, tipo de exame)

### 📅 Consultas e Procedimentos

- [x] **Agendamento de Consultas**
  - Calendário visual
  - Time slots de 30 minutos
  - Verificação de disponibilidade
  - Confirmação automática

- [x] **Registro de Procedimentos**
  - Descrição do que foi feito
  - Diagnóstico
  - Prescrição de medicamentos
  - Assinatura digital
  - Valor cobrado

- [x] **Histórico de Consultas**
  - Lista por paciente
  - Filtros por período
  - Busca rápida
  - Replicação de consulta anterior

- [x] **Geração de Receitas**
  - PDF com dados de consulta
  - Assinatura digital do dentista
  - Instruções de medicação
  - Próxima consulta recomendada

### 📦 Gestão de Inventário

- [x] **CRUD de Produtos**
  - Criar, ler, atualizar, deletar
  - Validação de campos obrigatórios
  - Histórico de movimentação

- [x] **Controle de Stock**
  - Stock atual vs stock mínimo
  - Alertas visuais (🔴 crítico, 🟡 aviso)
  - Atualização em tempo real
  - Histórico de movimentações

- [x] **Categorização de Produtos**
  - Automática por nome (IA básica)
  - Manual (override)
  - Filtros por categoria

- [x] **Código de Barras**
  - Leitura via hardware scanner
  - Busca rápida
  - Auto-incremento de quantidade

- [x] **Informação de Produto**
  - Nome, descrição
  - Preço unitário e custo
  - Data de validade
  - Fornecedor
  - Imagem

- [x] **Unidades de Medida**
  - Unidade (padrão)
  - Miligramas
  - Mililitros
  - Customizável

### 💰 Faturação

- [x] **Geração de Faturas**
  - Automática após consulta
  - Manual para serviços específicos
  - Itens com quantidade e valor
  - Cálculo de subtotal e IVA

- [x] **Numeração de Faturas**
  - Sequencial automática
  - Formato: INV-YYYY-NNNN
  - Sem saltos de número

- [x] **Status de Faturação**
  - Pendente (não paga)
  - Pago (recebido)
  - Cancelado (anulado)
  - Atrasado (vencido)

- [x] **Cálculo de IVA**
  - Taxas: 6%, 13%, 23%
  - Configurável por item
  - Total com e sem IVA

- [x] **PDF de Fatura**
  - Layout profissional
  - QR code de pagamento (futuro)
  - Assinatura/carimbo
  - Histórico de gerações

- [x] **Envio por Email**
  - Automático após pagamento (futuro)
  - Manual sob demanda
  - Template customizável

### 📊 Relatórios e Analytics

- [x] **Dashboard com Métricas**
  - KPIs principais
  - Gráficos de tendência
  - Alertas críticos
  - Últimas atividades

- [x] **Relatório de Vendas**
  - Receita por período
  - Produtos mais vendidos
  - Margem de lucro
  - Comparação período anterior

- [x] **Relatório de Consultas**
  - Total por mês
  - Distribuição por tipo
  - Dentista com mais consultas
  - Taxa de ocupação

- [x] **Relatório de Inventário**
  - Produtos com stock crítico
  - Movimentação
  - Produtos próximos do vencimento
  - Custo total do inventário

- [x] **Relatório de Pacientes**
  - Novos por período
  - Histórico de contactos
  - Pacientes inativos
  - Distribuição geográfica

- [x] **Exportação de Dados**
  - Formato CSV
  - Formato Excel (futuro)
  - Download direto
  - Agendamento automático (futuro)

### 📝 Fichas Técnicas

- [x] **Armazenamento de Fichas**
  - Produtos com documentação
  - Versioning
  - Upload de PDF

- [x] **Visualização**
  - Inline viewer
  - Download direto
  - Busca por produto

- [x] **Informação Técnica**
  - Composição
  - Modo de utilização
  - Efeitos colaterais
  - Contra-indicações

### ⚙️ Administração

- [x] **Gestão de Utilizadores**
  - CRUD de usuários (admin)
  - Atribuição de roles
  - Reset de 2FA
  - Ativar/desativar usuário

- [x] **Auditoria Básica**
  - Último login registado
  - IP do acesso
  - Quem criou recurso
  - Data de criação

- [x] **Backup Manual**
  - Export de dados
  - Script SQL
  - Agendamento (futuro)

### 🌍 Localização e Preferências

- [x] **Suporte a Idiomas**
  - Português (Portugal)
  - English
  - Extensível para outros idiomas

- [x] **Temas Personalizáveis**
  - Modo claro
  - Modo escuro
  - Paleta customizável

- [x] **Preferências de Utilizador**
  - Idioma preferido
  - Tema preferido
  - Formato de data/hora

### 🎨 Interface de Utilizador

- [x] **Design Responsivo**
  - Desktop
  - Tablet
  - Mobile

- [x] **Componentes Reutilizáveis**
  - Sidebar navegação
  - Modals
  - Forms validados
  - Tabelas com sorting

- [x] **Feedback Visual**
  - Alertas de sucesso
  - Mensagens de erro
  - Loading spinners
  - Confirmações de ação

---

## 🔄 Em Desenvolvimento

### 📱 Mobile App
- [ ] React Native para iOS/Android
- [ ] Sincronização offline
- [ ] Notificações push

### 📊 Relatórios Avançados
- [ ] Dashboards customizáveis
- [ ] Gráficos interativos (Chart.js)
- [ ] Exportação para PowerPoint
- [ ] Agendamento de relatórios por email

### 🔗 Integrações
- [ ] Integração com Doctolib (agendamento)
- [ ] Integração com PAgateway (pagamentos)
- [ ] Integração com mailchimp (newsletters)
- [ ] Integração com SMS (notificações)

### 📞 Comunicações
- [ ] SMS automático de lembrança de consulta
- [ ] WhatsApp para mensagens
- [ ] Chat integrado (paciente-dentista)
- [ ] Vídeo consulta (futuro)

### 💳 Pagamentos
- [ ] Integração Stripe
- [ ] Integração PayPal
- [ ] Integração Multibanco (Portugal)
- [ ] Recibos digitais com QR code

### 🏥 Multi-Clínica
- [ ] Suporte para múltiplas clínicas
- [ ] Gestão centralizée
- [ ] Permissões por clínica
- [ ] Relatórios consolidados

---

## 📋 Funcionalidades Futuras

### Curto Prazo (~3 meses)
- Agendamento automático de lembretes
- Histórico completo de transações
- Backups automáticos diários
- Cache de dados (Redis)
- Rate limiting

### Médio Prazo (~6 meses)
- Mobile app (React Native)
- Videoconsulta
- Chat em tempo real
- Marketplace de fornecedores
- Integração com universidades (ensino)

### Longo Prazo (~12 meses)
- IA para diagnóstico auxiliar
- Reconhecimento de radiografias
- Machine learning de padrões clínicos
- Expansion internacional
- Blockchain para receitas digitais

---

## 📊 Estatísticas de Funcionalidades

| Categoria | Implementadas | Em Dev | Futuro | Total |
|-----------|---|---|---|---|
| Autenticação | 6 | 0 | 2 | 8 |
| Pacientes | 5 | 0 | 1 | 6 |
| Consultas | 4 | 0 | 2 | 6 |
| Inventário | 5 | 0 | 2 | 7 |
| Faturação | 6 | 1 | 2 | 9 |
| Relatórios | 5 | 3 | 5 | 13 |
| Admin | 3 | 0 | 4 | 7 |
| UI/UX | 4 | 0 | 2 | 6 |
| **TOTAL** | **38** | **4** | **20** | **62** |

---

## 🎯 Prioridades de Desenvolvimento

### P0 (Crítico)
- ✅ Autenticação 2FA
- ✅ CRUD de pacientes
- ✅ Agendamento de consultas
- ✅ Gestão de inventário
- ✅ Faturação básica

### P1 (Alto)
- 🔄 Relatórios completos
- 🔄 Backup automático
- 🔄 Multi-idioma
- 🔄 Temas personalizados

### P2 (Médio)
- 📋 Mobile app
- 📋 Integração com pagamentos
- 📋 Chat
- 📋 Notificações SMS

### P3 (Baixo)
- 📋 IA/ML
- 📋 Videoconsulta
- 📋 Blockchain
- 📋 Marketplace

---

## 🧪 Dados de Teste

### Credenciais Padrão

Após rodar script SQL:

```
Admin:
  Email: admin@clinica.pt
  Senha: admin123
  2FA: Escanear QR code

Dentista:
  Email: dentista@clinica.pt
  Senha: dentista123
  2FA: Escanear QR code

Assistente:
  Email: assistente@clinica.pt
  Senha: assistente123
  2FA: Escanear QR code
```

### Pacientes de Teste

```
- João Silva (34 anos, NIF: 123456789)
- Maria Santos (28 anos, NIF: 987654321)
- Pedro Oliveira (45 anos, NIF: 555555555)
... (inseridos via script)
```

---

## 📝 Requests de Features

### Como Sugerir Nova Funcionalidade?

1. Abrir GitHub Issue com título descritivo
2. Descrever o problema que resolve
3. Casos de uso
4. Mockup/screenshot (se possível)
5. Prioridade estimada

### Exemplo:
```
Título: [FEATURE] Notificações por SMS

Descrição:
Quando o paciente está marcado numa consulta amanhã,
enviar SMS de lembrança 24h antes.

Caso de uso:
- Reduzir falta-pé às consultas
- Melhorar experiência do paciente

Prioridade: P1 (Alto)
```

---

**Última atualização:** Abril 2026
