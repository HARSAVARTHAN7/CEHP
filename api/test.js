module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    ok: true,
    message: 'Top-level Vercel serverless function is working!',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    envKeys: Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('PASS')),
  });
};
