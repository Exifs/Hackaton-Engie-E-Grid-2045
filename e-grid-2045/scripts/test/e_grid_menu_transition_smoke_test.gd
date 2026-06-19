extends SceneTree

const MAIN_MENU_SCENE := "res://scenes/main_menu.tscn"


func _init() -> void:
	var packed_menu := load(MAIN_MENU_SCENE) as PackedScene
	if packed_menu == null:
		_fail("Cannot load main menu scene.")
		return

	var menu := packed_menu.instantiate()
	if menu == null:
		_fail("Cannot instantiate main menu scene.")
		return

	root.add_child(menu)
	current_scene = menu
	await process_frame

	var play_button := menu.get_node_or_null("MenuArtboardAspect/MenuArtboard/MenuButtons/PlayButton") as Button
	if play_button == null:
		_fail("Cannot find PlayButton.")
		return

	play_button.pressed.emit()

	for _index in range(180):
		await process_frame
		if current_scene != null and current_scene.name == "GameScene":
			print("E-Grid menu transition smoke test passed.")
			quit(0)
			return

	_fail("PlayButton did not transition to GameScene.")


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
