export async function addCountyPolygons(map, geoJsonPath) {
  const response = await fetch(geoJsonPath);
  if (!response.ok) {
    throw new Error(`Could not load county GeoJSON: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const polygonLayer = L.geoJSON(data, {
    style: () => ({
      color: '#555',
      weight: 1,
      fillColor: '#d9d9d9',
      fillOpacity: 0.2
    }),
    onEachFeature: (feature, layer) => {
      const props = feature.properties || {};
      const countyName = props.NAME || 'Unknown County';
      const year = props.Year ?? 'N/A';

      layer.bindPopup(`
        <strong>${countyName}</strong><br>
        Year: ${year}
      `);
    }
  }).addTo(map);

  return polygonLayer;
}