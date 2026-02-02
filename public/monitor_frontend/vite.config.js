import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'


export default defineConfig({
  plugins: [vue()],
  define: {
    global: 'window'
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true,
    proxy: {
      // 当请求以 /api 开头时，会代理到后端接口
      '/api': {
        target: 'http://localhost:32888',  // 后端接口地址
        changeOrigin: true,  // 修改请求头中的Origin字段，解决跨域问题
        secure: false,  // 如果是https接口，需要配置这个参数
        rewrite: (path) => path.replace(/^\/api/, ''),  // 重写路径，将 /api 前缀去掉
        // 可选：配置超时时间
        timeout: 10000,
      },
      // WebSocket 代理配置
      '/ws': {
        target: 'http://localhost:32888',
        ws: true,  // 启用 WebSocket 代理
        changeOrigin: true,
        secure: false,
      },
    },
  },
})