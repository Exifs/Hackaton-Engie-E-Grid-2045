extends SceneTree

const DATA_LOADER := preload("res://scripts/simulation/DataLoader.gd")
const E_GRID_MAP_ASSETS := preload("res://scripts/ui/game/e_grid_map_assets.gd")
const E_GRID_MENU_BUTTON := preload("res://scripts/ui/e_grid_menu_button.gd")
const E_GRID_RUNTIME_TEXTURE_LOADER := preload("res://scripts/ui/components/e_grid_runtime_texture_loader.gd")
const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")

const MAIN_MENU_SCENE := "res://scenes/main_menu.tscn"
const MAX_PREWARMED_MENU_TO_GAME_USEC := 500000
const MAX_PREWARM_WAIT_FRAMES := 360


func _init() -> void:
	var packed_menu := load(MAIN_MENU_SCENE) as PackedScene
	if packed_menu == null:
		_fail("Cannot load main menu scene.")
		return

	var menu := packed_menu.instantiate() as Control
	if menu == null:
		_fail("Cannot instantiate main menu scene.")
		return

	root.add_child(menu)
	current_scene = menu

	if not menu.has_method("is_game_scene_prewarmed"):
		_fail("MainMenu must expose game scene prewarm completion for performance tests.")
		return

	if not await _wait_for_game_scene_prewarm(menu):
		_fail("Game scene prewarm did not finish.")
		return

	var play_button := menu.get_node_or_null("MenuArtboardAspect/MenuArtboard/MenuButtons/PlayButton") as Button
	if play_button == null:
		_fail("Cannot find PlayButton.")
		return

	var transition_started := Time.get_ticks_usec()
	play_button.pressed.emit()

	for _index in range(180):
		await process_frame
		if current_scene != null and current_scene.name == "GameScene":
			var transition_usec := Time.get_ticks_usec() - transition_started
			if transition_usec > MAX_PREWARMED_MENU_TO_GAME_USEC:
				_fail("Prewarmed menu to game transition is too slow: %d usec." % transition_usec)
				return
			print("E-Grid prewarmed menu transition performance test passed. transition_usec=%d" % transition_usec)
			await _finish(0)
			return

	_fail("Prewarmed PlayButton did not transition to GameScene.")


func _wait_for_game_scene_prewarm(menu: Control) -> bool:
	for _index in range(MAX_PREWARM_WAIT_FRAMES):
		if bool(menu.call("is_game_scene_prewarmed")):
			return true
		await process_frame
	return false


func _fail(message: String) -> void:
	push_error(message)
	quit(1)


func _finish(exit_code: int) -> void:
	if current_scene != null and is_instance_valid(current_scene):
		current_scene.queue_free()
		current_scene = null
		await process_frame
		await process_frame

	E_GRID_MAP_ASSETS.clear_cache_for_tests()
	DATA_LOADER.clear_cache_for_tests()
	E_GRID_RUNTIME_TEXTURE_LOADER.clear_cache_for_tests()
	E_GRID_UI_ATLAS.clear_cache_for_tests()
	E_GRID_MENU_BUTTON.clear_cache_for_tests()
	await process_frame
	quit(exit_code)
