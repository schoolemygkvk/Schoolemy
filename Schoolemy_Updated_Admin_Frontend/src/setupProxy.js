const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://z3zj7b6tpb.execute-api.ap-south-1.amazonaws.com/dev',
      changeOrigin: true,
      logLevel: 'silent',
    })
  );
};