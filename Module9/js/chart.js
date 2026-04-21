let svg, xScale, yScale, xAxisGroup, yAxisGroup;
let chartWidth, chartHeight, innerWidth, innerHeight;
const margin = { top: 20, right: 20, bottom: 100, left: 70 };

function updateChart(data, year) {
  if (!svg) {
    initializeChart();
  }

  xScale.domain(data.map(d => d.county));
  yScale.domain([0, d3.max(data, d => d.avgPSP) || 1]).nice();

  xAxisGroup
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  yAxisGroup.call(d3.axisLeft(yScale));

  svg.selectAll(".chart-title").remove();
  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", margin.left)
    .attr("y", 14)
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text(`Average PSP by County (${year})`);

  const bars = svg.selectAll(".bar")
    .data(data, d => d.county);

  bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.county))
    .attr("y", yScale(0))
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .on("mouseover", function(event, d) {
      highlightChart(d.county);
      highlightMap(d.county);

      showTooltip(event, `
        <strong>${d.county}</strong><br>
        Avg PSP: ${d.avgPSP}<br>
        Max PSP: ${d.maxPSP}<br>
        Samples: ${d.samples}
      `);
    })
    .on("mousemove", function(event) {
      moveTooltip(event);
    })
    .on("mouseout", function() {
      resetChart();
      resetMap();
      hideTooltip();
    })
    .merge(bars)
    .transition()
    .duration(700)
    .attr("x", d => xScale(d.county))
    .attr("y", d => yScale(d.avgPSP))
    .attr("width", xScale.bandwidth())
    .attr("height", d => innerHeight - yScale(d.avgPSP));

  bars.exit().remove();
}

function initializeChart() {
  chartWidth = document.getElementById("chart").clientWidth;
  chartHeight = document.getElementById("chart").clientHeight;

  innerWidth = chartWidth - margin.left - margin.right;
  innerHeight = chartHeight - margin.top - margin.bottom;

  svg = d3.select("#chart")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight);

  xScale = d3.scaleBand()
    .range([margin.left, margin.left + innerWidth])
    .padding(0.15);

  yScale = d3.scaleLinear()
    .range([margin.top + innerHeight, margin.top]);

  xAxisGroup = svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${margin.top + innerHeight})`);

  yAxisGroup = svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left}, 0)`);

  svg.append("text")
    .attr("x", 18)
    .attr("y", margin.top + innerHeight / 2)
    .attr("transform", `rotate(-90, 18, ${margin.top + innerHeight / 2})`)
    .style("font-size", "12px")
    .text("Average PSP (ug/100 g)");
}

function highlightChart(countyName) {
  svg.selectAll(".bar")
    .classed("dimmed", d => normalizeCounty(d.county) !== normalizeCounty(countyName))
    .classed("highlighted", d => normalizeCounty(d.county) === normalizeCounty(countyName));
}

function resetChart() {
  svg.selectAll(".bar")
    .classed("dimmed", false)
    .classed("highlighted", false);
}

function showTooltip(event, html) {
  d3.select("#tooltip")
    .classed("hidden", false)
    .html(html)
    .style("left", (event.pageX + 12) + "px")
    .style("top", (event.pageY - 28) + "px");
}

function moveTooltip(event) {
  d3.select("#tooltip")
    .style("left", (event.pageX + 12) + "px")
    .style("top", (event.pageY - 28) + "px");
}

function hideTooltip() {
  d3.select("#tooltip").classed("hidden", true);
}