# Plan: Cinematic Mars landscape (Vite + Three.js) — Request 1

## Context

The folder is empty apart from `CLAUDE.md`. Goal: a Vite + Three.js project showing a cinematic Martian landscape (dunes, rocks, dusty caramel sky, setting sun with warm light and soft shadows, Phobos and Deimos), with something on screen within 2 minutes of approval, then improved in up to 3 verified iterations. This scene is the base the Perseverance rover will be added to later.

Environment checked: Node v20.10.0, npm 10.1.0, Google Chrome installed at `/Applications/Google Chrome.app`.

## Stack and conventions (kept for the whole project)

- Vanilla JS, ES modules, no framework, no TypeScript.
- `vite@^6` (Vite 7 needs Node 20.19+, we have 20.10), `three` (latest).
- `playwright-core` as devDependency: it never downloads browsers; launched with `channel: 'chrome'` to use the installed Chrome.
- One module per scene element, each exporting a `createX(scene)` function; camelCase names; shared constants in one place.

## File structure

```
index.html            full-screen canvas, loads /src/main.js
package.json          scripts: dev, build, check
src/main.js           renderer, camera, OrbitControls, render loop, resize
src/terrain.js        createTerrain(): dunes
src/rocks.js          createRocks(): scattered instanced rocks
src/sky.js            createSky(): sky dome, sun disc, fog
src/lights.js         createLights(): sun directional + hemisphere
src/moons.js          createMoons(): Phobos and Deimos
src/noise.js          small seeded value-noise/fbm helper (no extra dependency)
scripts/check.mjs     headless screenshot + console error report
screenshots/          check output (gitignored)
```

## Step 0 — First render (target: under 2 minutes)

1. Write `package.json`, `index.html`, and a minimal `src/main.js` by hand (faster than the interactive `npm create vite`).
2. `npm install three` and `npm install -D vite@^6 playwright-core`.
3. Start `npm run dev` in the background (port 5173, `--host` off, `strictPort` so the URL is stable) and give you the URL for Cursor's browser.
4. Minimal first frame: flat orange ground plane, caramel background colour and fog, one warm directional light, a camera low to the ground. Vite hot reload shows every later change live.

## Step 1 — Iteration 1: terrain, sky, sun

- **Terrain** (`terrain.js`): 400×400 plane, ~256² segments, vertex heights from fbm noise plus a directional ridged term for wind-shaped dunes; `MeshStandardMaterial` with vertex colours blending rust, ochre and darker basalt by height and slope; roughness ~1.
- **Sky** (`sky.js`): large inverted sphere with a small `ShaderMaterial` gradient: butterscotch/caramel at zenith, paler dusty tan at horizon, and a cool blue-white glow around the sun (the real Martian sunset look). `FogExp2` in a matching dust colour.
- **Sun** (`lights.js`): `DirectionalLight` low on the horizon (~8° elevation), warm colour, `PCFSoftShadowMap`, 2048² shadow map with a frustum fitted to the visible area, plus a dim `HemisphereLight` for dusty fill. Visible sun disc as an additive sprite in `sky.js`.
- Renderer: `ACESFilmicToneMapping`, sRGB output, pixel ratio capped at 2.
- Run `npm run check`, inspect screenshot, fix.

## Step 2 — Iteration 2: rocks and moons

- **Rocks** (`rocks.js`): 3–4 base geometries from noise-displaced `IcosahedronGeometry`, drawn with `InstancedMesh` (~600 instances), seeded random position/scale/rotation, sat on the terrain using the same height function, denser near the camera; cast and receive shadows.
- **Moons** (`moons.js`): Phobos as a small lumpy, noise-displaced sphere and Deimos smaller and fainter, placed on the sky dome away from the sun, lit unshaded-ish with a subtle sun-side terminator, fog disabled so they stay visible. Sizes slightly exaggerated versus reality so they read on screen.
- Run `npm run check`, inspect screenshot, fix.

## Step 3 — Iteration 3: cinematic polish

- Camera: low, wide framing looking toward the sun with dunes leading in; `OrbitControls` with damping and limits so it cannot go underground; very slow automatic drift.
- Drifting dust: a `Points` layer of ~2000 soft particles moving with the wind.
- Tune exposure, fog density, shadow softness/bias and colours from what the screenshot shows.
- Run `npm run check`, inspect screenshot, fix. Stop here (3 iterations maximum).

## Verification — `npm run check`

`scripts/check.mjs`:

1. Launch `chromium.launch({ channel: 'chrome', headless: true })` from `playwright-core`, with WebGL-friendly flags (`--use-angle=metal`, `--enable-unsafe-swiftshader` as fallback).
2. Collect `console` messages of type `error` and `pageerror` events.
3. Open `http://localhost:5173` (override with `CHECK_URL`), 1600×900 viewport, wait for a `window.__ready` flag that `main.js` sets after the first rendered frame, then a short settle delay.
4. Save `screenshots/check.png`, print the path and the list of console errors, and exit with code 1 if there are any.

It needs the dev server running, which it will be throughout. After each iteration I run it, read the screenshot myself, and fix what looks wrong or errors before moving on.

## Out of scope for this request

The rover itself, driving controls, post-processing passes (bloom, etc.) and git setup. I can add any of them next.
