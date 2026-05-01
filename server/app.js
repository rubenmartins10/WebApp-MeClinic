'use strict';
// Carregar variáveis de ambiente (em desenvolvimento local; no Vercel são injectadas automaticamente)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const compression = require('compression');
const rateLimit  = require('express-rate-limit');

const pool   = require('./db');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./errorHandler');

// Rotas
const authRoutes         = require('./routes/auth.routes');
const pacientesRoutes    = require('./routes/pacientes.routes');
const consultasRoutes    = require('./routes/consultas.routes');
const produtosRoutes     = require('./routes/produtos.routes');
const faturaçãoRoutes    = require('./routes/faturacao.routes');
const modelosRoutes      = require('./routes/modelos.routes');
const utilizadoresRoutes = require('./routes/utilizadores.routes');
const statsRoutes        = require('./routes/stats.routes');
const reportsRoutes      = require('./routes/reports.routes');
const notificacoesRoutes = require('./routes/notificacoes.routes');

// ==========================================
// --- APP ---
// ==========================================
const app = express();

// Trust proxy (Vercel / nginx / Cloudflare)
app.set('trust proxy', 1);

// CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL,
      'https://web-app-me-clinic.vercel.app'
    ].filter(Boolean)
  : [
      'http://localhost:3000',
      'http://localhost:3050',
      'http://localhost:3051',
      'http://localhost:5000',
      process.env.FRONTEND_URL || 'http://localhost:3050'
    ].filter(Boolean);

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  logger.warn('AVISO: FRONTEND_URL não definido. A usar domínio Vercel por defeito.');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
    callback(new Error(`CORS: origem não permitida: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Muitos requests. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' &&
    (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')
});
app.use(generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas tentativas de login. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// HTTPS redirect em produção (Vercel já força HTTPS nativamente, mas mantemos para outros ambientes)
if (process.env.NODE_ENV === 'production' && process.env.VERCEL !== '1') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// ==========================================
// --- INICIALIZAÇÃO DA BASE DE DADOS ---
// ==========================================
let dbInitialised = false;

async function initDB() {
  if (dbInitialised) return;
  dbInitialised = true;
  logger.info('A garantir schema da base de dados...');

  // Colunas adicionadas ao longo do tempo (idempotente)
  const alterations = [
    "ALTER TABLE produtos      ALTER COLUMN stock_atual  TYPE NUMERIC(10, 3)",
    "ALTER TABLE produtos      ALTER COLUMN stock_minimo TYPE NUMERIC(10, 3)",
    "ALTER TABLE utilizadores  ADD COLUMN reset_code      VARCHAR(10)",
    "ALTER TABLE utilizadores  ADD COLUMN reset_expires   TIMESTAMP",
    "ALTER TABLE produtos      ADD COLUMN categoria        VARCHAR(100) DEFAULT 'Descartáveis'",
    "ALTER TABLE produtos      ADD COLUMN data_validade    DATE",
    "ALTER TABLE pacientes     ADD COLUMN notas_clinicas   TEXT DEFAULT ''",
    "ALTER TABLE pacientes     ADD COLUMN odontograma_dados TEXT DEFAULT '{}'",
    "ALTER TABLE utilizadores  ADD COLUMN assinatura_base64 TEXT",
    "ALTER TABLE utilizadores  ADD COLUMN telefone          VARCHAR(20)",
    "ALTER TABLE activity_log  ADD COLUMN is_active         BOOLEAN DEFAULT FALSE",
    "ALTER TABLE activity_log  ADD COLUMN last_seen         TIMESTAMP",
  ];
  for (const sql of alterations) {
    try { await pool.query(sql); } catch (_) { /* coluna já existe — ignorar */ }
  }

  // Tabelas criadas se não existirem
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
        action_type VARCHAR(50)  NOT NULL,
        description TEXT,
        location    VARCHAR(255),
        device_info VARCHAR(255),
        ip_address  VARCHAR(45),
        user_agent  VARCHAR(500),
        status      VARCHAR(20)  DEFAULT 'success',
        session_id  VARCHAR(100),
        is_active   BOOLEAN      DEFAULT FALSE,
        last_seen   TIMESTAMP,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_user_id    ON activity_log (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log (created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_session_id ON activity_log (session_id)`);
  } catch (e) { logger.error('Erro ao criar tabela activity_log:', { message: e.message }); }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exames_paciente (
        id          SERIAL PRIMARY KEY,
        paciente_id INT,
        nome_exame  VARCHAR(255),
        data_exame  DATE DEFAULT CURRENT_DATE,
        arquivo_base64 TEXT
      )
    `);
  } catch (e) { logger.error('Erro ao criar tabela exames_paciente:', { message: e.message }); }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        token      TEXT PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id    ON refresh_tokens (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at)`);
  } catch (e) { logger.error('Erro ao criar tabela refresh_tokens:', { message: e.message }); }
}

// Chamar initDB assincronamente (não bloqueia o arranque)
initDB().catch(err => logger.error('initDB falhou:', { message: err.message }));

// ==========================================
// --- ROTAS ---
// ==========================================
app.use('/api/auth',                authLimiter, authRoutes);
app.use('/api/pacientes',           pacientesRoutes);
app.use('/api/consultas',           consultasRoutes);
app.use('/api/produtos',            produtosRoutes);
app.use('/api/modelos-procedimento', modelosRoutes);
app.use('/api/faturacao',           faturaçãoRoutes);
app.use('/api/utilizadores',        utilizadoresRoutes);
app.use('/api/stats',               statsRoutes);
app.use('/api/reports',             reportsRoutes);
app.use('/api/notificacoes',        notificacoesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handlers (devem ser os últimos)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
