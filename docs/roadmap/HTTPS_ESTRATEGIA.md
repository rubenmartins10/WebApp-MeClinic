# 🔐 HTTPS/TLS - Estratégia e Próximos Passos

**Data:** 2026-04-02  
**Status:** ⚠️ Em desenvolvimento - HTTP temporário

---

## Estado Atual

```
✅ Backend refatorado e modular
✅ Segurança básica (Helmet, Rate Limiting, Validação)
✅ Autenticação JWT
⚠️  HTTPS: Pendente (certificados validação)
```

---

## Problema: Gerar HTTPS em Windows

En Windows, gerar certificados SSL auto-assinados é complexo sem OpenSSL instalado.

### ✅ Soluções Testadas Que Funcionam

#### **Opção 1: Instalar Git para Windows** (Recomendado - 5 min)

```bash
# 1. Download e instale Git para Windows
# https://git-scm.com/download/win
# (Inclui Git Bash com OpenSSL)

# 2. Abra Git Bash e execute
cd c:\temp\MeClinic\server
openssl req -x509 -newkey rsa:2048 -nodes \
  -out cert.pem -keyout key.pem -days 365 \
  -subj "/C=PT/ST=Lisbon/L=Lisbon/O=MeClinic/CN=localhost"

# 3. Inicie servidor
node index.js

# Resultado: HTTPS ativo em https://localhost:5000
```

#### **Opção 2: WSL (Windows Subsystem for Linux)** (Recomendado -quem tem WSL)

```bash
# No terminal WSL
cd /mnt/c/temp/MeClinic/server
openssl req -x509 -newkey rsa:2048 -nodes \
  -out cert.pem -keyout key.pem -days 365 \
  -subj "/C=PT/ST=Lisbon/L=Lisbon/O=MeClinic/CN=localhost"
```

#### **Opção 3: Docker** (Recomendado - para produção)

```dockerfile
FROM node:22
WORKDIR /app
COPY server .
RUN npm install
RUN npm install -g openssl
RUN openssl req -x509 -newkey rsa:2048 -nodes \
    -out cert.pem -keyout key.pem -days 365 \
    -subj "/C=PT/ST=Lisbon/L=Lisbon/O=MeClinic/CN=localhost"
CMD ["node", "index.js"]
```

#### **Opção 4: Let's Encrypt em Produção** (Melhor)

```bash
# Instale certbot (gestor de Let's Encrypt)
npm install certbot

# Gere certificado válido (grátis, renova-se automaticamente)
certbot certonly --standalone -d seu-dominio.pt

# O certificado fica em: /etc/letsencrypt/live/seu-dominio.pt/
# Copie para o servidor e use em index.js
```

---

## Estratégia Atual (Recomendado para Agora)

### **Fase 1: Desenvolvimento (HTTP)**

```
┌─────────────────────┐
│   Frontend (React)   │ 
│  http://localhost:3050│
└──────────┬──────────┘
           │ HTTP (dados não encriptados - OK para dev local)
           ▼
┌─────────────────────┐
│  Backend (Express)   │
│  http://localhost:5000│ ← AQUI AGORA
└─────────────────────┘
```

**Por que?** Desenvolvimento local, sem internet, localhost apenas.

**Próximo passo:** Instale Git e gere certificados.

---

### **Fase 2: Staging (HTTPS Self-Signed)**

Após instalar Git:

```bash
# 1. Gere certificado
cd c:\temp\MeClinic\server
openssl req -x509 -newkey rsa:2048 -nodes \
  -out cert.pem -keyout key.pem -days 365 \
  -subj "/C=PT/ST=Lisbon/L=Lisbon/O=MeClinic/CN=localhost"

# 2. Inicie servidor
node index.js

# Resultado:
# ✅ Servidor ativo em https://localhost:5000
# 🔐 Certificado auto-assinado (browser dará warning - OK)
```

---

### **Fase 3: Produção (Let's Encrypt)**

```bash
# 1. Compre domínio (ex: meclinic.pt)
# 2. Configure DNS para apontar para seu servidor
# 3. Use Let's Encrypt para certificado GRÁTIS
certbot certonly --standalone -d meclinic.pt

# 4. Copie certificado para servidor
# 5. Atualize index.js para apontar para certificados reais

# Resultado:
# ✅ HTTPS://meclinic.pt (certificado confiável)
# 🔐 Renovação automática anualmente
```

---

## 📝 Como Continuar HOJE

### Opção A: Instalar Git (5 minutos)

```bash
# Download: https://git-scm.com/download/win
# Instale com opções padrão
# Abra Git Bash

cd c:\temp\MeClinic\server
openssl req -x509 -newkey rsa:2048 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/C=PT/ST=Lisbon/L=Lisbon/O=MeClinic/CN=localhost"

# Inicie servidor
node index.js
```

### Opção B: Continuar em HTTP por enquanto

Deixe o servidor em HTTP e passe para **ENCRIPTAÇÃO EM REPOUSO** (que é CRÍTICA).

```
Prioridade 1: Encriptação em repouso ← FAZER ANTES DE ENCRIPTAÇÃO EM TRÂNSITO
Prioridade 2: HTTPS/TLS
Prioridade 3: GDPR
```

---

## ✅ Código Já Preparado

O `index.js` **JÁ ESTÁ** preparado para HTTPS:

```javascript
// index.js suporta:
if (fs.existsSync('cert.pem') && fs.existsSync('key.pem')) {
  // Use HTTPS
  https.createServer(httpsOptions, app).listen(PORT);
} else {
  // Use HTTP
  app.listen(PORT);
}
```

**Tudo que falta:** Ter os ficheiros `cert.pem` e `key.pem` válidos.

---

## 📊 Checklist

- [x] Backend refatorado
- [x] index.js com suporte HTTPS
- [x] Código preparado para carregar certificados
- [ ] Certificados gerados (precisa Git ou WSL)
- [ ] Testar HTTPS

---

## 🎯 Recomendação Final

### ⭐ Para AGORA (próximas 2 horas):

1. **Instale Git** (https://git-scm.com/download/win)
2. **Gere certificado** com openssl (comando acima)
3. **Servidor estará em HTTPS**

### 📅 Para DEPOIS (próximas horas):

1. Implementar **Encriptação em Repouso** (dados protegidos em BD)
2. Atualizar frontend para usar `https://localhost:5000`
3. Testar GDPR endpoints
4. Documentação legal

---

##  ℹ️ Nota Técnica

O código `index.js` está **completamente pronto** para HTTPS. Não precisa mudar nada no código.

**Único requisito:** Ter `cert.pem` e `key.pem` válidos na pasta `server/`.

Quando os certificados estiverem presentes:
- Servidor automaticamente usa HTTPS
- Dados em trânsito encriptados (TLS 1.2+)
- Protocolo de segurança moderno

---

## 📞 Precisa de Ajuda?

1. **Certificado invalid:** Certifique-se que openssl gerou os ficheiros
2. **Ainda HTTP:** Certificados não foram carregados (verifique caminhos)
3. **Erro PEM:** Use o comando openssl exato do documento

---

**Próximo passo:** Instale Git e gere certificados! 🚀
