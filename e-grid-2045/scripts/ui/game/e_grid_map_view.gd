@tool
extends PanelContainer
class_name EGridMapView

signal map_pressed(position: Vector2)

@export var accept_map_input := true


func _gui_input(event: InputEvent) -> void:
	if not accept_map_input:
		return

	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if mouse_event.button_index == MOUSE_BUTTON_LEFT and mouse_event.pressed:
			map_pressed.emit(mouse_event.position)
			accept_event()
