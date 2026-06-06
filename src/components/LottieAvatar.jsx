import { useEffect, useState } from 'react'

// Optional designer-made character. Drop Lottie JSON files in /public/lottie/
// and a manifest.json mapping states → file names, e.g.:
//   { "default": "character.json", "walk": "walk.json", "write": "write.json",
//     "think": "think.json", "idle": "idle.json" }
// If no manifest/files are present, we render the built-in SVG `fallback` (Sam).
let LottieLib /* cached module */
const cache = {} // url -> animationData | null
let manifest /* {state: filename} | null | undefined (undefined = not checked) */

export default function LottieAvatar({ mode = 'idle', size = 116, fallback = null }) {
  const [, force] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (manifest === undefined) {
        try {
          const r = await fetch('/lottie/manifest.json', { cache: 'no-store' })
          manifest = r.ok ? await r.json() : null
        } catch { manifest = null }
      }
      if (!manifest) return
      if (LottieLib === undefined) {
        try { LottieLib = (await import('lottie-react')).default } catch { LottieLib = null }
      }
      const files = Array.from(new Set(Object.values(manifest)))
      await Promise.all(files.map(async (f) => {
        const url = `/lottie/${f}`
        if (url in cache) return
        try { const r = await fetch(url, { cache: 'force-cache' }); cache[url] = r.ok ? await r.json() : null } catch { cache[url] = null }
      }))
      if (alive) force((n) => n + 1)
    })()
    return () => { alive = false }
  }, [])

  if (manifest && LottieLib) {
    const file = manifest[mode] || manifest.default
    const data = file ? cache[`/lottie/${file}`] : null
    if (data) {
      const L = LottieLib
      return <L animationData={data} loop autoplay style={{ width: size, height: size }} aria-hidden />
    }
  }
  return fallback
}
