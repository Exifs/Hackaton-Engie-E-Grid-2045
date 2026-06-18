@tool
extends Control
class_name EGridRegionPanel

const TAB_BUTTONS := {
	"overview": "ContentMargin/PanelStack/TabButtons/OverviewTab",
	"buildings": "ContentMargin/PanelStack/TabButtons/BuildingsTab",
	"stats": "ContentMargin/PanelStack/TabButtons/StatsTab",
}

const TAB_PAGES := {
	"overview": "ContentMargin/PanelStack/TabPages/Overview",
	"buildings": "ContentMargin/PanelStack/TabPages/Buildings",
	"stats": "ContentMargin/PanelStack/TabPages/Stats",
}

const COLLAPSIBLE_CONTENT_PATHS := [
	^"ContentMargin/PanelStack/LevelRow",
	^"ContentMargin/PanelStack/XpBar",
	^"ContentMargin/PanelStack/TabButtons",
	^"ContentMargin/PanelStack/TabPages",
	^"ContentMargin/PanelStack/FooterRow",
]

@export var collapsed := false:
	set(value):
		collapsed = value
		_sync_collapsed_state()

@export_range(240.0, 520.0, 1.0) var expanded_width := 424.0:
	set(value):
		expanded_width = value
		_sync_collapsed_state()

@export_range(58.0, 120.0, 1.0) var collapsed_width := 78.0:
	set(value):
		collapsed_width = value
		_sync_collapsed_state()

@export_node_path("BaseButton") var collapse_button_path: NodePath = ^"ContentMargin/PanelStack/HeaderRow/CloseButton"

@export var region_name := "NO REGION":
	set(value):
		region_name = value
		_sync()

@export var level_text := "LEVEL 0":
	set(value):
		level_text = value
		_sync()

@export var xp_text := "0 / 0 XP":
	set(value):
		xp_text = value
		_sync()

@export_range(0.0, 100.0, 0.1) var xp_progress := 0.0:
	set(value):
		xp_progress = clampf(value, 0.0, 100.0)
		_sync()

@export_enum("normal", "warning", "critical", "success", "disabled") var xp_semantic_state := "success":
	set(value):
		xp_semantic_state = value
		_sync()

@export_enum("overview", "buildings", "stats") var active_tab := "overview":
	set(value):
		active_tab = value
		_sync_tabs()

@export var building_slot_labels := PackedStringArray([
	"Fusion Plant",
	"HVDC Substation",
	"Compute Campus",
	"Liquid Cooling",
	"Reserved Slot",
	"Reserved Slot",
]):
	set(value):
		building_slot_labels = value
		_sync_slots()

@export var building_slot_locked_indices := PackedInt32Array([4, 5]):
	set(value):
		building_slot_locked_indices = value
		_sync_slots()

@export var building_slot_pips := PackedInt32Array([5, 4, 3, 4, 0, 0]):
	set(value):
		building_slot_pips = value
		_sync_slots()

@export var building_slot_semantic_states := PackedStringArray([
	"normal",
	"normal",
	"warning",
	"normal",
	"disabled",
	"disabled",
]):
	set(value):
		building_slot_semantic_states = value
		_sync_slots()

@export var module_slot_labels := PackedStringArray(["Turbine Stack", "Heat Loop", "Add Module"]):
	set(value):
		module_slot_labels = value
		_sync_slots()

@export var module_slot_locked_indices := PackedInt32Array():
	set(value):
		module_slot_locked_indices = value
		_sync_slots()

@export var module_slot_pips := PackedInt32Array([4, 3, 0]):
	set(value):
		module_slot_pips = value
		_sync_slots()


func _ready() -> void:
	clip_contents = true
	_wire_collapse_button()
	_wire_tabs()
	_sync()
	_sync_tabs()
	_sync_slots()
	_sync_collapsed_state()


func _sync() -> void:
	if not is_inside_tree():
		return

	var title_label := get_node_or_null("ContentMargin/PanelStack/HeaderRow/RegionNameLabel") as Label
	var level_label := get_node_or_null("ContentMargin/PanelStack/LevelRow/LevelLabel") as Label
	var xp_label := get_node_or_null("ContentMargin/PanelStack/LevelRow/XpLabel") as Label
	var xp_bar := get_node_or_null("ContentMargin/PanelStack/XpBar")

	if title_label != null:
		title_label.text = region_name

	if level_label != null:
		level_label.text = level_text

	if xp_label != null:
		xp_label.text = xp_text

	_set_property_if_available(xp_bar, "value", xp_progress)
	_set_property_if_available(xp_bar, "semantic_state", xp_semantic_state)
	_set_property_if_available(xp_bar, "show_value_label", false)


func _wire_tabs() -> void:
	for tab_name in TAB_BUTTONS.keys():
		var button := get_node_or_null(TAB_BUTTONS[tab_name]) as BaseButton
		if button == null:
			continue

		var callback := Callable(self, "_on_tab_pressed").bind(tab_name)
		if not button.pressed.is_connected(callback):
			button.pressed.connect(callback)


func _wire_collapse_button() -> void:
	var button := get_node_or_null(collapse_button_path) as BaseButton
	if button == null:
		return

	if not button.pressed.is_connected(_on_collapse_button_pressed):
		button.pressed.connect(_on_collapse_button_pressed)


func _on_collapse_button_pressed() -> void:
	collapsed = not collapsed
	_sync_collapsed_state()


func _sync_collapsed_state() -> void:
	custom_minimum_size = Vector2(collapsed_width if collapsed else expanded_width, 0.0)

	if not is_inside_tree():
		return

	clip_contents = true

	var title_label := get_node_or_null("ContentMargin/PanelStack/HeaderRow/RegionNameLabel") as Control
	if title_label != null:
		title_label.visible = not collapsed

	for path in COLLAPSIBLE_CONTENT_PATHS:
		var content := get_node_or_null(path) as Control
		if content != null:
			content.visible = not collapsed

	var button := get_node_or_null(collapse_button_path) as BaseButton
	if button != null:
		_set_property_if_available(button, "label_text", "<" if collapsed else ">")
		button.tooltip_text = "Expand region inspector" if collapsed else "Collapse region inspector"


func _on_tab_pressed(tab_name: String) -> void:
	active_tab = tab_name
	_sync_tabs()


func _sync_tabs() -> void:
	if not is_inside_tree():
		return

	for tab_name in TAB_BUTTONS.keys():
		var button := get_node_or_null(TAB_BUTTONS[tab_name]) as BaseButton
		if button != null:
			button.button_pressed = tab_name == active_tab

	for tab_name in TAB_PAGES.keys():
		var page := get_node_or_null(TAB_PAGES[tab_name]) as Control
		if page != null:
			page.visible = tab_name == active_tab and not collapsed


func _sync_slots() -> void:
	if not is_inside_tree():
		return

	_sync_slot_grid(
		"ContentMargin/PanelStack/TabPages/Overview/BuildingSlotsGrid",
		building_slot_labels,
		building_slot_locked_indices,
		building_slot_pips,
		building_slot_semantic_states
	)
	_sync_slot_grid(
		"ContentMargin/PanelStack/TabPages/Buildings/ModulesGrid",
		module_slot_labels,
		module_slot_locked_indices,
		module_slot_pips,
		PackedStringArray()
	)


func _sync_slot_grid(
	grid_path: NodePath,
	slot_labels: PackedStringArray,
	locked_indices: PackedInt32Array,
	pips: PackedInt32Array,
	semantic_states: PackedStringArray
) -> void:
	var grid := get_node_or_null(grid_path) as GridContainer
	if grid == null:
		return

	for index in range(grid.get_child_count()):
		var slot := grid.get_child(index) as BaseButton
		if slot == null:
			continue

		var has_slot := index < slot_labels.size()
		var locked := locked_indices.has(index)
		var semantic_state := "disabled" if locked else "normal"
		if index < semantic_states.size():
			semantic_state = str(semantic_states[index])

		slot.visible = has_slot
		slot.disabled = locked
		slot.tooltip_text = str(slot_labels[index]) if has_slot else ""
		_set_property_if_available(slot, "locked", locked)
		_set_property_if_available(slot, "semantic_state", semantic_state)
		_set_property_if_available(slot, "base_state", "auto")
		_set_property_if_available(slot, "pips_active", pips[index] if index < pips.size() else 0)
		_set_property_if_available(slot, "bottom_tier", 1 if has_slot and not locked else 0)
		_set_property_if_available(slot, "top_bars", 1 if semantic_state == "warning" else 0)
		_set_property_if_available(slot, "show_state_overlay", false)
		_set_property_if_available(slot, "show_status_badge", false)


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return
