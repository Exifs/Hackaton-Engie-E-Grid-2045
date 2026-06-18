class_name SettingsMenu
extends Control

signal close_requested

@export_node_path("TabContainer") var tab_container_path: NodePath = ^"Panel/Margin/VBox/Tabs"
@export_node_path("Button") var back_button_path: NodePath = ^"Panel/Margin/VBox/Footer/BackButton"

var _tab_container: TabContainer
var _back_button: Button


func _ready() -> void:
	_tab_container = get_node_or_null(tab_container_path) as TabContainer
	_back_button = get_node_or_null(back_button_path) as Button

	if _back_button != null:
		_back_button.pressed.connect(_on_back_button_pressed)

	visibility_changed.connect(_on_visibility_changed)


func show_menu() -> void:
	show()
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
		_focus_menu()


func _on_back_button_pressed() -> void:
	_emit_close_request()


func _emit_close_request() -> void:
	close_requested.emit()
	get_viewport().set_input_as_handled()
