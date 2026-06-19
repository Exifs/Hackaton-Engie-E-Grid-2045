extends Control
class_name EGridBuildPalette

signal build_requested(building_id: String)
signal heatmap_mode_requested(mode: String)
signal category_opened(category_id: String)

const EXPORT_DIAGNOSTICS := preload("res://scripts/debug/EGridExportDiagnostics.gd")
const COLLAPSIBLE_CONTENT_PATHS := [
	^"ContentMargin/PaletteStack/OverlayPanel",
	^"ContentMargin/PaletteStack/CategoriesScroll",
	^"ContentMargin/PaletteStack/GridOverview",
]

const CATEGORIES_SCROLL_PATH := ^"ContentMargin/PaletteStack/CategoriesScroll"
const CATEGORY_SLOTS_GRID_PATH := ^"ContentMargin/CategoryRow/ToolsStack/SlotsGrid"
const TUTORIAL_TARGET_SCROLL_PADDING := 14.0

const CATEGORY_PATHS := {
	"energy": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/EnergyCategory",
	"compute": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/DatacentersCategory",
	"cooling": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/CoolingCategory",
	"research": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/ResearchCategory",
	"grid": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/GridNetworkCategory",
}

const CATEGORY_TITLES := {
	"energy": "ENERGY",
	"compute": "DATACENTERS",
	"cooling": "COOLING",
	"research": "RESEARCH",
	"grid": "GRID & NETWORK",
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
	if _building_definitions == building_definitions and _availability == availability and _selected_building_id == selected_building_id:
		return

	_building_definitions = building_definitions
	_availability = availability
	_selected_building_id = selected_building_id
	_sync_build_options()


func set_active_heatmap_mode(mode: String) -> void:
	if _active_heatmap_mode == mode:
		return

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
	_set_overlay_tooltip(^"ContentMargin/PaletteStack/OverlayPanel/PowerFlowRow/PowerFlowCheck", "Show regional power flow")
	_set_overlay_tooltip(^"ContentMargin/PaletteStack/OverlayPanel/DataFlowRow/DataFlowCheck", "Show grid and data flow")
	_set_overlay_tooltip(^"ContentMargin/PaletteStack/OverlayPanel/CongestionRow/CongestionCheck", "Show cooling pressure")
	_sync_overlay_controls()


func _connect_overlay_button(path: NodePath, mode: String) -> void:
	var button := get_node_or_null(path) as BaseButton
	if button == null:
		return
	var callback := Callable(self, "_on_overlay_button_pressed").bind(mode)
	if not button.pressed.is_connected(callback):
		button.pressed.connect(callback)


func _set_overlay_tooltip(path: NodePath, tooltip: String) -> void:
	var button := get_node_or_null(path) as BaseButton
	if button != null:
		button.tooltip_text = tooltip


func _on_overlay_button_pressed(mode: String) -> void:
	_active_heatmap_mode = "none" if _active_heatmap_mode == mode else mode
	_sync_overlay_controls()
	heatmap_mode_requested.emit(_active_heatmap_mode)


func get_tutorial_target_node(target_id: String) -> Control:
	var target := _resolve_tutorial_target_node(target_id)
	_reveal_tutorial_target(target)
	return target


func prepare_tutorial_target(target_id: String) -> void:
	_reveal_tutorial_target(_resolve_tutorial_target_node(target_id))


func _resolve_tutorial_target_node(target_id: String) -> Control:
	match target_id:
		"build_menu.energy_category":
			return get_node_or_null(CATEGORY_PATHS["energy"]) as Control
		"build_menu.cooling_category":
			return get_node_or_null(CATEGORY_PATHS["cooling"]) as Control
		"build_menu.cooling_overlay_button":
			return get_node_or_null(^"ContentMargin/PaletteStack/OverlayPanel/CongestionRow/CongestionCheck") as Control
		"build_menu.research_category":
			return get_node_or_null(CATEGORY_PATHS["research"]) as Control
		"build_menu.wind_onshore_button":
			return _button_for_building_id("energy", "wind_onshore")
		"build_menu.river_cooling_button":
			return _button_for_building_id("cooling", "river_cooling")
		"build_menu.datacenter_button":
			return _button_for_building_id("compute", "datacenter_standard")
		"build_menu.university_button":
			return _button_for_building_id("research", "university")
		"build_menu.ai_research_center_button":
			return _button_for_building_id("research", "ai_research_center")
	return null


func _reveal_tutorial_target(target: Control) -> void:
	if target == null:
		return

	if collapsed:
		collapsed = false

	var scroll := get_node_or_null(CATEGORIES_SCROLL_PATH) as ScrollContainer
	if scroll == null or not scroll.is_ancestor_of(target):
		return

	_scroll_control_into_view(scroll, target)
	call_deferred("_scroll_control_into_view", scroll, target)


func _scroll_control_into_view(scroll: ScrollContainer, target: Control) -> void:
	if scroll == null or target == null:
		return
	if not is_instance_valid(scroll) or not is_instance_valid(target):
		return
	if not scroll.is_inside_tree() or not target.is_inside_tree():
		return

	var scroll_rect := scroll.get_global_rect()
	var target_rect := target.get_global_rect()
	if scroll_rect.size.x <= 0.0 or scroll_rect.size.y <= 0.0 or target_rect.size.y <= 0.0:
		return

	var visible_top := scroll_rect.position.y + TUTORIAL_TARGET_SCROLL_PADDING
	var visible_bottom := scroll_rect.end.y - TUTORIAL_TARGET_SCROLL_PADDING
	if target_rect.position.y < visible_top:
		scroll.scroll_vertical += int(floor(target_rect.position.y - visible_top))
	elif target_rect.end.y > visible_bottom:
		scroll.scroll_vertical += int(ceil(target_rect.end.y - visible_bottom))


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
	_sync_selected_tool_buttons()
	var category := _category_for_building_id(tool_id)
	if not category.is_empty():
		category_opened.emit(category)
	build_requested.emit(tool_id)


func _sync_selected_tool_buttons() -> void:
	if not is_inside_tree():
		return

	for category in CATEGORY_PATHS.keys():
		var category_node := get_node_or_null(CATEGORY_PATHS[category]) as Control
		if category_node == null:
			continue

		var ids := _variant_to_string_array(category_node.get("tool_ids"))
		var slots_grid := category_node.get_node_or_null(CATEGORY_SLOTS_GRID_PATH) as GridContainer
		if slots_grid == null:
			continue

		for index in range(slots_grid.get_child_count()):
			var button := slots_grid.get_child(index) as BaseButton
			if button == null:
				continue

			var selected := index < ids.size() and str(ids[index]) == _selected_building_id
			if button.button_pressed == selected:
				continue

			if button.has_method("set_pressed_no_signal"):
				button.call("set_pressed_no_signal", selected)
			else:
				button.button_pressed = selected
			if button.has_method("sync_visual_state"):
				button.call("sync_visual_state")


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

	EXPORT_DIAGNOSTICS.log_palette("build_palette_sync", self)


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


func get_export_diagnostics_snapshot() -> Dictionary:
	var categories := {}
	for category in CATEGORY_PATHS.keys():
		var category_id := str(category)
		var category_node := get_node_or_null(CATEGORY_PATHS[category_id]) as Control
		categories[category_id] = _category_export_diagnostics(category_id, category_node)

	return {
		"collapsed": collapsed,
		"rect": _rect_to_dictionary(get_global_rect()),
		"size": _vector_to_dictionary(size),
		"scroll": _scroll_export_diagnostics(),
		"categories": categories,
	}


func _category_export_diagnostics(_category_id: String, category_node: Control) -> Dictionary:
	if category_node == null:
		return {
			"exists": false,
			"ids": [],
			"visible_ids": [],
			"visible_count": 0,
			"buttons": [],
		}

	var ids := _variant_to_string_array(category_node.get("tool_ids"))
	var buttons := []
	var visible_ids := []
	var visible_count := 0
	var slots_grid := category_node.get_node_or_null(CATEGORY_SLOTS_GRID_PATH) as GridContainer
	if slots_grid != null:
		for index in range(slots_grid.get_child_count()):
			var button := slots_grid.get_child(index) as Control
			if button == null:
				continue
			var button_id := str(button.get_meta("tutorial_building_id", ""))
			if button_id.is_empty() and index < ids.size():
				button_id = str(ids[index])
			var is_button_visible := button.visible and button.is_visible_in_tree()
			if is_button_visible:
				visible_count += 1
				if not button_id.is_empty():
					visible_ids.append(button_id)
			buttons.append({
				"index": index,
				"name": str(button.name),
				"id": button_id,
				"visible": is_button_visible,
				"rect": _rect_to_dictionary(button.get_global_rect()),
			})

	return {
		"exists": true,
		"title": str(category_node.get("category_title")),
		"rect": _rect_to_dictionary(category_node.get_global_rect()),
		"ids": ids,
		"visible_ids": visible_ids,
		"visible_count": visible_count,
		"buttons": buttons,
	}


func _scroll_export_diagnostics() -> Dictionary:
	var scroll := get_node_or_null(CATEGORIES_SCROLL_PATH) as ScrollContainer
	if scroll == null:
		return {"exists": false}

	var vertical_bar := scroll.get_v_scroll_bar()
	var horizontal_bar := scroll.get_h_scroll_bar()
	return {
		"exists": true,
		"rect": _rect_to_dictionary(scroll.get_global_rect()),
		"scroll_vertical": scroll.scroll_vertical,
		"scroll_vertical_max": vertical_bar.max_value if vertical_bar != null else 0.0,
		"scroll_horizontal": scroll.scroll_horizontal,
		"scroll_horizontal_max": horizontal_bar.max_value if horizontal_bar != null else 0.0,
	}


func _variant_to_string_array(value: Variant) -> Array:
	var result := []
	match typeof(value):
		TYPE_ARRAY, TYPE_PACKED_STRING_ARRAY:
			for item in value:
				result.append(str(item))
	return result


func _rect_to_dictionary(rect: Rect2) -> Dictionary:
	return {
		"x": snappedf(rect.position.x, 0.1),
		"y": snappedf(rect.position.y, 0.1),
		"w": snappedf(rect.size.x, 0.1),
		"h": snappedf(rect.size.y, 0.1),
	}


func _vector_to_dictionary(vector: Vector2) -> Dictionary:
	return {
		"x": snappedf(vector.x, 0.1),
		"y": snappedf(vector.y, 0.1),
	}


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return
