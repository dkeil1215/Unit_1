let map;
let geoLayer;
let legend;

function updateMap(geoData, summaryData, year) {
  if (!map) {
    map = L.map("map").setView([37.75, -122.2], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
  }

  if (geoLayer) {
    geoLayer.remove();
  }

  geoLayer = L.geoJSON(geoData, {
    style: styleFeature,
    onEachFeature: onEachFeature
  }).addTo(map);

  map.fitBounds(geoLayer.getBounds());

  updateLegend();
}

function styleFeature(feature) {
  const value = feature.properties.avgPSP || 0;

  return {
    fillColor: getColor(value),
    weight: 1.5,
    opacity: 1,
    color: "#ffffff",
    fillOpacity: 0.8
  };
}

function getColor(value) {
  return value > 150 ? "#67000d" :
         value > 100 ? "#a50f15" :
         value > 75  ? "#cb181d" :
         value > 50  ? "#ef3b2c" :
         value > 25  ? "#fb6a4a" :
         value > 0   ? "#fcae91" :
                       "#fef0d9";
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: (event) => {
      const county = feature.properties.joinCounty;
      highlightMap(county);
      highlightChart(county);

      showTooltip(event.originalEvent, `
        <strong>${county}</strong><br>
        Avg PSP: ${feature.properties.avgPSP || 0}<br>
        Max PSP: ${feature.properties.maxPSP || 0}<br>
        Samples: ${feature.properties.samples || 0}
      `);
    },
    mousemove: (event) => {
      moveTooltip(event.originalEvent);
    },
    mouseout: () => {
      resetMap();
      resetChart();
      hideTooltip();
    }
  });
}

function highlightMap(countyName) {
  geoLayer.eachLayer(layer => {
    const county = normalizeCounty(layer.feature.properties.joinCounty);
    const match = normalizeCounty(countyName);

    const isMatch = county === match;

    layer.setStyle({
      weight: isMatch ? 3 : 1,
      color: isMatch ? "#111" : "#ffffff",
      fillOpacity: isMatch ? 0.95 : 0.35
    });

    if (isMatch) {
      layer.bringToFront();
    }
  });
}

function resetMap() {
  geoLayer.eachLayer(layer => {
    geoLayer.resetStyle(layer);
  });
}

function updateLegend() {
  if (legend) {
    legend.remove();
  }

  legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");
    const grades = [0, 25, 50, 75, 100, 150];

    div.innerHTML += "<strong>Avg PSP</strong><br>";

    for (let i = 0; i < grades.length; i++) {
      const from = grades[i];
      const to = grades[i + 1];

      div.innerHTML +=
        `<i style="
          display:inline-block;
          width:14px;
          height:14px;
          background:${getColor(from + 1)};
          margin-right:6px;
        "></i>
        ${from}${to ? "&ndash;" + to : "+"}<br>`;
    }

    return div;
  };

  legend.addTo(map);
}