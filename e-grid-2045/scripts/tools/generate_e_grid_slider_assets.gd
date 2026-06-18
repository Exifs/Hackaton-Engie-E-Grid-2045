@tool
extends Node

const OUTPUT_DIR := "res://assets/ui/components/egrid_2045_ui_component_pack_concept_v3/generated/sliders"

const BG := Color("#081115e8")
const PANEL_INNER := Color("#0b171bcc")
const TRACK_FILL := Color("#050c0ff2")
const BORDER := Color("#26363acc")
const BORDER_BRIGHT := Color("#4a666c99")
const CYAN := Color("#1fd0e2ff")
const FILL_MASK := Color("#ffffffff")
const FILL_STRIPE_MASK := Color("#2a4d55aa")
const HANDLE_FILL := Color("#081115f0")
const HANDLE_SHADOW := Color("#020506dd")


func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUTPUT_DIR))
	_generate_horizontal_assets()
	_generate_vertical_assets()
	get_tree().quit(0)


func _generate_horizontal_assets() -> void:
	var base := Image.create(340, 44, false, Image.FORMAT_RGBA8)
	base.fill(Color.TRANSPARENT)
	_draw_clipped_rect(base, Rect2i(7, 8, 326, 28), 8, BG, BORDER, BORDER_BRIGHT)
	_draw_rect(base, Rect2i(22, 14, 296, 17), PANEL_INNER)
	_draw_rect(base, Rect2i(28, 18, 284, 8), TRACK_FILL)
	_draw_rect_outline(base, Rect2i(28, 18, 284, 8), BORDER)
	_draw_vertical_ticks(base, Rect2i(28, 18, 284, 8), 24, Color("#22343880"))
	_save(base, "slider_horizontal_base_clean.png")

	var fill := Image.create(48, 8, false, Image.FORMAT_RGBA8)
	fill.fill(FILL_MASK)
	_draw_diagonal_stripes(fill, false)
	_save(fill, "slider_horizontal_fill_tile.png")

	var handle := Image.create(18, 24, false, Image.FORMAT_RGBA8)
	handle.fill(Color.TRANSPARENT)
	_draw_rect(handle, Rect2i(1, 0, 16, 24), HANDLE_FILL)
	_draw_rect_outline(handle, Rect2i(1, 0, 16, 24), HANDLE_SHADOW)
	_draw_rect_outline(handle, Rect2i(3, 2, 12, 20), CYAN)
	_save(handle, "slider_horizontal_handle.png")


func _generate_vertical_assets() -> void:
	var base := Image.create(54, 220, false, Image.FORMAT_RGBA8)
	base.fill(Color.TRANSPARENT)
	_draw_clipped_rect(base, Rect2i(7, 8, 40, 204), 8, BG, BORDER, BORDER_BRIGHT)
	_draw_rect(base, Rect2i(18, 22, 18, 176), PANEL_INNER)
	_draw_rect(base, Rect2i(23, 28, 8, 164), TRACK_FILL)
	_draw_rect_outline(base, Rect2i(23, 28, 8, 164), BORDER)
	_draw_horizontal_ticks(base, Rect2i(23, 28, 8, 164), 22, Color("#22343880"))
	_save(base, "slider_vertical_base_clean.png")

	var fill := Image.create(8, 48, false, Image.FORMAT_RGBA8)
	fill.fill(FILL_MASK)
	_draw_diagonal_stripes(fill, true)
	_save(fill, "slider_vertical_fill_tile.png")

	var handle := Image.create(28, 18, false, Image.FORMAT_RGBA8)
	handle.fill(Color.TRANSPARENT)
	_draw_rect(handle, Rect2i(0, 1, 28, 16), HANDLE_FILL)
	_draw_rect_outline(handle, Rect2i(0, 1, 28, 16), HANDLE_SHADOW)
	_draw_rect_outline(handle, Rect2i(2, 3, 24, 12), CYAN)
	_save(handle, "slider_vertical_handle.png")


func _draw_clipped_rect(image: Image, rect: Rect2i, cut: int, fill_color: Color, border_color: Color, inner_border_color: Color) -> void:
	for y in range(rect.position.y, rect.position.y + rect.size.y):
		for x in range(rect.position.x, rect.position.x + rect.size.x):
			if _inside_clipped_rect(Vector2i(x, y), rect, cut):
				image.set_pixel(x, y, fill_color)

	var points := PackedVector2Array([
		Vector2(rect.position.x + cut, rect.position.y),
		Vector2(rect.position.x + rect.size.x - cut - 1, rect.position.y),
		Vector2(rect.position.x + rect.size.x - 1, rect.position.y + cut),
		Vector2(rect.position.x + rect.size.x - 1, rect.position.y + rect.size.y - cut - 1),
		Vector2(rect.position.x + rect.size.x - cut - 1, rect.position.y + rect.size.y - 1),
		Vector2(rect.position.x + cut, rect.position.y + rect.size.y - 1),
		Vector2(rect.position.x, rect.position.y + rect.size.y - cut - 1),
		Vector2(rect.position.x, rect.position.y + cut),
	])
	_draw_polyline(image, points, border_color)

	var inner := Rect2i(rect.position + Vector2i(2, 2), rect.size - Vector2i(4, 4))
	var inner_points := PackedVector2Array([
		Vector2(inner.position.x + cut - 2, inner.position.y),
		Vector2(inner.position.x + inner.size.x - cut + 1, inner.position.y),
		Vector2(inner.position.x + inner.size.x - 1, inner.position.y + cut - 2),
		Vector2(inner.position.x + inner.size.x - 1, inner.position.y + inner.size.y - cut + 1),
		Vector2(inner.position.x + inner.size.x - cut + 1, inner.position.y + inner.size.y - 1),
		Vector2(inner.position.x + cut - 2, inner.position.y + inner.size.y - 1),
		Vector2(inner.position.x, inner.position.y + inner.size.y - cut + 1),
		Vector2(inner.position.x, inner.position.y + cut - 2),
	])
	_draw_polyline(image, inner_points, inner_border_color)


func _inside_clipped_rect(point: Vector2i, rect: Rect2i, cut: int) -> bool:
	var local := point - rect.position
	var max_x := rect.size.x - 1
	var max_y := rect.size.y - 1

	if local.x < 0 or local.y < 0 or local.x > max_x or local.y > max_y:
		return false

	if local.x + local.y < cut:
		return false

	if (max_x - local.x) + local.y < cut:
		return false

	if local.x + (max_y - local.y) < cut:
		return false

	if (max_x - local.x) + (max_y - local.y) < cut:
		return false

	return true


func _draw_rect(image: Image, rect: Rect2i, color: Color) -> void:
	for y in range(rect.position.y, rect.position.y + rect.size.y):
		for x in range(rect.position.x, rect.position.x + rect.size.x):
			if x >= 0 and y >= 0 and x < image.get_width() and y < image.get_height():
				image.set_pixel(x, y, color)


func _draw_rect_outline(image: Image, rect: Rect2i, color: Color) -> void:
	_draw_line(image, rect.position, Vector2i(rect.position.x + rect.size.x - 1, rect.position.y), color)
	_draw_line(image, rect.position, Vector2i(rect.position.x, rect.position.y + rect.size.y - 1), color)
	_draw_line(image, Vector2i(rect.position.x + rect.size.x - 1, rect.position.y), rect.position + rect.size - Vector2i(1, 1), color)
	_draw_line(image, Vector2i(rect.position.x, rect.position.y + rect.size.y - 1), rect.position + rect.size - Vector2i(1, 1), color)


func _draw_polyline(image: Image, points: PackedVector2Array, color: Color) -> void:
	for index in range(points.size()):
		var next_index := wrapi(index + 1, 0, points.size())
		_draw_line(image, Vector2i(points[index]), Vector2i(points[next_index]), color)


func _draw_line(image: Image, from: Vector2i, to: Vector2i, color: Color) -> void:
	var delta := (to - from).abs()
	var step := Vector2i(1 if from.x < to.x else -1, 1 if from.y < to.y else -1)
	var error := delta.x - delta.y
	var cursor := from

	while true:
		if cursor.x >= 0 and cursor.y >= 0 and cursor.x < image.get_width() and cursor.y < image.get_height():
			image.set_pixel(cursor.x, cursor.y, color)
		if cursor == to:
			break
		var twice_error := error * 2
		if twice_error > -delta.y:
			error -= delta.y
			cursor.x += step.x
		if twice_error < delta.x:
			error += delta.x
			cursor.y += step.y


func _draw_vertical_ticks(image: Image, rect: Rect2i, spacing: int, color: Color) -> void:
	var x := rect.position.x + spacing
	while x < rect.position.x + rect.size.x:
		_draw_line(image, Vector2i(x, rect.position.y), Vector2i(x, rect.position.y + rect.size.y - 1), color)
		x += spacing


func _draw_horizontal_ticks(image: Image, rect: Rect2i, spacing: int, color: Color) -> void:
	var y := rect.position.y + spacing
	while y < rect.position.y + rect.size.y:
		_draw_line(image, Vector2i(rect.position.x, y), Vector2i(rect.position.x + rect.size.x - 1, y), color)
		y += spacing


func _draw_diagonal_stripes(image: Image, vertical: bool) -> void:
	var spacing := 10
	if vertical:
		var y := image.get_height() + image.get_width()
		while y > -image.get_width():
			_draw_line(image, Vector2i(0, y), Vector2i(image.get_width() - 1, y - image.get_width() + 1), FILL_STRIPE_MASK)
			y -= spacing
	else:
		var x := -image.get_height()
		while x < image.get_width():
			_draw_line(image, Vector2i(x, 0), Vector2i(x + image.get_height() - 1, image.get_height() - 1), FILL_STRIPE_MASK)
			x += spacing


func _save(image: Image, file_name: String) -> void:
	var output_path := "%s/%s" % [OUTPUT_DIR, file_name]
	var error := image.save_png(ProjectSettings.globalize_path(output_path))
	if error != OK:
		push_error("Unable to save %s: %s" % [output_path, error])
	else:
		print("Generated %s" % output_path)
