export function createMap(mapDivId, centerLatLng, zoom) {
  return L.map(mapDivId).setView(centerLatLng, zoom);
}