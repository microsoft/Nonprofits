# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
''' Convinience script for getting the bounds and centroid of a GeoTIFF in EPSG:4326.'''

import sys
import os
import argparse
import rasterio
import fiona.transform
import shapely.geometry

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input-fn",
        required=True,
        help="input GeoTIFF",
        metavar="FILENAME",
    )
    args = parser.parse_args()

    assert os.path.exists(args.input_fn), "Input file not found"

    with rasterio.open(args.input_fn) as f:
        crs = f.crs.to_string()

        shape = shapely.geometry.box(*f.bounds)
        geom = shapely.geometry.mapping(shape)

        geom = fiona.transform.transform_geom(crs, "epsg:4326", geom)

        top_lng, top_lat = geom["coordinates"][0][0]
        bot_lng, bot_lat = geom["coordinates"][0][2]

        print("Bounds:")
        print([
            [top_lat,top_lng],
            [bot_lat,bot_lng],
        ])

        centroid_geom = shapely.geometry.mapping(shape.centroid)
        centroid_geom = fiona.transform.transform_geom(crs, "epsg:4326", centroid_geom)
        print("Centroid:")
        print(f'[{centroid_geom["coordinates"][1]}, {centroid_geom["coordinates"][0]}]')
