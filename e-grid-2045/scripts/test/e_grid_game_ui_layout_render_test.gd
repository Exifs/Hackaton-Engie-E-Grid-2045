extends SceneTree

const GAME_SCENE := preload("res://scenes/game/game_scene.tscn")
const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")
const VIEWPORT_SIZE := Vector2i(1900, 900)
const CENTER_TOLERANCE := 3.0
const CAPTURE_ARG_PREFIX := "--egrid-capture="
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

	var game_scene := GAME_SCENE.instantiate() as Control
	if game_scene == null:
		_fail("Unable to instantiate game scene.")
		return

	root.add_child(game_scene)
	current_scene = game_scene

	for _index in range(12):
		await process_frame

	_validate_panel_backgrounds(game_scene)
	_validate_menu_button(game_scene)
	_validate_top_bar_resource_summary(game_scene)
	_validate_month_progress(game_scene)
	_validate_build_palette(game_scene)
	_validate_region_slots(game_scene)
	_validate_region_header(game_scene)
	_validate_alert_bar(game_scene)
	await _validate_stat_layout(game_scene)
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
			if not E_GRID_UI_ATLAS.has_state("utility_icons_48px", icon_state):
				_failures.append("Building icon state is missing from atlas manifest: %s." % icon_state)
			elif E_GRID_UI_ATLAS.get_texture("utility_icons_48px", icon_state) == null:
				_failures.append("Building icon state has no resolved texture: %s." % icon_state)

	for building_id in EXPECTED_BUILDING_ICON_STATES.keys():
		if not checked_ids.has(building_id):
			_failures.append("Build palette did not expose building icon for %s." % building_id)

	if seen_icons.size() < EXPECTED_BUILDING_ICON_STATES.size():
		_failures.append("Build palette building icons are not visually distinct enough: %d unique icons." % seen_icons.size())


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
	if slots_grid == null:
		_failures.append("Region building slots grid is missing.")
		return

	var available_slots := 0
	for child in slots_grid.get_children():
		var slot := child as BaseButton
		if slot == null or not slot.visible or bool(slot.get("locked")):
			continue

		if not slot.tooltip_text.begins_with("Available "):
			continue

		available_slots += 1
		var icon := slot.get_node_or_null("BuildingIcon") as TextureRect
		if icon == null or icon.texture == null:
			_failures.append("Available region slot should expose a ghost potential icon.")
		elif icon.modulate.a > 0.55:
			_failures.append("Available region slot icon should be visually quieter than occupied slots.")

		if int(slot.get("pips_active")) <= 0:
			_failures.append("Available region slot should expose potential pips.")

	if available_slots < 4:
		_failures.append("Region panel should keep visible available capacity slots.")


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
		seen_states[str(item.get("alert_state"))] = true
		seen_actions[str(item.get("action_text"))] = true

		var icon := item.get_node_or_null("ContentMargin/ContentRow/IconFrame/Icon") as TextureRect
		if icon == null or icon.texture == null:
			_failures.append("Alert tile should expose a status icon: %s." % item.name)

	if seen_states.size() < 4:
		_failures.append("Alert bar nominal/status tiles should use varied visual states.")
	if seen_actions.size() < 3:
		_failures.append("Alert bar nominal/status tiles should use varied concise actions.")


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


func _color_distance(a: Color, b: Color) -> float:
	var delta := Vector3(a.r - b.r, a.g - b.g, a.b - b.b)
	return delta.length()


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
