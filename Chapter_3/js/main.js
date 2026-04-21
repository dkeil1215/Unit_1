function initialize() {
    // This is the entry point for the page.
    // We build the static city table first (instant, no network),
    // then we start the GeoJSON fetch (async, may take a moment).
    cities();

    // Start loading GeoJSON after the city table is created.
    // This mirrors Chapter 3: load external data with fetch() and handle it in callbacks.
    loadGeoJSON();
}

// function to create a table with cities and their populations
function cities() {
    // These are hard-coded (static) values.
    // Nothing here comes from a file or server—this runs immediately when the page loads.
    var cities = [
        "Madison",
        "Milwaukee",
        "Green Bay",
        "Superior"
    ];

    var population = [
        233209,
        594833,
        104057,
        27244
    ];

    // Create a table element to display the city data in the HTML page.
    var table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    table.style.marginBottom = "1rem";

    // Small styling for table cells (reused for th and td so everything looks consistent).
    var cellStyle = "padding:6px 10px;border:1px solid #444;text-align:left;";

    // Create a header row.
    var headerRow = document.createElement("tr");

    // City header column
    var cityHeader = document.createElement("th");
    cityHeader.innerHTML = "City";
    cityHeader.style = cellStyle;
    headerRow.appendChild(cityHeader);

    // Population header column
    var popHeader = document.createElement("th");
    popHeader.innerHTML = "Population";
    popHeader.style = cellStyle;
    headerRow.appendChild(popHeader);

    // City size header column
    // This is a derived value: we compute it based on population.
    var sizeHeader = document.createElement("th");
    sizeHeader.innerHTML = "City Size";
    sizeHeader.style = cellStyle;
    headerRow.appendChild(sizeHeader);

    // Add header row to the table.
    table.appendChild(headerRow);

    // Loop through the arrays and build one table row per city.
    // This assumes cities[] and population[] are the same length and aligned by index.
    for (var i = 0; i < cities.length; i++) {
        var tr = document.createElement("tr");

        // City name cell
        var city = document.createElement("td");
        city.innerHTML = cities[i];
        city.style = cellStyle;
        tr.appendChild(city);

        // Population cell (formatted with commas)
        var pop = document.createElement("td");
        pop.innerHTML = population[i].toLocaleString();
        pop.style = cellStyle;
        tr.appendChild(pop);

        // Determine city size based on population thresholds.
        // This is a simple classification rule used just for display.
        var citySize;
        if (population[i] < 100000) {
            citySize = "Small";
        } else if (population[i] < 500000) {
            citySize = "Medium";
        } else {
            citySize = "Large";
        }

        // City size cell
        var size = document.createElement("td");
        size.innerHTML = citySize;
        size.style = cellStyle;
        tr.appendChild(size);

        // Add the completed row to the table.
        table.appendChild(tr);
    }

    // Add table to the div in index.html with id="mydiv".
    // If #mydiv does not exist, this will fail—so index.html must include it.
    var mydiv = document.getElementById("mydiv");
    mydiv.appendChild(table);
}

// Run initialize when page loads.
// This ensures the DOM is ready before we try to append the table/section.
window.onload = initialize;


// debug///

function loadGeoJSON() {
    // Everything in this function is about fetching external data and displaying it.
    // In Chapter 3 terms: fetch() (AJAX) -> convert response -> callback uses data.

    // Container where we will append results.
    var mydiv = document.getElementById("mydiv");

    // Create a wrapper section for the GeoJSON output so it stays organized.
    var section = document.createElement("section");
    section.id = "geojson-section";
    section.style = "margin-top:12px;padding:10px;background:rgba(255,255,255,0.9);border-radius:6px;";

    // Header for the GeoJSON section.
    var header = document.createElement("h3");
    header.textContent = "GeoJSON — MegaCities";
    header.style = "margin:0 0 8px 0;font-size:1rem";
    section.appendChild(header);

    // Status text is helpful because fetch is asynchronous.
    // The page keeps running while the data is still loading.
    var status = document.createElement("div");
    status.textContent = "Loading GeoJSON…";
    status.style = "font-style:italic;margin-bottom:8px";
    section.appendChild(status);

    // This will hold the GeoJSON summary table (or fallback output).
    var content = document.createElement("div");
    content.id = "geojson-content";
    section.appendChild(content);

    // Add the GeoJSON section below the city table.
    mydiv.appendChild(section);

    // Helper: find a sensible property by trying common keys.
    // GeoJSON files don't always use the same property names, so this makes the script more flexible.
    function pickProp(props, candidates) {
        if (!props) return undefined;

        // Try each candidate key in order and return the first one that exists and has a value.
        for (var i = 0; i < candidates.length; i++) {
            var k = candidates[i];
            if (k in props && props[k] !== null && props[k] !== undefined && String(props[k]).trim() !== "") {
                return props[k];
            }
        }
        return undefined;
    }

    // Candidate keys we might see in different datasets.
    // This is a practical workaround for inconsistent attribute field naming.
    var nameKeys = ["name","Name","NAME","city","City","CITY","title","TITLE"];
    var countryKeys = ["country","Country","COUNTRY","admin","Admin","ADM0_NAME"];
    var popKeys = ["population","Population","POP","pop_est","POP_EST","POP_MAX","POPULATION"];

    // Start the fetch request.
    // This requests the GeoJSON file from your site's data folder.
    // Important: this requires a local server; many browsers block fetch from file://.
    fetch("data/MegaCities.geojson")
        .then(function(response){
            // First callback: check the HTTP response and convert it to usable JSON.
            // Chapter 3: fetch returns a Response object first, not your actual data.
            if (!response.ok) throw new Error("Fetch failed: " + response.status + " " + response.statusText);

            // This returns a promise that resolves to the parsed JavaScript object.
            // Once that promise resolves, the next .then() runs.
            return response.json();
        })
        .then(function(myData){
            // Second callback: this runs only after the JSON is fully loaded and parsed.
            // At this point, myData is usable.

            // Update the status now that we have data.
            status.textContent = "Loaded GeoJSON.";

            // Add a raw JSON preview so you can confirm the data structure quickly.
            // This is useful for debugging when features aren't showing up where you expect.
            var rawExpander = document.createElement("details");
            var rawSummary = document.createElement("summary");
            rawSummary.textContent = "Show raw JSON (truncated)";
            rawExpander.appendChild(rawSummary);

            var pre = document.createElement("pre");
            var pretty = JSON.stringify(myData, null, 2);

            // Limit the preview so it doesn't flood the page.
            pre.textContent = pretty.length > 4000 ? pretty.slice(0, 4000) + "\n…(truncated)" : pretty;
            pre.style = "max-height:220px;overflow:auto;background:#f7f7f7;padding:8px;border-radius:4px;";
            rawExpander.appendChild(pre);
            section.appendChild(rawExpander);

            // If the file matches the common GeoJSON structure:
            // { type: "FeatureCollection", features: [...] }
            // then we build a human-readable summary table.
            if (myData && myData.type === "FeatureCollection" && Array.isArray(myData.features)) {
                var features = myData.features;

                // If the file loads but contains no features, nothing to display.
                if (features.length === 0) {
                    content.innerHTML = "<em>No features found in GeoJSON.</em>";
                    return;
                }

                // Create a table summarizing key fields from each feature.
                var tbl = document.createElement("table");
                tbl.style = "width:100%;border-collapse:collapse;margin-top:8px";

                var thStyle = "border-bottom:2px solid #666;padding:6px;text-align:left";
                var tdStyle = "border-bottom:1px solid #ddd;padding:6px;vertical-align:top";

                // Header row labels for the summary.
                var hdr = document.createElement("tr");
                ["#", "Name", "Country", "Population", "Geometry"].forEach(function(h){
                    var th = document.createElement("th");
                    th.textContent = h;
                    th.style = thStyle;
                    hdr.appendChild(th);
                });
                tbl.appendChild(hdr);

                // Create one row per feature.
                features.forEach(function(f, i){
                    var tr = document.createElement("tr");

                    // Index column (just a row number).
                    var tdIndex = document.createElement("td");
                    tdIndex.textContent = String(i+1);
                    tdIndex.style = tdStyle;
                    tr.appendChild(tdIndex);

                    // Name column (tries common property keys).
                    // If your dataset uses a different field name, add it to nameKeys above.
                    var name = pickProp(f.properties, nameKeys) || "(no name)";
                    var tdName = document.createElement("td");
                    tdName.textContent = name;
                    tdName.style = tdStyle;
                    tr.appendChild(tdName);

                    // Country column (tries common country/admin keys).
                    var country = pickProp(f.properties, countryKeys) || "-";
                    var tdCountry = document.createElement("td");
                    tdCountry.textContent = country;
                    tdCountry.style = tdStyle;
                    tr.appendChild(tdCountry);

                    // Population column (tries a list of likely population keys).
                    // Note: if your dataset stores population by year, you might not have a single "population" field.
                    var pop = pickProp(f.properties, popKeys);
                    var tdPop = document.createElement("td");
                    tdPop.textContent = pop ? (typeof pop === "number" ? pop.toLocaleString() : pop) : "-";
                    tdPop.style = tdStyle;
                    tr.appendChild(tdPop);

                    // Geometry column: show geometry type and a small coordinate preview.
                    // GeoJSON coordinates are [longitude, latitude] for points.
                    var geomText = "";
                    if (f.geometry) {
                        geomText += f.geometry.type || "";
                        if (Array.isArray(f.geometry.coordinates)) {
                            // Points get a full coordinate display.
                            // Other geometry types get a truncated preview so it stays readable.
                            if (f.geometry.type === "Point") {
                                geomText += ": " + JSON.stringify(f.geometry.coordinates);
                            } else {
                                var coordsString = JSON.stringify(f.geometry.coordinates);
                                geomText += ": " + coordsString.slice(0,120) + (coordsString.length > 120 ? "…" : "");
                            }
                        }
                    } else {
                        geomText = "(no geometry)";
                    }
                    var tdGeom = document.createElement("td");
                    tdGeom.textContent = geomText;
                    tdGeom.style = tdStyle;
                    tr.appendChild(tdGeom);

                    tbl.appendChild(tr);

                    // Add a second row under each feature with a collapsible view of all properties.
                    // This makes debugging easier when you need to confirm field names.
                    var detailsRow = document.createElement("tr");
                    var detailsCell = document.createElement("td");
                    detailsCell.colSpan = 5;
                    detailsCell.style = "padding:4px 8px 12px 8px;";

                    var details = document.createElement("details");
                    var summary = document.createElement("summary");
                    summary.textContent = "Show full properties";
                    details.appendChild(summary);

                    var propPre = document.createElement("pre");
                    propPre.style = "white-space:pre-wrap;background:#fafafa;padding:8px;border-radius:4px;border:1px solid #eee;";
                    propPre.textContent = JSON.stringify(f.properties || {}, null, 2);
                    details.appendChild(propPre);

                    detailsCell.appendChild(details);
                    detailsRow.appendChild(detailsCell);
                    tbl.appendChild(detailsRow);
                });

                // Finally, put the summary table into the page.
                content.appendChild(tbl);

            } else {
                // If the file is valid JSON but not a FeatureCollection, we still show it.
                // This helps you spot if you fetched the wrong file or the wrong structure.
                content.innerHTML = "<em>GeoJSON is not a FeatureCollection. Showing contents:</em>";

                var fallback = document.createElement("pre");
                fallback.style = "background:#f7f7f7;padding:8px;border-radius:4px;max-height:250px;overflow:auto;";
                fallback.textContent = JSON.stringify(myData, null, 2);
                content.appendChild(fallback);
            }
        })
        .catch(function(err){
            // This runs if the network request fails, the JSON can't parse, or any error is thrown above.
            console.error(err);

            // Update status so the user sees something useful on the page.
            status.innerHTML = "<span style='color:red'>Error loading GeoJSON: " + err.message + "</span>";

            // Common beginner issue: trying to run fetch from a file:// URL.
            // Browsers often block that for security. A local server fixes it.
            if (err instanceof TypeError && location.protocol === "file:") {
                var hint = document.createElement("div");
                hint.style = "margin-top:8px;color:#333";
                hint.innerHTML = "<strong>Tip:</strong> Fetching via <code>file://</code> can be blocked by the browser. Run a local server (e.g. <code>python -m http.server 8000</code>) and open <code>http://localhost:8000/</code>.";
                section.appendChild(hint);
            }
        });
}
