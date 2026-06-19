extends SceneTree

const GAME_SCENE := preload("res://scenes/game/game_scene.tscn")
const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")
const VIEWPORT_SIZE := Vector2i(1900, 900)
const CENTER_TOLERANCE := 3.0
const CAPTURE_ARG_PREFIX := "--egrid-capture="
const PANEL_FIXTURE_ARG_PREFIX := "--egrid-panel-fixture="
const CATEGORY_ICON_COMPONENT := "category_icons_mono_64px"
const BUILDING_ICON_MONO_COMPONENT := "building_icons_mono_64px"
const BUILDING_ICON_COLOR_COMPONENT := "building_icons_color_96px"
const NOTIFICATION_ICON_COMPONENT := "notification_icons_64px"
const STATUS_ICON_COMPONENT := "status_icons_mono_64px"
const UTILITY_ICON_COMPONENT := "utility_icons_48px"
const EXPECTED_BUILDING_ICON_STATES := {
	"university": "university",
	"ai_research_center": "ai_research_center",
	"energy_research_center": "energy_research_center",
	"datacenter_standard": "datacenter_standard",
	"datacenter_hyperscale": "datacenter_hyperscale",
	"gas_power_plant": "gas_power_plant",
	"nuclear_power_plant": "nuclear_power_plant",
	"wind_onshore": "wind_onshore",
	"wind_offshore": "wind_offshore",
	"solar_farm": "solar_farm",
	"hydro_dam": "hydro_dam",
	"battery_storage": "battery_storage",
	"air_cooling": "air_cooling",
	"river_cooling": "river_cooling",
	"sea_cooling": "sea_cooling",
	"geothermal_cooling": "geothermal_cooling",
}

var _failures: Array[String] = []


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	root.size = VIEWPORT_SIZE
	var panel_fixture := _panel_fixture_from_args()

	var game_scene := GAME_SCENE.instantiate() as Control
	if game_scene == null:
		_fail("Unable to instantiate game scene.")
		return

	root.add_child(game_scene)
	current_scene = game_scene

	for _index in range(12):
		await process_frame

	_validate_building_icon_assets()
	_validate_category_icon_assets()
	_validate_clean_replaced_icon_regions()
	_validate_notification_icon_assets()
	_validate_status_icon_assets()
	_validate_panel_backgrounds(game_scene)
	_validate_menu_button(game_scene)
	_validate_top_bar_resource_summary(game_scene)
	_validate_top_bar_progress_labels(game_scene)
	_validate_month_progress(game_scene)
	_validate_build_palette(game_scene)
	_validate_region_slots(game_scene)
	_validate_region_header(game_scene)
	_validate_region_footer_cta(game_scene)
	_validate_alert_bar(game_scene)
	await _validate_stat_layout(game_scene)
	if panel_fixture == "occupied":
		_apply_occupied_region_fixture(game_scene)
		for _index in range(6):
			await process_frame
		_validate_occupied_region_slots(game_scene)
	elif panel_fixture == "alerts":
		_apply_active_alert_fixture(game_scene)
		for _index in range(6):
			await process_frame
		_validate_active_alert_fixture(game_scene)
	_restore_capture_state(game_scene)
	await process_frame
	await _validate_top_bar_pixels()
	await _capture_if_requested()

	_report()


func _validate_panel_backgrounds(game_scene: Control) -> void:
	var top_bar := game_scene.get_node_or_null("SafeArea/Root/TopBar") as Control
	var build_owner := game_scene.get_node_or_null("SafeArea/Root/MainRow/BuildPalette") as Control
	var region_owner := game_scene.get_node_or_null("SafeArea/Root/MainRow/RegionPanel") as Control
	var top_panel := game_scene.get_node_or_null("SafeArea/Root/TopBar/BackgroundPanel") as Control
	var build_panel := game_scene.get_node_or_null("SafeArea/Root/MainRow/BuildPalette/BackgroundPanel") as Control
	var region_panel := game_scene.get_node_or_null("SafeArea/Root/MainRow/RegionPanel/BackgroundPanel") as Control

	for entry in [
		{"label": "top bar", "node": top_panel, "owner": top_bar},
		{"label": "build palette", "node": build_panel, "owner": build_owner},
		{"label": "region panel", "node": region_panel, "owner": region_owner},
	]:
		var panel := entry["node"] as Control
		if panel == null:
			_failures.append("Missing %s background panel." % entry["label"])
			continue

		if bool(panel.get("fit_to_source_size")):
			_failures.append("%s background should not fit to source size." % entry["label"])
		if not bool(panel.get("stretch_to_bounds")):
			_failures.append("%s background should stretch to bounds." % entry["label"])
		if bool(panel.get("nine_slice_tile_inner_regions")):
			_failures.append("%s background should stretch its center instead of tiling." % entry["label"])
		if panel.has_method("get_resolved_texture") and panel.call("get_resolved_texture") == null:
			_failures.append("%s background texture is not resolved." % entry["label"])

		var owner := entry["owner"] as Control
		if owner != null and panel.get_global_rect().size.x < owner.get_global_rect().size.x - 1.0:
			_failures.append("%s background does not cover its owner width." % entry["label"])


func _validate_menu_button(game_scene: Control) -> void:
	var menu_segment := game_scene.get_node_or_null("SafeArea/Root/TopBar/ContentMargin/MainRow/MenuSegment") as Control
	var menu_button := game_scene.get_node_or_null("SafeArea/Root/TopBar/ContentMargin/MainRow/MenuSegment/MenuButton") as Control
	if menu_segment == null or menu_button == null:
		_failures.append("Menu segment or button is missing.")
		return

	var segment_center := menu_segment.get_global_rect().get_center()
	var button_center := menu_button.get_global_rect().get_center()
	if button_center.distance_to(segment_center) > CENTER_TOLERANCE:
		_failures.append("Menu button is not centered in its segment: delta %.2f." % button_center.distance_to(segment_center))

	if menu_button.size.x < 50.0 or menu_button.size.y < 32.0:
		_failures.append("Menu button effective size is too small: %s." % str(menu_button.size))

	if bool(menu_button.get("fit_to_source_size")):
		_failures.append("Menu button should keep its scene-defined size.")


func _validate_top_bar_resource_summary(game_scene: Control) -> void:
	var summary := game_scene.get_node_or_null("SafeArea/Root/TopBar/ContentMargin/MainRow/BrandSegment/BrandBlock/ResourceSummary") as HBoxContainer
	if summary == null:
		_failures.append("Top bar should expose a structured resource summary under the logo.")
		return

	for metric_name in ["EnergyMetric", "CoolingMetric", "ResearchMetric", "ComputeMetric"]:
		var metric := summary.get_node_or_null(metric_name) as Control
		if metric == null:
			_failures.append("Top bar resource summary missing metric: %s." % metric_name)
			continue

		var value_label := metric.get_node_or_null("ValueLabel") as Label
		if value_label == null or value_label.text.is_empty() or value_label.text == "--/--":
			_failures.append("Top bar resource metric did not sync value: %s." % metric_name)


func _validate_top_bar_progress_labels(game_scene: Control) -> void:
	var europe_label := game_scene.get_node_or_null("SafeArea/Root/TopBar/ContentMargin/MainRow/ProgressSegment/ProgressBlock/ProgressContent/EuropeGroup/EuropeText/EuropeNameLabel") as Label
	var usa_label := game_scene.get_node_or_null("SafeArea/Root/TopBar/ContentMargin/MainRow/ProgressSegment/ProgressBlock/ProgressContent/UsaGroup/UsaText/UsaNameLabel") as Label
	if europe_label == null or usa_label == null:
		_failures.append("Top bar AGI progress labels are missing.")
		return

	if europe_label.text != "EUROPE":
		_failures.append("Top bar should use the concept AGI label EUROPE, got %s." % europe_label.text)
	if usa_label.text != "USA":
		_failures.append("Top bar should keep the USA AGI label, got %s." % usa_label.text)


func _validate_month_progress(game_scene: Control) -> void:
	var top_bar := game_scene.get_node_or_null("SafeArea/Root/TopBar") as Control
	var progress_bar := game_scene.get_node_or_null("SafeArea/Root/TopBar/ContentMargin/MainRow/DateSegment/DateBlock/MonthProgress") as Control
	var simulation_core := game_scene.get_node_or_null("SimulationCore")
	if top_bar == null or progress_bar == null or simulation_core == null:
		_failures.append("Month progress wiring is incomplete.")
		return

	game_scene.call("_sync_time_progress")
	var before := float(top_bar.get("month_progress"))
	simulation_core.call("set_simulation_speed", 1.0)
	simulation_core.call("step_simulation_time", 0.4)
	game_scene.call("_sync_time_progress")
	var after := float(top_bar.get("month_progress"))

	if is_equal_approx(after, before):
		_failures.append("Month progress did not update: %.2f -> %.2f." % [before, after])
	if bool(progress_bar.get("fit_to_source_size")):
		_failures.append("Month progress bar should use its compact scene-defined size.")
	if progress_bar.size.y > 16.0:
		_failures.append("Month progress bar is too tall for the top bar: %.2f." % progress_bar.size.y)
	if progress_bar.size.x < 128.0 or progress_bar.size.y < 12.0:
		_failures.append("Month progress bar should be large enough to read passing time: %s." % str(progress_bar.size))
	if not _object_has_property(progress_bar, "show_progress_head") or not bool(progress_bar.get("show_progress_head")):
		_failures.append("Month progress bar should expose a visible progress head.")
	if not _object_has_property(progress_bar, "animate_value_changes") or not bool(progress_bar.get("animate_value_changes")):
		_failures.append("Month progress bar should animate value changes.")
	if _object_has_property(progress_bar, "bar_track_rect"):
		var track_rect: Rect2 = progress_bar.get("bar_track_rect")
		if track_rect.size.y < 14.0:
			_failures.append("Month progress track is too thin to read: %.2f." % track_rect.size.y)


func _validate_build_palette(game_scene: Control) -> void:
	var palette := game_scene.get_node_or_null("SafeArea/Root/MainRow/BuildPalette") as Control
	if palette == null:
		_failures.append("Build palette is missing.")
		return

	var category_paths := [
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/EnergyCategory",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/DatacentersCategory",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/CoolingCategory",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/ResearchCategory",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/GridNetworkCategory",
	]
	for path in category_paths:
		var category := palette.get_node_or_null(path) as Control
		if category == null or not category.is_visible_in_tree():
			_failures.append("Build palette category is not visible: %s." % path)

	_validate_build_palette_text(palette)
	_validate_build_palette_category_icons(palette)
	_validate_build_palette_building_icons(palette)
	_validate_grid_overview(palette)

	var scroll := palette.get_node_or_null("ContentMargin/PaletteStack/CategoriesScroll") as ScrollContainer
	if scroll != null:
		var vertical_bar := scroll.get_v_scroll_bar()
		if vertical_bar != null and vertical_bar.visible:
			_failures.append("Build palette should not show a category scrollbar at the reference viewport.")


func _validate_build_palette_text(palette: Control) -> void:
	var expected_titles := {
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/DatacentersCategory/ContentMargin/CategoryRow/ToolsStack/Header/TitleLabel": "DATACENTERS",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/GridNetworkCategory/ContentMargin/CategoryRow/ToolsStack/Header/TitleLabel": "GRID & NETWORK",
	}
	for path in expected_titles.keys():
		var label := palette.get_node_or_null(path) as Label
		if label == null or label.text != str(expected_titles[path]):
			_failures.append("Build palette title mismatch at %s." % path)

	var expected_overlay_labels := {
		"ContentMargin/PaletteStack/OverlayPanel/PowerFlowRow/PowerFlowLabel": "PWR",
		"ContentMargin/PaletteStack/OverlayPanel/DataFlowRow/DataFlowLabel": "DATA",
		"ContentMargin/PaletteStack/OverlayPanel/CongestionRow/CongestionLabel": "COOL",
	}
	for path in expected_overlay_labels.keys():
		var label := palette.get_node_or_null(path) as Label
		if label == null or label.text != str(expected_overlay_labels[path]):
			_failures.append("Build palette overlay label mismatch at %s." % path)


func _validate_build_palette_category_icons(palette: Control) -> void:
	var expected_categories := {
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/EnergyCategory": "energy",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/DatacentersCategory": "datacenter",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/CoolingCategory": "cooling",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/ResearchCategory": "research",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/GridNetworkCategory": "grid",
	}

	for path in expected_categories.keys():
		var category := palette.get_node_or_null(path) as Control
		if category == null:
			continue
		var button := category.get_node_or_null("ContentMargin/CategoryRow/PrimaryButton") as BaseButton
		if button == null:
			_failures.append("Build palette category is missing primary icon button: %s." % path)
			continue

		var expected_state := str(expected_categories[path])
		var icon_state := str(button.get("utility_icon_state"))
		var icon_component := str(button.get("utility_icon_component_name"))
		if icon_state != expected_state:
			_failures.append("Category icon state mismatch at %s: expected %s, got %s." % [path, expected_state, icon_state])
		if icon_component != CATEGORY_ICON_COMPONENT:
			_failures.append("Category icon should use dedicated category atlas at %s, got %s." % [path, icon_component])
		if not E_GRID_UI_ATLAS.has_state(CATEGORY_ICON_COMPONENT, expected_state):
			_failures.append("Category icon atlas is missing state %s." % expected_state)
		else:
			var texture := E_GRID_UI_ATLAS.get_texture(CATEGORY_ICON_COMPONENT, expected_state)
			if texture == null or not _atlas_texture_uses(texture, "category_icons_mono_64px.png"):
				_failures.append("Category icon state %s did not resolve the category spritesheet." % expected_state)


func _validate_build_palette_building_icons(palette: Control) -> void:
	var category_paths := [
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/EnergyCategory",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/DatacentersCategory",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/CoolingCategory",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/ResearchCategory",
		"ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/GridNetworkCategory",
	]
	var checked_ids := {}
	var seen_icons := {}

	for path in category_paths:
		var category := palette.get_node_or_null(path) as Control
		if category == null:
			continue

		var slots_grid := category.get_node_or_null("ContentMargin/CategoryRow/ToolsStack/SlotsGrid") as GridContainer
		if slots_grid == null:
			_failures.append("Build category has no icon slot grid at %s." % path)
			continue

		for child in slots_grid.get_children():
			var button := child as BaseButton
			if button == null or not button.visible:
				continue

			var building_id := str(button.get_meta("tutorial_building_id", ""))
			if building_id.is_empty():
				continue
			checked_ids[building_id] = true

			var expected_state := str(EXPECTED_BUILDING_ICON_STATES.get(building_id, ""))
			var icon_state := str(button.get("utility_icon_state"))
			seen_icons[icon_state] = true
			if expected_state.is_empty():
				_failures.append("No expected building icon state registered for %s." % building_id)
				continue
			if icon_state != expected_state:
				_failures.append("Building %s should use icon state %s, got %s." % [building_id, expected_state, icon_state])
			var icon_size: Vector2 = button.get("icon_size")
			if icon_size.x < 22.0 or icon_size.y < 22.0:
				_failures.append("Building %s icon is too small to read in the build palette: %s." % [building_id, str(icon_size)])
			var icon_component := str(button.get("utility_icon_component_name"))
			if icon_component != BUILDING_ICON_MONO_COMPONENT:
				_failures.append("Build palette should use mono building icon atlas for %s, got %s." % [building_id, icon_component])
			if not E_GRID_UI_ATLAS.has_state(BUILDING_ICON_MONO_COMPONENT, icon_state):
				_failures.append("Building mono icon state is missing from atlas manifest: %s." % icon_state)
			elif E_GRID_UI_ATLAS.get_texture(BUILDING_ICON_MONO_COMPONENT, icon_state) == null:
				_failures.append("Building mono icon state has no resolved texture: %s." % icon_state)

	for building_id in EXPECTED_BUILDING_ICON_STATES.keys():
		if not checked_ids.has(building_id):
			_failures.append("Build palette did not expose building icon for %s." % building_id)

	if seen_icons.size() < EXPECTED_BUILDING_ICON_STATES.size():
		_failures.append("Build palette building icons are not visually distinct enough: %d unique icons." % seen_icons.size())


func _validate_building_icon_assets() -> void:
	if E_GRID_UI_ATLAS.get_cell_size(BUILDING_ICON_MONO_COMPONENT) != Vector2i(64, 64):
		_failures.append("Mono building icon atlas should use 64 px cells.")
	if E_GRID_UI_ATLAS.get_cell_size(BUILDING_ICON_COLOR_COMPONENT) != Vector2i(96, 96):
		_failures.append("Color building icon atlas should use 96 px cells.")

	for building_id in EXPECTED_BUILDING_ICON_STATES.keys():
		var icon_state := str(EXPECTED_BUILDING_ICON_STATES[building_id])
		for component in [BUILDING_ICON_MONO_COMPONENT, BUILDING_ICON_COLOR_COMPONENT]:
			if not E_GRID_UI_ATLAS.has_state(component, icon_state):
				_failures.append("%s is missing state %s." % [component, icon_state])
				continue

			var texture := E_GRID_UI_ATLAS.get_texture(component, icon_state)
			if texture == null:
				_failures.append("%s state %s did not resolve a texture." % [component, icon_state])
			elif not _atlas_texture_uses(texture, "%s.png" % component):
				_failures.append("%s state %s resolved the wrong spritesheet." % [component, icon_state])
		if E_GRID_UI_ATLAS.has_state(UTILITY_ICON_COMPONENT, icon_state):
			_failures.append("Replaced building icon %s should not remain in utility icon atlas." % icon_state)


func _validate_category_icon_assets() -> void:
	if E_GRID_UI_ATLAS.get_cell_size(CATEGORY_ICON_COMPONENT) != Vector2i(64, 64):
		_failures.append("Category icon atlas should use 64 px cells.")

	for icon_state in ["energy", "datacenter", "cooling", "research", "grid"]:
		if not E_GRID_UI_ATLAS.has_state(CATEGORY_ICON_COMPONENT, icon_state):
			_failures.append("Category icon state is missing from atlas manifest: %s." % icon_state)
			continue
		var texture := E_GRID_UI_ATLAS.get_texture(CATEGORY_ICON_COMPONENT, icon_state)
		if texture == null:
			_failures.append("Category icon state has no resolved texture: %s." % icon_state)
		elif not _atlas_texture_uses(texture, "category_icons_mono_64px.png"):
			_failures.append("Category icon state resolved the wrong spritesheet: %s." % icon_state)


func _validate_clean_replaced_icon_regions() -> void:
	var button_image := _load_source_image("res://assets/ui/components/egrid_2045_ui_component_pack_concept_v3/spritesheets/icon_button_states.png")
	if button_image == null:
		_failures.append("Unable to load cleaned icon button spritesheet.")
	else:
		for cell_index in range(int(button_image.get_width() / 68)):
			var bright_pixels := _count_bright_pixels(button_image, Rect2i(cell_index * 68 + 15, 11, 39, 42), 0.35)
			if bright_pixels > 0:
				_failures.append("Icon button state %d still contains a baked center glyph." % cell_index)

	var toast_image := _load_source_image("res://assets/ui/components/egrid_2045_ui_component_pack_concept_v3/spritesheets/alert_toast_states.png")
	if toast_image == null:
		_failures.append("Unable to load cleaned alert toast spritesheet.")
	else:
		for cell_index in range(int(toast_image.get_width() / 340)):
			var left_bright_pixels := _count_bright_pixels(toast_image, Rect2i(cell_index * 340 + 18, 16, 36, 36), 0.35)
			var text_bright_pixels := _count_bright_pixels(toast_image, Rect2i(cell_index * 340 + 68, 16, 137, 31), 0.35)
			if left_bright_pixels > 0 or text_bright_pixels > 0:
				_failures.append("Alert toast state %d still contains baked icon/text strokes." % cell_index)


func _validate_notification_icon_assets() -> void:
	if E_GRID_UI_ATLAS.get_cell_size(NOTIFICATION_ICON_COMPONENT) != Vector2i(64, 64):
		_failures.append("Notification icon atlas should use 64 px cells.")

	for icon_state in ["power", "critical", "cooling", "research", "market", "grid", "supply", "system"]:
		if not E_GRID_UI_ATLAS.has_state(NOTIFICATION_ICON_COMPONENT, icon_state):
			_failures.append("Notification icon state is missing from atlas manifest: %s." % icon_state)
			continue
		var texture := E_GRID_UI_ATLAS.get_texture(NOTIFICATION_ICON_COMPONENT, icon_state)
		if texture == null:
			_failures.append("Notification icon state has no resolved texture: %s." % icon_state)
		elif not _atlas_texture_uses(texture, "notification_icons_64px.png"):
			_failures.append("Notification icon state resolved the wrong spritesheet: %s." % icon_state)


func _validate_status_icon_assets() -> void:
	if E_GRID_UI_ATLAS.get_cell_size(STATUS_ICON_COMPONENT) != Vector2i(64, 64):
		_failures.append("Status icon atlas should use 64 px cells.")

	for icon_state in ["energy", "cooling", "compute", "grid", "battery", "science"]:
		if not E_GRID_UI_ATLAS.has_state(STATUS_ICON_COMPONENT, icon_state):
			_failures.append("Status icon state is missing from atlas manifest: %s." % icon_state)
			continue
		var texture := E_GRID_UI_ATLAS.get_texture(STATUS_ICON_COMPONENT, icon_state)
		if texture == null:
			_failures.append("Status icon state has no resolved texture: %s." % icon_state)
		elif not _atlas_texture_uses(texture, "status_icons_mono_64px.png"):
			_failures.append("Status icon state resolved the wrong spritesheet: %s." % icon_state)


func _validate_grid_overview(palette: Control) -> void:
	var map_preview := palette.get_node_or_null("ContentMargin/PaletteStack/GridOverview/ContentMargin/OverviewStack/BodyRow/MapPreview") as Control
	if map_preview == null:
		_failures.append("Build palette grid overview map preview is missing.")
		return

	if map_preview.custom_minimum_size.x < 150.0 or map_preview.custom_minimum_size.y < 96.0:
		_failures.append("Grid overview map preview is too small for the reference panel style.")

	if not map_preview.has_method("get_render_diagnostics"):
		_failures.append("Grid overview map preview should expose render diagnostics.")
		return

	var diagnostics: Dictionary = map_preview.call("get_render_diagnostics")
	if int(diagnostics.get("region_count", 0)) < 5:
		_failures.append("Grid overview map should render multiple regional masses.")
	if int(diagnostics.get("node_count", 0)) < 12:
		_failures.append("Grid overview map should render a dense hub network.")
	if int(diagnostics.get("total_link_count", 0)) < 14:
		_failures.append("Grid overview map should render dense power/data links.")


func _validate_region_slots(game_scene: Control) -> void:
	var slots_grid := game_scene.get_node_or_null("SafeArea/Root/MainRow/RegionPanel/ContentMargin/PanelStack/TabPages/Overview/BuildingSlotsGrid") as GridContainer
	var region_panel := game_scene.get_node_or_null("SafeArea/Root/MainRow/RegionPanel") as Control
	if slots_grid == null:
		_failures.append("Region building slots grid is missing.")
		return

	var available_slots := 0
	for child in slots_grid.get_children():
		var slot := child as BaseButton
		if slot == null or not slot.visible or bool(slot.get("locked")):
			continue

		if not slot.tooltip_text.begins_with("Available "):
			if slot.tooltip_text.begins_with("+"):
				var overflow_icon := slot.get_node_or_null("BuildingIcon") as TextureRect
				if overflow_icon != null and overflow_icon.visible:
					_failures.append("Overflow building slot should not display a building icon.")
				if int(slot.get("pips_active")) != 0:
					_failures.append("Overflow building slot should not display potential pips.")
			continue

		available_slots += 1
		var icon := slot.get_node_or_null("BuildingIcon") as TextureRect
		if icon != null and (icon.visible or icon.texture != null):
			_failures.append("Available region slot should not display a building icon before construction.")

		if int(slot.get("pips_active")) <= 0:
			_failures.append("Available region slot should expose potential pips.")

	if available_slots < 4:
		_failures.append("Region panel should keep visible available capacity slots.")

	if region_panel != null:
		var color_texture := region_panel.call("_slot_icon_texture", "solar_farm", false) as Texture2D
		if color_texture == null or not _atlas_texture_uses(color_texture, "%s.png" % BUILDING_ICON_COLOR_COMPONENT):
			_failures.append("Region occupied slots should resolve color building icons.")


func _apply_occupied_region_fixture(game_scene: Control) -> void:
	var simulation_core := game_scene.get_node_or_null("SimulationCore")
	if simulation_core == null:
		_failures.append("Unable to prepare occupied panel fixture: simulation core is missing.")
		return

	var regions: Dictionary = simulation_core.get("regions")
	var region_id := "fr_nord"
	if not regions.has(region_id):
		_failures.append("Unable to prepare occupied panel fixture: fr_nord is missing.")
		return

	var region: Dictionary = regions[region_id]
	region["buildings"] = [
		"datacenter_standard",
		"gas_power_plant",
		"wind_onshore",
		"solar_farm",
		"air_cooling",
		"university",
	]
	region["construction_queue"] = []
	regions[region_id] = region
	simulation_core.set("regions", regions)

	if simulation_core.has_method("_recalculate"):
		simulation_core.call("_recalculate", false)
	if simulation_core.has_method("select_region"):
		simulation_core.call("select_region", region_id)
	if game_scene.has_method("_refresh_game_ui"):
		game_scene.call("_refresh_game_ui")


func _validate_occupied_region_slots(game_scene: Control) -> void:
	var slots_grid := game_scene.get_node_or_null("SafeArea/Root/MainRow/RegionPanel/ContentMargin/PanelStack/TabPages/Overview/BuildingSlotsGrid") as GridContainer
	if slots_grid == null:
		_failures.append("Occupied panel fixture is missing the building slots grid.")
		return

	var occupied_count := 0
	var color_icon_paths := {}
	for child in slots_grid.get_children():
		var slot := child as BaseButton
		if slot == null or not slot.visible:
			continue

		var tooltip := slot.tooltip_text
		var icon := slot.get_node_or_null("BuildingIcon") as TextureRect
		if tooltip.begins_with("Available "):
			if icon != null and (icon.visible or icon.texture != null):
				_failures.append("Occupied fixture available slot should remain icon-free.")
			continue
		if tooltip.begins_with("+"):
			if icon != null and (icon.visible or icon.texture != null):
				_failures.append("Occupied fixture overflow slot should remain icon-free.")
			continue

		occupied_count += 1
		if icon == null or not icon.visible or icon.texture == null:
			_failures.append("Occupied building slot should display a building icon: %s." % tooltip)
			continue
		if icon.modulate.a < 0.95:
			_failures.append("Occupied building slot icon should be fully opaque: %s." % tooltip)
		if not _atlas_texture_uses(icon.texture, "%s.png" % BUILDING_ICON_COLOR_COMPONENT):
			_failures.append("Occupied building slot should use the color building atlas: %s." % tooltip)
		else:
			var atlas_texture := icon.texture as AtlasTexture
			if atlas_texture != null:
				color_icon_paths[str(atlas_texture.region)] = true
		if int(slot.get("pips_active")) < 5:
			_failures.append("Occupied building slot should show full operational pips: %s." % tooltip)

	if occupied_count < 5:
		_failures.append("Occupied panel fixture should render several constructed building slots, got %d." % occupied_count)
	if color_icon_paths.size() < 5:
		_failures.append("Occupied building slots should use visually distinct color icons, got %d unique regions." % color_icon_paths.size())


func _validate_region_header(game_scene: Control) -> void:
	var capacity_label := game_scene.get_node_or_null("SafeArea/Root/MainRow/RegionPanel/ContentMargin/PanelStack/LevelRow/LevelInfoStack/LevelMetaRow/LevelLabel") as Label
	var capacity_bar := game_scene.get_node_or_null("SafeArea/Root/MainRow/RegionPanel/ContentMargin/PanelStack/LevelRow/LevelInfoStack/XpBar") as Control

	if capacity_label == null or capacity_label.text != "BUILD CAPACITY":
		_failures.append("Region header should label the slot gauge as build capacity.")
	elif capacity_label.tooltip_text.is_empty():
		_failures.append("Region header should keep selected region tags available as context.")
	if capacity_bar == null:
		_failures.append("Region header build capacity bar is missing.")
	elif str(capacity_bar.get("semantic_state")) == "success":
		_failures.append("Region build capacity should not reuse efficiency success state.")


func _validate_region_footer_cta(game_scene: Control) -> void:
	var region_panel := game_scene.get_node_or_null("SafeArea/Root/MainRow/RegionPanel") as Control
	var button := game_scene.get_node_or_null("SafeArea/Root/MainRow/RegionPanel/ContentMargin/PanelStack/FooterRow/ManageRegionButton") as BaseButton
	if region_panel == null or button == null:
		_failures.append("Region footer CTA is missing.")
		return

	if str(button.get("label_text")) != "MANAGE REGION":
		_failures.append("Region footer CTA should keep the concept label MANAGE REGION, got %s." % str(button.get("label_text")))
	if button.disabled:
		_failures.append("Region footer CTA should be enabled for a selected region.")
	if button.size.y < 38.0:
		_failures.append("Region footer CTA is too short to read as the primary action: %s." % str(button.size))

	var previous_tab := str(region_panel.get("active_tab"))
	if previous_tab != "overview":
		region_panel.set("active_tab", "overview")
	button.pressed.emit()
	if str(region_panel.get("active_tab")) != "buildings":
		_failures.append("Region footer CTA should open the Buildings tab when no construction is active.")
	region_panel.set("active_tab", "overview")


func _validate_alert_bar(game_scene: Control) -> void:
	var alert_items := game_scene.get_node_or_null("SafeArea/Root/AlertBar/ContentMargin/AlertRow/AlertItems") as Container
	if alert_items == null:
		_failures.append("Alert item container is missing.")
		return

	if alert_items.get_child_count() < 5:
		_failures.append("Alert bar should keep five nominal/status tiles when there are no active alerts.")

	var seen_states := {}
	var seen_actions := {}
	for child in alert_items.get_children():
		if not child is Control:
			continue
		var item := child as Control
		if item.size_flags_horizontal != Control.SIZE_EXPAND_FILL:
			_failures.append("Alert tile should expand to use available alert bar width: %s." % item.name)
		seen_states[str(item.get("alert_state"))] = true
		seen_actions[str(item.get("action_text"))] = true

		var icon := item.get_node_or_null("ContentMargin/ContentRow/IconFrame/Icon") as TextureRect
		if icon == null or icon.texture == null:
			_failures.append("Alert tile should expose a status icon: %s." % item.name)
		elif not _atlas_texture_uses(icon.texture, "notification_icons_64px.png"):
			_failures.append("Alert tile should use the notification icon atlas: %s." % item.name)

	if seen_states.size() < 4:
		_failures.append("Alert bar nominal/status tiles should use varied visual states.")
	if seen_actions.size() < 3:
		_failures.append("Alert bar nominal/status tiles should use varied concise actions.")


func _apply_active_alert_fixture(game_scene: Control) -> void:
	var alert_bar := game_scene.get_node_or_null("SafeArea/Root/AlertBar") as Control
	if alert_bar == null or not alert_bar.has_method("set_alerts"):
		_failures.append("Unable to prepare active alert fixture: alert bar is missing.")
		return

	alert_bar.call("set_alerts", [
		{
			"title": "POWER CONGESTION",
			"body": "High load on Germany -> Austria",
			"region_id": "de_west",
			"state": "power_warning",
			"action_text": "VIEW",
		},
		{
			"title": "COOLING WARNING",
			"body": "Low reserve in Italy",
			"region_id": "it_north",
			"state": "cooling_warning",
			"action_text": "VIEW",
		},
		{
			"title": "DATA LINK DEGRADED",
			"body": "Netherlands -> Germany",
			"region_id": "benelux",
			"state": "critical",
			"action_text": "VIEW",
		},
		{
			"title": "RESEARCH COMPLETE",
			"body": "Advanced liquid cooling",
			"region_id": "",
			"state": "research_success",
			"action_text": "CLAIM",
		},
		{
			"title": "MARKET UPDATE",
			"body": "Battery prices decreased",
			"region_id": "",
			"state": "market_info",
			"action_text": "INFO",
		},
	])


func _validate_active_alert_fixture(game_scene: Control) -> void:
	var alert_bar := game_scene.get_node_or_null("SafeArea/Root/AlertBar") as Control
	var alert_items := game_scene.get_node_or_null("SafeArea/Root/AlertBar/ContentMargin/AlertRow/AlertItems") as Container
	if alert_bar == null or alert_items == null:
		_failures.append("Active alert fixture is missing alert bar nodes.")
		return

	var expected_states := {
		"POWER CONGESTION": "power_warning",
		"COOLING WARNING": "cooling_warning",
		"DATA LINK DEGRADED": "critical",
		"RESEARCH COMPLETE": "research_success",
		"MARKET UPDATE": "market_info",
	}
	var seen_titles := {}
	var seen_states := {}
	var alert_rect := alert_bar.get_global_rect()

	for child in alert_items.get_children():
		if child.is_queued_for_deletion():
			continue
		var item := child as Control
		if item == null or not item.visible:
			continue

		var title := str(item.get("title_text"))
		if not expected_states.has(title):
			continue

		seen_titles[title] = true
		var state := str(item.get("alert_state"))
		seen_states[state] = true
		if state != str(expected_states[title]):
			_failures.append("Active alert state mismatch for %s: %s." % [title, state])

		var item_rect := item.get_global_rect()
		if not alert_rect.encloses(item_rect):
			_failures.append("Active alert card should stay inside alert bar bounds: %s." % title)
		if item_rect.size.x < 300.0 or item_rect.size.y < 64.0:
			_failures.append("Active alert card is too small to read: %s -> %s." % [title, str(item_rect.size)])
		if item.size_flags_horizontal != Control.SIZE_EXPAND_FILL:
			_failures.append("Active alert card should expand across available width: %s." % title)

		var icon := item.get_node_or_null("ContentMargin/ContentRow/IconFrame/Icon") as TextureRect
		if icon == null or not icon.visible or icon.texture == null:
			_failures.append("Active alert should display a notification icon: %s." % title)
		elif not _atlas_texture_uses(icon.texture, "%s.png" % NOTIFICATION_ICON_COMPONENT):
			_failures.append("Active alert should use notification icon atlas: %s." % title)

		var title_label := item.get_node_or_null("ContentMargin/ContentRow/TextBlock/TitleLabel") as Label
		if title_label == null or title_label.text != title:
			_failures.append("Active alert title label did not sync: %s." % title)

		var action_button := item.get_node_or_null("ContentMargin/ContentRow/ActionButton") as BaseButton
		if action_button == null:
			_failures.append("Active alert should expose an action button: %s." % title)
		elif action_button.size.x < 48.0:
			_failures.append("Active alert action button is too narrow: %s." % title)

	for title in expected_states.keys():
		if not seen_titles.has(title):
			_failures.append("Active alert fixture did not render expected card: %s." % title)
	if seen_states.size() < 4:
		_failures.append("Active alert fixture should render varied semantic alert states.")


func _validate_stat_layout(game_scene: Control) -> void:
	var region_panel := game_scene.get_node_or_null("SafeArea/Root/MainRow/RegionPanel") as Control
	if region_panel == null:
		_failures.append("Region panel is missing.")
		return

	var chrome := region_panel.get_node_or_null("SectionChrome") as Control
	var content := region_panel.get_node_or_null("ContentMargin") as Control
	if chrome == null or content == null:
		_failures.append("Region panel chrome/content is missing.")
	elif chrome.get_index() >= content.get_index():
		_failures.append("Region panel chrome should draw under content.")

	region_panel.set("active_tab", "overview")
	await process_frame
	_validate_stat_group(region_panel, [
		"ContentMargin/PanelStack/TabPages/Overview/EnergyStatus",
		"ContentMargin/PanelStack/TabPages/Overview/CoolingStatus",
		"ContentMargin/PanelStack/TabPages/Overview/ComputeStatus",
	])

	region_panel.set("active_tab", "stats")
	await process_frame
	_validate_stat_group(region_panel, [
		"ContentMargin/PanelStack/TabPages/Stats/GridLoad",
		"ContentMargin/PanelStack/TabPages/Stats/ImportExport",
		"ContentMargin/PanelStack/TabPages/Stats/Stability",
	])


func _validate_stat_group(region_panel: Control, paths: Array[String]) -> void:
	for path in paths:
		var stat := region_panel.get_node_or_null(path) as Control
		if stat == null:
			_failures.append("Missing stat: %s." % path)
			continue
		if not stat.is_visible_in_tree():
			_failures.append("Stat should be visible in active tab: %s." % path)
			continue

		var detail_columns := stat.get_node_or_null("DetailColumns") as HBoxContainer
		if detail_columns == null:
			_failures.append("Stat has no detail columns: %s." % path)
			continue

		var visible_columns := 0
		for child in detail_columns.get_children():
			if child is Control and (child as Control).visible:
				visible_columns += 1

		if visible_columns != 3:
			_failures.append("Stat should expose 3 detail columns: %s has %d." % [path, visible_columns])

		var header := stat.get_node_or_null("Header") as Control
		if header != null and detail_columns.get_global_rect().position.y <= header.get_global_rect().end.y:
			_failures.append("Stat details overlap header: %s." % path)

		var icon := stat.get_node_or_null("Header/Icon") as TextureRect
		if icon == null or icon.texture == null:
			_failures.append("Stat should expose a status icon: %s." % path)
		elif not _atlas_texture_uses(icon.texture, "status_icons_mono_64px.png"):
			_failures.append("Stat should use the dedicated status icon atlas: %s." % path)
		elif icon.size.x > 32.0 or icon.size.y > 32.0:
			_failures.append("Stat status icon should keep a compact UI size: %s is %s." % [path, str(icon.size)])


func _restore_capture_state(game_scene: Control) -> void:
	var region_panel := game_scene.get_node_or_null("SafeArea/Root/MainRow/RegionPanel") as Control
	if region_panel != null:
		region_panel.set("active_tab", "overview")


func _validate_top_bar_pixels() -> void:
	if DisplayServer.get_name().to_lower().contains("headless"):
		print("Skipping top bar pixel sampling: headless display server uses a dummy renderer.")
		return

	for _index in range(4):
		await process_frame

	var viewport_texture := root.get_texture()
	if viewport_texture == null:
		_failures.append("Unable to capture viewport texture for top bar render test.")
		return

	var viewport_image := viewport_texture.get_image()
	if viewport_image == null or viewport_image.is_empty():
		print("Skipping top bar pixel sampling: viewport image is unavailable with the active renderer.")
		return

	var background_color := viewport_image.get_pixel(4, 4)
	var sample_points := [
		Vector2i(24, 24),
		Vector2i(int(VIEWPORT_SIZE.x / 2), 24),
		Vector2i(VIEWPORT_SIZE.x - 160, 24),
	]

	for point in sample_points:
		var color := viewport_image.get_pixel(point.x, point.y)
		if _color_distance(color, background_color) < 0.015:
			_failures.append("Top bar background looks blank at %s." % str(point))


func _capture_if_requested() -> void:
	var capture_path := _capture_path_from_args()
	if capture_path.is_empty():
		return
	if DisplayServer.get_name().to_lower().contains("headless"):
		print("Skipping requested capture: headless display server uses a dummy renderer.")
		return

	for _index in range(4):
		await process_frame

	var viewport_texture := root.get_texture()
	if viewport_texture == null:
		_failures.append("Unable to capture viewport texture for %s." % capture_path)
		return

	var viewport_image := viewport_texture.get_image()
	if viewport_image == null or viewport_image.is_empty():
		_failures.append("Unable to capture viewport image for %s." % capture_path)
		return

	var error := viewport_image.save_png(capture_path)
	if error != OK:
		_failures.append("Unable to save capture to %s: %d." % [capture_path, error])
		return

	print("Saved UI layout capture to %s." % capture_path)


func _capture_path_from_args() -> String:
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with(CAPTURE_ARG_PREFIX):
			return argument.substr(CAPTURE_ARG_PREFIX.length()).strip_edges()

	return ""


func _panel_fixture_from_args() -> String:
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with(PANEL_FIXTURE_ARG_PREFIX):
			return argument.substr(PANEL_FIXTURE_ARG_PREFIX.length()).strip_edges().to_lower()

	return ""


func _color_distance(a: Color, b: Color) -> float:
	var delta := Vector3(a.r - b.r, a.g - b.g, a.b - b.b)
	return delta.length()


func _load_source_image(resource_path: String) -> Image:
	var image := Image.new()
	var error := image.load(ProjectSettings.globalize_path(resource_path))
	if error != OK:
		return null
	return image


func _count_bright_pixels(image: Image, region: Rect2i, threshold: float) -> int:
	var count := 0
	for y in range(region.position.y, region.position.y + region.size.y):
		for x in range(region.position.x, region.position.x + region.size.x):
			var pixel := image.get_pixel(x, y)
			if pixel.a > 0.18 and maxf(pixel.r, maxf(pixel.g, pixel.b)) > threshold:
				count += 1
	return count


func _atlas_texture_uses(texture: Texture2D, filename: String) -> bool:
	var atlas_texture := texture as AtlasTexture
	if atlas_texture == null or atlas_texture.atlas == null:
		return false
	return atlas_texture.atlas.resource_path.ends_with(filename)


func _object_has_property(target: Object, property_name: String) -> bool:
	if target == null:
		return false

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			return true

	return false


func _fail(message: String) -> void:
	push_error(message)
	quit(1)


func _report() -> void:
	if _failures.is_empty():
		print("E-Grid game UI layout/render test passed.")
		quit(0)
		return

	for failure in _failures:
		push_error(failure)
	quit(1)
