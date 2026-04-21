let rawData = [];
let geoData = null;

let currentVariable = null;
let currentVariable2 = null;
let currentYear = null;
let currentMonth = null;
let currentCounty = null;
let comparisonCounty = null;
let currentMapMode = "single";

let currentSummary = [];
let currentBivariateSummary = [];

let timeSeriesPrimary = [];
let timeSeriesPrimaryComparison = [];
let timeSeriesSecondary = [];
let timeSeriesSecondaryComparison = [];

let numericColumns = [];
let availableYears = [];
let availableMonthsByYear = new Map();

const monthNames = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December"
};

Promise.all([
  d3.csv("data/Master_Dataset_LandUse_Physical_MHW.csv"),
  d3.json("data/Bay_Area_Counties.geojson")
]).then(([csvData, geojson]) => {
  numericColumns = detectNumericColumns(csvData);
  rawData = cleanCsv(csvData, numericColumns);
  geoData = geojson;

  buildAvailableTimeLookups(rawData);

  currentVariable = numericColumns.includes("chlorophyll")
    ? "chlorophyll"
    : numericColumns[0];

  currentVariable2 = numericColumns.includes("total_population_density_km2")
    ? "total_population_density_km2"
    : numericColumns.find(v => v !== currentVariable) || currentVariable;

  currentYear = availableYears[0];
  currentMonth = (availableMonthsByYear.get(currentYear) || [1])[0];

  buildVariableDropdown(numericColumns);
  buildSecondaryVariableDropdown(numericColumns);
  buildYearDropdown(availableYears);
  buildMonthDropdown(currentYear);
  buildMapModeDropdown();

  d3.select("#variableSelect").property("value", currentVariable);
  d3.select("#variableSelect2").property("value", currentVariable2);
  d3.select("#yearSelect").property("value", currentYear);
  d3.select("#monthSelect").property("value", currentMonth);
  d3.select("#mapModeSelect").property("value", currentMapMode);

  updateDashboard();
}).catch(error => {
  console.error("Error loading data:", error);
});

function detectNumericColumns(data) {
  if (!data.length) return [];

  const excluded = new Set(["county", "date", "year", "month"]);

  return Object.keys(data[0]).filter(col => {
    if (excluded.has(col)) return false;

    const values = data
      .map(d => d[col])
      .filter(v => v !== undefined && v !== null && String(v).trim() !== "");

    if (!values.length) return false;

    const numericCount = values.filter(v => !Number.isNaN(+v)).length;
    return numericCount / values.length > 0.8;
  });
}

function cleanCsv(data, variableColumns) {
  return data
    .map(d => {
      const dateCandidate = d.date ? new Date(d.date) : new Date(+d.year, (+d.month || 1) - 1, 1);

      const row = {
        county: normalizeCounty(d.county),
        year: +d.year,
        month: +d.month,
        date: dateCandidate
      };

      variableColumns.forEach(col => {
        const value = +d[col];
        row[col] = Number.isFinite(value) ? value : null;
      });

      return row;
    })
    .filter(d =>
      d.county &&
      Number.isFinite(d.year) &&
      Number.isFinite(d.month) &&
      d.month >= 1 &&
      d.month <= 12 &&
      d.date instanceof Date &&
      !Number.isNaN(d.date.getTime())
    );
}

function buildAvailableTimeLookups(data) {
  availableYears = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);

  availableMonthsByYear = new Map();

  availableYears.forEach(year => {
    const months = [...new Set(
      data.filter(d => d.year === year).map(d => d.month)
    )].sort((a, b) => a - b);

    availableMonthsByYear.set(year, months);
  });
}

function normalizeCounty(name) {
  if (!name) return null;
  return String(name).trim().replace(/\s+County$/i, "");
}

function labelize(fieldName) {
  const manual = {
    chlorophyll: "Chlorophyll",
    rain_mm: "Rainfall (mm)",
    lst_c: "Land Surface Temp (C)",
    sst_c: "Sea Surface Temp (C)",
    marine_heatwave_days: "Marine Heatwave Days",
    Nitrate: "Nitrate",
    Total_Phosphorus: "Total Phosphorus",
    spec_cond: "Specific Conductance",
    streamflow: "Streamflow",
    stream_width: "Stream Width",
    water_temp: "Water Temperature",
    tds: "TDS",
    tss: "TSS",
    turbidity: "Turbidity",
    ph: "pH",
    conductivity: "Conductivity",
    do_mg_l: "Dissolved Oxygen (mg/L)",
    salinity: "Salinity",
    Developed_Total: "Developed Land",
    Agriculture_Total: "Agriculture",
    Forest_Total: "Forest",
    Shrub_Grass_Total: "Shrub / Grass",
    Wetlands_Total: "Wetlands",
    OpenWater: "Open Water",
    county_population: "County Population",
    total_valid_area_km2: "Valid Area (km2)",
    urban_area_km2: "Urban Area (km2)",
    urban_pct: "Urban Percent",
    non_urban_area_km2: "Non-Urban Area (km2)",
    non_urban_pct: "Non-Urban Percent",
    roads_area_km2: "Road Area (km2)",
    roads_pct: "Road Percent",
    urban_population_density_km2: "Urban Pop Density",
    non_urban_population_density_km2: "Non-Urban Pop Density",
    total_population_density_km2: "Total Pop Density"
  };

  return manual[fieldName] || String(fieldName).replace(/_/g, " ");
}

function decimalPlacesForVariable(variable) {
  const integerVars = ["county_population", "marine_heatwave_days"];
  return integerVars.includes(variable) ? 0 : 2;
}

function buildMapModeDropdown() {
  d3.select("#mapModeSelect").on("change", function () {
    currentMapMode = this.value;

    d3.select("#secondaryVariableGroup")
      .style("display", currentMapMode === "bivariate" ? "flex" : "none");

    updateDashboard();
  });
}

function buildVariableDropdown(columns) {
  const select = d3.select("#variableSelect");

  select.selectAll("option")
    .data(columns)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => labelize(d));

  select.on("change", function () {
    currentVariable = this.value;

    if (currentVariable2 === currentVariable) {
      currentVariable2 = numericColumns.find(v => v !== currentVariable) || currentVariable;
      d3.select("#variableSelect2").property("value", currentVariable2);
    }

    updateDashboard();
  });
}

function buildSecondaryVariableDropdown(columns) {
  const select = d3.select("#variableSelect2");

  select.selectAll("option")
    .data(columns)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => labelize(d));

  select.on("change", function () {
    currentVariable2 = this.value;
    updateDashboard();
  });
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

    const validMonths = availableMonthsByYear.get(currentYear) || [];
    if (!validMonths.includes(currentMonth)) {
      currentMonth = validMonths[0];
    }

    buildMonthDropdown(currentYear);
    d3.select("#monthSelect").property("value", currentMonth);

    updateDashboard();
  });
}

function buildMonthDropdown(year) {
  const months = availableMonthsByYear.get(year) || [];
  const select = d3.select("#monthSelect");

  select.selectAll("option").remove();

  select.selectAll("option")
    .data(months)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => monthNames[d] || d);

  select.on("change", function () {
    currentMonth = +this.value;
    updateDashboard();
  });
}

function buildCountyCompareDropdown(counties) {
  const select = d3.select("#countyCompareSelect");
  const options = ["None", ...counties];

  select.selectAll("option").remove();

  select.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  select.property("value", comparisonCounty || "None");

  select.on("change", function () {
    comparisonCounty = this.value === "None" ? null : this.value;
    updateDashboard();
  });
}

function summarizeByCounty(data, variable, year, month) {
  const filtered = data.filter(d =>
    d.year === year &&
    d.month === month &&
    d[variable] !== null &&
    !Number.isNaN(d[variable])
  );

  const grouped = d3.rollups(
    filtered,
    values => ({
      county: values[0].county,
      value: d3.mean(values, d => d[variable]),
      count: values.length
    }),
    d => d.county
  );

  return grouped
    .map(([county, stats]) => ({
      county,
      value: stats.value,
      count: stats.count
    }))
    .sort((a, b) => b.value - a.value);
}

function summarizeBivariateByCounty(data, variableA, variableB, year, month) {
  const filtered = data.filter(d =>
    d.year === year &&
    d.month === month &&
    d[variableA] !== null &&
    d[variableB] !== null &&
    !Number.isNaN(d[variableA]) &&
    !Number.isNaN(d[variableB])
  );

  const grouped = d3.rollups(
    filtered,
    values => ({
      county: values[0].county,
      valueA: d3.mean(values, d => d[variableA]),
      valueB: d3.mean(values, d => d[variableB]),
      count: values.length
    }),
    d => d.county
  );

  return grouped
    .map(([county, stats]) => ({
      county,
      valueA: stats.valueA,
      valueB: stats.valueB,
      count: stats.count
    }))
    .sort((a, b) => b.valueA - a.valueA);
}

function buildCountyTimeSeries(data, county, variable) {
  if (!county || !variable) return [];

  return data
    .filter(d =>
      normalizeCounty(d.county) === normalizeCounty(county) &&
      d[variable] !== null &&
      !Number.isNaN(d[variable]) &&
      d.date instanceof Date &&
      !Number.isNaN(d.date.getTime())
    )
    .sort((a, b) => a.date - b.date)
    .map(d => ({
      county: d.county,
      date: d.date,
      year: d.year,
      month: d.month,
      value: d[variable]
    }));
}

function joinDataToGeoJSON(geojson, singleSummary, bivariateSummary) {
  const singleLookup = new Map(singleSummary.map(d => [normalizeCounty(d.county), d]));
  const biLookup = new Map(bivariateSummary.map(d => [normalizeCounty(d.county), d]));

  geojson.features.forEach(feature => {
    const countyName = getCountyName(feature);
    const key = normalizeCounty(countyName);

    const singleMatch = singleLookup.get(key);
    const biMatch = biLookup.get(key);

    feature.properties.joinCounty = countyName;
    feature.properties.value = singleMatch ? singleMatch.value : null;
    feature.properties.count = singleMatch ? singleMatch.count : 0;
    feature.properties.valueA = biMatch ? biMatch.valueA : null;
    feature.properties.valueB = biMatch ? biMatch.valueB : null;
    feature.properties.biCount = biMatch ? biMatch.count : 0;
  });
}

function getCountyName(feature) {
  const p = feature.properties || {};
  return p.NAME || p.Name || p.name || p.COUNTY || p.County || p.county || p.ADMIN || "Unknown";
}

function updateDashboard() {
  currentSummary = summarizeByCounty(rawData, currentVariable, currentYear, currentMonth);
  currentBivariateSummary = summarizeBivariateByCounty(rawData, currentVariable, currentVariable2, currentYear, currentMonth);

  const activeSummary = currentMapMode === "bivariate" ? currentBivariateSummary : currentSummary;

  if (!activeSummary.length) {
    currentCounty = null;
    comparisonCounty = null;

    timeSeriesPrimary = [];
    timeSeriesPrimaryComparison = [];
    timeSeriesSecondary = [];
    timeSeriesSecondaryComparison = [];

    if (geoData) {
      joinDataToGeoJSON(geoData, [], []);
      updateMap(geoData, [], [], currentMapMode, currentVariable, currentVariable2, null, null);
    }

    updateBarChart([], currentVariable, currentYear, currentMonth, null, null);
    updateLineChart({
      mode: currentMapMode,
      variable1: currentVariable,
      variable2: currentVariable2,
      countyName: null,
      comparisonCountyName: null,
      primarySeries: [],
      comparisonPrimarySeries: [],
      secondarySeries: [],
      comparisonSecondarySeries: []
    });

    updateSummaryCards();
    return;
  }

  if (!currentCounty) {
    currentCounty = activeSummary[0].county;
  }

  const countyNames = activeSummary.map(d => d.county);

  if (!countyNames.some(d => normalizeCounty(d) === normalizeCounty(currentCounty))) {
    currentCounty = countyNames[0];
  }

  if (comparisonCounty && !countyNames.some(d => normalizeCounty(d) === normalizeCounty(comparisonCounty))) {
    comparisonCounty = null;
  }

  if (comparisonCounty && normalizeCounty(comparisonCounty) === normalizeCounty(currentCounty)) {
    comparisonCounty = null;
  }

  buildCountyCompareDropdown(countyNames);

  timeSeriesPrimary = buildCountyTimeSeries(rawData, currentCounty, currentVariable);
  timeSeriesPrimaryComparison = buildCountyTimeSeries(rawData, comparisonCounty, currentVariable);

  timeSeriesSecondary = currentMapMode === "bivariate"
    ? buildCountyTimeSeries(rawData, currentCounty, currentVariable2)
    : [];

  timeSeriesSecondaryComparison = currentMapMode === "bivariate"
    ? buildCountyTimeSeries(rawData, comparisonCounty, currentVariable2)
    : [];

  joinDataToGeoJSON(geoData, currentSummary, currentBivariateSummary);

  updateMap(
    geoData,
    currentSummary,
    currentBivariateSummary,
    currentMapMode,
    currentVariable,
    currentVariable2,
    currentCounty,
    comparisonCounty
  );

  updateBarChart(
    currentSummary,
    currentVariable,
    currentYear,
    currentMonth,
    currentCounty,
    comparisonCounty
  );

  updateLineChart({
    mode: currentMapMode,
    variable1: currentVariable,
    variable2: currentVariable2,
    countyName: currentCounty,
    comparisonCountyName: comparisonCounty,
    primarySeries: timeSeriesPrimary,
    comparisonPrimarySeries: timeSeriesPrimaryComparison,
    secondarySeries: timeSeriesSecondary,
    comparisonSecondarySeries: timeSeriesSecondaryComparison
  });

  updateSummaryCards();
}

function selectCounty(countyName) {
  currentCounty = countyName;

  if (comparisonCounty && normalizeCounty(comparisonCounty) === normalizeCounty(currentCounty)) {
    comparisonCounty = null;
    d3.select("#countyCompareSelect").property("value", "None");
  }

  updateDashboard();
}

function formatValue(value, variable) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  const decimals = decimalPlacesForVariable(variable);
  return d3.format(`,.${decimals}f`)(value);
}

function updateSummaryCards() {
  const selectedSingle = currentSummary.find(
    d => normalizeCounty(d.county) === normalizeCounty(currentCounty)
  );

  const compareSingle = currentSummary.find(
    d => normalizeCounty(d.county) === normalizeCounty(comparisonCounty)
  );

  const regionalMean = currentSummary.length
    ? d3.mean(currentSummary, d => d.value)
    : null;

  d3.select("#mapModeLabel").text(
    currentMapMode === "bivariate"
      ? `${labelize(currentVariable)} × ${labelize(currentVariable2)}`
      : labelize(currentVariable)
  );

  d3.select("#selectedCountyLabel").text(currentCounty || "--");
  d3.select("#comparisonCountyLabel").text(comparisonCounty || "--");

  d3.select("#selectedValueLabel").text(
    selectedSingle ? formatValue(selectedSingle.value, currentVariable) : "--"
  );

  d3.select("#comparisonValueLabel").text(
    compareSingle ? formatValue(compareSingle.value, currentVariable) : "--"
  );

  d3.select("#regionalMeanLabel").text(
    regionalMean !== null ? formatValue(regionalMean, currentVariable) : "--"
  );
}

function showTooltip(event, html) {
  d3.select("#tooltip")
    .classed("hidden", false)
    .html(html)
    .style("left", `${event.pageX + 12}px`)
    .style("top", `${event.pageY - 28}px`);
}

function moveTooltip(event) {
  d3.select("#tooltip")
    .style("left", `${event.pageX + 12}px`)
    .style("top", `${event.pageY - 28}px`);
}

function hideTooltip() {
  d3.select("#tooltip").classed("hidden", true);
}