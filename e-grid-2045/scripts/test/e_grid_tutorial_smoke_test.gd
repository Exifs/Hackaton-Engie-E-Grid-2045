extends SceneTree

const DATA_LOADER := preload("res://scripts/simulation/DataLoader.gd")
const BUILD_PALETTE_SCENE := preload("res://scenes/ui/game/e_grid_build_palette.tscn")
const GAME_SCENE := preload("res://scenes/game/game_scene.tscn")
const TUTORIAL_OVERLAY_SCENE := preload("res://scenes/ui/tutorial/TutorialOverlay.tscn")
const TUTORIAL_MANAGER := preload("res://scripts/tutorial/TutorialManager.gd")
const TUTORIAL_PATH := "res://data/tutorial_first_loop.json"
const TEST_CONFIG_PATH := "user://tutorial_state_reset_test.cfg"
const TEST_CONFIG_FILE := "tutorial_state_reset_test.cfg"
const TUTORIAL_LAYOUT_TEST_SIZE := Vector2(1228.0, 915.0)
const REQUIRED_STEP_KEYS := ["id", "title", "body", "objective", "required_event"]
const NEW_BUILD_TARGETS := [
	"build_menu.cooling_overlay_button",
	"build_menu.university_button",
	"build_menu.wind_onshore_button",
	"build_menu.river_cooling_button",
	"build_menu.datacenter_button",
	"build_menu.ai_research_center_button",
]
const EXPECTED_BUILD_TARGET_IDS := {
	"build_menu.university_button": "university",
	"build_menu.wind_onshore_button": "wind_onshore",
	"build_menu.river_cooling_button": "river_cooling",
	"build_menu.datacenter_button": "datacenter_standard",
	"build_menu.ai_research_center_button": "ai_research_center",
}
const COOLING_OVERLAY_PATH_SUFFIX := "ContentMargin/PaletteStack/OverlayPanel/CongestionRow/CongestionCheck"
const BUILD_CATEGORY_PATHS := {
	"energy": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/EnergyCategory",
	"compute": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/DatacentersCategory",
	"cooling": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/CoolingCategory",
	"research": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/ResearchCategory",
	"grid": "ContentMargin/PaletteStack/CategoriesScroll/CategoriesStack/GridNetworkCategory",
}
const SLOTS_GRID_PATH := "ContentMargin/CategoryRow/ToolsStack/SlotsGrid"
const CATEGORIES_SCROLL_PATH := "ContentMargin/PaletteStack/CategoriesScroll"
const GAME_BUILD_PALETTE_PATH := "SafeArea/Root/MainRow/BuildPalette"

var _failures: Array[String] = []


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var steps := _load_tutorial_steps()
	if steps.is_empty():
		_report()
		return

	_validate_step_shape(steps)
	_validate_recommended_targets_present(steps)
	_validate_cooling_heatmap_step(steps)
	_validate_final_completion_step(steps)
	_validate_tutorial_state_flags()
	await _validate_tutorial_overlay_layout(steps)
	await _validate_palette_targets_resolve()
	await _validate_game_scene_build_targets_resolve()
	_report()


func _load_tutorial_steps() -> Array:
	if not FileAccess.file_exists(TUTORIAL_PATH):
		_failures.append("Missing tutorial data: %s" % TUTORIAL_PATH)
		return []

	var file := FileAccess.open(TUTORIAL_PATH, FileAccess.READ)
	if file == null:
		_failures.append("Unable to open tutorial data: %s" % TUTORIAL_PATH)
		return []

	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_ARRAY:
		_failures.append("tutorial_first_loop.json must parse as a JSON array")
		return []

	return parsed


func _validate_step_shape(steps: Array) -> void:
	for index in range(steps.size()):
		var step_variant = steps[index]
		if typeof(step_variant) != TYPE_DICTIONARY:
			_failures.append("Tutorial step %d is not a Dictionary" % index)
			continue

		var step: Dictionary = step_variant
		for key in REQUIRED_STEP_KEYS:
			if not step.has(key):
				_failures.append("Tutorial step %d missing required key: %s" % [index, key])
				continue
			if str(step.get(key, "")).strip_edges().is_empty():
				_failures.append("Tutorial step %d has empty required key: %s" % [index, key])


func _validate_recommended_targets_present(steps: Array) -> void:
	var targets_seen := {}
	for step_variant in steps:
		if typeof(step_variant) != TYPE_DICTIONARY:
			continue
		var step: Dictionary = step_variant
		targets_seen[str(step.get("target", ""))] = true

	for target_id in NEW_BUILD_TARGETS:
		if not targets_seen.has(target_id):
			_failures.append("Tutorial does not use new target: %s" % target_id)


func _validate_cooling_heatmap_step(steps: Array) -> void:
	var step := _find_step(steps, "cooling_heatmap")
	if step.is_empty():
		_failures.append("Tutorial is missing cooling_heatmap step")
		return

	if str(step.get("target", "")) != "build_menu.cooling_overlay_button":
		_failures.append("Cooling heatmap step must highlight the clickable cooling overlay button")

	if str(step.get("required_event", "")) != "heatmap_enabled":
		_failures.append("Cooling heatmap step must be completed by enabling a heatmap")

	var params: Dictionary = step.get("required_params", {})
	if str(params.get("heatmap_id", "")) != "cooling":
		_failures.append("Cooling heatmap step must require the cooling heatmap")

	if step.has("allow_alternative_event"):
		_failures.append("Cooling heatmap step must not be skippable by starting a cooling building")


func _find_step(steps: Array, step_id: String) -> Dictionary:
	for step_variant in steps:
		if typeof(step_variant) != TYPE_DICTIONARY:
			continue
		var step: Dictionary = step_variant
		if str(step.get("id", "")) == step_id:
			return step
	return {}


func _validate_final_completion_step(steps: Array) -> void:
	var final_step_variant = steps[steps.size() - 1]
	if typeof(final_step_variant) != TYPE_DICTIONARY:
		_failures.append("Final tutorial step is not a Dictionary")
		return

	var final_step: Dictionary = final_step_variant
	if not bool(final_step.get("complete_tutorial", false)):
		_failures.append("Final tutorial step must set complete_tutorial: true")

	var final_text := "%s %s" % [str(final_step.get("title", "")), str(final_step.get("body", ""))]
	if not final_text.contains("Fin du tutoriel") or not final_text.contains("bats les USA"):
		_failures.append("Final tutorial step must clearly announce autonomy and the USA objective")


func _validate_tutorial_state_flags() -> void:
	_delete_test_config()

	var config := ConfigFile.new()
	config.set_value("tutorial", "tutorial_first_loop_completed", true)
	config.set_value("tutorial", "tutorial_first_loop_skipped", true)
	config.set_value("sound", "master_volume", 42.0)
	var error := config.save(TEST_CONFIG_PATH)
	if error != OK:
		_failures.append("Unable to save tutorial state test config: %s" % error_string(error))
		return

	if TUTORIAL_MANAGER.has_saved_completion_state(TEST_CONFIG_PATH):
		_failures.append("Legacy tutorial flags must not block the v2 tutorial")

	config.set_value("tutorial", "tutorial_first_loop_v2_skipped", true)
	error = config.save(TEST_CONFIG_PATH)
	if error != OK:
		_failures.append("Unable to save active tutorial state test config: %s" % error_string(error))
		_delete_test_config()
		return

	if not TUTORIAL_MANAGER.has_saved_completion_state(TEST_CONFIG_PATH):
		_failures.append("Active v2 tutorial flags must block tutorial startup")

	error = TUTORIAL_MANAGER.reset_saved_state_flags(TEST_CONFIG_PATH)
	if error != OK:
		_failures.append("Unable to reset tutorial state test config: %s" % error_string(error))
		_delete_test_config()
		return

	var loaded := ConfigFile.new()
	error = loaded.load(TEST_CONFIG_PATH)
	if error != OK:
		_failures.append("Unable to reload tutorial state test config: %s" % error_string(error))
		_delete_test_config()
		return

	for key in TUTORIAL_MANAGER.get_reset_state_keys():
		if loaded.has_section_key("tutorial", key):
			_failures.append("Tutorial reset left state key in config: %s" % key)

	if float(loaded.get_value("sound", "master_volume", -1.0)) != 42.0:
		_failures.append("Tutorial reset must preserve unrelated settings sections")

	_delete_test_config()


func _delete_test_config() -> void:
	var user_dir := DirAccess.open("user://")
	if user_dir != null and user_dir.file_exists(TEST_CONFIG_FILE):
		user_dir.remove(TEST_CONFIG_FILE)


func _validate_tutorial_overlay_layout(steps: Array) -> void:
	var first_step_variant = steps[0]
	if typeof(first_step_variant) != TYPE_DICTIONARY:
		return

	var first_step: Dictionary = first_step_variant
	await _validate_tutorial_overlay_layout_case(
		first_step,
		"top-bar target",
		Rect2(Vector2(322.0, 18.0), Vector2(410.0, 96.0)),
		false
	)
	await _validate_tutorial_overlay_layout_case(
		first_step,
		"lower-screen target",
		Rect2(Vector2(580.0, 740.0), Vector2(96.0, 96.0)),
		true
	)


func _validate_tutorial_overlay_layout_case(step: Dictionary, case_name: String, target_rect: Rect2, should_flip_top: bool) -> void:
	var host := Control.new()
	host.name = "TutorialOverlayLayoutHost"
	host.size = TUTORIAL_LAYOUT_TEST_SIZE
	root.add_child(host)

	var overlay := TUTORIAL_OVERLAY_SCENE.instantiate() as Control
	if overlay == null:
		_failures.append("Unable to instantiate tutorial overlay for layout smoke test")
		root.remove_child(host)
		host.free()
		await process_frame
		return

	host.add_child(overlay)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.offset_left = 0.0
	overlay.offset_top = 0.0
	overlay.offset_right = 0.0
	overlay.offset_bottom = 0.0
	await process_frame

	overlay.call("show_step", step, 1, 12, target_rect)
	for _index in range(4):
		await process_frame

	var text_panel := overlay.get_node_or_null("TextPanel") as Control
	if text_panel == null:
		_failures.append("Tutorial overlay layout test has no TextPanel: %s" % case_name)
	else:
		_validate_tutorial_text_panel_rect(case_name, text_panel.get_global_rect(), should_flip_top)

	root.remove_child(host)
	host.free()
	await process_frame


func _validate_tutorial_text_panel_rect(case_name: String, panel_rect: Rect2, should_flip_top: bool) -> void:
	if panel_rect.size.x <= 0.0 or panel_rect.size.y <= 0.0:
		_failures.append("Tutorial TextPanel has non-positive bounds in layout case: %s" % case_name)
		return

	if panel_rect.size.x > 440.5:
		_failures.append("Tutorial TextPanel is wider than the desktop cap in layout case %s: %.1f" % [case_name, panel_rect.size.x])

	if panel_rect.size.y > 360.5:
		_failures.append("Tutorial TextPanel is taller than the viewport-safe cap in layout case %s: %.1f" % [case_name, panel_rect.size.y])

	var viewport_rect := Rect2(Vector2.ZERO, TUTORIAL_LAYOUT_TEST_SIZE).grow(0.5)
	if not _rect_contains(viewport_rect, panel_rect):
		_failures.append("Tutorial TextPanel exceeds viewport in layout case %s: %s" % [case_name, str(panel_rect)])

	if should_flip_top and panel_rect.position.y > 20.0:
		_failures.append("Tutorial TextPanel must flip to the top for lower-screen targets in layout case %s: y=%.1f" % [case_name, panel_rect.position.y])


func _validate_palette_targets_resolve() -> void:
	var loader = DATA_LOADER.new()
	var data: Dictionary = loader.load_game_data()
	var buildings: Dictionary = data.get("buildings", {})
	if buildings.is_empty():
		_failures.append("Unable to load building data for palette target smoke test")
		return

	var palette := BUILD_PALETTE_SCENE.instantiate() as Control
	if palette == null:
		_failures.append("Unable to instantiate build palette scene")
		return

	palette.custom_minimum_size = Vector2(348.0, 720.0)
	palette.size = Vector2(348.0, 720.0)
	root.add_child(palette)
	await process_frame
	palette.call("set_build_context", buildings, {})
	await process_frame
	await process_frame
	_validate_build_palette_layout(palette, buildings)
	var emitted_heatmaps: Array[String] = []
	if palette.has_signal("heatmap_mode_requested"):
		palette.connect("heatmap_mode_requested", func(mode: String) -> void:
			emitted_heatmaps.append(mode)
		)

	for target_id in NEW_BUILD_TARGETS:
		var target = palette.call("get_tutorial_target_node", target_id)
		if not (target is Control) or not is_instance_valid(target):
			_failures.append("Palette target did not resolve to a valid Control: %s" % target_id)
			continue
		if target_id == "build_menu.cooling_overlay_button":
			_validate_cooling_overlay_target(target, emitted_heatmaps)
		else:
			_validate_build_button_target(target, target_id)

	root.remove_child(palette)
	palette.free()
	await process_frame


func _validate_game_scene_build_targets_resolve() -> void:
	var game_scene := GAME_SCENE.instantiate() as Control
	if game_scene == null:
		_failures.append("Unable to instantiate game scene for tutorial target smoke test")
		return

	root.add_child(game_scene)
	for _index in range(8):
		await process_frame

	var palette := game_scene.get_node_or_null(GAME_BUILD_PALETTE_PATH) as Control
	if palette == null:
		_failures.append("Game scene build palette target provider is missing")
		root.remove_child(game_scene)
		game_scene.free()
		await process_frame
		return

	var manager := game_scene.get_node_or_null("TutorialManager")
	for target_id in NEW_BUILD_TARGETS:
		var target = manager.call("_resolve_target", target_id) if manager != null else palette.call("get_tutorial_target_node", target_id)
		await process_frame
		if target is Control and is_instance_valid(target):
			target = manager.call("_resolve_target", target_id) if manager != null else palette.call("get_tutorial_target_node", target_id)
			await process_frame
		_validate_game_scene_build_target(target_id, palette, target)

	root.remove_child(game_scene)
	game_scene.free()
	await process_frame


func _validate_game_scene_build_target(target_id: String, palette: Control, target: Variant) -> void:
	if not (target is Control) or not is_instance_valid(target):
		_failures.append("Game scene build tutorial target did not resolve: %s" % target_id)
		return

	var control := target as Control
	if not control.is_visible_in_tree():
		_failures.append("Game scene build tutorial target is not visible in tree: %s" % target_id)
		return

	var target_rect := control.get_global_rect()
	if target_rect.size.x <= 0.0 or target_rect.size.y <= 0.0:
		_failures.append("Game scene build tutorial target has non-positive bounds: %s" % target_id)
		return

	var palette_rect := palette.get_global_rect().grow(1.0)
	if not _rect_contains(palette_rect, target_rect):
		_failures.append("Game scene build tutorial target is outside build palette bounds after reveal: %s" % target_id)

	_validate_expected_build_target_identity(control, target_id, "Game scene")

	var scroll := palette.get_node_or_null(CATEGORIES_SCROLL_PATH) as ScrollContainer
	if scroll != null and scroll.is_ancestor_of(control):
		var scroll_rect := scroll.get_global_rect().grow(1.0)
		if not _rect_contains(scroll_rect, target_rect):
			_failures.append("Game scene build tutorial target is outside scroll viewport after reveal: %s" % target_id)


func _validate_build_palette_layout(palette: Control, buildings: Dictionary) -> void:
	var expected_counts := _building_counts_by_category(buildings)

	for category_id in BUILD_CATEGORY_PATHS.keys():
		var category := palette.get_node_or_null(BUILD_CATEGORY_PATHS[category_id]) as Control
		if category == null:
			_failures.append("Build palette category missing: %s" % category_id)
			continue

		_validate_category_slot_layout(category_id, category, int(expected_counts.get(category_id, 0)))


func _building_counts_by_category(buildings: Dictionary) -> Dictionary:
	var counts := {}
	for building_id in buildings.keys():
		var definition: Dictionary = buildings[building_id]
		var category := str(definition.get("category", "grid"))
		if category == "storage":
			category = "grid"
		if not BUILD_CATEGORY_PATHS.has(category):
			category = "grid"
		counts[category] = int(counts.get(category, 0)) + 1
	return counts


func _validate_category_slot_layout(category_id: String, category: Control, expected_count: int) -> void:
	var slots_grid := category.get_node_or_null(SLOTS_GRID_PATH) as GridContainer
	if slots_grid == null:
		_failures.append("Build category has no slots grid: %s" % category_id)
		return

	var visible_buttons: Array[Control] = []
	for child in slots_grid.get_children():
		var button := child as BaseButton
		if button != null and button.visible:
			visible_buttons.append(button)

	if visible_buttons.size() != expected_count:
		_failures.append("Build category %s visible slot count mismatch: expected %d, got %d" % [category_id, expected_count, visible_buttons.size()])

	if category_id == "energy" and visible_buttons.size() != 6:
		_failures.append("Energy build category must show 6 creation buttons with current data, got %d" % visible_buttons.size())

	if category.size.x <= 0.0 or category.size.y <= 0.0:
		_failures.append("Build category has non-positive size: %s" % category_id)
		return

	var category_rect := category.get_global_rect().grow(0.5)
	for index in range(visible_buttons.size()):
		var button := visible_buttons[index]
		var button_rect := button.get_global_rect()
		if button_rect.size.x <= 0.0 or button_rect.size.y <= 0.0:
			_failures.append("Build category %s slot %d has non-positive size" % [category_id, index])
			continue

		if not _rect_contains(category_rect, button_rect):
			_failures.append("Build category %s slot %d exceeds category bounds" % [category_id, index])

		for other_index in range(index + 1, visible_buttons.size()):
			var other_rect := visible_buttons[other_index].get_global_rect()
			if _rects_overlap(button_rect, other_rect):
				_failures.append("Build category %s slots %d and %d overlap" % [category_id, index, other_index])


func _rect_contains(outer: Rect2, inner: Rect2) -> bool:
	return (
		inner.position.x >= outer.position.x
		and inner.position.y >= outer.position.y
		and inner.end.x <= outer.end.x
		and inner.end.y <= outer.end.y
	)


func _rects_overlap(a: Rect2, b: Rect2) -> bool:
	var epsilon := 0.5
	return (
		a.position.x < b.end.x - epsilon
		and a.end.x > b.position.x + epsilon
		and a.position.y < b.end.y - epsilon
		and a.end.y > b.position.y + epsilon
	)


func _validate_cooling_overlay_target(target: Variant, emitted_heatmaps: Array[String]) -> void:
	if not (target is BaseButton):
		_failures.append("Cooling overlay tutorial target must resolve to a clickable BaseButton")
		return

	var button := target as BaseButton
	if button.disabled:
		_failures.append("Cooling overlay tutorial target must be enabled")
	if not button.is_visible_in_tree():
		_failures.append("Cooling overlay tutorial target must be visible")

	button.emit_signal("pressed")
	if not emitted_heatmaps.has("cooling"):
		_failures.append("Clicking the cooling overlay tutorial target must request the cooling heatmap")


func _validate_build_button_target(target: Variant, target_id: String) -> void:
	if not (target is BaseButton):
		_failures.append("Build tutorial target must resolve to a clickable BaseButton: %s" % target_id)
		return

	var button := target as BaseButton
	if button.disabled:
		_failures.append("Build tutorial target must be enabled: %s" % target_id)
	if not button.is_visible_in_tree():
		_failures.append("Build tutorial target must be visible: %s" % target_id)
	if button.size.x <= 0.0 or button.size.y <= 0.0:
		_failures.append("Build tutorial target must have a non-zero size: %s" % target_id)
	_validate_expected_build_target_identity(button, target_id, "Build palette")


func _validate_expected_build_target_identity(control: Control, target_id: String, context: String) -> void:
	if EXPECTED_BUILD_TARGET_IDS.has(target_id):
		var expected_building_id := str(EXPECTED_BUILD_TARGET_IDS[target_id])
		var actual_building_id := str(control.get_meta("tutorial_building_id", ""))
		if actual_building_id != expected_building_id:
			_failures.append("%s target %s resolved to %s instead of %s" % [context, target_id, actual_building_id, expected_building_id])

	if target_id == "build_menu.cooling_overlay_button" and not str(control.get_path()).ends_with(COOLING_OVERLAY_PATH_SUFFIX):
		_failures.append("%s cooling overlay target resolved to unexpected path: %s" % [context, str(control.get_path())])


func _report() -> void:
	if _failures.is_empty():
		print("E-Grid tutorial smoke test passed.")
		quit(0)
		return

	for failure in _failures:
		push_error(failure)
	quit(1)
