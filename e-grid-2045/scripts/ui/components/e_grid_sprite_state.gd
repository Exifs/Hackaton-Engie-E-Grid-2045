@tool
class_name EGridSpriteState
extends TextureRect

const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")
const E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT := preload("res://scripts/ui/components/e_grid_component_bitmap_text.gd")

@export var component_name := "panel_states":
	set(value):
		component_name = value
		_sync_texture()

@export var state_name := "panel":
	set(value):
		state_name = value
		_sync_texture()

@export var fit_to_source_size := true:
	set(value):
		fit_to_source_size = value
		_sync_texture()

@export var clear_placeholder_lines := true:
	set(value):
		clear_placeholder_lines = value
		queue_redraw()

@export var convert_child_label_to_bitmap := true
@export var text_color := Color("#e0e8e8")

var _text_layer: Control


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_cache_text_layer()
	_sync_texture()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_sync_text_layer_layout()
		queue_redraw()


func set_state(value: String) -> void:
	state_name = value
	_sync_texture()


func _sync_texture() -> void:
	var resolved_state := state_name

	if not E_GRID_UI_ATLAS.has_state(component_name, resolved_state):
		resolved_state = E_GRID_UI_ATLAS.get_first_available_state(component_name, [resolved_state])

	texture = E_GRID_UI_ATLAS.get_texture(component_name, resolved_state)

	if fit_to_source_size:
		var cell_size := E_GRID_UI_ATLAS.get_cell_size(component_name)
		if cell_size != Vector2i.ZERO:
			custom_minimum_size = Vector2(cell_size)

	queue_redraw()


func _draw() -> void:
	if not clear_placeholder_lines:
		return

	var fitted_rect := E_GRID_UI_ATLAS.get_aspect_fit_rect(component_name, size)
	for source_rect in _placeholder_clear_rects():
		var source_scale := _source_scale(fitted_rect)
		var target_rect := Rect2(fitted_rect.position + source_rect.position * source_scale, source_rect.size * source_scale)
		draw_rect(target_rect, Color("#081115f2"), true)


func _cache_text_layer() -> void:
	if not convert_child_label_to_bitmap:
		return

	_text_layer = get_node_or_null("BitmapText") as Control
	if _text_layer != null:
		return

	var old_label := get_node_or_null("Label") as Label
	if old_label == null:
		return

	_text_layer = E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT.new() as Control
	_text_layer.name = "BitmapText"
	add_child(_text_layer)
	_text_layer.anchor_left = old_label.anchor_left
	_text_layer.anchor_top = old_label.anchor_top
	_text_layer.anchor_right = old_label.anchor_right
	_text_layer.anchor_bottom = old_label.anchor_bottom
	_text_layer.offset_left = old_label.offset_left
	_text_layer.offset_top = old_label.offset_top
	_text_layer.offset_right = old_label.offset_right
	_text_layer.offset_bottom = old_label.offset_bottom
	_text_layer.set("text", old_label.text)
	_text_layer.set("font_color", text_color)
	_text_layer.set("horizontal_alignment", _alignment_to_string(old_label.horizontal_alignment))
	_text_layer.set("vertical_alignment", _vertical_alignment_to_string(old_label.vertical_alignment))
	old_label.visible = false
	_sync_text_layer_layout()


func _placeholder_clear_rects() -> Array[Rect2]:
	if component_name == "tooltip_states":
		return [Rect2(13.0, 11.0, 180.0, 44.0)]

	return []


func _sync_text_layer_layout() -> void:
	if _text_layer == null:
		return

	if component_name == "tooltip_states":
		_text_layer.set_anchors_preset(Control.PRESET_TOP_LEFT)
		_text_layer.position = Vector2(14.0, 12.0)
		_text_layer.size = Vector2(190.0, 40.0)
		_text_layer.set("horizontal_alignment", "left")
		_text_layer.set("vertical_alignment", "center")
		_text_layer.queue_redraw()


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
