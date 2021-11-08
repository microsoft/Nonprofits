# Building damage visualizer

**Jump to: [Setup](#setup) | [Tutorial](#tutorial)**

This is a simple web-based visualizer for comparing satellite imagery from two points in time with a modeled building damage overlay.

![](images/example_screenshot.png)

## Setup

The tool uses config files passed via the "config" URL parameter to run different "instances", e.g.: the URL `https://server.com/change_tool.html?config=new_orleans_example.json` will load the "new_orleans_example.json" file.

### Config file example

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


## Tutorial

This section provides detailed instruction on how to set up a demo instance of this tool using high-resolution imagery from the USDA's National Agriculture Imagery Program (NAIP).
We use this NAIP imagery simply for example purposes, it is not practically useful for distaster response applications as it is only collected once every two years on a state-by-state basis in the US. That said, it is freely available on the [Planetary Computer](https://planetarycomputer.microsoft.com/) and will allow us to easily demo the steps needed to set up the web interface with new imagery from scratch.

The following steps assume that you are running a linux version of the [Data Science Virtual Machine (DSVM)](https://azure.microsoft.com/en-us/services/virtual-machines/data-science-virtual-machines/) instance in Microsoft Azure and know the hostname/IP address of the machine. The steps to setup an example instance of the visualizer are as follows:
1. Clone the repo
```bash
git clone https://github.com/microsoft/Nonprofits.git nonprofits
cd nonprofits/visualizer/
```
2. Create a conda environment that contains the necessary packages (particularly GDAL).
```bash
conda config --set channel_priority strict
conda env create --file environment.yml
conda activate visualizer
```
3. Download the example NAIP data. We use NAIP scenes from 2013 and 2019 that overlap the Microsoft Redmond campus. These are formatted as [GeoTIFFs](https://en.wikipedia.org/wiki/GeoTIFF), a common image format for satellite or aerial imagery.
```bash
wget https://naipeuwest.blob.core.windows.net/naip/v002/wa/2013/wa_100cm_2013/47122/m_4712223_se_10_1_20130910.tif
wget https://naipeuwest.blob.core.windows.net/naip/v002/wa/2019/wa_60cm_2019/47122/m_4712223_se_10_060_20191011.tif
```
4. In the coming steps we will want to render our scenes using the `gdal2tiles.py` command which requires 3-channel (RGB) data formatted as "Bytes", so we need to preprocess the data we have into this format. The example NAIP data comes as 4-channel GeoTIFFs with "Byte" data types already -- to see this for one of the scenes you can run `gdalinfo m_4712223_se_10_1_20130910.tif` -- so we will just need to extract the RGB bands into their own file. Other sources of imagery may have different data types, different channels orderings, etc. and require more preprocessing. We use [gdal_translate](https://gdal.org/programs/gdal_translate.html) to do this preprocessing:
```bash
gdal_translate -b 1 -b 2 -b 3 -co BIGTIFF=YES -co NUM_THREADS=ALL_CPUS -co COMPRESS=LZW -co PREDICTOR=2 m_4712223_se_10_1_20130910.tif 2013_rgb.tif
gdal_translate -b 1 -b 2 -b 3 -co BIGTIFF=YES -co NUM_THREADS=ALL_CPUS -co COMPRESS=LZW -co PREDICTOR=2 m_4712223_se_10_060_20191011.tif 2019_rgb.tif
rm m_4712223_se_10_1_20130910.tif m_4712223_se_10_060_20191011.tif
```
5. Next, we need to make sure that the data is _pixel-aligned_ over the same area on Earth. To do this we crop and resample the post-imagery to the same spatial extent and pixel resolution as the pre-imagery.
```
python utils/align_inputs.py --template-fn 2013_rgb.tif --input-fn 2019_rgb.tif --output-fn 2019_aligned_rgb.tif
mv 2019_aligned_rgb.tif 2019_rgb.tif
```
6. Now that we have pixel-aligned pre- and post-imagery layers, we can run the building damage assessment model.
```
python utils/inference.py --pre-imagery 2013_rgb.tif --post-imagery 2019_rgb.tif --output-fn damage_predictions.tif
```
7. We can now use `gdal2tiles.py` to render the tiles that will be shown on the web map interface. This step will produce three directories, `data/2013_tiles/`, `data/2019_tiles/`, and `data/damage_tiles/`, that contain rendered PNG versions of the imagery that will be displayed on the web map.
```bash
gdal_translate -of vrt -expand rgba damage_predictions.tif damage_predictions.vrt
gdal2tiles.py -z 8-18 2013_rgb.tif data/2013_tiles/
gdal2tiles.py -z 8-18 2019_rgb.tif data/2019_tiles/
gdal2tiles.py -z 8-18 damage_predictions.vrt data/damage_tiles/
rm damage_predictions.vrt
```
8. Now, to setup the configuration file we need some metadata from the input GeoTIFFs. We include a script that provides this:
```
python utils/get_bounds.py --input-fn 2013_rgb.tif
```
9. Finally, create a new configuration file (similar to the "new_orleans_example.json" file) called "local_example.json" using the bounds and centroid information shown by `utils/get_bounds.py` and the path to the directories we created.
```json
{
    "preImageryLayer": {
        "basemapURL": "http://<REPLACE WITH YOUR VM'S HOSTNAME/IP>:8080/data/2013_tiles/{z}/{x}/{y}.png",
        "date": "2013 imagery",
        "attribution": "",
        "bounds": [[47.62170620047876, -122.12082716224859], [47.69079013651763, -122.19162910382583]]
    },
    "postImageryLayer": {
        "basemapURL": "http://<REPLACE WITH YOUR VM'S HOSTNAME/IP>:8080/data/2019_tiles/{z}/{x}/{y}.png",
        "date": "2019 imagery",
        "attribution": "",
        "bounds": [[47.62170620047876, -122.12082716224859], [47.69079013651763, -122.19162910382583]]
    },
    "changeImageryLayer": {
        "basemapURL": "http://<REPLACE WITH YOUR VM'S HOSTNAME/IP>:8080/data/damage_tiles/{z}/{x}/{y}.png",
        "bounds": [[47.62170620047876, -122.12082716224859], [47.69079013651763, -122.19162910382583]]
    },
    "center": [47.656253585524624, -122.15620486525859],
    "initialZoom": 14,
    "location": "Redmond, Washington",
    "imageryAttribution": "<a href='https://planetarycomputer.microsoft.com/dataset/naip'>NAIP Imagery</a>",
    "license": "Proprietary"
}
```
10. Run a local http server with `python -m http.server 8080`
    - Make sure port 8080 is not blocked by the Azure level firewall through the "Network" tab of your VM in the Azure Portal. See [this page](https://docs.microsoft.com/en-us/azure/virtual-machines/windows/nsg-quickstart-portal) for more information.
11. Finally, navigate to http://<REPLACE WITH YOUR VM'S HOSTNAME/IP>:8080/change_tool.html?config=local_example.json in your browser to see the example in action!

Once you have confirmed that the local example is working, we suggest you move the contents of the visualizer to a stable web server. As the visualizer is completely static, it could be easily hosted on an [Azure blob container](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website) or through a [local web server such as Apache](https://www.digitalocean.com/community/tutorials/how-to-install-the-apache-web-server-on-ubuntu-18-04).

## Setup With Docker

### Prerequisite

- [Docker CE](https://docs.docker.com/engine/install/ubuntu/#installation-methods)

### Configuration - the docker file use the [.env](.env) file for configuring the location of the code files and the mounting of a local data directory into the container. In addition, the input images for the data container should be specify in this file is using docker compose.

```
app_dir=/app
app_port=8080
local_data_dir=.
app_data_dir=/app/data
conda_env_name=visualizer
pre_imagery_file_name=2013_rgb.tif
post_imagery_file_name=2019_aligned_rgb.tif
imagery_output_file_name=test

```


### Run inference model and generate tiles for visualizer. 

This requires two input RGB tiff images which need to be pixel aligned. Do steps 1 thru 5 of the **[Tutorial](#Tutorial)** section of this readme for an example of how to generate the correct image format from the sample data.

```bash

docker compose -f docker-compose-data.yml up

```

### Run Web Site

Run below docker command to build and run the website. By default the website will run in port 8080. Nagivate to http://localhost:8080/change_tool.html after running the command

```bash

docker compose up -d

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
