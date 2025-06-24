import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    
    // 关键优化：启用压缩和代码分割
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 删除console语句
        drop_debugger: true, // 删除debugger
        pure_funcs: ['console.log'] // 删除特定函数调用
      }
    },
    
    // 资源内联阈值（小于4KB的资源会被内联为base64）
    assetsInlineLimit: 4096,
    
    // 分包策略优化
    rollupOptions: {
      output: {
        // 更细粒度的代码分割，减少单个文件大小
        manualChunks: {
          // Vue核心库
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // Element Plus按需分包
          'element-ui': ['element-plus'],
          // Element Plus图标单独打包
          'element-icons': ['@element-plus/icons-vue'],
          // 工具库
          'utils': ['@vueuse/core']
        },
        
        // 文件命名优化，启用缓存
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|webp/i.test(ext)) {
            return `images/[name]-[hash].${ext}`
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        },
      }
    },
    
    // CSS代码分割和压缩
    cssCodeSplit: true,
    cssMinify: true,
    
    // 构建优化
    reportCompressedSize: false,  // 加快构建速度
    chunkSizeWarningLimit: 500,   // 500KB警告阈值
  },
  // 依赖预构建优化
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'element-plus/es',
      '@element-plus/icons-vue',
      '@vueuse/core'
    ],
    exclude: []
  },

  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://114.55.73.26:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('发送请求:', req.method, req.url, '-> 目标:', proxyReq.getHeader('host'));
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('收到响应:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/assets': {
        target: 'http://114.55.73.26:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
