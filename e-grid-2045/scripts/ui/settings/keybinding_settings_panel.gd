class_name KeybindingSettingsPanel
extends VBoxContainer

const INPUT_ACTIONS := preload("res://scripts/input/e_grid_input_actions.gd")
const INPUT_BINDINGS := preload("res://scripts/input/e_grid_input_bindings.gd")
const ROW_SCENE := preload("res://scenes/ui/settings/keybinding_row.tscn")

@export_node_path("VBoxContainer") var rows_container_path: NodePath = ^"BindingsScroll/Rows"
@export_node_path("Label") var status_label_path: NodePath = ^"StatusRow/StatusLabel"
@export_node_path("Button") var cancel_button_path: NodePath = ^"StatusRow/CancelButton"
@export_node_path("Button") var reset_all_button_path: NodePath = ^"Footer/ResetAllButton"

var _rows_container: VBoxContainer
var _status_label: Label
var _cancel_button: BaseButton
var _reset_all_button: BaseButton
var _rows_by_action := {}
var _pending_action := ""


func _ready() -> void:
	_cache_nodes()
	_wire_buttons()
	_setup_bindings()
	_rebuild_rows()
	_set_waiting_for_input("")
	_set_status("Selectionnez une action a modifier.")


func _input(event: InputEvent) -> void:
	if _pending_action.is_empty():
		return

	if not (event is InputEventKey):
		return

	var key_event := event as InputEventKey

	if not key_event.pressed or key_event.echo:
		return

	var remap_event := _copy_key_event(key_event)
	var conflicts := INPUT_BINDINGS.get_conflicting_actions(_pending_action, remap_event)
	var error := INPUT_BINDINGS.set_action_event(_pending_action, remap_event, true)

	_mark_input_as_handled()

	if error != OK:
		_set_status("Impossible de modifier cette touche. Code erreur: %d." % error)
		_set_waiting_for_input("")
		return

	_set_status(_format_success_status(_pending_action, remap_event, conflicts))
	_set_waiting_for_input("")
	_refresh_rows()


func _cache_nodes() -> void:
	_rows_container = get_node_or_null(rows_container_path) as VBoxContainer
	_status_label = get_node_or_null(status_label_path) as Label
	_cancel_button = get_node_or_null(cancel_button_path) as BaseButton
	_reset_all_button = get_node_or_null(reset_all_button_path) as BaseButton


func _wire_buttons() -> void:
	if _cancel_button != null and not _cancel_button.pressed.is_connected(_on_cancel_button_pressed):
		_cancel_button.pressed.connect(_on_cancel_button_pressed)

	if _reset_all_button != null and not _reset_all_button.pressed.is_connected(_on_reset_all_button_pressed):
		_reset_all_button.pressed.connect(_on_reset_all_button_pressed)


func _setup_bindings() -> void:
	var error := INPUT_BINDINGS.setup_runtime_bindings()

	if error != OK:
		_set_status("Impossible de charger les raccourcis. Code erreur: %d." % error)


func _rebuild_rows() -> void:
	if _rows_container == null:
		return

	_rows_by_action.clear()

	for child in _rows_container.get_children():
		_rows_container.remove_child(child)
		child.queue_free()

	var current_category := ""

	for definition in INPUT_BINDINGS.get_remappable_definitions():
		var action_name := str(definition[INPUT_ACTIONS.ACTION_NAME])
		var category := str(definition[INPUT_ACTIONS.ACTION_CATEGORY])

		if category != current_category:
			current_category = category
			_rows_container.add_child(_create_category_label(category))

		var row := ROW_SCENE.instantiate()
		_rows_container.add_child(row)
		_rows_by_action[action_name] = row
		_configure_row(row, definition)
		_wire_row(row)


func _refresh_rows() -> void:
	for definition in INPUT_BINDINGS.get_remappable_definitions():
		var action_name := str(definition[INPUT_ACTIONS.ACTION_NAME])
		var row = _rows_by_action.get(action_name)

		if row != null:
			_configure_row(row, definition)


func _configure_row(row: Node, definition: Dictionary) -> void:
	var action_name := str(definition[INPUT_ACTIONS.ACTION_NAME])
	var action_label := str(definition[INPUT_ACTIONS.ACTION_LABEL])
	var category := _format_category(str(definition[INPUT_ACTIONS.ACTION_CATEGORY]))
	var bindings := INPUT_BINDINGS.get_action_event_labels(action_name)
	var binding_text := _format_bindings(bindings)

	if row.has_method("configure"):
		row.call("configure", action_name, action_label, category, binding_text)

	row.set("awaiting_input", action_name == _pending_action)


func _wire_row(row: Node) -> void:
	var remap_callback := Callable(self, "_on_row_remap_requested")
	var reset_callback := Callable(self, "_on_row_reset_requested")

	if row.has_signal("remap_requested") and not row.is_connected("remap_requested", remap_callback):
		row.connect("remap_requested", remap_callback)

	if row.has_signal("reset_requested") and not row.is_connected("reset_requested", reset_callback):
		row.connect("reset_requested", reset_callback)


func _create_category_label(category: String) -> Label:
	var label := Label.new()
	label.text = _format_category(category)
	label.custom_minimum_size = Vector2(0.0, 28.0)
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return label


func _on_row_remap_requested(action_name: String) -> void:
	if action_name.is_empty():
		return

	_set_waiting_for_input(action_name)
	_set_status("Appuyez sur une touche pour: %s." % INPUT_ACTIONS.get_action_label(action_name))


func _on_row_reset_requested(action_name: String) -> void:
	var error := INPUT_BINDINGS.reset_action_to_defaults(action_name, true)

	if error != OK:
		_set_status("Impossible de restaurer cette action. Code erreur: %d." % error)
		return

	_set_status("Raccourci restaure: %s." % INPUT_ACTIONS.get_action_label(action_name))
	_set_waiting_for_input("")
	_refresh_rows()


func _on_cancel_button_pressed() -> void:
	_set_waiting_for_input("")
	_set_status("Modification annulee.")


func _on_reset_all_button_pressed() -> void:
	var error := INPUT_BINDINGS.reset_all_to_defaults(true)

	if error != OK:
		_set_status("Impossible de restaurer les raccourcis. Code erreur: %d." % error)
		return

	_set_status("Tous les raccourcis ont ete restaures.")
	_set_waiting_for_input("")
	_refresh_rows()


func _set_waiting_for_input(action_name: String) -> void:
	_pending_action = action_name

	if _cancel_button != null:
		_cancel_button.visible = not _pending_action.is_empty()

	_refresh_rows()


func _set_status(text: String) -> void:
	if _status_label != null:
		_status_label.text = text


func _copy_key_event(source: InputEventKey) -> InputEventKey:
	var copied := InputEventKey.new()
	copied.physical_keycode = source.physical_keycode
	copied.keycode = source.keycode
	copied.ctrl_pressed = source.ctrl_pressed
	copied.alt_pressed = source.alt_pressed
	copied.shift_pressed = source.shift_pressed
	copied.meta_pressed = source.meta_pressed
	return copied


func _format_success_status(action_name: String, event: InputEvent, conflicts: PackedStringArray) -> String:
	var status := "%s -> %s." % [INPUT_ACTIONS.get_action_label(action_name), INPUT_BINDINGS.get_event_label(event)]

	if not conflicts.is_empty():
		status += " Meme touche que: %s." % _format_conflicts(conflicts)

	return status


func _format_conflicts(conflicts: PackedStringArray) -> String:
	var labels: Array[String] = []

	for action_name in conflicts:
		labels.append(INPUT_ACTIONS.get_action_label(action_name))

	return ", ".join(labels)


func _format_bindings(bindings: PackedStringArray) -> String:
	if bindings.is_empty():
		return "-"

	var parts: Array[String] = []

	for binding in bindings:
		parts.append(binding)

	return " / ".join(parts)


func _format_category(category: String) -> String:
	match category:
		INPUT_ACTIONS.CATEGORY_GAMEPLAY:
			return "Gameplay"
		INPUT_ACTIONS.CATEGORY_SIMULATION:
			return "Simulation"
		INPUT_ACTIONS.CATEGORY_MENU:
			return "Menu"
		_:
			return category.capitalize()


func _mark_input_as_handled() -> void:
	var viewport := get_viewport()

	if viewport != null:
		viewport.set_input_as_handled()
