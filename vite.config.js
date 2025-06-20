import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000
  },
  optimizeDeps: {
    exclude: ['fsevents']
  },
  define: {
    global: 'globalThis'
  }
})