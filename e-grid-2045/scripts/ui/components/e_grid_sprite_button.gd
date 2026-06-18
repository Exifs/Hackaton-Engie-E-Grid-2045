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
	var fitted_rect := E_GRID_UI_ATLAS.get_aspect_fit_rect(component_name, size)

	if texture != null:
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

	if cell_size != Vector2i.ZERO:
		custom_minimum_size = Vector2(cell_size)

	queue_redraw()


func _sync_label() -> void:
	if _label == null:
		_cache_label()

	if _label == null:
		return

	_label.set("text", label_text)
	_label.set("font_color", disabled_label_color if disabled else label_color)
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
	var fitted_rect := E_GRID_UI_ATLAS.get_aspect_fit_rect(component_name, size)
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

	if (is_hovered() or has_focus()) and not hover_state.is_empty():
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

	if is_hovered() and not selected_hover_state.is_empty():
		return E_GRID_UI_ATLAS.get_first_available_state(component_name, [selected_hover_state, selected_state, normal_state])

	return E_GRID_UI_ATLAS.get_first_available_state(component_name, [selected_state, pressed_state, normal_state])


func _draw_utility_icon(fitted_rect: Rect2) -> void:
	if utility_icon_state.is_empty():
		return

	var icon_texture := E_GRID_UI_ATLAS.get_texture("utility_icons_48px", utility_icon_state)
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
		draw_rect(target_rect, Color("#081115f2"), true)


func _content_clear_rects() -> Array[Rect2]:
	if component_name == "resource_chip_states":
		return [Rect2(42.0, 7.0, 102.0, 18.0)]

	if component_name == "alert_toast_states":
		return [Rect2(70.0, 15.0, 136.0, 38.0)]

	return []


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


func _request_redraw() -> void:
	queue_redraw()


func _on_toggled(_pressed: bool) -> void:
	queue_redraw()
