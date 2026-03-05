const redis = require('../utils/redis');

const cacheMiddleware = (duration) => async (req, res, next) => {
  // If no redis, skip caching
  if (!redis) {
    return next();
  }

  // Create a cache key based on URL and user (if authenticated)
  const key = `cache:${req.originalUrl || req.url}:${req.user ? req.user.id : 'public'}`;

  try {
    const cachedResponse = await redis.get(key);

    if (cachedResponse) {
      console.log(`📡 Cache Hit: ${key}`);
      return res.json(JSON.parse(cachedResponse));
    }

    // Capture the original res.json to store the response in cache
    res.sendResponse = res.json;
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode === 200) {
        redis.set(key, JSON.stringify(body), 'EX', duration);
      }
      res.sendResponse(body);
    };

    next();
  } catch (error) {
    console.warn('⚠️ Cache Middleware Error:', error.message);
    next();
  }
};

module.exports = cacheMiddleware;
