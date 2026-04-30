const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
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
