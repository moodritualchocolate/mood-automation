# mood ENERGY — cinematic landing (artifact source)

`mood-energy.template.html` is the source with placeholder tokens. The published
self-contained artifact is built by inlining libraries, fonts and the product
image into the tokens:

- `/*__THREE__*/`  → landing/assets/three.min.js (three r160, UMD global)
- `/*__GSAP__*/`   → video/mood-energy-pulse/assets/vendor/gsap.min.js
- `__HEEBO_LAT__` / `__HEEBO_HE__` → base64 of video/mood-energy-pulse/assets/fonts/heebo-*.woff2
- `__BAR__`        → base64 of video/mood-energy-pulse/assets/img/bar_snap.png

Stack of the live version: vanilla Three.js + custom GLSL point-cloud
(simplex-noise displacement + cursor force-field) + GSAP entrance + glassmorphism.
Production target: port to Next.js (App Router) + @react-three/fiber + drei in `src/`.
