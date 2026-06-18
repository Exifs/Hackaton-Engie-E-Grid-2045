@tool
class_name EGridDropdown
extends Control

signal item_selected(index: int, label: String)

const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")
const E_GRID_SPRITE_BUTTON_SCRIPT := preload("res://scripts/ui/components/e_grid_sprite_button.gd")
const E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT := preload("res://scripts/ui/components/e_grid_component_bitmap_text.gd")
const E_GRID_DROPDOWN_ITEM_SCENE := preload("res://scenes/ui/components/e_grid_dropdown_item.tscn")
const SELECTED_LABEL_FONT_ATLAS := preload("res://assets/ui/menu/font/egrid_2045_menu_font_atlas_normal.png")
const SELECTED_LABEL_ACTIVE_FONT_ATLAS := preload("res://assets/ui/menu/font/egrid_2045_menu_font_atlas_hover.png")
const POPUP_Z_INDEX := 4096

static var _active_dropdown: EGridDropdown

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

@export_group("Field Layout")
@export var selected_label_source_rect := Rect2(42.0, 8.0, 240.0, 40.0):
	set(value):
		selected_label_source_rect = value
		_sync_selected_label_layout()
@export var popup_scrollbar_width := 14.0:
	set(value):
		popup_scrollbar_width = value
		_layout_nodes()
@export var popup_scrollbar_track_width := 4.0:
	set(value):
		popup_scrollbar_track_width = value
		_layout_nodes()
@export var selected_label_color := Color("#ffffff"):
	set(value):
		selected_label_color = value
		_sync_state()
@export var selected_label_disabled_color := Color("#6f7c7f"):
	set(value):
		selected_label_disabled_color = value
		_sync_state()
@export_range(0.10, 0.24, 0.01) var selected_label_scale_px := 0.17:
	set(value):
		selected_label_scale_px = value
		_sync_state()

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
@export var selected_item_label_color := Color("#ffffff"):
	set(value):
		selected_item_label_color = value
		_apply_item_runtime_states()
@export var item_disabled_label_color := Color("#546467"):
	set(value):
		item_disabled_label_color = value
		_apply_item_runtime_states()
@export var item_status_states_enabled := false:
	set(value):
		item_status_states_enabled = value
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
var _legacy_selected_label: Label
var _indicator_overlay: Control
var _hotspot: Button
var _open_panel: Control
var _open_texture: TextureRect
var _scroll_container: ScrollContainer
var _popup_scrollbar: Control
var _items: VBoxContainer
var _is_open := false
var _tween: Tween
var _item_button_group := ButtonGroup.new()
var _option_ids := PackedInt32Array()


func _ready() -> void:
	focus_mode = Control.FOCUS_ALL
	set_process(false)
	_sync_option_ids()
	_cache_nodes()
	_prepare_hotspot()
	_rebuild_items()
	_sync_state()


func _process(_delta: float) -> void:
	if _is_open:
		_sync_popup_canvas_position()


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

	if _handle_global_scroll_input(event):
		return

	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if not _contains_global_point(event.global_position):
			close()


func _exit_tree() -> void:
	if _active_dropdown == self:
		_active_dropdown = null


func open() -> void:
	_set_open(true)


func close() -> void:
	_set_open(false)


func toggle() -> void:
	_set_open(not _is_open)


func clear() -> void:
	options = PackedStringArray()
	_option_ids = PackedInt32Array()
	selected_index = 0
	_rebuild_items()
	_sync_state()


func add_item(label: String, id := -1) -> void:
	var next_options := options.duplicate()
	next_options.append(label)
	options = next_options
	_sync_option_ids()
	_option_ids[_option_ids.size() - 1] = id if id >= 0 else _option_ids.size() - 1
	selected_index = clampi(selected_index, 0, maxi(options.size() - 1, 0))
	_rebuild_items()
	_sync_state()


func select(index: int) -> void:
	select_index(index, false, false)


func get_item_count() -> int:
	return options.size()


func get_item_id(index: int) -> int:
	if index < 0 or index >= options.size():
		return -1

	_sync_option_ids()
	return _option_ids[index]


func get_item_text(index: int) -> String:
	if index < 0 or index >= options.size():
		return ""

	return options[index]


func get_selected_id() -> int:
	return get_item_id(selected_index)


func _cache_nodes() -> void:
	_field_texture = get_node_or_null("FieldTexture") as TextureRect
	_legacy_selected_label = get_node_or_null("SelectedLabel") as Label
	_selected_label = get_node_or_null("SelectedBitmapText") as Control
	if _selected_label == null:
		_selected_label = E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT.new() as Control
		_selected_label.name = "SelectedBitmapText"
		add_child(_selected_label)
		if _legacy_selected_label != null:
			_selected_label.anchor_left = _legacy_selected_label.anchor_left
			_selected_label.anchor_top = _legacy_selected_label.anchor_top
			_selected_label.anchor_right = _legacy_selected_label.anchor_right
			_selected_label.anchor_bottom = _legacy_selected_label.anchor_bottom
			_selected_label.offset_left = _legacy_selected_label.offset_left
			_selected_label.offset_top = _legacy_selected_label.offset_top
			_selected_label.offset_right = _legacy_selected_label.offset_right
			_selected_label.offset_bottom = _legacy_selected_label.offset_bottom
	if _legacy_selected_label != null:
		_legacy_selected_label.text = _selected_text()
		_legacy_selected_label.visible = false
		_legacy_selected_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_indicator_overlay = get_node_or_null("IndicatorOverlay") as Control
	if _indicator_overlay != null:
		_indicator_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hotspot = get_node_or_null("Hotspot") as Button
	_open_panel = get_node_or_null("OpenPanel") as Control

	if _open_panel != null:
		_open_panel.mouse_filter = Control.MOUSE_FILTER_STOP
		var panel_input_call := Callable(self, "_on_popup_panel_gui_input")
		if not _open_panel.gui_input.is_connected(panel_input_call):
			_open_panel.gui_input.connect(panel_input_call)
		_open_panel.z_index = POPUP_Z_INDEX
		_set_property_if_available(_open_panel, "z_as_relative", false)
		_open_texture = _open_panel.get_node_or_null("OpenTexture") as TextureRect
		_scroll_container = _open_panel.get_node_or_null("Scroll") as ScrollContainer
		_popup_scrollbar = _open_panel.get_node_or_null("DropdownScrollbar") as Control
		_items = _open_panel.find_child("Items", true, false) as VBoxContainer
		if _scroll_container != null:
			_scroll_container.mouse_filter = Control.MOUSE_FILTER_STOP
		if _items != null:
			_items.mouse_filter = Control.MOUSE_FILTER_STOP
		if _popup_scrollbar != null:
			_popup_scrollbar.mouse_filter = Control.MOUSE_FILTER_STOP
		_style_scroll_container()
		_refresh_popup_scrollbar()


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
		_open_panel.custom_minimum_size = Vector2(panel_width, panel_height)
		_open_panel.size = _open_panel.custom_minimum_size
		_sync_popup_canvas_position()

	if _scroll_container != null and _open_panel != null:
		_scroll_container.position = popup_padding
		_scroll_container.size = Vector2(
			maxf(item_size.x, _open_panel.custom_minimum_size.x - popup_padding.x * 2.0),
			maxf(item_size.y, _open_panel.custom_minimum_size.y - popup_padding.y * 2.0)
		)

	if _popup_scrollbar != null and _scroll_container != null:
		var right_scrollbar_x := _scroll_container.position.x + item_size.x + 2.0
		var max_scrollbar_x := _open_panel.custom_minimum_size.x - popup_padding.x + 2.0
		_popup_scrollbar.position = Vector2(minf(right_scrollbar_x, max_scrollbar_x), popup_padding.y)
		_popup_scrollbar.size = Vector2(popup_scrollbar_width, _scroll_container.size.y)
		_set_property_if_available(_popup_scrollbar, "track_width", popup_scrollbar_track_width)
		call_deferred("_refresh_popup_scrollbar")

	if _indicator_overlay != null:
		_indicator_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
		_indicator_overlay.offset_left = 0.0
		_indicator_overlay.offset_top = 0.0
		_indicator_overlay.offset_right = 0.0
		_indicator_overlay.offset_bottom = 0.0


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
		_selected_label.set("atlas_texture", _selected_label_atlas())
		_selected_label.set("font_color", selected_label_color if not disabled else selected_label_disabled_color)
		_set_property_if_available(_selected_label, "scale_px", selected_label_scale_px)
		_set_property_if_available(_selected_label, "min_scale_px", 0.10)
		_set_property_if_available(_selected_label, "max_scale_px", 0.22)
		_set_property_if_available(_selected_label, "opacity_passes", 1)
		_set_property_if_available(_selected_label, "shadow_enabled", not disabled)
		_set_property_if_available(_selected_label, "shadow_color", Color("#020608f2"))
		_set_property_if_available(_selected_label, "shadow_offset", Vector2(1.0, 1.0))
		_set_property_if_available(_selected_label, "outline_enabled", not disabled)
		_set_property_if_available(_selected_label, "outline_color", Color("#020608e6"))
		_set_property_if_available(_selected_label, "outline_size", 1.0)
		_sync_selected_label_layout()
		_selected_label.queue_redraw()
	_sync_legacy_selected_label()

	_sync_indicator_state()

	if _hotspot != null:
		_hotspot.disabled = disabled

	_apply_item_runtime_states()
	_refresh_popup_scrollbar()


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


func _selected_label_atlas() -> Texture2D:
	if disabled:
		return SELECTED_LABEL_FONT_ATLAS

	var hovered := _hotspot != null and (_hotspot.is_hovered() or _hotspot.has_focus())
	return SELECTED_LABEL_ACTIVE_FONT_ATLAS if _is_open or hovered else SELECTED_LABEL_FONT_ATLAS


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

	var fitted_rect := E_GRID_UI_ATLAS.get_aspect_fit_rect("dropdown_field_states", size)
	var source_scale := _field_source_scale(fitted_rect)
	_selected_label.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_selected_label.position = fitted_rect.position + selected_label_source_rect.position * source_scale
	_selected_label.size = selected_label_source_rect.size * source_scale
	_selected_label.set("horizontal_alignment", "left")
	_selected_label.set("vertical_alignment", "center")
	_selected_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_selected_label.z_index = 16


func _sync_legacy_selected_label() -> void:
	if _legacy_selected_label == null:
		return

	_legacy_selected_label.text = _selected_text()
	_legacy_selected_label.visible = false


func _sync_indicator_state() -> void:
	if _indicator_overlay == null:
		return

	_indicator_overlay.set("opened", _is_open)
	_indicator_overlay.set("disabled", disabled)
	_indicator_overlay.set("semantic_state", semantic_state)
	_indicator_overlay.set("hovered", _hotspot != null and (_hotspot.is_hovered() or _hotspot.has_focus()))
	_indicator_overlay.queue_redraw()


func _set_open(opened: bool) -> void:
	if disabled:
		return

	if opened:
		_close_active_dropdown()
		_active_dropdown = self
	elif _active_dropdown == self:
		_active_dropdown = null

	_is_open = opened
	set_process(_is_open)
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
		_sync_popup_canvas_position()
		_open_panel.mouse_filter = Control.MOUSE_FILTER_STOP
		_tween.parallel().tween_property(_open_panel, "scale:y", 1.0, animation_duration)
		_tween.parallel().tween_property(_open_panel, "modulate:a", 1.0, animation_duration)
		call_deferred("_scroll_selected_item_into_view")
		call_deferred("_refresh_popup_scrollbar")
	else:
		_tween.parallel().tween_property(_open_panel, "scale:y", 0.01, animation_duration)
		_tween.parallel().tween_property(_open_panel, "modulate:a", 0.0, animation_duration)
		_tween.finished.connect(func() -> void:
			if not _is_open and _open_panel != null:
				_open_panel.visible = false
				_set_popup_top_level(false)
				_open_panel.position = Vector2(0.0, popup_offset_y)
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
		item.toggled.connect(_on_item_toggled.bind(index))
		item.gui_input.connect(_on_item_gui_input.bind(item))
		_items.add_child(item)

	_sync_item_container_style()
	_apply_item_runtime_states()
	call_deferred("_refresh_popup_scrollbar")


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
	item.mouse_filter = Control.MOUSE_FILTER_STOP
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
		var is_selected := index == selected_index
		item.disabled = item_disabled
		_set_button_pressed_no_signal(item, is_selected)
		item.mouse_default_cursor_shape = Control.CURSOR_ARROW if item_disabled else Control.CURSOR_POINTING_HAND
		_set_property_if_available(item, "semantic_state", _item_semantic_state(index) if item_status_states_enabled and not is_selected else "normal")
		_set_property_if_available(item, "label_color", selected_item_label_color if is_selected else item_label_color)
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


func _set_button_pressed_no_signal(item: BaseButton, pressed: bool) -> void:
	if item.has_method("set_pressed_no_signal"):
		item.call("set_pressed_no_signal", pressed)
	else:
		item.button_pressed = pressed


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
	vbar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vbar.custom_minimum_size = Vector2.ZERO
	vbar.add_theme_stylebox_override("scroll", scroll_style)
	vbar.add_theme_stylebox_override("scroll_focus", scroll_style)
	vbar.add_theme_stylebox_override("grabber", scroll_style)
	vbar.add_theme_stylebox_override("grabber_highlight", scroll_style)
	vbar.add_theme_stylebox_override("grabber_pressed", scroll_style)


func _on_item_pressed(index: int) -> void:
	select_index(index, true, true)


func _on_item_toggled(pressed: bool, index: int) -> void:
	if pressed:
		select_index(index, true, true)
	else:
		call_deferred("_apply_item_runtime_states")


func select_index(index: int, close_popup := true, emit_change := true) -> void:
	if disabled or options.is_empty():
		return

	var next_index := clampi(index, 0, options.size() - 1)
	if _is_item_disabled(next_index):
		_apply_item_runtime_states()
		return

	var changed := selected_index != next_index
	selected_index = next_index
	_sync_state()
	if emit_change and changed:
		item_selected.emit(selected_index, _selected_text())
	if close_popup:
		close()


func _sync_option_ids() -> void:
	while _option_ids.size() < options.size():
		_option_ids.append(_option_ids.size())

	while _option_ids.size() > options.size():
		_option_ids.remove_at(_option_ids.size() - 1)


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
			select_index(next_index, false, true)
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
	_scroll_popup_by_pixels(float(step_size))


func _scroll_popup_by_pixels(pixel_delta: float) -> void:
	if _scroll_container == null:
		return

	var previous_scroll := _scroll_container.scroll_vertical
	var next_scroll := clampf(float(previous_scroll) + pixel_delta, 0.0, _popup_scroll_max())
	_scroll_container.scroll_vertical = int(roundf(next_scroll))

	var vbar := _scroll_container.get_v_scroll_bar()
	if vbar != null:
		vbar.value = next_scroll

	_refresh_popup_scrollbar()
	if absf(next_scroll - float(previous_scroll)) > 0.5 and _scroll_container.scroll_vertical == previous_scroll:
		call_deferred("_apply_deferred_scroll", int(roundf(pixel_delta)))


func _apply_deferred_scroll(step_size: int) -> void:
	if _scroll_container != null:
		var next_scroll := clampf(float(_scroll_container.scroll_vertical + step_size), 0.0, _popup_scroll_max())
		_scroll_container.scroll_vertical = int(roundf(next_scroll))
		_refresh_popup_scrollbar()


func _force_close_popup() -> void:
	_is_open = false
	set_process(false)
	if _active_dropdown == self:
		_active_dropdown = null

	if _tween != null:
		_tween.kill()
		_tween = null

	if _open_panel != null:
		_open_panel.visible = false
		_open_panel.modulate.a = 0.0
		_open_panel.scale.y = 0.01
		_set_popup_top_level(false)
		_open_panel.position = Vector2(0.0, popup_offset_y)


func _contains_global_point(screen_position: Vector2) -> bool:
	if get_global_rect().has_point(screen_position):
		return true

	if _open_panel != null and _open_panel.visible and _open_panel.get_global_rect().has_point(screen_position):
		return true

	return false


func _handle_global_scroll_input(event: InputEvent) -> bool:
	if _open_panel == null or not _open_panel.visible:
		return false

	var mouse_button := event as InputEventMouseButton
	if mouse_button == null or not mouse_button.pressed:
		return false

	if mouse_button.button_index != MOUSE_BUTTON_WHEEL_DOWN and mouse_button.button_index != MOUSE_BUTTON_WHEEL_UP:
		return false

	if not _open_panel.get_global_rect().has_point(mouse_button.global_position):
		return false

	if _handle_scroll_input(event):
		get_viewport().set_input_as_handled()
		return true

	return false


func _refresh_popup_scrollbar() -> void:
	if _popup_scrollbar == null:
		return

	_set_property_if_available(_popup_scrollbar, "scroll_container", _scroll_container)
	_set_property_if_available(_popup_scrollbar, "track_width", popup_scrollbar_track_width)
	if _popup_scrollbar.has_method("refresh"):
		_popup_scrollbar.call("refresh")


func _sync_popup_canvas_position() -> void:
	if _open_panel == null:
		return

	if _is_open or _open_panel.visible:
		_set_popup_top_level(true)
		_open_panel.global_position = global_position + Vector2(0.0, popup_offset_y)
	else:
		_set_popup_top_level(false)
		_open_panel.position = Vector2(0.0, popup_offset_y)


func _set_popup_top_level(enabled: bool) -> void:
	if _open_panel == null:
		return

	_open_panel.z_index = POPUP_Z_INDEX
	_set_property_if_available(_open_panel, "z_as_relative", false)
	if _open_panel.has_method("set_as_top_level"):
		_open_panel.call("set_as_top_level", enabled)
	else:
		_set_property_if_available(_open_panel, "top_level", enabled)


func _close_active_dropdown() -> void:
	if _active_dropdown == null or _active_dropdown == self:
		return

	if is_instance_valid(_active_dropdown):
		_active_dropdown.close()

	_active_dropdown = null


func _popup_scroll_max() -> float:
	if _scroll_container == null or _items == null:
		return 0.0

	return maxf(_list_content_height() - _scroll_container.size.y, 0.0)


func _field_source_scale(fitted_rect: Rect2) -> float:
	var source_size := E_GRID_UI_ATLAS.get_cell_size("dropdown_field_states")
	if source_size == Vector2i.ZERO:
		return 1.0

	return fitted_rect.size.x / float(source_size.x)


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
