@tool
class_name KeybindingRow
extends HBoxContainer

signal remap_requested(action_name: String)
signal reset_requested(action_name: String)

@export var action_name := "":
	set(value):
		action_name = value
		_sync()

@export var action_label := "Action":
	set(value):
		action_label = value
		_sync()

@export var category_label := "Categorie":
	set(value):
		category_label = value
		_sync()

@export var binding_text := "-":
	set(value):
		binding_text = value
		_sync()

@export var awaiting_input := false:
	set(value):
		awaiting_input = value
		_sync()


func _ready() -> void:
	_wire_buttons()
	_sync()


func configure(new_action_name: String, new_action_label: String, new_category_label: String, new_binding_text: String) -> void:
	action_name = new_action_name
	action_label = new_action_label
	category_label = new_category_label
	binding_text = new_binding_text
	_sync()


func _wire_buttons() -> void:
	var remap_button := get_node_or_null("RemapButton") as BaseButton
	var reset_button := get_node_or_null("ResetButton") as BaseButton

	if remap_button != null and not remap_button.pressed.is_connected(_on_remap_button_pressed):
		remap_button.pressed.connect(_on_remap_button_pressed)

	if reset_button != null and not reset_button.pressed.is_connected(_on_reset_button_pressed):
		reset_button.pressed.connect(_on_reset_button_pressed)


func _sync() -> void:
	if not is_inside_tree():
		return

	var action_label_node := get_node_or_null("ActionLabel") as Label
	var category_label_node := get_node_or_null("CategoryLabel") as Label
	var binding_label_node := get_node_or_null("BindingLabel") as Label
	var remap_button := get_node_or_null("RemapButton") as BaseButton

	if action_label_node != null:
		action_label_node.text = action_label

	if category_label_node != null:
		category_label_node.text = category_label

	if binding_label_node != null:
		binding_label_node.text = "Appuyez sur une touche..." if awaiting_input else binding_text

	if remap_button != null:
		_set_button_label(remap_button, "En attente" if awaiting_input else "Changer")
		remap_button.disabled = awaiting_input
		_sync_button_visual(remap_button)


func _on_remap_button_pressed() -> void:
	remap_requested.emit(action_name)


func _on_reset_button_pressed() -> void:
	reset_requested.emit(action_name)


func _set_button_label(button: BaseButton, label: String) -> void:
	if button == null:
		return

	if _has_property(button, "label_text"):
		button.set("label_text", label)
	else:
		button.text = label


func _sync_button_visual(button: BaseButton) -> void:
	if button.has_method("sync_visual_state"):
		button.call("sync_visual_state")
	else:
		button.queue_redraw()


func _has_property(target: Object, property_name: String) -> bool:
	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			return true

	return false
