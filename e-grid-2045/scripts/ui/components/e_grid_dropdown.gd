@tool
class_name EGridDropdown
extends Control

signal item_selected(index: int, label: String)

const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")
const E_GRID_SPRITE_BUTTON_SCRIPT := preload("res://scripts/ui/components/e_grid_sprite_button.gd")
const E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT := preload("res://scripts/ui/components/e_grid_component_bitmap_text.gd")
const E_GRID_DROPDOWN_ITEM_SCENE := preload("res://scenes/ui/components/e_grid_dropdown_item.tscn")

@export_group("Content")
@export var options := PackedStringArray(["Energy", "Cooling", "Compute"]):
	set(value):
		options = value
		selected_index = clampi(selected_index, 0, maxi(options.size() - 1, 0))
		_rebuild_items()
		_sync_state()

@export var selected_index := 0:
	set(value):
		selected_index = clampi(value, 0, maxi(options.size() - 1, 0))
		_sync_state()

@export var disabled := false:
	set(value):
		disabled = value
		if disabled:
			_force_close_popup()
		_sync_state()

@export_enum("normal", "warning", "critical", "success", "info", "readonly", "locked") var semantic_state := "normal":
	set(value):
		semantic_state = value
		_sync_state()

@export_group("Popup Layout")
@export_range(0.05, 0.6, 0.01) var animation_duration := 0.18
@export_range(2, 8, 1) var visible_item_count := 4:
	set(value):
		visible_item_count = value
		_layout_nodes()
@export_range(1, 5, 1) var wheel_scroll_items := 2
@export var item_size := Vector2(300.0, 36.0):
	set(value):
		item_size = value
		_layout_nodes()
		_sync_item_container_style()
		_rebuild_items()
@export_range(0, 16, 1) var item_separation := 3:
	set(value):
		item_separation = value
		_layout_nodes()
		_sync_item_container_style()
@export var popup_padding := Vector2(16.0, 16.0):
	set(value):
		popup_padding = value
		_layout_nodes()
@export var popup_offset_y := 56.0:
	set(value):
		popup_offset_y = value
		_layout_nodes()

@export_group("Item Scene")
@export var item_scene: PackedScene = E_GRID_DROPDOWN_ITEM_SCENE:
	set(value):
		item_scene = value
		_rebuild_items()
@export var item_component_name := "list_item_states":
	set(value):
		item_component_name = value
		_rebuild_items()
@export var item_normal_state := "normal":
	set(value):
		item_normal_state = value
		_rebuild_items()
@export var item_hover_state := "hover":
	set(value):
		item_hover_state = value
		_rebuild_items()
@export var item_pressed_state := "pressed":
	set(value):
		item_pressed_state = value
		_rebuild_items()
@export var item_selected_state := "selected":
	set(value):
		item_selected_state = value
		_rebuild_items()
@export var item_selected_hover_state := "selected":
	set(value):
		item_selected_hover_state = value
		_rebuild_items()
@export var item_disabled_state := "disabled":
	set(value):
		item_disabled_state = value
		_rebuild_items()
@export var item_warning_state := "warning":
	set(value):
		item_warning_state = value
		_rebuild_items()
@export var item_critical_state := "critical":
	set(value):
		item_critical_state = value
		_rebuild_items()
@export var item_success_state := "success":
	set(value):
		item_success_state = value
		_rebuild_items()
@export var item_label_color := Color("#e0e8e8"):
	set(value):
		item_label_color = value
		_apply_item_runtime_states()
@export var item_disabled_label_color := Color("#546467"):
	set(value):
		item_disabled_label_color = value
		_apply_item_runtime_states()

@export_group("Item State Overrides")
@export var disabled_item_indices := PackedInt32Array():
	set(value):
		disabled_item_indices = value
		_apply_item_runtime_states()
@export var warning_item_indices := PackedInt32Array():
	set(value):
		warning_item_indices = value
		_apply_item_runtime_states()
@export var critical_item_indices := PackedInt32Array():
	set(value):
		critical_item_indices = value
		_apply_item_runtime_states()
@export var success_item_indices := PackedInt32Array():
	set(value):
		success_item_indices = value
		_apply_item_runtime_states()

var _field_texture: TextureRect
var _selected_label: Control
var _hotspot: Button
var _open_panel: Control
var _open_texture: TextureRect
var _scroll_container: ScrollContainer
var _items: VBoxContainer
var _is_open := false
var _tween: Tween
var _item_button_group := ButtonGroup.new()


func _ready() -> void:
	focus_mode = Control.FOCUS_ALL
	_cache_nodes()
	_prepare_hotspot()
	_rebuild_items()
	_sync_state()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_layout_nodes()
		_sync_selected_label_layout()


func _gui_input(event: InputEvent) -> void:
	if _handle_keyboard_event(event):
		accept_event()


func _input(event: InputEvent) -> void:
	if not _is_open or disabled:
		return

	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if not _contains_global_point(event.global_position):
			close()


func open() -> void:
	_set_open(true)


func close() -> void:
	_set_open(false)


func toggle() -> void:
	_set_open(not _is_open)


func _cache_nodes() -> void:
	_field_texture = get_node_or_null("FieldTexture") as TextureRect
	_selected_label = get_node_or_null("SelectedBitmapText") as Control
	if _selected_label == null:
		var old_label := get_node_or_null("SelectedLabel") as Label
		_selected_label = E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT.new() as Control
		_selected_label.name = "SelectedBitmapText"
		add_child(_selected_label)
		if old_label != null:
			_selected_label.anchor_left = old_label.anchor_left
			_selected_label.anchor_top = old_label.anchor_top
			_selected_label.anchor_right = old_label.anchor_right
			_selected_label.anchor_bottom = old_label.anchor_bottom
			_selected_label.offset_left = old_label.offset_left
			_selected_label.offset_top = old_label.offset_top
			_selected_label.offset_right = old_label.offset_right
			_selected_label.offset_bottom = old_label.offset_bottom
			old_label.visible = false
	_hotspot = get_node_or_null("Hotspot") as Button
	_open_panel = get_node_or_null("OpenPanel") as Control

	if _open_panel != null:
		_open_panel.mouse_filter = Control.MOUSE_FILTER_STOP
		var panel_input_call := Callable(self, "_on_popup_panel_gui_input")
		if not _open_panel.gui_input.is_connected(panel_input_call):
			_open_panel.gui_input.connect(panel_input_call)
		_open_texture = _open_panel.get_node_or_null("OpenTexture") as TextureRect
		_scroll_container = _open_panel.get_node_or_null("Scroll") as ScrollContainer
		_items = _open_panel.find_child("Items", true, false) as VBoxContainer
		_style_scroll_container()


func _prepare_hotspot() -> void:
	if _hotspot == null:
		return

	_hotspot.text = ""
	_hotspot.flat = true
	_hotspot.focus_mode = Control.FOCUS_ALL
	_hotspot.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_hotspot.add_theme_stylebox_override("normal", StyleBoxEmpty.new())
	_hotspot.add_theme_stylebox_override("hover", StyleBoxEmpty.new())
	_hotspot.add_theme_stylebox_override("pressed", StyleBoxEmpty.new())
	_hotspot.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	_hotspot.add_theme_stylebox_override("disabled", StyleBoxEmpty.new())

	if not _hotspot.pressed.is_connected(toggle):
		_hotspot.pressed.connect(toggle)

	if not _hotspot.gui_input.is_connected(_on_hotspot_gui_input):
		_hotspot.gui_input.connect(_on_hotspot_gui_input)

	var sync_call := Callable(self, "_sync_state")
	if not _hotspot.mouse_entered.is_connected(sync_call):
		_hotspot.mouse_entered.connect(sync_call)
	if not _hotspot.mouse_exited.is_connected(sync_call):
		_hotspot.mouse_exited.connect(sync_call)
	if not _hotspot.focus_entered.is_connected(sync_call):
		_hotspot.focus_entered.connect(sync_call)
	if not _hotspot.focus_exited.is_connected(sync_call):
		_hotspot.focus_exited.connect(sync_call)

	if _field_texture != null:
		_field_texture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED

	if _open_texture != null:
		_open_texture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		_open_texture.visible = false


func _layout_nodes() -> void:
	if _open_panel != null:
		var panel_width := maxf(size.x, item_size.x + popup_padding.x * 2.0)
		var list_height := float(visible_item_count) * item_size.y + float(maxi(visible_item_count - 1, 0)) * float(item_separation)
		var panel_height := list_height + popup_padding.y * 2.0
		_open_panel.position = Vector2(0.0, popup_offset_y)
		_open_panel.custom_minimum_size = Vector2(panel_width, panel_height)
		_open_panel.size = _open_panel.custom_minimum_size

	if _scroll_container != null and _open_panel != null:
		_scroll_container.position = popup_padding
		_scroll_container.size = Vector2(
			maxf(item_size.x, _open_panel.custom_minimum_size.x - popup_padding.x * 2.0),
			maxf(item_size.y, _open_panel.custom_minimum_size.y - popup_padding.y * 2.0)
		)


func _sync_state() -> void:
	_cache_nodes()
	_layout_nodes()

	var field_state := _field_state()
	if _field_texture != null:
		_field_texture.texture = E_GRID_UI_ATLAS.get_texture("dropdown_field_states", field_state)

	if _open_texture != null:
		_open_texture.texture = null
		_open_texture.visible = false

	if _selected_label != null:
		_selected_label.set("text", _selected_text())
		_selected_label.set("font_color", Color("#e0e8e8") if not disabled else Color("#546467"))
		_sync_selected_label_layout()
		_selected_label.queue_redraw()

	if _hotspot != null:
		_hotspot.disabled = disabled

	_apply_item_runtime_states()


func _field_state() -> String:
	if disabled:
		return "disabled"
	if semantic_state != "normal":
		return semantic_state
	if _is_open:
		return "open"
	if _hotspot != null and _hotspot.button_pressed:
		return "pressed"
	if _hotspot != null and (_hotspot.is_hovered() or _hotspot.has_focus()):
		return "hover"
	return "normal"


func _open_state() -> String:
	if disabled:
		return "open_disabled"
	if semantic_state == "warning":
		return "open_warning"
	if _is_open:
		return "open_selected_focus"
	return "open_default"


func _selected_text() -> String:
	if options.is_empty():
		return ""

	return options[clampi(selected_index, 0, options.size() - 1)]


func _sync_selected_label_layout() -> void:
	if _selected_label == null:
		return

	_selected_label.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_selected_label.position = Vector2(18.0, 8.0)
	_selected_label.size = Vector2(260.0, 40.0)
	_selected_label.set("horizontal_alignment", "left")
	_selected_label.set("vertical_alignment", "center")


func _set_open(opened: bool) -> void:
	if disabled:
		return

	_is_open = opened
	_sync_state()

	if _open_panel == null:
		return

	if _tween != null:
		_tween.kill()

	_open_panel.visible = true
	_open_panel.pivot_offset = Vector2.ZERO
	_tween = create_tween()
	_tween.set_trans(Tween.TRANS_CUBIC)
	_tween.set_ease(Tween.EASE_OUT)

	if _is_open:
		_open_panel.scale = Vector2(1.0, maxf(_open_panel.scale.y, 0.01))
		_tween.parallel().tween_property(_open_panel, "scale:y", 1.0, animation_duration)
		_tween.parallel().tween_property(_open_panel, "modulate:a", 1.0, animation_duration)
		call_deferred("_scroll_selected_item_into_view")
	else:
		_tween.parallel().tween_property(_open_panel, "scale:y", 0.01, animation_duration)
		_tween.parallel().tween_property(_open_panel, "modulate:a", 0.0, animation_duration)
		_tween.finished.connect(func() -> void:
			if not _is_open and _open_panel != null:
				_open_panel.visible = false
		)


func _rebuild_items() -> void:
	if not is_inside_tree():
		return

	_cache_nodes()
	if _items == null:
		return

	for child in _items.get_children():
		_items.remove_child(child)
		child.queue_free()

	_item_button_group = ButtonGroup.new()
	_set_property_if_available(_item_button_group, "allow_unpress", false)

	_sync_item_container_style()
	for index in range(options.size()):
		var item := _create_item(index)
		item.toggle_mode = true
		item.button_group = _item_button_group
		item.custom_minimum_size = item_size
		item.size = item_size
		item.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
		item.pressed.connect(_on_item_pressed.bind(index))
		item.gui_input.connect(_on_item_gui_input.bind(item))
		_items.add_child(item)

	_sync_item_container_style()
	_apply_item_runtime_states()


func _create_item(index: int) -> BaseButton:
	var instance: Node = null
	if item_scene != null:
		instance = item_scene.instantiate()

	if not (instance is BaseButton):
		if instance != null:
			instance.queue_free()
		instance = E_GRID_SPRITE_BUTTON_SCRIPT.new()

	var item := instance as BaseButton
	item.name = "Item%02d_%s" % [index, _node_safe_name(options[index])]
	_configure_item(item, index)
	return item


func _configure_item(item: BaseButton, index: int) -> void:
	item.text = ""
	item.toggle_mode = true
	item.focus_mode = Control.FOCUS_ALL
	item.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	item.custom_minimum_size = item_size

	_set_property_if_available(item, "component_name", item_component_name)
	_set_property_if_available(item, "normal_state", item_normal_state)
	_set_property_if_available(item, "hover_state", item_hover_state)
	_set_property_if_available(item, "pressed_state", item_pressed_state)
	_set_property_if_available(item, "selected_state", item_selected_state)
	_set_property_if_available(item, "selected_hover_state", item_selected_hover_state)
	_set_property_if_available(item, "disabled_state", item_disabled_state)
	_set_property_if_available(item, "warning_state", item_warning_state)
	_set_property_if_available(item, "critical_state", item_critical_state)
	_set_property_if_available(item, "success_state", item_success_state)
	_set_property_if_available(item, "selected_state_overrides_semantic", true)
	_set_property_if_available(item, "label_text", options[index])
	_set_property_if_available(item, "label_color", item_label_color)
	_set_property_if_available(item, "disabled_label_color", item_disabled_label_color)

	if not _has_property(item, "label_text"):
		item.text = options[index]


func _sync_item_container_style() -> void:
	if _items == null:
		return

	_items.custom_minimum_size = Vector2(item_size.x, _list_content_height())
	_items.add_theme_constant_override("separation", item_separation)


func _list_content_height() -> float:
	var item_count := options.size()
	if _items != null and _items.get_child_count() > 0:
		item_count = _items.get_child_count()

	if item_count <= 0:
		return 0.0

	return float(item_count) * item_size.y + float(item_count - 1) * float(item_separation)


func _apply_item_runtime_states() -> void:
	if _items == null:
		return

	for index in range(_items.get_child_count()):
		var item := _items.get_child(index) as BaseButton
		if item == null:
			continue

		var item_disabled := disabled or _is_item_disabled(index)
		item.disabled = item_disabled
		item.button_pressed = index == selected_index
		item.mouse_default_cursor_shape = Control.CURSOR_ARROW if item_disabled else Control.CURSOR_POINTING_HAND
		_set_property_if_available(item, "semantic_state", _item_semantic_state(index))
		_set_property_if_available(item, "label_color", item_label_color)
		_set_property_if_available(item, "disabled_label_color", item_disabled_label_color)
		item.queue_redraw()


func _is_item_disabled(index: int) -> bool:
	return disabled_item_indices.has(index)


func _item_semantic_state(index: int) -> String:
	if critical_item_indices.has(index):
		return "critical"

	if warning_item_indices.has(index):
		return "warning"

	if success_item_indices.has(index):
		return "success"

	return "normal"


func _set_property_if_available(target: Object, property_name: String, value: Variant) -> void:
	if _has_property(target, property_name):
		target.set(property_name, value)


func _has_property(target: Object, property_name: String) -> bool:
	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			return true

	return false


func _node_safe_name(label: String) -> String:
	var result := ""

	for index in range(label.length()):
		var character := label.substr(index, 1)
		if character.is_valid_identifier():
			result += character
		elif character == " " or character == "-":
			result += "_"

	return result if not result.is_empty() else "Option"


func _style_scroll_container() -> void:
	if _scroll_container == null:
		return

	_scroll_container.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var scroll_input_call := Callable(self, "_on_scroll_container_gui_input")
	if not _scroll_container.gui_input.is_connected(scroll_input_call):
		_scroll_container.gui_input.connect(scroll_input_call)

	var vbar := _scroll_container.get_v_scroll_bar()
	if vbar == null:
		return

	var scroll_style := StyleBoxEmpty.new()
	var grabber_style := StyleBoxFlat.new()
	grabber_style.bg_color = Color("#1fd0e2cc")
	grabber_style.corner_radius_top_left = 2
	grabber_style.corner_radius_top_right = 2
	grabber_style.corner_radius_bottom_left = 2
	grabber_style.corner_radius_bottom_right = 2

	var grabber_hover_style := grabber_style.duplicate() as StyleBoxFlat
	grabber_hover_style.bg_color = Color("#3af5ffee")

	vbar.custom_minimum_size = Vector2(5.0, 0.0)
	vbar.add_theme_stylebox_override("scroll", scroll_style)
	vbar.add_theme_stylebox_override("scroll_focus", scroll_style)
	vbar.add_theme_stylebox_override("grabber", grabber_style)
	vbar.add_theme_stylebox_override("grabber_highlight", grabber_hover_style)
	vbar.add_theme_stylebox_override("grabber_pressed", grabber_hover_style)


func _on_item_pressed(index: int) -> void:
	if _is_item_disabled(index):
		return

	selected_index = index
	_sync_state()
	item_selected.emit(selected_index, _selected_text())
	close()


func _handle_keyboard_event(event: InputEvent) -> bool:
	var key_event := event as InputEventKey
	if disabled or key_event == null or not key_event.pressed or key_event.echo:
		return false

	if key_event.is_action_pressed("ui_cancel"):
		if _is_open:
			close()
			return true
		return false

	if key_event.is_action_pressed("ui_accept"):
		if _is_open:
			close()
		else:
			open()
		return true

	if key_event.is_action_pressed("ui_down"):
		if not _is_open:
			open()
		else:
			_move_selection(1)
		return true

	if key_event.is_action_pressed("ui_up"):
		if not _is_open:
			open()
		else:
			_move_selection(-1)
		return true

	return false


func _move_selection(delta: int) -> void:
	if options.is_empty():
		return

	var next_index := selected_index
	for _step in range(options.size()):
		next_index = wrapi(next_index + delta, 0, options.size())
		if not _is_item_disabled(next_index):
			if next_index == selected_index:
				return
			selected_index = next_index
			item_selected.emit(selected_index, _selected_text())
			_scroll_selected_item_into_view()
			return


func _scroll_selected_item_into_view() -> void:
	if _scroll_container == null or _items == null:
		return

	if selected_index < 0 or selected_index >= _items.get_child_count():
		return

	var selected_item := _items.get_child(selected_index) as Control
	if selected_item != null:
		_scroll_container.ensure_control_visible(selected_item)


func _handle_scroll_input(event: InputEvent) -> bool:
	var mouse_button := event as InputEventMouseButton
	if mouse_button == null or not mouse_button.pressed:
		return false

	if mouse_button.button_index == MOUSE_BUTTON_WHEEL_DOWN:
		_scroll_popup_by_items(wheel_scroll_items)
		return true

	if mouse_button.button_index == MOUSE_BUTTON_WHEEL_UP:
		_scroll_popup_by_items(-wheel_scroll_items)
		return true

	return false


func _scroll_popup_by_items(item_delta: int) -> void:
	if _scroll_container == null:
		return

	var step_size := int(roundf((item_size.y + float(item_separation)) * float(item_delta)))
	var previous_scroll := _scroll_container.scroll_vertical
	_scroll_container.scroll_vertical += step_size
	if step_size != 0 and _scroll_container.scroll_vertical == previous_scroll:
		call_deferred("_apply_deferred_scroll", step_size)


func _apply_deferred_scroll(step_size: int) -> void:
	if _scroll_container != null:
		_scroll_container.scroll_vertical += step_size


func _force_close_popup() -> void:
	_is_open = false
	if _tween != null:
		_tween.kill()
		_tween = null

	if _open_panel != null:
		_open_panel.visible = false
		_open_panel.modulate.a = 0.0
		_open_panel.scale.y = 0.01


func _contains_global_point(screen_position: Vector2) -> bool:
	if get_global_rect().has_point(screen_position):
		return true

	if _open_panel != null and _open_panel.visible and _open_panel.get_global_rect().has_point(screen_position):
		return true

	return false


func _on_hotspot_gui_input(event: InputEvent) -> void:
	if _handle_keyboard_event(event):
		_hotspot.accept_event()


func _on_popup_panel_gui_input(event: InputEvent) -> void:
	if _handle_scroll_input(event):
		_open_panel.accept_event()


func _on_scroll_container_gui_input(event: InputEvent) -> void:
	if _handle_scroll_input(event):
		_scroll_container.accept_event()


func _on_item_gui_input(event: InputEvent, source_item: Control) -> void:
	if _handle_scroll_input(event):
		source_item.accept_event()
