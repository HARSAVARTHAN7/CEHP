// Vercel Serverless Express Entrypoint
let app;
try {
  app = require('./dist/app').default || require('./dist/app');
} catch (err) {
  try {
    require('ts-node/register');
    app = require('./src/app').default || require('./src/app');
  } catch (tsErr) {
    console.error('Failed to load Express app from dist and src:', err.message, tsErr.message);
    throw err;
  }
}

module.exports = app;
