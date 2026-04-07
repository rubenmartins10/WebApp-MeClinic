const express = require("express");
const https = require("https");
const fs = require("fs");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

// Importar rotas
const authRoutes = require("./routes/auth.routes");
const pacientesRoutes = require("./routes/pacientes.routes");
const consultasRoutes = require("./routes/consultas.routes");
const produtosRoutes = require("./routes/produtos.routes");
const faturaçãoRoutes = require("./routes/faturacao.routes");
const modelosRoutes = require("./routes/modelos.routes");
const utilizadoresRoutes = require("./routes/utilizadores.routes");
const statsRoutes = require("./routes/stats.routes");
const reportsRoutes = require('./routes/reports.routes');
const notificacoesRoutes = require('./routes/notificacoes.routes');

// Importar middleware de erro
const { errorHandler, notFoundHandler } = require("./errorHandler");

// Importar pool
const pool = require("./db");
const logger = require('./utils/logger');



const app = express();

// ==========================================
// --- SECURITY MIDDLEWARE ---
// ==========================================
// Helmet para proteção de headers HTTP
app.use(helmet());

// Compression para reduzir tamanho das respostas
app.use(compression({
  level: 6,
  threshold: 1024
}));

// CORS configurado com whitelist de origens seguras
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3050",
  "http://localhost:3051",
  "http://localhost:5000",
  process.env.FRONTEND_URL || "http://localhost:3050"
];

// Trust proxy em development (npm run dev pode adicionar X-Forwarded-For)
if (process.env.NODE_ENV !== 'production') {
  app.set('trust proxy', 'loopback');
}

// CORS configurado com whitelist de origens permitidas
app.use(cors({
  origin: (origin, callback) => {
    // Em produção bloquear pedidos sem Origin; em desenvolvimento permitir (ex: Postman)
    if (!origin) {
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      return callback(new Error('CORS: origem não permitida'));
    }
    // Normalizar origin removendo barra final antes de comparar
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
    callback(new Error(`CORS: origem não permitida: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==========================================
// --- RATE LIMITING ---
// ==========================================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Muitos requests. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')
});
app.use(generalLimiter);

// Rate limit reforçado para rotas de autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Demasiadas tentativas de login. Aguarde 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false
});

// ==========================================
// --- HTTPS REDIRECT (Production) ---
// ==========================================
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

app.use(express.json({ limit: '10mb' }));

// ==========================================
// --- INICIALIZAÇÃO DA BASE DE DADOS ---
// ==========================================
async function initDB() {
  logger.info('A preparar a base de dados e garantir tabelas...');
  
  try { await pool.query("ALTER TABLE produtos ALTER COLUMN stock_atual TYPE NUMERIC(10, 3)"); } catch(e){}
  try { await pool.query("ALTER TABLE produtos ALTER COLUMN stock_minimo TYPE NUMERIC(10, 3)"); } catch(e){}
  try { await pool.query("ALTER TABLE utilizadores ADD COLUMN reset_code VARCHAR(10)"); } catch(e){}
  try { await pool.query("ALTER TABLE utilizadores ADD COLUMN reset_expires TIMESTAMP"); } catch(e){}
  try { await pool.query("ALTER TABLE produtos ADD COLUMN categoria VARCHAR(100) DEFAULT 'Descartáveis'"); } catch(e){}
  try { await pool.query("ALTER TABLE produtos ADD COLUMN data_validade DATE"); } catch(e){}
  try { await pool.query("ALTER TABLE pacientes ADD COLUMN notas_clinicas TEXT DEFAULT ''"); } catch(e){}
  try { await pool.query("ALTER TABLE pacientes ADD COLUMN odontograma_dados TEXT DEFAULT '{}'"); } catch(e){}
  try { await pool.query("ALTER TABLE utilizadores ADD COLUMN assinatura_base64 TEXT"); } catch(e){}
  try { await pool.query("ALTER TABLE utilizadores ADD COLUMN telefone VARCHAR(20)"); } catch(e){}

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
        action_type VARCHAR(50) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        device_info VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        status VARCHAR(20) DEFAULT 'success',
        session_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log (created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_session_id ON activity_log (session_id)`);
  } catch(e) { logger.error('Erro ao criar tabela activity_log:', { message: e.message }); }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exames_paciente (
        id SERIAL PRIMARY KEY,
        paciente_id INT,
        nome_exame VARCHAR(255),
        data_exame DATE DEFAULT CURRENT_DATE,
        arquivo_base64 TEXT
      )
    `);
  } catch(e) { logger.error('Erro ao criar tabela exames_paciente:', { message: e.message }); }

  try {
    await pool.query(`UPDATE produtos SET categoria = 'Esterilizacao' WHERE nome ILIKE '%manga%' OR nome ILIKE '%desinfe%' OR nome ILIKE '%esteriliz%' OR nome ILIKE '%líquido%' OR nome ILIKE '%liquido%' OR nome ILIKE '%autoclave%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Anestesia' WHERE nome ILIKE '%anest%' OR nome ILIKE '%agulha%' OR nome ILIKE '%seringa%' OR nome ILIKE '%carpule%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Endo_Restauro' WHERE nome ILIKE '%resina%' OR nome ILIKE '%cimento%' OR nome ILIKE '%lima%' OR nome ILIKE '%broca%' OR nome ILIKE '%ácido%' OR nome ILIKE '%acido%' OR nome ILIKE '%adesivo%' OR nome ILIKE '%compósito%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Cirurgia' WHERE nome ILIKE '%implante%' OR nome ILIKE '%sutura%' OR nome ILIKE '%bisturi%' OR nome ILIKE '%enxerto%' OR nome ILIKE '%membrana%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Ortodontia' WHERE nome ILIKE '%bracket%' OR nome ILIKE '%arame%' OR nome ILIKE '%elástico%' OR nome ILIKE '%elastico%' OR nome ILIKE '%arco%' OR nome ILIKE '%braquete%' OR nome ILIKE '%tubo%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Equipamento' WHERE nome ILIKE '%espelho%' OR nome ILIKE '%pinça%' OR nome ILIKE '%pinca%' OR nome ILIKE '%sonda%' OR nome ILIKE '%explorador%' OR nome ILIKE '%motor%' OR nome ILIKE '%turbina%'`);
    await pool.query(`UPDATE produtos SET categoria = 'Descartáveis' WHERE nome ILIKE '%luva%' OR nome ILIKE '%aspirador%' OR nome ILIKE '%babete%' OR nome ILIKE '%copo%' OR nome ILIKE '%algodão%' OR nome ILIKE '%algodao%' OR nome ILIKE '%compressa%' OR nome ILIKE '%rolo%' OR nome ILIKE '%máscara%' OR nome ILIKE '%mascara%' OR nome ILIKE '%toca%' OR nome ILIKE '%touca%' OR nome ILIKE '%protetor%'`);
  } catch (e) {}
}
initDB();

// ==========================================
// --- CONFIGURAÇÃO DE E-MAIL - Mailtrap ---
// ==========================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

// ==========================================
// --- ROTAS ---
// ==========================================

// Rotas de Autenticação (com rate limit reforçado)
app.use('/api/auth', authLimiter, authRoutes);

// Rotas de Pacientes (refatorizadas)
app.use('/api/pacientes', pacientesRoutes);

// Rotas de Consultas (refatorizadas)
app.use('/api/consultas', consultasRoutes);

// Rotas de Produtos (refatorizadas)
app.use('/api/produtos', produtosRoutes);

// Rotas de Modelos de Procedimento (refatorizadas)
app.use('/api/modelos-procedimento', modelosRoutes);

// Rotas de Faturação (refatorizadas)
app.use('/api/faturacao', faturaçãoRoutes);

// Rotas de Utilizadores (refatorizadas)
app.use('/api/utilizadores', utilizadoresRoutes);

// Rotas de Estatísticas (refatorizadas)
app.use('/api/stats', statsRoutes);

// Rotas de Relatórios (refatorizadas)
app.use('/api/reports', reportsRoutes);

// Rotas de Notificações (email + WhatsApp)
app.use('/api/notificacoes', notificacoesRoutes);

// ==========================================
// --- HEALTH CHECK ---
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// --- ERROR HANDLING MIDDLEWARE ---
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================================
// --- START SERVER ---
// ==========================================
const PORT = process.env.PORT || 5000;
const serverDir = __dirname;

// Carregar certificados SSL - com fallback para HTTP
let httpsOptions = null;
const certPath = require('path').join(serverDir, 'cert.pem');
const keyPath = require('path').join(serverDir, 'key.pem');

// Tentar carregar certificados
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  try {
    const certContent = fs.readFileSync(certPath, 'utf-8').trim();
    const keyContent = fs.readFileSync(keyPath, 'utf-8').trim();
    
    // Verificar se certificados são válidos
    if (certContent.includes('BEGIN CERTIFICATE') && keyContent.includes('BEGIN')) {
      httpsOptions = {
        key: keyContent,
        cert: certContent
      };
      logger.info('Certificados SSL carregados com sucesso');
    }
  } catch (err) {
    logger.warn('Erro ao carregar certificados:', { message: err.message });
  }
}

// Iniciar servidor
if (httpsOptions && process.env.NODE_ENV !== 'development') {
  // HTTPS em produção
  https.createServer(httpsOptions, app).listen(443, () => {
    logger.info(`HTTPS Servidor ativo na porta 443 | TLS/SSL: Ativo | CORS: [${allowedOrigins.join(', ')}] | NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  });
} else if (httpsOptions) {
  // HTTPS em desenvolvimento
  https.createServer(httpsOptions, app).listen(PORT, () => {
    logger.info(`HTTPS Servidor ativo em https://localhost:${PORT} | TLS/SSL: Ativo (auto-assinado) | CORS: [${allowedOrigins.join(', ')}] | NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  });
} else {
  // HTTP (dev sem certificados)
  app.listen(PORT, () => {
    logger.info(`HTTP Servidor ativo em http://localhost:${PORT} | CORS: [${allowedOrigins.join(', ')}] | NODE_ENV: ${process.env.NODE_ENV || 'development'} | AVISO: HTTPS não ativo`);
  });
}

// ==========================================
// --- AGENDAMENTO DE RELATÓRIOS SEMANAIS ---
// ==========================================
// Importar controller de relatórios
const { sendWeeklyReportEmail } = require('./controllers/reportsController');
const { sendConsultaReminderEmail, sendStockAlertEmail } = require('./services/notificationService');
const Produto = require('./models/Produto');

logger.info('Configurando agendamento automático de relatórios...');

// Agendar envio de relatório toda sexta-feira às 16:00 (4:00 PM)
// Padrão cron: min hora dia_mês mês dia_semana
// (0 16 * * 5) = 16:00, qualquer dia do mês, qualquer mês, sexta-feira (5)
const reportSchedule = cron.schedule('0 16 * * 5', async () => {
  logger.info('[SCHEDULED] Iniciando envio automático de relatório semanal...');
  const result = await sendWeeklyReportEmail();
  if (result.success) {
    logger.info(`[SCHEDULED] ${result.message}`);
  } else {
    logger.error(`[SCHEDULED] Erro: ${result.message || result.error}`);
  }
}, {
  scheduled: false // Vamos iniciar manualmente após logs
});

// Iniciar o agendamento
reportSchedule.start();
logger.info('Agendamento ativo: Relatórios enviados toda sexta-feira às 16:00 (hora do servidor)');

// ==========================================
// --- LEMBRETES DE CONSULTAS (a cada minuto) ---
// ==========================================
// Guarda IDs de consultas já notificadas (reset ao reiniciar o servidor)
const consultasJaNotificadas = new Set();

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const target = new Date(now.getTime() + 15 * 60 * 1000); // daqui a 15 minutos

    const dataPT = target.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaH = String(target.getHours()).padStart(2, '0');
    const horaM = String(target.getMinutes()).padStart(2, '0');
    const horaTarget = `${horaH}:${horaM}`;

    const result = await pool.query(
      `SELECT c.id, p.nome as paciente_nome, p.email, p.telefone,
              c.data_consulta, c.hora_consulta, m.nome as procedimento_nome
       FROM consultas c
       JOIN pacientes p ON c.paciente_id = p.id
       LEFT JOIN modelos_procedimento m ON c.procedimento_id = m.id
       WHERE c.data_consulta = $1
         AND LEFT(c.hora_consulta::text, 5) = $2
         AND c.status NOT IN ('cancelada', 'concluida')`,
      [dataPT, horaTarget]
    );

    for (const consulta of result.rows) {
      if (consultasJaNotificadas.has(consulta.id)) continue;
      consultasJaNotificadas.add(consulta.id);
      await sendConsultaReminderEmail(consulta);
    }
  } catch (err) {
    logger.error('[CRON][CONSULTAS] Erro no cron de lembretes:', { message: err.message });
  }
});
logger.info('Agendamento ativo: Lembretes de consultas verificados a cada minuto');

// ==========================================
// --- SCAN DIÁRIO DE STOCK BAIXO (08:00) ---
// ==========================================
cron.schedule('0 8 * * *', async () => {
  try {
    const produtosBaixos = await Produto.getLowStockAlerts();
    if (produtosBaixos.length === 0) return;
    logger.info(`[CRON][STOCK] ${produtosBaixos.length} produto(s) com stock baixo — enviando alertas...`);
    for (const produto of produtosBaixos) {
      await sendStockAlertEmail(produto);
    }
  } catch (err) {
    logger.error('[CRON][STOCK] Erro no scan diário de stock:', { message: err.message });
  }
});
logger.info('Agendamento ativo: Scan de stock baixo todos os dias às 08:00');
// setTimeout(() => {
//   console.log('\n🧪 [DEV] Enviando relatório de teste...');
//   sendWeeklyReportEmail();
// }, 5000); // 5 segundos após startup

module.exports = app;
