#!/usr/bin/env python3
"""Cut the round bakes out of their photos so they can float on dark sections.

The backgrounds are neutral (concrete, slate, white) and the bakes are warm,
so saturation and warmth separate them. Largest blob wins, holes get filled.

Usage: make-cutouts.py <menu photo dir> <output dir> [slug ...]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

DEFAULT_SLUGS = [
    "kinder-cookie", "bueno-cookie", "oreo-white-chocolate-cookie",
    "hazelnut-praline-cookie", "red-velvet-cookie", "chocolate-orange-cookie",
    "white-chocolate-brownie-cookie", "lotus-cookie", "lemon-meringue-cookie",
    "mms-cookie", "maple-bacon-cookie", "candied-walnut-cookie", "tiramisu-cookie",
]
OUTPUT_SIZE = 640
PADDING = 0.04
# The plate's warm shadow survives the mask on these, so trim to an ellipse: cx, cy, rx, ry.
ELLIPSE_TRIM = {"tiramisu-cookie": (0.555, 0.505, 0.415, 0.40)}


def foreground_mask(rgb):
    r, g, b = [rgb[..., i].astype(np.float32) for i in range(3)]
    high, low = rgb.max(axis=-1).astype(np.float32), rgb.min(axis=-1).astype(np.float32)
    saturation = (high - low) / np.maximum(high, 1)
    warmth = r - b
    return (saturation > 0.2) & (warmth > 16)


def largest_blob(mask):
    """Largest 4-connected region, via a run-length union-find to stay numpy-only."""
    height, width = mask.shape
    parent, runs, previous = [], [], []

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for y in range(height):
        row = mask[y].astype(np.int8)
        edges = np.flatnonzero(np.diff(np.concatenate(([0], row, [0]))))
        current = []
        for start, stop in zip(edges[::2], edges[1::2]):
            label = len(parent)
            parent.append(label)
            runs.append((y, int(start), int(stop)))
            for other_start, other_stop, other in previous:
                if other_start < stop and start < other_stop:
                    parent[find(other)] = find(label)
            current.append((int(start), int(stop), label))
        previous = current

    if not runs:
        return np.zeros_like(mask)
    areas = {}
    for label, (_, start, stop) in enumerate(runs):
        root = find(label)
        areas[root] = areas.get(root, 0) + stop - start
    winner = max(areas, key=areas.get)
    out = np.zeros_like(mask)
    for label, (y, start, stop) in enumerate(runs):
        if find(label) == winner:
            out[y, start:stop] = True
    return out


def fill_holes(mask):
    """Background is whatever floods in from the border; the rest is the bake."""
    outside = largest_blob_from_border(~mask)
    return ~outside


def largest_blob_from_border(mask):
    seeded = np.zeros_like(mask)
    seeded[0, :], seeded[-1, :], seeded[:, 0], seeded[:, -1] = (
        mask[0, :], mask[-1, :], mask[:, 0], mask[:, -1],
    )
    while True:
        grown = seeded.copy()
        grown[1:, :] |= seeded[:-1, :]
        grown[:-1, :] |= seeded[1:, :]
        grown[:, 1:] |= seeded[:, :-1]
        grown[:, :-1] |= seeded[:, 1:]
        grown &= mask
        if (grown == seeded).all():
            return seeded
        seeded = grown


def morph(mask, radius, grow):
    size = radius * 2 + 1
    image = Image.fromarray((mask * 255).astype(np.uint8))
    image = image.filter(ImageFilter.MaxFilter(size) if grow else ImageFilter.MinFilter(size))
    return np.asarray(image) > 127


def cut_out(path):
    photo = Image.open(path).convert("RGB")
    work = np.asarray(photo)
    mask = foreground_mask(work)
    mask = morph(mask, 5, grow=True)    # close gaps left by dark chocolate
    mask = morph(mask, 5, grow=False)
    mask = morph(mask, 3, grow=False)   # break links to shadow or crumbs
    mask = largest_blob(mask)
    mask = morph(mask, 2, grow=True)    # stops just inside the edge, leaving no background fringe
    mask = fill_holes(mask)

    alpha = Image.fromarray((mask * 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.6))
    alpha = np.clip((np.asarray(alpha, dtype=np.float32) - 110) * (255 / 90), 0, 255).astype(np.uint8)

    ys, xs = np.nonzero(mask)
    centre_x, centre_y = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2
    half = int(max(xs.max() - xs.min(), ys.max() - ys.min()) * (0.5 + PADDING))

    rgba = np.dstack((work, alpha))
    canvas = Image.new("RGBA", (half * 2, half * 2), (0, 0, 0, 0))
    canvas.paste(Image.fromarray(rgba, "RGBA"), (half - centre_x, half - centre_y))
    return canvas.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS), half * 2


def trim_to_ellipse(image, cx, cy, rx, ry):
    size = image.width
    ys, xs = np.mgrid[0:size, 0:size] / size
    distance = ((xs - cx) / rx) ** 2 + ((ys - cy) / ry) ** 2
    falloff = np.clip((1.02 - distance) / 0.04, 0, 1)
    rgba = np.array(image)
    rgba[..., 3] = (rgba[..., 3] * falloff).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def main():
    source, output = Path(sys.argv[1]), Path(sys.argv[2])
    output.mkdir(parents=True, exist_ok=True)
    for slug in sys.argv[3:] or DEFAULT_SLUGS:
        cutout, side = cut_out(source / f"{slug}.jpg")
        if slug in ELLIPSE_TRIM:
            cutout = trim_to_ellipse(cutout, *ELLIPSE_TRIM[slug])
        cutout.save(output / f"{slug}.webp", quality=88, method=6)
        print(f"{slug}: source square {side}px")


if __name__ == "__main__":
    main()
