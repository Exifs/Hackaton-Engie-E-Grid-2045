class_name EGridInputBindings
extends RefCounted

const INPUT_ACTIONS := preload("res://scripts/input/e_grid_input_actions.gd")

const DEFAULT_BINDINGS_PATH := "user://input_bindings.cfg"
const CFG_EVENTS_KEY := "events"
const CFG_TYPE := "type"
const CFG_PHYSICAL_KEYCODE := "physical_keycode"
const CFG_KEYCODE := "keycode"
const CFG_CTRL := "ctrl"
const CFG_ALT := "alt"
const CFG_SHIFT := "shift"
const CFG_META := "meta"
const EVENT_TYPE_KEY := "key"


static func setup_runtime_bindings(path := DEFAULT_BINDINGS_PATH) -> int:
	INPUT_ACTIONS.ensure_defaults_registered()
	return load_user_bindings(path)


static func get_remappable_definitions() -> Array[Dictionary]:
	return INPUT_ACTIONS.get_remappable_definitions()


static func get_action_events(action_name: String) -> Array[InputEvent]:
	if not InputMap.has_action(action_name):
		return []

	return InputMap.action_get_events(action_name)


static func get_action_event_labels(action_name: String) -> PackedStringArray:
	var labels := PackedStringArray()

	for event in get_action_events(action_name):
		labels.append(get_event_label(event))

	return labels


static func get_event_label(event: InputEvent) -> String:
	if event == null:
		return ""

	return event.as_text().strip_edges()


static func set_action_event(action_name: String, event: InputEvent, persist := false, path := DEFAULT_BINDINGS_PATH) -> int:
	if event == null:
		return ERR_INVALID_PARAMETER

	return set_action_events(action_name, [event], persist, path)


static func set_action_events(action_name: String, events: Array, persist := false, path := DEFAULT_BINDINGS_PATH) -> int:
	if not INPUT_ACTIONS.is_remappable(action_name):
		return ERR_UNAVAILABLE

	var valid_events := _filter_valid_events(events)

	if valid_events.is_empty():
		return ERR_INVALID_PARAMETER

	_ensure_action(action_name)
	InputMap.action_erase_events(action_name)

	for event in valid_events:
		InputMap.action_add_event(action_name, event)

	if persist:
		return save_user_bindings(path)

	return OK


static func would_conflict(action_name: String, event: InputEvent, same_category_only := true) -> bool:
	return not get_conflicting_actions(action_name, event, same_category_only).is_empty()


static func get_conflicting_actions(action_name: String, event: InputEvent, same_category_only := true) -> PackedStringArray:
	var conflicts := PackedStringArray()

	if event == null:
		return conflicts

	var source_category := INPUT_ACTIONS.get_action_category(action_name)

	for definition in INPUT_ACTIONS.get_remappable_definitions():
		var candidate_action := str(definition[INPUT_ACTIONS.ACTION_NAME])

		if candidate_action == action_name:
			continue

		if same_category_only and str(definition.get(INPUT_ACTIONS.ACTION_CATEGORY, "")) != source_category:
			continue

		if InputMap.has_action(candidate_action) and InputMap.event_is_action(event, candidate_action, true):
			conflicts.append(candidate_action)

	return conflicts


static func reset_action_to_defaults(action_name: String, persist := false, path := DEFAULT_BINDINGS_PATH) -> int:
	if not INPUT_ACTIONS.is_remappable(action_name):
		return ERR_UNAVAILABLE

	var events := _default_events_for_action(action_name)

	if events.is_empty():
		return ERR_INVALID_PARAMETER

	return set_action_events(action_name, events, persist, path)


static func reset_all_to_defaults(persist := false, path := DEFAULT_BINDINGS_PATH) -> int:
	for definition in INPUT_ACTIONS.get_remappable_definitions():
		var action_name := str(definition[INPUT_ACTIONS.ACTION_NAME])
		var error := reset_action_to_defaults(action_name, false, path)

		if error != OK:
			return error

	if persist:
		return save_user_bindings(path)

	return OK


static func save_user_bindings(path := DEFAULT_BINDINGS_PATH) -> int:
	var config := ConfigFile.new()

	for definition in INPUT_ACTIONS.get_remappable_definitions():
		var action_name := str(definition[INPUT_ACTIONS.ACTION_NAME])
		config.set_value(action_name, CFG_EVENTS_KEY, _events_to_binding_data(get_action_events(action_name)))

	return config.save(path)


static func load_user_bindings(path := DEFAULT_BINDINGS_PATH) -> int:
	var config := ConfigFile.new()
	var error := config.load(path)

	if error == ERR_FILE_NOT_FOUND:
		return OK

	if error != OK:
		return error

	for definition in INPUT_ACTIONS.get_remappable_definitions():
		var action_name := str(definition[INPUT_ACTIONS.ACTION_NAME])

		if not config.has_section_key(action_name, CFG_EVENTS_KEY):
			continue

		var events := _binding_data_to_events(config.get_value(action_name, CFG_EVENTS_KEY, []))

		if not events.is_empty():
			var apply_error := set_action_events(action_name, events, false, path)

			if apply_error != OK:
				return apply_error

	return OK


static func _ensure_action(action_name: String) -> void:
	if not InputMap.has_action(action_name):
		InputMap.add_action(action_name)


static func _filter_valid_events(events: Array) -> Array[InputEvent]:
	var valid_events: Array[InputEvent] = []

	for event in events:
		if event is InputEvent:
			valid_events.append(event)

	return valid_events


static func _default_events_for_action(action_name: String) -> Array[InputEvent]:
	var events: Array[InputEvent] = []

	for keycode in INPUT_ACTIONS.get_default_keycodes(action_name):
		events.append(_create_key_event(int(keycode) as Key))

	return events


static func _create_key_event(physical_keycode: Key) -> InputEventKey:
	var event := InputEventKey.new()
	event.physical_keycode = physical_keycode
	return event


static func _events_to_binding_data(events: Array[InputEvent]) -> Array[Dictionary]:
	var binding_data: Array[Dictionary] = []

	for event in events:
		var serialized := _event_to_binding_data(event)

		if not serialized.is_empty():
			binding_data.append(serialized)

	return binding_data


static func _binding_data_to_events(binding_data: Variant) -> Array[InputEvent]:
	var events: Array[InputEvent] = []

	if not (binding_data is Array):
		return events

	for event_data in binding_data:
		var event := _event_from_binding_data(event_data)

		if event != null:
			events.append(event)

	return events


static func _event_to_binding_data(event: InputEvent) -> Dictionary:
	if event is InputEventKey:
		var key_event := event as InputEventKey
		return {
			CFG_TYPE: EVENT_TYPE_KEY,
			CFG_PHYSICAL_KEYCODE: int(key_event.physical_keycode),
			CFG_KEYCODE: int(key_event.keycode),
			CFG_CTRL: key_event.ctrl_pressed,
			CFG_ALT: key_event.alt_pressed,
			CFG_SHIFT: key_event.shift_pressed,
			CFG_META: key_event.meta_pressed,
		}

	return {}


static func _event_from_binding_data(event_data: Variant) -> InputEvent:
	if not (event_data is Dictionary):
		return null

	var event_type := str(event_data.get(CFG_TYPE, ""))

	match event_type:
		EVENT_TYPE_KEY:
			var key_event := InputEventKey.new()
			key_event.physical_keycode = int(event_data.get(CFG_PHYSICAL_KEYCODE, 0)) as Key
			key_event.keycode = int(event_data.get(CFG_KEYCODE, 0)) as Key
			key_event.ctrl_pressed = bool(event_data.get(CFG_CTRL, false))
			key_event.alt_pressed = bool(event_data.get(CFG_ALT, false))
			key_event.shift_pressed = bool(event_data.get(CFG_SHIFT, false))
			key_event.meta_pressed = bool(event_data.get(CFG_META, false))
			return key_event

	return null
