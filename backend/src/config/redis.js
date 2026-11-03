const Redis = require('ioredis');
const env = require('./env');

let redisClient = null;
let isConnected = false;

try {
  redisClient = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    isConnected = true;
    console.log('[devmatch-redis] Connected to Redis successfully');
  });

  redisClient.on('ready', () => {
    isConnected = true;
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    console.warn(`[devmatch-redis] Redis error: ${err.message}`);
  });

  redisClient.on('close', () => {
    isConnected = false;
    console.warn('[devmatch-redis] Redis connection closed');
  });

  // Attempt initial connection
  redisClient.connect().catch((err) => {
    console.warn(`[devmatch-redis] Initial connection failed (${err.message}). In-memory fallback will be used.`);
  });
} catch (err) {
  console.warn(`[devmatch-redis] Failed to initialize Redis client: ${err.message}`);
}

module.exports = {
  redis: redisClient,
  isReady: () => isConnected,
};

