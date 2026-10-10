# Built to change — Piyush Puniya

An interactive 3D résumé. It plays as a roughly 40-second film as you scroll, or runs on its own when you press **Play**. The camera flies through ten scenes: Title, Built to change, Journey, Skills, System design, Scale, AI agents, Retrieval, Footprint, and a final overview of the whole world.

Everything is interactive:

- Push the voxel name around with the cursor, or click to scatter it.
- Hover a room in the "Built to change" tower to see the design pattern behind it.
- Hover a career step to open the company.
- Spin the skills armillary.
- Hover a platform floor for what it does.
- Hand off between agents.
- Switch the retrieval query.
- Hover any day of the real commit history.
- Orbit the final world and click a station to fly to it.

Links to repos, articles and company sites sit on every scene.

- **Film:** `index.html`
- **Text version:** `index.html?static`. It also loads automatically for `prefers-reduced-motion`.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

The site uses ES modules, so it needs a local server. Opening the file directly won't work.

## Publish on GitHub Pages

1. Create a repo named `piyush-hack.github.io` (or any repo name).
2. Push this folder to the `main` branch.
3. Open **Settings → Pages**, set **Source** to *Deploy from a branch*, and pick `main` and `/ (root)`.

The site will be live at `https://piyush-hack.github.io/`, or at `/<repo>/` if you used another repo name. All paths are relative, so either works.

## Where things live

| File | What it holds |
| --- | --- |
| `index.html` | Scene copy, per-scene links and the plain-text version (`.plain`) |
| `js/content.js` | Every fact and link shown in the 3D world: patterns, skills, journey, platform floors, queries |
| `js/commits.js` | Real daily commit counts for the Footprint station |
| `js/config.js` | Scene list and lengths, world layout, camera shots, per-scene framing |
| `js/stations.js` | The nine interactive 3D set pieces |
| `js/shapes.js` | The particle forms the swarm morphs between |
| `js/world.js` | Renderer, camera rig, morph engine, hover/click/drag, tooltips, orbit |
| `js/labels.js` | DOM labels pinned to 3D points (real links and buttons) |
| `js/main.js` | Boot sequence, scroll timeline, kinetic type, HUD, Play |
| `vendor/` | three.js r186, GSAP 3.15, Lenis 1.3, bundled locally so there are no CDN dependencies |

To add or retime a scene, edit `SCENES` in `js/config.js`. Every timing derives from it.

To refresh the commit history, regenerate `js/commits.js` from `git log --all --author=<your email> --format=%ad --date=short`.
