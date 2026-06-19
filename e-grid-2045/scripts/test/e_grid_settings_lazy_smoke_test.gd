extends SceneTree

const DATA_LOADER := preload("res://scripts/simulation/DataLoader.gd")
const E_GRID_MAP_ASSETS := preload("res://scripts/ui/game/e_grid_map_assets.gd")
const E_GRID_MENU_BUTTON := preload("res://scripts/ui/e_grid_menu_button.gd")
const E_GRID_RUNTIME_TEXTURE_LOADER := preload("res://scripts/ui/components/e_grid_runtime_texture_loader.gd")
const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")

const MAIN_MENU_SCENE := "res://scenes/main_menu.tscn"
const MAX_SETTINGS_OPEN_USEC := 50000


func _init() -> void:
	var packed_menu := load(MAIN_MENU_SCENE) as PackedScene
	if packed_menu == null:
		_fail("Cannot load main menu scene.")
		return

	var menu := packed_menu.instantiate() as Control
	if menu == null:
		_fail("Cannot instantiate main menu.")
		return

	root.add_child(menu)
	current_scene = menu

	var settings_menu := await _wait_for_settings_menu(menu)
	if settings_menu == null:
		_fail("Settings menu was not prewarmed.")
		return

	var keyboard_rows := _get_keyboard_rows(settings_menu)
	if keyboard_rows == null:
		_fail("Cannot find keybinding rows container.")
		return

	if keyboard_rows.get_child_count() != 0:
		_fail("Keybinding rows should not be built before the keyboard tab is selected.")
		return

	var open_started := Time.get_ticks_usec()
	menu.call("_open_settings_menu")
	await process_frame
	var open_usec := Time.get_ticks_usec() - open_started

	if open_usec > MAX_SETTINGS_OPEN_USEC:
		_fail("Prewarmed settings menu opened too slowly: %d usec." % open_usec)
		return

	if not settings_menu.visible:
		_fail("Settings menu did not become visible.")
		return

	if keyboard_rows.get_child_count() != 0:
		_fail("Opening settings should not build keybinding rows until the keyboard tab is selected.")
		return

	settings_menu.call("_set_current_tab", 2, false)
	await process_frame

	if keyboard_rows.get_child_count() <= 0:
		_fail("Keyboard tab did not lazily build keybinding rows.")
		return

	print("E-Grid settings lazy smoke test passed. open_usec=%d keyboard_rows=%d" % [
		open_usec,
		keyboard_rows.get_child_count(),
	])
	await _finish(0)


func _wait_for_settings_menu(menu: Control) -> Control:
	for _index in range(120):
		var settings_menu := menu.get_node_or_null("MenuArtboardAspect/MenuArtboard/SettingsMenu") as Control
		if settings_menu != null:
			return settings_menu
		await process_frame
	return null


func _get_keyboard_rows(settings_menu: Control) -> VBoxContainer:
	var keyboard_panel := settings_menu.get_node_or_null("Panel/Margin/VBox/Content/Clavier") as Control
	if keyboard_panel == null:
		return null
	return keyboard_panel.get_node_or_null("BindingsScroll/Rows") as VBoxContainer


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
