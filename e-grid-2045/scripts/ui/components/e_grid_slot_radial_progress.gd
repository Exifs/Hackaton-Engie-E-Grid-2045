@tool
class_name EGridSlotRadialProgress
extends Control

const E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT := preload("res://scripts/ui/components/e_grid_component_bitmap_text.gd")
const E_GRID_RUNTIME_TEXTURE_LOADER := preload("res://scripts/ui/components/e_grid_runtime_texture_loader.gd")

const CELL_SIZE := Vector2(64.0, 64.0)
const CAP_SIZE := Vector2(16.0, 16.0)

const TEXTURE_UNDER_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/radial_progress/radial_under_64.png"
const TEXTURE_FILL_CYAN_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/radial_progress/radial_fill_cyan_64.png"
const TEXTURE_FILL_GREEN_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/radial_progress/radial_fill_green_64.png"
const TEXTURE_FILL_WARNING_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/radial_progress/radial_fill_warning_64.png"
const TEXTURE_FILL_ERROR_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/radial_progress/radial_fill_error_64.png"
const TEXTURE_OVER_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/radial_progress/radial_over_bezel_64.png"
const TEXTURE_CENTER_PLATE_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/radial_progress/radial_center_plate_64.png"
const TEXTURE_CAP_CYAN_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/radial_progress/radial_cap_cyan_16.png"
const TEXTURE_CAP_GREEN_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/radial_progress/radial_cap_green_16.png"
const TEXTURE_CAP_WARNING_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/radial_progress/radial_cap_warning_16.png"
const TEXTURE_CAP_ERROR_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/radial_progress/radial_cap_error_16.png"
const VALUE_LABEL_FONT_ATLAS := preload("res://assets/ui/menu/font/egrid_2045_menu_font_atlas_white.png")

var _value := 50.0

@export_range(0.0, 100.0, 0.1) var value: float:
	get:
		return _value
	set(next_value):
		var clamped_value := clampf(next_value, 0.0, 100.0)
		if is_equal_approx(_value, clamped_value):
			return
		_value = clamped_value
		_request_animation_update()
		_sync_visuals()

@export_enum("normal", "warning", "critical", "success", "disabled") var semantic_state := "normal":
	set(next_state):
		semantic_state = next_state
		_sync_visuals()
@export_range(1.0, 30.0, 0.5) var smooth_speed := 10.0
@export var animate_value_changes := false
@export var show_value_label := true:
	set(next_value):
		show_value_label = next_value
		_sync_visuals()
@export var show_center_plate := true:
	set(next_value):
		show_center_plate = next_value
		_sync_visuals()
@export var show_cap := true:
	set(next_value):
		show_cap = next_value
		_sync_visuals()
@export var cap_radius := 25.25:
	set(next_value):
		cap_radius = next_value
		_sync_visuals()
@export_range(0.0, 360.0, 0.1) var progress_start_angle_degrees := 0.0:
	set(next_value):
		progress_start_angle_degrees = next_value
		_sync_visuals()
@export_range(-180.0, 180.0, 0.1) var cap_angle_offset_degrees := 0.0:
	set(next_value):
		cap_angle_offset_degrees = next_value
		_sync_visuals()
@export var value_label_source_rect := Rect2(3.0, 17.0, 58.0, 30.0):
	set(next_value):
		value_label_source_rect = next_value
		_layout_children()
@export var value_label_atlas: Texture2D = VALUE_LABEL_FONT_ATLAS:
	set(next_value):
		value_label_atlas = next_value
		_sync_visuals()
@export var value_label_color := Color("#ffffff"):
	set(next_value):
		value_label_color = next_value
		_sync_visuals()
@export_range(0.08, 0.24, 0.005) var value_label_scale_px := 0.18:
	set(next_value):
		value_label_scale_px = next_value
		_sync_visuals()

var _display_value := 50.0
var _progress: TextureProgressBar
var _center_plate: TextureRect
var _end_cap: TextureRect
var _value_label: Control
var _texture_under: Texture2D
var _texture_fill_cyan: Texture2D
var _texture_fill_green: Texture2D
var _texture_fill_warning: Texture2D
var _texture_fill_error: Texture2D
var _texture_over: Texture2D
var _texture_center_plate: Texture2D
var _texture_cap_cyan: Texture2D
var _texture_cap_green: Texture2D
var _texture_cap_warning: Texture2D
var _texture_cap_error: Texture2D


func _ready() -> void:
	custom_minimum_size = CELL_SIZE
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_display_value = value
	_cache_children()
	_configure_progress()
	_sync_visuals()
	set_process(false)


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_layout_children()
		_sync_visuals()


func _process(delta: float) -> void:
	var blend := 1.0 - exp(-smooth_speed * delta)
	_display_value = lerpf(_display_value, value, blend)
	if absf(_display_value - value) < 0.01:
		_display_value = value
		set_process(false)

	_sync_visuals()


func _request_animation_update() -> void:
	if Engine.is_editor_hint() or not animate_value_changes:
		_display_value = value
		set_process(false)
		return
	set_process(absf(_display_value - value) >= 0.01)


func _cache_children() -> void:
	_progress = get_node_or_null("ProgressTexture") as TextureProgressBar
	if _progress == null and not Engine.is_editor_hint():
		_progress = TextureProgressBar.new()
		_progress.name = "ProgressTexture"
		add_child(_progress)

	_center_plate = get_node_or_null("CenterPlate") as TextureRect
	if _center_plate == null and not Engine.is_editor_hint():
		_center_plate = TextureRect.new()
		_center_plate.name = "CenterPlate"
		add_child(_center_plate)

	_end_cap = get_node_or_null("EndCap") as TextureRect
	if _end_cap == null and not Engine.is_editor_hint():
		_end_cap = TextureRect.new()
		_end_cap.name = "EndCap"
		add_child(_end_cap)

	_value_label = get_node_or_null("ValueBitmapText") as Control
	if _value_label == null and not Engine.is_editor_hint():
		var old_label := get_node_or_null("ValueLabel") as Label
		_value_label = E_GRID_COMPONENT_BITMAP_TEXT_SCRIPT.new() as Control
		_value_label.name = "ValueBitmapText"
		add_child(_value_label)
		if old_label != null:
			old_label.visible = false

	for child in [_progress, _center_plate, _end_cap, _value_label]:
		if child is Control:
			(child as Control).mouse_filter = Control.MOUSE_FILTER_IGNORE

	for texture_child in [_center_plate, _end_cap]:
		if texture_child == null:
			continue
		texture_child.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
		texture_child.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		texture_child.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED

	_layout_children()


func _configure_progress() -> void:
	if _progress == null:
		return

	_progress.min_value = 0.0
	_progress.max_value = 100.0
	_progress.step = 0.001
	_progress.fill_mode = TextureProgressBar.FILL_CLOCKWISE
	_progress.nine_patch_stretch = false
	_progress.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_progress.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	_set_property_if_available(_progress, "radial_initial_angle", progress_start_angle_degrees)
	_set_property_if_available(_progress, "radial_fill_degrees", 360.0)


func _layout_children() -> void:
	if not is_inside_tree() or _progress == null:
		return

	var fitted_rect := _content_rect()
	_progress.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_progress.position = fitted_rect.position
	_progress.size = fitted_rect.size

	if _center_plate != null:
		_center_plate.set_anchors_preset(Control.PRESET_TOP_LEFT)
		_center_plate.position = fitted_rect.position
		_center_plate.size = fitted_rect.size

	if _value_label != null:
		var source_scale := fitted_rect.size.x / CELL_SIZE.x
		_value_label.set_anchors_preset(Control.PRESET_TOP_LEFT)
		_value_label.position = fitted_rect.position + value_label_source_rect.position * source_scale
		_value_label.size = value_label_source_rect.size * source_scale
		_value_label.set("horizontal_alignment", "center")
		_value_label.set("vertical_alignment", "center")


func _sync_visuals() -> void:
	if not is_inside_tree():
		return

	_cache_children_if_needed()
	_load_runtime_textures()
	_configure_progress()
	_layout_children()

	if _progress != null:
		_progress.texture_under = _texture_under
		_progress.texture_progress = _fill_texture()
		_progress.texture_over = _texture_over
		_progress.value = clampf(_display_value, 0.0, 100.0)
		_progress.modulate = Color(1.0, 1.0, 1.0, 0.42) if semantic_state == "disabled" else Color.WHITE

	if _center_plate != null:
		_center_plate.texture = _texture_center_plate
		_center_plate.visible = show_center_plate
		_center_plate.modulate = Color(1.0, 1.0, 1.0, 0.42) if semantic_state == "disabled" else Color.WHITE

	_sync_cap()
	_sync_label()


func _cache_children_if_needed() -> void:
	if _progress == null or _end_cap == null or _value_label == null:
		_cache_children()


func _load_runtime_textures() -> void:
	if _texture_under != null:
		return

	_texture_under = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TEXTURE_UNDER_PATH)
	_texture_fill_cyan = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TEXTURE_FILL_CYAN_PATH)
	_texture_fill_green = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TEXTURE_FILL_GREEN_PATH)
	_texture_fill_warning = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TEXTURE_FILL_WARNING_PATH)
	_texture_fill_error = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TEXTURE_FILL_ERROR_PATH)
	_texture_over = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TEXTURE_OVER_PATH)
	_texture_center_plate = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TEXTURE_CENTER_PLATE_PATH)
	_texture_cap_cyan = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TEXTURE_CAP_CYAN_PATH)
	_texture_cap_green = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TEXTURE_CAP_GREEN_PATH)
	_texture_cap_warning = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TEXTURE_CAP_WARNING_PATH)
	_texture_cap_error = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TEXTURE_CAP_ERROR_PATH)


func _sync_cap() -> void:
	if _end_cap == null:
		return

	var normalized := clampf(_display_value / 100.0, 0.0, 1.0)
	_end_cap.visible = show_cap and normalized > 0.001 and semantic_state != "disabled"
	if not _end_cap.visible:
		return

	var fitted_rect := _content_rect()
	var source_scale := fitted_rect.size.x / CELL_SIZE.x
	var cap_size := CAP_SIZE * source_scale
	var center := fitted_rect.position + fitted_rect.size * 0.5
	var angle := deg_to_rad(progress_start_angle_degrees + 360.0 * normalized + cap_angle_offset_degrees)
	var radius := cap_radius * source_scale
	_end_cap.texture = _cap_texture()
	_end_cap.modulate = Color.WHITE
	_end_cap.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_end_cap.size = cap_size
	_end_cap.position = center + Vector2(sin(angle), -cos(angle)) * radius - cap_size * 0.5


func _sync_label() -> void:
	if _value_label == null:
		return

	_value_label.visible = show_value_label
	_value_label.set("text", "%d%%" % int(roundf(value)))
	_value_label.set("atlas_texture", value_label_atlas)
	_value_label.set("font_color", value_label_color if semantic_state != "disabled" else Color("#546467"))
	_value_label.set("scale_px", value_label_scale_px)
	_value_label.set("min_scale_px", 0.13)
	_value_label.set("max_scale_px", 0.22)
	_value_label.set("opacity_passes", 3)
	_value_label.set("shadow_enabled", semantic_state != "disabled")
	_value_label.set("shadow_color", Color("#020608f2"))
	_value_label.set("shadow_offset", Vector2(1.0, 1.0))
	_value_label.set("outline_enabled", semantic_state != "disabled")
	_value_label.set("outline_color", Color("#020608e6"))
	_value_label.set("outline_size", 1.0)
	_value_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_value_label.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	_value_label.queue_redraw()


func _fill_texture() -> Texture2D:
	if semantic_state == "warning":
		return _texture_fill_warning
	if semantic_state == "critical":
		return _texture_fill_error
	if semantic_state == "success":
		return _texture_fill_green
	return _texture_fill_cyan


func _cap_texture() -> Texture2D:
	if semantic_state == "warning":
		return _texture_cap_warning
	if semantic_state == "critical":
		return _texture_cap_error
	if semantic_state == "success" and _texture_cap_green != null:
		return _texture_cap_green
	return _texture_cap_cyan


func _content_rect() -> Rect2:
	var target_size := size
	if target_size.x <= 0.0 or target_size.y <= 0.0:
		target_size = custom_minimum_size

	var fit_scale := minf(target_size.x / CELL_SIZE.x, target_size.y / CELL_SIZE.y)
	var fitted_size := CELL_SIZE * fit_scale
	return Rect2((target_size - fitted_size) * 0.5, fitted_size)


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return
