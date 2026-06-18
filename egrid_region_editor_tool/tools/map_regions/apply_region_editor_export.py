#!/usr/bin/env python3
"""
Apply an E-Grid 2045 Region Shape Editor export to the Godot map assets.

This script consumes either:
- schema_version = region_editor_shapes_v1, exported by region_shape_editor_standalone.html
- schema_version = region_contours_v1, compatible with the runtime contour JSON

It writes:
- assets/map/generated/regions_contours.json
- assets/map/generated/region_id_mask.png, exact integer IDs 0..30, no antialiasing
- assets/map/generated/region_lut_default.png
- assets/map/generated/debug_region_overlay.png, if --debug
- assets/map/regions_master_template.svg, if --svg-out is provided
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence, Tuple
from xml.sax.saxutils import escape as xml_escape

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Pillow is required for mask/debug generation. Install with: python -m pip install Pillow"
    ) from exc

Point = Tuple[float, float]
Component = List[Point]


@dataclass(frozen=True)
class RegionMeta:
    id: int
    slug: str
    display_name: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Apply E-Grid region editor export.")
    parser.add_argument("--editor-export", required=True, type=Path, help="JSON exported by the region shape editor.")
    parser.add_argument("--background", required=True, type=Path, help="Map backdrop PNG.")
    parser.add_argument("--region-ids", required=True, type=Path, help="assets/map/region_ids.json")
    parser.add_argument("--out", required=True, type=Path, help="Output directory, usually assets/map/generated")
    parser.add_argument("--svg-out", type=Path, default=None, help="Optional SVG master output path.")
    parser.add_argument("--tolerance", type=float, default=0.0, help="Optional RDP simplification tolerance in pixels. 0 keeps editor points.")
    parser.add_argument("--debug", action="store_true", help="Write debug_region_overlay.png.")
    parser.add_argument("--allow-missing", action="store_true", help="Allow missing/empty regions for work in progress.")
    parser.add_argument("--no-mask", action="store_true", help="Do not write region_id_mask.png.")
    return parser.parse_args()


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def load_region_meta(path: Path) -> List[RegionMeta]:
    raw = read_json(path)
    regions = raw.get("regions", [])
    out: List[RegionMeta] = []
    for item in regions:
        out.append(RegionMeta(id=int(item["id"]), slug=str(item["slug"]), display_name=str(item["display_name"])))
    if len(out) != 30:
        raise ValueError(f"Expected 30 regions in {path}, found {len(out)}")
    ids = [r.id for r in out]
    if ids != list(range(1, 31)):
        raise ValueError(f"Region IDs must be exactly 1..30, got {ids}")
    return out


def extract_contours(raw: Dict[str, Any]) -> Dict[str, Any]:
    schema = raw.get("schema_version")
    if schema == "region_editor_shapes_v1":
        contours = raw.get("contours") or raw.get("region_contours")
        if not isinstance(contours, dict):
            raise ValueError("region_editor_shapes_v1 export must contain a 'contours' object")
        return contours
    if schema == "region_contours_v1":
        return raw
    if "regions" in raw:
        return raw
    raise ValueError(f"Unsupported export schema: {schema!r}")


def sanitize_components(value: Any) -> List[Component]:
    components: List[Component] = []
    if not isinstance(value, list):
        return components
    for comp in value:
        if not isinstance(comp, list):
            continue
        points: Component = []
        for p in comp:
            if not isinstance(p, list) or len(p) < 2:
                continue
            try:
                x = float(p[0])
                y = float(p[1])
            except (TypeError, ValueError):
                continue
            if math.isfinite(x) and math.isfinite(y):
                points.append((round(x, 2), round(y, 2)))
        if len(points) >= 3:
            components.append(points)
    return components


def point_segment_distance(p: Point, a: Point, b: Point) -> float:
    px, py = p
    ax, ay = a
    bx, by = b
    dx = bx - ax
    dy = by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def rdp(points: Sequence[Point], epsilon: float) -> List[Point]:
    if len(points) < 3:
        return list(points)
    start = points[0]
    end = points[-1]
    dmax = 0.0
    index = 0
    for i in range(1, len(points) - 1):
        d = point_segment_distance(points[i], start, end)
        if d > dmax:
            dmax = d
            index = i
    if dmax > epsilon:
        left = rdp(points[: index + 1], epsilon)
        right = rdp(points[index:], epsilon)
        return left[:-1] + right
    return [start, end]


def simplify_component(component: Component, tolerance: float) -> Component:
    if tolerance <= 0 or len(component) <= 4:
        return component
    closed = list(component) + [component[0]]
    simplified = rdp(closed, tolerance)
    if len(simplified) > 1 and simplified[0] == simplified[-1]:
        simplified = simplified[:-1]
    if len(simplified) < 3:
        return component[:3]
    return [(round(x, 2), round(y, 2)) for x, y in simplified]


def polygon_centroid(component: Component) -> Tuple[float, float, float]:
    area2 = 0.0
    cx = 0.0
    cy = 0.0
    n = len(component)
    for i in range(n):
        x0, y0 = component[i]
        x1, y1 = component[(i + 1) % n]
        cross = x0 * y1 - x1 * y0
        area2 += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    if abs(area2) < 1e-6:
        return 0.0, 0.0, 0.0
    return cx / (3.0 * area2), cy / (3.0 * area2), abs(area2) / 2.0


def compute_region_metrics(components: List[Component]) -> Dict[str, Any]:
    if not components:
        return {
            "centroid": [0, 0],
            "label_point": [0, 0],
            "slot_anchor": [0, 0],
            "bounds": [0, 0, 0, 0],
            "point_count": 0,
        }
    all_points = [p for comp in components for p in comp]
    min_x = min(p[0] for p in all_points)
    min_y = min(p[1] for p in all_points)
    max_x = max(p[0] for p in all_points)
    max_y = max(p[1] for p in all_points)
    total_weight = 0.0
    weighted_x = 0.0
    weighted_y = 0.0
    for comp in components:
        cx, cy, weight = polygon_centroid(comp)
        if weight > 0:
            total_weight += weight
            weighted_x += cx * weight
            weighted_y += cy * weight
    if total_weight > 0:
        centroid = [round(weighted_x / total_weight, 2), round(weighted_y / total_weight, 2)]
    else:
        centroid = [round(sum(p[0] for p in all_points) / len(all_points), 2), round(sum(p[1] for p in all_points) / len(all_points), 2)]
    return {
        "centroid": centroid,
        "label_point": centroid,
        "slot_anchor": centroid,
        "bounds": [round(min_x, 2), round(min_y, 2), round(max_x, 2), round(max_y, 2)],
        "point_count": len(all_points),
    }


def normalize_export(
    contours: Dict[str, Any],
    meta: List[RegionMeta],
    image_size: Tuple[int, int],
    tolerance: float,
    allow_missing: bool,
) -> Tuple[Dict[str, Any], List[str]]:
    warnings: List[str] = []
    raw_regions = contours.get("regions", {})
    if not isinstance(raw_regions, dict):
        raise ValueError("Contours JSON must contain a 'regions' object")

    out_regions: Dict[str, Any] = {}
    total_points = 0
    for item in meta:
        raw_region = raw_regions.get(item.slug)
        if raw_region is None:
            if not allow_missing:
                raise ValueError(f"Missing region in export: {item.slug}")
            warnings.append(f"missing region allowed: {item.slug}")
            components: List[Component] = []
        else:
            components = sanitize_components(raw_region.get("components", []))
        if tolerance > 0:
            components = [simplify_component(comp, tolerance) for comp in components]
        if not components:
            msg = f"empty region: {item.slug} ({item.display_name})"
            if not allow_missing:
                raise ValueError(msg)
            warnings.append(msg)
        metrics = compute_region_metrics(components)
        serializable_components = [[[round(x, 2), round(y, 2)] for x, y in comp] for comp in components]
        total_points += metrics["point_count"]
        out_regions[item.slug] = {
            "id": item.id,
            "display_name": item.display_name,
            "components": serializable_components,
            **metrics,
        }

    if total_points > 8000:
        warnings.append(f"critical point budget exceeded: {total_points} > 8000")
    elif total_points > 5000:
        warnings.append(f"point budget warning: {total_points} > 5000")

    out = {
        "schema_version": "region_contours_v1",
        "source_image": contours.get("source_image", "europe_map_backdrop_generated_clean_v1.png"),
        "image_size": [image_size[0], image_size[1]],
        "coordinate_system": "image_pixels_top_left",
        "editor_export_applied_at": datetime.now(timezone.utc).isoformat(),
        "simplification_tolerance_px": tolerance,
        "regions": out_regions,
        "point_budget": {"target_max": 5000, "warning_max": 5000, "critical_max": 8000},
        "total_point_count": total_points,
        "performance_warning": "critical_point_budget_exceeded" if total_points > 8000 else ("point_budget_warning" if total_points > 5000 else "ok"),
    }
    return out, warnings


def palette_rgba(region_id: int, alpha: int = 82) -> Tuple[int, int, int, int]:
    if region_id == 0:
        return (0, 0, 0, 0)
    hue = ((region_id * 37 + 188) % 360) / 60.0
    c = 0.75
    x = c * (1 - abs(hue % 2 - 1))
    if 0 <= hue < 1:
        r, g, b = c, x, 0
    elif 1 <= hue < 2:
        r, g, b = x, c, 0
    elif 2 <= hue < 3:
        r, g, b = 0, c, x
    elif 3 <= hue < 4:
        r, g, b = 0, x, c
    elif 4 <= hue < 5:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    m = 0.22
    return (int((r + m) * 255), int((g + m) * 255), int((b + m) * 255), alpha)


def write_lut(path: Path) -> None:
    img = Image.new("RGBA", (32, 1), (0, 0, 0, 0))
    px = img.load()
    for region_id in range(1, 31):
        px[region_id, 0] = palette_rgba(region_id, alpha=72)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def int_points(component: Sequence[Sequence[float]]) -> List[Tuple[int, int]]:
    return [(int(round(p[0])), int(round(p[1]))) for p in component]


def write_mask(path: Path, contours: Dict[str, Any], meta: List[RegionMeta], image_size: Tuple[int, int]) -> None:
    mask = Image.new("L", image_size, 0)
    draw = ImageDraw.Draw(mask)
    for item in meta:
        region = contours["regions"][item.slug]
        for component in region.get("components", []):
            if len(component) >= 3:
                draw.polygon(int_points(component), fill=item.id)
    path.parent.mkdir(parents=True, exist_ok=True)
    mask.save(path)
    histogram = mask.histogram()
    unique_ids = [i for i, count in enumerate(histogram) if count]
    illegal = [i for i in unique_ids if i < 0 or i > 30]
    if illegal:
        raise ValueError(f"Mask contains illegal IDs: {illegal}")


def write_debug_overlay(path: Path, background: Path, contours: Dict[str, Any], meta: List[RegionMeta], image_size: Tuple[int, int]) -> None:
    bg = Image.open(background).convert("RGBA")
    if bg.size != image_size:
        raise ValueError(f"Background size mismatch for debug overlay: {bg.size} != {image_size}")
    fill_layer = Image.new("RGBA", image_size, (0, 0, 0, 0))
    line_layer = Image.new("RGBA", image_size, (0, 0, 0, 0))
    fill_draw = ImageDraw.Draw(fill_layer)
    line_draw = ImageDraw.Draw(line_layer)
    font = ImageFont.load_default()
    for item in meta:
        region = contours["regions"][item.slug]
        fill = palette_rgba(item.id, alpha=72)
        stroke = (83, 238, 255, 210)
        for component in region.get("components", []):
            pts = int_points(component)
            if len(pts) >= 3:
                fill_draw.polygon(pts, fill=fill)
                line_draw.line(pts + [pts[0]], fill=stroke, width=2)
    composed = Image.alpha_composite(bg, fill_layer)
    composed = Image.alpha_composite(composed, line_layer)
    label_draw = ImageDraw.Draw(composed)
    for item in meta:
        region = contours["regions"][item.slug]
        x, y = region.get("label_point", [0, 0])
        if region.get("point_count", 0) <= 0:
            continue
        label = f"{item.id} {item.slug}"
        text_pos = (int(round(x)), int(round(y)))
        # Draw a compact dark backing; textbbox is not available on very old Pillow, fallback to rough metrics.
        try:
            bbox = label_draw.textbbox(text_pos, label, font=font, anchor="mm")
        except Exception:
            w = len(label) * 6
            h = 10
            bbox = (text_pos[0] - w // 2, text_pos[1] - h // 2, text_pos[0] + w // 2, text_pos[1] + h // 2)
        pad = 3
        label_draw.rectangle((bbox[0] - pad, bbox[1] - pad, bbox[2] + pad, bbox[3] + pad), fill=(0, 16, 24, 170), outline=(91, 238, 255, 160))
        label_draw.text(text_pos, label, font=font, fill=(235, 252, 255, 255), anchor="mm")
    path.parent.mkdir(parents=True, exist_ok=True)
    composed.save(path)


def points_attr(component: Sequence[Sequence[float]]) -> str:
    return " ".join(f"{round(float(p[0]), 2)},{round(float(p[1]), 2)}" for p in component)


def color_hex(region_id: int) -> str:
    r, g, b, _ = palette_rgba(region_id, alpha=255)
    return f"#{r:02x}{g:02x}{b:02x}"


def write_svg(path: Path, contours: Dict[str, Any], meta: List[RegionMeta], image_size: Tuple[int, int]) -> None:
    w, h = image_size
    lines = [
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}" version="1.1" id="egrid_regions_master_template">',
        '  <metadata>Exported from E-Grid 2045 Region Shape Editor. Background layer is a guide; region groups are editable semantic gameplay regions.</metadata>',
        '  <g id="background_locked" inkscape:groupmode="layer" inkscape:label="background_locked" sodipodi:insensitive="true">',
        f'    <image id="map_backdrop" href="europe_map_backdrop_generated_clean_v1.png" xlink:href="europe_map_backdrop_generated_clean_v1.png" x="0" y="0" width="{w}" height="{h}" preserveAspectRatio="none" opacity="1" />',
        '  </g>',
        '  <g id="region_shapes" inkscape:groupmode="layer" inkscape:label="region_shapes_editable">',
    ]
    for item in meta:
        region = contours["regions"][item.slug]
        lines.append(
            f'    <g id="region:{xml_escape(item.slug)}" data-region-id="{item.id}" data-region-slug="{xml_escape(item.slug)}" data-region-name="{xml_escape(item.display_name)}" style="fill:{color_hex(item.id)};fill-opacity:0.28;stroke:#31e6ff;stroke-width:1.5;stroke-opacity:0.72;vector-effect:non-scaling-stroke">'
        )
        for idx, component in enumerate(region.get("components", [])):
            lines.append(f'      <polygon id="region__{xml_escape(item.slug)}__{idx:02d}" points="{points_attr(component)}" />')
        lines.append('    </g>')
    lines += ['  </g>', '</svg>']
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def summarize(contours: Dict[str, Any], warnings: List[str], output_paths: Dict[str, Path], meta: List[RegionMeta]) -> None:
    print("E-Grid region editor export applied")
    print("====================================")
    print(f"image size: {contours['image_size'][0]} x {contours['image_size'][1]}")
    print(f"regions: {len(contours['regions'])}")
    print(f"total points: {contours['total_point_count']}")
    print(f"performance: {contours['performance_warning']}")
    print("")
    print("Per-region components / points:")
    for item in meta:
        region = contours["regions"][item.slug]
        print(f"  {item.id:02d} {item.slug:22s} components={len(region.get('components', [])):2d} points={region.get('point_count', 0):4d}")
    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"  - {warning}")
    print("\nWritten files:")
    for label, path in output_paths.items():
        print(f"  {label}: {path}")


def main() -> int:
    args = parse_args()
    if not args.editor_export.exists():
        raise SystemExit(f"Missing editor export: {args.editor_export}")
    if not args.background.exists():
        raise SystemExit(f"Missing background: {args.background}")
    if not args.region_ids.exists():
        raise SystemExit(f"Missing region IDs: {args.region_ids}")

    meta = load_region_meta(args.region_ids)
    raw_export = read_json(args.editor_export)
    raw_contours = extract_contours(raw_export)
    with Image.open(args.background) as bg:
        image_size = bg.size
    normalized, warnings = normalize_export(raw_contours, meta, image_size, args.tolerance, args.allow_missing)

    args.out.mkdir(parents=True, exist_ok=True)
    output_paths: Dict[str, Path] = {}

    contours_path = args.out / "regions_contours.json"
    write_json(contours_path, normalized)
    output_paths["contours"] = contours_path

    lut_path = args.out / "region_lut_default.png"
    write_lut(lut_path)
    output_paths["lut"] = lut_path

    if not args.no_mask:
        mask_path = args.out / "region_id_mask.png"
        write_mask(mask_path, normalized, meta, image_size)
        output_paths["mask"] = mask_path

    if args.debug:
        debug_path = args.out / "debug_region_overlay.png"
        write_debug_overlay(debug_path, args.background, normalized, meta, image_size)
        output_paths["debug_overlay"] = debug_path

    if args.svg_out:
        write_svg(args.svg_out, normalized, meta, image_size)
        output_paths["svg"] = args.svg_out

    summarize(normalized, warnings, output_paths, meta)
    if normalized["total_point_count"] > 8000:
        return 2
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
