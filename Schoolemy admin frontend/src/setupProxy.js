const { createProxyMiddleware } = require('http-proxy-middleware');

console.log('========================================');
console.log('🔧 PROXY MIDDLEWARE LOADING');
console.log('========================================');

module.exports = function(app) {
  console.log('✅ setupProxy.js is being executed!');
  console.log('📡 Configuring proxy: /api -> https://e3a24h4aa3.execute-api.ap-south-1.amazonaws.com/dev');
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://e3a24h4aa3.execute-api.ap-south-1.amazonaws.com/dev',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req) => {
        console.log(`\n[Proxy] ➡️  ${req.method} ${req.path}`);
        console.log(`[Proxy] 🎯 Target: https://e3a24h4aa3.execute-api.ap-south-1.amazonaws.com/dev${req.path}\n`);
      },
      onProxyRes: (proxyRes, req) => {
        console.log(`[Proxy] ⬅️  ${proxyRes.statusCode} ${req.path}\n`);
      },
      onError: (err, req, res) => {
        console.log(`[Proxy] ❌ ERROR: ${err.message}\n`);
      }
    })
  );
  
  console.log('✅ Proxy configured successfully!');
  console.log('========================================\n');
};