/**
 * Single Tailwind config for the whole monorepo.
 *
 * IMPORTANT (per the plan's Tailwind/CSS note): the 7 apps each defined their
 * OWN `brand`/`clay`/`ink`/`surface` palettes with DIFFERENT values. We do NOT
 * merge those raw tokens here (they would clobber each other). Instead the
 * engine owns a neutral base palette below, and each ported app scopes its own
 * palette as CSS variables under a per-app root class (e.g. `.theme-hira`) in
 * its own stylesheet. Tailwind tokens that must vary per app reference
 * `var(--…)` so the active app's theme wins without changing this file.
 *
 * @type {import('tailwindcss').Config}
 */
const { join } = require('node:path')
// Absolute globs so the content scan works regardless of which package dir the
// PostCSS/Vite build runs from (the engine runs from apps/engine).
const root = __dirname

module.exports = {
  content: [
    // Scoped to src/ + index.html so the scan never walks the symlinked
    // workspace packages inside apps/*/node_modules.
    join(root, 'apps/*/index.html'),
    join(root, 'apps/*/src/**/*.{js,jsx}'),
    join(root, 'packages/*/src/**/*.{js,jsx}'),
  ],
  theme: {
    extend: {
      colors: {
        // Engine base palette (neutral). Apps override via CSS vars when mounted.
        brand: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a',
        },
        ink: {
          50: '#f6f7f9', 100: '#eceef2', 200: '#d4d9e2', 300: '#aeb7c7',
          400: '#8290a8', 500: '#62718c', 600: '#4d5a73', 700: '#3f495d',
          800: '#373f4f', 900: '#1c2230', 950: '#11151d',
        },
        clay: {
          bg: '#f4f6fb', surface: '#ffffff',
          50: '#f8fafc', 100: '#eff3f9', 200: '#e3e8f0', 300: '#cdd5e3', 400: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Sora', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { clay: '1.5rem' },
      boxShadow: {
        glow: '0 0 0 1px rgba(37,99,235,0.12), 0 10px 34px -12px rgba(37,99,235,0.40)',
        card: '0 1px 2px rgba(16,24,40,0.05), 0 10px 28px -14px rgba(16,24,40,0.18)',
        clay: '0 1px 2px rgba(16,24,40,0.04), 0 6px 20px -8px rgba(16,24,40,0.12)',
        'clay-sm': '0 1px 2px rgba(16,24,40,0.06)',
        'clay-inset': 'inset 0 1px 2px rgba(16,24,40,0.06)',
        'clay-pressed': 'inset 0 2px 4px rgba(16,24,40,0.10)',
        'clay-brand': '0 6px 16px -4px rgba(37,99,235,0.40)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(59,130,246,0.5)' },
          '70%': { boxShadow: '0 0 0 14px rgba(59,130,246,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(59,130,246,0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        float: 'float 6s ease-in-out infinite',
        pulseRing: 'pulseRing 2s infinite',
      },
    },
  },
  plugins: [],
}
