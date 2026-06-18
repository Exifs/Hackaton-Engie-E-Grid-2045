@tool
class_name EGridDropdownIndicator
extends Control

const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")

@export var component_name := "dropdown_field_states":
	set(value):
		component_name = value
		queue_redraw()

@export var opened := false:
	set(value):
		opened = value
		queue_redraw()

@export var disabled := false:
	set(value):
		disabled = value
		queue_redraw()

@export_enum("normal", "warning", "critical", "success", "info", "readonly", "locked") var semantic_state := "normal":
	set(value):
		semantic_state = value
		queue_redraw()

@export var hovered := false:
	set(value):
		hovered = value
		queue_redraw()

@export var indicator_center_source := Vector2(309.0, 28.0):
	set(value):
		indicator_center_source = value
		queue_redraw()

@export var indicator_half_size_source := Vector2(7.0, 5.0):
	set(value):
		indicator_half_size_source = value
		queue_redraw()


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		queue_redraw()


func _draw() -> void:
	var fitted_rect := E_GRID_UI_ATLAS.get_aspect_fit_rect(component_name, size)
	if fitted_rect.size.x <= 0.0 or fitted_rect.size.y <= 0.0:
		return

	var source_scale := _source_scale(fitted_rect)
	var center := fitted_rect.position + indicator_center_source * source_scale
	var half_size := indicator_half_size_source * source_scale
	var width := maxf(1.25, 2.0 * source_scale)
	var points := PackedVector2Array()

	if opened:
		points.append(center + Vector2(-half_size.x, half_size.y * 0.55))
		points.append(center + Vector2(0.0, -half_size.y * 0.55))
		points.append(center + Vector2(half_size.x, half_size.y * 0.55))
	else:
		points.append(center + Vector2(-half_size.x, -half_size.y * 0.55))
		points.append(center + Vector2(0.0, half_size.y * 0.55))
		points.append(center + Vector2(half_size.x, -half_size.y * 0.55))

	draw_polyline(points, _indicator_color(), width, true)


func _source_scale(fitted_rect: Rect2) -> float:
	var source_size := E_GRID_UI_ATLAS.get_cell_size(component_name)
	if source_size == Vector2i.ZERO:
		return 1.0

	return fitted_rect.size.x / float(source_size.x)


func _indicator_color() -> Color:
	if disabled or semantic_state in ["readonly", "locked"]:
		return Color("#546467")

	if semantic_state == "warning":
		return Color("#ee5824")

	if semantic_state == "critical":
		return Color("#cf3a30")

	if semantic_state == "success":
		return Color("#4ce38a")

	if semantic_state == "info" or opened or hovered:
		return Color("#1fd0e2")

	return Color("#d2e0e2")
