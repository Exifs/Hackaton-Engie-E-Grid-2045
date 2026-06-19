@tool
extends Control
class_name EGridAlertBar

signal alert_action_requested(action_name: String)

@export_node_path("Container") var alert_container_path: NodePath = ^"ContentMargin/AlertRow/AlertItems"
@export_node_path("BaseButton") var collapse_button_path: NodePath = ^"ContentMargin/AlertRow/CollapseButton"

@export var collapsed := false:
	set(value):
		collapsed = value
		_sync_collapsed_state()

@export_range(42.0, 140.0, 1.0) var expanded_height := 96.0:
	set(value):
		expanded_height = value
		_sync_collapsed_state()

@export_range(36.0, 80.0, 1.0) var collapsed_height := 52.0:
	set(value):
		collapsed_height = value
		_sync_collapsed_state()


func _ready() -> void:
	clip_contents = true
	_wire_collapse_button()
	_wire_alerts()
	_sync_collapsed_state()


func _wire_alerts() -> void:
	var container := get_node_or_null(alert_container_path) as Container

	if container == null:
		push_warning("Alert bar cannot find alert container at %s." % alert_container_path)
		return

	for child in container.get_children():
		if child.has_signal("action_requested"):
			var callback := Callable(self, "_on_alert_action_requested")
			if not child.is_connected("action_requested", callback):
				child.connect("action_requested", callback)


func _wire_collapse_button() -> void:
	var button := get_node_or_null(collapse_button_path) as BaseButton
	if button == null:
		return

	if not button.pressed.is_connected(_on_collapse_button_pressed):
		button.pressed.connect(_on_collapse_button_pressed)


func _on_collapse_button_pressed() -> void:
	collapsed = not collapsed
	_sync_collapsed_state()


func _sync_collapsed_state() -> void:
	custom_minimum_size = Vector2(0.0, collapsed_height if collapsed else expanded_height)

	if not is_inside_tree():
		return

	clip_contents = true

	var alert_items := get_node_or_null(alert_container_path) as Control
	if alert_items != null:
		alert_items.visible = true
		alert_items.mouse_filter = Control.MOUSE_FILTER_IGNORE if collapsed else Control.MOUSE_FILTER_PASS
		for child in alert_items.get_children():
			if child is CanvasItem:
				(child as CanvasItem).visible = not collapsed

	var count_label := get_node_or_null("ContentMargin/AlertRow/AlertCountLabel") as Control
	if count_label != null:
		count_label.visible = not collapsed

	var button := get_node_or_null(collapse_button_path) as BaseButton
	if button != null:
		_set_property_if_available(button, "label_text", "^" if collapsed else "V")
		_set_property_if_available(button, "text", "")
		button.tooltip_text = "Expand alerts" if collapsed else "Collapse alerts"


func _on_alert_action_requested(action_name: String) -> void:
	alert_action_requested.emit(action_name)


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return
