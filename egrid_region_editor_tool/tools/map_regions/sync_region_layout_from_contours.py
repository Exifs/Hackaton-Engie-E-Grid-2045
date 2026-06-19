#!/usr/bin/env python3
"""
Sync Godot region marker layout from generated map contours.

The game reads normalized x/y coordinates from region_layout.json at runtime.
This tool precomputes those coordinates from polygon centroids so the map view
does not spend time deriving marker positions while rendering.
"""
from __future__ import annotations

import argparse
import copy
import csv
import json
import math
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence, Tuple

Point = Tuple[float, float]
Component = List[Point]

REGION_NOTE = "Capital marker position precomputed from polygon centroid; gameplay slot metadata preserved."
LAYOUT_NOTE = (
    "Capital marker positions are precomputed from area-weighted polygon centroids "
    "in generated map contours. Godot reads x/y directly at runtime."
)
CSV_FIELDS = [
    "region_id",
    "display_name",
    "x",
    "y",
    "hitbox_radius",
    "slot_anchor_dx",
    "slot_anchor_dy",
    "slot_grid_cols",
    "slot_grid_rows",
    "slot_spacing",
    "notes",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Precompute region layout marker positions from contour polygons.")
    parser.add_argument("--contours", required=True, type=Path, help="regions_contours.json with polygon components.")
    parser.add_argument("--layout-in", required=True, type=Path, help="Existing region_layout.json to preserve metadata.")
    parser.add_argument("--json-out", required=True, type=Path, help="Updated region_layout.json output path.")
    parser.add_argument("--csv-out", type=Path, default=None, help="Optional updated region_layout.csv mirror.")
    parser.add_argument("--precision", type=int, default=6, help="Decimal precision for normalized x/y values.")
    return parser.parse_args()


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def write_csv(path: Path, regions: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for region_id, region in regions.items():
            row = {field: region.get(field, "") for field in CSV_FIELDS}
            row["region_id"] = region_id
            writer.writerow(row)


def parse_image_size(raw_size: Any) -> Point:
    if not isinstance(raw_size, list) or len(raw_size) < 2:
        raise ValueError("Contours JSON must contain image_size: [width, height].")

    width = float(raw_size[0])
    height = float(raw_size[1])
    if width <= 0.0 or height <= 0.0:
        raise ValueError(f"Invalid contour image_size: {raw_size!r}")
    return width, height


def parse_components(raw_components: Any) -> List[Component]:
    components: List[Component] = []
    if not isinstance(raw_components, list):
        return components

    for raw_component in raw_components:
        if not isinstance(raw_component, list):
            continue
        component: Component = []
        for raw_point in raw_component:
            if not isinstance(raw_point, list) or len(raw_point) < 2:
                continue
            try:
                x = float(raw_point[0])
                y = float(raw_point[1])
            except (TypeError, ValueError):
                continue
            if math.isfinite(x) and math.isfinite(y):
                component.append((x, y))
        if len(component) >= 3:
            components.append(component)
    return components


def polygon_centroid(component: Sequence[Point]) -> Tuple[Point, float]:
    area2 = 0.0
    centroid_x = 0.0
    centroid_y = 0.0
    point_count = len(component)

    for index in range(point_count):
        x0, y0 = component[index]
        x1, y1 = component[(index + 1) % point_count]
        cross = x0 * y1 - x1 * y0
        area2 += cross
        centroid_x += (x0 + x1) * cross
        centroid_y += (y0 + y1) * cross

    if abs(area2) < 1e-6:
        return (0.0, 0.0), 0.0

    return (centroid_x / (3.0 * area2), centroid_y / (3.0 * area2)), abs(area2) / 2.0


def average_point(points: Iterable[Point]) -> Point:
    total_x = 0.0
    total_y = 0.0
    count = 0
    for x, y in points:
        total_x += x
        total_y += y
        count += 1

    if count == 0:
        raise ValueError("Cannot compute a centroid without polygon points.")
    return total_x / count, total_y / count


def area_weighted_centroid(components: Sequence[Component]) -> Point:
    weighted_x = 0.0
    weighted_y = 0.0
    total_area = 0.0

    for component in components:
        centroid, area = polygon_centroid(component)
        if area <= 0.0:
            continue
        weighted_x += centroid[0] * area
        weighted_y += centroid[1] * area
        total_area += area

    if total_area > 0.0:
        return weighted_x / total_area, weighted_y / total_area

    return average_point(point for component in components for point in component)


def compute_normalized_centroids(contours: Dict[str, Any], precision: int) -> Dict[str, Point]:
    image_width, image_height = parse_image_size(contours.get("image_size"))
    raw_regions = contours.get("regions", {})
    if not isinstance(raw_regions, dict):
        raise ValueError("Contours JSON must contain a regions dictionary.")

    centroids: Dict[str, Point] = {}
    for region_id, raw_region in raw_regions.items():
        if not isinstance(raw_region, dict):
            continue
        components = parse_components(raw_region.get("components", []))
        if not components:
            raise ValueError(f"Missing polygon components for region {region_id}.")

        centroid_x, centroid_y = area_weighted_centroid(components)
        centroids[str(region_id)] = (
            round(centroid_x / image_width, precision),
            round(centroid_y / image_height, precision),
        )
    return centroids


def sync_layout(layout: Dict[str, Any], centroids: Dict[str, Point]) -> Dict[str, Any]:
    synced = copy.deepcopy(layout)
    raw_regions = synced.get("regions", {})
    if not isinstance(raw_regions, dict) or not raw_regions:
        raise ValueError("Layout JSON must contain a non-empty regions dictionary.")

    synced["schema_version"] = "region_layout_centroids_v1"
    synced["coordinate_system"] = "normalized_map_0_1"
    synced["origin"] = "top_left"
    synced["source_of_truth"] = True
    synced["notes"] = LAYOUT_NOTE
    synced["position_source"] = "area_weighted_polygon_centroid_from_regions_contours"

    missing = sorted(set(raw_regions.keys()) - set(centroids.keys()))
    if missing:
        raise ValueError(f"Missing contours for layout regions: {', '.join(missing)}")

    for region_id, region in raw_regions.items():
        if not isinstance(region, dict):
            raise ValueError(f"Invalid layout entry for region {region_id}.")
        centroid_x, centroid_y = centroids[str(region_id)]
        region["x"] = centroid_x
        region["y"] = centroid_y
        region["notes"] = REGION_NOTE

    return synced


def main() -> int:
    args = parse_args()
    contours = read_json(args.contours)
    layout = read_json(args.layout_in)
    centroids = compute_normalized_centroids(contours, args.precision)
    synced = sync_layout(layout, centroids)

    write_json(args.json_out, synced)
    if args.csv_out is not None:
        write_csv(args.csv_out, synced["regions"])

    print(f"Synced {len(synced['regions'])} region marker positions from polygon centroids.")
    print(f"JSON: {args.json_out}")
    if args.csv_out is not None:
        print(f"CSV: {args.csv_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
