@tool
extends Control
class_name EGridMapView

signal map_pressed(position: Vector2)

@export var accept_map_input := true
@export var map_title_text := "EUROPE GRID OPS":
	set(value):
		map_title_text = value
		_sync_labels()

@export var map_status_text := "SECTOR SELECT":
	set(value):
		map_status_text = value
		_sync_labels()

@export var grid_spacing := 42.0:
	set(value):
		grid_spacing = maxf(value, 12.0)
		queue_redraw()

@export var major_grid_every := 4:
	set(value):
		major_grid_every = maxi(value, 1)
		queue_redraw()

@export var background_color := Color("#050c0f"):
	set(value):
		background_color = value
		queue_redraw()

@export var grid_color := Color("#1d2d3158"):
	set(value):
		grid_color = value
		queue_redraw()

@export var major_grid_color := Color("#283b3f86"):
	set(value):
		major_grid_color = value
		queue_redraw()

@export var network_color := Color("#1fd0e2c8"):
	set(value):
		network_color = value
		queue_redraw()

@export var warning_color := Color("#ee5824d8"):
	set(value):
		warning_color = value
		queue_redraw()

@export var region_points := PackedVector2Array([
	Vector2(0.22, 0.36),
	Vector2(0.34, 0.30),
	Vector2(0.47, 0.39),
	Vector2(0.58, 0.28),
	Vector2(0.69, 0.43),
	Vector2(0.42, 0.58),
	Vector2(0.56, 0.64),
	Vector2(0.74, 0.62),
]):
	set(value):
		region_points = value
		queue_redraw()

@export var stressed_region_indices := PackedInt32Array([2, 6]):
	set(value):
		stressed_region_indices = value
		queue_redraw()


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	_sync_labels()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		queue_redraw()


func _gui_input(event: InputEvent) -> void:
	if not accept_map_input:
		return

	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if mouse_event.button_index == MOUSE_BUTTON_LEFT and mouse_event.pressed:
			map_pressed.emit(mouse_event.position)
			accept_event()


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size)
	draw_rect(rect, background_color, true)
	_draw_grid(rect)
	_draw_map_plate(rect)
	_draw_network(rect)


func _draw_grid(rect: Rect2) -> void:
	var column := 0
	var x := 0.0
	while x <= rect.size.x:
		var color := major_grid_color if column % major_grid_every == 0 else grid_color
		draw_line(Vector2(x, 0.0), Vector2(x, rect.size.y), color, 1.0)
		x += grid_spacing
		column += 1

	var row := 0
	var y := 0.0
	while y <= rect.size.y:
		var color := major_grid_color if row % major_grid_every == 0 else grid_color
		draw_line(Vector2(0.0, y), Vector2(rect.size.x, y), color, 1.0)
		y += grid_spacing
		row += 1

	for offset in range(-3, 8):
		var start := Vector2(float(offset) * grid_spacing * 2.0, rect.size.y)
		var end := start + Vector2(rect.size.y * 1.4, -rect.size.y)
		draw_line(start, end, Color("#1461743a"), 1.0)


func _draw_map_plate(rect: Rect2) -> void:
	var center := rect.size * 0.5
	var plate_size := Vector2(rect.size.x * 0.58, rect.size.y * 0.62)
	var points := PackedVector2Array([
		center + Vector2(-plate_size.x * 0.45, -plate_size.y * 0.10),
		center + Vector2(-plate_size.x * 0.24, -plate_size.y * 0.38),
		center + Vector2(plate_size.x * 0.18, -plate_size.y * 0.42),
		center + Vector2(plate_size.x * 0.42, -plate_size.y * 0.16),
		center + Vector2(plate_size.x * 0.34, plate_size.y * 0.34),
		center + Vector2(plate_size.x * 0.06, plate_size.y * 0.46),
		center + Vector2(-plate_size.x * 0.32, plate_size.y * 0.28),
	])

	draw_colored_polygon(points, Color("#0b171bd0"))
	for index in range(points.size()):
		draw_line(points[index], points[(index + 1) % points.size()], Color("#37484da8"), 2.0)


func _draw_network(rect: Rect2) -> void:
	if region_points.is_empty():
		return

	var absolute_points: Array[Vector2] = []
	for point in region_points:
		absolute_points.append(Vector2(point.x * rect.size.x, point.y * rect.size.y))

	for index in range(absolute_points.size() - 1):
		var from_point := absolute_points[index]
		var to_point := absolute_points[index + 1]
		var color := warning_color if stressed_region_indices.has(index) else Color("#1fd0e272")
		draw_line(from_point, to_point, color, 2.0)

	if absolute_points.size() > 4:
		draw_line(absolute_points[0], absolute_points[4], Color("#1fd0e252"), 1.0)
	if absolute_points.size() > 6:
		draw_line(absolute_points[2], absolute_points[6], warning_color, 2.0)

	for index in range(absolute_points.size()):
		var point := absolute_points[index]
		var stressed := stressed_region_indices.has(index)
		var radius := 6.0 if stressed else 4.5
		var color := warning_color if stressed else network_color
		draw_circle(point, radius + 4.0, Color(color, 0.16))
		draw_circle(point, radius, color)
		draw_circle(point, maxf(radius - 2.0, 1.5), Color("#e0e8e8"))


func _sync_labels() -> void:
	if not is_inside_tree():
		return

	var title_label := get_node_or_null("MapLabels/TitleLabel") as Label
	var status_label := get_node_or_null("MapLabels/StatusLabel") as Label

	if title_label != null:
		title_label.text = map_title_text
	if status_label != null:
		status_label.text = map_status_text
