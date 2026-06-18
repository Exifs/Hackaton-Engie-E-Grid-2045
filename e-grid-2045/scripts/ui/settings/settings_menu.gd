class_name SettingsMenu
extends Control

signal close_requested

const CONFIG_PATH := "user://settings.cfg"

@export_node_path("TabContainer") var tab_container_path: NodePath = ^"Panel/Margin/VBox/Tabs"
@export_node_path("Control") var sound_panel_path: NodePath = ^"Panel/Margin/VBox/Tabs/Son"
@export_node_path("Control") var display_panel_path: NodePath = ^"Panel/Margin/VBox/Tabs/Affichage"
@export_node_path("Button") var apply_button_path: NodePath = ^"Panel/Margin/VBox/Footer/ApplyButton"
@export_node_path("Button") var back_button_path: NodePath = ^"Panel/Margin/VBox/Footer/BackButton"

var _tab_container: TabContainer
var _sound_panel: Control
var _display_panel: Control
var _apply_button: Button
var _back_button: Button
var _applied_sound_settings := {}
var _applied_display_settings := {}
var _is_loading_settings := false


func _ready() -> void:
	_tab_container = get_node_or_null(tab_container_path) as TabContainer
	_sound_panel = get_node_or_null(sound_panel_path) as Control
	_display_panel = get_node_or_null(display_panel_path) as Control
	_apply_button = get_node_or_null(apply_button_path) as Button
	_back_button = get_node_or_null(back_button_path) as Button

	if _apply_button != null:
		_apply_button.pressed.connect(_on_apply_button_pressed)

	if _back_button != null:
		_back_button.pressed.connect(_on_back_button_pressed)

	_connect_panel_signal(_sound_panel)
	_connect_panel_signal(_display_panel)
	_load_and_apply_saved_settings()
	_update_apply_button()

	visibility_changed.connect(_on_visibility_changed)


func show_menu() -> void:
	show()
	_update_apply_button()
	_focus_menu()


func hide_menu() -> void:
	hide()


func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return

	if event.is_action_pressed("ui_cancel"):
		_emit_close_request()
		return

	if not (event is InputEventKey):
		return

	var key_event := event as InputEventKey
	if not key_event.pressed or key_event.echo:
		return

	match key_event.keycode:
		KEY_Q:
			_switch_tab(-1)
		KEY_E:
			_switch_tab(1)


func _switch_tab(offset: int) -> void:
	if _tab_container == null or _tab_container.get_tab_count() == 0:
		return

	_tab_container.current_tab = posmod(_tab_container.current_tab + offset, _tab_container.get_tab_count())
	_focus_menu()
	get_viewport().set_input_as_handled()


func _focus_menu() -> void:
	if _tab_container != null:
		_tab_container.grab_focus()


func _on_visibility_changed() -> void:
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
	get_viewport().set_input_as_handled()
