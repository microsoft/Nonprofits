# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
"""Script for resampling to create pixel aligned GeoTIFFs."""

import argparse
import os
import subprocess

import rasterio

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--template-fn",
        required=True,
        help="template GeoTIFF, the `input_fn` will be aligned to this file",
        metavar="FILENAME",
    )
    parser.add_argument(
        "--input-fn",
        required=True,
        help="input GeoTIFF",
        metavar="FILENAME",
    )
    parser.add_argument(
        "--output-fn",
        required=True,
        help="output GeoTIFF",
        metavar="FILENAME",
    )
    args = parser.parse_args()

    assert os.path.exists(args.template_fn), "Template file not found"
    assert os.path.exists(args.input_fn), "Input file not found"
    assert not os.path.exists(args.output_fn), "Output file already exists"

    with rasterio.open(args.template_fn, "r") as f:
        left, bottom, right, top = f.bounds
        crs = f.crs.to_string()
        height, width = f.height, f.width

    command = [
        "gdalwarp",
        "-overwrite",
        "-ot", "Byte",
        "-t_srs", crs,
        "-r", "bilinear",
        "-of", "GTiff",
        "-te", str(left), str(bottom), str(right), str(top),
        "-ts", str(width), str(height),
        "-co", "COMPRESS=LZW",
        "-co", "PREDICTOR=2",
        "-co", "BIGTIFF=YES",
        args.input_fn,
        args.output_fn,
    ]
    subprocess.call(command)
