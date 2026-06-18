@tool
extends PanelContainer
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


func _ready() -> void:
	_sync()
	_wire_button()


func _sync() -> void:
	if not is_inside_tree():
		return

	var title_label := get_node_or_null("ContentMargin/AlertContent/TextStack/TitleLabel") as Label
	var body_label := get_node_or_null("ContentMargin/AlertContent/TextStack/BodyLabel") as Label
	var action_button := get_node_or_null("ContentMargin/AlertContent/ActionButton") as Button

	if title_label != null:
		title_label.text = title_text

	if body_label != null:
		body_label.text = body_text

	if action_button != null:
		action_button.text = action_text
		action_button.tooltip_text = action_name if not action_name.is_empty() else title_text


func _wire_button() -> void:
	var action_button := get_node_or_null("ContentMargin/AlertContent/ActionButton") as Button

	if action_button == null:
		return

	if not action_button.pressed.is_connected(_on_action_button_pressed):
		action_button.pressed.connect(_on_action_button_pressed)


func _on_action_button_pressed() -> void:
	action_requested.emit(action_name)
