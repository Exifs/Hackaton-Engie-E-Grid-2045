@tool
class_name EGridChevronButton
extends Button

@export_enum("down", "up", "left", "right") var direction := "down":
	set(value):
		direction = value
		queue_redraw()

@export_range(1, 3, 1) var chevron_count := 2:
	set(value):
		chevron_count = clampi(value, 1, 3)
		queue_redraw()

@export var label_text := "V":
	set(value):
		label_text = value
		var parsed_direction := _direction_from_label(value)
		if not parsed_direction.is_empty():
			direction = parsed_direction
		queue_redraw()

@export var accent_color := Color("#1fd0e2")
@export var icon_color := Color("#dbe7e9e8")
@export var disabled_icon_color := Color("#53666bd0")


func _ready() -> void:
	text = ""
	flat = true
	focus_mode = Control.FOCUS_ALL
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_install_empty_button_styles()
	_connect_redraw_signals()


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size).grow(-1.0)
	if rect.size.x <= 8.0 or rect.size.y <= 8.0:
		return

	var hovered := is_hovered() or has_focus()
	var pressed := button_pressed
	var fill_color := _fill_color(hovered, pressed)
	var border_color := _border_color(hovered, pressed)
	var points := _clipped_rect_points(rect, 6.0)

	draw_colored_polygon(points, fill_color)
	_draw_closed_polyline(points, Color("#020608e8"), 2.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-1.0), 5.0), border_color, 1.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-5.0), 3.0), Color("#183037a8"), 1.0)
	_draw_grip_rails(rect, hovered, pressed)
	_draw_chevrons(rect.grow(-9.0), _current_icon_color(pressed), pressed)


func _install_empty_button_styles() -> void:
	add_theme_stylebox_override("normal", StyleBoxEmpty.new())
	add_theme_stylebox_override("hover", StyleBoxEmpty.new())
	add_theme_stylebox_override("pressed", StyleBoxEmpty.new())
	add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	add_theme_stylebox_override("disabled", StyleBoxEmpty.new())


func _connect_redraw_signals() -> void:
	var redraw_call := Callable(self, "_request_redraw")

	if not mouse_entered.is_connected(redraw_call):
		mouse_entered.connect(redraw_call)
	if not mouse_exited.is_connected(redraw_call):
		mouse_exited.connect(redraw_call)
	if not focus_entered.is_connected(redraw_call):
		focus_entered.connect(redraw_call)
	if not focus_exited.is_connected(redraw_call):
		focus_exited.connect(redraw_call)
	if not button_down.is_connected(redraw_call):
		button_down.connect(redraw_call)
	if not button_up.is_connected(redraw_call):
		button_up.connect(redraw_call)
	if not toggled.is_connected(_on_toggled):
		toggled.connect(_on_toggled)


func _fill_color(hovered: bool, pressed: bool) -> Color:
	if disabled:
		return Color("#070d10dc")
	if pressed:
		return Color("#0e3139f0")
	if hovered:
		return Color("#0b1d23ee")
	return Color("#071014ec")


func _border_color(hovered: bool, pressed: bool) -> Color:
	if disabled:
		return Color("#27333788")
	if pressed:
		return Color(accent_color, 0.95)
	if hovered:
		return Color("#3b7580dc")
	return Color("#34464bc0")


func _current_icon_color(pressed: bool) -> Color:
	if disabled:
		return disabled_icon_color
	if pressed:
		return Color("#effeff")
	return icon_color


func _draw_grip_rails(rect: Rect2, hovered: bool, pressed: bool) -> void:
	var glow := Color(accent_color, 0.34 if hovered or pressed else 0.16)
	var edge := Color("#5d777d70")
	var shadow := Color("#020608c8")

	if direction == "up" or direction == "down":
		var center_x := rect.get_center().x
		draw_line(Vector2(center_x - 10.0, rect.position.y + 5.0), Vector2(center_x + 10.0, rect.position.y + 5.0), shadow, 2.0, true)
		draw_line(Vector2(center_x - 8.0, rect.position.y + 8.0), Vector2(center_x + 8.0, rect.position.y + 8.0), edge, 1.0, true)
		draw_line(Vector2(center_x - 8.0, rect.end.y - 8.0), Vector2(center_x + 8.0, rect.end.y - 8.0), edge, 1.0, true)
		draw_line(Vector2(center_x - 10.0, rect.end.y - 5.0), Vector2(center_x + 10.0, rect.end.y - 5.0), shadow, 2.0, true)
		draw_rect(Rect2(Vector2(rect.position.x + 4.0, rect.position.y + 16.0), Vector2(1.0, maxf(rect.size.y - 32.0, 0.0))), glow, true)
		draw_rect(Rect2(Vector2(rect.end.x - 5.0, rect.position.y + 16.0), Vector2(1.0, maxf(rect.size.y - 32.0, 0.0))), glow, true)
	else:
		var center_y := rect.get_center().y
		draw_line(Vector2(rect.position.x + 5.0, center_y - 10.0), Vector2(rect.position.x + 5.0, center_y + 10.0), shadow, 2.0, true)
		draw_line(Vector2(rect.position.x + 8.0, center_y - 8.0), Vector2(rect.position.x + 8.0, center_y + 8.0), edge, 1.0, true)
		draw_line(Vector2(rect.end.x - 8.0, center_y - 8.0), Vector2(rect.end.x - 8.0, center_y + 8.0), edge, 1.0, true)
		draw_line(Vector2(rect.end.x - 5.0, center_y - 10.0), Vector2(rect.end.x - 5.0, center_y + 10.0), shadow, 2.0, true)


func _draw_chevrons(rect: Rect2, color: Color, pressed: bool) -> void:
	var count := clampi(chevron_count, 1, 3)
	var vertical := direction == "up" or direction == "down"
	var step := 9.0
	var total_span := step * float(count - 1)
	var center := rect.get_center()

	for index in range(count):
		var offset := float(index) * step - total_span * 0.5
		var chevron_center := center
		if vertical:
			chevron_center.y += offset + (1.0 if pressed else 0.0)
		else:
			chevron_center.x += offset + (1.0 if pressed else 0.0)
		_draw_single_chevron(chevron_center, color)


func _draw_single_chevron(center: Vector2, color: Color) -> void:
	var width := 15.0
	var height := 8.0
	var points: PackedVector2Array

	match direction:
		"up":
			points = PackedVector2Array([
				center + Vector2(-width * 0.5, height * 0.35),
				center + Vector2(0.0, -height * 0.5),
				center + Vector2(width * 0.5, height * 0.35),
			])
		"left":
			points = PackedVector2Array([
				center + Vector2(width * 0.35, -height * 0.5),
				center + Vector2(-width * 0.5, 0.0),
				center + Vector2(width * 0.35, height * 0.5),
			])
		"right":
			points = PackedVector2Array([
				center + Vector2(-width * 0.35, -height * 0.5),
				center + Vector2(width * 0.5, 0.0),
				center + Vector2(-width * 0.35, height * 0.5),
			])
		_:
			points = PackedVector2Array([
				center + Vector2(-width * 0.5, -height * 0.35),
				center + Vector2(0.0, height * 0.5),
				center + Vector2(width * 0.5, -height * 0.35),
			])

	draw_polyline(points, Color("#020608b8"), 4.0, true)
	draw_polyline(points, color, 2.0, true)


func _direction_from_label(value: String) -> String:
	var normalized := value.strip_edges().to_upper()
	match normalized:
		"V", "DOWN":
			return "down"
		"^", "UP":
			return "up"
		"<", "LEFT":
			return "left"
		">", "RIGHT":
			return "right"
		_:
			return ""


func _clipped_rect_points(rect: Rect2, corner_size: float) -> PackedVector2Array:
	var corner := minf(corner_size, minf(rect.size.x, rect.size.y) * 0.5)
	return PackedVector2Array([
		Vector2(rect.position.x + corner, rect.position.y),
		Vector2(rect.end.x - corner, rect.position.y),
		Vector2(rect.end.x, rect.position.y + corner),
		Vector2(rect.end.x, rect.end.y - corner),
		Vector2(rect.end.x - corner, rect.end.y),
		Vector2(rect.position.x + corner, rect.end.y),
		Vector2(rect.position.x, rect.end.y - corner),
		Vector2(rect.position.x, rect.position.y + corner),
	])


func _draw_closed_polyline(points: PackedVector2Array, color: Color, width: float) -> void:
	var closed_points := PackedVector2Array(points)
	if closed_points.size() > 0:
		closed_points.append(closed_points[0])
	draw_polyline(closed_points, color, width, true)


func _request_redraw() -> void:
	queue_redraw()


func _on_toggled(_pressed: bool) -> void:
	queue_redraw()
