extends SceneTree

const GAME_SCENE := "res://scenes/game/game_scene.tscn"
const CAPTURE_PATH := "C:/Users/cleme/AppData/Local/Temp/codex_game_capture_panel_controls_refined.png"

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

	var region_panel := game.get_node_or_null("SafeArea/Root/MainRow/RegionPanel") as Control
	if region_panel == null:
		_failures.append("Missing region panel")
	else:
		_check_region_button(region_panel)

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


func _check_region_button(region_panel: Control) -> void:
	var close_button := region_panel.get_node_or_null("ContentMargin/PanelStack/HeaderRow/CloseButton") as BaseButton
	if close_button == null:
		_failures.append("Missing region panel close button")
		return

	if str(close_button.get("label_text")) != "X":
		_failures.append("Region panel close button should show X while expanded")

	var root_rect := region_panel.get_global_rect()
	var button_rect := close_button.get_global_rect()
	if button_rect.position.y < root_rect.position.y + 12.0:
		_failures.append("Region panel close button is too close to the top edge")
	if button_rect.end.x > root_rect.end.x - 8.0:
		_failures.append("Region panel close button is too close to the right edge")


func _wait_frames(count: int) -> void:
	for _index in range(count):
		await process_frame
