function getCentroidLatLng(layer) {
  return layer.getBounds().getCenter();
}

function getRadius(value, mode = 'scaled') {
  const numericValue = Number(value) || 0;

  if (mode === 'fixed') {
    return 8;
  }

  // Proportional symbol logic:
  // sqrt scaling is appropriate because circle area should visually represent quantity.
  // Without sqrt, large values would dominate too strongly.
  const scaleFactor = 0.08;
  return Math.max(4, Math.sqrt(numericValue) * scaleFactor);
}

function getColor(value) {
  const numericValue = Number(value) || 0;

  // Three-class classification with defensible breaks for density-style / count-style values
  if (numericValue > 20000) return '#7f0000';   // very high
  if (numericValue > 5000) return '#fc8d59';    // medium
  return '#91cf60';                             // lower
}

function buildPopupContent(props, activeAttribute) {
  const county = props.NAME || 'Unknown County';
  const year = props.Year ?? 'N/A';
  const countyPop = props.CountyPopu ?? 'N/A';
  const totalValid = props.TotalValid ?? 'N/A';
  const urbanArea = props.UrbanAKM2 ?? 'N/A';
  const nonUrbanArea = props.NonUrban_A ?? 'N/A';
  const urbanDensity = props.Urban_Pop_ ?? 'N/A';
  const nonUrbanDensity = props.NonUrban_1 ?? 'N/A';
  const totalDensity = props.Total_Pop_ ?? 'N/A';
  const activeValue = props[activeAttribute] ?? 'N/A';

  return `
    <div class="popup-content">
      <strong>${county}</strong><br>
      Year: ${year}<br>
      County Population: ${countyPop}<br>
      Total Valid Area: ${totalValid}<br>
      Urban Area: ${urbanArea}<br>
      Non-Urban Area: ${nonUrbanArea}<br>
      Urban Density: ${urbanDensity}<br>
      Non-Urban Density: ${nonUrbanDensity}<br>
      Total Density: ${totalDensity}<br>
      <hr>
      <strong>Mapped Attribute (${activeAttribute}):</strong> ${activeValue}
    </div>
  `;
}

function createSymbolLayer(data, activeAttribute, scalingMode) {
  const polygonReference = L.geoJSON(data);

  const symbolFeatures = [];

  polygonReference.eachLayer((polyLayer) => {
    const feature = polyLayer.feature;
    const props = feature.properties || {};
    const latlng = getCentroidLatLng(polyLayer);
    const value = Number(props[activeAttribute]) || 0;

    const marker = L.circleMarker(latlng, {
      radius: getRadius(value, scalingMode),
      fillColor: getColor(value),
      color: '#222',
      weight: 1,
      fillOpacity: 0.75
    });

    marker.bindPopup(buildPopupContent(props, activeAttribute));
    symbolFeatures.push(marker);
  });

  return L.layerGroup(symbolFeatures);
}

export async function addCountySymbolsGeoJSON(map, geoJsonPath, initialAttribute = 'Total_Pop_', initialScalingMode = 'scaled') {
  const response = await fetch(geoJsonPath);
  if (!response.ok) {
    throw new Error(`Could not load county GeoJSON: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  let activeAttribute = initialAttribute;
  let scalingMode = initialScalingMode;
  let symbolLayer = createSymbolLayer(data, activeAttribute, scalingMode).addTo(map);

  function redraw() {
    map.removeLayer(symbolLayer);
    symbolLayer = createSymbolLayer(data, activeAttribute, scalingMode).addTo(map);
  }

  function setAttribute(newAttribute) {
    activeAttribute = newAttribute;
    redraw();
  }

  function setScalingMode(newMode) {
    scalingMode = newMode;
    redraw();
  }

  function getAttribute() {
    return activeAttribute;
  }

  function getScalingMode() {
    return scalingMode;
  }

  function getLayer() {
    return symbolLayer;
  }

  return {
    setAttribute,
    setScalingMode,
    getAttribute,
    getScalingMode,
    getLayer
  };
}