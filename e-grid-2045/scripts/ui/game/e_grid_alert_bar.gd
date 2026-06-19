extends Control
class_name EGridAlertBar

signal alert_action_requested(action_name: String)
signal alert_region_requested(region_id: String)

const ALERT_ITEM_SCENE := preload("res://scenes/ui/game/e_grid_alert_item.tscn")

@export_node_path("Container") var alert_container_path: NodePath = ^"ContentMargin/AlertRow/AlertItems"
@export_node_path("BaseButton") var collapse_button_path: NodePath = ^"ContentMargin/AlertRow/CollapseButton"

@export var collapsed := false:
	set(value):
		collapsed = value
		_sync_collapsed_state()

@export_range(42.0, 140.0, 1.0) var expanded_height := 84.0:
	set(value):
		expanded_height = value
		_sync_collapsed_state()

@export_range(36.0, 80.0, 1.0) var collapsed_height := 48.0:
	set(value):
		collapsed_height = value
		_sync_collapsed_state()

var _alerts := []
var _alerts_signature := ""


func _ready() -> void:
	clip_contents = true
	_wire_collapse_button()
	_sync_alerts()
	_sync_collapsed_state()


func set_alerts(alerts: Array) -> void:
	var next_signature := _signature_for_alerts(alerts)
	if next_signature == _alerts_signature:
		return
	_alerts_signature = next_signature
	_alerts = alerts
	_sync_alerts()


func _signature_for_alerts(alerts: Array) -> String:
	var parts := PackedStringArray()
	for alert_variant in alerts:
		var alert: Dictionary = alert_variant
		parts.append("%s|%s|%s|%s" % [
			str(alert.get("title", "")),
			str(alert.get("body", "")),
			str(alert.get("region_id", "")),
			str(alert.get("state", "")),
		])
	return "~".join(parts)


func _sync_alerts() -> void:
	if not is_inside_tree():
		return

	var container := get_node_or_null(alert_container_path) as Container
	if container == null:
		push_warning("Alert bar cannot find alert container at %s." % alert_container_path)
		return

	for child in container.get_children():
		child.queue_free()

	for alert_variant in _alerts:
		var alert: Dictionary = alert_variant
		var item := ALERT_ITEM_SCENE.instantiate()
		container.add_child(item)
		item.set("title_text", str(alert.get("title", "ALERT")))
		item.set("body_text", str(alert.get("body", "")))
		item.set("action_name", str(alert.get("region_id", "")))
		item.set("alert_state", str(alert.get("state", "power_warning")))
		item.set("action_text", "VIEW" if not str(alert.get("region_id", "")).is_empty() else "INFO")
		if item.has_signal("action_requested"):
			var callback := Callable(self, "_on_alert_action_requested")
			if not item.is_connected("action_requested", callback):
				item.connect("action_requested", callback)

	var count_label := get_node_or_null("ContentMargin/AlertRow/AlertCountLabel") as Label
	if count_label != null:
		count_label.text = "%d ALERTS" % _alerts.size()


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
		alert_items.visible = not collapsed

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
	if not action_name.is_empty():
		alert_region_requested.emit(action_name)


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return

