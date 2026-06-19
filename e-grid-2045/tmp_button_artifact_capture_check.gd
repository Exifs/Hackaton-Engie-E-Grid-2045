extends SceneTree

const GAME_SCENE := "res://scenes/game/game_scene.tscn"
const CAPTURE_PATH := "C:/Users/cleme/AppData/Local/Temp/codex_game_capture_button_artifacts_fixed.png"

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
	_check_button(game, ^"SafeArea/Root/AlertBar/ContentMargin/AlertRow/CollapseButton", "V")

	var viewport_texture := root.get_texture()
	var image := viewport_texture.get_image() if viewport_texture != null else null
	if image == null:
		_failures.append("Unable to read viewport image")
	else:
		var error := image.save_png(CAPTURE_PATH)
		if error != OK:
			_failures.append("Unable to save capture: %s" % error)

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


func _wait_frames(count: int) -> void:
	for _index in range(count):
		await process_frame
