const http = require('http');
const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');
const { startWorkers } = require('./workers');
const { initSocketServer } = require('./sockets/chat.socket');

const server = http.createServer(app);

// Mount Socket.io real-time chat & presence engine
const io = initSocketServer(server);

server.listen(env.port, () => {
  console.log(`[devmatch] API & WebSockets running on http://localhost:${env.port} (${env.nodeEnv})`);

  // Start RabbitMQ background workers
  startWorkers().catch((err) => {
    console.warn(`[devmatch] Workers startup warning: ${err.message}`);
  });
});

async function shutdown(signal) {
  console.log(`\n[devmatch] Received ${signal}, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = { server, io };
