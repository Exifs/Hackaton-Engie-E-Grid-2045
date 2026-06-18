class_name EGridInputActions
extends RefCounted

const CATEGORY_GAMEPLAY := "gameplay"
const CATEGORY_SIMULATION := "simulation"
const CATEGORY_MENU := "menu"

const GAME_BACK := "game_back"
const GAME_PAUSE_TOGGLE := "game_pause_toggle"
const GAME_SPEED_NORMAL := "game_speed_normal"
const GAME_SPEED_FAST := "game_speed_fast"
const GAME_SPEED_MAX := "game_speed_max"

const MENU_UP := "menu_up"
const MENU_DOWN := "menu_down"
const MENU_ACCEPT := "menu_accept"
const MENU_BACK := "menu_back"

const SETTINGS_TAB_PREVIOUS := "settings_tab_previous"
const SETTINGS_TAB_NEXT := "settings_tab_next"

const ACTION_NAME := "name"
const ACTION_LABEL := "label"
const ACTION_CATEGORY := "category"
const ACTION_DEFAULT_KEYS := "default_keys"
const ACTION_REMAP_ENABLED := "remap_enabled"


static func ensure_defaults_registered() -> void:
	for definition in get_definitions():
		var action_name := str(definition[ACTION_NAME])

		if not InputMap.has_action(action_name):
			InputMap.add_action(action_name)

		if InputMap.action_get_events(action_name).is_empty():
			_add_default_key_events(action_name, definition.get(ACTION_DEFAULT_KEYS, []))


static func get_definitions() -> Array[Dictionary]:
	return [
		_action(GAME_BACK, "Retour / fermer", CATEGORY_GAMEPLAY, [KEY_ESCAPE]),
		_action(GAME_PAUSE_TOGGLE, "Pause simulation", CATEGORY_SIMULATION, [KEY_SPACE]),
		_action(GAME_SPEED_NORMAL, "Vitesse normale", CATEGORY_SIMULATION, [KEY_1]),
		_action(GAME_SPEED_FAST, "Vitesse rapide", CATEGORY_SIMULATION, [KEY_2]),
		_action(GAME_SPEED_MAX, "Vitesse maximale", CATEGORY_SIMULATION, [KEY_3]),
		_action(MENU_UP, "Menu haut", CATEGORY_MENU, [KEY_UP]),
		_action(MENU_DOWN, "Menu bas", CATEGORY_MENU, [KEY_DOWN]),
		_action(MENU_ACCEPT, "Menu valider", CATEGORY_MENU, [KEY_ENTER, KEY_SPACE]),
		_action(MENU_BACK, "Menu retour", CATEGORY_MENU, [KEY_ESCAPE]),
		_action(SETTINGS_TAB_PREVIOUS, "Onglet precedent", CATEGORY_MENU, [KEY_Q]),
		_action(SETTINGS_TAB_NEXT, "Onglet suivant", CATEGORY_MENU, [KEY_E]),
	]


static func get_gameplay_actions() -> PackedStringArray:
	return PackedStringArray([
		GAME_BACK,
		GAME_PAUSE_TOGGLE,
		GAME_SPEED_NORMAL,
		GAME_SPEED_FAST,
		GAME_SPEED_MAX,
	])


static func get_menu_actions() -> PackedStringArray:
	return PackedStringArray([
		MENU_UP,
		MENU_DOWN,
		MENU_ACCEPT,
		MENU_BACK,
	])


static func get_settings_menu_actions() -> PackedStringArray:
	return PackedStringArray([
		MENU_BACK,
		SETTINGS_TAB_PREVIOUS,
		SETTINGS_TAB_NEXT,
	])


static func get_menu_navigation_actions() -> Dictionary:
	return {
		"up": MENU_UP,
		"down": MENU_DOWN,
		"accept": MENU_ACCEPT,
		"back": MENU_BACK,
	}


static func get_settings_navigation_actions() -> Dictionary:
	return {
		"back": MENU_BACK,
		"tab_previous": SETTINGS_TAB_PREVIOUS,
		"tab_next": SETTINGS_TAB_NEXT,
	}


static func get_all_action_names() -> PackedStringArray:
	var action_names := PackedStringArray()

	for definition in get_definitions():
		action_names.append(str(definition[ACTION_NAME]))

	return action_names


static func get_remappable_definitions() -> Array[Dictionary]:
	var remappable_definitions: Array[Dictionary] = []

	for definition in get_definitions():
		if bool(definition.get(ACTION_REMAP_ENABLED, true)):
			remappable_definitions.append(definition)

	return remappable_definitions


static func get_definition(action_name: String) -> Dictionary:
	for definition in get_definitions():
		if str(definition[ACTION_NAME]) == action_name:
			return definition

	return {}


static func is_known_action(action_name: String) -> bool:
	return not get_definition(action_name).is_empty()


static func is_remappable(action_name: String) -> bool:
	var definition := get_definition(action_name)

	if definition.is_empty():
		return false

	return bool(definition.get(ACTION_REMAP_ENABLED, true))


static func get_default_keycodes(action_name: String) -> Array:
	var definition := get_definition(action_name)

	if definition.is_empty():
		return []

	return definition.get(ACTION_DEFAULT_KEYS, [])


static func _action(
	action_name: String,
	label: String,
	category: String,
	default_keys: Array,
	remap_enabled := true
) -> Dictionary:
	return {
		ACTION_NAME: action_name,
		ACTION_LABEL: label,
		ACTION_CATEGORY: category,
		ACTION_DEFAULT_KEYS: default_keys,
		ACTION_REMAP_ENABLED: remap_enabled,
	}


static func _add_default_key_events(action_name: String, keycodes: Array) -> void:
	for keycode in keycodes:
		var event := InputEventKey.new()
		var physical_keycode: Key = int(keycode) as Key
		event.physical_keycode = physical_keycode
		InputMap.action_add_event(action_name, event)
