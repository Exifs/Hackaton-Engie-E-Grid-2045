extends SceneTree

const DATA_LOADER := preload("res://scripts/simulation/DataLoader.gd")
const BUILD_PALETTE_SCENE := preload("res://scenes/ui/game/e_grid_build_palette.tscn")
const TUTORIAL_MANAGER := preload("res://scripts/tutorial/TutorialManager.gd")
const TUTORIAL_PATH := "res://data/tutorial_first_loop.json"
const TEST_CONFIG_PATH := "user://tutorial_state_reset_test.cfg"
const TEST_CONFIG_FILE := "tutorial_state_reset_test.cfg"
const REQUIRED_STEP_KEYS := ["id", "title", "body", "objective", "required_event"]
const NEW_BUILD_TARGETS := [
	"build_menu.cooling_overlay_button",
	"build_menu.university_button",
	"build_menu.wind_onshore_button",
	"build_menu.river_cooling_button",
	"build_menu.datacenter_button",
	"build_menu.ai_research_center_button",
]

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
	await _validate_palette_targets_resolve()
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


func _validate_palette_targets_resolve() -> void:
	var loader = DATA_LOADER.new()
	var data: Dictionary = loader.load_game_data()
	var buildings: Dictionary = data.get("buildings", {})
	if buildings.is_empty():
		_failures.append("Unable to load building data for palette target smoke test")
		return

	var palette := BUILD_PALETTE_SCENE.instantiate()
	if palette == null:
		_failures.append("Unable to instantiate build palette scene")
		return

	root.add_child(palette)
	await process_frame
	palette.call("set_build_context", buildings, {})
	await process_frame
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


func _report() -> void:
	if _failures.is_empty():
		print("E-Grid tutorial smoke test passed.")
		quit(0)
		return

	for failure in _failures:
		push_error(failure)
	quit(1)
