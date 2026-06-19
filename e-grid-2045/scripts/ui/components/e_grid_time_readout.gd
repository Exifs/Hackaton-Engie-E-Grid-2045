@tool
class_name EGridTimeReadout
extends Control

@export var label_text := "1.0x":
	set(value):
		label_text = value
		_sync_label()
		queue_redraw()

@export var label_color := Color("#e0e8e8")

var _label: Label


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_cache_label()
	_sync_label()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_sync_label_layout()
		queue_redraw()


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size).grow(-1.0)
	if rect.size.x <= 0.0 or rect.size.y <= 0.0:
		return

	var points := _clipped_rect_points(rect, 4.0)
	draw_colored_polygon(points, Color("#071014e8"))
	_draw_closed_polyline(points, Color("#020608e6"), 2.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-1.0), 3.0), Color("#34464bae"), 1.0)


func _cache_label() -> void:
	_label = get_node_or_null("Label") as Label
	if _label != null:
		return

	_label = Label.new()
	_label.name = "Label"
	add_child(_label)
	_sync_label_layout()


func _sync_label() -> void:
	if _label == null:
		_cache_label()
	if _label == null:
		return

	_label.text = label_text
	_label.add_theme_color_override("font_color", label_color)
	_label.add_theme_font_size_override("font_size", 13)
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_label.clip_text = true


func _sync_label_layout() -> void:
	if _label == null:
		return

	_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	_label.offset_left = 0.0
	_label.offset_top = 0.0
	_label.offset_right = 0.0
	_label.offset_bottom = 0.0


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
