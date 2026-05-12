'use strict';
/**
 * Vercel Serverless Entry Point
 * Importa o Express app e exporta-o como handler serverless.
 * Todas as rotas /api/* são tratadas aqui.
 */
let app;
try {
  app = require('../server/app');
} catch (err) {
  app = (req, res) => {
    res.status(500).json({ error: 'Failed to load app', message: err.message, stack: err.stack });
  };
}

module.exports = app;
