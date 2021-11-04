# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
"""Building damage inference script."""

import argparse
import os

import numpy as np
import rasterio
import rasterio.mask
import rasterio.warp
import torch.nn.functional as F
import torch
from models import SiamUnet
from torch.utils.data import DataLoader
from torch.utils.model_zoo import load_url as load_state_dict_from_url

from utils import TileInferenceDataset, ZipDataset

NUM_WORKERS = 4
CHIP_SIZE = 512
PADDING = 128
assert PADDING % 2 == 0
HALF_PADDING = PADDING // 2
CHIP_STRIDE = CHIP_SIZE - PADDING


def set_up_parser():
    """Set up the argument parser.
    Returns:
        the argument parser
    """
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )

    parser.add_argument(
        "--pre-imagery",
        required=True,
        help="path to the pre imagery (RGB GeoTIFF in Byte format)",
        metavar="FILE",
    )
    parser.add_argument(
        "--post-imagery",
        required=True,
        help="path to the post imagery (RGB GeoTIFF in Byte format)",
        metavar="FILE",
    )
    parser.add_argument(
        "--output-fn",
        required=True,
        help="path to the GeoTIFF file to write output to",
        metavar="FILE",
    )
    parser.add_argument(
        "--gpu",
        default=0,
        type=int,
        help="GPU id to use for inference",
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="flag to print debugging to stdout"
    )

    return parser


def main(args):
    """Inference script logic.

    Args:
        args from command line
    """

    # Setup
    pre_fn = args.pre_imagery
    post_fn = args.post_imagery
    output_fn = args.output_fn

    assert os.path.exists(pre_fn)
    assert os.path.exists(post_fn)
    assert not os.path.exists(output_fn)

    device = None
    if torch.cuda.is_available():
        device = torch.device(f"cuda:{args.gpu}")
    else:
        print(
            "WARNING: GPU is not available -- defaulting to CPU -- inference will be slow"
        )
        device = torch.device("cpu")

    # Validating input data
    with rasterio.open(pre_fn) as f:
        assert f.profile["dtype"] == "uint8"
        assert f.count == 3
        input_height = f.height
        input_width = f.width
        input_crs = f.crs

    with rasterio.open(pre_fn) as f:
        assert f.profile["dtype"] == "uint8"
        assert f.count == 3
        assert f.crs == input_crs
        assert f.width == input_width
        assert f.height == input_height

    # Load data from the intersection
    print("Loading data")
    with rasterio.open(pre_fn) as f:
        pre_data = f.read()
        twod_nodata_mask = (pre_data == 0).sum(axis=0) == 3
        pre_data = pre_data / 255.0
        input_profile = f.profile.copy()
        pre_data = pre_data.reshape(pre_data.shape[0], -1).T.copy()

    with rasterio.open(post_fn) as f:
        post_data = f.read()
        post_data = post_data / 255.0
        post_data = post_data.reshape(post_data.shape[0], -1).T.copy()

    print("Computing data statistics")
    all_data = np.concatenate([pre_data, post_data], axis=0)
    nodata_mask = (all_data == 0).sum(axis=1) != 3
    all_means = np.mean(all_data[nodata_mask], axis=0, dtype=np.float64)
    all_stdevs = np.std(all_data[nodata_mask], axis=0, dtype=np.float64)

    # Create dataloaders
    print("Creating dataloaders")

    def transform_by_all(img):
        img = img / 255.0
        img = (img - all_means) / all_stdevs
        img = np.rollaxis(img, 2, 0)
        img = torch.from_numpy(img).float()
        return img

    ds1 = TileInferenceDataset(
        pre_fn,
        CHIP_SIZE,
        CHIP_STRIDE,
        transform=transform_by_all,
        windowed_sampling=False,
        verbose=False,
    )
    ds2 = TileInferenceDataset(
        post_fn,
        CHIP_SIZE,
        CHIP_STRIDE,
        transform=transform_by_all,
        windowed_sampling=False,
        verbose=False,
    )
    ds = ZipDataset(ds1, ds2)
    dataloader = DataLoader(
        ds, batch_size=16, shuffle=False, num_workers=4, pin_memory=False
    )

    # Init model
    print("Initializing model")
    model = SiamUnet()
    state_dict = load_state_dict_from_url(
        "https://github.com/microsoft/building-damage-assessment-cnn-siamese/raw/main/models/model_best.pth.tar",
        map_location="cpu",
    )["state_dict"]
    model.load_state_dict(state_dict)
    model = model.eval()
    model = model.to(device)

    # Run model
    print("Running model inference")
    output = np.zeros((5, input_height, input_width), dtype=np.float64)
    kernel = np.ones((CHIP_SIZE, CHIP_SIZE), dtype=np.float32)
    kernel[HALF_PADDING:-HALF_PADDING, HALF_PADDING:-HALF_PADDING] = 5
    counts = np.zeros((input_height, input_width), dtype=np.float32)
    for i, (x1, x2, coords) in enumerate(dataloader):
        x1 = x1.to(device)
        x2 = x2.to(device)

        with torch.no_grad():
            y1, y2, damage = model.forward(x1, x2)

            y1 = y1.argmax(dim=1)

            damage = y1.unsqueeze(1) * damage
            damage = F.softmax(damage, dim=1).cpu().numpy()

        for j in range(damage.shape[0]):
            y, x = coords[j]
            output[:, y:y+CHIP_SIZE, x:x+CHIP_SIZE] += damage[j] * kernel
            counts[y : y + CHIP_SIZE, x : x + CHIP_SIZE] += kernel

    output = output / counts
    output = output.argmax(axis=0).astype(np.uint8)
    output[twod_nodata_mask] = 0
    output[output==1] = 0

    # Save results
    print("Saving output")
    input_profile["count"] = 1
    input_profile["nodata"] = 0
    input_profile["height"] = input_height
    input_profile["width"] = input_width
    input_profile["compress"] = "lzw"
    input_profile["predictor"] = 2
    with rasterio.open(output_fn, "w", **input_profile) as f:
        f.write(output, 1)
        f.write_colormap(
            1,
            {
                0: (0, 0, 0, 0),
                1: (0, 0, 0, 0),
                2: (252, 112, 80, 255),
                3: (212, 32, 32, 255),
                4: (103, 0, 13, 255),
            },
        )


if __name__ == "__main__":
    parser = set_up_parser()
    args = parser.parse_args()

    main(args)
