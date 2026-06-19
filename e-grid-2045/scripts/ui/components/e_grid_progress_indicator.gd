@tool
class_name EGridProgressIndicator
extends Control

const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")
const E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT := preload("res://scripts/ui/components/e_grid_component_bitmap_text.gd")

@export_enum("progress_bar_states", "progress_ring_states") var component_name := "progress_bar_states":
	set(value):
		component_name = value
		_sync_component_size()
		queue_redraw()

@export var fit_to_source_size := true:
	set(value):
		fit_to_source_size = value
		_sync_component_size()
		queue_redraw()

var _value := 50.0

@export_range(0.0, 100.0, 0.1) var value: float:
	get:
		return _value
	set(next_value):
		var clamped_value := clampf(next_value, 0.0, 100.0)
		if is_equal_approx(_value, clamped_value):
			return
		_value = clamped_value
		_sync_label()
		_request_animation_update()
		queue_redraw()

@export_enum("normal", "warning", "critical", "success", "disabled") var semantic_state := "normal":
	set(value):
		semantic_state = value
		_sync_label()
		queue_redraw()

@export_range(1.0, 30.0, 0.5) var smooth_speed := 10.0
@export var animate_value_changes := false
@export var show_value_label := true:
	set(value):
		show_value_label = value
		_sync_label()

@export var bar_track_rect := Rect2(17.0, 13.0, 306.0, 8.0)
@export var show_progress_head := false:
	set(value):
		show_progress_head = value
		queue_redraw()
@export_range(1.0, 8.0, 0.5) var progress_head_width := 2.0:
	set(value):
		progress_head_width = value
		queue_redraw()
@export var progress_head_color := Color("#9ef6ff"):
	set(value):
		progress_head_color = value
		queue_redraw()
@export var progress_head_glow_color := Color("#1fd0e288"):
	set(value):
		progress_head_glow_color = value
		queue_redraw()
@export var ring_center := Vector2(34.0, 34.0)
@export var ring_radius := 22.0
@export var ring_width := 5.0
@export var value_label_color := Color("#e0e8e8"):
	set(value):
		value_label_color = value
		_sync_label()
@export var stretch_bar_to_bounds := true:
	set(value):
		stretch_bar_to_bounds = value
		queue_redraw()

var _display_value := 50.0
var _value_label: Control


func _ready() -> void:
	_display_value = value
	_cache_nodes()
	_sync_component_size()
	_sync_label()
	set_process(false)


func _process(delta: float) -> void:
	var blend := 1.0 - exp(-smooth_speed * delta)
	_display_value = lerpf(_display_value, value, blend)

	if absf(_display_value - value) < 0.01:
		_display_value = value
		set_process(false)

	queue_redraw()


func _request_animation_update() -> void:
	if Engine.is_editor_hint() or not animate_value_changes:
		_display_value = value
		set_process(false)
		return
	set_process(absf(_display_value - value) >= 0.01)


func _draw() -> void:
	var fitted_rect := _get_fitted_rect()
	var base_texture := E_GRID_UI_ATLAS.get_texture(component_name, _base_state())
	if base_texture == null:
		draw_rect(fitted_rect, Color("#081115e6"), true)
		return

	var base_modulate := Color(1.0, 1.0, 1.0, 0.45) if semantic_state == "disabled" else Color.WHITE
	draw_texture_rect(base_texture, fitted_rect, false, base_modulate)

	var percent := clampf(_display_value / 100.0, 0.0, 1.0)
	if component_name == "progress_ring_states":
		_draw_ring_progress(fitted_rect, percent)
	else:
		_draw_bar_progress(fitted_rect, percent)


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_sync_label()
		queue_redraw()


func _cache_nodes() -> void:
	_value_label = get_node_or_null("ValueBitmapText") as Control

	if _value_label == null:
		var old_label := get_node_or_null("ValueLabel") as Label
		_value_label = E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT.new() as Control
		_value_label.name = "ValueBitmapText"
		add_child(_value_label)

		if old_label != null:
			_value_label.anchor_left = old_label.anchor_left
			_value_label.anchor_top = old_label.anchor_top
			_value_label.anchor_right = old_label.anchor_right
			_value_label.anchor_bottom = old_label.anchor_bottom
			_value_label.offset_left = old_label.offset_left
			_value_label.offset_top = old_label.offset_top
			_value_label.offset_right = old_label.offset_right
			_value_label.offset_bottom = old_label.offset_bottom
			_value_label.set("horizontal_alignment", _alignment_to_string(old_label.horizontal_alignment))
			_value_label.set("vertical_alignment", _vertical_alignment_to_string(old_label.vertical_alignment))
			old_label.visible = false
		else:
			_value_label.set_anchors_preset(Control.PRESET_FULL_RECT)


func _sync_component_size() -> void:
	if not fit_to_source_size:
		return

	var cell_size := E_GRID_UI_ATLAS.get_cell_size(component_name)
	if cell_size != Vector2i.ZERO:
		custom_minimum_size = Vector2(cell_size)


func _sync_label() -> void:
	if _value_label == null:
		_cache_nodes()

	if _value_label == null:
		return

	_value_label.visible = show_value_label
	_value_label.set("text", "%d%%" % int(roundf(value)))
	_value_label.set("font_color", value_label_color if semantic_state != "disabled" else Color("#546467"))
	_apply_value_label_layout()
	_value_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_value_label.queue_redraw()


func _draw_bar_progress(fitted_rect: Rect2, percent: float) -> void:
	var track_rect := _source_rect_to_fitted(bar_track_rect, fitted_rect)
	var fill_rect := Rect2(track_rect.position, Vector2(track_rect.size.x * percent, track_rect.size.y))

	if fill_rect.size.x > 0.5:
		draw_rect(fill_rect, _progress_color(), true)
		_draw_bar_stripes(fill_rect)
	if show_progress_head:
		_draw_bar_progress_head(track_rect, percent)


func _draw_bar_progress_head(track_rect: Rect2, percent: float) -> void:
	var head_x := track_rect.position.x + track_rect.size.x * clampf(percent, 0.0, 1.0)
	var head_width := maxf(1.0, progress_head_width)
	var glow_width := maxf(head_width * 3.0, 5.0)
	var vertical_pad := maxf(2.0, track_rect.size.y * 0.3)
	var alpha_multiplier := 0.42 if semantic_state == "disabled" else 1.0
	var glow_color := progress_head_glow_color
	var core_color := progress_head_color
	glow_color.a *= alpha_multiplier
	core_color.a *= alpha_multiplier

	var glow_rect := Rect2(
		Vector2(head_x - glow_width * 0.5, track_rect.position.y - vertical_pad),
		Vector2(glow_width, track_rect.size.y + vertical_pad * 2.0)
	)
	draw_rect(glow_rect, glow_color, true)
	draw_line(
		Vector2(head_x, track_rect.position.y - vertical_pad),
		Vector2(head_x, track_rect.position.y + track_rect.size.y + vertical_pad),
		core_color,
		head_width,
		true
	)
	draw_circle(Vector2(head_x, track_rect.position.y), maxf(1.2, head_width * 0.65), core_color)
	draw_circle(Vector2(head_x, track_rect.position.y + track_rect.size.y), maxf(1.2, head_width * 0.65), core_color)


func _draw_bar_stripes(fill_rect: Rect2) -> void:
	var stripe_color := Color("#0a2b32aa") if semantic_state != "disabled" else Color("#20282aaa")
	var spacing := maxf(fill_rect.size.y * 1.45, 6.0)
	var x := fill_rect.position.x - fill_rect.size.y

	while x < fill_rect.position.x + fill_rect.size.x:
		draw_line(Vector2(x, fill_rect.position.y), Vector2(x + fill_rect.size.y, fill_rect.position.y + fill_rect.size.y), stripe_color, 1.0)
		x += spacing


func _apply_value_label_layout() -> void:
	if _value_label == null:
		return

	_value_label.set_anchors_preset(Control.PRESET_TOP_LEFT)

	if component_name == "progress_ring_states":
		_value_label.position = Vector2(12.0, 22.0)
		_value_label.size = Vector2(44.0, 24.0)
		_value_label.set("horizontal_alignment", "center")
		_value_label.set("vertical_alignment", "center")
		return

	_value_label.position = Vector2(346.0, 7.0)
	_value_label.size = Vector2(58.0, 22.0)
	_value_label.set("horizontal_alignment", "left")
	_value_label.set("vertical_alignment", "center")


func _draw_ring_progress(fitted_rect: Rect2, percent: float) -> void:
	if percent <= 0.001:
		return

	var source_scale := _source_scale(fitted_rect)
	var center := fitted_rect.position + ring_center * source_scale
	var radius := ring_radius * source_scale
	var width := maxf(1.0, ring_width * source_scale)
	var start_angle := -PI * 0.5
	var end_angle := start_angle + TAU * percent
	var segments := maxi(10, int(64.0 * percent))

	draw_arc(center, radius, start_angle, end_angle, segments, _progress_color(), width, true)


func _base_state() -> String:
	if component_name == "progress_ring_states":
		return "construction_0"

	return "empty_0"


func _progress_color() -> Color:
	if semantic_state == "disabled":
		return Color("#546467cc")

	if semantic_state == "warning":
		return Color("#ee5824")

	if semantic_state == "critical":
		return Color("#cf3a30")

	if semantic_state == "success":
		return Color("#4ce38a")

	return Color("#1fd0e2") if component_name == "progress_ring_states" else Color("#4ce38a")


func _source_rect_to_fitted(source_rect: Rect2, fitted_rect: Rect2) -> Rect2:
	var source_size := E_GRID_UI_ATLAS.get_cell_size(component_name)
	if source_size == Vector2i.ZERO:
		return Rect2(fitted_rect.position + source_rect.position, source_rect.size)

	var source_scale := Vector2(
		fitted_rect.size.x / float(source_size.x),
		fitted_rect.size.y / float(source_size.y)
	)
	return Rect2(fitted_rect.position + source_rect.position * source_scale, source_rect.size * source_scale)


func _get_fitted_rect() -> Rect2:
	if component_name == "progress_bar_states" and stretch_bar_to_bounds:
		return Rect2(Vector2.ZERO, size)

	return E_GRID_UI_ATLAS.get_aspect_fit_rect(component_name, size)


func _source_scale(fitted_rect: Rect2) -> float:
	var source_size := E_GRID_UI_ATLAS.get_cell_size(component_name)
	if source_size == Vector2i.ZERO:
		return 1.0

	return fitted_rect.size.x / float(source_size.x)


func _alignment_to_string(source_alignment: HorizontalAlignment) -> String:
	if source_alignment == HORIZONTAL_ALIGNMENT_CENTER:
		return "center"

	if source_alignment == HORIZONTAL_ALIGNMENT_RIGHT:
		return "right"

	return "left"


func _vertical_alignment_to_string(source_alignment: VerticalAlignment) -> String:
	if source_alignment == VERTICAL_ALIGNMENT_TOP:
		return "top"

	if source_alignment == VERTICAL_ALIGNMENT_BOTTOM:
		return "bottom"

	return "center"
