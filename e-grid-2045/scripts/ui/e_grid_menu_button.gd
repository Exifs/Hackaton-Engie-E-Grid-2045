@tool
class_name EGridMenuButton
extends Button

const DEFAULT_SPRITESHEET_PATH := "res://assets/ui/menu/menu_button_spritesheet.png"
const DEFAULT_NORMAL_FONT_ATLAS_PATH := "res://assets/ui/menu/font/egrid_2045_menu_font_atlas_normal.png"
const DEFAULT_ACTIVE_FONT_ATLAS_PATH := "res://assets/ui/menu/font/egrid_2045_menu_font_atlas_hover.png"
const E_GRID_MENU_BITMAP_TEXT_SCRIPT := preload("res://scripts/ui/e_grid_menu_bitmap_text.gd")
const CYAN := Color("#58d8e8")
const BITMAP_CELL_W := 80.0
const BITMAP_CELL_H := 112.0

@export var button_text := "BUTTON"
@export var action_name := ""
@export var fallback_label := ""
@export_file("*.png") var spritesheet_path := DEFAULT_SPRITESHEET_PATH
@export_file("*.png") var normal_font_atlas_path := DEFAULT_NORMAL_FONT_ATLAS_PATH
@export_file("*.png") var active_font_atlas_path := DEFAULT_ACTIVE_FONT_ATLAS_PATH
@export_range(2, 8, 1) var frame_count := 2
@export_range(0, 7, 1) var normal_frame := 0
@export_range(0, 7, 1) var active_frame := 1
@export var letter_spacing := 2.0
@export var max_text_scale := 0.43

var _normal_texture: Texture2D
var _active_texture: Texture2D
var _normal_font_atlas: Texture2D
var _active_font_atlas: Texture2D
var _text_layer: Control


func _ready() -> void:
	text = ""
	flat = true
	focus_mode = Control.FOCUS_ALL
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	tooltip_text = get_display_label()
	_install_empty_button_styles()
	_load_sprite_frames()
	_load_font_atlases()
	_setup_text_layer()

	mouse_entered.connect(_request_redraw)
	mouse_exited.connect(_request_redraw)
	focus_entered.connect(_request_redraw)
	focus_exited.connect(_request_redraw)
	button_down.connect(_request_redraw)
	button_up.connect(_request_redraw)
	resized.connect(_request_redraw)


func set_button_text(value: String) -> void:
	button_text = value
	tooltip_text = get_display_label()
	if _text_layer != null:
		_text_layer.set("text", button_text)
	queue_redraw()


func get_display_label() -> String:
	if not fallback_label.strip_edges().is_empty():
		return fallback_label

	return button_text


func _install_empty_button_styles() -> void:
	add_theme_stylebox_override("normal", StyleBoxEmpty.new())
	add_theme_stylebox_override("hover", StyleBoxEmpty.new())
	add_theme_stylebox_override("pressed", StyleBoxEmpty.new())
	add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	add_theme_stylebox_override("disabled", StyleBoxEmpty.new())


func _load_sprite_frames() -> void:
	var sheet := load(spritesheet_path) as Texture2D

	if sheet == null:
		push_error("Impossible de charger la spritesheet de bouton: %s" % spritesheet_path)
		return

	var safe_frame_count := maxi(frame_count, 1)
	var frame_height := int(float(sheet.get_height()) / float(safe_frame_count))
	var clamped_normal := clampi(normal_frame, 0, safe_frame_count - 1)
	var clamped_active := clampi(active_frame, 0, safe_frame_count - 1)

	_normal_texture = _create_frame_texture(sheet, clamped_normal, frame_height)
	_active_texture = _create_frame_texture(sheet, clamped_active, frame_height)


func _load_font_atlases() -> void:
	_normal_font_atlas = _load_texture_from_png(normal_font_atlas_path)
	_active_font_atlas = _load_texture_from_png(active_font_atlas_path)


func _load_texture_from_png(path: String) -> Texture2D:
	var texture := load(path) as Texture2D

	if texture == null:
		push_error("Impossible de charger la texture UI: %s" % path)
		return null

	return texture


func _create_frame_texture(sheet: Texture2D, frame_index: int, frame_height: int) -> Texture2D:
	var frame := AtlasTexture.new()
	frame.atlas = sheet
	frame.region = Rect2(0, frame_index * frame_height, sheet.get_width(), frame_height)
	return frame


func _setup_text_layer() -> void:
	_text_layer = get_node_or_null("BitmapText") as Control

	if _text_layer == null:
		_text_layer = E_GRID_MENU_BITMAP_TEXT_SCRIPT.new() as Control
		_text_layer.name = "BitmapText"
		add_child(_text_layer)

	_text_layer.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_text_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_text_layer.set("text", button_text)
	_text_layer.set("center", true)
	_text_layer.set("letter_spacing", letter_spacing)
	_update_text_layer()


func _draw() -> void:
	_draw_button_sprite()


func _draw_button_sprite() -> void:
	var texture := _active_texture if _uses_active_state() else _normal_texture

	if texture != null:
		draw_texture_rect(texture, Rect2(Vector2.ZERO, size), false)
		return

	draw_rect(Rect2(Vector2.ZERO, size), Color("#081014d8"), true)
	draw_rect(Rect2(Vector2.ZERO, size).grow(-2.0), Color(CYAN, 0.65), false, 2.0)


func _uses_active_state() -> bool:
	return is_hovered() or has_focus() or button_pressed


func _request_redraw() -> void:
	_update_text_layer()
	queue_redraw()


func _update_text_layer() -> void:
	if _text_layer == null:
		return

	var text_scale := _get_text_scale()
	var text_height := BITMAP_CELL_H * text_scale
	var y := maxf(0.0, (size.y - text_height) * 0.5 - size.y * 0.02)

	_text_layer.position = Vector2(0.0, y)
	_text_layer.size = Vector2(size.x, text_height)
	_text_layer.set("scale_px", text_scale)
	_text_layer.set("letter_spacing", letter_spacing)
	_text_layer.set("atlas_texture", _active_font_atlas if _uses_active_state() else _normal_font_atlas)
	_text_layer.queue_redraw()


func _get_text_scale() -> float:
	if size.x <= 0.0 or size.y <= 0.0:
		return max_text_scale

	var desired := size.y * 0.39 / BITMAP_CELL_H
	var safe_character_count := maxi(button_text.length(), 1)
	var width_limited := size.x * 0.72 / (float(safe_character_count) * BITMAP_CELL_W)

	return clampf(minf(desired, width_limited), 0.18, max_text_scale)
