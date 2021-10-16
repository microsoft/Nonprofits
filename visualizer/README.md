# Building damage visualizer

This is a simple tool for comparing satellite imagery from two points in time along side a modeled building damage overlay.

![](images/example_screenshot.png)

## Setup

The tool uses config files passed via the "config" URL parameter to run different "instances", e.g.: the URL `https://server.com/change_tool.html?config=new_orleans_example.json` will load the "new_orleans_example.json" file.

## Config file example

The below shows the format of the config file used to instantiate an instance of the tool.

```js
{
    "preImageryLayer": {
        "basemapURL": "http://server.com/basemap-pre/{z}/{x}/{y}.png", // URL for the "pre" imagery XYZ tiles
        "date": "January 1st, 2021", // date assosciated with the "pre" imagery
        "attribution": "", // string representation of the image attribution
        "bounds": [[lat1, lon1], [lat2, lon2]] // the bounding box for which the basemap is valid
    },
    "postImageryLayer": {
        "basemapURL": "http://server.com/basemap-pre/{z}/{x}/{y}.png", // URL for the "post" imagery XYZ tiles
        "date": "January 2nd, 2021", // date assosciated with the "post" imagery
        "attribution": "", // string representation of the image attribution
        "bounds": [[lat1, lon1], [lat2, lon2]] // the bounding box for which the basemap is valid
    },
    "changeImageryLayer": {
        "basemapURL": "http://server.com/basemap-change/{z}/{x}/{y}.png", // URL for the "change" imagery XYZ tiles
        "bounds": [[lat1, lon1], [lat2, lon2]] // the bounding box for which the basemap is valid
    },
    "center": [lat, lon], // the latitude and longitude of the initial map view
    "initialZoom": 12, // initial zoom level of the initial map view
    "location": "...", // the location that this file represents
    "imageryAttribution": "...", // HTML string for attributing the source imagery
    "license": "..."  // HTML string for the source imagery license
}
```


## List of third party javascript libraries/versions

List of the libraries used by the tool:
- [leaflet 1.3.1](https://leafletjs.com/download.html)
- [NOTY 3.1.4](https://github.com/needim/noty)
- [jquery 3.3.1](https://jquery.com/download/)
- [leaflet side-by-side 2.0.0](https://github.com/digidem/leaflet-side-by-side)
- [leaflet EasyButton 2.4.0](https://github.com/CliffCloud/Leaflet.EasyButton)
- [font-awesome 4.1.0](https://github.com/FortAwesome/Font-Awesome)

This libraries are included in the `css/`, `js/`, and `fonts/` directories.
