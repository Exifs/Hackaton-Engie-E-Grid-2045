extends Control
class_name EGridRegionPanel

signal cancel_construction_requested(region_id: String, queue_index: int)

const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")
const VISIBLE_BUILDING_SLOT_COUNT := 8
const VISIBLE_MODULE_SLOT_COUNT := 3

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
		_request_sync()

@export var level_text := "SELECT A REGION":
	set(value):
		level_text = value
		_request_sync()

@export var tag_text := "":
	set(value):
		tag_text = value
		_request_sync()

@export var level_badge_text := "0":
	set(value):
		level_badge_text = value
		_request_sync()

@export var xp_text := "0 / 0 SLOTS":
	set(value):
		xp_text = value
		_request_sync()

@export_range(0.0, 100.0, 0.1) var xp_progress := 0.0:
	set(value):
		xp_progress = clampf(value, 0.0, 100.0)
		_request_sync()

@export_enum("normal", "warning", "critical", "success", "disabled") var xp_semantic_state := "success":
	set(value):
		xp_semantic_state = value
		_request_sync()

@export_enum("overview", "buildings", "stats") var active_tab := "overview":
	set(value):
		active_tab = value
		_request_tabs_sync()

@export var building_slot_labels := PackedStringArray():
	set(value):
		building_slot_labels = value
		_request_slots_sync()

@export var building_slot_locked_indices := PackedInt32Array():
	set(value):
		building_slot_locked_indices = value
		_request_slots_sync()

@export var building_slot_pips := PackedInt32Array():
	set(value):
		building_slot_pips = value
		_request_slots_sync()

@export var building_slot_icon_states := PackedStringArray():
	set(value):
		building_slot_icon_states = value
		_request_slots_sync()

@export var building_slot_semantic_states := PackedStringArray():
	set(value):
		building_slot_semantic_states = value
		_request_slots_sync()

@export var module_slot_labels := PackedStringArray():
	set(value):
		module_slot_labels = value
		_request_slots_sync()

@export var module_slot_locked_indices := PackedInt32Array():
	set(value):
		module_slot_locked_indices = value
		_request_slots_sync()

@export var module_slot_pips := PackedInt32Array():
	set(value):
		module_slot_pips = value
		_request_slots_sync()

@export var module_slot_icon_states := PackedStringArray():
	set(value):
		module_slot_icon_states = value
		_request_slots_sync()

var _region_id := ""
var _construction_count := 0
var _slots_used := 0
var _slots_max := 0
var _sync_suspended := false


func _ready() -> void:
	clip_contents = true
	_wire_collapse_button()
	_wire_tabs()
	_wire_footer_button()
	_sync()
	_sync_tabs()
	_sync_slots()
	_sync_collapsed_state()


func display_region(region: Dictionary, building_definitions: Dictionary, summary: Dictionary) -> void:
	_sync_suspended = true
	if region.is_empty():
		_region_id = ""
		_construction_count = 0
		_slots_used = 0
		_slots_max = 0
		region_name = "NO REGION"
		level_text = "SELECT A REGION"
		tag_text = ""
		level_badge_text = "0"
		xp_text = "0 / 0 SLOTS"
		xp_progress = 0.0
		xp_semantic_state = "disabled"
		building_slot_labels = PackedStringArray()
		building_slot_locked_indices = PackedInt32Array()
		building_slot_pips = PackedInt32Array()
		building_slot_icon_states = PackedStringArray()
		building_slot_semantic_states = PackedStringArray()
		module_slot_labels = PackedStringArray()
		module_slot_locked_indices = PackedInt32Array()
		module_slot_pips = PackedInt32Array()
		module_slot_icon_states = PackedStringArray()
		_sync_suspended = false
		_sync()
		_sync_slots()
		_update_stats({}, summary)
		_sync_footer_button()
		return

	_region_id = str(region.get("id", ""))
	var cached: Dictionary = region.get("cached", {})
	var slots_used := int(region.get("slots_used", 0))
	var slots_max := int(region.get("slots_max", 0))
	_slots_used = slots_used
	_slots_max = slots_max
	region_name = str(region.get("display_name", _region_id)).to_upper()
	level_text = "BUILD CAPACITY"
	tag_text = _tags_text(region.get("tags", []))
	level_badge_text = "%d" % slots_used
	xp_text = "%d / %d SLOTS" % [slots_used, slots_max]
	xp_progress = clampf(float(slots_used) / maxf(float(slots_max), 1.0) * 100.0, 0.0, 100.0)
	xp_semantic_state = _capacity_state(slots_used, slots_max)
	_update_slot_views(region, building_definitions)
	_sync_suspended = false
	_sync()
	_sync_slots()
	_update_stats(cached, summary)
	_sync_footer_button()


func _request_sync() -> void:
	if not _sync_suspended:
		_sync()


func _request_tabs_sync() -> void:
	if not _sync_suspended:
		_sync_tabs()


func _request_slots_sync() -> void:
	if not _sync_suspended:
		_sync_slots()


func _sync() -> void:
	if not is_inside_tree():
		return

	var title_label := get_node_or_null("ContentMargin/PanelStack/HeaderRow/RegionNameLabel") as Label
	var level_badge := get_node_or_null("ContentMargin/PanelStack/LevelRow/LevelBadge") as BaseButton
	var level_label := get_node_or_null("ContentMargin/PanelStack/LevelRow/LevelInfoStack/LevelMetaRow/LevelLabel") as Label
	var xp_label := get_node_or_null("ContentMargin/PanelStack/LevelRow/LevelInfoStack/LevelMetaRow/XpLabel") as Label
	var xp_bar := get_node_or_null("ContentMargin/PanelStack/LevelRow/LevelInfoStack/XpBar")

	if title_label != null:
		title_label.text = region_name
	if level_label != null:
		level_label.text = level_text
		level_label.tooltip_text = tag_text
	if level_badge != null:
		_set_property_if_available(level_badge, "label_text", level_badge_text)
		_set_property_if_available(level_badge, "text", "")
	if xp_label != null:
		xp_label.text = xp_text

	_set_property_if_available(xp_bar, "value", xp_progress)
	_set_property_if_available(xp_bar, "semantic_state", xp_semantic_state)
	_set_property_if_available(xp_bar, "show_value_label", false)


func _update_slot_views(region: Dictionary, building_definitions: Dictionary) -> void:
	var entries := []
	var slots_max := int(region.get("slots_max", 0))

	for building_id_variant in region.get("buildings", []):
		var building_id := str(building_id_variant)
		var definition: Dictionary = building_definitions.get(building_id, {})
		entries.append({
			"label": str(definition.get("display_name", building_id)),
			"pips": 5,
			"state": _slot_state_for_region(region),
			"icon": _icon_state_for_definition(definition),
		})

	var queue: Array = region.get("construction_queue", [])
	_construction_count = queue.size()
	for item_variant in queue:
		var item: Dictionary = item_variant
		var building_id := str(item.get("building_id", ""))
		var definition: Dictionary = building_definitions.get(building_id, {})
		var total := maxf(float(item.get("total_months", 1)), 1.0)
		var remaining := maxf(float(item.get("months_remaining", total)), 0.0)
		var progress := 1.0 - remaining / total
		entries.append({
			"label": "%s (%d mo)" % [str(definition.get("display_name", building_id)), int(remaining)],
			"pips": clampi(roundi(progress * 5.0), 1, 5),
			"state": "warning",
			"icon": _icon_state_for_definition(definition),
		})

	var labels := PackedStringArray()
	var pips := PackedInt32Array()
	var states := PackedStringArray()
	var locked := PackedInt32Array()
	var icons := PackedStringArray()
	var visible_slots := clampi(maxi(slots_max, entries.size()), 0, VISIBLE_BUILDING_SLOT_COUNT)

	for index in range(visible_slots):
		if index < entries.size():
			var entry: Dictionary = entries[index]
			labels.append(str(entry.get("label", "")))
			pips.append(int(entry.get("pips", 0)))
			states.append(str(entry.get("state", "normal")))
			icons.append(str(entry.get("icon", "grid")))
		else:
			var suggestion := _free_slot_suggestion(region, index)
			labels.append("Available %s" % str(suggestion.get("label", "capacity")))
			pips.append(int(suggestion.get("pips", 1)))
			states.append("normal")
			icons.append(str(suggestion.get("icon", "grid")))
		if index >= slots_max:
			locked.append(index)

	if slots_max > VISIBLE_BUILDING_SLOT_COUNT and labels.size() > 0:
		labels[labels.size() - 1] = "+%d slots" % (slots_max - VISIBLE_BUILDING_SLOT_COUNT + 1)
		states[states.size() - 1] = "normal"
		icons[icons.size() - 1] = "grid"

	building_slot_labels = labels
	building_slot_pips = pips
	building_slot_icon_states = icons
	building_slot_semantic_states = states
	building_slot_locked_indices = locked

	var module_labels := PackedStringArray()
	var module_pips := PackedInt32Array()
	var module_icons := PackedStringArray()
	var module_locked := PackedInt32Array()
	for index in range(mini(queue.size(), VISIBLE_MODULE_SLOT_COUNT)):
		var item: Dictionary = queue[index]
		var building_id := str(item.get("building_id", ""))
		var definition: Dictionary = building_definitions.get(building_id, {})
		module_labels.append("%s / %d mo" % [str(definition.get("display_name", building_id)), int(item.get("months_remaining", 0))])
		module_pips.append(3)
		module_icons.append(_icon_state_for_definition(definition))
	module_slot_labels = module_labels
	module_slot_pips = module_pips
	module_slot_icon_states = module_icons
	module_slot_locked_indices = module_locked

	var slots_title := get_node_or_null("ContentMargin/PanelStack/TabPages/Overview/BuildingSlotsHeader/BuildingSlotsTitle") as Label
	if slots_title != null:
		slots_title.text = "BUILDING SLOTS"


func _update_stats(cached: Dictionary, _summary: Dictionary) -> void:
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Overview/EnergyStatus",
		"ENERGY STATUS",
		"%d%%" % roundi(float(cached.get("energy_efficiency", 0.0)) * 100.0),
		float(cached.get("energy_efficiency", 0.0)) * 100.0,
		_efficiency_state(float(cached.get("energy_efficiency", 0.0))),
		"Prod %.1f / Use %.1f / Net %.1f" % [float(cached.get("energy_production", 0.0)), float(cached.get("energy_consumption", 0.0)), float(cached.get("energy_balance_local", 0.0))]
	)
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Overview/CoolingStatus",
		"COOLING STATUS",
		"%d%%" % roundi(float(cached.get("cooling_efficiency", 0.0)) * 100.0),
		float(cached.get("cooling_efficiency", 0.0)) * 100.0,
		_efficiency_state(float(cached.get("cooling_efficiency", 0.0))),
		"Avail %.1f / Used %.1f / Reserve %.1f" % [
			float(cached.get("cooling_available", 0.0)),
			float(cached.get("cooling_used", 0.0)),
			float(cached.get("cooling_available", 0.0)) - float(cached.get("cooling_used", 0.0)),
		]
	)
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Overview/ComputeStatus",
		"COMPUTE DEMAND",
		"%.1f" % float(cached.get("compute_produced", 0.0)),
		clampf(float(cached.get("compute_produced", 0.0)) / 40.0 * 100.0, 0.0, 100.0),
		"success" if float(cached.get("compute_produced", 0.0)) > 8.0 else "normal",
		"Prod %.1f / Demand %.1f / Labor %.0f%%" % [
			float(cached.get("compute_produced", 0.0)),
			float(cached.get("compute_demand", 0.0)),
			float(cached.get("researcher_efficiency", 1.0)) * 100.0,
		]
	)
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Stats/GridLoad",
		"GRID LOAD",
		"%.1f in" % float(cached.get("energy_imported", 0.0)),
		clampf(float(cached.get("energy_imported", 0.0)) / 40.0 * 100.0, 0.0, 100.0),
		"warning" if bool(cached.get("network_congested", false)) else "normal",
		"Import %.1f / Export %.1f / Unserved %.1f" % [
			float(cached.get("energy_imported", 0.0)),
			float(cached.get("energy_exported", 0.0)),
			float(cached.get("energy_unserved", 0.0)),
		]
	)
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Stats/ImportExport",
		"IMPORT / EXPORT",
		"%+.1f" % (float(cached.get("energy_imported", 0.0)) - float(cached.get("energy_exported", 0.0))),
		50.0,
		"success" if float(cached.get("energy_balance_local", 0.0)) >= 0.0 else "warning",
		"Import %.1f / Export %.1f / Balance %+.1f" % [
			float(cached.get("energy_imported", 0.0)),
			float(cached.get("energy_exported", 0.0)),
			float(cached.get("energy_balance_local", 0.0)),
		]
	)
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Stats/Stability",
		"REGION EFFICIENCY",
		"%d%%" % roundi(float(cached.get("regional_efficiency", 0.0)) * 100.0),
		float(cached.get("regional_efficiency", 0.0)) * 100.0,
		_efficiency_state(float(cached.get("regional_efficiency", 0.0))),
		"Energy %.0f%% / Cooling %.0f%% / Issues %d" % [
			float(cached.get("energy_efficiency", 0.0)) * 100.0,
			float(cached.get("cooling_efficiency", 0.0)) * 100.0,
			(cached.get("problems", []) as Array).size(),
		]
	)


func _set_stat(path: NodePath, title: String, value: String, progress: float, state_name: String, detail: String) -> void:
	var stat := get_node_or_null(path)
	if stat == null:
		return
	stat.set("title_text", title)
	stat.set("value_text", value)
	stat.set("progress_value", clampf(progress, 0.0, 100.0))
	stat.set("semantic_state", state_name)
	stat.set("detail_text", detail)


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


func _wire_footer_button() -> void:
	var button := get_node_or_null("ContentMargin/PanelStack/FooterRow/ManageRegionButton") as BaseButton
	if button != null and not button.pressed.is_connected(_on_manage_region_pressed):
		button.pressed.connect(_on_manage_region_pressed)


func _on_manage_region_pressed() -> void:
	if _region_id.is_empty() or _construction_count <= 0:
		return
	cancel_construction_requested.emit(_region_id, 0)


func _sync_footer_button() -> void:
	if not is_inside_tree():
		return
	var button := get_node_or_null("ContentMargin/PanelStack/FooterRow/ManageRegionButton") as BaseButton
	if button == null:
		return
	if _construction_count > 0:
		_set_property_if_available(button, "label_text", "CANCEL")
		button.disabled = false
		button.tooltip_text = "Cancel first construction for a partial refund"
	else:
		_set_property_if_available(button, "label_text", "MANAGE")
		button.disabled = true
		button.tooltip_text = "No construction to cancel"


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
		_set_property_if_available(button, "label_text", "<" if collapsed else "X")
		_set_property_if_available(button, "text", "")
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

	_sync_building_slot_count()
	_sync_slot_grid(
		"ContentMargin/PanelStack/TabPages/Overview/BuildingSlotsGrid",
		building_slot_labels,
		building_slot_locked_indices,
		building_slot_pips,
		building_slot_icon_states,
		building_slot_semantic_states
	)
	_sync_slot_grid(
		"ContentMargin/PanelStack/TabPages/Buildings/ModulesGrid",
		module_slot_labels,
		module_slot_locked_indices,
		module_slot_pips,
		module_slot_icon_states,
		PackedStringArray()
	)


func _sync_building_slot_count() -> void:
	var count_label := get_node_or_null("ContentMargin/PanelStack/TabPages/Overview/BuildingSlotsHeader/BuildingSlotsCount") as Label
	if count_label == null:
		return

	var active_count := 0
	if _slots_max > 0:
		active_count = _slots_used
	else:
		for index in range(building_slot_labels.size()):
			if not building_slot_locked_indices.has(index):
				active_count += 1

	var total_count := _slots_max if _slots_max > 0 else building_slot_labels.size()
	count_label.text = "%d / %d" % [active_count, total_count]


func _sync_slot_grid(
	grid_path: NodePath,
	slot_labels: PackedStringArray,
	locked_indices: PackedInt32Array,
	pips: PackedInt32Array,
	icon_states: PackedStringArray,
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
		var is_available_slot := has_slot and str(slot_labels[index]).begins_with("Available ")
		_set_property_if_available(slot, "locked", locked)
		_set_property_if_available(slot, "semantic_state", semantic_state)
		_set_property_if_available(slot, "base_state", "auto")
		_set_property_if_available(slot, "building_icon", _slot_icon_texture(icon_states[index] if index < icon_states.size() else ""))
		_set_property_if_available(slot, "building_icon_alpha", 0.36 if is_available_slot else 1.0)
		_set_property_if_available(slot, "pips_active", pips[index] if index < pips.size() else 0)
		_set_property_if_available(slot, "bottom_tier", 1 if has_slot and not locked else 0)
		_set_property_if_available(slot, "top_bars", 1 if semantic_state == "warning" else 0)
		_set_property_if_available(slot, "show_state_overlay", false)
		_set_property_if_available(slot, "show_status_badge", false)


func _slot_icon_texture(icon_state: String) -> Texture2D:
	if icon_state.strip_edges().is_empty():
		return null
	return E_GRID_UI_ATLAS.get_texture("utility_icons_48px", icon_state)


func _free_slot_suggestion(region: Dictionary, slot_index: int) -> Dictionary:
	var suggestions := []
	var energy_potential := maxf(
		float(region.get("potential_solar", 0.0)),
		maxf(float(region.get("potential_wind_onshore", 0.0)), float(region.get("potential_wind_offshore", 0.0)))
	)
	energy_potential = maxf(energy_potential, maxf(float(region.get("potential_hydro", 0.0)), float(region.get("potential_nuclear", 0.0))))
	suggestions.append({"label": "energy", "icon": "energy", "pips": _potential_pips(energy_potential)})

	if float(region.get("potential_cooling", 0.0)) >= 2.0:
		suggestions.append({"label": "cooling", "icon": "cooling", "pips": _potential_pips(float(region.get("potential_cooling", 0.0)))})
	if float(region.get("potential_research", 0.0)) >= 2.0:
		suggestions.append({"label": "research", "icon": "research", "pips": _potential_pips(float(region.get("potential_research", 0.0)))})
	if _region_has_tag(region, ["urbain", "dense", "industriel"]):
		suggestions.append({"label": "compute", "icon": "datacenter", "pips": clampi(roundi(float(region.get("population_units", 0.0))), 1, 5)})

	suggestions.append({"label": "grid", "icon": "grid", "pips": _potential_pips(float(region.get("potential_grid", 0.0)))})
	return suggestions[slot_index % suggestions.size()]


func _potential_pips(value: float) -> int:
	return clampi(roundi(value), 1, 5)


func _region_has_tag(region: Dictionary, accepted_tags: Array) -> bool:
	var tags: Array = region.get("tags", [])
	for tag_variant in tags:
		if accepted_tags.has(str(tag_variant)):
			return true
	return false


func _tags_text(tags: Array) -> String:
	if tags.is_empty():
		return "NO TAGS"
	var labels := []
	for index in range(mini(tags.size(), 4)):
		labels.append(str(tags[index]).to_upper())
	return " / ".join(labels)


func _slot_state_for_region(region: Dictionary) -> String:
	var cached: Dictionary = region.get("cached", {})
	if str(cached.get("blackout_state", "stable")) == "severe":
		return "critical"
	if float(cached.get("regional_efficiency", 1.0)) < 0.9:
		return "warning"
	return "normal"


func _icon_state_for_definition(definition: Dictionary) -> String:
	var icon_key := str(definition.get("icon_key", ""))
	if not icon_key.is_empty():
		return icon_key
	match str(definition.get("category", "grid")):
		"energy":
			return "energy"
		"datacenter", "compute":
			return "datacenter"
		"cooling":
			return "cooling"
		"research":
			return "research"
		_:
			return "grid"


func _efficiency_state(value: float) -> String:
	if value >= 0.98:
		return "success"
	if value >= 0.9:
		return "normal"
	if value >= 0.72:
		return "warning"
	return "critical"


func _capacity_state(slots_used: int, slots_max: int) -> String:
	if slots_max <= 0:
		return "disabled"

	var ratio := float(slots_used) / float(slots_max)
	if ratio >= 1.0:
		return "critical"
	if ratio >= 0.8:
		return "warning"
	return "normal"


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return
