# TODO - UI + Segurança (Inventory / Settings / Scanner / Auth / Users)

- [x] Remover "link da net" no modal de produto e manter campo simples "Link URL" em Inventory (sem preview)
- [x] Tornar modal de eliminação de conta mais profissional (sem emojis)
- [x] Refatorar BarcodeScanner para UI própria profissional e scanner por câmara mais estável
- [x] Melhorar fundo Auth no light mode (login/register)
- [x] Validar build frontend (com warnings já existentes)

## Novo bloco: Segurança e Atividade
- [ ] Corrigir deduplicação de sessões em `/api/auth/activity`
- [ ] Exigir MFA no backend para ações críticas de utilizadores (PUT/DELETE `/api/utilizadores/:id`)
- [ ] Exigir MFA no frontend Users (remover user + trocar role)
- [ ] Exigir MFA no fluxo de eliminação permanente da conta (Settings)
- [ ] Validar build frontend após alterações
