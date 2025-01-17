const { override, addWebpackAlias, addDecoratorsLegacy, overrideDevServer, addWebpackPlugin } = require('customize-cra');
const path = require('path');
const analyzer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  webpack: override(
    addWebpackAlias({
      "@": path.resolve(__dirname, 'src'),
    }),
    addDecoratorsLegacy(),
    // addWebpackPlugin(new analyzer()),
  ),
  devServer: overrideDevServer(config => {
    config.proxy = {
      '/api/': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        // pathRewrite: { '^/api': '/' }
      },
      '/upload/': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      '/images/': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    }
    return config;
  })
}