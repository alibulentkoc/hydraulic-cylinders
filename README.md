# Hydraulic cylinders: animated cross-sections

An interactive teaching site. Students pick a cylinder type from the list and watch it work in a 2D cross-section or a 3D cutaway that they can rotate. Each type has a short explanation, a schematic symbol and a calculator (SI or US customary units).

Cylinder types included:

- Double-acting
- Single-acting, spring return
- Double-rod
- Tandem
- Duplex (three-position)
- Telescoping ram
- Stop tube (with and without)
- Seals: static and dynamic (separate page, `seals.html`)

## Publish on GitHub Pages

1. Create a new repository on GitHub (for example `hydraulic-cylinders`).
2. Upload everything in this folder, keeping the folder structure (`index.html`, `seals.html`, `css/`, `js/`).
3. In the repository go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<your-user-name>.github.io/<repository-name>/`.

Each cylinder has its own link, for example `.../index.html#telescoping`, so you can send students straight to one type.

The site loads three.js and Google Fonts from public CDNs, so it needs an internet connection. Everything else is plain HTML, CSS and JavaScript with no build step.

## Files

| File | What it does |
|---|---|
| `index.html` | Page layout |
| `css/styles.css` | Colours (light and dark mode) and drawing styles |
| `js/cylinders.js` | One entry per cylinder type: geometry, animation, text and calculator |
| `js/engine.js` | Draws the 2D section (SVG) and the 3D cutaway (three.js) from the same geometry |
| `js/app.js` | Type list, controls, animation loop, units and calculator |
| `seals.html` | Stand-alone static and dynamic seals simulator |

## Adding a new cylinder type

Open `js/cylinders.js`, copy one of the existing entries (the double-acting one is the simplest) and add it to the `list` at the bottom. Each entry has:

- `build()`: the parts. Every part is a profile of `[radius, axial position]` points, so one definition draws both the section and the 3D view. Helper functions (`blindCap`, `headR`, `barrel`, `piston`, `rod`, `tie`) cover the usual parts.
- `state(u, dir)`: where the moving parts are for a stroke position `u` from 0 to 1, which chambers hold pressure or return oil, and the status sentence.
- `summary`, `steps`, `uses`, `watch`: the teaching text.
- `calc`: calculator inputs (stored in SI) and the rows to show.

Drawings are simplified and not to scale.
