extends Control
class_name EGridTopBarChrome

const SEGMENT_GROUPS := [
	[
		^"ContentMargin/MainRow/BrandSegment",
	],
	[
		^"ContentMargin/MainRow/ProgressSegment",
		^"ContentMargin/MainRow/DividerProgress",
		^"ContentMargin/MainRow/BudgetSegment",
		^"ContentMargin/MainRow/DividerBudget",
		^"ContentMargin/MainRow/DateSegment",
		^"ContentMargin/MainRow/DividerDate",
		^"ContentMargin/MainRow/SpeedSegment",
	],
	[
		^"ContentMargin/MainRow/MenuSegment",
	],
]


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	call_deferred("queue_redraw")


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		queue_redraw()


func _draw() -> void:
	var owner_node := get_parent() as Control
	if owner_node == null:
		return

	for group in SEGMENT_GROUPS:
		var rect := _group_rect(owner_node, group)
		if rect.size.x <= 0.0 or rect.size.y <= 0.0:
			continue
		_draw_segment(rect.grow(2.0))


func _group_rect(owner_node: Control, paths: Array) -> Rect2:
	var result := Rect2()
	var has_rect := false

	for path in paths:
		var node := owner_node.get_node_or_null(path) as Control
		if node == null:
			continue

		var global_rect := node.get_global_rect()
		var local_position := get_global_transform_with_canvas().affine_inverse() * global_rect.position
		var local_rect := Rect2(local_position, global_rect.size)
		if not has_rect:
			result = local_rect
			has_rect = true
		else:
			result = result.merge(local_rect)

	if not has_rect:
		return Rect2()

	result.position.y = 6.0
	result.size.y = maxf(size.y - 12.0, 0.0)
	return result


func _draw_segment(rect: Rect2) -> void:
	if rect.size.x <= 10.0 or rect.size.y <= 10.0:
		return

	var clipped := _clipped_rect_points(rect, 9.0)
	var inner := rect.grow(-5.0)
	draw_colored_polygon(clipped, Color("#06101486"))
	_draw_closed_polyline(clipped, Color("#020609de"), 2.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-1.0), 8.0), Color("#31464bc0"), 1.0)
	_draw_closed_polyline(_clipped_rect_points(inner, 6.0), Color("#162b30a8"), 1.0)
	_draw_rails(rect)
	_draw_corner_plates(rect)


func _draw_rails(rect: Rect2) -> void:
	var rail_width := maxf(rect.size.x - 34.0, 0.0)
	if rail_width <= 0.0:
		return

	draw_rect(Rect2(rect.position + Vector2(17.0, 4.0), Vector2(rail_width, 2.0)), Color("#020608b8"), true)
	draw_rect(Rect2(rect.position + Vector2(18.0, 7.0), Vector2(rail_width - 2.0, 1.0)), Color("#2d464d78"), true)
	draw_rect(Rect2(Vector2(rect.position.x + 18.0, rect.end.y - 8.0), Vector2(rail_width - 2.0, 1.0)), Color("#283f4570"), true)
	draw_rect(Rect2(Vector2(rect.position.x + 17.0, rect.end.y - 5.0), Vector2(rail_width, 2.0)), Color("#020608aa"), true)


func _draw_corner_plates(rect: Rect2) -> void:
	var cap := minf(30.0, minf(rect.size.x, rect.size.y) * 0.42)
	if cap <= 12.0:
		return

	var x := rect.position.x
	var y := rect.position.y
	var ex := rect.end.x
	var ey := rect.end.y
	var fill := Color("#02070bb8")
	var edge := Color("#6e8a8f76")

	draw_colored_polygon(PackedVector2Array([
		Vector2(x + 1.0, y + 10.0),
		Vector2(x + 10.0, y + 1.0),
		Vector2(x + cap, y + 1.0),
		Vector2(x + cap - 8.0, y + 6.0),
		Vector2(x + 15.0, y + 6.0),
		Vector2(x + 6.0, y + 15.0),
		Vector2(x + 6.0, y + cap - 8.0),
		Vector2(x + 1.0, y + cap),
	]), fill)
	draw_colored_polygon(PackedVector2Array([
		Vector2(ex - 10.0, y + 1.0),
		Vector2(ex - 1.0, y + 10.0),
		Vector2(ex - 1.0, y + cap),
		Vector2(ex - 6.0, y + cap - 8.0),
		Vector2(ex - 6.0, y + 15.0),
		Vector2(ex - 15.0, y + 6.0),
		Vector2(ex - cap + 8.0, y + 6.0),
		Vector2(ex - cap, y + 1.0),
	]), fill)
	draw_colored_polygon(PackedVector2Array([
		Vector2(x + 1.0, ey - 10.0),
		Vector2(x + 6.0, ey - cap + 8.0),
		Vector2(x + 6.0, ey - 15.0),
		Vector2(x + 15.0, ey - 6.0),
		Vector2(x + cap - 8.0, ey - 6.0),
		Vector2(x + cap, ey - 1.0),
		Vector2(x + 10.0, ey - 1.0),
		Vector2(x + 1.0, ey - 10.0),
	]), fill)
	draw_colored_polygon(PackedVector2Array([
		Vector2(ex - 1.0, ey - 10.0),
		Vector2(ex - 10.0, ey - 1.0),
		Vector2(ex - cap, ey - 1.0),
		Vector2(ex - cap + 8.0, ey - 6.0),
		Vector2(ex - 15.0, ey - 6.0),
		Vector2(ex - 6.0, ey - 15.0),
		Vector2(ex - 6.0, ey - cap + 8.0),
		Vector2(ex - 1.0, ey - cap),
	]), fill)

	draw_line(Vector2(x + 11.0, y + 3.0), Vector2(x + cap - 5.0, y + 3.0), edge, 1.0, true)
	draw_line(Vector2(ex - cap + 5.0, y + 3.0), Vector2(ex - 11.0, y + 3.0), edge, 1.0, true)
	draw_line(Vector2(x + 11.0, ey - 3.0), Vector2(x + cap - 5.0, ey - 3.0), edge, 1.0, true)
	draw_line(Vector2(ex - cap + 5.0, ey - 3.0), Vector2(ex - 11.0, ey - 3.0), edge, 1.0, true)


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
