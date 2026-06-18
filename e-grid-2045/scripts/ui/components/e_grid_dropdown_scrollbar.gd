@tool
class_name EGridDropdownScrollbar
extends Control

@export var scroll_container: ScrollContainer:
	set(value):
		if scroll_container == value:
			return
		_disconnect_scroll_signals()
		scroll_container = value
		_connect_scroll_signals()
		refresh()

@export var track_width := 4.0:
	set(value):
		track_width = value
		queue_redraw()

@export var min_grabber_height := 18.0:
	set(value):
		min_grabber_height = value
		queue_redraw()

@export var wheel_step_px := 44.0
@export var track_color := Color("#16363dcc")
@export var grabber_color := Color("#1fd0e2")
@export var grabber_hover_color := Color("#3af5ff")
@export var grabber_pressed_color := Color("#76fbff")

var _dragging := false
var _drag_offset_y := 0.0
var _hovering_grabber := false


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	focus_mode = Control.FOCUS_NONE
	_connect_scroll_signals()
	refresh()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		refresh()


func _draw() -> void:
	if not has_scroll_range():
		return

	var track_rect := _track_rect()
	var grabber_rect := _grabber_rect()
	draw_rect(track_rect, track_color, true)
	draw_rect(track_rect, Color("#2a555c99"), false, 1.0)
	draw_rect(grabber_rect, _grabber_draw_color(), true)
	draw_rect(grabber_rect, Color("#061013dd"), false, 1.0)


func _gui_input(event: InputEvent) -> void:
	if scroll_container == null or not has_scroll_range():
		return

	var mouse_button := event as InputEventMouseButton
	if mouse_button != null:
		if mouse_button.button_index == MOUSE_BUTTON_LEFT:
			if mouse_button.pressed:
				_begin_scroll_interaction(mouse_button.position.y)
			else:
				_dragging = false
				queue_redraw()
			accept_event()
			return

		if mouse_button.pressed and mouse_button.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			scroll_by_pixels(wheel_step_px)
			accept_event()
			return

		if mouse_button.pressed and mouse_button.button_index == MOUSE_BUTTON_WHEEL_UP:
			scroll_by_pixels(-wheel_step_px)
			accept_event()
			return

	var mouse_motion := event as InputEventMouseMotion
	if mouse_motion != null:
		_hovering_grabber = _grabber_rect().has_point(mouse_motion.position)
		if _dragging:
			_set_scroll_from_grabber_top(mouse_motion.position.y - _drag_offset_y)
			accept_event()
		queue_redraw()


func _input(event: InputEvent) -> void:
	if not _dragging:
		return

	var mouse_motion := event as InputEventMouseMotion
	if mouse_motion != null:
		_set_scroll_from_grabber_top(_local_y_from_viewport(mouse_motion.position) - _drag_offset_y)
		get_viewport().set_input_as_handled()
		return

	var mouse_button := event as InputEventMouseButton
	if mouse_button != null and mouse_button.button_index == MOUSE_BUTTON_LEFT and not mouse_button.pressed:
		_dragging = false
		queue_redraw()
		get_viewport().set_input_as_handled()


func refresh() -> void:
	visible = has_scroll_range()
	queue_redraw()


func has_scroll_range() -> bool:
	return _max_scroll() > 0.5


func get_scroll_ratio() -> float:
	var max_scroll := _max_scroll()
	if max_scroll <= 0.0 or scroll_container == null:
		return 0.0

	return clampf(float(scroll_container.scroll_vertical) / max_scroll, 0.0, 1.0)


func set_scroll_ratio(ratio: float) -> void:
	_set_scroll_value(_max_scroll() * clampf(ratio, 0.0, 1.0))


func scroll_by_pixels(pixel_delta: float) -> void:
	if scroll_container == null:
		return

	_set_scroll_value(float(scroll_container.scroll_vertical) + pixel_delta)


func _begin_scroll_interaction(local_y: float) -> void:
	var grabber_rect := _grabber_rect()
	_dragging = true

	if grabber_rect.has_point(Vector2(size.x * 0.5, local_y)):
		_drag_offset_y = local_y - grabber_rect.position.y
	else:
		_drag_offset_y = grabber_rect.size.y * 0.5
		_set_scroll_from_grabber_top(local_y - _drag_offset_y)

	queue_redraw()


func _set_scroll_from_grabber_top(grabber_top: float) -> void:
	var max_scroll := _max_scroll()
	if max_scroll <= 0.0:
		return

	var track_rect := _track_rect()
	var grabber_rect := _grabber_rect()
	var travel := maxf(track_rect.size.y - grabber_rect.size.y, 1.0)
	var ratio := clampf((grabber_top - track_rect.position.y) / travel, 0.0, 1.0)
	_set_scroll_value(max_scroll * ratio)


func _set_scroll_value(value: float) -> void:
	if scroll_container == null:
		return

	var next_value := clampf(value, 0.0, _max_scroll())
	scroll_container.scroll_vertical = int(roundf(next_value))

	var vbar := scroll_container.get_v_scroll_bar()
	if vbar != null:
		vbar.value = next_value

	queue_redraw()


func _track_rect() -> Rect2:
	var width := minf(track_width, maxf(size.x, track_width))
	return Rect2(Vector2((size.x - width) * 0.5, 0.0), Vector2(width, size.y))


func _grabber_rect() -> Rect2:
	var track_rect := _track_rect()
	var content_height := _content_height()
	var viewport_height := _viewport_height()
	var max_scroll := _max_scroll()

	if content_height <= 0.0 or viewport_height <= 0.0 or max_scroll <= 0.0:
		return track_rect

	var grabber_height := clampf(track_rect.size.y * viewport_height / content_height, min_grabber_height, track_rect.size.y)
	var travel := maxf(track_rect.size.y - grabber_height, 0.0)
	var grabber_y := track_rect.position.y + travel * get_scroll_ratio()
	return Rect2(Vector2(track_rect.position.x, grabber_y), Vector2(track_rect.size.x, grabber_height))


func _grabber_draw_color() -> Color:
	if _dragging:
		return grabber_pressed_color

	if _hovering_grabber:
		return grabber_hover_color

	return grabber_color


func _content_height() -> float:
	if scroll_container == null or scroll_container.get_child_count() <= 0:
		return 0.0

	var child := scroll_container.get_child(0) as Control
	if child == null:
		return 0.0

	return maxf(child.size.y, child.custom_minimum_size.y)


func _viewport_height() -> float:
	return scroll_container.size.y if scroll_container != null else 0.0


func _max_scroll() -> float:
	return maxf(_content_height() - _viewport_height(), 0.0)


func _local_y_from_viewport(viewport_position: Vector2) -> float:
	return (get_global_transform_with_canvas().affine_inverse() * viewport_position).y


func _connect_scroll_signals() -> void:
	if scroll_container == null:
		return

	var resize_call := Callable(self, "refresh")
	if not scroll_container.resized.is_connected(resize_call):
		scroll_container.resized.connect(resize_call)

	var vbar := scroll_container.get_v_scroll_bar()
	if vbar == null:
		return

	var value_call := Callable(self, "_on_scroll_value_changed")
	if not vbar.value_changed.is_connected(value_call):
		vbar.value_changed.connect(value_call)

	var changed_call := Callable(self, "refresh")
	if not vbar.changed.is_connected(changed_call):
		vbar.changed.connect(changed_call)


func _disconnect_scroll_signals() -> void:
	if scroll_container == null:
		return

	var resize_call := Callable(self, "refresh")
	if scroll_container.resized.is_connected(resize_call):
		scroll_container.resized.disconnect(resize_call)

	var vbar := scroll_container.get_v_scroll_bar()
	if vbar == null:
		return

	var value_call := Callable(self, "_on_scroll_value_changed")
	if vbar.value_changed.is_connected(value_call):
		vbar.value_changed.disconnect(value_call)

	var changed_call := Callable(self, "refresh")
	if vbar.changed.is_connected(changed_call):
		vbar.changed.disconnect(changed_call)


func _on_scroll_value_changed(_value: float) -> void:
	queue_redraw()
