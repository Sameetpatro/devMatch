const { redis, isReady } = require('../config/redis');

// In-memory fallback map if Redis is not accessible
const fallbackMemory = new Map();

class CacheService {
  async get(key) {
    try {
      if (isReady() && redis) {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (err) {
      console.warn(`[CacheService] Redis get error for key "${key}": ${err.message}`);
    }

    const fallback = fallbackMemory.get(key);
    if (fallback && fallback.expiresAt > Date.now()) {
      return fallback.value;
    }
    fallbackMemory.delete(key);
    return null;
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      if (isReady() && redis) {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return true;
      }
    } catch (err) {
      console.warn(`[CacheService] Redis set error for key "${key}": ${err.message}`);
    }

    fallbackMemory.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  }

  async del(key) {
    try {
      if (isReady() && redis) {
        await redis.del(key);
      }
    } catch (err) {
      console.warn(`[CacheService] Redis del error for key "${key}": ${err.message}`);
    }
    fallbackMemory.delete(key);
  }

  async delPattern(pattern) {
    try {
      if (isReady() && redis) {
        const stream = redis.scanStream({ match: pattern, count: 50 });
        const keysToDelete = [];
        for await (const resultKeys of stream) {
          if (resultKeys.length) keysToDelete.push(...resultKeys);
        }
        if (keysToDelete.length > 0) {
          await redis.del(...keysToDelete);
        }
      }
    } catch (err) {
      console.warn(`[CacheService] Redis delPattern error: ${err.message}`);
    }

    // Invalidate matching memory keys
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const k of fallbackMemory.keys()) {
      if (regex.test(k)) fallbackMemory.delete(k);
    }
  }

  // --- Specialized Feed Cache Helpers ---

  getFeedKey(userId, query = {}) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    return `feed:dev:${userId}:p${page}:l${limit}`;
  }

  async getFeed(userId, query) {
    return this.get(this.getFeedKey(userId, query));
  }

  async setFeed(userId, query, data, ttlSeconds = 300) {
    return this.set(this.getFeedKey(userId, query), data, ttlSeconds);
  }

  async invalidateUserFeed(userId) {
    await this.delPattern(`feed:dev:${userId}:*`);
  }

  async invalidateAllRoleFeeds() {
    await this.delPattern('feed:dev:*');
    await this.delPattern('feed:role:*');
  }
}

module.exports = new CacheService();

