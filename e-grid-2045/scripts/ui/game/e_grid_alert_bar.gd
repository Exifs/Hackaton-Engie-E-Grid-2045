extends PanelContainer
class_name EGridAlertBar

signal alert_action_requested(action_name: String)

@export_node_path("Container") var alert_container_path: NodePath = ^"ContentMargin/AlertRow/AlertItems"


func _ready() -> void:
	_wire_alerts()


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


func _on_alert_action_requested(action_name: String) -> void:
	alert_action_requested.emit(action_name)
