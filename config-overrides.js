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
        target: 'http://127.0.0.1:3334',
        changeOrigin: true,
        // pathRewrite: { '^/api': '/' }
      },
      '/upload/': {
        target: 'http://127.0.0.1:3334',
        changeOrigin: true,
        // pathRewrite: { '^/api': '/' }
      },
    }
    return config;
  })
}