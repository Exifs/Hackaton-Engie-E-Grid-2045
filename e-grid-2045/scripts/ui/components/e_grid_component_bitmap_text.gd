@tool
class_name EGridComponentBitmapText
extends Control

const DEFAULT_FONT_ATLAS_PATH := "res://assets/ui/menu/font/egrid_2045_menu_font_atlas_white.png"
const FONT_MANIFEST_PATH := "res://assets/ui/menu/font/egrid_2045_menu_font_manifest.json"
const CELL_W := 80.0
const CELL_H := 112.0
const COLS := 16
const CHARSET := " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"

static var _shared_map: Dictionary = {}
static var _shared_metrics: Dictionary = {}
static var _shared_glyph_bounds_by_atlas: Dictionary = {}

@export var atlas_texture: Texture2D:
	set(value):
		if atlas_texture == value:
			return
		atlas_texture = value
		_glyph_bounds_cache_key = ""
		queue_redraw()

@export_multiline var text := "":
	set(value):
		if text == value:
			return
		text = value
		queue_redraw()

@export var font_color := Color("#e0e8e8"):
	set(value):
		if font_color == value:
			return
		font_color = value
		queue_redraw()

@export_range(1, 4, 1) var opacity_passes := 1:
	set(value):
		opacity_passes = maxi(1, int(value))
		queue_redraw()

@export var shadow_enabled := false:
	set(value):
		shadow_enabled = value
		queue_redraw()

@export var shadow_color := Color("#020608cc"):
	set(value):
		shadow_color = value
		queue_redraw()

@export var shadow_offset := Vector2(1.0, 1.0):
	set(value):
		shadow_offset = value
		queue_redraw()

@export var outline_enabled := false:
	set(value):
		outline_enabled = value
		queue_redraw()

@export var outline_color := Color("#020608dd"):
	set(value):
		outline_color = value
		queue_redraw()

@export_range(0.5, 3.0, 0.5) var outline_size := 1.0:
	set(value):
		outline_size = value
		queue_redraw()

@export var scale_px := 0.14:
	set(value):
		if is_equal_approx(scale_px, value):
			return
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
		if horizontal_alignment == value:
			return
		horizontal_alignment = value
		queue_redraw()

@export_enum("top", "center", "bottom") var vertical_alignment := "center":
	set(value):
		if vertical_alignment == value:
			return
		vertical_alignment = value
		queue_redraw()

var _map := {}
var _metrics := {}
var _glyph_bounds := {}
var _glyph_bounds_cache_key := ""


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	if atlas_texture == null:
		atlas_texture = load(DEFAULT_FONT_ATLAS_PATH) as Texture2D
	_ensure_font_data()
	queue_redraw()


func _notification(what: int) -> void:
	if what == NOTIFICATION_ENTER_TREE:
		_ensure_font_data()
	if what == NOTIFICATION_RESIZED:
		queue_redraw()


func _draw() -> void:
	if atlas_texture == null:
		return

	_ensure_font_data()

	var lines := text.split("\n")
	var text_scale := _resolved_scale(lines)
	var glyph_height := CELL_H * text_scale
	var total_height := float(lines.size()) * glyph_height + maxf(0.0, float(lines.size() - 1)) * line_spacing

	if shadow_enabled and shadow_color.a > 0.0:
		_draw_text_pass(lines, text_scale, glyph_height, total_height, shadow_offset, shadow_color)

	if outline_enabled and outline_color.a > 0.0 and outline_size > 0.0:
		var offsets := [
			Vector2(-outline_size, 0.0),
			Vector2(outline_size, 0.0),
			Vector2(0.0, -outline_size),
			Vector2(0.0, outline_size),
			Vector2(-outline_size, -outline_size),
			Vector2(outline_size, -outline_size),
			Vector2(-outline_size, outline_size),
			Vector2(outline_size, outline_size),
		]
		for offset in offsets:
			_draw_text_pass(lines, text_scale, glyph_height, total_height, offset, outline_color)

	for _pass_index in range(opacity_passes):
		_draw_text_pass(lines, text_scale, glyph_height, total_height, Vector2.ZERO, font_color)


func _draw_text_pass(
	lines: PackedStringArray,
	text_scale: float,
	glyph_height: float,
	total_height: float,
	pass_offset: Vector2,
	color: Color
) -> void:
	var y := _aligned_y(total_height) + pass_offset.y
	for line in lines:
		var line_width := _line_width(line, text_scale)
		var x := _aligned_x(line_width) + pass_offset.x

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
			draw_texture_rect_region(atlas_texture, target_rect, source_rect, color)
			x += _glyph_advance(c, text_scale) + letter_spacing

		y += glyph_height + line_spacing


func _ensure_font_data() -> void:
	if _map.is_empty():
		_map = _get_shared_map()

	if _metrics.is_empty():
		_metrics = _get_shared_metrics()

	var atlas_key := _atlas_cache_key(atlas_texture)
	if atlas_key.is_empty() or atlas_key == _glyph_bounds_cache_key:
		return

	_glyph_bounds = _get_shared_glyph_bounds(atlas_texture, _map, atlas_key)
	_glyph_bounds_cache_key = atlas_key


static func _get_shared_map() -> Dictionary:
	if not _shared_map.is_empty():
		return _shared_map

	for i in CHARSET.length():
		_shared_map[CHARSET.substr(i, 1)] = i

	return _shared_map


static func _get_shared_metrics() -> Dictionary:
	if not _shared_metrics.is_empty():
		return _shared_metrics

	if not FileAccess.file_exists(FONT_MANIFEST_PATH):
		return {}

	var file := FileAccess.open(FONT_MANIFEST_PATH, FileAccess.READ)
	if file == null:
		return {}

	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return {}

	var metric_data = parsed.get("metrics", {})
	if typeof(metric_data) == TYPE_DICTIONARY:
		_shared_metrics = metric_data

	return _shared_metrics


static func _get_shared_glyph_bounds(atlas: Texture2D, glyph_map: Dictionary, atlas_key: String) -> Dictionary:
	if atlas == null:
		return {}

	if _shared_glyph_bounds_by_atlas.has(atlas_key):
		return _shared_glyph_bounds_by_atlas[atlas_key]

	var image := atlas.get_image()
	if image == null:
		return {}

	var bounds := {}
	for character in glyph_map.keys():
		var idx: int = glyph_map[character]
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
			bounds[character] = Rect2(cell_x + min_x, cell_y + min_y, max_x - min_x + 1, max_y - min_y + 1)

	_shared_glyph_bounds_by_atlas[atlas_key] = bounds
	return bounds


static func _atlas_cache_key(atlas: Texture2D) -> String:
	if atlas == null:
		return ""

	if not atlas.resource_path.is_empty():
		return atlas.resource_path

	return str(atlas.get_instance_id())


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
