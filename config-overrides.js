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
    config.client = config.client || {};
    config.client.webSocketURL = {
      pathname: "/dev-ws"
    };
    config.proxy = {
      '/ws': {
        target: 'ws://192.168.0.124',
        ws: true,
        changeOrigin: true,
      },
      '/gw': {
        target: 'http://192.168.0.124',
        changeOrigin: true,
      },
      // '/gw/manager': {
      //   target: 'http://192.168.0.124',
      //   changeOrigin: true,
      // },
      // '/gw/user': {
      //   target: 'http://127.0.0.1:8092',
      //   changeOrigin: true,
      //   pathRewrite: { '^/gw/user': '/' }
      // },
      '/manager/upload/': {
        target: 'http://192.168.0.124:3333',
        changeOrigin: true,
        pathRewrite: { '^/manager': '/' }
      },
      '/manager/images/': {
        target: 'http://192.168.0.124:3333',
        changeOrigin: true,
        pathRewrite: { '^/manager': '/' }
      },
      '/images/': {
        target: 'http://192.168.0.124:3333',
        changeOrigin: true,
        pathRewrite: { '^/manager': '/' }
      },
    }
    return config;
  })
}