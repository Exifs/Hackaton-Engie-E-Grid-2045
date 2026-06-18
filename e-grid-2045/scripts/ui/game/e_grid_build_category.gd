@tool
extends VBoxContainer
class_name EGridBuildCategory

const ICON_BUTTON_SCENE := preload("res://scenes/ui/components/e_grid_icon_button.tscn")
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
		_sync_title()

@export var tool_labels := PackedStringArray(["Tool A", "Tool B", "Tool C", "Tool D"]):
	set(value):
		tool_labels = value
		_sync_slots()

@export var tool_icon_states := PackedStringArray(["energy", "battery", "compute", "grid"]):
	set(value):
		tool_icon_states = value
		_sync_slots()

@export_enum("energy", "datacenter", "cooling", "research", "grid") var button_family := "energy":
	set(value):
		button_family = value
		_sync_slots()

@export_range(-1, 7, 1) var selected_tool_index := -1:
	set(value):
		selected_tool_index = value
		_sync_slots()

@export var disabled_tool_indices := PackedInt32Array():
	set(value):
		disabled_tool_indices = value
		_sync_slots()

@export_range(1, 6, 1) var columns := 4:
	set(value):
		columns = value
		_sync_slots()

@export var slot_min_size := Vector2(68.0, 68.0):
	set(value):
		slot_min_size = value
		_sync_slots()

@export var auto_build_slots := true:
	set(value):
		auto_build_slots = value
		_sync_slots()


func _ready() -> void:
	_sync_title()
	_sync_slots()


func _sync_title() -> void:
	if not is_inside_tree():
		return

	var title_label := get_node_or_null("Header/TitleLabel") as Label

	if title_label != null:
		title_label.text = category_title


func _sync_slots() -> void:
	if not is_inside_tree():
		return

	var slots_grid := get_node_or_null("SlotsGrid") as GridContainer

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
		button.tooltip_text = "%s / %s" % [category_title, label] if has_tool else ""
		button.custom_minimum_size = slot_min_size
		button.focus_mode = Control.FOCUS_ALL
		button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		button.disabled = disabled_tool_indices.has(index)
		button.button_pressed = index == selected_tool_index

		_set_property_if_available(button, "label_text", "")
		_set_property_if_available(button, "utility_icon_state", _tool_icon_state(index))
		_apply_button_family(button)


func _ensure_slot_count(slots_grid: GridContainer) -> void:
	if not auto_build_slots:
		return

	while slots_grid.get_child_count() < tool_labels.size():
		var button := ICON_BUTTON_SCENE.instantiate() as BaseButton
		if button == null:
			return

		button.name = "Slot%d" % (slots_grid.get_child_count() + 1)
		slots_grid.add_child(button)

		if Engine.is_editor_hint() and get_tree() != null and get_tree().edited_scene_root != null:
			button.owner = get_tree().edited_scene_root


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
