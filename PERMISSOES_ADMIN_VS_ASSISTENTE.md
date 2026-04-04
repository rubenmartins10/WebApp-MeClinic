# 🔐 SISTEMA DE PERMISSÕES - ADMIN vs ASSISTENTE

**Status:** ✅ APROVADO  
**Data Aprovação:** 04 Abril 2026  
**Versão:** 1.1 - FINAL

---

## 🎯 DECISÕES APROVADAS

| Questão | Decisão | Justificação |
|---------|---------|--------------|
| 1️⃣ Assistente pode **ELIMINAR** consulta sua? | ✅ **SIM** | Controlo total sobre próprio trabalho |
| 2️⃣ Assistente pode **VER números** de ocupação/produtividade? | ✅ **SIM** | Necessário para auto-avaliação |
| 3️⃣ Assistente pode **GERAR recibos** de pagamento? | ✅ **SIM** | Operação essencial do dia-a-dia |
| 4️⃣ Assistente tem acesso a **RELATÓRIOS**? | ✅ **SIM** | Acesso completo a relatórios |
| 5️⃣ Dados sensíveis que Assistente **NUNCA** vê? | ✅ **PODE VER TUDO** | Acesso liberal - sem restrições de dados |

---

## 👤 ROLE: ADMINISTRADOR (ADMIN)

### Permissões COMPLETAS - 60/60 ✅

| Categoria | Permissões | Status |
|-----------|-----------|--------|
| **Autenticação** | Alterar password, MFA, Ver logins, Desconectar outros, Gerir sessões | ✅ 6/6 |
| **Pacientes** | Criar, Editar, Ver histórico, Eliminar, Exportar, Notas | ✅ 6/6 |
| **Consultas** | Criar, Editar, Cancelar, Recibos, Alterar preços, Relatórios | ✅ 6/6 |
| **Faturação** | Criar, Editar, Eliminar, Histórico, Exportar, Preços, Pagamentos | ✅ 7/7 |
| **Inventário** | Criar, Editar, Eliminar, Stock, Alertas, Compras | ✅ 6/6 |
| **Fichas Técnicas** | Criar, Editar, Eliminar, Preços, Custos, PDF | ✅ 6/6 |
| **Relatórios** | Todos os relatórios, Personalizar, Exportar, Financeiro, Ocupação | ✅ 5/5 |
| **Utilizadores** | Criar, Editar, Roles, Desativar, Eliminar, Histórico atividade | ✅ 6/6 |
| **Configurações** | Dados clínica, Timezone, Preferências, Backup | ✅ 5/5 |
| **Segurança** | Audit logs, GDPR Delete, Tentativas login, Políticas, Certificados | ✅ 6/6 |

---

## 👥 ROLE: ASSISTENTE - PERMISSÕES EXPANDIDAS

### Permissões LIBERAIS - 46/60 ✅ (77% de acesso)

#### 1. **AUTENTICAÇÃO & CONTA** ✅ (4/6)
- [x] Alterar própria password
- [x] Ativar/Desativar MFA (própria conta)
- [x] Aceder ao próprio histórico de logins
- [x] Visualizar próprias sessões
- [ ] ❌ Desconectar sessões de OUTROS *(Admin only)*
- [ ] ❌ Eliminar própria conta *(Admin only)*

#### 2. **PACIENTES** ✅ (6/6)
- [x] Criar novo paciente
- [x] Editar dados de pacientes
- [x] Visualizar histórico completo
- [x] Ver notas clínicas
- [x] Eliminar paciente *(com soft-delete)*
- [x] Exportar dados de pacientes

#### 3. **CONSULTAS/APPOINTMENTS** ✅ (6/6)
- [x] Criar consultas (sem limite)
- [x] Editar próprias consultas
- [x] Editar consultas de OUTROS *(com audit log)*
- [x] Gerar & Exportar recibos ✅ **NOVO**
- [x] Cancelar/Eliminar próprias consultas ✅ **NOVO**
- [x] Visualizar relatórios de ocupação ✅ **NOVO**

#### 4. **FATURAÇÃO** ✅ (4/7)
- [x] Criar faturas
- [x] Editar faturas *(próprias)*
- [x] Gerar recibos de pagamento ✅ **NOVO**
- [x] Histórico de faturação
- [ ] ❌ Eliminar faturas *(Admin only)*
- [ ] ❌ Exportar relatórios financeiros completos *(dados sensíveis)*
- [ ] ❌ Alterar preços *(Admin only)*

#### 5. **INVENTÁRIO/PRODUTOS** ✅ (6/6)
- [x] Criar produtos
- [x] Editar produtos
- [x] Visualizar quantidades de stock
- [x] Ver alertas de stock mínimo
- [x] Editar stock
- [x] Gerar ordens de compra

#### 6. **FICHAS TÉCNICAS** ✅ (4/6)
- [x] Criar fichas técnicas
- [x] Editar fichas
- [x] Usar fichas em consultas
- [x] Visualizar preços
- [ ] ❌ Eliminar fichas *(Admin only)*
- [ ] ❌ Alterar preços de custo *(dados financeiros sensíveis)*

#### 7. **RELATÓRIOS** ✅ (5/5)
- [x] Aceder a TODOS os relatórios ✅ **NOVO**
- [x] Gerar relatórios personalizados
- [x] Exportar dados (CSV, PDF)
- [x] Ver relatórios de ocupação e produtividade ✅ **NOVO**
- [x] Histórico de atividade própria

#### 8. **GESTÃO DE UTILIZADORES** ✅ (1/6)
- [x] Ver lista de utilizadores *(readonly)*
- [ ] ❌ Criar novo utilizador *(Admin only)*
- [ ] ❌ Editar utilizadores *(Admin only)*
- [ ] ❌ Alterar roles *(Admin only)*
- [ ] ❌ Desativar utilizador *(Admin only)*
- [ ] ❌ Ver histórico de atividade de outros *(Admin only)*

#### 9. **CONFIGURAÇÕES DO SISTEMA** ✅ (0/5)
- [ ] ❌ Alterar dados da clínica
- [ ] ❌ Definir timezone
- [ ] ❌ Alterar preferências gerais
- [ ] ❌ Configurar backups

#### 10. **CONFORMIDADE & SEGURANÇA** ✅ (2/6)
- [x] Download dos PRÓPRIOS dados (GDPR)
- [x] Ver próprio histórico de atividade
- [ ] ❌ Logs de auditoria completos *(Admin only)*
- [ ] ❌ Ver dados de outros *(Admin only)*
- [ ] ❌ Tentativas de login de outros *(Admin only)*
- [ ] ❌ Configurar políticas de segurança *(Admin only)*

---

## 📊 COMPARATIVA FINAL

| Funcionalidade | Admin | Assistente | Mudança |
|---|---|---|---|
| **Autenticação** | ✅ 6/6 | ✅ 4/6 | - |
| **Pacientes** | ✅ 6/6 | ✅ 6/6 | ⬆️ +2 |
| **Consultas** | ✅ 6/6 | ✅ 6/6 | ⬆️ +2 |
| **Faturação** | ✅ 7/7 | ✅ 4/7 | ⬆️ +3 |
| **Inventário** | ✅ 6/6 | ✅ 6/6 | ⬆️ +4 |
| **Fichas Técnicas** | ✅ 6/6 | ✅ 4/6 | ⬆️ +2 |
| **Relatórios** | ✅ 5/5 | ✅ 5/5 | ⬆️ +4 |
| **Utilizadores** | ✅ 6/6 | ✅ 1/6 | - |
| **Configurações** | ✅ 5/5 | ✅ 0/5 | - |
| **Segurança** | ✅ 6/6 | ✅ 2/6 | ⬆️ +1 |
| **TOTAL** | **60/60** | **46/60** | **77% ⬆️** |

---

## 🔐 RESTRIÇÕES FINAIS (O que Assistente NÃO pode fazer)

### ❌ ADMIN ONLY (14 Permissões)

1. **Gestão de Utilizadores:** Criar, editar, alterar roles, desativar, ver logs de outros
2. **Configurações da Clínica:** Dados, timezone, preferências globais
3. **Auditoria Completa:** Ver logs de todos, tentativas de login suspeitas
4. **Dados Financeiros Sensíveis:** Preços de custo, margem de lucro
5. **Operações Críticas:** Eliminar contas, desconectar outros
6. **Eliminar Definitivamente:** Patentes, fichas técnicas (soft-delete sim, hard-delete não)

---

## 🎯 PERFIL DO ASSISTENTE (RESUMIDO)

### O que Assistente FAZ:
✅ Marca e gere **CONSULTAS**  
✅ Regista e edita **PACIENTES**  
✅ Gera **RECIBOS de pagamento**  
✅ Consulta **INVENTÁRIO** e faz **pedidos de compra**  
✅ Cria **FICHAS TÉCNICAS** (mas não altera preços de custo)  
✅ Vê **RELATÓRIOS** incluindo produtividade  
✅ Cria **FATURAS** próprias  

### O que Assistente NÃO FAZ:
❌ Gerir **UTILIZADORES** (criar, editar, roles)  
❌ Alterar **CONFIGURAÇÕES da clínica**  
❌ Ver **LOGS COMPLETOS** de outros  
❌ Alterar **PREÇOS de custo** (dados financeiros sensíveis)  
❌ **Desconectar** outros utilizadores

---

## 📋 IMPLEMENTAÇÃO BACKEND

Para implementar estas permissões, cada rota deve ter:

```javascript
// Exemplo: Rota de Consultas
router.delete('/api/consultas/:id', 
  authenticate,
  authorizeConsultaDelete,  // ← Valida permissões
  consultasController.deleteConsulta
);

// Middleware de Autorização
const authorizeConsultaDelete = (req, res, next) => {
  const { role, userId } = req.user;
  const { consultaId } = req.params;
  
  // ADMIN sempre pode
  if (role === 'ADMIN') return next();
  
  // ASSISTENTE só pode deletar suas próprias
  const consul = getConsulta(consultaId);
  if (role === 'ASSISTENTE' && consul.criadoPor === userId) {
    return next();
  }
  
  // Caso contrário: negado
  return res.status(403).json({ error: 'Sem permissão' });
};
```

---

## 📋 IMPLEMENTAÇÃO FRONTEND

```javascript
// Settings.js - Mostrar/Ocultar conforme role
const canDeleteConsulta = userRole === 'ASSISTENTE' || userRole === 'ADMIN';
const canAlterPreco = userRole === 'ADMIN'; // ← Always hide for ASSISTENTE
const canGerarRelatorio = userRole === 'ASSISTENTE' || userRole === 'ADMIN';

// Example:
{canDeleteConsulta && <button onClick={deleteConsulta}>Eliminar</button>}
{!canAlterPreco && <div className="disabled-badge">Admin Only</div>}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Backend: Criar middleware de autorização
- [ ] Backend: Adicionar checks em todas as rotas
- [ ] Backend: Implementar audit logs para ações críticas
- [ ] Frontend: Ocultar botões não-permitidos
- [ ] Frontend: Mostrar mensagens de permissão negada
- [ ] Database: Adicionar coluna `criado_por` em tabelas críticas
- [ ] Testes: Validar cada permissão (ASSISTENTE vs ADMIN)
- [ ] Documentação: Atualizar README.md com permissões

---

## 📞 STATUS: ✅ PRONTO PARA IMPLEMENTAÇÃO

**Próximos Passos:**
1. ✅ Documento aprovado
2. 🔄 Implementar backend (middleware de autorização)
3. 🔄 Implementar frontend (ocultar/desabilitar funcionalidades)
4. 🔄 Testar com ambos os roles
5. 🔄 Deploy em produção

---

**Decisões Finais Documentadas, Aprovadas e Prontas para Implementação** 🚀
