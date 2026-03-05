const { createClient } = require('redis');
require('dotenv').config();

const client = createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Redis Client Error:', err.message);
  }
});

// We don't await connect here to avoid blocking startup if Redis is down
if (process.env.REDIS_URL) {
  client.connect().catch((err) => {
    console.error('❌ Redis Connection Failed:', err.message);
  });
}

module.exports = client;
