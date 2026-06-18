class_name SettingsMenu
extends Control

const INPUT_ACTIONS := preload("res://scripts/input/e_grid_input_actions.gd")

signal close_requested

const CONFIG_PATH := "user://settings.cfg"

@export_node_path("Control") var tab_buttons_path: NodePath = ^"Panel/Margin/VBox/TabButtons"
@export_node_path("Control") var sound_panel_path: NodePath = ^"Panel/Margin/VBox/Content/Son"
@export_node_path("Control") var display_panel_path: NodePath = ^"Panel/Margin/VBox/Content/Affichage"
@export_node_path("Button") var sound_tab_path: NodePath = ^"Panel/Margin/VBox/TabButtons/SoundTab"
@export_node_path("Button") var display_tab_path: NodePath = ^"Panel/Margin/VBox/TabButtons/DisplayTab"
@export_node_path("Button") var keyboard_tab_path: NodePath = ^"Panel/Margin/VBox/TabButtons/KeyboardTab"
@export_node_path("Button") var apply_button_path: NodePath = ^"Panel/Margin/VBox/Footer/ApplyButton"
@export_node_path("Button") var back_button_path: NodePath = ^"Panel/Margin/VBox/Footer/BackButton"
@export_node_path("Node") var input_controller_path: NodePath = ^"InputController"

var _tab_buttons_container: Control
var _sound_panel: Control
var _display_panel: Control
var _keyboard_panel: Control
var _apply_button: BaseButton
var _back_button: BaseButton
var _tab_buttons: Array[BaseButton] = []
var _panels: Array[Control] = []
var _current_tab := 0
var _applied_sound_settings := {}
var _applied_display_settings := {}
var _is_loading_settings := false
var _input_controller: Node
var _settings_actions := {}


func _ready() -> void:
	_settings_actions = INPUT_ACTIONS.get_settings_navigation_actions()
	_cache_nodes()
	_wire_buttons()
	_connect_panel_signal(_sound_panel)
	_connect_panel_signal(_display_panel)
	_set_current_tab(_current_tab, false)
	_load_and_apply_saved_settings()
	_update_apply_button()
	_wire_input_controller()

	visibility_changed.connect(_on_visibility_changed)
	_set_input_enabled(visible)


func show_menu() -> void:
	show()
	_update_apply_button()
	_set_input_enabled(true)
	_focus_menu()


func hide_menu() -> void:
	hide()
	_set_input_enabled(false)


func _cache_nodes() -> void:
	_tab_buttons_container = get_node_or_null(tab_buttons_path) as Control
	_sound_panel = get_node_or_null(sound_panel_path) as Control
	_display_panel = get_node_or_null(display_panel_path) as Control
	_keyboard_panel = get_node_or_null(^"Panel/Margin/VBox/Content/Clavier") as Control
	_apply_button = get_node_or_null(apply_button_path) as BaseButton
	_back_button = get_node_or_null(back_button_path) as BaseButton
	_input_controller = get_node_or_null(input_controller_path)

	_tab_buttons = [
		get_node_or_null(sound_tab_path) as BaseButton,
		get_node_or_null(display_tab_path) as BaseButton,
		get_node_or_null(keyboard_tab_path) as BaseButton,
	]
	_panels = [
		_sound_panel,
		_display_panel,
		_keyboard_panel,
	]


func _wire_buttons() -> void:
	for index in range(_tab_buttons.size()):
		var tab_button := _tab_buttons[index]
		if tab_button == null:
			continue

		tab_button.toggle_mode = true
		tab_button.focus_mode = Control.FOCUS_ALL
		tab_button.pressed.connect(_on_tab_pressed.bind(index))

	if _apply_button != null:
		_apply_button.pressed.connect(_on_apply_button_pressed)

	if _back_button != null:
		_back_button.pressed.connect(_on_back_button_pressed)


func _wire_input_controller() -> void:
	if _input_controller == null:
		push_warning("Le menu de parametres ne trouve pas son controleur d'input.")
		return

	var callback := Callable(self, "_on_input_action_pressed")
	var back_callback := Callable(self, "_on_input_back_requested")

	if _input_controller.has_signal("action_pressed") and not _input_controller.is_connected("action_pressed", callback):
		_input_controller.connect("action_pressed", callback)

	if _input_controller.has_signal("back_requested") and not _input_controller.is_connected("back_requested", back_callback):
		_input_controller.connect("back_requested", back_callback)


func _on_input_action_pressed(action_name: String) -> void:
	if not visible:
		return

	if action_name == str(_settings_actions.get("tab_previous", INPUT_ACTIONS.SETTINGS_TAB_PREVIOUS)):
		_switch_tab(-1)
	elif action_name == str(_settings_actions.get("tab_next", INPUT_ACTIONS.SETTINGS_TAB_NEXT)):
		_switch_tab(1)


func _on_input_back_requested() -> void:
	if not visible:
		return

	_emit_close_request()


func _switch_tab(offset: int) -> void:
	if _panels.is_empty():
		return

	_set_current_tab(posmod(_current_tab + offset, _panels.size()), true)


func _set_current_tab(tab_index: int, should_focus: bool) -> void:
	if _panels.is_empty():
		return

	_current_tab = clampi(tab_index, 0, _panels.size() - 1)

	for index in range(_panels.size()):
		var panel := _panels[index]
		if panel != null:
			panel.visible = index == _current_tab

	for index in range(_tab_buttons.size()):
		var tab_button := _tab_buttons[index]
		if tab_button != null:
			_set_button_pressed_no_signal(tab_button, index == _current_tab)

	if should_focus:
		_focus_menu()


func _focus_menu() -> void:
	if _current_tab >= 0 and _current_tab < _tab_buttons.size():
		var tab_button := _tab_buttons[_current_tab]
		if tab_button != null:
			tab_button.grab_focus()


func _set_input_enabled(enabled: bool) -> void:
	if _input_controller != null:
		_input_controller.set("enabled", enabled)


func _on_visibility_changed() -> void:
	_set_input_enabled(visible)

	if visible:
		_update_apply_button()
		_focus_menu()


func _connect_panel_signal(panel: Control) -> void:
	if panel == null or not panel.has_signal("settings_changed"):
		return

	var callback := Callable(self, "_on_panel_settings_changed")
	if not panel.is_connected("settings_changed", callback):
		panel.connect("settings_changed", callback)


func _load_and_apply_saved_settings() -> void:
	_is_loading_settings = true

	var sound_settings := _get_panel_settings(_sound_panel)
	var display_settings := _get_panel_settings(_display_panel)
	var config := ConfigFile.new()

	if config.load(CONFIG_PATH) == OK:
		sound_settings = _read_settings_section(config, "sound", sound_settings)
		display_settings = _read_settings_section(config, "display", display_settings)

	_call_panel_method(_sound_panel, &"set_settings", [sound_settings])
	_call_panel_method(_display_panel, &"set_settings", [display_settings])

	sound_settings = _get_panel_settings(_sound_panel)
	display_settings = _get_panel_settings(_display_panel)

	_call_panel_method(_sound_panel, &"apply_settings", [sound_settings])
	_call_panel_method(_display_panel, &"apply_settings", [display_settings])

	_applied_sound_settings = sound_settings.duplicate(true)
	_applied_display_settings = display_settings.duplicate(true)
	_is_loading_settings = false


func _read_settings_section(config: ConfigFile, section: String, defaults: Dictionary) -> Dictionary:
	var settings := defaults.duplicate(true)

	for key in defaults.keys():
		if config.has_section_key(section, key):
			settings[key] = config.get_value(section, key, defaults[key])

	return settings


func _save_settings(sound_settings: Dictionary, display_settings: Dictionary) -> void:
	var config := ConfigFile.new()

	for key in sound_settings.keys():
		config.set_value("sound", key, sound_settings[key])

	for key in display_settings.keys():
		config.set_value("display", key, display_settings[key])

	var error := config.save(CONFIG_PATH)
	if error != OK:
		push_warning("Impossible de sauvegarder les parametres: %s" % error_string(error))


func _get_panel_settings(panel: Control) -> Dictionary:
	if panel == null or not panel.has_method("get_settings"):
		return {}

	var result = panel.call("get_settings")
	if result is Dictionary:
		return (result as Dictionary).duplicate(true)

	return {}


func _call_panel_method(panel: Control, method_name: StringName, arguments: Array = []) -> void:
	if panel == null or not panel.has_method(method_name):
		return

	panel.callv(method_name, arguments)


func _has_pending_changes() -> bool:
	return (
		_settings_are_different(_get_panel_settings(_sound_panel), _applied_sound_settings)
		or _settings_are_different(_get_panel_settings(_display_panel), _applied_display_settings)
	)


func _settings_are_different(current: Dictionary, applied: Dictionary) -> bool:
	if current.size() != applied.size():
		return true

	for key in current.keys():
		if not applied.has(key) or not _values_match(current[key], applied[key]):
			return true

	return false


func _values_match(left, right) -> bool:
	var left_type := typeof(left)
	var right_type := typeof(right)
	var left_is_number := left_type == TYPE_INT or left_type == TYPE_FLOAT
	var right_is_number := right_type == TYPE_INT or right_type == TYPE_FLOAT

	if left_is_number and right_is_number:
		return is_equal_approx(float(left), float(right))

	return left == right


func _update_apply_button() -> void:
	if _apply_button != null:
		_apply_button.disabled = not _has_pending_changes()
		_sync_button_visual(_apply_button)


func _set_button_pressed_no_signal(button: BaseButton, pressed: bool) -> void:
	if button.has_method("set_pressed_no_signal"):
		button.call("set_pressed_no_signal", pressed)
	else:
		button.button_pressed = pressed

	_sync_button_visual(button)


func _sync_button_visual(button: BaseButton) -> void:
	if button.has_method("sync_visual_state"):
		button.call("sync_visual_state")
	else:
		button.queue_redraw()


func _on_tab_pressed(tab_index: int) -> void:
	_set_current_tab(tab_index, true)


func _on_panel_settings_changed() -> void:
	if _is_loading_settings:
		return

	_update_apply_button()


func _on_apply_button_pressed() -> void:
	var sound_settings := _get_panel_settings(_sound_panel)
	var display_settings := _get_panel_settings(_display_panel)

	_call_panel_method(_sound_panel, &"apply_settings", [sound_settings])
	_call_panel_method(_display_panel, &"apply_settings", [display_settings])
	_save_settings(sound_settings, display_settings)

	_applied_sound_settings = sound_settings.duplicate(true)
	_applied_display_settings = display_settings.duplicate(true)
	_update_apply_button()


func _on_back_button_pressed() -> void:
	_emit_close_request()


func _emit_close_request() -> void:
	close_requested.emit()
