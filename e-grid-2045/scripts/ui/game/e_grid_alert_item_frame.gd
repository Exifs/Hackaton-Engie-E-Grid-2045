extends Control
class_name EGridAlertItemFrame

@export_enum("power_warning", "critical", "cooling_warning", "research_success", "market_info", "disabled") var alert_state := "power_warning":
	set(value):
		alert_state = value
		queue_redraw()


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		queue_redraw()


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size).grow(-1.0)
	if rect.size.x <= 10.0 or rect.size.y <= 10.0:
		return

	var accent := _accent_color()
	var points := _clipped_rect_points(rect, 5.0)
	draw_colored_polygon(points, Color(accent.r * 0.08, accent.g * 0.08, accent.b * 0.08, 0.12))
	_draw_closed_polyline(points, Color("#020608e0"), 2.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-1.0), 4.0), Color(accent.r, accent.g, accent.b, 0.42), 1.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-5.0), 3.0), Color("#1c30368a"), 1.0)
	_draw_corner_marks(rect, accent)
	_draw_accent_bar(rect, accent)


func _draw_corner_marks(rect: Rect2, accent: Color) -> void:
	var arm := 13.0
	var inset := 8.0
	var color := Color(accent.r, accent.g, accent.b, 0.52)

	draw_line(rect.position + Vector2(inset, 3.0), rect.position + Vector2(inset + arm, 3.0), color, 1.0, true)
	draw_line(rect.position + Vector2(3.0, inset), rect.position + Vector2(3.0, inset + arm), color, 1.0, true)
	draw_line(Vector2(rect.end.x - inset - arm, rect.position.y + 3.0), Vector2(rect.end.x - inset, rect.position.y + 3.0), color, 1.0, true)
	draw_line(Vector2(rect.end.x - 3.0, rect.position.y + inset), Vector2(rect.end.x - 3.0, rect.position.y + inset + arm), color, 1.0, true)
	draw_line(Vector2(rect.position.x + inset, rect.end.y - 3.0), Vector2(rect.position.x + inset + arm, rect.end.y - 3.0), color, 1.0, true)
	draw_line(Vector2(rect.end.x - inset - arm, rect.end.y - 3.0), Vector2(rect.end.x - inset, rect.end.y - 3.0), color, 1.0, true)


func _draw_accent_bar(rect: Rect2, accent: Color) -> void:
	draw_rect(Rect2(rect.position + Vector2(10.0, rect.size.y - 4.0), Vector2(maxf(rect.size.x - 20.0, 0.0), 1.0)), Color(accent.r, accent.g, accent.b, 0.58), true)
	draw_rect(Rect2(rect.position + Vector2(4.0, 11.0), Vector2(1.0, maxf(rect.size.y - 22.0, 0.0))), Color(accent.r, accent.g, accent.b, 0.24), true)


func _accent_color() -> Color:
	match alert_state:
		"research_success":
			return Color("#42b9e6")
		"market_info":
			return Color("#89999c")
		"critical":
			return Color("#e2c64a")
		_:
			return Color("#ee5824")


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
