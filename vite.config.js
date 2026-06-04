import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5188,
    strictPort: true,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        // Only split heavy, self-contained libs (firebase, papaparse). Keep
        // React-coupled libs (recharts, react-router) in the vendor chunk to
        // avoid cross-chunk TDZ crashes. Route-level lazy() already splits pages.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          const m = id.split('node_modules/')[1] || ''
          const pkg = m.startsWith('@') ? m.split('/').slice(0, 2).join('/') : m.split('/')[0]
          if (pkg === 'papaparse') return 'papaparse'
          if (pkg === 'firebase' || pkg.startsWith('@firebase')) return 'firebase'
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
