require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Auto-sanitize connection string:
// If connecting to Neon with -pooler, switch to direct host to avoid PgBouncer idle socket terminations
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes('-pooler.')) {
  dbUrl = dbUrl.replace('-pooler.', '.');
}

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
