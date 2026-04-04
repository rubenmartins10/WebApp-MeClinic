console.log("=".repeat(70));
console.log("UNIQUE_MARKER_12345: Server starting up - checking if this version runs");
console.log("=".repeat(70));
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
const reportsRoutes = require("./routes/reports.routes");

// Importar middleware de erro
const { errorHandler, notFoundHandler } = require("./errorHandler");

// Importar pool
const pool = require("./db");



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
  "http://localhost:3050",
  "http://localhost:3051",
  "http://localhost:3000",
  process.env.FRONTEND_URL || "http://localhost:3050"
];

// CORS configurado - mais permissivo em desenvolvimento
app.use(cors({
  origin: true, // Aceita qualquer origin
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==========================================
// --- RATE LIMITING ---
// ==========================================
// Desabilitado em desenvolvimento para evitar problemas com X-Forwarded-For
// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: { error: "Muitos requests. Tente novamente em 15 minutos." },
//   standardHeaders: true,
//   legacyHeaders: false
// });
// app.use(generalLimiter);

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

app.use(express.json({ limit: '50mb' }));

// ==========================================
// --- INICIALIZAÇÃO DA BASE DE DADOS ---
// ==========================================
async function initDB() {
  console.log("A preparar a base de dados e garantir tabelas...");
  
  try { await pool.query("ALTER TABLE produtos ALTER COLUMN stock_atual TYPE NUMERIC(10, 3)"); } catch(e){}
  try { await pool.query("ALTER TABLE produtos ALTER COLUMN stock_minimo TYPE NUMERIC(10, 3)"); } catch(e){}
  try { await pool.query("ALTER TABLE utilizadores ADD COLUMN reset_code VARCHAR(10)"); } catch(e){}
  try { await pool.query("ALTER TABLE utilizadores ADD COLUMN reset_expires TIMESTAMP"); } catch(e){}
  try { await pool.query("ALTER TABLE produtos ADD COLUMN categoria VARCHAR(100) DEFAULT 'Descartáveis'"); } catch(e){}
  try { await pool.query("ALTER TABLE produtos ADD COLUMN data_validade DATE"); } catch(e){}
  try { await pool.query("ALTER TABLE pacientes ADD COLUMN notas_clinicas TEXT DEFAULT ''"); } catch(e){}
  try { await pool.query("ALTER TABLE pacientes ADD COLUMN odontograma_dados TEXT DEFAULT '{}'"); } catch(e){}
  try { await pool.query("ALTER TABLE utilizadores ADD COLUMN assinatura_base64 TEXT"); } catch(e){}

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exames_paciente (
        id SERIAL PRIMARY KEY,
        paciente_id INT,
        nome_exame VARCHAR(255),
        data_exame DATE DEFAULT CURRENT_DATE,
        ficheiro_base64 TEXT
      )
    `);
  } catch(e) { console.error("Erro ao criar tabela exames_paciente:", e); }

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
// --- CONFIGURAÇÃO DE E-MAIL ---
// ==========================================
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ==========================================
// --- ROTAS ---
// ==========================================

// Rotas de Autenticação (refatorizadas)
app.use('/api/auth', authRoutes);

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
      console.log('✅ Certificados SSL carregados com sucesso');
    }
  } catch (err) {
    console.warn('⚠️  Erro ao carregar certificados:', err.message);
  }
}

// Iniciar servidor
if (httpsOptions && process.env.NODE_ENV !== 'development') {
  // HTTPS em produção
  https.createServer(httpsOptions, app).listen(443, () => {
    console.log(`\n🔒 HTTPS Servidor ativo na porta 443 (HTTPS)`);
    console.log(`🔐 TLS/SSL: Ativo`);
    console.log(`🔒 CORS: Origens permitidas [${allowedOrigins.join(', ')}]`);
    console.log(`📦 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n📚 Documentação:`);
    console.log(`   POST   /api/auth/register  - Registar`);
    console.log(`   POST   /api/auth/login     - Login`);
    console.log(`   GET    /api/auth/profile   - Profile (requer token)`);
    console.log(`   POST   /api/auth/logout    - Logout\n`);
  });
} else if (httpsOptions) {
  // HTTPS em desenvolvimento
  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`\n🔒 HTTPS Servidor ativo em https://localhost:${PORT}`);
    console.log(`🔐 TLS/SSL: Ativo (Certificado auto-assinado)`);
    console.log(`⚠️  Nota: Navegadores vão dar warning (esperado)`);
    console.log(`🔒 CORS: Origens permitidas [${allowedOrigins.join(', ')}]`);
    console.log(`📦 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n📚 Documentação:`);
    console.log(`   POST   /api/auth/register  - Registar`);
    console.log(`   POST   /api/auth/login     - Login`);
    console.log(`   GET    /api/auth/profile   - Profile (requer token)`);
    console.log(`   POST   /api/auth/logout    - Logout`);
    console.log(`   GET    /api/health        - Health check\n`);
  });
} else {
  // HTTP (dev sem certificados)
  app.listen(PORT, () => {
    console.log(`\n✅ HTTP Servidor ativo em http://localhost:${PORT}`);
    console.log(`⚠️  Aviso: HTTPS não ativo. Para desenvolvimento seguro:`);
    console.log(`   Execute: node scripts/generate-cert-simple.js`);
    console.log(`🔒 CORS: Origens permitidas [${allowedOrigins.join(', ')}]`);
    console.log(`📦 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n📚 Documentação:`);
    console.log(`   POST   /api/auth/register  - Registar`);
    console.log(`   POST   /api/auth/login     - Login`);
    console.log(`   GET    /api/auth/profile   - Profile (requer token)`);
    console.log(`   POST   /api/auth/logout    - Logout`);
    console.log(`   GET    /api/health        - Health check\n`);
  });
}

// ==========================================
// --- AGENDAMENTO DE RELATÓRIOS SEMANAIS ---
// ==========================================
// Importar controller de relatórios
const { sendWeeklyReportEmail } = require('./controllers/reportsController');

console.log('\n📅 Configurando agendamento automático de relatórios...');

// Agendar envio de relatório toda sexta-feira às 16:00 (4:00 PM)
// Padrão cron: min hora dia_mês mês dia_semana
// (0 16 * * 5) = 16:00, qualquer dia do mês, qualquer mês, sexta-feira (5)
const reportSchedule = cron.schedule('0 16 * * 5', async () => {
  console.log('\n📊 [SCHEDULED] Iniciando envio automático de relatório semanal...');
  const result = await sendWeeklyReportEmail();
  if (result.success) {
    console.log(`✅ [SCHEDULED] ${result.message}`);
  } else {
    console.error(`❌ [SCHEDULED] Erro: ${result.message || result.error}`);
  }
}, {
  scheduled: false // Vamos iniciar manualmente após logs
});

// Iniciar o agendamento
reportSchedule.start();
console.log('✅ Agendamento ativo: Relatórios enviados toda sexta-feira às 16:00 (hora do servidor)');

// Opcional: Enviar teste na primeira hora após startup (para desenvolvimento)
// Descomente para fazer testes em desenvolvimento
// setTimeout(() => {
//   console.log('\n🧪 [DEV] Enviando relatório de teste...');
//   sendWeeklyReportEmail();
// }, 5000); // 5 segundos após startup

module.exports = app;
