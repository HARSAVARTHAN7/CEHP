// Vercel Serverless Express Entrypoint
const app = require('./dist/app').default || require('./dist/app');
module.exports = app;
