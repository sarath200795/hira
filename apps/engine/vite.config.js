import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const monorepoRoot = resolve(__dirname, '../..')

// Single Vite build for the whole engine. Workspace packages and the vendored
// apps are consumed as SOURCE (their JSX is transformed by this build), so we:
//   - allow Vite to read files outside the app dir (server.fs.allow),
//   - dedupe singletons (one React / Router / Firebase across all packages),
//   - exclude @unified/* from prebundling so edits hot-reload.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: false,
    fs: { allow: [monorepoRoot] },
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom', 'firebase'],
  },
  optimizeDeps: {
    exclude: [
      '@unified/app-hira',
      '@unified/app-registry',
      '@unified/shared-auth',
      '@unified/shared-firebase',
      '@unified/shared-sites',
      '@unified/shared-ui',
      '@unified/shared-users',
    ],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          const m = id.split('node_modules/')[1] || ''
          const pkg = m.startsWith('@') ? m.split('/').slice(0, 2).join('/') : m.split('/')[0]
          if (pkg === 'firebase' || pkg.startsWith('@firebase')) return 'firebase'
          if (pkg === 'three' || pkg.startsWith('@react-three')) return 'three'
          if (pkg === 'recharts') return 'recharts'
          return undefined
        },
      },
    },
  },
})
