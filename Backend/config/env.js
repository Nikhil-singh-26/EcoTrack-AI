require('dotenv').config();

const requiredEnv = [
  'MONGODB_URI',
  'JWT_SECRET',
  'OPENROUTER_API_KEY'
];

const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  console.error(`❌ Missing mandatory environment variables: ${missingEnv.join(', ')}`);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  co2Factor: parseFloat(process.env.CO2_FACTOR) || 0.85,
  electricityRate: parseFloat(process.env.ELECTRICITY_RATE) || 0.12,
  aiInsightsEnabled: process.env.AI_INSIGHTS_ENABLED === 'true',
  energyAlertThreshold: parseFloat(process.env.ENERGY_ALERT_THRESHOLD) || 80,
  leaderboardLimit: parseInt(process.env.LEADERBOARD_LIMIT) || 10,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  aiModel: process.env.AI_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free',
  redisUrl: process.env.REDIS_URL
};

module.exports = config;
