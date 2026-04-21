export function addMapControls(map, symbolController, polygonLayer) {
  const controls = L.control({ position: 'topright' });

  controls.onAdd = function () {
    const div = L.DomUtil.create('div', 'map-control-panel');

    div.innerHTML = `
      <h4>Map Controls</h4>

      <label for="attributeSelect"><strong>Map Attribute</strong></label>
      <select id="attributeSelect">
        <option value="Total_Pop_">Total Density</option>
        <option value="Urban_Pop_">Urban Density</option>
        <option value="NonUrban_1">Non-Urban Density</option>
        <option value="CountyPopu">County Population</option>
      </select>

      <label class="control-row">
        <input type="checkbox" id="scaleToggle" checked>
        Use Proportional Scaling
      </label>

      <label class="control-row">
        <input type="checkbox" id="polygonToggle" checked>
        Show County Boundaries
      </label>

      <div class="legend-note">
        <strong>Color Classes</strong><br>
        Green: low<br>
        Orange: medium<br>
        Dark red: high
      </div>
    `;

    L.DomEvent.disableClickPropagation(div);
    return div;
  };

  controls.addTo(map);

  const attributeSelect = document.getElementById('attributeSelect');
  const scaleToggle = document.getElementById('scaleToggle');
  const polygonToggle = document.getElementById('polygonToggle');

  attributeSelect.value = symbolController.getAttribute();

  attributeSelect.addEventListener('change', (e) => {
    symbolController.setAttribute(e.target.value);
  });

  scaleToggle.addEventListener('change', (e) => {
    const mode = e.target.checked ? 'scaled' : 'fixed';
    symbolController.setScalingMode(mode);
  });

  polygonToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      polygonLayer.addTo(map);
    } else {
      map.removeLayer(polygonLayer);
    }
  });
}