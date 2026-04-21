# Week 7 Recorded Demo Script (Word-for-Word)

Use this script to record the live-coding demonstration using the **course boilerplate starter template**.

---

## Segment 0 – Opening (about 60 seconds)

“Welcome back. In this demo, we’re going to build an interactive Leaflet map using the course boilerplate files. The boilerplate gives us a consistent structure for every Web Mapping project: an HTML file for structure, a CSS file for layout and styling, and a JavaScript entry point.

Our goal today is to create a map, add a basemap, add markers and a polygon, and then load GeoJSON from a file and generate popups from its attributes.

As I code, I want you to watch for two ideas: first, how Leaflet turns a div into an interactive map, and second, how attributes inside GeoJSON become interactive popups.”

---

## Segment 1 – Confirm the boilerplate and folders (about 60–90 seconds)

“Before we write any code, let’s look at the folder structure. At the root, we have index.html. In the css folder, we have style.css. In the js folder, we have main.js, which is the single entry point that the boilerplate loads.

We also have two subfolders inside js: map and layers. That’s our scalable structure. Map creation functions go in the map folder. Anything that adds content to the map goes in the layers folder.

Finally, we have a data folder, and inside it is parks.geojson. That’s the dataset we’ll load.”

---

## Segment 2 – Run the starter once (about 60 seconds)

“Now I’m going to run this with Live Server. If you are not using Live Server or another local server, the GeoJSON file will not load correctly.

At this stage, you should see a basemap. You should not yet see markers, a polygon, or the parks dataset, because those are the parts we are about to implement.”

---

## Segment 3 – Demonstration 1: Add markers (about 5 minutes)

“Let’s implement our first layer module: demo markers.

Open js, then layers, then addDemoMarkers.js. You’ll see TODO comments telling you what to build.

We need three markers, each with a popup.

I’m going to create the first marker using L dot marker, pass it a latitude and longitude, and add it to the map. Then I’ll bind a popup. I’ll repeat that two more times.”

### Code to type (in `js/layers/addDemoMarkers.js`)

```js
export function addDemoMarkers(map) {
  const marker1 = L.marker([39.7392, -104.9903]).addTo(map);
  marker1.bindPopup('<b>Downtown Denver</b><br>City Center');

  const marker2 = L.marker([39.7487, -104.9962]).addTo(map);
  marker2.bindPopup('<b>Union Station</b><br>Transportation Hub');

  const marker3 = L.marker([39.7310, -104.9730]).addTo(map);
  marker3.bindPopup('<b>Capitol Hill</b><br>Historic Neighborhood');
}
```

“Now I’ll save and refresh. You should see three markers. I’m going to click one to confirm the popup appears.

Notice what interactivity changes: the information is not permanently visible. The user chooses when to reveal it.”

---

## Segment 4 – Demonstration 2: Add a polygon (about 5 minutes)

“Next, we’ll add an area feature using a polygon.

Open js, layers, addDemoPolygon.js.

We’ll use L dot polygon, provide a list of latitude and longitude pairs, and apply styling so it’s visually clear. Then we’ll attach a popup.”

### Code to type (in `js/layers/addDemoPolygon.js`)

```js
export function addDemoPolygon(map) {
  const polygon = L.polygon(
    [
      [39.7450, -105.0050],
      [39.7550, -104.9850],
      [39.7350, -104.9700]
    ],
    {
      color: 'blue',
      weight: 3,
      fillOpacity: 0.3
    }
  ).addTo(map);

  polygon.bindPopup('<b>Sample Study Area</b>');
}
```

“Now I’ll save and refresh. You should see the polygon. I’ll click inside it to confirm the popup appears.

This is a good moment to remember that interactive maps still require cartographic judgment. Styling choices like weight and opacity determine whether the map is readable.”

---

## Segment 5 – Demonstration 3: Load GeoJSON and bind attribute-driven popups (about 8–10 minutes)

“Now we’ll load external data from GeoJSON. This is where our map becomes data-driven.

Open js, layers, addParksGeoJSON.js.

The goal is to fetch the GeoJSON file from the data folder, parse it as JSON, and then add it to the map with L dot geoJSON.

We also want two behaviors:
One, popups should use feature dot properties so they reflect the dataset.
Two, points should be drawn as circle markers with consistent styling.”

### Code to type (in `js/layers/addParksGeoJSON.js`)

```js
export async function addParksGeoJSON(map, geoJsonPath) {
  const response = await fetch(geoJsonPath);
  if (!response.ok) {
    throw new Error(`Could not load GeoJSON: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const layer = L.geoJSON(data, {
    onEachFeature: (feature, featureLayer) => {
      const name = feature?.properties?.name ?? 'Unknown';
      const type = feature?.properties?.type ?? 'Unknown';
      featureLayer.bindPopup(`<b>${name}</b><br>Type: ${type}`);
    },
    pointToLayer: (_feature, latlng) => {
      return L.circleMarker(latlng, {
        radius: 8,
        fillColor: 'green',
        color: 'darkgreen',
        weight: 1,
        fillOpacity: 0.7
      });
    }
  }).addTo(map);

  return layer;
}
```

“Now I’ll save and refresh.

You should see new green circle markers appear. These points are coming from the GeoJSON file.

I’ll click one of the green points. Notice how the popup content comes from the GeoJSON properties. That’s the key concept: attributes drive interaction.

If your GeoJSON did not load, the first thing to check is whether you are using Live Server. The second thing is whether your file path is exactly data slash parks dot geojson.”

---

## Segment 6 – Wrap-up and Week 8 connection (about 60–90 seconds)

“To summarize, we used the course boilerplate and built a Leaflet map in a scalable way. We added a basemap, multiple feature types, and an external GeoJSON dataset.

Next week, we’ll build on this structure by adding layer controls, legends, and data-driven styling patterns that support choropleth mapping.

Your assignment is essentially to reproduce these elements with your own choices of location and presentation, while keeping the code organized and the design clear.”
