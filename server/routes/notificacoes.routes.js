const express = require('express');
const router = express.Router();
const { enviarReceita, enviarWhatsapp } = require('../controllers/notificacoesController');
const { authMiddleware } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// POST /api/notificacoes/enviar-receita  — envia receita por email + WhatsApp
router.post('/enviar-receita', enviarReceita);

// POST /api/notificacoes/enviar-whatsapp — envia mensagem WhatsApp
router.post('/enviar-whatsapp', enviarWhatsapp);

module.exports = router;
