extends Control

const INPUT_ACTIONS := preload("res://scripts/input/e_grid_input_actions.gd")
const GAME_SCENE_PATH := "res://scenes/game/game_scene.tscn"

@export_node_path("Control") var button_container_path: NodePath = ^"MenuArtboardAspect/MenuArtboard/MenuButtons"
@export_node_path("Control") var version_label_path: NodePath = ^"MenuArtboardAspect/MenuArtboard/VersionLabel"
@export_node_path("Node") var input_controller_path: NodePath = ^"InputController"
@export_node_path("Control") var settings_menu_path: NodePath = ^"MenuArtboardAspect/MenuArtboard/SettingsMenu"

var _button_layer: Control
var _version_label: Control
var _input_controller: Node
var _settings_menu: Control
var _buttons: Array[Button] = []
var _menu_actions := {}
var _is_changing_scene := false


func _ready() -> void:
	_menu_actions = INPUT_ACTIONS.get_menu_navigation_actions()
	_button_layer = get_node_or_null(button_container_path) as Control
	_version_label = get_node_or_null(version_label_path) as Control
	_settings_menu = get_node_or_null(settings_menu_path) as Control

	_setup_settings_menu()
	_collect_buttons()
	_wire_focus_navigation()
	_wire_input_controller()
	_update_version_label_text()


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

	if _input_controller.has_signal("action_pressed") and not _input_controller.is_connected("action_pressed", callback):
		_input_controller.connect("action_pressed", callback)


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
	if _is_settings_menu_open():
		if action_name == str(_menu_actions.get("back", INPUT_ACTIONS.MENU_BACK)):
			_close_settings_menu()
		return

	if _buttons.is_empty():
		return

	if action_name == str(_menu_actions.get("up", INPUT_ACTIONS.MENU_UP)):
		_focus_relative(-1)
	elif action_name == str(_menu_actions.get("down", INPUT_ACTIONS.MENU_DOWN)):
		_focus_relative(1)
	elif action_name == str(_menu_actions.get("accept", INPUT_ACTIONS.MENU_ACCEPT)):
		_activate_or_focus_first_button()
	elif action_name == str(_menu_actions.get("back", INPUT_ACTIONS.MENU_BACK)):
		_focus_first_button()


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
	if _settings_menu == null:
		push_warning("Le menu principal ne trouve pas la scene de parametres.")
		return

	_set_menu_input_enabled(false)

	if _button_layer != null:
		_button_layer.hide()

	_call_settings_menu_method("show_menu", [])


func _close_settings_menu() -> void:
	if _settings_menu != null:
		_call_settings_menu_method("hide_menu", [])

	if _button_layer != null:
		_button_layer.show()

	_set_menu_input_enabled(true)

	var settings_button := _find_button_by_action("settings")
	if settings_button != null:
		settings_button.grab_focus()


func _is_settings_menu_open() -> bool:
	return _settings_menu != null and _settings_menu.visible


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


func _find_button_by_action(action_name: String) -> Button:
	for button in _buttons:
		if str(button.get("action_name")) == action_name:
			return button

	return null


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
	call_deferred("_change_scene_to_file", scene_path)


func _change_scene_to_file(scene_path: String) -> void:
	if not ResourceLoader.exists(scene_path):
		push_error("MainMenu cannot change scene: scene not found at %s." % scene_path)
		_is_changing_scene = false
		return

	var error := get_tree().change_scene_to_file(scene_path)

	if error != OK:
		push_error("MainMenu failed to change scene. Error code: %d." % error)
		_is_changing_scene = false
