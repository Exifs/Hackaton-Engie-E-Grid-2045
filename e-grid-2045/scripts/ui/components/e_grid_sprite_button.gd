@tool
class_name EGridSpriteButton
extends Button

const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")
const E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT := preload("res://scripts/ui/components/e_grid_component_bitmap_text.gd")

@export var component_name := "mini_button_states":
	set(value):
		component_name = value
		_sync_component()

@export var label_text := "":
	set(value):
		label_text = value
		_sync_label()

@export var fit_to_source_size := true:
	set(value):
		fit_to_source_size = value
		_sync_component()

@export var stretch_to_bounds := false:
	set(value):
		stretch_to_bounds = value
		_sync_label()
		queue_redraw()

@export var nine_slice_enabled := false:
	set(value):
		nine_slice_enabled = value
		_sync_label()
		queue_redraw()

@export var nine_slice_margins := Vector4(12.0, 12.0, 12.0, 12.0):
	set(value):
		nine_slice_margins = value
		queue_redraw()

@export var nine_slice_tile_inner_regions := false:
	set(value):
		nine_slice_tile_inner_regions = value
		queue_redraw()

@export var normal_state := "normal":
	set(value):
		normal_state = value
		queue_redraw()

@export var hover_state := "hover":
	set(value):
		hover_state = value
		queue_redraw()

@export var pressed_state := "pressed":
	set(value):
		pressed_state = value
		queue_redraw()

@export var selected_state := "":
	set(value):
		selected_state = value
		queue_redraw()

@export var selected_hover_state := "":
	set(value):
		selected_hover_state = value
		queue_redraw()

@export var disabled_state := "disabled":
	set(value):
		disabled_state = value
		queue_redraw()

@export var focus_uses_hover_state := true:
	set(value):
		focus_uses_hover_state = value
		queue_redraw()

@export_enum("normal", "warning", "critical", "success") var semantic_state := "normal":
	set(value):
		semantic_state = value
		queue_redraw()

@export var selected_state_overrides_semantic := false:
	set(value):
		selected_state_overrides_semantic = value
		queue_redraw()

@export var warning_state := "warning":
	set(value):
		warning_state = value
		queue_redraw()

@export var critical_state := "critical":
	set(value):
		critical_state = value
		queue_redraw()

@export var success_state := "success":
	set(value):
		success_state = value
		queue_redraw()

@export var utility_icon_state := "":
	set(value):
		utility_icon_state = value
		queue_redraw()

@export var utility_icon_component_name := "utility_icons_48px":
	set(value):
		utility_icon_component_name = value
		queue_redraw()

@export var icon_size := Vector2(30.0, 30.0):
	set(value):
		icon_size = value
		queue_redraw()

@export var label_color := Color("#e0e8e8"):
	set(value):
		label_color = value
		_sync_label()

@export var disabled_label_color := Color("#546467"):
	set(value):
		disabled_label_color = value
		_sync_label()

@export var label_horizontal_alignment_override := "":
	set(value):
		label_horizontal_alignment_override = value
		_sync_label()

@export_range(0.0, 0.32, 0.01) var label_scale_px := 0.0:
	set(value):
		label_scale_px = value
		_sync_label()

var _label: Control


func _ready() -> void:
	text = ""
	flat = true
	focus_mode = Control.FOCUS_ALL
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_install_empty_button_styles()
	_cache_label()
	_sync_component()
	_sync_label()
	_connect_redraw_signals()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_sync_label()
		queue_redraw()


func _draw() -> void:
	var state := _get_state_name()
	var texture := E_GRID_UI_ATLAS.get_texture(component_name, state)
	var fitted_rect := _button_rect()

	if texture != null:
		if nine_slice_enabled:
			_draw_nine_slice(texture, fitted_rect)
		else:
			draw_texture_rect(texture, fitted_rect, false)
	else:
		draw_rect(fitted_rect, Color("#081115e6"), true)

	_draw_content_clear_rects(fitted_rect)
	_draw_utility_icon(fitted_rect)


func _install_empty_button_styles() -> void:
	add_theme_stylebox_override("normal", StyleBoxEmpty.new())
	add_theme_stylebox_override("hover", StyleBoxEmpty.new())
	add_theme_stylebox_override("pressed", StyleBoxEmpty.new())
	add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	add_theme_stylebox_override("disabled", StyleBoxEmpty.new())


func _connect_redraw_signals() -> void:
	var redraw_call := Callable(self, "_request_redraw")

	if not mouse_entered.is_connected(redraw_call):
		mouse_entered.connect(redraw_call)
	if not mouse_exited.is_connected(redraw_call):
		mouse_exited.connect(redraw_call)
	if not focus_entered.is_connected(redraw_call):
		focus_entered.connect(redraw_call)
	if not focus_exited.is_connected(redraw_call):
		focus_exited.connect(redraw_call)
	if not button_down.is_connected(redraw_call):
		button_down.connect(redraw_call)
	if not button_up.is_connected(redraw_call):
		button_up.connect(redraw_call)
	if not toggled.is_connected(_on_toggled):
		toggled.connect(_on_toggled)


func _cache_label() -> void:
	_label = get_node_or_null("BitmapText") as Control

	if _label == null:
		var old_label := get_node_or_null("Label") as Label
		_label = E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT.new() as Control
		_label.name = "BitmapText"
		add_child(_label)

		if old_label != null:
			_copy_label_layout(old_label, _label)
			old_label.visible = false
		else:
			_label.set_anchors_preset(Control.PRESET_FULL_RECT)


func _sync_component() -> void:
	var cell_size := E_GRID_UI_ATLAS.get_cell_size(component_name)

	if fit_to_source_size and cell_size != Vector2i.ZERO:
		custom_minimum_size = Vector2(cell_size)

	_sync_label()
	queue_redraw()


func _sync_label() -> void:
	if _label == null:
		_cache_label()

	if _label == null:
		return

	_label.set("text", label_text)
	_label.set("font_color", disabled_label_color if disabled else label_color)
	if label_scale_px > 0.0:
		_label.set("scale_px", label_scale_px)
	_apply_label_layout()
	_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label.queue_redraw()


func _copy_label_layout(source: Label, target: Control) -> void:
	target.anchor_left = source.anchor_left
	target.anchor_top = source.anchor_top
	target.anchor_right = source.anchor_right
	target.anchor_bottom = source.anchor_bottom
	target.offset_left = source.offset_left
	target.offset_top = source.offset_top
	target.offset_right = source.offset_right
	target.offset_bottom = source.offset_bottom
	target.size_flags_horizontal = source.size_flags_horizontal
	target.size_flags_vertical = source.size_flags_vertical
	target.set("horizontal_alignment", _alignment_to_string(source.horizontal_alignment))
	target.set("vertical_alignment", _vertical_alignment_to_string(source.vertical_alignment))


func _apply_label_layout() -> void:
	if _label == null:
		return

	var source_rect := _label_source_rect()
	var fitted_rect := _button_rect()
	var source_scale := _source_scale(fitted_rect)

	_label.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_label.position = fitted_rect.position + source_rect.position * source_scale
	_label.size = source_rect.size * source_scale
	_label.set("horizontal_alignment", _label_horizontal_alignment())
	_label.set("vertical_alignment", "center")


func _label_source_rect() -> Rect2:
	if component_name == "resource_chip_states":
		return Rect2(42.0, 6.0, 100.0, 20.0)

	if component_name == "alert_toast_states":
		return Rect2(70.0, 15.0, 190.0, 24.0)

	if component_name == "list_item_states":
		return Rect2(14.0, 6.0, 258.0, 24.0)

	if component_name == "tab_states":
		return Rect2(10.0, 6.0, 106.0, 28.0)

	if component_name == "mini_button_states":
		return Rect2(6.0, 5.0, 46.0, 22.0)

	var cell_size := E_GRID_UI_ATLAS.get_cell_size(component_name)
	return Rect2(Vector2.ZERO, Vector2(float(cell_size.x), float(cell_size.y)))


func _label_horizontal_alignment() -> String:
	if not label_horizontal_alignment_override.is_empty():
		return label_horizontal_alignment_override

	if component_name in ["mini_button_states", "tab_states"]:
		return "center"

	return "left"


func _get_state_name() -> String:
	if disabled:
		return E_GRID_UI_ATLAS.get_first_available_state(component_name, [disabled_state, normal_state])

	var selected_state_name := ""
	if selected_state_overrides_semantic:
		selected_state_name = _selected_visual_state()
		if not selected_state_name.is_empty():
			return selected_state_name

	var semantic_state_name := _semantic_visual_state()
	if not semantic_state_name.is_empty():
		return semantic_state_name

	if toggle_mode and button_pressed:
		selected_state_name = _selected_visual_state()
		if not selected_state_name.is_empty():
			return selected_state_name

	if button_pressed and not pressed_state.is_empty():
		return E_GRID_UI_ATLAS.get_first_available_state(component_name, [pressed_state, hover_state, normal_state])

	if _uses_hover_state() and not hover_state.is_empty():
		return E_GRID_UI_ATLAS.get_first_available_state(component_name, [hover_state, normal_state])

	return E_GRID_UI_ATLAS.get_first_available_state(component_name, [normal_state])


func _semantic_visual_state() -> String:
	if semantic_state == "critical" and not critical_state.is_empty():
		return E_GRID_UI_ATLAS.get_first_available_state(component_name, [critical_state, hover_state, normal_state])

	if semantic_state == "warning" and not warning_state.is_empty():
		return E_GRID_UI_ATLAS.get_first_available_state(component_name, [warning_state, hover_state, normal_state])

	if semantic_state == "success" and not success_state.is_empty():
		return E_GRID_UI_ATLAS.get_first_available_state(component_name, [success_state, hover_state, normal_state])

	return ""


func _selected_visual_state() -> String:
	if not toggle_mode or not button_pressed:
		return ""

	if _uses_hover_state() and not selected_hover_state.is_empty():
		return E_GRID_UI_ATLAS.get_first_available_state(component_name, [selected_hover_state, selected_state, normal_state])

	return E_GRID_UI_ATLAS.get_first_available_state(component_name, [selected_state, pressed_state, normal_state])


func _uses_hover_state() -> bool:
	return is_hovered() or (focus_uses_hover_state and has_focus())


func _draw_utility_icon(fitted_rect: Rect2) -> void:
	if utility_icon_state.is_empty():
		return

	var icon_texture := E_GRID_UI_ATLAS.get_texture(utility_icon_component_name, utility_icon_state)
	if icon_texture == null:
		return

	var destination := Rect2(fitted_rect.position + (fitted_rect.size - icon_size) * 0.5, icon_size)
	draw_texture_rect(icon_texture, destination, false)


func _draw_content_clear_rects(fitted_rect: Rect2) -> void:
	var clear_rects := _content_clear_rects()
	if clear_rects.is_empty():
		return

	var source_scale := _source_scale(fitted_rect)
	for source_rect in clear_rects:
		var target_rect := Rect2(fitted_rect.position + source_rect.position * source_scale, source_rect.size * source_scale)
		_draw_content_clear_rect(target_rect)


func _draw_content_clear_rect(target_rect: Rect2) -> void:
	if target_rect.size.x <= 0.0 or target_rect.size.y <= 0.0:
		return

	var fill_rect := target_rect
	if component_name == "mini_button_states" and target_rect.size.x > 2.0 and target_rect.size.y > 2.0:
		fill_rect = target_rect.grow(-1.0)

	draw_rect(fill_rect, _content_clear_color(), true)

	if component_name != "mini_button_states" or fill_rect.size.x <= 2.0 or fill_rect.size.y <= 2.0:
		return

	draw_line(
		fill_rect.position + Vector2(1.0, 1.0),
		Vector2(fill_rect.end.x - 1.0, fill_rect.position.y + 1.0),
		Color("#17313966"),
		1.0
	)
	draw_line(
		Vector2(fill_rect.position.x + 1.0, fill_rect.end.y - 1.0),
		fill_rect.end - Vector2(1.0, 1.0),
		Color("#02080acc"),
		1.0
	)


func _content_clear_color() -> Color:
	if component_name != "mini_button_states":
		return Color("#081115f2")

	if disabled:
		return Color("#0a1012ee")

	var state := _get_state_name()
	if state == warning_state:
		return Color("#160d08ee")
	if state == critical_state:
		return Color("#15090aee")
	if state == success_state:
		return Color("#07140eee")

	return Color("#081115ee")


func _content_clear_rects() -> Array[Rect2]:
	if component_name == "mini_button_states":
		return [Rect2(12.0, 7.0, 34.0, 18.0)]

	if component_name == "resource_chip_states":
		return [Rect2(42.0, 7.0, 102.0, 18.0)]

	if component_name == "alert_toast_states":
		return [Rect2(70.0, 15.0, 136.0, 38.0)]

	return []


func _button_rect() -> Rect2:
	if stretch_to_bounds or nine_slice_enabled:
		return Rect2(Vector2.ZERO, size)

	return E_GRID_UI_ATLAS.get_aspect_fit_rect(component_name, size)


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


func _source_scale(fitted_rect: Rect2) -> Vector2:
	var source_size := E_GRID_UI_ATLAS.get_cell_size(component_name)
	if source_size == Vector2i.ZERO:
		return Vector2.ONE

	return Vector2(
		fitted_rect.size.x / float(source_size.x),
		fitted_rect.size.y / float(source_size.y)
	)


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


func _request_redraw() -> void:
	queue_redraw()


func sync_visual_state() -> void:
	_sync_label()
	queue_redraw()


func _on_toggled(_pressed: bool) -> void:
	queue_redraw()
