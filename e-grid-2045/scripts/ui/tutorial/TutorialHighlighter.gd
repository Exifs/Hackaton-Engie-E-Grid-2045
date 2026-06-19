extends Control
class_name EGridTutorialHighlighter

var target_rect := Rect2()
var target_visible := false
var pulse_time := 0.0
var _target: Variant


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_process(true)


func set_target(target: Variant) -> void:
	_target = target
	refresh_target_rect()
	queue_redraw()


func refresh_target_rect() -> void:
	target_visible = false
	target_rect = Rect2()

	if _target is Control:
		var control := _target as Control
		if is_instance_valid(control) and control.is_visible_in_tree():
			target_rect = control.get_global_rect()
			target_visible = true
	elif _target is CanvasItem:
		var item := _target as CanvasItem
		if is_instance_valid(item) and item.is_visible_in_tree():
			target_rect = Rect2(item.get_global_transform_with_canvas().origin - Vector2(24.0, 24.0), Vector2(48.0, 48.0))
			target_visible = true
	elif _target is Rect2:
		target_rect = _target
		target_visible = target_rect.size.x > 0.0 and target_rect.size.y > 0.0
	elif _target is Vector2:
		var target_position: Vector2 = _target
		target_rect = Rect2(target_position - Vector2(36.0, 36.0), Vector2(72.0, 72.0))
		target_visible = true


func clear_target() -> void:
	_target = null
	target_visible = false
	target_rect = Rect2()
	queue_redraw()


func _process(delta: float) -> void:
	pulse_time = fposmod(pulse_time + delta, TAU)
	if _target != null:
		refresh_target_rect()
	if target_visible:
		queue_redraw()


func _draw() -> void:
	if not target_visible:
		return

	var pulse := (sin(pulse_time * 2.4) + 1.0) * 0.5
	var expanded := target_rect.grow(10.0 + pulse * 8.0)
	var core := target_rect.grow(5.0)
	var glow_color := Color("#35e6ff", 0.14 + pulse * 0.12)
	var line_color := Color("#8ff6ff", 0.82)
	var accent_color := Color("#f5c979", 0.72 + pulse * 0.2)

	draw_rect(expanded, glow_color, false, 7.0)
	draw_rect(core, line_color, false, 2.0)

	var corner := 18.0
	var width := 3.0
	var top_left := core.position
	var top_right := Vector2(core.position.x + core.size.x, core.position.y)
	var bottom_left := Vector2(core.position.x, core.position.y + core.size.y)
	var bottom_right := core.position + core.size

	draw_line(top_left, top_left + Vector2(corner, 0.0), accent_color, width)
	draw_line(top_left, top_left + Vector2(0.0, corner), accent_color, width)
	draw_line(top_right, top_right + Vector2(-corner, 0.0), accent_color, width)
	draw_line(top_right, top_right + Vector2(0.0, corner), accent_color, width)
	draw_line(bottom_left, bottom_left + Vector2(corner, 0.0), accent_color, width)
	draw_line(bottom_left, bottom_left + Vector2(0.0, -corner), accent_color, width)
	draw_line(bottom_right, bottom_right + Vector2(-corner, 0.0), accent_color, width)
	draw_line(bottom_right, bottom_right + Vector2(0.0, -corner), accent_color, width)
