export function addBaseLayer(map, tileUrl, attribution) {
  const base = L.tileLayer(tileUrl, { attribution });
  base.addTo(map);
  return base;
}