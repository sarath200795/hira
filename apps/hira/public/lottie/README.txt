HIRA Guide — custom animated character (Lottie)
===============================================

The on-screen guide ("Sam") ships as a built-in SVG character. To swap in a
richer, designer-made animated character, drop Lottie JSON files in THIS folder
and add a manifest.json. No code changes needed — the app picks them up
automatically and falls back to the built-in Sam if they're absent.

1) Get a character animation (properly licensed):
   - https://lottiefiles.com  → search e.g. "construction worker", "engineer",
     "safety helmet character", "person writing", "thinking".
   - Download the *Lottie JSON* (not GIF/MP4). Check each asset's license
     (many are free under the Lottie Simple License; attribute if required).

2) Put the JSON file(s) here, for example:
   /public/lottie/character.json      (one looping character — simplest)
   optional per-state files:
   /public/lottie/walk.json
   /public/lottie/write.json          (shown on "Create Risk Assessment")
   /public/lottie/think.json
   /public/lottie/idle.json

3) Create /public/lottie/manifest.json mapping states → file names. See
   manifest.example.json in this folder. Minimal version:
   { "default": "character.json" }

4) Redeploy (npm run deploy:hosting). That's it — the guide now plays your
   animation; it still walks across the screen and opens the same insights panel.

Note: we deliberately do NOT bundle a third-party character to avoid shipping
copyrighted assets. Use a file you have the right to use.
