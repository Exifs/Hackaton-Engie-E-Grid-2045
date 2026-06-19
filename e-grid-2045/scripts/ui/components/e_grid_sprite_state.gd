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

@export var stretch_to_bounds := false:
	set(value):
		stretch_to_bounds = value
		_sync_stretch_mode()
		queue_redraw()

@export var nine_slice_enabled := false:
	set(value):
		nine_slice_enabled = value
		_sync_stretch_mode()
		_sync_texture()

@export var nine_slice_margins := Vector4(22.0, 22.0, 22.0, 22.0):
	set(value):
		nine_slice_margins = value
		queue_redraw()

@export var nine_slice_tile_inner_regions := false:
	set(value):
		nine_slice_tile_inner_regions = value
		queue_redraw()

@export var nine_slice_inner_fill_color := Color.TRANSPARENT:
	set(value):
		nine_slice_inner_fill_color = value
		queue_redraw()

@export var panel_chrome_enabled := false:
	set(value):
		panel_chrome_enabled = value
		queue_redraw()

@export var panel_outer_line_color := Color("#3b4b50c8"):
	set(value):
		panel_outer_line_color = value
		queue_redraw()

@export var panel_inner_line_color := Color("#182b30c4"):
	set(value):
		panel_inner_line_color = value
		queue_redraw()

@export var panel_corner_accent_color := Color("#88a4a988"):
	set(value):
		panel_corner_accent_color = value
		queue_redraw()

@export var clear_placeholder_lines := true:
	set(value):
		clear_placeholder_lines = value
		queue_redraw()

@export var convert_child_label_to_bitmap := true
@export var text_color := Color("#e0e8e8")

var _text_layer: Control
var _resolved_texture: Texture2D


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_sync_stretch_mode()
	_cache_text_layer()
	_sync_texture()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_sync_text_layer_layout()
		queue_redraw()


func set_state(value: String) -> void:
	state_name = value
	_sync_texture()


func get_resolved_texture() -> Texture2D:
	return _resolved_texture


func _sync_texture() -> void:
	var resolved_state := state_name

	if not E_GRID_UI_ATLAS.has_state(component_name, resolved_state):
		resolved_state = E_GRID_UI_ATLAS.get_first_available_state(component_name, [resolved_state])

	_resolved_texture = E_GRID_UI_ATLAS.get_texture(component_name, resolved_state)
	texture = null if nine_slice_enabled else _resolved_texture

	if fit_to_source_size:
		var cell_size := E_GRID_UI_ATLAS.get_cell_size(component_name)
		if cell_size != Vector2i.ZERO:
			custom_minimum_size = Vector2(cell_size)

	queue_redraw()


func _draw() -> void:
	if nine_slice_enabled:
		var target_rect := _texture_rect()
		if _resolved_texture != null:
			_draw_nine_slice(_resolved_texture, target_rect)
			_draw_nine_slice_inner_fill(target_rect)
			_draw_panel_chrome(target_rect)
		else:
			draw_rect(target_rect, Color("#081115e6"), true)

	if not clear_placeholder_lines:
		return

	var fitted_rect := _texture_rect()
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


func _sync_stretch_mode() -> void:
	if nine_slice_enabled:
		stretch_mode = TextureRect.STRETCH_KEEP
		return

	stretch_mode = TextureRect.STRETCH_SCALE if stretch_to_bounds else TextureRect.STRETCH_KEEP_ASPECT_CENTERED


func _texture_rect() -> Rect2:
	if stretch_to_bounds:
		return Rect2(Vector2.ZERO, size)

	return E_GRID_UI_ATLAS.get_aspect_fit_rect(component_name, size)


func _draw_nine_slice_inner_fill(target_rect: Rect2) -> void:
	if nine_slice_inner_fill_color.a <= 0.0:
		return

	var left := minf(nine_slice_margins.x, target_rect.size.x * 0.5)
	var top := minf(nine_slice_margins.y, target_rect.size.y * 0.5)
	var right := minf(nine_slice_margins.z, target_rect.size.x * 0.5)
	var bottom := minf(nine_slice_margins.w, target_rect.size.y * 0.5)
	var fill_size := target_rect.size - Vector2(left + right, top + bottom)
	if fill_size.x <= 0.0 or fill_size.y <= 0.0:
		return

	draw_rect(Rect2(target_rect.position + Vector2(left, top), fill_size), nine_slice_inner_fill_color, true)


func _draw_panel_chrome(target_rect: Rect2) -> void:
	if not panel_chrome_enabled:
		return
	if target_rect.size.x <= 12.0 or target_rect.size.y <= 12.0:
		return

	var outer_rect := target_rect.grow(-1.0)
	var inner_rect := target_rect.grow(-6.0)

	_draw_panel_corner_caps(outer_rect)
	_draw_panel_edge_bands(outer_rect)
	_draw_closed_panel_polyline(_clipped_rect_points(outer_rect, 12.0), Color("#020608ea"), 2.0)
	_draw_closed_panel_polyline(_clipped_rect_points(outer_rect.grow(-1.0), 11.0), panel_outer_line_color, 1.0)
	_draw_closed_panel_polyline(_clipped_rect_points(inner_rect, 8.0), panel_inner_line_color, 1.0)
	_draw_panel_corner_marks(outer_rect)


func _draw_panel_edge_bands(rect: Rect2) -> void:
	var horizontal_width := maxf(rect.size.x - 48.0, 0.0)
	var vertical_height := maxf(rect.size.y - 48.0, 0.0)
	if horizontal_width > 0.0:
		draw_rect(Rect2(rect.position + Vector2(24.0, 3.0), Vector2(horizontal_width, 3.0)), Color("#0206097a"), true)
		draw_rect(Rect2(rect.position + Vector2(24.0, 7.0), Vector2(horizontal_width, 1.0)), Color("#2b414786"), true)
		draw_rect(Rect2(Vector2(rect.position.x + 24.0, rect.end.y - 7.0), Vector2(horizontal_width, 1.0)), Color("#23363b74"), true)
		draw_rect(Rect2(Vector2(rect.position.x + 24.0, rect.end.y - 5.0), Vector2(horizontal_width, 3.0)), Color("#0206089a"), true)
	if vertical_height > 0.0:
		draw_rect(Rect2(rect.position + Vector2(3.0, 24.0), Vector2(3.0, vertical_height)), Color("#02060978"), true)
		draw_rect(Rect2(rect.position + Vector2(7.0, 24.0), Vector2(1.0, vertical_height)), Color("#2b414760"), true)
		draw_rect(Rect2(Vector2(rect.end.x - 7.0, rect.position.y + 24.0), Vector2(1.0, vertical_height)), Color("#23363b60"), true)
		draw_rect(Rect2(Vector2(rect.end.x - 5.0, rect.position.y + 24.0), Vector2(3.0, vertical_height)), Color("#02060892"), true)


func _draw_panel_corner_caps(rect: Rect2) -> void:
	var cap := minf(44.0, minf(rect.size.x, rect.size.y) * 0.42)
	if cap <= 16.0:
		return

	var x := rect.position.x
	var y := rect.position.y
	var ex := rect.end.x
	var ey := rect.end.y
	var fill := Color("#02070bc8")
	var edge := Color("#2d42487e")

	draw_colored_polygon(PackedVector2Array([
		Vector2(x + 1.0, y + 14.0),
		Vector2(x + 14.0, y + 1.0),
		Vector2(x + cap, y + 1.0),
		Vector2(x + cap - 11.0, y + 7.0),
		Vector2(x + 18.0, y + 7.0),
		Vector2(x + 7.0, y + 18.0),
		Vector2(x + 7.0, y + cap - 11.0),
		Vector2(x + 1.0, y + cap),
	]), fill)
	draw_colored_polygon(PackedVector2Array([
		Vector2(ex - 14.0, y + 1.0),
		Vector2(ex - 1.0, y + 14.0),
		Vector2(ex - 1.0, y + cap),
		Vector2(ex - 7.0, y + cap - 11.0),
		Vector2(ex - 7.0, y + 18.0),
		Vector2(ex - 18.0, y + 7.0),
		Vector2(ex - cap + 11.0, y + 7.0),
		Vector2(ex - cap, y + 1.0),
	]), fill)
	draw_colored_polygon(PackedVector2Array([
		Vector2(x + 1.0, ey - 14.0),
		Vector2(x + 7.0, ey - cap + 11.0),
		Vector2(x + 7.0, ey - 18.0),
		Vector2(x + 18.0, ey - 7.0),
		Vector2(x + cap - 11.0, ey - 7.0),
		Vector2(x + cap, ey - 1.0),
		Vector2(x + 14.0, ey - 1.0),
		Vector2(x + 1.0, ey - 14.0),
	]), fill)
	draw_colored_polygon(PackedVector2Array([
		Vector2(ex - 1.0, ey - 14.0),
		Vector2(ex - 14.0, ey - 1.0),
		Vector2(ex - cap, ey - 1.0),
		Vector2(ex - cap + 11.0, ey - 7.0),
		Vector2(ex - 18.0, ey - 7.0),
		Vector2(ex - 7.0, ey - 18.0),
		Vector2(ex - 7.0, ey - cap + 11.0),
		Vector2(ex - 1.0, ey - cap),
	]), fill)

	draw_line(Vector2(x + 15.0, y + 3.0), Vector2(x + cap - 8.0, y + 3.0), edge, 1.0, true)
	draw_line(Vector2(ex - cap + 8.0, y + 3.0), Vector2(ex - 15.0, y + 3.0), edge, 1.0, true)
	draw_line(Vector2(x + 15.0, ey - 3.0), Vector2(x + cap - 8.0, ey - 3.0), edge, 1.0, true)
	draw_line(Vector2(ex - cap + 8.0, ey - 3.0), Vector2(ex - 15.0, ey - 3.0), edge, 1.0, true)


func _draw_panel_corner_marks(rect: Rect2) -> void:
	var arm := 17.0
	var inset := 8.0
	var color := panel_corner_accent_color

	draw_line(rect.position + Vector2(inset, 3.0), rect.position + Vector2(inset + arm, 3.0), color, 1.0, true)
	draw_line(rect.position + Vector2(3.0, inset), rect.position + Vector2(3.0, inset + arm), color, 1.0, true)
	draw_line(Vector2(rect.end.x - inset - arm, rect.position.y + 3.0), Vector2(rect.end.x - inset, rect.position.y + 3.0), color, 1.0, true)
	draw_line(Vector2(rect.end.x - 3.0, rect.position.y + inset), Vector2(rect.end.x - 3.0, rect.position.y + inset + arm), color, 1.0, true)
	draw_line(Vector2(rect.position.x + inset, rect.end.y - 3.0), Vector2(rect.position.x + inset + arm, rect.end.y - 3.0), color, 1.0, true)
	draw_line(Vector2(rect.position.x + 3.0, rect.end.y - inset - arm), Vector2(rect.position.x + 3.0, rect.end.y - inset), color, 1.0, true)
	draw_line(Vector2(rect.end.x - inset - arm, rect.end.y - 3.0), Vector2(rect.end.x - inset, rect.end.y - 3.0), color, 1.0, true)
	draw_line(Vector2(rect.end.x - 3.0, rect.end.y - inset - arm), Vector2(rect.end.x - 3.0, rect.end.y - inset), color, 1.0, true)


func _clipped_rect_points(rect: Rect2, corner_size: float) -> PackedVector2Array:
	var corner := minf(corner_size, minf(rect.size.x, rect.size.y) * 0.5)
	return PackedVector2Array([
		Vector2(rect.position.x + corner, rect.position.y),
		Vector2(rect.end.x - corner, rect.position.y),
		Vector2(rect.end.x, rect.position.y + corner),
		Vector2(rect.end.x, rect.end.y - corner),
		Vector2(rect.end.x - corner, rect.end.y),
		Vector2(rect.position.x + corner, rect.end.y),
		Vector2(rect.position.x, rect.end.y - corner),
		Vector2(rect.position.x, rect.position.y + corner),
	])


func _draw_closed_panel_polyline(points: PackedVector2Array, color: Color, width: float) -> void:
	var closed_points := PackedVector2Array(points)
	if closed_points.size() > 0:
		closed_points.append(closed_points[0])
	draw_polyline(closed_points, color, width, true)


func _draw_nine_slice(source_texture: Texture2D, target_rect: Rect2) -> void:
	if target_rect.size.x <= 0.0 or target_rect.size.y <= 0.0:
		return

	var source_size := _nine_slice_source_size(source_texture)
	if source_size.x <= 0.0 or source_size.y <= 0.0:
		return

	var source_left := clampf(nine_slice_margins.x, 0.0, source_size.x * 0.5)
	var source_top := clampf(nine_slice_margins.y, 0.0, source_size.y * 0.5)
	var source_right := clampf(nine_slice_margins.z, 0.0, source_size.x * 0.5)
	var source_bottom := clampf(nine_slice_margins.w, 0.0, source_size.y * 0.5)
	var target_left := minf(source_left, target_rect.size.x * 0.5)
	var target_top := minf(source_top, target_rect.size.y * 0.5)
	var target_right := minf(source_right, target_rect.size.x * 0.5)
	var target_bottom := minf(source_bottom, target_rect.size.y * 0.5)

	var source_x := PackedFloat32Array([0.0, source_left, source_size.x - source_right, source_size.x])
	var source_y := PackedFloat32Array([0.0, source_top, source_size.y - source_bottom, source_size.y])
	var target_x := PackedFloat32Array([
		target_rect.position.x,
		target_rect.position.x + target_left,
		target_rect.end.x - target_right,
		target_rect.end.x,
	])
	var target_y := PackedFloat32Array([
		target_rect.position.y,
		target_rect.position.y + target_top,
		target_rect.end.y - target_bottom,
		target_rect.end.y,
	])

	for y_index in range(3):
		for x_index in range(3):
			var source_part := Rect2(
				Vector2(source_x[x_index], source_y[y_index]),
				Vector2(source_x[x_index + 1] - source_x[x_index], source_y[y_index + 1] - source_y[y_index])
			)
			var target_part := Rect2(
				Vector2(target_x[x_index], target_y[y_index]),
				Vector2(target_x[x_index + 1] - target_x[x_index], target_y[y_index + 1] - target_y[y_index])
			)

			if source_part.size.x <= 0.0 or source_part.size.y <= 0.0:
				continue
			if target_part.size.x <= 0.0 or target_part.size.y <= 0.0:
				continue

			_draw_nine_slice_part(
				source_texture,
				target_part,
				source_part,
				nine_slice_tile_inner_regions and (x_index == 1 or y_index == 1)
			)


func _draw_nine_slice_part(source_texture: Texture2D, target_rect: Rect2, source_rect: Rect2, tile_region: bool) -> void:
	if not tile_region:
		draw_texture_rect_region(source_texture, target_rect, source_rect)
		return

	var y := target_rect.position.y
	while y < target_rect.end.y - 0.01:
		var tile_height := minf(source_rect.size.y, target_rect.end.y - y)
		var x := target_rect.position.x
		while x < target_rect.end.x - 0.01:
			var tile_width := minf(source_rect.size.x, target_rect.end.x - x)
			var source_part := Rect2(source_rect.position, Vector2(tile_width, tile_height))
			var target_part := Rect2(Vector2(x, y), Vector2(tile_width, tile_height))
			draw_texture_rect_region(source_texture, target_part, source_part)
			x += tile_width
		y += tile_height


func _nine_slice_source_size(source_texture: Texture2D) -> Vector2:
	var cell_size := E_GRID_UI_ATLAS.get_cell_size(component_name)
	if cell_size != Vector2i.ZERO:
		return Vector2(cell_size)

	return Vector2(source_texture.get_width(), source_texture.get_height())


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
