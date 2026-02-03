require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  apiKey: process.env.API_KEY || 'default-api-key',
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions'
  },
  appName: process.env.APP_NAME || 'AI-Honeypot-System'
};

