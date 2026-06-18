class_name SettingsMenu
extends Control

const INPUT_ACTIONS := preload("res://scripts/input/e_grid_input_actions.gd")

signal close_requested

@export_node_path("TabContainer") var tab_container_path: NodePath = ^"Panel/Margin/VBox/Tabs"
@export_node_path("Button") var back_button_path: NodePath = ^"Panel/Margin/VBox/Footer/BackButton"
@export_node_path("Node") var input_controller_path: NodePath = ^"InputController"

var _tab_container: TabContainer
var _back_button: Button
var _input_controller: Node
var _settings_actions := {}


func _ready() -> void:
	_settings_actions = INPUT_ACTIONS.get_settings_navigation_actions()
	_tab_container = get_node_or_null(tab_container_path) as TabContainer
	_back_button = get_node_or_null(back_button_path) as Button
	_input_controller = get_node_or_null(input_controller_path)

	if _back_button != null:
		_back_button.pressed.connect(_on_back_button_pressed)

	_wire_input_controller()
	visibility_changed.connect(_on_visibility_changed)
	_set_input_enabled(visible)


func show_menu() -> void:
	show()
	_set_input_enabled(true)
	_focus_menu()


func hide_menu() -> void:
	hide()
	_set_input_enabled(false)


func _wire_input_controller() -> void:
	if _input_controller == null:
		push_warning("Le menu de parametres ne trouve pas son controleur d'input.")
		return

	var callback := Callable(self, "_on_input_action_pressed")

	if _input_controller.has_signal("action_pressed") and not _input_controller.is_connected("action_pressed", callback):
		_input_controller.connect("action_pressed", callback)


func _on_input_action_pressed(action_name: String) -> void:
	if not visible:
		return

	if action_name == str(_settings_actions.get("back", INPUT_ACTIONS.MENU_BACK)):
		_emit_close_request()
	elif action_name == str(_settings_actions.get("tab_previous", INPUT_ACTIONS.SETTINGS_TAB_PREVIOUS)):
		_switch_tab(-1)
	elif action_name == str(_settings_actions.get("tab_next", INPUT_ACTIONS.SETTINGS_TAB_NEXT)):
		_switch_tab(1)


func _switch_tab(offset: int) -> void:
	if _tab_container == null or _tab_container.get_tab_count() == 0:
		return

	_tab_container.current_tab = posmod(_tab_container.current_tab + offset, _tab_container.get_tab_count())
	_focus_menu()


func _focus_menu() -> void:
	if _tab_container != null:
		_tab_container.grab_focus()


func _set_input_enabled(enabled: bool) -> void:
	if _input_controller != null:
		_input_controller.set("enabled", enabled)


func _on_visibility_changed() -> void:
	_set_input_enabled(visible)

	if visible:
		_focus_menu()


func _on_back_button_pressed() -> void:
	_emit_close_request()


func _emit_close_request() -> void:
	close_requested.emit()
