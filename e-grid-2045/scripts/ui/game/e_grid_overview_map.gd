extends Control
class_name EGridOverviewMap

const OUTLINE_POINTS := [
	Vector2(0.10, 0.47),
	Vector2(0.18, 0.31),
	Vector2(0.30, 0.38),
	Vector2(0.40, 0.21),
	Vector2(0.53, 0.33),
	Vector2(0.66, 0.27),
	Vector2(0.82, 0.44),
	Vector2(0.73, 0.59),
	Vector2(0.83, 0.79),
	Vector2(0.60, 0.72),
	Vector2(0.45, 0.84),
	Vector2(0.34, 0.68),
	Vector2(0.19, 0.73),
]

const NETWORK_NODES := [
	Vector2(0.24, 0.50),
	Vector2(0.36, 0.40),
	Vector2(0.46, 0.55),
	Vector2(0.56, 0.42),
	Vector2(0.68, 0.52),
	Vector2(0.33, 0.65),
	Vector2(0.51, 0.73),
	Vector2(0.70, 0.72),
]

const POWER_LINKS := [[0, 1], [1, 2], [2, 4], [2, 5], [5, 6]]
const DATA_LINKS := [[1, 3], [3, 4], [2, 6], [4, 7]]
const CONGESTION_LINKS := [[0, 5], [3, 7]]

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
	_draw_map_shape(map_rect)
	_draw_network_links(map_rect)
	_draw_nodes(map_rect)


func _draw_background_grid(map_rect: Rect2) -> void:
	for x_index in range(1, 5):
		var x := lerpf(map_rect.position.x, map_rect.end.x, float(x_index) / 5.0)
		draw_line(Vector2(x, map_rect.position.y), Vector2(x, map_rect.end.y), grid_color, 1.0)

	for y_index in range(1, 4):
		var y := lerpf(map_rect.position.y, map_rect.end.y, float(y_index) / 4.0)
		draw_line(Vector2(map_rect.position.x, y), Vector2(map_rect.end.x, y), grid_color, 1.0)


func _draw_map_shape(map_rect: Rect2) -> void:
	var polygon := PackedVector2Array()
	for point in OUTLINE_POINTS:
		polygon.append(_project(point, map_rect))

	draw_colored_polygon(polygon, map_fill_color)

	var outline := PackedVector2Array(polygon)
	outline.append(polygon[0])
	draw_polyline(outline, Color(map_line_color.r, map_line_color.g, map_line_color.b, 0.18), 4.0, true)
	draw_polyline(outline, map_line_color, 1.4, true)


func _draw_network_links(map_rect: Rect2) -> void:
	_draw_link_set(POWER_LINKS, map_rect, Color(0.26, 0.94, 0.55, 0.86), 1.8)
	_draw_link_set(DATA_LINKS, map_rect, Color(0.12, 0.67, 1.0, 0.84), 1.4)
	_draw_link_set(CONGESTION_LINKS, map_rect, Color(1.0, 0.29, 0.08, 0.88), 1.4)


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

		var from_position := _project(NETWORK_NODES[from_index], map_rect)
		var to_position := _project(NETWORK_NODES[to_index], map_rect)
		draw_line(from_position, to_position, Color(color.r, color.g, color.b, 0.20), width + 3.0, true)
		draw_line(from_position, to_position, color, width, true)


func _draw_nodes(map_rect: Rect2) -> void:
	for index in range(NETWORK_NODES.size()):
		var node_position := _project(NETWORK_NODES[index], map_rect)
		var color := Color(0.16, 0.95, 0.86, 0.94)
		if index in [3, 7]:
			color = Color(1.0, 0.29, 0.08, 0.95)

		draw_circle(node_position, 6.5, Color(color.r, color.g, color.b, 0.13))
		draw_circle(node_position, 4.0, Color(color.r, color.g, color.b, 0.24))
		draw_circle(node_position, 2.6, color)
		draw_circle(node_position, 1.1, Color(0.84, 0.98, 0.94, 1.0))


func _project(point: Vector2, map_rect: Rect2) -> Vector2:
	return map_rect.position + point * map_rect.size
