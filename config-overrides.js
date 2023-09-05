const { override, addWebpackAlias, addDecoratorsLegacy, overrideDevServer } = require('customize-cra');
const path = require('path')

module.exports = {
  webpack: override(
    addWebpackAlias({
      "@": path.resolve(__dirname, 'src'),
    }),
    addDecoratorsLegacy(),
  ),
  devServer: overrideDevServer(config => {
    config.proxy = {
      '/api/': {
        target: 'http://127.0.0.1:3334',
        changeOrigin: true,
        // pathRewrite: { '^/api': '/' }
      },
    }
    return config;
  })
}