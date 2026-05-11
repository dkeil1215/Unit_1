let barSvg, barXScale, barYScale, barXAxisGroup, barYAxisGroup;
let lineSvg, lineXScale, lineYScale, lineXAxisGroup, lineYAxisGroup;

const barMargin = { top: 36, right: 20, bottom: 120, left: 84 };
const lineMargin = { top: 36, right: 28, bottom: 140, left: 84 };

function updateBarChart(data, variable, year, month, selectedCounty, comparisonCounty = null) {
  if (!barSvg) initializeBarChart();

  const container = document.getElementById("barChart");
  const width = Math.max(container.clientWidth || 700, 320);
  const height = Math.max(container.clientHeight || 500, 320);
  const innerWidth = width - barMargin.left - barMargin.right;
  const innerHeight = height - barMargin.top - barMargin.bottom;

  barSvg.attr("width", width).attr("height", height);
  barXScale.range([barMargin.left, barMargin.left + innerWidth]);
  barYScale.range([barMargin.top + innerHeight, barMargin.top]);

  barSvg.selectAll(".bar-title").remove();
  barSvg.selectAll(".no-data-text").remove();

  if (!Array.isArray(data) || !data.length) {
    barSvg.selectAll(".bar").remove();

    barSvg.append("text")
      .attr("class", "bar-title")
      .attr("x", barMargin.left)
      .attr("y", 20)
      .style("font-size", "14px")
      .style("font-weight", "700")
      .text(`${labelize(variable)} by County`);

    barSvg.append("text")
      .attr("class", "no-data-text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .style("fill", "#6e5855")
      .text("No data available for this selection.");

    return;
  }

  barXScale.domain(data.map(d => d.county));
  barYScale.domain([0, d3.max(data, d => d.value) || 1]).nice();

  barXAxisGroup
    .attr("transform", `translate(0, ${barMargin.top + innerHeight})`)
    .call(d3.axisBottom(barXScale))
    .selectAll("text")
    .attr("transform", "rotate(-38)")
    .style("text-anchor", "end");

  barYAxisGroup
    .attr("transform", `translate(${barMargin.left}, 0)`)
    .call(d3.axisLeft(barYScale));

  barSvg.append("text")
    .attr("class", "bar-title")
    .attr("x", barMargin.left)
    .attr("y", 20)
    .style("font-size", "14px")
    .style("font-weight", "700")
    .text(`${labelize(variable)} by County (${monthNames[month]} ${year})`);

  const bars = barSvg.selectAll(".bar")
    .data(data, d => d.county);

  bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => barXScale(d.county))
    .attr("y", barYScale(0))
    .attr("width", barXScale.bandwidth())
    .attr("height", 0)
    .on("mouseover", function(event, d) {
      highlightBar(d.county);

      if (typeof highlightMap === "function") {
        highlightMap(d.county);
      }

      if (typeof showTooltip === "function") {
        showTooltip(event, `
          <strong>${d.county}</strong><br>
          <strong>${labelize(variable)}:</strong> ${formatValue(d.value, variable)}<br>
          <strong>Records:</strong> ${d.count ?? "--"}
        `);
      }
    })
    .on("mousemove", function(event) {
      if (typeof moveTooltip === "function") {
        moveTooltip(event);
      }
    })
    .on("mouseout", function() {
      resetBarHighlight();

      if (typeof resetMap === "function") {
        resetMap();
      }

      if (typeof hideTooltip === "function") {
        hideTooltip();
      }
    })
    .on("click", function(event, d) {
      if (typeof selectCounty === "function") {
        selectCounty(d.county);
      }
    })
    .merge(bars)
    .transition()
    .duration(650)
    .attr("x", d => barXScale(d.county))
    .attr("y", d => barYScale(d.value))
    .attr("width", barXScale.bandwidth())
    .attr("height", d => innerHeight - (barYScale(d.value) - barMargin.top))
    .attr("fill", d => {
      const county = normalizeCounty(d.county);

      if (county === normalizeCounty(selectedCounty)) return "#7f0000";
      if (county === normalizeCounty(comparisonCounty)) return "#d65a5a";

      return "#c62828";
    });

  bars.exit().remove();
}

function initializeBarChart() {
  const width = Math.max(document.getElementById("barChart").clientWidth || 700, 320);
  const height = Math.max(document.getElementById("barChart").clientHeight || 500, 320);

  barSvg = d3.select("#barChart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  barXScale = d3.scaleBand().padding(0.15);
  barYScale = d3.scaleLinear();

  barXAxisGroup = barSvg.append("g").attr("class", "axis");
  barYAxisGroup = barSvg.append("g").attr("class", "axis");

  barSvg.append("text")
    .attr("class", "y-axis-label")
    .attr("x", 18)
    .attr("y", height / 2)
    .attr("transform", `rotate(-90, 18, ${height / 2})`)
    .style("font-size", "12px")
    .style("fill", "#6e5855")
    .text("Value");
}

function highlightBar(countyName) {
  if (!barSvg) return;

  barSvg.selectAll(".bar")
    .classed("dimmed", d => normalizeCounty(d.county) !== normalizeCounty(countyName))
    .classed("highlighted", d => normalizeCounty(d.county) === normalizeCounty(countyName));
}

function resetBarHighlight() {
  if (!barSvg) return;

  barSvg.selectAll(".bar")
    .classed("dimmed", false)
    .classed("highlighted", false);
}

function updateLineChart(config) {
  if (!lineSvg) initializeLineChart();

  const container = document.getElementById("lineChart");
  const width = Math.max(container.clientWidth || 900, 320);
  const height = Math.max(container.clientHeight || 500, 320);
  const innerWidth = width - lineMargin.left - lineMargin.right;
  const innerHeight = height - lineMargin.top - lineMargin.bottom;

  lineSvg.attr("width", width).attr("height", height);
  lineXScale.range([lineMargin.left, lineMargin.left + innerWidth]);
  lineYScale.range([lineMargin.top + innerHeight, lineMargin.top]);

  lineSvg.selectAll(".line-title").remove();
  lineSvg.selectAll(".legend-group").remove();
  lineSvg.selectAll(".no-data-text").remove();
  lineSvg.selectAll(".series-path").remove();
  lineSvg.selectAll(".series-point").remove();

  const {
    mode,
    variable1,
    variable2,
    countyName,
    comparisonCountyName,
    primarySeries,
    comparisonPrimarySeries,
    secondarySeries,
    comparisonSecondarySeries
  } = config || {};

  const primary = Array.isArray(primarySeries) ? primarySeries : [];
  const comparison = Array.isArray(comparisonPrimarySeries) ? comparisonPrimarySeries : [];
  const secondary = Array.isArray(secondarySeries) ? secondarySeries : [];
  const secondaryComparison = Array.isArray(comparisonSecondarySeries) ? comparisonSecondarySeries : [];

  const combined = [...primary, ...comparison, ...secondary, ...secondaryComparison].filter(d =>
    d &&
    d.date instanceof Date &&
    !Number.isNaN(d.date.getTime()) &&
    d.value !== null &&
    d.value !== undefined &&
    !Number.isNaN(d.value)
  );

  if (!combined.length) {
    lineSvg.append("text")
      .attr("class", "line-title")
      .attr("x", lineMargin.left)
      .attr("y", 20)
      .style("font-size", "14px")
      .style("font-weight", "700")
      .text("County Trend Through Time");

    lineSvg.append("text")
      .attr("class", "no-data-text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .style("fill", "#6e5855")
      .text("No county time-series data available.");

    return;
  }

  lineXScale.domain(d3.extent(combined, d => d.date));
  lineYScale.domain([0, d3.max(combined, d => d.value) || 1]).nice();

  const isMobile = window.innerWidth <= 640;
  const tickCount = isMobile ? 4 : 8;

  lineXAxisGroup
    .attr("transform", `translate(0, ${lineMargin.top + innerHeight})`)
    .call(
      d3.axisBottom(lineXScale)
        .ticks(tickCount)
        .tickFormat(d3.timeFormat("%Y-%m"))
    )
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  lineYAxisGroup
    .attr("transform", `translate(${lineMargin.left}, 0)`)
    .call(d3.axisLeft(lineYScale));

  lineSvg.append("text")
    .attr("class", "line-title")
    .attr("x", lineMargin.left)
    .attr("y", 20)
    .style("font-size", "14px")
    .style("font-weight", "700")
    .text(
      mode === "bivariate"
        ? `${labelize(variable1)} and ${labelize(variable2)} Through Time`
        : `${labelize(variable1)} Through Time`
    );

  const lineGenerator = d3.line()
    .defined(d => d.value !== null && d.value !== undefined && !Number.isNaN(d.value))
    .x(d => lineXScale(d.date))
    .y(d => lineYScale(d.value));

  drawSeries(
    primary,
    countyName || "Selected County",
    "#7f0000",
    "#7f0000",
    variable1,
    lineGenerator,
    false
  );

  if (comparison.length) {
    drawSeries(
      comparison,
      comparisonCountyName || "Comparison County",
      "#d65a5a",
      "#d65a5a",
      variable1,
      lineGenerator,
      true
    );
  }

  if (mode === "bivariate") {
    drawSeries(
      secondary,
      `${countyName || "Selected County"} (${labelize(variable2)})`,
      "#fb03da",
      "#fb03da",
      variable2,
      lineGenerator,
      true
    );

    if (secondaryComparison.length) {
      drawSeries(
        secondaryComparison,
        `${comparisonCountyName || "Comparison County"} (${labelize(variable2)})`,
        "#fb0000",
        "#fb0000",
        variable2,
        lineGenerator,
        true
      );
    }
  }

  drawLineLegend(
    width,
    height,
    countyName,
    comparisonCountyName,
    comparison.length > 0,
    mode,
    variable2
  );
}

function drawSeries(seriesData, seriesName, strokeColor, pointColor, variable, lineGenerator, dashed = false) {
  if (!seriesData || !seriesData.length) return;

  lineSvg.append("path")
    .datum(seriesData)
    .attr("class", "series-path")
    .attr("fill", "none")
    .attr("stroke", strokeColor)
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", dashed ? "6 4" : null)
    .attr("d", lineGenerator);

  lineSvg.selectAll(`.series-point-${cssSafe(seriesName)}`)
    .data(seriesData)
    .enter()
    .append("circle")
    .attr("class", "series-point")
    .attr("cx", d => lineXScale(d.date))
    .attr("cy", d => lineYScale(d.value))
    .attr("r", 4)
    .attr("fill", pointColor)
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 1.2)
    .on("mouseover", function(event, d) {
      if (typeof showTooltip === "function") {
        showTooltip(event, `
          <strong>${seriesName}</strong><br>
          ${monthNames[d.month]} ${d.year}<br>
          <strong>${labelize(variable)}:</strong> ${formatValue(d.value, variable)}
        `);
      }
    })
    .on("mousemove", function(event) {
      if (typeof moveTooltip === "function") {
        moveTooltip(event);
      }
    })
    .on("mouseout", function() {
      if (typeof hideTooltip === "function") {
        hideTooltip();
      }
    });
}

function drawLineLegend(width, height, primaryCounty, comparisonCountyName, hasComparison, mode, variable2) {
  const legendY = height - 34;
  const legendX = lineMargin.left;
  const availableWidth = width - lineMargin.left - lineMargin.right;

  const items = [
    {
      label: primaryCounty || "Selected County",
      color: "#7f0000",
      dashed: false
    }
  ];

  if (hasComparison && comparisonCountyName) {
    items.push({
      label: comparisonCountyName,
      color: "#d65a5a",
      dashed: true
    });
  }

  if (mode === "bivariate") {
    items.push({
      label: `${primaryCounty || "Selected County"} (${labelize(variable2)})`,
      color: "#fb03da",
      dashed: true
    });

    if (hasComparison && comparisonCountyName) {
      items.push({
        label: `${comparisonCountyName} (${labelize(variable2)})`,
        color: "#fb0000",
        dashed: true
      });
    }
  }

  const columns = Math.min(items.length, 4);
  const columnWidth = availableWidth / columns;

  const legend = lineSvg.append("g")
    .attr("class", "legend-group")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  const legendItems = legend.selectAll(".legend-item")
    .data(items)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(${i * columnWidth}, 0)`);

  legendItems.append("line")
    .attr("x1", 0)
    .attr("x2", 24)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", d => d.color)
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", d => d.dashed ? "6 4" : null);

  legendItems.append("text")
    .attr("x", 32)
    .attr("y", 4)
    .style("font-size", "12px")
    .style("fill", "#1f1f1f")
    .text(d => d.label)
    .each(function () {
      const maxTextWidth = Math.max(columnWidth - 38, 70);
      const text = d3.select(this);
      let label = text.text();

      while (this.getComputedTextLength() > maxTextWidth && label.length > 8) {
        label = label.slice(0, -2);
        text.text(`${label}…`);
      }
    });
}

function initializeLineChart() {
  const width = Math.max(document.getElementById("lineChart").clientWidth || 900, 320);
  const height = Math.max(document.getElementById("lineChart").clientHeight || 500, 320);

  lineSvg = d3.select("#lineChart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  lineXScale = d3.scaleTime();
  lineYScale = d3.scaleLinear();

  lineXAxisGroup = lineSvg.append("g").attr("class", "axis");
  lineYAxisGroup = lineSvg.append("g").attr("class", "axis");

  lineSvg.append("text")
    .attr("class", "y-axis-label")
    .attr("x", 18)
    .attr("y", height / 2)
    .attr("transform", `rotate(-90, 18, ${height / 2})`)
    .style("font-size", "12px")
    .style("fill", "#6e5855")
    .text("Value");
}

function cssSafe(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "_");
}

window.addEventListener("resize", () => {
  d3.select("#barChart").selectAll("*").remove();
  d3.select("#lineChart").selectAll("*").remove();

  barSvg = null;
  lineSvg = null;

  initializeBarChart();
  initializeLineChart();

  if (
    typeof updateBarChart === "function" &&
    typeof currentSummary !== "undefined" &&
    typeof currentVariable !== "undefined" &&
    typeof currentYear !== "undefined" &&
    typeof currentMonth !== "undefined"
  ) {
    updateBarChart(
      currentSummary,
      currentVariable,
      currentYear,
      currentMonth,
      currentCounty,
      comparisonCounty
    );
  }

  if (
    typeof updateLineChart === "function" &&
    typeof currentMapMode !== "undefined" &&
    typeof currentVariable !== "undefined"
  ) {
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
  }
});