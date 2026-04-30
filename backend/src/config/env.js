require('dotenv').config();

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
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  clientOrigin: clientOrigins,
};
