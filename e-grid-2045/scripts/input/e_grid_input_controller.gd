extends Node
class_name EGridInputController

const INPUT_ACTIONS := preload("res://scripts/input/e_grid_input_actions.gd")
const INPUT_BINDINGS := preload("res://scripts/input/e_grid_input_bindings.gd")

signal action_pressed(action_name: String)
signal back_requested
signal pause_toggle_requested
signal speed_requested(speed_multiplier: float)

@export var enabled := true
@export var consume_handled_actions := true
@export var active_actions := PackedStringArray():
	set(value):
		active_actions = value
		_rebuild_action_lookup()

var _action_lookup := {}


func _ready() -> void:
	var bindings_error := INPUT_BINDINGS.setup_runtime_bindings()

	if bindings_error != OK:
		push_warning("Input bindings could not be loaded. Error code: %d." % bindings_error)

	if active_actions.is_empty():
		active_actions = INPUT_ACTIONS.get_gameplay_actions()

	_rebuild_action_lookup()


func _unhandled_input(event: InputEvent) -> void:
	if not enabled or event == null:
		return

	var matched_action := _get_pressed_action(event)

	if matched_action.is_empty():
		return

	if consume_handled_actions:
		_mark_input_as_handled()

	_emit_action(matched_action)


func _rebuild_action_lookup() -> void:
	_action_lookup.clear()

	for action_name in active_actions:
		var normalized := str(action_name)

		if not normalized.is_empty():
			_action_lookup[normalized] = true


func _get_pressed_action(event: InputEvent) -> String:
	for action_name in _action_lookup.keys():
		if event.is_action_pressed(action_name):
			return action_name

	return ""


func _emit_action(action_name: String) -> void:
	action_pressed.emit(action_name)

	if action_name == INPUT_ACTIONS.GAME_BACK or action_name == INPUT_ACTIONS.MENU_BACK:
		back_requested.emit()
	else:
		match action_name:
			INPUT_ACTIONS.GAME_PAUSE_TOGGLE:
				pause_toggle_requested.emit()
			INPUT_ACTIONS.GAME_SPEED_NORMAL:
				speed_requested.emit(1.0)
			INPUT_ACTIONS.GAME_SPEED_FAST:
				speed_requested.emit(2.0)
			INPUT_ACTIONS.GAME_SPEED_MAX:
				speed_requested.emit(4.0)


func _mark_input_as_handled() -> void:
	var viewport := get_viewport()

	if viewport != null:
		viewport.set_input_as_handled()
