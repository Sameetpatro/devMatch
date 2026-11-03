const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const { generalLimiter, authLimiter } = require('./middlewares/rateLimiter');

const app = express();

app.use(helmet());

// Accept a single origin, an allowlist array, or "*".
const corsOriginCheck = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (env.clientOrigin === '*') return callback(null, true);

  if (env.nodeEnv === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }

  const allowed = Array.isArray(env.clientOrigin) ? env.clientOrigin : [env.clientOrigin];
  const isExact = allowed.includes(origin);
  const isVercelPreview =
    origin.endsWith('.vercel.app') &&
    allowed.some((o) => typeof o === 'string' && o.endsWith('.vercel.app'));

  if (isExact || isVercelPreview) return callback(null, true);
  return callback(new Error(`CORS blocked: ${origin}`));
};

app.use(
  cors({
    origin: corsOriginCheck,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// General API Rate Limiting
if (env.nodeEnv !== 'test') {
  app.use('/api', generalLimiter);
}

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'devmatch-backend',
    message: 'DevMatch API is running! Access the web app at http://localhost:5173.',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      developers: '/api/developers',
      roles: '/api/roles',
      swipes: '/api/swipes',
      matches: '/api/matches',
      presence: '/api/presence',
    },
  });
});

app.get('/api', (_req, res) => {
  res.json({ status: 'ok', service: 'devmatch-api', message: 'API root' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'devmatch-backend', timestamp: new Date().toISOString() });
});

// Auth Routes (with strict brute-force protection)
app.use(['/api/auth', '/auth', '/api/api/auth'], authLimiter, require('./routes/auth.routes'));

// Resource Routes
app.use(['/api/developers', '/developers', '/api/api/developers'], require('./routes/developer.routes'));
app.use(['/api/roles', '/roles', '/api/api/roles'], require('./routes/role.routes'));
app.use(['/api/swipes', '/swipes', '/api/api/swipes'], require('./routes/swipe.routes'));
app.use(['/api/matches', '/matches', '/api/api/matches'], require('./routes/match.routes'));
app.use(['/api/presence', '/presence', '/api/api/presence'], require('./routes/presence.routes'));
app.use(['/api/notifications', '/notifications', '/api/api/notifications'], require('./routes/notification.routes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
