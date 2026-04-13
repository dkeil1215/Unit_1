let map;
let geoLayer;
let legend;

function updateMap(geoData, singleSummary, bivariateSummary, mapMode, variable, variable2, selectedCounty, comparisonCounty) {
  if (!geoData) return;

  if (!map) {
    map = L.map("map", { tap: true, zoomControl: true }).setView([37.75, -122.2], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
  }

  if (geoLayer) {
    geoLayer.remove();
  }

  geoLayer = L.geoJSON(geoData, {
    style: feature => styleFeature(feature, singleSummary, bivariateSummary, selectedCounty, comparisonCounty, mapMode),
    onEachFeature: (feature, layer) => onEachFeature(feature, layer, variable, variable2, mapMode)
  }).addTo(map);

  if (geoLayer.getBounds && geoLayer.getBounds().isValid()) {
    map.fitBounds(geoLayer.getBounds(), { padding: [12, 12] });
  }

  updateLegend(singleSummary, bivariateSummary, variable, variable2, mapMode);

  setTimeout(() => {
    map.invalidateSize();
  }, 50);
}

function styleFeature(feature, singleSummary, bivariateSummary, selectedCounty, comparisonCounty, mapMode) {
  const county = feature.properties.joinCounty;
  const selected = normalizeCounty(county) === normalizeCounty(selectedCounty);
  const compared = normalizeCounty(county) === normalizeCounty(comparisonCounty);

  const fillColor = mapMode === "bivariate"
    ? getBivariateColor(feature.properties.valueA, feature.properties.valueB, bivariateSummary)
    : getColor(feature.properties.value, singleSummary);

  return {
    fillColor,
    weight: selected ? 4 : compared ? 3 : 1.5,
    opacity: 1,
    color: selected ? "#2b0000" : compared ? "#ef5350" : "#ffffff",
    fillOpacity: selected ? 0.96 : compared ? 0.9 : 0.82
  };
}

function getColor(value, summaryData) {
  if (value === null || value === undefined || Number.isNaN(value)) return "#fde0dd";

  const values = summaryData
    .map(d => d.value)
    .filter(v => v !== null && v !== undefined && !Number.isNaN(v))
    .sort((a, b) => a - b);

  if (!values.length) return "#fde0dd";

  const q1 = d3.quantile(values, 0.2);
  const q2 = d3.quantile(values, 0.4);
  const q3 = d3.quantile(values, 0.6);
  const q4 = d3.quantile(values, 0.8);

  return value > q4 ? "#67000d" :
         value > q3 ? "#a50f15" :
         value > q2 ? "#cb181d" :
         value > q1 ? "#ef3b2c" :
                      "#fcbba1";
}

function classifyThree(value, values) {
  if (value === null || value === undefined || Number.isNaN(value) || !values.length) return 0;

  const q1 = d3.quantile(values, 0.33);
  const q2 = d3.quantile(values, 0.66);

  if (value <= q1) return 0;
  if (value <= q2) return 1;
  return 2;
}

function getBivariateColor(valueA, valueB, bivariateSummary) {
  const valuesA = bivariateSummary
    .map(d => d.valueA)
    .filter(v => v !== null && v !== undefined && !Number.isNaN(v))
    .sort((a, b) => a - b);

  const valuesB = bivariateSummary
    .map(d => d.valueB)
    .filter(v => v !== null && v !== undefined && !Number.isNaN(v))
    .sort((a, b) => a - b);

  if (!valuesA.length || !valuesB.length) return "#fde0dd";

  const cA = classifyThree(valueA, valuesA); // horizontal: low -> high
  const cB = classifyThree(valueB, valuesB); // vertical: low -> high

  // rows are bottom -> top for display logic:
  // low-low = lightest
  // high-high = darkest
  const matrix = [
    ["#fde0dd", "#fcbba1", "#fc9272"],
    ["#fb6a4a", "#ef3b2c", "#cb181d"],
    ["#a50f15", "#8b0000", "#67000d"]
  ];

  return matrix[cB][cA];
}

function onEachFeature(feature, layer, variable, variable2, mapMode) {
  const county = feature.properties.joinCounty;

  const popupHtml = mapMode === "bivariate"
    ? `
      <strong>${county}</strong><br>
      <strong>${labelize(variable)}:</strong> ${formatValue(feature.properties.valueA, variable)}<br>
      <strong>${labelize(variable2)}:</strong> ${formatValue(feature.properties.valueB, variable2)}<br>
      <strong>Time:</strong> ${monthNames[currentMonth]} ${currentYear}
    `
    : `
      <strong>${county}</strong><br>
      <strong>${labelize(variable)}:</strong> ${formatValue(feature.properties.value, variable)}<br>
      <strong>Records:</strong> ${feature.properties.count || 0}<br>
      <strong>Time:</strong> ${monthNames[currentMonth]} ${currentYear}
    `;

  layer.bindPopup(popupHtml);

  layer.on({
    mouseover: event => {
      highlightMap(county);
      highlightBar(county);
      showTooltip(event.originalEvent, popupHtml);
    },
    mousemove: event => {
      moveTooltip(event.originalEvent);
    },
    mouseout: () => {
      resetMap();
      resetBarHighlight();
      hideTooltip();
    },
    click: () => {
      selectCounty(county);
    }
  });
}

function highlightMap(countyName) {
  if (!geoLayer) return;

  geoLayer.eachLayer(layer => {
    const county = normalizeCounty(layer.feature.properties.joinCounty);
    const isMatch = county === normalizeCounty(countyName);

    layer.setStyle({
      weight: isMatch ? 4 : 1.5,
      color: isMatch ? "#1f0000" : "#ffffff",
      fillOpacity: isMatch ? 0.98 : 0.45
    });

    if (isMatch) layer.bringToFront();
  });
}

function resetMap() {
  if (!geoLayer) return;
  geoLayer.eachLayer(layer => geoLayer.resetStyle(layer));
}

function updateLegend(singleSummary, bivariateSummary, variable, variable2, mapMode) {
  if (legend) {
    legend.remove();
  }

  legend = L.control({
    position: mapMode === "bivariate" ? "bottomleft" : "bottomright"
  });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");

    if (mapMode === "bivariate") {
      if (!bivariateSummary.length) {
        div.innerHTML = `<strong>${labelize(variable)} × ${labelize(variable2)}</strong><br>No data for selection`;
        return div;
      }

      div.style.fontSize = "11px";
      div.style.padding = "6px 8px";
      div.style.lineHeight = "1.25";

      div.innerHTML = `
        <strong>Bivariate Map</strong><br>
        <div style="margin-bottom:4px;">${labelize(variable)} × ${labelize(variable2)}</div>

        <div style="display:flex; align-items:flex-start; gap:6px;">
          <div style="display:flex; flex-direction:column; justify-content:space-between; height:54px; font-size:10px;">
            <span>High</span>
            <span>Low</span>
          </div>

          <div>
            <table style="border-collapse:collapse; margin:0;">
              <tr>
                <td style="width:16px;height:16px;background:#a50f15;"></td>
                <td style="width:16px;height:16px;background:#8b0000;"></td>
                <td style="width:16px;height:16px;background:#67000d;"></td>
              </tr>
              <tr>
                <td style="width:16px;height:16px;background:#fb6a4a;"></td>
                <td style="width:16px;height:16px;background:#ef3b2c;"></td>
                <td style="width:16px;height:16px;background:#cb181d;"></td>
              </tr>
              <tr>
                <td style="width:16px;height:16px;background:#fde0dd;"></td>
                <td style="width:16px;height:16px;background:#fcbba1;"></td>
                <td style="width:16px;height:16px;background:#fc9272;"></td>
              </tr>
            </table>

            <div style="display:flex; justify-content:space-between; margin-top:3px; font-size:10px;">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>

        <div style="margin-top:5px; font-size:10px;">
          Horizontal: ${labelize(variable)} low → high<br>
          Vertical: ${labelize(variable2)} low → high
        </div>
      `;
      return div;
    }

    if (!singleSummary.length) {
      div.innerHTML = `<strong>${labelize(variable)}</strong><br>No data for selection`;
      return div;
    }

    const values = singleSummary
      .map(d => d.value)
      .filter(v => v !== null && v !== undefined && !Number.isNaN(v))
      .sort((a, b) => a - b);

    const breaks = [
      d3.min(values),
      d3.quantile(values, 0.2),
      d3.quantile(values, 0.4),
      d3.quantile(values, 0.6),
      d3.quantile(values, 0.8)
    ];

    div.innerHTML = `<strong>${labelize(variable)}</strong><br>`;

    for (let i = 0; i < breaks.length; i++) {
      const from = breaks[i];
      const to = breaks[i + 1];

      if (from === undefined || from === null || Number.isNaN(from)) continue;

      div.innerHTML += `
        <div>
          <i style="
            display:inline-block;
            width:14px;
            height:14px;
            margin-right:6px;
            background:${getColor(from + 0.00001, singleSummary)};
          "></i>
          ${formatValue(from, variable)}${to !== undefined ? ` &ndash; ${formatValue(to, variable)}` : "+"}
        </div>
      `;
    }

    return div;
  };

  legend.addTo(map);
}