@tool
class_name EGridSpriteSlider
extends Control

signal value_changed(value: float)

const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")
const GENERATED_SLIDER_ROOT := "res://assets/ui/components/egrid_2045_ui_component_pack_concept_v3/generated/sliders"

static var _texture_cache: Dictionary = {}

@export_enum("horizontal", "vertical") var orientation := "horizontal":
	set(value):
		orientation = value
		_sync_component_size()
		queue_redraw()

@export var min_value := 0.0:
	set(value):
		min_value = value
		set_value(slider_value, false)

@export var max_value := 100.0:
	set(value):
		max_value = value
		set_value(slider_value, false)

@export var step := 1.0

var _slider_value := 50.0

@export var slider_value: float:
	get:
		return _slider_value
	set(value):
		set_value(value, false)

@export_enum("normal", "warning", "critical") var semantic_state := "normal":
	set(value):
		semantic_state = value
		queue_redraw()

@export var enabled := true:
	set(value):
		enabled = value
		mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if enabled else Control.CURSOR_ARROW
		queue_redraw()

@export_range(4, 128, 1) var visual_steps := 32:
	set(value):
		visual_steps = value
		queue_redraw()

@export_range(1.0, 30.0, 0.5) var smooth_speed := 14.0
@export var show_value_label := true:
	set(value):
		show_value_label = value
		_sync_label()

@export var value_suffix := "%":
	set(value):
		value_suffix = value
		_sync_label()

@export var horizontal_track_rect := Rect2(28.0, 18.0, 284.0, 8.0)
@export var vertical_track_rect := Rect2(23.0, 28.0, 8.0, 164.0)
@export var horizontal_handle_size := Vector2(18.0, 24.0)
@export var vertical_handle_size := Vector2(28.0, 18.0)

@export_group("Clean Slider Assets")
@export_file("*.png") var horizontal_base_texture_path := GENERATED_SLIDER_ROOT + "/slider_horizontal_base_clean.png":
	set(value):
		horizontal_base_texture_path = value
		queue_redraw()
@export_file("*.png") var horizontal_fill_texture_path := GENERATED_SLIDER_ROOT + "/slider_horizontal_fill_tile.png":
	set(value):
		horizontal_fill_texture_path = value
		queue_redraw()
@export_file("*.png") var horizontal_handle_texture_path := GENERATED_SLIDER_ROOT + "/slider_horizontal_handle.png":
	set(value):
		horizontal_handle_texture_path = value
		queue_redraw()
@export_file("*.png") var vertical_base_texture_path := GENERATED_SLIDER_ROOT + "/slider_vertical_base_clean.png":
	set(value):
		vertical_base_texture_path = value
		queue_redraw()
@export_file("*.png") var vertical_fill_texture_path := GENERATED_SLIDER_ROOT + "/slider_vertical_fill_tile.png":
	set(value):
		vertical_fill_texture_path = value
		queue_redraw()
@export_file("*.png") var vertical_handle_texture_path := GENERATED_SLIDER_ROOT + "/slider_vertical_handle.png":
	set(value):
		vertical_handle_texture_path = value
		queue_redraw()

var _display_value := 50.0
var _dragging := false
var _value_label: Label


func _ready() -> void:
	focus_mode = Control.FOCUS_ALL
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if enabled else Control.CURSOR_ARROW
	_display_value = clampf(slider_value, _safe_min(), _safe_max())
	_cache_nodes()
	_sync_component_size()
	_sync_label()
	set_process(not Engine.is_editor_hint())


func _process(delta: float) -> void:
	var target := clampf(slider_value, _safe_min(), _safe_max())
	var blend := 1.0 - exp(-smooth_speed * delta)
	_display_value = lerpf(_display_value, target, blend)

	if absf(_display_value - target) < 0.01:
		_display_value = target

	_sync_label()
	queue_redraw()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_sync_label()
		queue_redraw()


func _gui_input(event: InputEvent) -> void:
	if not enabled:
		return

	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		_dragging = event.pressed
		if event.pressed:
			grab_focus()
			_apply_pointer_position(event.position)
		queue_redraw()
		accept_event()

	if event is InputEventMouseMotion and _dragging:
		_apply_pointer_position(event.position)
		accept_event()

	if event.is_action_pressed("ui_left") or event.is_action_pressed("ui_down"):
		set_value(slider_value - _keyboard_step(), true)
		accept_event()

	if event.is_action_pressed("ui_right") or event.is_action_pressed("ui_up"):
		set_value(slider_value + _keyboard_step(), true)
		accept_event()


func _draw() -> void:
	var fitted_rect := E_GRID_UI_ATLAS.get_aspect_fit_rect(_component_name(), size)
	var base_texture := _load_texture(_base_texture_path())
	if base_texture == null:
		draw_rect(fitted_rect, Color("#081115e6"), true)
	else:
		var base_modulate := Color(1.0, 1.0, 1.0, 0.45) if not enabled else Color.WHITE
		draw_texture_rect(base_texture, fitted_rect, false, base_modulate)

	var percent := _get_visual_percent(_display_value)
	_draw_continuous_fill(fitted_rect, percent)
	_draw_handle(fitted_rect, percent)


func set_value(value: float, should_emit := true) -> void:
	var next_value := _snap_value(clampf(value, _safe_min(), _safe_max()))

	if is_equal_approx(slider_value, next_value):
		_slider_value = next_value
		_sync_label()
		queue_redraw()
		return

	_slider_value = next_value
	_sync_label()
	queue_redraw()

	if should_emit:
		value_changed.emit(slider_value)


func get_value() -> float:
	return slider_value


func _cache_nodes() -> void:
	_value_label = get_node_or_null("ValueLabel") as Label


func _sync_component_size() -> void:
	var cell_size := E_GRID_UI_ATLAS.get_cell_size(_component_name())
	if cell_size != Vector2i.ZERO:
		custom_minimum_size = Vector2(cell_size)


func _sync_label() -> void:
	if _value_label == null:
		_cache_nodes()

	if _value_label == null:
		return

	_value_label.visible = show_value_label
	_value_label.text = _format_value(slider_value)
	_value_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_value_label.add_theme_color_override("font_color", Color("#e0e8e8"))


func _component_name() -> String:
	return "slider_vertical_states" if orientation == "vertical" else "slider_horizontal_states"


func _apply_pointer_position(local_position: Vector2) -> void:
	var fitted_rect := E_GRID_UI_ATLAS.get_aspect_fit_rect(_component_name(), size)
	var percent := 0.0

	if orientation == "vertical":
		percent = 1.0 - clampf((local_position.y - fitted_rect.position.y) / maxf(fitted_rect.size.y, 1.0), 0.0, 1.0)
	else:
		percent = clampf((local_position.x - fitted_rect.position.x) / maxf(fitted_rect.size.x, 1.0), 0.0, 1.0)

	set_value(lerpf(_safe_min(), _safe_max(), percent), true)


func _get_visual_percent(value: float) -> float:
	var percent := inverse_lerp(_safe_min(), _safe_max(), value)
	return clampf(percent, 0.0, 1.0)


func _draw_continuous_fill(fitted_rect: Rect2, percent: float) -> void:
	var track_rect := _track_rect(fitted_rect)
	var color := _fill_color()

	if orientation == "vertical":
		var fill_height := track_rect.size.y * percent
		var fill_rect := Rect2(
			Vector2(track_rect.position.x, track_rect.position.y + track_rect.size.y - fill_height),
			Vector2(track_rect.size.x, fill_height)
		)
		_draw_fill_texture(fill_rect, track_rect, color, true)
	else:
		var fill_rect := Rect2(track_rect.position, Vector2(track_rect.size.x * percent, track_rect.size.y))
		_draw_fill_texture(fill_rect, track_rect, color, false)


func _draw_fill_texture(fill_rect: Rect2, anchor_rect: Rect2, color: Color, vertical: bool) -> void:
	if fill_rect.size.x <= 1.0 or fill_rect.size.y <= 1.0:
		return

	var fill_texture := _load_texture(_fill_texture_path())
	if fill_texture != null:
		_draw_tiled_fill_texture(fill_texture, fill_rect, anchor_rect, color, vertical)
		return

	draw_rect(fill_rect, color, true)
	_draw_fill_stripes(fill_rect, vertical)


func _draw_tiled_fill_texture(texture: Texture2D, fill_rect: Rect2, anchor_rect: Rect2, color: Color, vertical: bool) -> void:
	var texture_size := Vector2(float(texture.get_width()), float(texture.get_height()))
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return

	if vertical:
		var tile_scale := anchor_rect.size.x / texture_size.x
		var tile_size := Vector2(anchor_rect.size.x, texture_size.y * tile_scale)
		var tile_bottom := anchor_rect.position.y + anchor_rect.size.y

		while tile_bottom > anchor_rect.position.y:
			var tile_top := tile_bottom - tile_size.y
			var tile_rect := Rect2(Vector2(anchor_rect.position.x, tile_top), tile_size)
			_draw_tile_intersection(texture, tile_rect, fill_rect, texture_size, color)
			tile_bottom -= tile_size.y
	else:
		var tile_scale := anchor_rect.size.y / texture_size.y
		var tile_size := Vector2(texture_size.x * tile_scale, anchor_rect.size.y)
		var tile_left := anchor_rect.position.x
		var track_end := anchor_rect.position.x + anchor_rect.size.x

		while tile_left < track_end:
			var tile_rect := Rect2(Vector2(tile_left, anchor_rect.position.y), tile_size)
			_draw_tile_intersection(texture, tile_rect, fill_rect, texture_size, color)
			tile_left += tile_size.x


func _draw_tile_intersection(texture: Texture2D, tile_rect: Rect2, fill_rect: Rect2, texture_size: Vector2, color: Color) -> void:
	var visible_rect := tile_rect.intersection(fill_rect)
	if visible_rect.size.x <= 0.0 or visible_rect.size.y <= 0.0:
		return

	var source_position := Vector2(
		(visible_rect.position.x - tile_rect.position.x) / maxf(tile_rect.size.x, 1.0) * texture_size.x,
		(visible_rect.position.y - tile_rect.position.y) / maxf(tile_rect.size.y, 1.0) * texture_size.y
	)
	var source_size := Vector2(
		visible_rect.size.x / maxf(tile_rect.size.x, 1.0) * texture_size.x,
		visible_rect.size.y / maxf(tile_rect.size.y, 1.0) * texture_size.y
	)
	draw_texture_rect_region(texture, visible_rect, Rect2(source_position, source_size), color)


func _draw_fill_stripes(fill_rect: Rect2, vertical: bool) -> void:
	if fill_rect.size.x <= 1.0 or fill_rect.size.y <= 1.0:
		return

	var stripe_color := Color("#0a2b32aa") if enabled else Color("#20282aaa")
	var spacing := maxf(fill_rect.size.y * 1.35, 6.0)

	if vertical:
		var y := fill_rect.position.y + fill_rect.size.y - spacing
		while y > fill_rect.position.y - spacing:
			draw_line(Vector2(fill_rect.position.x, y), Vector2(fill_rect.position.x + fill_rect.size.x, y - fill_rect.size.x), stripe_color, 1.0)
			y -= spacing
	else:
		var x := fill_rect.position.x - fill_rect.size.y
		while x < fill_rect.position.x + fill_rect.size.x:
			draw_line(Vector2(x, fill_rect.position.y), Vector2(x + fill_rect.size.y, fill_rect.position.y + fill_rect.size.y), stripe_color, 1.0)
			x += spacing


func _draw_handle(fitted_rect: Rect2, percent: float) -> void:
	var track_rect := _track_rect(fitted_rect)
	var source_scale := _source_scale(fitted_rect)
	var handle_size := (vertical_handle_size if orientation == "vertical" else horizontal_handle_size) * source_scale
	var center := Vector2.ZERO

	if orientation == "vertical":
		center = Vector2(track_rect.get_center().x, track_rect.position.y + track_rect.size.y * (1.0 - percent))
	else:
		center = Vector2(track_rect.position.x + track_rect.size.x * percent, track_rect.get_center().y)

	var handle_rect := Rect2(center - handle_size * 0.5, handle_size)
	var handle_texture := _load_texture(_handle_texture_path())
	if handle_texture != null:
		draw_texture_rect(handle_texture, handle_rect, false, Color.WHITE if enabled else Color("#546467cc"))
		return

	var edge_color := _fill_color()
	var fill_color := Color("#081115e6") if enabled else Color("#151b1dcc")

	draw_rect(handle_rect, fill_color, true)
	draw_rect(handle_rect, Color("#020506cc"), false, maxf(1.0, source_scale))
	draw_rect(handle_rect.grow(-2.0 * source_scale), edge_color, false, maxf(1.0, source_scale))


func _base_texture_path() -> String:
	return vertical_base_texture_path if orientation == "vertical" else horizontal_base_texture_path


func _fill_texture_path() -> String:
	return vertical_fill_texture_path if orientation == "vertical" else horizontal_fill_texture_path


func _handle_texture_path() -> String:
	return vertical_handle_texture_path if orientation == "vertical" else horizontal_handle_texture_path


static func _load_texture(texture_path: String) -> Texture2D:
	if texture_path.is_empty():
		return null

	if _texture_cache.has(texture_path):
		return _texture_cache[texture_path]

	var imported_texture := load(texture_path) as Texture2D
	if imported_texture != null:
		_texture_cache[texture_path] = imported_texture
		return imported_texture

	var image := Image.new()
	var error := image.load(ProjectSettings.globalize_path(texture_path))
	if error != OK:
		return null

	var texture := ImageTexture.create_from_image(image)
	_texture_cache[texture_path] = texture
	return texture


func _track_rect(fitted_rect: Rect2) -> Rect2:
	var source_rect := vertical_track_rect if orientation == "vertical" else horizontal_track_rect
	return _source_rect_to_fitted(source_rect, fitted_rect)


func _source_rect_to_fitted(source_rect: Rect2, fitted_rect: Rect2) -> Rect2:
	var source_scale := _source_scale(fitted_rect)
	return Rect2(fitted_rect.position + source_rect.position * source_scale, source_rect.size * source_scale)


func _source_scale(fitted_rect: Rect2) -> float:
	var source_size := E_GRID_UI_ATLAS.get_cell_size(_component_name())
	if source_size == Vector2i.ZERO:
		return 1.0

	return fitted_rect.size.x / float(source_size.x)


func _fill_color() -> Color:
	if not enabled:
		return Color("#546467cc")

	if semantic_state == "warning":
		return Color("#ee5824")

	if semantic_state == "critical":
		return Color("#cf3a30")

	return Color("#1fd0e2")


func _snap_value(value: float) -> float:
	if step <= 0.0:
		return value

	var safe_min := _safe_min()
	return safe_min + roundf((value - safe_min) / step) * step


func _keyboard_step() -> float:
	return step if step > 0.0 else maxf((_safe_max() - _safe_min()) / 100.0, 1.0)


func _safe_min() -> float:
	return minf(min_value, max_value)


func _safe_max() -> float:
	return maxf(min_value, max_value)


func _format_value(value: float) -> String:
	var rounded := roundf(value)

	if is_equal_approx(value, rounded):
		return "%d%s" % [int(rounded), value_suffix]

	return "%.1f%s" % [value, value_suffix]
