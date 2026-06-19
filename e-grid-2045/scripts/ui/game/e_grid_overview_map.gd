extends Control
class_name EGridOverviewMap

const REGION_POLYGONS := [
	[
		Vector2(0.13, 0.44),
		Vector2(0.19, 0.31),
		Vector2(0.28, 0.29),
		Vector2(0.33, 0.41),
		Vector2(0.28, 0.55),
		Vector2(0.18, 0.58),
	],
	[
		Vector2(0.29, 0.41),
		Vector2(0.38, 0.29),
		Vector2(0.50, 0.35),
		Vector2(0.55, 0.51),
		Vector2(0.48, 0.66),
		Vector2(0.34, 0.62),
	],
	[
		Vector2(0.51, 0.35),
		Vector2(0.64, 0.29),
		Vector2(0.76, 0.40),
		Vector2(0.73, 0.57),
		Vector2(0.57, 0.60),
	],
	[
		Vector2(0.58, 0.58),
		Vector2(0.72, 0.60),
		Vector2(0.81, 0.73),
		Vector2(0.70, 0.82),
		Vector2(0.55, 0.74),
	],
	[
		Vector2(0.38, 0.64),
		Vector2(0.47, 0.68),
		Vector2(0.54, 0.83),
		Vector2(0.44, 0.88),
		Vector2(0.34, 0.75),
	],
	[
		Vector2(0.35, 0.16),
		Vector2(0.48, 0.10),
		Vector2(0.60, 0.18),
		Vector2(0.55, 0.30),
		Vector2(0.43, 0.29),
	],
]

const NETWORK_NODES := [
	{"point": Vector2(0.18, 0.47), "tier": 1},
	{"point": Vector2(0.29, 0.39), "tier": 1},
	{"point": Vector2(0.37, 0.50), "tier": 2},
	{"point": Vector2(0.47, 0.39), "tier": 1},
	{"point": Vector2(0.56, 0.48), "tier": 2},
	{"point": Vector2(0.66, 0.42), "tier": 1},
	{"point": Vector2(0.73, 0.55), "tier": 1},
	{"point": Vector2(0.28, 0.62), "tier": 1},
	{"point": Vector2(0.41, 0.66), "tier": 1},
	{"point": Vector2(0.53, 0.70), "tier": 1},
	{"point": Vector2(0.67, 0.72), "tier": 1},
	{"point": Vector2(0.45, 0.22), "tier": 1},
	{"point": Vector2(0.57, 0.25), "tier": 1},
	{"point": Vector2(0.47, 0.80), "tier": 1},
]

const POWER_LINKS := [
	[0, 1, -4.0],
	[1, 2, 5.0],
	[2, 4, -7.0],
	[4, 5, 5.0],
	[4, 8, 4.0],
	[8, 9, -5.0],
	[9, 10, 3.0],
]

const DATA_LINKS := [
	[1, 3, -5.0],
	[3, 4, 4.0],
	[4, 6, -7.0],
	[2, 8, 3.0],
	[3, 11, -4.0],
	[11, 12, 3.0],
	[8, 13, 4.0],
]

const CONGESTION_LINKS := [
	[0, 7, 3.0],
	[5, 6, -3.0],
	[9, 13, -4.0],
]

@export var grid_color := Color(0.073, 0.267, 0.31, 0.30):
	set(value):
		grid_color = value
		queue_redraw()

@export var map_fill_color := Color(0.035, 0.19, 0.18, 0.64):
	set(value):
		map_fill_color = value
		queue_redraw()

@export var map_line_color := Color(0.15, 0.93, 0.86, 0.68):
	set(value):
		map_line_color = value
		queue_redraw()


func _ready() -> void:
	custom_minimum_size = Vector2(166.0, 104.0)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		queue_redraw()


func _draw() -> void:
	if size.x <= 1.0 or size.y <= 1.0:
		return

	var map_rect := Rect2(Vector2(6.0, 6.0), size - Vector2(12.0, 12.0))
	_draw_background_grid(map_rect)
	_draw_sea_routes(map_rect)
	_draw_map_shape(map_rect)
	_draw_network_links(map_rect)
	_draw_nodes(map_rect)


func _draw_background_grid(map_rect: Rect2) -> void:
	draw_rect(map_rect, Color(0.004, 0.021, 0.026, 0.22), true)

	for x_index in range(1, 5):
		var x := lerpf(map_rect.position.x, map_rect.end.x, float(x_index) / 5.0)
		draw_line(Vector2(x, map_rect.position.y), Vector2(x, map_rect.end.y), grid_color, 1.0)

	for y_index in range(1, 4):
		var y := lerpf(map_rect.position.y, map_rect.end.y, float(y_index) / 4.0)
		draw_line(Vector2(map_rect.position.x, y), Vector2(map_rect.end.x, y), grid_color, 1.0)

	for index in range(4):
		var offset := float(index) * map_rect.size.y * 0.26
		draw_line(
			map_rect.position + Vector2(0.0, offset),
			map_rect.position + Vector2(map_rect.size.x, offset - map_rect.size.y * 0.42),
			Color(grid_color.r, grid_color.g, grid_color.b, 0.18),
			1.0
		)


func _draw_map_shape(map_rect: Rect2) -> void:
	for index in range(REGION_POLYGONS.size()):
		var polygon := _project_polygon(REGION_POLYGONS[index], map_rect)
		if polygon.is_empty():
			continue

		var fill := map_fill_color
		if index == 1:
			fill = Color(0.045, 0.32, 0.27, 0.74)
		elif index == 2:
			fill = Color(0.035, 0.23, 0.22, 0.66)

		var shadow := PackedVector2Array()
		for point in polygon:
			shadow.append(point + Vector2(1.6, 2.0))
		draw_colored_polygon(shadow, Color(0.0, 0.0, 0.0, 0.22))
		draw_colored_polygon(polygon, fill)

		var outline := PackedVector2Array(polygon)
		outline.append(polygon[0])
		draw_polyline(outline, Color(map_line_color.r, map_line_color.g, map_line_color.b, 0.16), 4.0, true)
		draw_polyline(outline, map_line_color, 1.2, true)

	_draw_selected_region_outline(REGION_POLYGONS[1], map_rect)


func _draw_selected_region_outline(region_points: Array, map_rect: Rect2) -> void:
	var polygon := _project_polygon(region_points, map_rect)
	if polygon.is_empty():
		return

	var outline := PackedVector2Array(polygon)
	outline.append(polygon[0])
	draw_polyline(outline, Color(0.24, 0.94, 0.86, 0.24), 7.0, true)
	draw_polyline(outline, Color(0.24, 0.94, 0.86, 0.88), 1.8, true)


func _draw_sea_routes(map_rect: Rect2) -> void:
	_draw_curved_projected_link(Vector2(0.06, 0.28), Vector2(0.35, 0.24), map_rect, Color(0.12, 0.67, 1.0, 0.22), 0.9, -10.0)
	_draw_curved_projected_link(Vector2(0.08, 0.78), Vector2(0.44, 0.72), map_rect, Color(0.12, 0.67, 1.0, 0.18), 0.9, 11.0)
	_draw_curved_projected_link(Vector2(0.59, 0.12), Vector2(0.89, 0.42), map_rect, Color(0.24, 0.94, 0.86, 0.18), 0.9, 9.0)


func _draw_network_links(map_rect: Rect2) -> void:
	_draw_link_set(POWER_LINKS, map_rect, Color(0.26, 0.94, 0.55, 0.86), 1.7)
	_draw_link_set(DATA_LINKS, map_rect, Color(0.12, 0.67, 1.0, 0.84), 1.35)
	_draw_link_set(CONGESTION_LINKS, map_rect, Color(1.0, 0.29, 0.08, 0.90), 1.35)


func _draw_link_set(links: Array, map_rect: Rect2, color: Color, width: float) -> void:
	for link in links:
		if link.size() < 2:
			continue

		var from_index := int(link[0])
		var to_index := int(link[1])
		if from_index < 0 or from_index >= NETWORK_NODES.size():
			continue
		if to_index < 0 or to_index >= NETWORK_NODES.size():
			continue

		var from_position := _node_position(from_index, map_rect)
		var to_position := _node_position(to_index, map_rect)
		var bend := float(link[2]) if link.size() >= 3 else 0.0
		_draw_curved_link(from_position, to_position, color, width, bend)


func _draw_nodes(map_rect: Rect2) -> void:
	for index in range(NETWORK_NODES.size()):
		var node_position := _node_position(index, map_rect)
		var tier := int(NETWORK_NODES[index].get("tier", 1))
		var color := Color(0.16, 0.95, 0.86, 0.94)
		if index in [6, 13]:
			color = Color(1.0, 0.29, 0.08, 0.95)

		var outer_radius := 5.0 + float(tier) * 1.9
		draw_circle(node_position, outer_radius, Color(color.r, color.g, color.b, 0.13))
		draw_circle(node_position, outer_radius * 0.62, Color(color.r, color.g, color.b, 0.24))
		draw_arc(node_position, outer_radius + 1.8, 0.0, TAU, 20, Color(color.r, color.g, color.b, 0.36), 0.9, true)
		draw_circle(node_position, 2.2 + float(tier) * 0.42, color)
		draw_circle(node_position, 1.1, Color(0.84, 0.98, 0.94, 1.0))


func _draw_curved_projected_link(from_point: Vector2, to_point: Vector2, map_rect: Rect2, color: Color, width: float, bend: float) -> void:
	_draw_curved_link(_project(from_point, map_rect), _project(to_point, map_rect), color, width, bend)


func _draw_curved_link(from_position: Vector2, to_position: Vector2, color: Color, width: float, bend: float) -> void:
	var points := _quadratic_link_points(from_position, to_position, bend)
	if points.size() < 2:
		return

	draw_polyline(points, Color(color.r, color.g, color.b, 0.17), width + 3.2, true)
	draw_polyline(points, color, width, true)


func _quadratic_link_points(from_position: Vector2, to_position: Vector2, bend: float) -> PackedVector2Array:
	var points := PackedVector2Array()
	var direction := to_position - from_position
	var normal := Vector2(-direction.y, direction.x).normalized() if direction.length() > 0.01 else Vector2.UP
	var control := (from_position + to_position) * 0.5 + normal * bend

	for step in range(10):
		var t := float(step) / 9.0
		var inv := 1.0 - t
		points.append(from_position * inv * inv + control * 2.0 * inv * t + to_position * t * t)

	return points


func _node_position(index: int, map_rect: Rect2) -> Vector2:
	return _project(NETWORK_NODES[index].get("point", Vector2.ZERO), map_rect)


func _project_polygon(points: Array, map_rect: Rect2) -> PackedVector2Array:
	var polygon := PackedVector2Array()
	for point in points:
		polygon.append(_project(point, map_rect))
	return polygon


func _project(point: Vector2, map_rect: Rect2) -> Vector2:
	return map_rect.position + point * map_rect.size


func get_render_diagnostics() -> Dictionary:
	return {
		"region_count": REGION_POLYGONS.size(),
		"node_count": NETWORK_NODES.size(),
		"power_link_count": POWER_LINKS.size(),
		"data_link_count": DATA_LINKS.size(),
		"congestion_link_count": CONGESTION_LINKS.size(),
		"total_link_count": POWER_LINKS.size() + DATA_LINKS.size() + CONGESTION_LINKS.size(),
	}
