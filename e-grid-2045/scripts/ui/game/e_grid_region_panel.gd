extends Control
class_name EGridRegionPanel

signal cancel_construction_requested(region_id: String, queue_index: int)

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
		_request_sync()

@export var level_text := "SELECT A REGION":
	set(value):
		level_text = value
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

var _region_id := ""
var _construction_count := 0
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


func _request_sync() -> void:
	if not _sync_suspended:
		_sync()


func _request_tabs_sync() -> void:
	if not _sync_suspended:
		_sync_tabs()


func _request_slots_sync() -> void:
	if not _sync_suspended:
		_sync_slots()


func display_region(region: Dictionary, building_definitions: Dictionary, summary: Dictionary) -> void:
	_sync_suspended = true
	if region.is_empty():
		_region_id = ""
		region_name = "NO REGION"
		level_text = "SELECT A REGION"
		xp_text = "0 / 0 SLOTS"
		xp_progress = 0.0
		xp_semantic_state = "disabled"
		building_slot_labels = PackedStringArray()
		module_slot_labels = PackedStringArray()
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
	region_name = str(region.get("display_name", _region_id)).to_upper()
	level_text = _tags_text(region.get("tags", []))
	xp_text = "%d / %d SLOTS" % [slots_used, slots_max]
	xp_progress = clampf(float(slots_used) / maxf(float(slots_max), 1.0) * 100.0, 0.0, 100.0)
	xp_semantic_state = _efficiency_state(float(cached.get("regional_efficiency", 1.0)))
	_update_slot_views(region, building_definitions)
	_sync_suspended = false
	_sync()
	_sync_slots()
	_update_stats(cached, summary)
	_sync_footer_button()


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


func _update_slot_views(region: Dictionary, building_definitions: Dictionary) -> void:
	var labels := PackedStringArray()
	var pips := PackedInt32Array()
	var states := PackedStringArray()
	var locked := PackedInt32Array()
	var entries := []

	for building_id in region.get("buildings", []):
		var definition: Dictionary = building_definitions.get(str(building_id), {})
		entries.append({
			"label": str(definition.get("display_name", building_id)),
			"pips": 5,
			"state": _slot_state_for_region(region),
		})

	var queue: Array = region.get("construction_queue", [])
	_construction_count = queue.size()
	for item_variant in queue:
		var item: Dictionary = item_variant
		var definition: Dictionary = building_definitions.get(str(item.get("building_id", "")), {})
		var total := maxf(float(item.get("total_months", 1)), 1.0)
		var remaining := maxf(float(item.get("months_remaining", total)), 0.0)
		var progress := 1.0 - remaining / total
		entries.append({
			"label": "%s (%d mo)" % [str(definition.get("display_name", item.get("building_id", ""))), int(remaining)],
			"pips": clampi(roundi(progress * 5.0), 1, 5),
			"state": "warning",
		})

	for index in range(6):
		if index < entries.size():
			var entry: Dictionary = entries[index]
			labels.append(str(entry.get("label", "")))
			pips.append(int(entry.get("pips", 0)))
			states.append(str(entry.get("state", "normal")))
		else:
			labels.append("Free slot")
			pips.append(0)
			states.append("disabled")
			locked.append(index)

	building_slot_labels = labels
	building_slot_pips = pips
	building_slot_semantic_states = states
	building_slot_locked_indices = locked

	var module_labels := PackedStringArray()
	for item_variant in queue:
		var item: Dictionary = item_variant
		var definition: Dictionary = building_definitions.get(str(item.get("building_id", "")), {})
		module_labels.append("%s / %d mo" % [str(definition.get("display_name", item.get("building_id", ""))), int(item.get("months_remaining", 0))])
	module_slot_labels = module_labels
	module_slot_pips = PackedInt32Array([3, 3, 3])
	module_slot_locked_indices = PackedInt32Array()

	var slots_title := get_node_or_null("ContentMargin/PanelStack/TabPages/Overview/BuildingSlotsHeader/BuildingSlotsTitle") as Label
	if slots_title != null:
		slots_title.text = "BUILDING SLOTS %d / %d" % [int(region.get("slots_used", entries.size())), int(region.get("slots_max", 0))]


func _update_stats(cached: Dictionary, summary: Dictionary) -> void:
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Overview/EnergyStatus",
		"ENERGY",
		"%d%%" % roundi(float(cached.get("energy_efficiency", 0.0)) * 100.0),
		float(cached.get("energy_efficiency", 0.0)) * 100.0,
		_efficiency_state(float(cached.get("energy_efficiency", 0.0))),
		"Prod %.1f / Use %.1f / Net %.1f" % [float(cached.get("energy_production", 0.0)), float(cached.get("energy_consumption", 0.0)), float(cached.get("energy_balance_local", 0.0))]
	)
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Overview/CoolingStatus",
		"COOLING",
		"%d%%" % roundi(float(cached.get("cooling_efficiency", 0.0)) * 100.0),
		float(cached.get("cooling_efficiency", 0.0)) * 100.0,
		_efficiency_state(float(cached.get("cooling_efficiency", 0.0))),
		"Available %.1f / Used %.1f" % [float(cached.get("cooling_available", 0.0)), float(cached.get("cooling_used", 0.0))]
	)
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Overview/ComputeStatus",
		"COMPUTE",
		"%.1f" % float(cached.get("compute_produced", 0.0)),
		clampf(float(cached.get("compute_produced", 0.0)) / 40.0 * 100.0, 0.0, 100.0),
		"success" if float(cached.get("compute_produced", 0.0)) > 8.0 else "normal",
		"Researchers %.1f req / %.1f global" % [float(cached.get("researchers_required", 0.0)), float(summary.get("researchers_available", 0.0))]
	)
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Stats/GridLoad",
		"GRID LOAD",
		"%.1f in" % float(cached.get("energy_imported", 0.0)),
		clampf(float(cached.get("energy_imported", 0.0)) / 40.0 * 100.0, 0.0, 100.0),
		"warning" if bool(cached.get("network_congested", false)) else "normal",
		"Export %.1f / Unserved %.1f" % [float(cached.get("energy_exported", 0.0)), float(cached.get("energy_unserved", 0.0))]
	)
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Stats/ImportExport",
		"IMPORT / EXPORT",
		"%+.1f" % (float(cached.get("energy_imported", 0.0)) - float(cached.get("energy_exported", 0.0))),
		50.0,
		"success" if float(cached.get("energy_balance_local", 0.0)) >= 0.0 else "warning",
		"Local balance %.1f" % float(cached.get("energy_balance_local", 0.0))
	)
	_set_stat(
		"ContentMargin/PanelStack/TabPages/Stats/Stability",
		"REGION EFFICIENCY",
		"%d%%" % roundi(float(cached.get("regional_efficiency", 0.0)) * 100.0),
		float(cached.get("regional_efficiency", 0.0)) * 100.0,
		_efficiency_state(float(cached.get("regional_efficiency", 0.0))),
		", ".join(cached.get("problems", []))
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
		_set_property_if_available(button, "label_text", "<" if collapsed else ">")
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
		_set_property_if_available(slot, "show_state_overlay", semantic_state in ["warning", "critical"])
		_set_property_if_available(slot, "show_status_badge", semantic_state in ["warning", "critical"])


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


func _efficiency_state(value: float) -> String:
	if value >= 0.98:
		return "success"
	if value >= 0.9:
		return "normal"
	if value >= 0.72:
		return "warning"
	return "critical"


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return

