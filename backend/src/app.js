const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());

// Accept a single origin, an allowlist array, or "*". Vercel preview deploys
// (e.g. https://dev-match-git-feature-xyz.vercel.app) are matched by suffix
// against any allowed origin that itself ends in ".vercel.app".
const corsOriginCheck = (origin, callback) => {
  if (!origin) return callback(null, true); // curl, server-to-server, same-origin
  if (env.clientOrigin === '*') return callback(null, true);

  const allowed = env.clientOrigin;
  const isExact = allowed.includes(origin);
  const isVercelPreview =
    origin.endsWith('.vercel.app') &&
    allowed.some((o) => o.endsWith('.vercel.app'));

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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'devmatch-backend', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/developers', require('./routes/developer.routes'));
app.use('/api/swipes', require('./routes/swipe.routes'));
app.use('/api/matches', require('./routes/match.routes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
