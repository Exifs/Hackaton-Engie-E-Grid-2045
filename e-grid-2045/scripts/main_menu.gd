extends Control

const INPUT_ACTIONS := preload("res://scripts/input/e_grid_input_actions.gd")
const E_GRID_SETTINGS_RUNTIME := preload("res://scripts/ui/settings/e_grid_settings_runtime.gd")
const E_GRID_SCENE_TRANSITION := preload("res://scripts/ui/e_grid_scene_transition.gd")
const DATA_LOADER := preload("res://scripts/simulation/DataLoader.gd")
const E_GRID_MAP_ASSETS := preload("res://scripts/ui/game/e_grid_map_assets.gd")
const GAME_SCENE_PATH := "res://scenes/game/game_scene.tscn"
const DEFAULT_SETTINGS_MENU_SCENE := "res://scenes/ui/settings/settings_menu.tscn"
const GAME_MAP_BACKDROP_PATH := "res://assets/map/europe_map_backdrop_generated_clean_v1.png"
const GAME_MAP_CONTOURS_PATH := "res://assets/map/generated/regions_contours.json"
const GAME_MAP_MASK_PATH := "res://assets/map/generated/region_id_mask.png"

@export_node_path("Control") var button_container_path: NodePath = ^"MenuArtboardAspect/MenuArtboard/MenuButtons"
@export_node_path("Control") var version_label_path: NodePath = ^"MenuArtboardAspect/MenuArtboard/VersionLabel"
@export_node_path("Node") var input_controller_path: NodePath = ^"InputController"
@export_node_path("Control") var settings_menu_path: NodePath = ^"MenuArtboardAspect/MenuArtboard/SettingsMenu"
@export_node_path("Control") var settings_menu_parent_path: NodePath = ^"MenuArtboardAspect/MenuArtboard"
@export_file("*.tscn") var settings_menu_scene_path := DEFAULT_SETTINGS_MENU_SCENE

var _button_layer: Control
var _version_label: Control
var _input_controller: Node
var _settings_menu: Control
var _buttons: Array[Button] = []
var _menu_actions := {}
var _is_changing_scene := false
var _settings_menu_prewarm_started := false
var _game_runtime_prewarm_started := false
var _game_runtime_prewarmed := false
var _game_scene_prewarm_started := false
var _game_scene_prewarmed := false
var _prewarmed_game_scene: Node


func _ready() -> void:
	E_GRID_SETTINGS_RUNTIME.apply_saved_settings()
	_menu_actions = INPUT_ACTIONS.get_menu_navigation_actions()
	_button_layer = get_node_or_null(button_container_path) as Control
	_version_label = get_node_or_null(version_label_path) as Control
	_settings_menu = get_node_or_null(settings_menu_path) as Control

	if _settings_menu != null:
		_setup_settings_menu()
	_collect_buttons()
	_wire_focus_navigation()
	_wire_input_controller()
	_update_version_label_text()
	call_deferred("_preload_menu_target_scenes")


func _preload_menu_target_scenes() -> void:
	await get_tree().process_frame
	if not is_inside_tree():
		return
	_request_threaded_scene_preload(GAME_SCENE_PATH)
	_request_threaded_scene_preload(settings_menu_scene_path)
	await get_tree().process_frame
	if not is_inside_tree():
		return
	await _prewarm_settings_menu()
	if not is_inside_tree():
		return
	await get_tree().process_frame
	if not is_inside_tree():
		return
	await _prewarm_game_runtime_data()
	if not is_inside_tree():
		return
	await get_tree().process_frame
	if not is_inside_tree():
		return
	await _prewarm_game_scene()


func _request_threaded_scene_preload(scene_path: String) -> void:
	var path := scene_path.strip_edges()
	if path.is_empty() or not ResourceLoader.exists(path):
		return

	var error := ResourceLoader.load_threaded_request(path, "PackedScene", true)
	if error != OK and error != ERR_BUSY:
		push_warning("MainMenu could not preload scene %s. Error code: %d." % [path, error])


func is_game_runtime_prewarmed() -> bool:
	return _game_runtime_prewarmed


func is_game_scene_prewarmed() -> bool:
	return _game_scene_prewarmed and _prewarmed_game_scene != null and is_instance_valid(_prewarmed_game_scene)


func _prewarm_settings_menu() -> void:
	if _settings_menu_prewarm_started or _settings_menu != null:
		return

	_settings_menu_prewarm_started = true
	var packed_scene := await _load_settings_menu_scene_threaded()
	_settings_menu_prewarm_started = false

	if _settings_menu != null or packed_scene == null:
		return

	_instantiate_settings_menu(packed_scene)


func _load_settings_menu_scene_threaded() -> PackedScene:
	var scene_path := settings_menu_scene_path.strip_edges()
	if scene_path.is_empty() or not ResourceLoader.exists(scene_path):
		return null

	var request_error := ResourceLoader.load_threaded_request(scene_path, "PackedScene", true)
	if request_error != OK and request_error != ERR_BUSY:
		return null

	var progress: Array = []
	while true:
		if not is_inside_tree():
			return null
		var status := ResourceLoader.load_threaded_get_status(scene_path, progress)
		match status:
			ResourceLoader.THREAD_LOAD_LOADED:
				return ResourceLoader.load_threaded_get(scene_path) as PackedScene
			ResourceLoader.THREAD_LOAD_FAILED, ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
				return null
			_:
				await get_tree().process_frame

	return null


func _prewarm_game_runtime_data() -> void:
	if _game_runtime_prewarm_started or _game_runtime_prewarmed:
		return

	_game_runtime_prewarm_started = true
	await get_tree().process_frame

	if not is_inside_tree():
		_game_runtime_prewarm_started = false
		return

	var loader := DATA_LOADER.new()
	loader.load_game_data()
	await get_tree().process_frame

	if not is_inside_tree():
		_game_runtime_prewarm_started = false
		return

	E_GRID_MAP_ASSETS.load_cached(GAME_MAP_BACKDROP_PATH, GAME_MAP_CONTOURS_PATH, GAME_MAP_MASK_PATH)
	_game_runtime_prewarmed = true
	_game_runtime_prewarm_started = false


func _prewarm_game_scene() -> void:
	if _game_scene_prewarm_started or is_game_scene_prewarmed():
		return

	_game_scene_prewarm_started = true
	var packed_scene := await _load_game_scene_threaded()
	if packed_scene == null or not is_inside_tree():
		_game_scene_prewarm_started = false
		return

	var instance := packed_scene.instantiate()
	if instance == null:
		_game_scene_prewarm_started = false
		return

	instance.process_mode = Node.PROCESS_MODE_DISABLED
	if instance is CanvasItem:
		(instance as CanvasItem).hide()

	add_child(instance)
	await get_tree().process_frame
	await get_tree().process_frame

	if not is_inside_tree() or not is_instance_valid(instance):
		_game_scene_prewarm_started = false
		return

	_prewarmed_game_scene = instance
	_game_scene_prewarmed = true
	_game_scene_prewarm_started = false


func _load_game_scene_threaded() -> PackedScene:
	if not ResourceLoader.exists(GAME_SCENE_PATH):
		return null

	var request_error := ResourceLoader.load_threaded_request(GAME_SCENE_PATH, "PackedScene", true)
	if request_error != OK and request_error != ERR_BUSY:
		return null

	var progress: Array = []
	while true:
		if not is_inside_tree():
			return null
		var status := ResourceLoader.load_threaded_get_status(GAME_SCENE_PATH, progress)
		match status:
			ResourceLoader.THREAD_LOAD_LOADED:
				return ResourceLoader.load_threaded_get(GAME_SCENE_PATH) as PackedScene
			ResourceLoader.THREAD_LOAD_FAILED, ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
				return null
			_:
				await get_tree().process_frame

	return null


func _setup_settings_menu() -> void:
	if _settings_menu == null:
		return

	_call_settings_menu_method("hide_menu", [])

	var callback := Callable(self, "_close_settings_menu")
	if _settings_menu.has_signal("close_requested") and not _settings_menu.is_connected("close_requested", callback):
		_settings_menu.connect("close_requested", callback)


func _collect_buttons() -> void:
	_buttons.clear()

	if _button_layer == null:
		push_warning("Le menu principal ne trouve pas son conteneur de boutons.")
		return

	for child in _button_layer.get_children():
		if child is Button:
			var button := child as Button
			if not button.pressed.is_connected(_on_menu_button_pressed.bind(button)):
				button.pressed.connect(_on_menu_button_pressed.bind(button))
			_buttons.append(button)


func _wire_focus_navigation() -> void:
	if _buttons.size() < 2:
		return

	for i in _buttons.size():
		var previous := _buttons[posmod(i - 1, _buttons.size())]
		var next := _buttons[(i + 1) % _buttons.size()]
		_buttons[i].focus_neighbor_top = previous.get_path()
		_buttons[i].focus_neighbor_bottom = next.get_path()


func _wire_input_controller() -> void:
	_input_controller = get_node_or_null(input_controller_path)

	if _input_controller == null:
		push_warning("Le menu principal ne trouve pas son controleur d'input.")
		return

	var callback := Callable(self, "_on_input_action_pressed")
	var back_callback := Callable(self, "_on_input_back_requested")

	if _input_controller.has_signal("action_pressed") and not _input_controller.is_connected("action_pressed", callback):
		_input_controller.connect("action_pressed", callback)

	if _input_controller.has_signal("back_requested") and not _input_controller.is_connected("back_requested", back_callback):
		_input_controller.connect("back_requested", back_callback)


func _update_version_label_text() -> void:
	if _version_label != null:
		_version_label.set("display_text", _get_menu_version_text())


func _get_menu_version_text() -> String:
	var version := str(ProjectSettings.get_setting("application/config/version", "0.0.0")).strip_edges()
	var build_number := str(ProjectSettings.get_setting("application/config/build_number", "0000")).strip_edges()

	if version.is_empty():
		version = "0.0.0"

	if build_number.is_empty():
		build_number = "0000"

	if version.begins_with("v") or version.begins_with("V"):
		version = version.substr(1)

	if build_number.begins_with("B") or build_number.begins_with("b"):
		build_number = build_number.substr(1)

	if build_number.is_valid_int():
		build_number = str(build_number.to_int()).pad_zeros(3)
	else:
		build_number = build_number.substr(0, 3).pad_zeros(3)

	return "V%s:%s" % [version.to_upper(), build_number]


func _on_input_action_pressed(action_name: String) -> void:
	if _is_settings_menu_open() or _buttons.is_empty():
		return

	if action_name == str(_menu_actions.get("up", INPUT_ACTIONS.MENU_UP)):
		_focus_relative(-1)
	elif action_name == str(_menu_actions.get("down", INPUT_ACTIONS.MENU_DOWN)):
		_focus_relative(1)
	elif action_name == str(_menu_actions.get("accept", INPUT_ACTIONS.MENU_ACCEPT)):
		_activate_or_focus_first_button()


func _on_input_back_requested() -> void:
	if _is_settings_menu_open():
		_close_settings_menu()
		return

	_request_close_game()


func _on_menu_button_pressed(button: Button) -> void:
	match str(button.get("action_name")):
		"play":
			_request_change_scene(GAME_SCENE_PATH)
		"settings":
			_open_settings_menu()
		"quit":
			get_tree().quit()
		_:
			print("%s: action non connectee pour le prototype de menu." % _get_button_label(button))


func _get_button_label(button: Button) -> String:
	if button.has_method("get_display_label"):
		return str(button.call("get_display_label"))

	return button.text


func _open_settings_menu() -> void:
	if not _ensure_settings_menu():
		push_warning("Le menu principal ne trouve pas la scene de parametres.")
		return

	_set_menu_input_enabled(false)

	if _button_layer != null:
		_button_layer.hide()

	_call_settings_menu_method("show_menu", [])


func _close_settings_menu() -> void:
	get_viewport().gui_release_focus()

	if _settings_menu != null:
		_call_settings_menu_method("hide_menu", [])

	if _button_layer != null:
		_button_layer.show()

	_set_menu_input_enabled(true)


func _request_close_game() -> void:
	get_tree().quit()


func _is_settings_menu_open() -> bool:
	return _settings_menu != null and _settings_menu.visible


func _ensure_settings_menu() -> bool:
	if _settings_menu != null and is_instance_valid(_settings_menu):
		return true

	_settings_menu = get_node_or_null(settings_menu_path) as Control
	if _settings_menu != null:
		_setup_settings_menu()
		return true

	var scene_path := settings_menu_scene_path.strip_edges()
	if scene_path.is_empty() or not ResourceLoader.exists(scene_path):
		return false

	var packed_scene := ResourceLoader.load(scene_path, "PackedScene") as PackedScene
	if packed_scene == null:
		return false

	return _instantiate_settings_menu(packed_scene)


func _instantiate_settings_menu(packed_scene: PackedScene) -> bool:
	var parent := get_node_or_null(settings_menu_parent_path) as Control
	if parent == null:
		return false

	var instance := packed_scene.instantiate() as Control
	if instance == null:
		return false

	_settings_menu = instance
	_settings_menu.name = "SettingsMenu"
	parent.add_child(_settings_menu)
	_apply_settings_menu_layout()
	_setup_settings_menu()
	return true


func _apply_settings_menu_layout() -> void:
	if _settings_menu == null:
		return

	_settings_menu.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_settings_menu.anchor_left = 0.205
	_settings_menu.anchor_top = 0.17
	_settings_menu.anchor_right = 0.795
	_settings_menu.anchor_bottom = 0.865
	_settings_menu.offset_left = 0.0
	_settings_menu.offset_top = 0.0
	_settings_menu.offset_right = 0.0
	_settings_menu.offset_bottom = 0.0


func _call_settings_menu_method(method_name: StringName, arguments: Array) -> void:
	if _settings_menu == null:
		return

	if _settings_menu.has_method(method_name):
		_settings_menu.callv(method_name, arguments)
		return

	match method_name:
		&"show_menu":
			_settings_menu.show()
		&"hide_menu":
			_settings_menu.hide()


func _set_menu_input_enabled(enabled: bool) -> void:
	if _input_controller != null:
		_input_controller.set("enabled", enabled)


func _focus_relative(delta: int) -> void:
	var current_index := _get_focused_button_index()

	if current_index < 0:
		current_index = 0 if delta > 0 else _buttons.size() - 1
	else:
		current_index = posmod(current_index + delta, _buttons.size())

	_buttons[current_index].grab_focus()


func _focus_first_button() -> void:
	if not _buttons.is_empty():
		_buttons[0].grab_focus()


func _activate_or_focus_first_button() -> void:
	var current_index := _get_focused_button_index()

	if current_index < 0:
		_focus_first_button()
		return

	_on_menu_button_pressed(_buttons[current_index])


func _get_focused_button_index() -> int:
	var viewport := get_viewport()

	if viewport == null:
		return -1

	var focus_owner := viewport.gui_get_focus_owner()

	for i in _buttons.size():
		if _buttons[i] == focus_owner:
			return i

	return -1


func _request_change_scene(scene_path: String) -> void:
	if _is_changing_scene:
		return

	_is_changing_scene = true
	call_deferred("_change_scene_async", scene_path)


func _change_scene_async(scene_path: String) -> void:
	if not ResourceLoader.exists(scene_path):
		push_error("MainMenu cannot change scene: scene not found at %s." % scene_path)
		_is_changing_scene = false
		return

	_set_menu_input_enabled(false)
	var prepared_scene := _take_prewarmed_game_scene(scene_path)
	var error := OK
	if prepared_scene != null:
		error = await E_GRID_SCENE_TRANSITION.change_scene_to_node(self, prepared_scene, "CHARGEMENT DU JEU")
	else:
		error = await E_GRID_SCENE_TRANSITION.change_scene(self, scene_path, "CHARGEMENT DU JEU")

	if error != OK:
		push_error("MainMenu failed to change scene. Error code: %d." % error)
		_is_changing_scene = false
		_set_menu_input_enabled(true)


func _take_prewarmed_game_scene(scene_path: String) -> Node:
	if scene_path != GAME_SCENE_PATH:
		return null
	if not is_game_scene_prewarmed():
		return null

	var scene := _prewarmed_game_scene
	_prewarmed_game_scene = null
	_game_scene_prewarmed = false
	return scene
