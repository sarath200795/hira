HIRA Guide — realistic rigged 3D character (optional drop-in)
=============================================================

The on-screen guide ("Sam") renders as a 3D character. By default it uses a
built-in PROCEDURAL low-poly figure (no downloads, full motion). To swap in a
REALISTIC, skeleton-rigged human, drop a licensed model + a manifest here.

NO 3D assets are bundled with this repo for licensing reasons — you supply them.

Fallback order (automatic, never crashes):
  realistic .glb  ->  procedural 3D figure  ->  2D SVG Sam (reduced-motion / WebGL off)

----------------------------------------------------------------------
GET A FREE, COMMERCIAL-USE MODEL FROM MIXAMO (Adobe, free account)
----------------------------------------------------------------------
1. Go to https://www.mixamo.com and sign in (free Adobe account).
2. Pick a character you like (e.g. a realistic human).
3. Download the base model:
     Format = glTF Binary (.glb), Pose = T-pose, WITH skin.
     Save it here as:  character.glb
4. Add animations (one at a time): search and select each clip below, then
   Download with:
     Format = glTF Binary (.glb), Skin = "Without Skin",
     In Place = ON (so the character doesn't drift off screen).
   Suggested clips (Mixamo search terms in brackets):
     Walking        [Walking]
     Idle           [Idle / Breathing Idle]
     Thinking       [Thinking]
     Writing        [Writing / Using a laptop — pick what looks closest]
     ScratchHead    [Scratch Head / Annoyed Head Shake]
     Waving         [Waving]
     Sleeping       [Sleeping Idle / Sitting Sleep]

   TIP — to keep things to ONE file: in Mixamo you can apply each animation to
   the same character and download the model once "With Skin", then merge clips
   in Blender (File > Import each .glb, push each action down as an NLA strip,
   Export glTF with "Group by NLA Track"). The single character.glb then
   contains all named clips and no separate files are needed.

----------------------------------------------------------------------
MANIFEST
----------------------------------------------------------------------
Copy manifest.example.json to manifest.json and edit it so the clip values
match the EXACT animation names inside your .glb:

  {
    "model": "character.glb",
    "clips": {
      "walk":"Walking", "idle":"Idle", "think":"Thinking",
      "write":"Writing", "scratch":"ScratchHead",
      "wave":"Waving", "sleep":"Sleeping"
    },
    "scale": 1,      // shrink/grow the model to fit the small avatar box
    "yOffset": -1    // move it down so the feet sit on the ground line
  }

- "clips" is OPTIONAL. If you omit it, the app matches each state to a clip in
  the model whose name equals the state (case-insensitive: walk/idle/think/...).
- Any state with no matching clip falls back to the idle clip.
- Tune "scale" / "yOffset" until the figure is framed full-body in the avatar.

That's it — reload the app and the realistic character appears automatically.
Remove these files and it reverts to the built-in figure.
