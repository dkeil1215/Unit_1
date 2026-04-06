let rawCsv = [];
let geoData = null;
let allYears = [];
let currentYear = null;
let currentSummary = [];

Promise.all([
  d3.csv("data/CDPH_Paralytic_Shellfish_Poisoning_2014-2025.csv"),
  d3.json("data/Bay_Area_Counties.geojson")
]).then(([csvData, geojson]) => {
  rawCsv = cleanCsv(csvData);
  geoData = geojson;

  allYears = [...new Set(rawCsv.map(d => d.year))].sort((a, b) => a - b);

  buildYearDropdown(allYears);

  currentYear = allYears[0];
  updateDashboard(currentYear);
}).catch(error => {
  console.error("Error loading data:", error);
});

function cleanCsv(data) {
  return data
    .map(d => {
      const parsedDate = new Date(d["Date -Sampled-"]);
      const psp = parseFloat(d["PSP -ug/100 g-"]);

      return {
        id: d["SRL #"],
        date: parsedDate,
        year: parsedDate.getFullYear(),
        county: normalizeCounty(d["County"]),
        sampleSite: d["Sample Site"],
        species: d["Species"],
        sampleType: d["Sample Type"],
        psp: isNaN(psp) ? null : psp,
        lat: +d["Latitude"],
        lon: +d["Longitude"]
      };
    })
    .filter(d =>
      d.county &&
      d.year &&
      d.psp !== null
    );
}

function normalizeCounty(name) {
  if (!name) return null;
  return name.trim().replace(/\s+County$/i, "");
}

function buildYearDropdown(years) {
  const select = d3.select("#yearSelect");

  select.selectAll("option")
    .data(years)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  select.on("change", function () {
    currentYear = +this.value;
    updateDashboard(currentYear);
  });
}

function summarizeByCounty(data, year) {
  const filtered = data.filter(d => d.year === year);

  const grouped = d3.rollups(
    filtered,
    values => ({
      county: values[0].county,
      avgPSP: d3.mean(values, d => d.psp),
      maxPSP: d3.max(values, d => d.psp),
      samples: values.length
    }),
    d => d.county
  );

  return grouped
    .map(([county, stats]) => ({
      county,
      avgPSP: +stats.avgPSP.toFixed(2),
      maxPSP: +stats.maxPSP.toFixed(2),
      samples: stats.samples
    }))
    .sort((a, b) => b.avgPSP - a.avgPSP);
}

function updateDashboard(year) {
  currentSummary = summarizeByCounty(rawCsv, year);

  joinDataToGeoJSON(geoData, currentSummary);
  updateMap(geoData, currentSummary, year);
  updateChart(currentSummary, year);
}

function joinDataToGeoJSON(geojson, summary) {
  const summaryLookup = new Map(summary.map(d => [normalizeCounty(d.county), d]));

  geojson.features.forEach(feature => {
    const countyName = getCountyName(feature);
    const match = summaryLookup.get(normalizeCounty(countyName));

    feature.properties.avgPSP = match ? match.avgPSP : 0;
    feature.properties.maxPSP = match ? match.maxPSP : 0;
    feature.properties.samples = match ? match.samples : 0;
    feature.properties.joinCounty = countyName;
  });
}

function getCountyName(feature) {
  const p = feature.properties;
  return (
    p.NAME ||
    p.Name ||
    p.name ||
    p.COUNTY ||
    p.County ||
    p.county ||
    p.ADMIN ||
    "Unknown"
  );
}