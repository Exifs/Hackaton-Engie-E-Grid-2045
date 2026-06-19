extends SceneTree

const DATA_LOADER := preload("res://scripts/simulation/DataLoader.gd")
const BUILD_PALETTE_SCENE := preload("res://scenes/ui/game/e_grid_build_palette.tscn")
const TUTORIAL_PATH := "res://data/tutorial_first_loop.json"
const REQUIRED_STEP_KEYS := ["id", "title", "body", "objective", "required_event"]
const NEW_BUILD_TARGETS := [
	"build_menu.wind_onshore_button",
	"build_menu.river_cooling_button",
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
	_validate_final_completion_step(steps)
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

	for target_id in NEW_BUILD_TARGETS:
		var target = palette.call("get_tutorial_target_node", target_id)
		if not (target is Control) or not is_instance_valid(target):
			_failures.append("Palette target did not resolve to a valid Control: %s" % target_id)

	root.remove_child(palette)
	palette.free()
	await process_frame


func _report() -> void:
	if _failures.is_empty():
		print("E-Grid tutorial smoke test passed.")
		quit(0)
		return

	for failure in _failures:
		push_error(failure)
	quit(1)
