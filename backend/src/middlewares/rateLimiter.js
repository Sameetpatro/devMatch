const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redis, isReady } = require('../config/redis');

function getStore(prefix) {
  if (isReady() && redis) {
    try {
      return new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: `ratelimit:${prefix}:`,
      });
    } catch (err) {
      console.warn(`[rateLimiter] Could not create Redis store: ${err.message}`);
    }
  }
  return undefined; // MemoryStore fallback
}

// 1. Strict Limiter for Auth Routes (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('auth'),
  message: {
    status: 'error',
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// 2. Limiter for Swiping & Applications (bot spam protection)
const actionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 40, // 40 actions per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('action'),
  message: {
    status: 'error',
    error: 'Rate limit exceeded for applications/swipes. Please slow down.',
  },
});

// 3. General API Limiter
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('general'),
  message: {
    status: 'error',
    error: 'Too many requests. Please try again shortly.',
  },
});

module.exports = {
  authLimiter,
  actionLimiter,
  generalLimiter,
};

