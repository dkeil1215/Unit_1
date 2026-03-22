import { CONFIG } from './config.js';
import { createMap } from './map/createMap.js';
import { addBaseLayer } from './layers/addBaseLayer.js';
import { addCountyPolygons } from './layers/addCountyPolygons.js';
import { addCountySymbolsGeoJSON } from './layers/addCountySymbolsGeoJSON.js';
import { addMapControls } from './ui/addMapControls.js';

function showFriendlyError(err) {
  console.error(err);
  alert('GeoJSON failed to load. Make sure you are running a local server and that the GeoJSON path is correct.');
}

async function main() {
  const map = createMap('map', CONFIG.mapCenter, CONFIG.mapZoom);
  addBaseLayer(map, CONFIG.tileUrl, CONFIG.tileAttribution);

  try {
    // Add county boundary polygons
    const polygonLayer = await addCountyPolygons(map, CONFIG.countiesGeoJsonPath);

    // Add centroid-based proportional symbols
    const symbolController = await addCountySymbolsGeoJSON(
      map,
      CONFIG.countiesGeoJsonPath,
      CONFIG.defaultAttribute,
      CONFIG.defaultScalingMode
    );

    // Add UI controls
    addMapControls(map, symbolController, polygonLayer);
  } catch (err) {
    showFriendlyError(err);
  }
}

main();