@tool
class_name EGridComponentBitmapText
extends Control

const DEFAULT_FONT_ATLAS_PATH := "res://assets/ui/menu/font/egrid_2045_menu_font_atlas_white.png"
const FONT_MANIFEST_PATH := "res://assets/ui/menu/font/egrid_2045_menu_font_manifest.json"
const CELL_W := 80.0
const CELL_H := 112.0
const COLS := 16
const CHARSET := " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"

@export var atlas_texture: Texture2D:
	set(value):
		atlas_texture = value
		queue_redraw()

@export_multiline var text := "":
	set(value):
		text = value
		queue_redraw()

@export var font_color := Color("#e0e8e8"):
	set(value):
		font_color = value
		queue_redraw()

@export var scale_px := 0.14:
	set(value):
		scale_px = value
		queue_redraw()

@export var min_scale_px := 0.10
@export var max_scale_px := 0.24
@export var fit_to_width := true
@export var letter_spacing := 0.0
@export var line_spacing := 2.0
@export var uppercase_style := false
@export_enum("left", "center", "right") var horizontal_alignment := "left":
	set(value):
		horizontal_alignment = value
		queue_redraw()

@export_enum("top", "center", "bottom") var vertical_alignment := "center":
	set(value):
		vertical_alignment = value
		queue_redraw()

var _map := {}
var _metrics := {}
var _glyph_bounds := {}


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	if atlas_texture == null:
		atlas_texture = load(DEFAULT_FONT_ATLAS_PATH) as Texture2D
	_build_map()
	_load_metrics()
	_build_glyph_bounds()
	queue_redraw()


func _notification(what: int) -> void:
	if what == NOTIFICATION_ENTER_TREE:
		_build_map()
		_load_metrics()
		_build_glyph_bounds()
	if what == NOTIFICATION_RESIZED:
		queue_redraw()


func _draw() -> void:
	if atlas_texture == null:
		return

	if _map.is_empty():
		_build_map()

	var lines := text.split("\n")
	var text_scale := _resolved_scale(lines)
	var glyph_height := CELL_H * text_scale
	var total_height := float(lines.size()) * glyph_height + maxf(0.0, float(lines.size() - 1)) * line_spacing
	var y := _aligned_y(total_height)

	for line in lines:
		var line_width := _line_width(line, text_scale)
		var x := _aligned_x(line_width)

		for i in line.length():
			var c := _normalize_char(line.substr(i, 1))
			var idx: int = _map.get(c, 0)
			var col := idx % COLS
			var row := int(float(idx) / float(COLS))
			var source_rect := _glyph_source_rect(c, col, row)
			var target_rect := Rect2(
				x,
				y + _glyph_y_offset(c, text_scale),
				source_rect.size.x * text_scale,
				source_rect.size.y * text_scale
			)
			draw_texture_rect_region(atlas_texture, target_rect, source_rect, font_color)
			x += _glyph_advance(c, text_scale) + letter_spacing

		y += glyph_height + line_spacing


func _build_map() -> void:
	_map.clear()
	for i in CHARSET.length():
		_map[CHARSET.substr(i, 1)] = i


func _load_metrics() -> void:
	if not _metrics.is_empty():
		return

	if not FileAccess.file_exists(FONT_MANIFEST_PATH):
		return

	var file := FileAccess.open(FONT_MANIFEST_PATH, FileAccess.READ)
	if file == null:
		return

	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return

	var metric_data = parsed.get("metrics", {})
	if typeof(metric_data) == TYPE_DICTIONARY:
		_metrics = metric_data


func _build_glyph_bounds() -> void:
	if atlas_texture == null or not _glyph_bounds.is_empty():
		return

	var image := atlas_texture.get_image()
	if image == null:
		return

	for character in _map.keys():
		var idx: int = _map[character]
		var cell_x := int(idx % COLS) * int(CELL_W)
		var cell_y := int(float(idx) / float(COLS)) * int(CELL_H)
		var min_x := int(CELL_W)
		var min_y := int(CELL_H)
		var max_x := -1
		var max_y := -1

		for y in int(CELL_H):
			for x in int(CELL_W):
				var pixel := image.get_pixel(cell_x + x, cell_y + y)
				if pixel.a > 0.05:
					min_x = mini(min_x, x)
					min_y = mini(min_y, y)
					max_x = maxi(max_x, x)
					max_y = maxi(max_y, y)

		if max_x >= min_x and max_y >= min_y:
			_glyph_bounds[character] = Rect2(cell_x + min_x, cell_y + min_y, max_x - min_x + 1, max_y - min_y + 1)


func _normalize_char(character: String) -> String:
	if _map.has(character):
		return character

	if uppercase_style:
		var upper := character.to_upper()
		if _map.has(upper):
			return upper

	return " "


func _resolved_scale(lines: PackedStringArray) -> float:
	var resolved := scale_px

	if fit_to_width and size.x > 0.0:
		var widest := 0.0
		for line in lines:
			widest = maxf(widest, _line_width(line, scale_px))

		if widest > size.x and widest > 0.0:
			resolved = scale_px * (size.x / widest)

	if size.y > 0.0 and lines.size() > 0:
		var total_height := float(lines.size()) * CELL_H * resolved + maxf(0.0, float(lines.size() - 1)) * line_spacing
		if total_height > size.y:
			resolved *= size.y / total_height

	return clampf(resolved, min_scale_px, max_scale_px)


func _line_width(line: String, text_scale: float) -> float:
	if line.is_empty():
		return 0.0

	var width := 0.0
	for i in line.length():
		var character := _normalize_char(line.substr(i, 1))
		width += _glyph_advance(character, text_scale)
		if i < line.length() - 1:
			width += letter_spacing

	return width


func _aligned_x(line_width: float) -> float:
	if horizontal_alignment == "center":
		return maxf(0.0, (size.x - line_width) * 0.5)

	if horizontal_alignment == "right":
		return maxf(0.0, size.x - line_width)

	return 0.0


func _aligned_y(total_height: float) -> float:
	if vertical_alignment == "top":
		return 0.0

	if vertical_alignment == "bottom":
		return maxf(0.0, size.y - total_height)

	return maxf(0.0, (size.y - total_height) * 0.5)


func _glyph_source_rect(character: String, col: int, row: int) -> Rect2:
	if _glyph_bounds.has(character):
		return _glyph_bounds[character]

	return Rect2(col * CELL_W, row * CELL_H, CELL_W, CELL_H)


func _glyph_advance(character: String, text_scale: float) -> float:
	var metric = _metrics.get(character, {})
	if typeof(metric) == TYPE_DICTIONARY and metric.has("advance"):
		return float(metric["advance"]) * text_scale

	return CELL_W * text_scale


func _glyph_y_offset(character: String, text_scale: float) -> float:
	if not _glyph_bounds.has(character):
		return 0.0

	var source_rect: Rect2 = _glyph_bounds[character]
	var source_row_y := floorf(source_rect.position.y / CELL_H) * CELL_H
	return (source_rect.position.y - source_row_y) * text_scale
