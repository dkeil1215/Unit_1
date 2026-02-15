function initialize() {
    cities();
}

// function to create a table with cities and their populations
function cities() {
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

    // create a table element
    var table = document.createElement("table");

    // create a header row
    var headerRow = document.createElement("tr");

    // city header
    var cityHeader = document.createElement("th");
    cityHeader.innerHTML = "City";
    headerRow.appendChild(cityHeader);

    // population header
    var popHeader = document.createElement("th");
    popHeader.innerHTML = "Population";
    headerRow.appendChild(popHeader);

    // city size header
    var sizeHeader = document.createElement("th");
    sizeHeader.innerHTML = "City Size";
    headerRow.appendChild(sizeHeader);

    // add header row to table
    table.appendChild(headerRow);

    // loop through cities
    for (var i = 0; i < cities.length; i++) {
        var tr = document.createElement("tr");

        var city = document.createElement("td");
        city.innerHTML = cities[i];
        tr.appendChild(city);

        var pop = document.createElement("td");
        pop.innerHTML = population[i];
        tr.appendChild(pop);

        // determine city size
        var citySize;
        if (population[i] < 100000) {
            citySize = "Small";
        } else if (population[i] < 500000) {
            citySize = "Medium";
        } else {
            citySize = "Large";
        }

        var size = document.createElement("td");
        size.innerHTML = citySize;
        tr.appendChild(size);

        table.appendChild(tr);
    }

    // add table to div in index.html
    var mydiv = document.getElementById("mydiv");
    mydiv.appendChild(table);
}

// run initialize when page loads
window.onload = initialize;
