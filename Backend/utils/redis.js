const Redis = require('ioredis');
require('dotenv').config();

let redis = null;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 50, 2000);
      }
    });

    redis.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis Error:', err.message);
      // We don't want to crash the app if Redis fails
      redis = null;
    });
  } catch (error) {
    console.error('❌ Redis Initialization Failed:', error.message);
    redis = null;
  }
} else {
  console.log('ℹ️ REDIS_URL not found, Redis caching disabled');
}

module.exports = redis;
