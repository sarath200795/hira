import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const monorepoRoot = resolve(__dirname, '../..')
const demoPkg = resolve(monorepoRoot, 'packages/demo-firebase/src')

// In demo mode, alias the firebase SDK entry points to the in-memory mocks so
// EVERY app's data code runs with seeded data and no real backend.
const demoFirebaseAliases = [
  { find: /^firebase\/app$/, replacement: resolve(demoPkg, 'mock-app.js') },
  { find: /^firebase\/auth$/, replacement: resolve(demoPkg, 'mock-auth.js') },
  { find: /^firebase\/firestore$/, replacement: resolve(demoPkg, 'mock-firestore.js') },
  { find: /^firebase\/storage$/, replacement: resolve(demoPkg, 'mock-storage.js') },
]

// Single Vite build for the whole engine. Workspace packages and the vendored
// apps are consumed as SOURCE (their JSX is transformed by this build), so we:
//   - allow Vite to read files outside the app dir (server.fs.allow),
//   - dedupe singletons (one React / Router / Firebase across all packages),
//   - exclude @unified/* from prebundling so edits hot-reload.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const isDemo = env.VITE_DEMO_MODE === 'true'

  return {
  plugins: [react()],
  define: {
    // ensure import.meta.env.VITE_DEMO_MODE is available even via loadEnv path
    'import.meta.env.VITE_DEMO_MODE': JSON.stringify(env.VITE_DEMO_MODE || ''),
  },
  server: {
    port: 5180,
    strictPort: false,
    fs: { allow: [monorepoRoot] },
  },
  resolve: {
    alias: isDemo ? demoFirebaseAliases : [],
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
  }
})
