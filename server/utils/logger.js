/**
 * Logger estruturado — MeClinic
 * Sem dependências externas. Emite JSON em produção, texto legível em dev.
 */

const isProd = process.env.NODE_ENV === 'production';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const activeLevel = LEVELS[process.env.LOG_LEVEL] ?? (isProd ? LEVELS.info : LEVELS.debug);

function write(level, message, meta = {}) {
  if (LEVELS[level] > activeLevel) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta
  };

  const out = isProd ? JSON.stringify(entry) : `[${entry.ts}] ${level.toUpperCase().padEnd(5)} ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`;

  if (level === 'error') {
    console.error(out);
  } else {
    console.log(out);
  }
}

const logger = {
  error: (message, meta) => write('error', message, meta),
  warn:  (message, meta) => write('warn',  message, meta),
  info:  (message, meta) => write('info',  message, meta),
  debug: (message, meta) => write('debug', message, meta),
};

module.exports = logger;
