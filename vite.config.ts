import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server:{
    port:3010,
    host:'0.0.0.0',
   },
  build: {
    // 生产环境不生成 source map（省内存和时间）
    sourcemap: false,
    // 使用 esbuild minify（比 terser 快且省内存）
    minify: 'esbuild',
    // 提高 chunk 大小警告阈值（避免过度拆分导致的额外处理）
    chunkSizeWarningLimit: 1000,
    // 手动拆分 vendor chunks，减少单个文件过大
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
})



