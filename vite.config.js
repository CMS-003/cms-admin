import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHtmlPlugin } from 'vite-plugin-html'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  base: "/manager/",
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        global: true,
        process: true,
      },
    }),
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          // 可以注入变量到 HTML
          title: 'manager',
        },
      },
    }),
  ],
  define: {
    'process.env.PUBLIC_URL': JSON.stringify('/manager'),
  },
  resolve: {
    alias: {
      // 将 CRA 的路径别名迁移过来
      '@': '/src',
      // 根据你的 config-overrides.js 中的别名配置添加
    },
  },
  server: {
    port: 3000, // 保持与 CRA 相同的端口
    open: true, // 自动打开浏览器
    proxy: {
      '/ws': {
        target: 'ws://192.168.0.124',
        ws: true,
        changeOrigin: true,
      },
      '/gw': {
        target: 'http://192.168.0.124',
        changeOrigin: true,
      },
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
        target: 'http://192.168.0.124',
        changeOrigin: true,
        pathRewrite: { '^/manager': '/' }
      },
    },
  },
  build: {
    outDir: 'build', // 保持与 CRA 相同的输出目录
    sourcemap: true,
  },
})