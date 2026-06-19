extends Control
class_name EGridBuildCategory

signal tool_requested(tool_id: String)

const ICON_BUTTON_SCENE := preload("res://scenes/ui/components/e_grid_icon_button.tscn")
const PRIMARY_BUTTON_PATH := ^"ContentMargin/CategoryRow/PrimaryButton"
const TITLE_LABEL_PATH := ^"ContentMargin/CategoryRow/ToolsStack/Header/TitleLabel"
const SLOTS_GRID_PATH := ^"ContentMargin/CategoryRow/ToolsStack/SlotsGrid"
const BUTTON_FAMILY_SELECTED_STATE := {
	"energy": "energy_selected",
	"datacenter": "datacenter_selected",
	"cooling": "cooling_selected",
	"research": "research_selected",
	"grid": "grid_selected",
}

@export var category_title := "CATEGORY":
	set(value):
		category_title = value
		_request_title_sync()

@export var tool_labels := PackedStringArray(["Tool A", "Tool B", "Tool C", "Tool D"]):
	set(value):
		tool_labels = value
		_request_slots_sync()

@export var tool_ids := PackedStringArray():
	set(value):
		tool_ids = value
		_request_slots_sync()

@export var tool_icon_states := PackedStringArray(["energy", "battery", "compute", "grid"]):
	set(value):
		tool_icon_states = value
		_request_slots_sync()

@export_enum("energy", "datacenter", "cooling", "research", "grid") var button_family := "energy":
	set(value):
		button_family = value
		_request_primary_sync()
		_request_slots_sync()

@export_range(-1, 7, 1) var selected_tool_index := -1:
	set(value):
		selected_tool_index = value
		_request_slots_sync()

@export var disabled_tool_indices := PackedInt32Array():
	set(value):
		disabled_tool_indices = value
		_request_slots_sync()

@export var tool_detail_lines := PackedStringArray():
	set(value):
		tool_detail_lines = value
		_request_slots_sync()

@export var disabled_reasons := PackedStringArray():
	set(value):
		disabled_reasons = value
		_request_slots_sync()

@export_range(1, 6, 1) var columns := 4:
	set(value):
		columns = value
		_request_slots_sync()

@export var slot_min_size := Vector2(40.0, 40.0):
	set(value):
		slot_min_size = value
		_request_slots_sync()

@export var auto_build_slots := true:
	set(value):
		auto_build_slots = value
		_request_slots_sync()

@export var primary_button_size := Vector2(52.0, 52.0):
	set(value):
		primary_button_size = value
		_request_primary_sync()

var _sync_suspended := false


func _ready() -> void:
	_sync_title()
	_sync_primary_button()
	_sync_slots()


func configure_runtime(
	next_title: String,
	next_family: String,
	next_labels: PackedStringArray,
	next_ids: PackedStringArray,
	next_icons: PackedStringArray,
	next_details: PackedStringArray,
	next_disabled_reasons: PackedStringArray,
	next_disabled_indices: PackedInt32Array,
	next_selected_index: int
) -> void:
	_sync_suspended = true
	category_title = next_title
	button_family = next_family
	tool_labels = next_labels
	tool_ids = next_ids
	tool_icon_states = next_icons
	tool_detail_lines = next_details
	disabled_reasons = next_disabled_reasons
	disabled_tool_indices = next_disabled_indices
	selected_tool_index = next_selected_index
	_sync_suspended = false
	_sync_title()
	_sync_primary_button()
	_sync_slots()


func _request_title_sync() -> void:
	if not _sync_suspended:
		_sync_title()


func _request_primary_sync() -> void:
	if not _sync_suspended:
		_sync_primary_button()


func _request_slots_sync() -> void:
	if not _sync_suspended:
		_sync_slots()


func _sync_title() -> void:
	if not is_inside_tree():
		return

	var title_label := get_node_or_null(TITLE_LABEL_PATH) as Label
	if title_label != null:
		title_label.text = category_title


func _sync_slots() -> void:
	if not is_inside_tree():
		return

	_sync_primary_button()

	var slots_grid := get_node_or_null(SLOTS_GRID_PATH) as GridContainer
	if slots_grid == null:
		return

	slots_grid.columns = columns
	_ensure_slot_count(slots_grid)

	for index in range(slots_grid.get_child_count()):
		var button := slots_grid.get_child(index) as BaseButton
		if button == null:
			continue

		var has_tool := index < tool_labels.size()
		var label := str(tool_labels[index]) if has_tool else ""
		button.visible = has_tool
		button.name = "Slot%d" % (index + 1)
		button.tooltip_text = _tooltip_for_index(index, label) if has_tool else ""
		if has_tool:
			button.set_meta("tutorial_building_id", _tool_id_for_index(index))
		button.custom_minimum_size = slot_min_size
		button.focus_mode = Control.FOCUS_ALL
		button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		button.disabled = disabled_tool_indices.has(index)
		button.button_pressed = index == selected_tool_index

		_set_property_if_available(button, "label_text", "")
		_set_property_if_available(button, "utility_icon_state", _tool_icon_state(index))
		_set_property_if_available(button, "icon_size", _icon_size_for(slot_min_size, 0.54, 18.0, 23.0))
		_apply_button_family(button)
		_wire_slot_button(button, index)


func _ensure_slot_count(slots_grid: GridContainer) -> void:
	if not auto_build_slots:
		return

	while slots_grid.get_child_count() < tool_labels.size():
		var button := ICON_BUTTON_SCENE.instantiate() as BaseButton
		if button == null:
			return

		button.name = "Slot%d" % (slots_grid.get_child_count() + 1)
		slots_grid.add_child(button)


func _sync_primary_button() -> void:
	if not is_inside_tree():
		return

	var button := get_node_or_null(PRIMARY_BUTTON_PATH) as BaseButton
	if button == null:
		return

	button.custom_minimum_size = primary_button_size
	button.focus_mode = Control.FOCUS_NONE
	button.mouse_filter = Control.MOUSE_FILTER_IGNORE
	button.disabled = true
	button.button_pressed = false
	button.tooltip_text = category_title

	_set_property_if_available(button, "label_text", "")
	_set_property_if_available(button, "utility_icon_state", _category_icon_state())
	_set_property_if_available(button, "icon_size", _icon_size_for(primary_button_size, 0.58, 28.0, 34.0))
	_apply_button_family(button)


func _wire_slot_button(button: BaseButton, index: int) -> void:
	var callback := Callable(self, "_on_slot_pressed").bind(index)
	if not button.pressed.is_connected(callback):
		button.pressed.connect(callback)


func _on_slot_pressed(index: int) -> void:
	var tool_id := _tool_id_for_index(index)
	if tool_id.is_empty():
		return

	selected_tool_index = index
	tool_requested.emit(tool_id)


func get_tutorial_target_node_for_tool_id(tool_id: String) -> Control:
	if tool_id.strip_edges().is_empty():
		return null

	var slots_grid := get_node_or_null(SLOTS_GRID_PATH) as GridContainer
	if slots_grid == null:
		return null

	for index in range(tool_ids.size()):
		if str(tool_ids[index]) != tool_id:
			continue
		if index >= slots_grid.get_child_count():
			return null
		return slots_grid.get_child(index) as Control

	return null


func _tool_id_for_index(index: int) -> String:
	if index >= 0 and index < tool_ids.size():
		return str(tool_ids[index])
	return ""


func _tooltip_for_index(index: int, label: String) -> String:
	var detail := str(tool_detail_lines[index]) if index < tool_detail_lines.size() else ""
	var reason := str(disabled_reasons[index]) if index < disabled_reasons.size() else ""
	var text := "%s / %s" % [category_title, label]
	if not detail.is_empty():
		text += "\n%s" % detail
	if disabled_tool_indices.has(index) and not reason.is_empty():
		text += "\n%s" % reason
	return text


func _apply_button_family(button: BaseButton) -> void:
	var selected_state := str(BUTTON_FAMILY_SELECTED_STATE.get(button_family, "energy_selected"))
	var normal_state := "energy_normal" if button_family == "energy" else selected_state
	var hover_state := "energy_hover" if button_family == "energy" else selected_state

	_set_property_if_available(button, "normal_state", normal_state)
	_set_property_if_available(button, "hover_state", hover_state)
	_set_property_if_available(button, "pressed_state", selected_state)
	_set_property_if_available(button, "selected_state", selected_state)
	_set_property_if_available(button, "selected_hover_state", selected_state)


func _tool_icon_state(index: int) -> String:
	if index < tool_icon_states.size():
		return str(tool_icon_states[index])
	return _category_icon_state()


func _category_icon_state() -> String:
	match button_family:
		"datacenter":
			return "datacenter"
		"cooling":
			return "cooling"
		"research":
			return "research"
		"grid":
			return "grid"
		_:
			return "energy"


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return


func _icon_size_for(button_size: Vector2, scale_factor: float, min_edge: float, max_edge: float) -> Vector2:
	var edge := clampf(minf(button_size.x, button_size.y) * scale_factor, min_edge, max_edge)
	return Vector2(edge, edge)
