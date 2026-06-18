@tool
extends Control
class_name EGridAlertItem

signal action_requested(action_name: String)

@export var title_text := "ALERT":
	set(value):
		title_text = value
		_sync()

@export var body_text := "Alert details":
	set(value):
		body_text = value
		_sync()

@export var action_text := "VIEW":
	set(value):
		action_text = value
		_sync()

@export var action_name := "":
	set(value):
		action_name = value
		_sync()

@export_enum("power_warning", "critical", "cooling_warning", "research_success", "market_info", "disabled") var alert_state := "power_warning":
	set(value):
		alert_state = value
		_sync()


func _ready() -> void:
	_sync()
	_wire_buttons()


func _sync() -> void:
	if not is_inside_tree():
		return

	var toast_button := get_node_or_null("ToastButton") as BaseButton
	var action_button := get_node_or_null("ActionButton") as BaseButton
	var composed_text := title_text if body_text.is_empty() else "%s / %s" % [title_text, body_text]

	if toast_button != null:
		toast_button.tooltip_text = composed_text
		_set_property_if_available(toast_button, "label_text", composed_text)
		_set_property_if_available(toast_button, "normal_state", alert_state)
		_set_property_if_available(toast_button, "hover_state", alert_state)
		_set_property_if_available(toast_button, "pressed_state", alert_state)
		_set_property_if_available(toast_button, "selected_state", alert_state)
		_set_property_if_available(toast_button, "semantic_state", "normal")

	if action_button != null:
		_set_property_if_available(action_button, "label_text", action_text)
		if _object_has_property(action_button, "text"):
			action_button.set("text", action_text)
		action_button.tooltip_text = action_name if not action_name.is_empty() else title_text


func _wire_buttons() -> void:
	var action_button := get_node_or_null("ActionButton") as BaseButton
	var toast_button := get_node_or_null("ToastButton") as BaseButton

	for button in [action_button, toast_button]:
		if button == null:
			continue

		if not button.pressed.is_connected(_on_action_button_pressed):
			button.pressed.connect(_on_action_button_pressed)


func _on_action_button_pressed() -> void:
	action_requested.emit(action_name)


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	if _object_has_property(target, property_name):
		target.set(property_name, property_value)


func _object_has_property(target: Object, property_name: String) -> bool:
	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			return true

	return false
