extends Control
class_name EGridBuildPalette

signal build_requested(building_id: String)
signal heatmap_mode_requested(mode: String)
signal category_opened(category_id: String)

const COLLAPSIBLE_CONTENT_PATHS := [
	^"ContentMargin/PaletteStack/CategoriesScroll",
	^"ContentMargin/PaletteStack/GridOverview",
]

const CATEGORY_PATHS := {
	"energy": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/EnergyCategory",
	"compute": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/DatacentersCategory",
	"cooling": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/CoolingCategory",
	"research": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/ResearchCategory",
	"grid": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/GridNetworkCategory",
}

const CATEGORY_TITLES := {
	"energy": "ENERGY",
	"compute": "IA / COMPUTE",
	"cooling": "COOLING",
	"research": "RESEARCH",
	"grid": "GRID / STORAGE",
}

const CATEGORY_FAMILIES := {
	"energy": "energy",
	"compute": "datacenter",
	"cooling": "cooling",
	"research": "research",
	"grid": "grid",
}

@export var collapsed := false:
	set(value):
		collapsed = value
		_sync_collapsed_state()

@export_range(64.0, 420.0, 1.0) var expanded_width := 348.0:
	set(value):
		expanded_width = value
		_sync_collapsed_state()

@export_range(58.0, 120.0, 1.0) var collapsed_width := 78.0:
	set(value):
		collapsed_width = value
		_sync_collapsed_state()

@export_node_path("BaseButton") var collapse_button_path: NodePath = ^"ContentMargin/PaletteStack/HeaderRow/CollapseButton"

var _building_definitions := {}
var _availability := {}
var _selected_building_id := ""
var _active_heatmap_mode := "energy"


func _ready() -> void:
	clip_contents = true
	_wire_collapse_button()
	_wire_categories()
	_wire_overlay_controls()
	_sync_collapsed_state()
	_sync_build_options()


func set_build_context(building_definitions: Dictionary, availability: Dictionary, selected_building_id: String = "") -> void:
	_building_definitions = building_definitions
	_availability = availability
	_selected_building_id = selected_building_id
	_sync_build_options()


func set_active_heatmap_mode(mode: String) -> void:
	_active_heatmap_mode = mode
	_sync_overlay_controls()


func _wire_collapse_button() -> void:
	var button := get_node_or_null(collapse_button_path) as BaseButton
	if button == null:
		return

	if not button.pressed.is_connected(_on_collapse_button_pressed):
		button.pressed.connect(_on_collapse_button_pressed)


func _wire_categories() -> void:
	for category in CATEGORY_PATHS.keys():
		var node := get_node_or_null(CATEGORY_PATHS[category])
		if node == null or not node.has_signal("tool_requested"):
			continue
		var callback := Callable(self, "_on_category_tool_requested")
		if not node.is_connected("tool_requested", callback):
			node.connect("tool_requested", callback)


func _wire_overlay_controls() -> void:
	_connect_overlay_button(^"ContentMargin/PaletteStack/OverlayPanel/PowerFlowRow/PowerFlowCheck", "energy")
	_connect_overlay_button(^"ContentMargin/PaletteStack/OverlayPanel/DataFlowRow/DataFlowCheck", "network")
	_connect_overlay_button(^"ContentMargin/PaletteStack/OverlayPanel/CongestionRow/CongestionCheck", "cooling")
	_sync_overlay_controls()


func _connect_overlay_button(path: NodePath, mode: String) -> void:
	var button := get_node_or_null(path) as BaseButton
	if button == null:
		return
	var callback := Callable(self, "_on_overlay_button_pressed").bind(mode)
	if not button.pressed.is_connected(callback):
		button.pressed.connect(callback)


func _on_overlay_button_pressed(mode: String) -> void:
	_active_heatmap_mode = "none" if _active_heatmap_mode == mode else mode
	_sync_overlay_controls()
	heatmap_mode_requested.emit(_active_heatmap_mode)


func get_tutorial_target_node(target_id: String) -> Control:
	match target_id:
		"build_menu.energy_category":
			return get_node_or_null(CATEGORY_PATHS["energy"]) as Control
		"build_menu.cooling_category":
			return get_node_or_null(CATEGORY_PATHS["cooling"]) as Control
		"build_menu.research_category":
			return get_node_or_null(CATEGORY_PATHS["research"]) as Control
		"build_menu.datacenter_button":
			return _button_for_building_id("compute", "datacenter_standard")
		"build_menu.university_button":
			return _button_for_building_id("research", "university")
	return null


func _button_for_building_id(category: String, building_id: String) -> Control:
	var category_node := get_node_or_null(CATEGORY_PATHS.get(category, "")) as Control
	if category_node == null or not category_node.has_method("get_tutorial_target_node_for_tool_id"):
		return null
	return category_node.call("get_tutorial_target_node_for_tool_id", building_id) as Control


func _sync_overlay_controls() -> void:
	_set_button_pressed(^"ContentMargin/PaletteStack/OverlayPanel/PowerFlowRow/PowerFlowCheck", _active_heatmap_mode == "energy")
	_set_button_pressed(^"ContentMargin/PaletteStack/OverlayPanel/DataFlowRow/DataFlowCheck", _active_heatmap_mode == "network")
	_set_button_pressed(^"ContentMargin/PaletteStack/OverlayPanel/CongestionRow/CongestionCheck", _active_heatmap_mode == "cooling")


func _set_button_pressed(path: NodePath, pressed: bool) -> void:
	var button := get_node_or_null(path) as BaseButton
	if button != null:
		button.button_pressed = pressed


func _on_collapse_button_pressed() -> void:
	collapsed = not collapsed
	_sync_collapsed_state()


func _on_category_tool_requested(tool_id: String) -> void:
	_selected_building_id = tool_id
	_sync_build_options()
	var category := _category_for_building_id(tool_id)
	if not category.is_empty():
		category_opened.emit(category)
	build_requested.emit(tool_id)


func _sync_build_options() -> void:
	if not is_inside_tree():
		return

	var grouped := _group_buildings_by_category()
	for category in CATEGORY_PATHS.keys():
		var category_node := get_node_or_null(CATEGORY_PATHS[category])
		if category_node == null:
			continue

		var entries: Array = grouped.get(category, [])
		var labels := PackedStringArray()
		var ids := PackedStringArray()
		var icons := PackedStringArray()
		var details := PackedStringArray()
		var disabled_reasons := PackedStringArray()
		var disabled_indices := PackedInt32Array()
		var selected_index := -1

		for index in range(entries.size()):
			var definition: Dictionary = entries[index]
			var building_id := str(definition.get("id", ""))
			var availability: Dictionary = _availability.get(building_id, {"ok": true, "reason": ""})
			labels.append(_short_label(str(definition.get("display_name", building_id))))
			ids.append(building_id)
			icons.append(str(definition.get("icon_key", category)))
			details.append("EUR %d / %d mo / %d slots" % [int(definition.get("cost", 0)), int(definition.get("construction_months", 1)), int(definition.get("slots_required", 1))])
			disabled_reasons.append(str(availability.get("reason", "")))
			if not bool(availability.get("ok", true)):
				disabled_indices.append(index)
			if building_id == _selected_building_id:
				selected_index = index

		if category_node.has_method("configure_runtime"):
			category_node.call(
				"configure_runtime",
				str(CATEGORY_TITLES.get(category, category.to_upper())),
				str(CATEGORY_FAMILIES.get(category, category)),
				labels,
				ids,
				icons,
				details,
				disabled_reasons,
				disabled_indices,
				selected_index
			)
		else:
			category_node.set("category_title", str(CATEGORY_TITLES.get(category, category.to_upper())))
			category_node.set("button_family", str(CATEGORY_FAMILIES.get(category, category)))
			category_node.set("tool_labels", labels)
			category_node.set("tool_ids", ids)
			category_node.set("tool_icon_states", icons)
			category_node.set("tool_detail_lines", details)
			category_node.set("disabled_reasons", disabled_reasons)
			category_node.set("disabled_tool_indices", disabled_indices)
			category_node.set("selected_tool_index", selected_index)


func _group_buildings_by_category() -> Dictionary:
	var grouped := {
		"energy": [],
		"compute": [],
		"cooling": [],
		"research": [],
		"grid": [],
	}

	var keys := _building_definitions.keys()
	keys.sort()
	for building_id in keys:
		var definition: Dictionary = _building_definitions[building_id]
		var category := str(definition.get("category", "grid"))
		if not grouped.has(category):
			category = "grid"
		(grouped[category] as Array).append(definition)
	return grouped


func _category_for_building_id(building_id: String) -> String:
	var definition: Dictionary = _building_definitions.get(building_id, {})
	return str(definition.get("category", ""))


func _short_label(display_name: String) -> String:
	var label := display_name
	label = label.replace("Centre recherche ", "R. ")
	label = label.replace("Refroidissement ", "Froid ")
	label = label.replace("Datacenter ", "DC ")
	label = label.replace("Centrale ", "")
	return label


func _sync_collapsed_state() -> void:
	custom_minimum_size = Vector2(collapsed_width if collapsed else expanded_width, 0.0)

	if not is_inside_tree():
		return

	clip_contents = true

	var title_label := get_node_or_null("ContentMargin/PaletteStack/HeaderRow/TitleLabel") as Control
	if title_label != null:
		title_label.visible = not collapsed

	for path in COLLAPSIBLE_CONTENT_PATHS:
		var content := get_node_or_null(path) as Control
		if content != null:
			content.visible = not collapsed

	var button := get_node_or_null(collapse_button_path) as BaseButton
	if button != null:
		_set_property_if_available(button, "label_text", ">" if collapsed else "<")
		_set_property_if_available(button, "text", "")
		button.tooltip_text = "Expand build palette" if collapsed else "Collapse build palette"


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return
