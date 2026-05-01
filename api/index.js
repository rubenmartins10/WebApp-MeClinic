'use strict';
/**
 * Vercel Serverless Entry Point
 * Importa o Express app e exporta-o como handler serverless.
 * Todas as rotas /api/* são tratadas aqui.
 */
const app = require('../server/app');

module.exports = app;
