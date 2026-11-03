const path = require('path');
const fs = require('fs');

// Try backend/.env first, then root .env, then default
const backendEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(backendEnvPath)) {
  require('dotenv').config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  require('dotenv').config();
}

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    // Fail fast: missing critical config should never reach runtime.
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// CLIENT_ORIGIN may be:
//   - "*"                                    → allow any origin (dev / quick prod)
//   - "https://foo.com"                      → single origin
//   - "https://foo.com,http://localhost:5173" → comma-separated allowlist
const rawOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const clientOrigins =
  rawOrigin.trim() === '*'
    ? '*'
    : rawOrigin
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  clientOrigin: clientOrigins,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'DevMatch <noreply@devmatch.io>',
  },
};
