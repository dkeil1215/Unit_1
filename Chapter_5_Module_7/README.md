# GISC 230 – Week 7 Leaflet Foundations (Starter Template)

This starter uses the **course boilerplate** structure:
- `index.html` (structure)
- `css/style.css` (styling)
- `js/main.js` (single JS entry point)
- modular JS files in `js/map/` and `js/layers/`
- data files in `data/`

## How to run
1. Open this folder in VS Code.
2. Start a local server (recommended: **Live Server**).
3. Open `index.html` via the local server.

> **Important:** GeoJSON loading uses `fetch()`. Many browsers block `fetch()` from `file://` paths. Use a local server.

## What you will build
By completing the TODOs, your map will:
- initialize a Leaflet map
- add an OpenStreetMap basemap
- add **3 markers** with popups
- add **1 polygon** “study area” with a popup
- load `data/parks.geojson` and render it as circle markers with attribute-driven popups

## Where to work (TODO map)
- `js/map/createMap.js` → create the map
- `js/layers/addBaseLayer.js` → add the basemap
- `js/layers/addDemoMarkers.js` → add 3 markers + popups
- `js/layers/addDemoPolygon.js` → add polygon + styling + popup
- `js/layers/addParksGeoJSON.js` → load GeoJSON + style + popup from `feature.properties`

## Student checklist (submit-ready)
- [ ] Map loads without errors.
- [ ] Map is centered on the configured location and zoom.
- [ ] Basemap appears with **proper attribution**.
- [ ] At least **3 markers** are visible and each opens a popup.
- [ ] At least **1 polygon or polyline** is visible and opens a popup.
- [ ] GeoJSON loads successfully and is visible on the map.
- [ ] GeoJSON features display popups using the dataset’s **properties**.
- [ ] Code is readable (clear names, consistent indentation).

## Reflection prompts (include with your submission)
Answer in 4–6 sentences total:
1. How did interactivity (clicking, panning, zooming) change the way you explored the map?
2. What was one design decision you made to improve clarity (for example: popup text, symbol size, or color)?

## Troubleshooting
- If you see an error like “Failed to fetch” for GeoJSON:
  - confirm you are using Live Server (or another local server)
  - confirm the file path is correct: `data/parks.geojson`
- If the map is blank:
  - open browser dev tools → Console tab
  - look for JavaScript errors and fix the first one
