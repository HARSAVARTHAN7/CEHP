// Root Vercel Serverless Function Bridge
let app;
try {
  app = require('../backend/dist/app').default || require('../backend/dist/app');
} catch (err) {
  try {
    require('ts-node/register');
    app = require('../backend/src/app').default || require('../backend/src/app');
  } catch (tsErr) {
    console.error('Failed to load Express app in root api/index.js:', err.message, tsErr.message);
    throw err;
  }
}

module.exports = app;
