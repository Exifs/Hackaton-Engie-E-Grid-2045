@tool
class_name EGridMenuVersionLabel
extends Control

@export var display_text := "":
	set(value):
		display_text = value
		queue_redraw()

@export var font_color := Color("#506b72", 0.58):
	set(value):
		font_color = value
		queue_redraw()

@export var font_size := 12:
	set(value):
		font_size = value
		queue_redraw()

@export var fit_font_to_height := true


func _draw() -> void:
	if display_text.is_empty():
		return

	var font := get_theme_default_font()
	var drawn_font_size := _get_drawn_font_size()
	var baseline := font.get_ascent(drawn_font_size)
	draw_string(font, Vector2(0.0, baseline), display_text, HORIZONTAL_ALIGNMENT_LEFT, -1.0, drawn_font_size, font_color)


func _get_drawn_font_size() -> int:
	if fit_font_to_height and size.y > 0.0:
		return maxi(8, roundi(size.y / 1.55))

	return font_size
