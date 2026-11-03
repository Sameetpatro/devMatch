const { redis, isReady } = require('../config/redis');

const PRESENCE_TTL_SECONDS = 60; // 60s presence window
const inMemoryPresence = new Map();

class PresenceService {
  getKey(userId) {
    return `presence:user:${userId}`;
  }

  async heartbeat(userId) {
    const id = Number(userId);
    const key = this.getKey(id);
    const timestamp = Date.now();

    try {
      if (isReady() && redis) {
        await redis.set(key, timestamp, 'EX', PRESENCE_TTL_SECONDS);
        return { userId: id, isOnline: true, lastSeen: timestamp };
      }
    } catch (err) {
      console.warn(`[PresenceService] Redis heartbeat error: ${err.message}`);
    }

    inMemoryPresence.set(id, timestamp + PRESENCE_TTL_SECONDS * 1000);
    return { userId: id, isOnline: true, lastSeen: timestamp };
  }

  async isOnline(userId) {
    const id = Number(userId);
    const key = this.getKey(id);

    try {
      if (isReady() && redis) {
        const exists = await redis.exists(key);
        return Boolean(exists);
      }
    } catch (err) {
      console.warn(`[PresenceService] Redis isOnline error: ${err.message}`);
    }

    const exp = inMemoryPresence.get(id);
    return Boolean(exp && exp > Date.now());
  }

  async getUsersPresence(userIds = []) {
    if (!userIds || userIds.length === 0) return {};

    const numericIds = userIds.map((id) => Number(id));
    const result = {};

    try {
      if (isReady() && redis) {
        const pipeline = redis.pipeline();
        for (const id of numericIds) {
          pipeline.exists(this.getKey(id));
        }
        const execResults = await pipeline.exec();

        numericIds.forEach((id, index) => {
          const [err, exists] = execResults[index] || [];
          result[id] = !err && Boolean(exists);
        });

        return result;
      }
    } catch (err) {
      console.warn(`[PresenceService] Redis getUsersPresence error: ${err.message}`);
    }

    numericIds.forEach((id) => {
      const exp = inMemoryPresence.get(id);
      result[id] = Boolean(exp && exp > Date.now());
    });

    return result;
  }

  async setOffline(userId) {
    const id = Number(userId);
    try {
      if (isReady() && redis) {
        await redis.del(this.getKey(id));
      }
    } catch (err) {
      console.warn(`[PresenceService] Redis setOffline error: ${err.message}`);
    }
    inMemoryPresence.delete(id);
    return { userId: id, isOnline: false };
  }
}

module.exports = new PresenceService();

