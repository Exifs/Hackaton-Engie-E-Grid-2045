@tool
class_name EGridPanelOuterChrome
extends Control

@export var corner_size := 12.0:
	set(value):
		corner_size = value
		queue_redraw()
@export var inner_inset := 6.0:
	set(value):
		inner_inset = value
		queue_redraw()
@export var outer_line_color := Color("#3b4b50d8"):
	set(value):
		outer_line_color = value
		queue_redraw()
@export var inner_line_color := Color("#182b30d4"):
	set(value):
		inner_line_color = value
		queue_redraw()
@export var corner_accent_color := Color("#88a4a9a0"):
	set(value):
		corner_accent_color = value
		queue_redraw()


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw.call_deferred()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		queue_redraw()


func _draw() -> void:
	if size.x <= 18.0 or size.y <= 18.0:
		return

	var outer_rect := Rect2(Vector2.ZERO, size).grow(-1.0)
	var inner_rect := outer_rect.grow(-inner_inset)
	_draw_corner_caps(outer_rect)
	_draw_edge_bands(outer_rect)
	_draw_closed_polyline(_clipped_rect_points(outer_rect, corner_size), Color("#020608ee"), 2.0)
	_draw_closed_polyline(_clipped_rect_points(outer_rect.grow(-1.0), maxf(corner_size - 1.0, 2.0)), outer_line_color, 1.0)
	_draw_closed_polyline(_clipped_rect_points(inner_rect, maxf(corner_size - 4.0, 2.0)), inner_line_color, 1.0)
	_draw_corner_marks(outer_rect)


func _draw_edge_bands(rect: Rect2) -> void:
	var horizontal_width := maxf(rect.size.x - 48.0, 0.0)
	var vertical_height := maxf(rect.size.y - 48.0, 0.0)
	if horizontal_width > 0.0:
		draw_rect(Rect2(rect.position + Vector2(24.0, 3.0), Vector2(horizontal_width, 3.0)), Color("#0206098a"), true)
		draw_rect(Rect2(rect.position + Vector2(24.0, 7.0), Vector2(horizontal_width, 1.0)), Color("#2b414794"), true)
		draw_rect(Rect2(Vector2(rect.position.x + 24.0, rect.end.y - 7.0), Vector2(horizontal_width, 1.0)), Color("#23363b82"), true)
		draw_rect(Rect2(Vector2(rect.position.x + 24.0, rect.end.y - 5.0), Vector2(horizontal_width, 3.0)), Color("#020608a8"), true)
	if vertical_height > 0.0:
		draw_rect(Rect2(rect.position + Vector2(3.0, 24.0), Vector2(3.0, vertical_height)), Color("#02060986"), true)
		draw_rect(Rect2(rect.position + Vector2(7.0, 24.0), Vector2(1.0, vertical_height)), Color("#2b41476e"), true)
		draw_rect(Rect2(Vector2(rect.end.x - 7.0, rect.position.y + 24.0), Vector2(1.0, vertical_height)), Color("#23363b70"), true)
		draw_rect(Rect2(Vector2(rect.end.x - 5.0, rect.position.y + 24.0), Vector2(3.0, vertical_height)), Color("#020608a0"), true)


func _draw_corner_caps(rect: Rect2) -> void:
	var cap := minf(44.0, minf(rect.size.x, rect.size.y) * 0.42)
	if cap <= 16.0:
		return

	var x := rect.position.x
	var y := rect.position.y
	var ex := rect.end.x
	var ey := rect.end.y
	var fill := Color("#02070bd0")
	var edge := Color("#2d424890")

	draw_colored_polygon(PackedVector2Array([
		Vector2(x + 1.0, y + 14.0),
		Vector2(x + 14.0, y + 1.0),
		Vector2(x + cap, y + 1.0),
		Vector2(x + cap - 11.0, y + 7.0),
		Vector2(x + 18.0, y + 7.0),
		Vector2(x + 7.0, y + 18.0),
		Vector2(x + 7.0, y + cap - 11.0),
		Vector2(x + 1.0, y + cap),
	]), fill)
	draw_colored_polygon(PackedVector2Array([
		Vector2(ex - 14.0, y + 1.0),
		Vector2(ex - 1.0, y + 14.0),
		Vector2(ex - 1.0, y + cap),
		Vector2(ex - 7.0, y + cap - 11.0),
		Vector2(ex - 7.0, y + 18.0),
		Vector2(ex - 18.0, y + 7.0),
		Vector2(ex - cap + 11.0, y + 7.0),
		Vector2(ex - cap, y + 1.0),
	]), fill)
	draw_colored_polygon(PackedVector2Array([
		Vector2(x + 1.0, ey - 14.0),
		Vector2(x + 7.0, ey - cap + 11.0),
		Vector2(x + 7.0, ey - 18.0),
		Vector2(x + 18.0, ey - 7.0),
		Vector2(x + cap - 11.0, ey - 7.0),
		Vector2(x + cap, ey - 1.0),
		Vector2(x + 14.0, ey - 1.0),
		Vector2(x + 1.0, ey - 14.0),
	]), fill)
	draw_colored_polygon(PackedVector2Array([
		Vector2(ex - 1.0, ey - 14.0),
		Vector2(ex - 14.0, ey - 1.0),
		Vector2(ex - cap, ey - 1.0),
		Vector2(ex - cap + 11.0, ey - 7.0),
		Vector2(ex - 18.0, ey - 7.0),
		Vector2(ex - 7.0, ey - 18.0),
		Vector2(ex - 7.0, ey - cap + 11.0),
		Vector2(ex - 1.0, ey - cap),
	]), fill)

	draw_line(Vector2(x + 15.0, y + 3.0), Vector2(x + cap - 8.0, y + 3.0), edge, 1.0, true)
	draw_line(Vector2(ex - cap + 8.0, y + 3.0), Vector2(ex - 15.0, y + 3.0), edge, 1.0, true)
	draw_line(Vector2(x + 15.0, ey - 3.0), Vector2(x + cap - 8.0, ey - 3.0), edge, 1.0, true)
	draw_line(Vector2(ex - cap + 8.0, ey - 3.0), Vector2(ex - 15.0, ey - 3.0), edge, 1.0, true)


func _draw_corner_marks(rect: Rect2) -> void:
	var arm := 17.0
	var inset := 8.0
	draw_line(rect.position + Vector2(inset, 3.0), rect.position + Vector2(inset + arm, 3.0), corner_accent_color, 1.0, true)
	draw_line(rect.position + Vector2(3.0, inset), rect.position + Vector2(3.0, inset + arm), corner_accent_color, 1.0, true)
	draw_line(Vector2(rect.end.x - inset - arm, rect.position.y + 3.0), Vector2(rect.end.x - inset, rect.position.y + 3.0), corner_accent_color, 1.0, true)
	draw_line(Vector2(rect.end.x - 3.0, rect.position.y + inset), Vector2(rect.end.x - 3.0, rect.position.y + inset + arm), corner_accent_color, 1.0, true)
	draw_line(Vector2(rect.position.x + inset, rect.end.y - 3.0), Vector2(rect.position.x + inset + arm, rect.end.y - 3.0), corner_accent_color, 1.0, true)
	draw_line(Vector2(rect.position.x + 3.0, rect.end.y - inset - arm), Vector2(rect.position.x + 3.0, rect.end.y - inset), corner_accent_color, 1.0, true)
	draw_line(Vector2(rect.end.x - inset - arm, rect.end.y - 3.0), Vector2(rect.end.x - inset, rect.end.y - 3.0), corner_accent_color, 1.0, true)
	draw_line(Vector2(rect.end.x - 3.0, rect.end.y - inset - arm), Vector2(rect.end.x - 3.0, rect.end.y - inset), corner_accent_color, 1.0, true)


func _clipped_rect_points(rect: Rect2, clip_size: float) -> PackedVector2Array:
	var corner := minf(clip_size, minf(rect.size.x, rect.size.y) * 0.5)
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
