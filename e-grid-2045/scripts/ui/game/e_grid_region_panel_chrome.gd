extends Control
class_name EGridRegionPanelChrome

const SLOT_SECTION_PATHS := [
	^"ContentMargin/PanelStack/TabPages/Overview/BuildingSlotsHeader",
	^"ContentMargin/PanelStack/TabPages/Overview/BuildingSlotsGrid",
]

const STAT_PATHS := [
	^"ContentMargin/PanelStack/TabPages/Overview/EnergyStatus",
	^"ContentMargin/PanelStack/TabPages/Overview/CoolingStatus",
	^"ContentMargin/PanelStack/TabPages/Overview/ComputeStatus",
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

	var slots_rect := _group_rect(owner_node, SLOT_SECTION_PATHS)
	if slots_rect.size.x > 0.0 and slots_rect.size.y > 0.0:
		_draw_section_frame(slots_rect.grow_individual(0.0, 3.0, 0.0, 5.0))

	for path in STAT_PATHS:
		var stat := owner_node.get_node_or_null(path) as Control
		if stat == null or not stat.visible:
			continue
		_draw_stat_separator(_local_rect(stat).grow_individual(0.0, 3.0, 0.0, 2.0))


func _group_rect(owner_node: Control, paths: Array) -> Rect2:
	var result := Rect2()
	var has_rect := false

	for path in paths:
		var node := owner_node.get_node_or_null(path) as Control
		if node == null or not node.visible:
			continue

		var local_rect := _local_rect(node)
		if not has_rect:
			result = local_rect
			has_rect = true
		else:
			result = result.merge(local_rect)

	return result if has_rect else Rect2()


func _local_rect(node: Control) -> Rect2:
	var global_rect := node.get_global_rect()
	var local_position := get_global_transform_with_canvas().affine_inverse() * global_rect.position
	return Rect2(local_position, global_rect.size)


func _draw_section_frame(rect: Rect2) -> void:
	var points := _clipped_rect_points(rect, 6.0)
	draw_colored_polygon(points, Color("#04101444"))
	_draw_closed_polyline(points, Color("#020608c8"), 2.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-1.0), 5.0), Color("#3c565db0"), 1.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-5.0), 3.0), Color("#13282e8c"), 1.0)

	var rail_width := maxf(rect.size.x - 32.0, 0.0)
	if rail_width > 0.0:
		draw_rect(Rect2(rect.position + Vector2(16.0, 5.0), Vector2(rail_width, 1.0)), Color("#6c878c66"), true)
		draw_rect(Rect2(Vector2(rect.position.x + 16.0, rect.end.y - 5.0), Vector2(rail_width, 1.0)), Color("#020608aa"), true)


func _draw_stat_separator(rect: Rect2) -> void:
	if rect.size.x <= 0.0 or rect.size.y <= 0.0:
		return

	draw_line(rect.position, Vector2(rect.end.x, rect.position.y), Color("#39505782"), 1.0, true)
	draw_line(Vector2(rect.position.x, rect.end.y), rect.end, Color("#020608a8"), 1.0, true)


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
