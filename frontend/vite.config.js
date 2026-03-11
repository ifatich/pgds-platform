import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  // Proxy hanya aktif saat development (pnpm dev)
  // Di production, VITE_API_URL di .env yang menentukan URL backend
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true }
    }
  },
  build: {
    // Hilangkan console.log di production build
    minify: 'esbuild',
    sourcemap: false,
  }
})
