@tool
class_name EGridDropdownPopupPanel
extends Control

@export var border_color := Color("#1fd0e2"):
	set(value):
		border_color = value
		queue_redraw()

@export var fill_color := Color("#081115f2"):
	set(value):
		fill_color = value
		queue_redraw()

@export var inner_color := Color("#0b171bf4"):
	set(value):
		inner_color = value
		queue_redraw()

@export var corner_cut := 9.0:
	set(value):
		corner_cut = value
		queue_redraw()


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size)
	if rect.size.x <= 0.0 or rect.size.y <= 0.0:
		return

	var points := PackedVector2Array([
		Vector2(corner_cut, 0.0),
		Vector2(rect.size.x - corner_cut, 0.0),
		Vector2(rect.size.x, corner_cut),
		Vector2(rect.size.x, rect.size.y - corner_cut),
		Vector2(rect.size.x - corner_cut, rect.size.y),
		Vector2(corner_cut, rect.size.y),
		Vector2(0.0, rect.size.y - corner_cut),
		Vector2(0.0, corner_cut),
	])
	var outline_points := points.duplicate()
	outline_points.append(points[0])
	var inner_rect := rect.grow(-10.0)

	draw_colored_polygon(points, fill_color)
	draw_rect(inner_rect, inner_color, true)
	draw_rect(inner_rect, Color("#263d42aa"), false, 1.0)
	draw_polyline(outline_points, Color("#020608"), 2.0)
	draw_polyline(outline_points, border_color, 1.0)


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		queue_redraw()
