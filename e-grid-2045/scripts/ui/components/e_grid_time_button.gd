@tool
class_name EGridTimeButton
extends Button

@export_enum("pause", "play", "fast", "faster") var icon_kind := "play":
	set(value):
		icon_kind = value
		queue_redraw()

@export var label_text := ">":
	set(value):
		label_text = value
		icon_kind = _icon_from_label(value)
		queue_redraw()

@export var active_color := Color("#1fd0e2")
@export var idle_icon_color := Color("#dbe7e9e6")
@export var disabled_icon_color := Color("#53666be0")


func _ready() -> void:
	text = ""
	flat = true
	focus_mode = Control.FOCUS_ALL
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_install_empty_button_styles()
	_connect_redraw_signals()


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size).grow(-1.0)
	if rect.size.x <= 0.0 or rect.size.y <= 0.0:
		return

	var selected := toggle_mode and button_pressed
	var hovered := is_hovered() or has_focus()
	var fill_color := _fill_color(selected, hovered)
	var border_color := _border_color(selected, hovered)
	var icon_color := _icon_color(selected)

	var points := _clipped_rect_points(rect, 4.0)
	draw_colored_polygon(points, fill_color)
	_draw_closed_polyline(points, Color("#020608e6"), 2.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-1.0), 3.0), border_color, 1.0)

	if selected:
		var glow_rect := Rect2(rect.position + Vector2(5.0, rect.size.y - 4.0), Vector2(rect.size.x - 10.0, 1.0))
		draw_rect(glow_rect, Color(active_color, 0.9), true)

	_draw_icon(rect, icon_color)


func _install_empty_button_styles() -> void:
	add_theme_stylebox_override("normal", StyleBoxEmpty.new())
	add_theme_stylebox_override("hover", StyleBoxEmpty.new())
	add_theme_stylebox_override("pressed", StyleBoxEmpty.new())
	add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	add_theme_stylebox_override("disabled", StyleBoxEmpty.new())


func _connect_redraw_signals() -> void:
	var redraw_call := Callable(self, "_request_redraw")

	if not mouse_entered.is_connected(redraw_call):
		mouse_entered.connect(redraw_call)
	if not mouse_exited.is_connected(redraw_call):
		mouse_exited.connect(redraw_call)
	if not focus_entered.is_connected(redraw_call):
		focus_entered.connect(redraw_call)
	if not focus_exited.is_connected(redraw_call):
		focus_exited.connect(redraw_call)
	if not button_down.is_connected(redraw_call):
		button_down.connect(redraw_call)
	if not button_up.is_connected(redraw_call):
		button_up.connect(redraw_call)
	if not toggled.is_connected(_on_toggled):
		toggled.connect(_on_toggled)


func _fill_color(selected: bool, hovered: bool) -> Color:
	if disabled:
		return Color("#070d10d8")
	if selected:
		return Color("#0f3942ee")
	if hovered:
		return Color("#0b1a1feb")
	return Color("#071014e8")


func _border_color(selected: bool, hovered: bool) -> Color:
	if disabled:
		return Color("#27333780")
	if selected:
		return Color(active_color, 0.98)
	if hovered:
		return Color("#3b7580d8")
	return Color("#34464bae")


func _icon_color(selected: bool) -> Color:
	if disabled:
		return disabled_icon_color
	if selected:
		return Color("#e8fdff")
	return idle_icon_color


func _draw_icon(rect: Rect2, color: Color) -> void:
	if icon_kind == "pause":
		_draw_pause_icon(rect, color)
	elif icon_kind == "fast":
		_draw_arrow_icons(rect, color, 2)
	elif icon_kind == "faster":
		_draw_arrow_icons(rect, color, 3)
	else:
		_draw_arrow_icons(rect, color, 1)


func _draw_pause_icon(rect: Rect2, color: Color) -> void:
	var center := rect.get_center()
	var bar_size := Vector2(3.0, 12.0)
	draw_rect(Rect2(center + Vector2(-5.0, -6.0), bar_size), color, true)
	draw_rect(Rect2(center + Vector2(2.0, -6.0), bar_size), color, true)


func _draw_arrow_icons(rect: Rect2, color: Color, count: int) -> void:
	var arrow_size := Vector2(8.0, 12.0)
	var spacing := 2.0
	var total_width := arrow_size.x * float(count) + spacing * float(maxi(count - 1, 0))
	var center := rect.get_center()
	var x := center.x - total_width * 0.5

	for _index in range(count):
		var points := PackedVector2Array([
			Vector2(x, center.y - arrow_size.y * 0.5),
			Vector2(x, center.y + arrow_size.y * 0.5),
			Vector2(x + arrow_size.x, center.y),
		])
		draw_colored_polygon(points, color)
		x += arrow_size.x + spacing


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


func _icon_from_label(value: String) -> String:
	var normalized := value.strip_edges().to_upper()
	if normalized == "II" or normalized == "||":
		return "pause"
	if normalized == ">>":
		return "fast"
	if normalized == ">>>":
		return "faster"
	return "play"


func _request_redraw() -> void:
	queue_redraw()


func _on_toggled(_pressed: bool) -> void:
	queue_redraw()
