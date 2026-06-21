#!/usr/bin/env node
/**
 * Route-prefix grep gate (plan: "add a grep/lint gate for any remaining literal
 * /app/"). Fails if any ported app still contains the old `/app/...` absolute
 * link/route prefix, which would break under the `/apps/<id>/...` mount.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const APPS_DIR = new URL('../apps/', import.meta.url).pathname
const OFFENDERS = []
// Matches `to="/app/`, `'/app/`, `Navigate to="/app"` etc. but not `/apps/`.
const BAD = /['"`]\/app(?:\/|['"`])/g

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) walk(p)
    else if (/\.(jsx?|tsx?)$/.test(name)) {
      const txt = readFileSync(p, 'utf8')
      // engine app legitimately owns /apps and admin routes; skip the engine pkg
      if (p.includes('/apps/engine/')) continue
      const hits = txt.match(BAD)
      if (hits) OFFENDERS.push(`${p}: ${[...new Set(hits)].join(', ')}`)
    }
  }
}

walk(APPS_DIR)
if (OFFENDERS.length) {
  console.error('✗ Found legacy /app/ route prefixes (should be /apps/<id>/):')
  for (const o of OFFENDERS) console.error('  ' + o)
  process.exit(1)
}
console.log('✓ No legacy /app/ prefixes found in ported apps.')
