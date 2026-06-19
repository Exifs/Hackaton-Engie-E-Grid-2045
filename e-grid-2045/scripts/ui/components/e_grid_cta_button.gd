@tool
class_name EGridCtaButton
extends Button

@export var label_text := "ACTION":
	set(value):
		label_text = value
		_sync_label()
		queue_redraw()

@export var accent_color := Color("#1fd0e2")
@export var label_color := Color("#eefbff")
@export var disabled_label_color := Color("#59696d")
@export var show_gear_icon := true:
	set(value):
		show_gear_icon = value
		queue_redraw()

var _label: Label


func _ready() -> void:
	text = ""
	flat = true
	focus_mode = Control.FOCUS_ALL
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_install_empty_button_styles()
	_cache_label()
	_sync_label()
	_connect_redraw_signals()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_sync_label_layout()
		queue_redraw()


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size).grow(-1.0)
	if rect.size.x <= 8.0 or rect.size.y <= 8.0:
		return

	var hovered := is_hovered() or has_focus()
	var pressed := button_pressed
	var points := _clipped_rect_points(rect, 4.0)
	draw_colored_polygon(points, _fill_color(hovered, pressed))
	_draw_closed_polyline(points, Color("#020608ea"), 2.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-1.0), 3.0), _border_color(hovered, pressed), 1.0)
	_draw_closed_polyline(_clipped_rect_points(rect.grow(-5.0), 2.0), Color("#4bb7c460"), 1.0)
	_draw_energy_rails(rect, hovered or pressed)

	if show_gear_icon:
		_draw_gear_icon(_gear_center(rect), _icon_color(pressed))


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
	_label.add_theme_color_override("font_color", disabled_label_color if disabled else label_color)
	_label.add_theme_font_size_override("font_size", 14)
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_label.clip_text = true
	_label.mouse_filter = Control.MOUSE_FILTER_IGNORE


func _sync_label_layout() -> void:
	if _label == null:
		return

	_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	_label.offset_left = 0.0
	_label.offset_top = 0.0
	_label.offset_right = 0.0
	_label.offset_bottom = 0.0


func _fill_color(hovered: bool, pressed: bool) -> Color:
	if disabled:
		return Color("#071014dc")
	if pressed:
		return Color("#0f5160ee")
	if hovered:
		return Color("#0d3944ec")
	return Color("#0a2630ec")


func _border_color(hovered: bool, pressed: bool) -> Color:
	if disabled:
		return Color("#2f3d4280")
	if pressed:
		return Color("#6df3ff")
	if hovered:
		return Color("#42dcece6")
	return Color("#279db0dc")


func _icon_color(pressed: bool) -> Color:
	if disabled:
		return disabled_label_color
	if pressed:
		return Color("#eefeff")
	return Color(accent_color, 0.95)


func _draw_energy_rails(rect: Rect2, active: bool) -> void:
	var glow := Color(accent_color, 0.42 if active else 0.22)
	var rail_width := maxf(rect.size.x - 28.0, 0.0)
	if rail_width <= 0.0:
		return

	draw_rect(Rect2(rect.position + Vector2(14.0, 4.0), Vector2(rail_width, 1.0)), Color("#65f3ff35"), true)
	draw_rect(Rect2(Vector2(rect.position.x + 14.0, rect.end.y - 5.0), Vector2(rail_width, 1.0)), Color("#65f3ff35"), true)
	draw_rect(Rect2(rect.position + Vector2(5.0, 12.0), Vector2(1.0, maxf(rect.size.y - 24.0, 0.0))), glow, true)
	draw_rect(Rect2(Vector2(rect.end.x - 6.0, rect.position.y + 12.0), Vector2(1.0, maxf(rect.size.y - 24.0, 0.0))), glow, true)


func _draw_gear_icon(center: Vector2, color: Color) -> void:
	var outer := 8.0
	var inner := 4.2

	for index in range(8):
		var angle := TAU * float(index) / 8.0
		var from := center + Vector2(cos(angle), sin(angle)) * inner
		var to := center + Vector2(cos(angle), sin(angle)) * outer
		draw_line(from, to, color, 2.0, true)

	draw_arc(center, 5.2, 0.0, TAU, 32, color, 2.0, true)
	draw_arc(center, 2.0, 0.0, TAU, 20, Color("#071014ee"), 2.0, true)


func _gear_center(rect: Rect2) -> Vector2:
	var text_width := maxf(float(label_text.length()) * 8.0, 96.0)
	if _label != null:
		text_width = maxf(text_width, _label.get_combined_minimum_size().x)

	return Vector2(rect.get_center().x - text_width * 0.5 - 28.0, rect.get_center().y)


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


func _request_redraw() -> void:
	queue_redraw()


func _on_toggled(_pressed: bool) -> void:
	queue_redraw()
