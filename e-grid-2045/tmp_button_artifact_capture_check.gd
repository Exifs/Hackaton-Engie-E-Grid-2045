extends SceneTree

const GAME_SCENE := "res://scenes/game/game_scene.tscn"
const CAPTURE_PATH := "C:/Users/cleme/AppData/Local/Temp/codex_game_capture_button_artifacts_fixed.png"
const COLLAPSED_CAPTURE_PATH := "C:/Users/cleme/AppData/Local/Temp/codex_game_capture_bottom_collapsed.png"
const CHEVRON_BUTTON_SCRIPT := "res://scripts/ui/components/e_grid_chevron_button.gd"
const CTA_BUTTON_SCRIPT := "res://scripts/ui/components/e_grid_cta_button.gd"

var _failures: Array[String] = []


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	root.size = Vector2i(1600, 900)

	var packed := load(GAME_SCENE) as PackedScene
	var game := packed.instantiate() as Control if packed != null else null
	if game == null:
		push_error("Unable to instantiate game scene")
		quit(1)
		return

	root.add_child(game)
	await _wait_frames(20)

	_check_button(game, ^"SafeArea/Root/MainRow/RegionPanel/ContentMargin/PanelStack/HeaderRow/CloseButton", "X")
	_check_button(game, ^"SafeArea/Root/AlertBar/ContentMargin/AlertRow/AlertItems/PowerCongestionAlert/ContentMargin/ContentRow/ActionButton", "VIEW")
	_check_button(game, ^"SafeArea/Root/AlertBar/ContentMargin/AlertRow/AlertItems/ResearchCompleteAlert/ContentMargin/ContentRow/ActionButton", "CLAIM")
	_check_chevron_button(game, ^"SafeArea/Root/AlertBar/ContentMargin/AlertRow/CollapseButton", "V", "down")
	_check_cta_button(game, ^"SafeArea/Root/MainRow/RegionPanel/ContentMargin/PanelStack/FooterRow/ManageRegionButton", "MANAGE REGION")

	_save_capture(CAPTURE_PATH)
	await _check_collapsed_button_position(game, ^"SafeArea/Root/AlertBar/ContentMargin/AlertRow/CollapseButton")
	_save_capture(COLLAPSED_CAPTURE_PATH)

	for failure in _failures:
		push_error(failure)

	quit(1 if not _failures.is_empty() else 0)


func _check_button(root_node: Node, path: NodePath, expected_label: String) -> void:
	var button := root_node.get_node_or_null(path) as BaseButton
	if button == null:
		_failures.append("Missing button %s" % path)
		return

	if str(button.get("component_name")) != "mini_button_states":
		_failures.append("%s should keep the compact mini_button_states frame" % path)
	if str(button.get("label_text")) != expected_label:
		_failures.append("%s expected label '%s', got '%s'" % [path, expected_label, str(button.get("label_text"))])


func _check_chevron_button(root_node: Node, path: NodePath, expected_label: String, expected_direction: String) -> void:
	var button := root_node.get_node_or_null(path) as BaseButton
	if button == null:
		_failures.append("Missing chevron button %s" % path)
		return

	var script := button.get_script() as Script
	if script == null or script.resource_path != CHEVRON_BUTTON_SCRIPT:
		_failures.append("%s should use the dedicated chevron button frame" % path)
	if str(button.get("label_text")) != expected_label:
		_failures.append("%s expected label '%s', got '%s'" % [path, expected_label, str(button.get("label_text"))])
	if str(button.get("direction")) != expected_direction:
		_failures.append("%s expected direction '%s', got '%s'" % [path, expected_direction, str(button.get("direction"))])


func _check_cta_button(root_node: Node, path: NodePath, expected_label: String) -> void:
	var button := root_node.get_node_or_null(path) as BaseButton
	if button == null:
		_failures.append("Missing CTA button %s" % path)
		return

	var script := button.get_script() as Script
	if script == null or script.resource_path != CTA_BUTTON_SCRIPT:
		_failures.append("%s should use the dedicated CTA button frame" % path)
	if str(button.get("label_text")) != expected_label:
		_failures.append("%s expected label '%s', got '%s'" % [path, expected_label, str(button.get("label_text"))])


func _check_collapsed_button_position(root_node: Node, path: NodePath) -> void:
	var button := root_node.get_node_or_null(path) as BaseButton
	if button == null:
		_failures.append("Missing collapse button %s" % path)
		return

	var expanded_x := button.global_position.x
	button.pressed.emit()
	await _wait_frames(6)
	var collapsed_x := button.global_position.x

	if absf(collapsed_x - expanded_x) > 1.0:
		_failures.append("%s moved from x=%.1f to x=%.1f when collapsed" % [path, expanded_x, collapsed_x])
	if str(button.get("label_text")) != "^":
		_failures.append("%s expected collapsed label '^', got '%s'" % [path, str(button.get("label_text"))])
	if str(button.get("direction")) != "up":
		_failures.append("%s expected collapsed direction 'up', got '%s'" % [path, str(button.get("direction"))])


func _save_capture(path: String) -> void:
	var viewport_texture := root.get_texture()
	var image := viewport_texture.get_image() if viewport_texture != null else null
	if image == null:
		_failures.append("Unable to read viewport image")
		return

	var error := image.save_png(path)
	if error != OK:
		_failures.append("Unable to save capture %s: %s" % [path, error])


func _wait_frames(count: int) -> void:
	for _index in range(count):
		await process_frame
