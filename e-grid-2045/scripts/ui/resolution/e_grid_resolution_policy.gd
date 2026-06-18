@tool
class_name EGridResolutionPolicy
extends Node

signal ui_scale_changed(scale: float, viewport_size: Vector2i)

const DEFAULT_DESIGN_RESOLUTION := Vector2i(1600, 900)

@export var design_resolution := DEFAULT_DESIGN_RESOLUTION:
	set(value):
		design_resolution = Vector2i(maxi(1, value.x), maxi(1, value.y))
		_apply_if_ready()

@export var apply_runtime_window_policy := true:
	set(value):
		apply_runtime_window_policy = value
		_apply_if_ready()

@export var fit_parent_control := true:
	set(value):
		fit_parent_control = value
		_apply_if_ready()

@export var content_scale_mode: Window.ContentScaleMode = Window.CONTENT_SCALE_MODE_CANVAS_ITEMS:
	set(value):
		content_scale_mode = value
		_apply_if_ready()

@export var content_scale_aspect: Window.ContentScaleAspect = Window.CONTENT_SCALE_ASPECT_EXPAND:
	set(value):
		content_scale_aspect = value
		_apply_if_ready()

@export_range(0.5, 3.0, 0.05) var content_scale_factor := 1.0:
	set(value):
		content_scale_factor = maxf(0.05, value)
		_apply_if_ready()

@export var content_scale_stretch: Window.ContentScaleStretch = Window.CONTENT_SCALE_STRETCH_FRACTIONAL:
	set(value):
		content_scale_stretch = value
		_apply_if_ready()

var _ready_done := false
var _last_scale := -1.0
var _last_viewport_size := Vector2i.ZERO


func _ready() -> void:
	_ready_done = true
	_apply_resolution_policy()
	_connect_viewport_resize()
	call_deferred("_emit_scale_if_changed")


func _exit_tree() -> void:
	_disconnect_viewport_resize()
	_ready_done = false


func _notification(what: int) -> void:
	if what == NOTIFICATION_PARENTED and _ready_done:
		_fit_parent_control()


func get_ui_scale() -> float:
	var viewport_size := _get_viewport_size()
	var x_scale := float(viewport_size.x) / float(design_resolution.x)
	var y_scale := float(viewport_size.y) / float(design_resolution.y)

	if content_scale_aspect == Window.CONTENT_SCALE_ASPECT_KEEP_WIDTH:
		return x_scale * content_scale_factor

	if content_scale_aspect == Window.CONTENT_SCALE_ASPECT_KEEP_HEIGHT:
		return y_scale * content_scale_factor

	return minf(x_scale, y_scale) * content_scale_factor


func _apply_if_ready() -> void:
	if _ready_done:
		_apply_resolution_policy()


func _apply_resolution_policy() -> void:
	_fit_parent_control()

	if Engine.is_editor_hint() or not apply_runtime_window_policy:
		_emit_scale_if_changed()
		return

	var window := get_window()
	if window == null:
		return

	window.content_scale_size = design_resolution
	window.content_scale_mode = content_scale_mode
	window.content_scale_aspect = content_scale_aspect
	window.content_scale_factor = content_scale_factor
	window.content_scale_stretch = content_scale_stretch
	_emit_scale_if_changed()


func _fit_parent_control() -> void:
	if not fit_parent_control:
		return

	var parent_control := get_parent() as Control
	if parent_control == null:
		return

	parent_control.set_anchors_preset(Control.PRESET_FULL_RECT)
	parent_control.offset_left = 0.0
	parent_control.offset_top = 0.0
	parent_control.offset_right = 0.0
	parent_control.offset_bottom = 0.0


func _connect_viewport_resize() -> void:
	var viewport := get_viewport()
	if viewport == null:
		return

	var resize_call := Callable(self, "_emit_scale_if_changed")
	if not viewport.size_changed.is_connected(resize_call):
		viewport.size_changed.connect(resize_call)


func _disconnect_viewport_resize() -> void:
	var viewport := get_viewport()
	if viewport == null:
		return

	var resize_call := Callable(self, "_emit_scale_if_changed")
	if viewport.size_changed.is_connected(resize_call):
		viewport.size_changed.disconnect(resize_call)


func _emit_scale_if_changed() -> void:
	var viewport_size := _get_viewport_size()
	var scale := get_ui_scale()

	if is_equal_approx(scale, _last_scale) and viewport_size == _last_viewport_size:
		return

	_last_scale = scale
	_last_viewport_size = viewport_size
	ui_scale_changed.emit(scale, viewport_size)


func _get_viewport_size() -> Vector2i:
	var window := get_window()
	if window != null and not Engine.is_editor_hint():
		return window.size

	var viewport := get_viewport()
	if viewport == null:
		return design_resolution

	return Vector2i(viewport.get_visible_rect().size.round())
