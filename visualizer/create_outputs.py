# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
"""Wrapper script that runs the inference script and tile creation commands."""

import argparse
import os
import subprocess

import fiona.transform
import rasterio
import shapely.geometry

JSON_TEMPLATE = """
{
    "preImageryLayer": {
        "basemapURL": "/{{outputDir}}/{{name}}-pre-tiles/{z}/{x}/{y}.png",
        "date": "Pre imagery",
        "attribution": "",
        "bounds": {{bounds}}
    },
    "postImageryLayer": {
        "basemapURL": "/{{outputDir}}/{{name}}-post-tiles/{z}/{x}/{y}.png",
        "date": "Post imagery",
        "attribution": "",
        "bounds": {{bounds}}
    },
    "changeImageryLayer": {
        "basemapURL": "/{{outputDir}}/{{name}}-prediction-tiles/{z}/{x}/{y}.png",
        "bounds": {{bounds}}
    },
    "center": {{centroid}},
    "initialZoom": 14,
    "location": "Replace with imagery location",
    "imageryAttribution": "Replace with image attribution",
    "license": "Replace with imagery license"
}"""

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pre-imagery",
        required=True,
        help="path to the aligned pre-imagery (RGB GeoTIFF in Byte format)",
        metavar="FILE",
    )
    parser.add_argument(
        "--post-imagery",
        required=True,
        help="path to the aligned post-imagery (RGB GeoTIFF in Byte format)",
        metavar="FILE",
    )
    parser.add_argument(
        "--output-dir",
        required=True,
        help="directory to write output",
        metavar="FILE",
    )
    parser.add_argument(
        "--name",
        required=True,
        help="name of the run (used as a filename prefix)",
        metavar="NAME",
    )
    parser.add_argument(
        "--gpu",
        default=0,
        type=int,
        help="GPU id to use for inference",
    )
    args = parser.parse_args()

    assert os.path.exists(args.pre_imagery), "Input file not found"
    assert os.path.exists(args.post_imagery), "Input file not found"
    assert os.path.isdir(args.output_dir), "Output directory not found"

    prediction_fn = os.path.join(
        args.output_dir,
        f"{args.name}-damage_predictions.tif"
    )
    pre_imagery_tile_dir = os.path.join(
        args.output_dir,
        f"{args.name}-pre-tiles/"
    )
    post_imagery_tile_dir = os.path.join(
        args.output_dir,
        f"{args.name}-post-tiles/"
    )
    prediction_tile_dir = os.path.join(
        args.output_dir,
        f"{args.name}-prediction-tiles/"
    )
    json_fn = os.path.join(
        args.output_dir,
        f"{args.name}.json"
    )

    assert not os.path.exists(prediction_fn), "Would overwrite data"
    assert not os.path.exists(pre_imagery_tile_dir), "Would overwrite data"
    assert not os.path.exists(post_imagery_tile_dir), "Would overwrite data"
    assert not os.path.exists(prediction_tile_dir), "Would overwrite data"
    assert not os.path.exists(json_fn), "Would overwrite data"

    # Run inference
    command = [
        "python", "utils/inference.py",
        "--pre-imagery", args.pre_imagery,
        "--post-imagery", args.post_imagery,
        "--output-fn", prediction_fn,
        "--gpu", str(args.gpu)
    ]
    subprocess.call(command)

    # Convert predictions to a RGBA VRT
    command = [
        "gdal_translate",
        "-of", "vrt",
        "-expand", "rgba",
        prediction_fn,
        "temp.vrt"
    ]
    subprocess.call(command)

    # Run gdal2tiles.py for each layer
    for input_fn, output_dir in [
        (args.pre_imagery, pre_imagery_tile_dir),
        (args.post_imagery, post_imagery_tile_dir),
        ("temp.vrt", prediction_tile_dir),
    ]:
        command = [
            "gdal2tiles.py",
            "-z", "8-18",
            input_fn, output_dir
        ]
        subprocess.call(command)
    os.remove("temp.vrt")

    # Embedding the logic from utils/get_bounds.py
    with rasterio.open(args.pre_imagery) as f:
        crs = f.crs.to_string()

        shape = shapely.geometry.box(*f.bounds)
        geom = shapely.geometry.mapping(shape)

        geom = fiona.transform.transform_geom(crs, "epsg:4326", geom)

        top_lng, top_lat = geom["coordinates"][0][0]
        bot_lng, bot_lat = geom["coordinates"][0][2]

        bounds = [[top_lat, top_lng],[bot_lat, bot_lng]]

        centroid_geom = shapely.geometry.mapping(shape.centroid)
        centroid_geom = fiona.transform.transform_geom(crs, "epsg:4326", centroid_geom)
        centroid = [centroid_geom["coordinates"][1], centroid_geom["coordinates"][0]]

    # Format and write output
    JSON_TEMPLATE = JSON_TEMPLATE.replace("{{bounds}}", str(bounds))
    JSON_TEMPLATE = JSON_TEMPLATE.replace("{{centroid}}", str(centroid))
    JSON_TEMPLATE = JSON_TEMPLATE.replace("{{name}}", args.name)
    JSON_TEMPLATE = JSON_TEMPLATE.replace("{{outputDir}}", args.output_dir)
    JSON_TEMPLATE = JSON_TEMPLATE.replace("//", "/")
    
    with open(json_fn, "w") as f:
        f.write(JSON_TEMPLATE)
