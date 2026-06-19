extends Control
class_name EGridBuildCategoryFrame


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		queue_redraw()


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size).grow(-1.0)
	if rect.size.x <= 10.0 or rect.size.y <= 10.0:
		return

	_draw_closed_polyline(_clipped_rect_points(rect, 7.0), Color("#020608e2"), 2.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-1.0), 6.0), Color("#50676dcc"), 1.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-5.0), 4.0), Color("#132a2fa8"), 1.0)
	_draw_edge_rails(rect)
	_draw_corner_marks(rect)
	_draw_primary_divider(rect)


func _draw_edge_rails(rect: Rect2) -> void:
	var rail_width := maxf(rect.size.x - 34.0, 0.0)
	if rail_width <= 0.0:
		return

	draw_rect(Rect2(rect.position + Vector2(17.0, 4.0), Vector2(rail_width, 1.0)), Color("#6f8c9290"), true)
	draw_rect(Rect2(Vector2(rect.position.x + 17.0, rect.end.y - 5.0), Vector2(rail_width, 1.0)), Color("#020608c0"), true)


func _draw_corner_marks(rect: Rect2) -> void:
	var arm := 12.0
	var inset := 7.0
	var color := Color("#89a8ad86")

	draw_line(rect.position + Vector2(inset, 3.0), rect.position + Vector2(inset + arm, 3.0), color, 1.0, true)
	draw_line(rect.position + Vector2(3.0, inset), rect.position + Vector2(3.0, inset + arm), color, 1.0, true)
	draw_line(Vector2(rect.end.x - inset - arm, rect.position.y + 3.0), Vector2(rect.end.x - inset, rect.position.y + 3.0), color, 1.0, true)
	draw_line(Vector2(rect.end.x - 3.0, rect.position.y + inset), Vector2(rect.end.x - 3.0, rect.position.y + inset + arm), color, 1.0, true)
	draw_line(Vector2(rect.position.x + inset, rect.end.y - 3.0), Vector2(rect.position.x + inset + arm, rect.end.y - 3.0), color, 1.0, true)
	draw_line(Vector2(rect.position.x + 3.0, rect.end.y - inset - arm), Vector2(rect.position.x + 3.0, rect.end.y - inset), color, 1.0, true)
	draw_line(Vector2(rect.end.x - inset - arm, rect.end.y - 3.0), Vector2(rect.end.x - inset, rect.end.y - 3.0), color, 1.0, true)
	draw_line(Vector2(rect.end.x - 3.0, rect.end.y - inset - arm), Vector2(rect.end.x - 3.0, rect.end.y - inset), color, 1.0, true)


func _draw_primary_divider(rect: Rect2) -> void:
	var x := rect.position.x + 72.0
	if x >= rect.end.x - 40.0:
		return

	draw_line(Vector2(x, rect.position.y + 14.0), Vector2(x, rect.end.y - 14.0), Color("#29434a72"), 1.0, true)


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
