# Testes de Recuperação de Palavra-passe

## Status Atual

✅ **Sistema de recuperação funcionando**
✅ **Código gerado corretamente**
❌ **Email SMTP aguárdando configuração**

---

## Como Testar Agora (Modo Testes)

### Passo 1: Solicitar Código
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@meclinic.pt"}'
```

**Resposta:**
```json
{
  "message": "Código gerado (email indisponível - use para testes)",
  "testCode": "945813",
  "validFor": "15 minutos"
}
```

### Passo 2: Verificar Código no Servidor
Veja o terminal do servidor - aparece assim:
```
╔════════════════════════════════════════════════════╗
║         CÓDIGO DE RECUPERAÇÃO DE PASSWORD          ║
╠════════════════════════════════════════════════════╣
║ Email: teste@meclinic.pt                       ║
║ Código: 945813                                  ║
║ Válido por: 15 minutos                            ║
╚════════════════════════════════════════════════════╝
```

### Passo 3: Testar Reset com Código
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@meclinic.pt",
    "code": "945813",
    "newPassword": "NovaPassword123!",
    "confirmPassword": "NovaPassword123!"
  }'
```

### Passo 4: Fazer Login com Nova Palavra-passe
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@meclinic.pt",
    "password": "NovaPassword123!"
  }'
```

---

## Fluxo Frontend

1. Clique em "Esqueci a Palavra-passe"
2. Insira `teste@meclinic.pt`
3. **Para testes:** Veja o código no servidor ou na resposta JSON
4. Insira o código na tela
5. Insira nova palavra-passe (2x)
6. Clique "Confirmar"
7. Faça login com a nova palavra-passe

---

## Problemas Conhecidos

### Gmail SMTP Falhando
**Erro:** `Missing credentials for "PLAIN"`

**Causa:** Gmail está a bloquear por motivos de segurança ou credenciais incorretas

**Soluções:**
1. Usar um serviço alternativo (SendGrid, Mailgun, etc.)
2. Usar "App Password" correta do Gmail
3. Usar Mailtrap (serviço de teste)
4. Implementar Console-only mode (apenas log, sem envio real)

---

## Próximos Passos

1. ✅ Sistema funcionando em modo de testes
2. ⏳ Correção do Gmail SMTP (próxima)
3. ⏳ Implementação de Encryption at Rest
4. ⏳ GDPR compliance endpoints
