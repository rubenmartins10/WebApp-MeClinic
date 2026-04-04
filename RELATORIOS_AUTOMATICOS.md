# 📊 Sistema Automático de Relatórios Semanais - Documentação

## 🎯 Funcionalidades Implementadas

### 1. **Geração Automática de Relatórios em PDF**
- **Frequência**: Todas as sextas-feiras às 16:00 (hora do servidor)
- **Destinatários**: Todos os utilizadores com role `ADMIN`
- **Formato**: PDF profissional com identidade visual MeClinic
- **Conteúdo**:
  - ✅ Resumo Executivo (5 KPIs principais)
  - ✅ Status de Consultas (Confirmadas, Concluídas, Canceladas)
  - ✅ Top 5 Pacientes (por número de consultas)
  - ✅ Top 5 Produtos (mais vendidos)
  - ✅ Alertas de Stock (baixo stock + vencimento próximo)
  - ✅ Cabeçalho e rodapé profissional

### 2. **Email Profissional**
- Template HTML responsivo com branding MeClinic
- Logo e cores corporativas (azul #0066cc)
- Gradiente no cabeçalho
- Anexo: PDF com dados detalhados
- Remetente: `MeClinic <seu_email@gmail.com>`

### 3. **Agendamento com Node-Cron**
- Job automático que executa toda sexta às 16:00
- Roda em background sem interferir com a aplicação
- Logs automáticos no console do servidor
- Trata erros graciosamente

---

## 🚀 Como Usar

### **Testar Envio Manual** (Desenvolvimento)

```bash
# 1. Abrir terminal
curl -X POST http://localhost:5000/api/reports/send-weekly-manual

# Resposta esperada:
# {
#   "success": true,
#   "message": "Relatório enviado para 2 administrador(es)",
#   "recipients": 2
# }
```

### **Verificar Logs de Agendamento**

Quando o servidor inicia, você vê:
```
✅ Agendamento ativo: Relatórios enviados toda sexta-feira às 16:00
```

Na sexta às 16:00, o console mostra:
```
📊 [SCHEDULED] Iniciando envio automático de relatório semanal...
✅ [SCHEDULED] Relatório enviado para 2 administrador(es)
```

---

## 📋 Dados Incluídos no Relatório

### **Resumo Executivo (5 Boxes)**
| Métrica | Cálculo |
|---------|---------|
| Consultas | Total de consultas da semana |
| Pacientes | Total de pacientes distintos |
| Faturação | Σ de valores em faturação |
| Faturas | Total de faturas emitidas |
| Ticket Médio | Valor médio por fatura |

### **Status de Consultas**
- Confirmadas: Consultas status = 'confirmada'
- Concluídas: Consultas status = 'concluida'
- Canceladas: Consultas status = 'cancelada'

### **Top 5 Pacientes**
Ordenado por número de consultas (descendente)

### **Top 5 Produtos**
Ordenado por quantidade vendida (descendente)

### **Alertas de Stock**
- Stock abaixo do mínimo
- Validade próxima (< 30 dias)

---

## 🔧 Configuração

### **Arquivo: `server/controllers/reportsController.js`**
- `generateWeeklyReportPDF()` - Gera o PDF
- `sendWeeklyReportEmail()` - Principal função de envio
- `getAdministrators()` - Lista todos os ADMINs

### **Arquivo: `server/routes/reports.routes.js`**
- `POST /api/reports/send-weekly-manual` - Endpoint para testes

### **Arquivo: `server/index.js` (linhas ~295+)**
```javascript
cron.schedule('0 16 * * 5', async () => {
  // Executa sexta às 16:00
});
```

---

## 📧 Email de Exemplo

**De:** MeClinic <seu_email@gmail.com>  
**Para:** admin@meclinic.pt  
**Assunto:** 📊 Relatório Semanal MeClinic - 04/04/2026

**Corpo:**
```
Olá [Nome Admin],

Segue em anexo o relatório semanal da clínica MeClinic com as 
principais estatísticas, vendas, pacientes e alertas.

📎 Documento anexado: Relatório_Semanal_2026-04-04.pdf

Este é um email automático gerado pelo sistema MeClinic.
```

---

## ⚙️ Variáveis de Ambiente Necessárias

Certifique-se de que `.env` tem:
```
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app
SMTP_HOST=smtp.gmail.com
```

---

## 🔐 Segurança

✅ Emails enviados apenas para utilizadores com role = 'ADMIN'  
✅ PDF com logo e branding da clínica  
✅ Rodapé: "Informação Confidencial"  
✅ Sem dados sensíveis (como IPs) no email  
✅ Anexo criptografado em trânsito (TLS/SSL)

---

## 🐛 Troubleshooting

### Relatório não está sendo enviado automaticamente

**Problema:** Job cron não está executando  
**Verificação:**
1. Server iniciou com mensagem `✅ Agendamento ativo`?
2. Na sexta às 16:00, há logs? (veja console do servidor)
3. Há administradores cadastrados? `SELECT * FROM utilizadores WHERE role='ADMIN';`

### Email não recebido

**Verificação:**
1. Admin tem um email válido cadastrado?
2. Credenciais Gmail corretas em `.env`?
3. Gmail App Password gerada (não a senha normal)?
4. Teste manual: `curl -X POST http://localhost:5000/api/reports/send-weekly-manual`

### PDF com formatação quebrada

**Problema comum:** Fonts não carregadas  
**Solução:** PDF usa fonts padrão PDFKit (não precisa instalar)

---

## 📚 Arquivos Criados/Modificados

| Arquivo | Alteração |
|---------|-----------|
| `server/controllers/reportsController.js` | **CRIADO** - 280+ linhas |
| `server/routes/reports.routes.js` | **MODIFICADO** - Adicionada rota `/send-weekly-manual` |
| `server/index.js` | **MODIFICADO** - Agendamento com cron adicionado ~20 linhas |

---

## 🎨 Próximas Melhorias (Opcional)

- [ ] Dashboard com histórico de relatórios enviados
- [ ] Seleção de frequência de envio (semanal/mensal/trimestral)
- [ ] Personalização de destinatários
- [ ] Gráficos no PDF (Chart.js + Puppeteer)
- [ ] Suporte para múltiplos idiomas (PT/EN/ES)
- [ ] Cache de relatórios gerados
- [ ] Templates customizáveis

---

## ✅ Checklist de Validação

- [x] Cron job agendado
- [x] PDF gerado com sucesso
- [x] Emails enviados para ADMINs
- [x] Template HTML profissional
- [x] Tratamento de erros implementado
- [x] Logs do servidor funcionam
- [x] Endpoint manual para testes disponível
- [x] Documentação completa

---

**Última atualização:** 04 de Abril de 2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para produção
