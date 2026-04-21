/* GISC 230 - Live USGS Streamflow Map
   js/main.js
*/

let map;
let infoWindow;
let markers = [];
let allStations = [];

// USGS stream gage stations across Bay Area + nearby watersheds
const siteIds = [
  // --- Marin / Sonoma / North Bay ---
  "11460000", // Russian River near Guerneville (Sonoma)
  "11464000", // Russian River near Healdsburg (Sonoma)
  "11458000", // Napa River near Napa (Napa)
  "11459500", // Sonoma Creek at Agua Caliente (Sonoma)
  "11465350", // Lagunitas Creek near Point Reyes (Marin)

  // --- Solano / Napa fringe ---
  "11455000", // Putah Creek near Winters (Solano/Napa watershed)

  // --- Contra Costa / Alameda ---
  "11179000", // Alameda Creek near Niles (Alameda)
  "11180700", // San Lorenzo Creek at Hayward (Alameda)
  "11337080", // Walnut Creek at Concord (Contra Costa)
  "11335000", // San Ramon Creek at San Ramon (Contra Costa)

  // --- Santa Clara (South Bay) ---
  "11169025", // Guadalupe River above Hwy 101 (San Jose)
  "11166575", // Coyote Creek near Edenvale (Santa Clara)
  "11172175", // Stevens Creek near Cupertino (Santa Clara)

  // --- San Mateo / SF Peninsula ---
  "11162500", // San Francisquito Creek at Stanford (San Mateo)
  "11162765", // Pilarcitos Creek at Half Moon Bay (San Mateo)

  // --- Santa Cruz / Monterey Bay ---
  "11160000", // San Lorenzo River at Santa Cruz (Santa Cruz)
  "11159000", // Soquel Creek at Soquel (Santa Cruz)
  "11152500", // Salinas River near Spreckels (Monterey)
  "11151700"  // Pajaro River at Chittenden (Monterey/Santa Cruz)
];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.65, lng: -122.1 },
    zoom: 8,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true
  });

  infoWindow = new google.maps.InfoWindow();

  document.getElementById("show-all").addEventListener("click", () => {
    renderMarkers(allStations);
    updateDashboard(allStations);
    document.getElementById("station-name").textContent = "All Stations Displayed";
    document.getElementById("station-details").textContent =
      "Showing all live USGS streamflow stations in the project area.";
  });

  document.getElementById("high-flow").addEventListener("click", () => {
    const filtered = allStations.filter(station => station.flow > 500);
    renderMarkers(filtered);
    updateDashboard(filtered);
    document.getElementById("station-name").textContent = "High Flow Filter Active";
    document.getElementById("station-details").textContent =
      "Displaying only stations with live flow greater than 500 cfs.";
  });

  document.getElementById("refresh-data").addEventListener("click", loadUSGSData);

  loadUSGSData();
}

async function loadUSGSData() {
  const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteIds.join(",")}&parameterCd=00060&siteStatus=all`;

  try {
    document.getElementById("last-update").textContent = "Loading live data...";

    const response = await fetch(url);
    const data = await response.json();

    const timeSeries = data.value.timeSeries || [];

    allStations = timeSeries.map(series => {
      const source = series.sourceInfo;
      const valuesArray = series.values?.[0]?.value || [];
      const latest = valuesArray[valuesArray.length - 1];

      return {
        id: source.siteCode[0].value,
        name: source.siteName,
        lat: source.geoLocation.geogLocation.latitude,
        lng: source.geoLocation.geogLocation.longitude,
        flow: latest && latest.value ? Number(latest.value) : 0,
        time: latest ? latest.dateTime : "No timestamp available",
        approval: latest && latest.qualifiers ? latest.qualifiers.join(", ") : "Unknown"
      };
    }).filter(station => !Number.isNaN(station.flow));

    renderMarkers(allStations);
    updateDashboard(allStations);

    const now = new Date();
    document.getElementById("last-update").textContent = now.toLocaleString();

    if (allStations.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      allStations.forEach(station => bounds.extend({ lat: station.lat, lng: station.lng }));
      map.fitBounds(bounds);
    }
  } catch (error) {
    console.error("Error loading USGS data:", error);
    document.getElementById("last-update").textContent = "Failed to load live data";
    document.getElementById("station-name").textContent = "Data Load Error";
    document.getElementById("station-details").textContent =
      "The USGS streamflow service could not be reached. Try refreshing again.";
  }
}

function getMarkerIcon(flow) {
  let fillColor = "#3b82f6";

  if (flow > 500) {
    fillColor = "#ef4444";
  } else if (flow >= 100) {
    fillColor = "#f59e0b";
  }

  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: fillColor,
    fillOpacity: 0.95,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 10
  };
}

function renderMarkers(stations) {
  clearMarkers();

  stations.forEach(station => {
    const marker = new google.maps.Marker({
      position: { lat: station.lat, lng: station.lng },
      map: map,
      title: station.name,
      icon: getMarkerIcon(station.flow)
    });

    marker.addListener("click", () => {
      const infoContent = `
        <div style="max-width:280px;">
          <h3 style="margin:0 0 8px 0;">${station.name}</h3>
          <p style="margin:0 0 6px 0;"><strong>USGS Site ID:</strong> ${station.id}</p>
          <p style="margin:0 0 6px 0;"><strong>Live streamflow:</strong> ${station.flow.toLocaleString()} cfs</p>
          <p style="margin:0 0 6px 0;"><strong>Observation time:</strong> ${station.time}</p>
          <p style="margin:0;"><strong>Data status:</strong> ${station.approval}</p>
        </div>
      `;

      infoWindow.setContent(infoContent);
      infoWindow.open(map, marker);

      document.getElementById("station-name").textContent = station.name;
      document.getElementById("station-details").innerHTML = `
        <strong>USGS Site ID:</strong> ${station.id}<br>
        <strong>Current flow:</strong> ${station.flow.toLocaleString()} cfs<br>
        <strong>Observation time:</strong> ${station.time}<br>
        <strong>Why it matters:</strong> Live discharge can help interpret transport,
        dilution, and potential water-quality or HAB-related conditions.
      `;
    });

    markers.push(marker);
  });
}

function clearMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
}

function updateDashboard(stations) {
  const totalFlow = stations.reduce((sum, station) => sum + station.flow, 0);
  const avgFlow = stations.length ? totalFlow / stations.length : 0;

  document.getElementById("station-count").textContent = stations.length;
  document.getElementById("total-flow").textContent = totalFlow.toLocaleString(undefined, {
    maximumFractionDigits: 1
  });
  document.getElementById("avg-flow").textContent = avgFlow.toLocaleString(undefined, {
    maximumFractionDigits: 1
  });
}

window.initMap = initMap;