@tool
class_name EGridSlotCard
extends Button

const E_GRID_RUNTIME_TEXTURE_LOADER := preload("res://scripts/ui/components/e_grid_runtime_texture_loader.gd")

const CELL_SIZE := Vector2(80.0, 80.0)
const BADGE_SIZE := Vector2(24.0, 24.0)
const ICON_SAFE_RECT := Rect2(7.0, 6.0, 66.0, 58.0)
const PIPS_SOURCE_RECT := Rect2(14.0, 70.0, 45.0, 9.0)
const PIPS_TARGET_RECT := Rect2(17.5, 66.0, 45.0, 9.0)
const TOP_BARS_SOURCE_RECT := Rect2(69.0, 9.0, 11.0, 9.0)
const TOP_BARS_TARGET_RECT := Rect2(64.0, 8.0, 11.0, 9.0)
const BOTTOM_TIER_SOURCE_RECT := Rect2(68.0, 69.0, 10.0, 9.0)
const BOTTOM_TIER_TARGET_RECT := Rect2(64.0, 65.0, 10.0, 9.0)

const BASE_STATES_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/slot_card/slot_card_base_states_80.png"
const STATE_OVERLAYS_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/slot_card/slot_card_state_overlays_80.png"
const PIPS_STATES_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/slot_card/slot_card_bottom_pips_states_80.png"
const BOTTOM_TIER_BARS_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/slot_card/slot_card_bottom_tier_bars_80.png"
const TOP_MICROBARS_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/slot_card/slot_card_top_microbars_80.png"
const STATUS_OVERLAYS_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/slot_card/slot_card_warning_error_status_overlays_80.png"
const WARNING_ERROR_BADGES_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/slot_card/warning_error_badges_24.png"
const LOCK_OVERLAY_PATH := "res://assets/ui/components/egrid_2045_slot_card_component_pack_v5_clean/runtime_textures/slot_card/slot_card_lock_overlay_80.png"

const BASE_FRAME := {
	"empty": 0,
	"hover": 1,
	"selected": 2,
	"drop_target": 3,
	"disabled": 4,
	"locked": 5,
	"warning": 6,
	"error": 7,
}

const STATE_OVERLAY_FRAME := {
	"none": 0,
	"hover": 1,
	"selected": 2,
	"drop_target": 3,
	"warning": 4,
	"warning_pulse": 5,
	"error": 6,
	"error_pulse": 7,
	"disabled_scrim": 8,
	"drag_ghost": 9,
}

const STATUS_FRAME := {
	"none": 0,
	"warning_inactive": 1,
	"warning_active": 2,
	"warning_pulse": 3,
	"error_inactive": 4,
	"error_active": 5,
	"error_pulse": 6,
}

const FULL_CELL_LAYERS := [
	"Base",
	"BuildingIcon",
	"Pips",
	"BottomTier",
	"TopBars",
	"StateOverlay",
	"StatusOverlay",
	"LockOverlay",
]

@export_group("Slot State")
@export_enum("auto", "empty", "hover", "selected", "drop_target", "disabled", "locked", "warning", "error") var base_state := "auto":
	set(value):
		base_state = value
		_sync_visuals()
@export_enum("normal", "warning", "critical", "disabled") var semantic_state := "normal":
	set(value):
		semantic_state = value
		_sync_visuals()
@export var locked := false:
	set(value):
		locked = value
		_sync_visuals()
@export var drop_target := false:
	set(value):
		drop_target = value
		_sync_visuals()
@export var drag_ghost := false:
	set(value):
		drag_ghost = value
		_sync_visuals()

@export_group("Runtime Layers")
@export var building_icon: Texture2D:
	set(value):
		building_icon = value
		_sync_visuals()
@export_range(0, 5, 1) var pips_active := 0:
	set(value):
		pips_active = clampi(value, 0, 5)
		_sync_visuals()
@export_range(0, 3, 1) var bottom_tier := 0:
	set(value):
		bottom_tier = clampi(value, 0, 3)
		_sync_visuals()
@export_range(0, 3, 1) var top_bars := 0:
	set(value):
		top_bars = clampi(value, 0, 3)
		_sync_visuals()
@export_enum("auto", "none", "warning_inactive", "warning_active", "warning_pulse", "error_inactive", "error_active", "error_pulse") var status_state := "auto":
	set(value):
		status_state = value
		_sync_visuals()
@export var show_state_overlay := false:
	set(value):
		show_state_overlay = value
		_sync_visuals()
@export var show_status_badge := false:
	set(value):
		show_status_badge = value
		_sync_visuals()
@export var status_badge_source_rect := Rect2(4.0, 5.0, 24.0, 24.0):
	set(value):
		status_badge_source_rect = value
		_layout_layers()

var _base: TextureRect
var _building_icon: TextureRect
var _pips: TextureRect
var _bottom_tier: TextureRect
var _top_bars: TextureRect
var _state_overlay: TextureRect
var _status_overlay: TextureRect
var _status_badge: TextureRect
var _lock_overlay: TextureRect
var _base_states_texture: Texture2D
var _state_overlays_texture: Texture2D
var _pips_states_texture: Texture2D
var _bottom_tier_bars_texture: Texture2D
var _top_microbars_texture: Texture2D
var _status_overlays_texture: Texture2D
var _warning_error_badges_texture: Texture2D
var _lock_overlay_texture: Texture2D
var _last_visual_key := ""


func _ready() -> void:
	text = ""
	flat = true
	focus_mode = Control.FOCUS_ALL
	custom_minimum_size = CELL_SIZE
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_install_empty_button_styles()
	_cache_layers()
	_connect_state_signals()
	_sync_visuals()
	set_process(true)


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_layout_layers()


func _process(_delta: float) -> void:
	var visual_key := _visual_key()
	if visual_key != _last_visual_key:
		_sync_visuals()


func _install_empty_button_styles() -> void:
	add_theme_stylebox_override("normal", StyleBoxEmpty.new())
	add_theme_stylebox_override("hover", StyleBoxEmpty.new())
	add_theme_stylebox_override("pressed", StyleBoxEmpty.new())
	add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	add_theme_stylebox_override("disabled", StyleBoxEmpty.new())


func _connect_state_signals() -> void:
	var sync_call := Callable(self, "_sync_visuals")
	for signal_ref in [mouse_entered, mouse_exited, focus_entered, focus_exited, button_down, button_up]:
		if not signal_ref.is_connected(sync_call):
			signal_ref.connect(sync_call)

	var toggled_call := Callable(self, "_on_toggled")
	if not toggled.is_connected(toggled_call):
		toggled.connect(toggled_call)


func _on_toggled(_pressed: bool) -> void:
	_sync_visuals()


func _cache_layers() -> void:
	_base = _ensure_layer("Base")
	_building_icon = _ensure_layer("BuildingIcon")
	_pips = _ensure_layer("Pips")
	_bottom_tier = _ensure_layer("BottomTier")
	_top_bars = _ensure_layer("TopBars")
	_state_overlay = _ensure_layer("StateOverlay")
	_status_overlay = _ensure_layer("StatusOverlay")
	_status_badge = _ensure_layer("StatusBadge")
	_lock_overlay = _ensure_layer("LockOverlay")
	_layout_layers()


func _ensure_layer(node_name: String) -> TextureRect:
	var layer := get_node_or_null(node_name) as TextureRect
	if layer == null and not Engine.is_editor_hint():
		layer = TextureRect.new()
		layer.name = node_name
		add_child(layer)

	if layer == null:
		return null

	layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.texture_filter = _texture_filter_for_layer(node_name)
	layer.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	layer.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	return layer


func _layout_layers() -> void:
	if not is_inside_tree() or _base == null:
		return

	var fitted_rect := _card_rect()
	for layer_name in FULL_CELL_LAYERS:
		var layer := get_node_or_null(layer_name) as TextureRect
		if layer == null:
			continue
		layer.set_anchors_preset(Control.PRESET_TOP_LEFT)
		layer.position = fitted_rect.position
		layer.size = fitted_rect.size

	var source_scale := fitted_rect.size.x / CELL_SIZE.x
	if _building_icon != null:
		_building_icon.position = fitted_rect.position + ICON_SAFE_RECT.position * source_scale
		_building_icon.size = ICON_SAFE_RECT.size * source_scale

	if _pips != null:
		_pips.set_anchors_preset(Control.PRESET_TOP_LEFT)
		_pips.position = fitted_rect.position + PIPS_TARGET_RECT.position * source_scale
		_pips.size = PIPS_TARGET_RECT.size * source_scale

	if _top_bars != null:
		_top_bars.set_anchors_preset(Control.PRESET_TOP_LEFT)
		_top_bars.position = fitted_rect.position + TOP_BARS_TARGET_RECT.position * source_scale
		_top_bars.size = TOP_BARS_TARGET_RECT.size * source_scale

	if _bottom_tier != null:
		_bottom_tier.set_anchors_preset(Control.PRESET_TOP_LEFT)
		_bottom_tier.position = fitted_rect.position + BOTTOM_TIER_TARGET_RECT.position * source_scale
		_bottom_tier.size = BOTTOM_TIER_TARGET_RECT.size * source_scale

	if _status_badge != null:
		_status_badge.set_anchors_preset(Control.PRESET_TOP_LEFT)
		_status_badge.position = fitted_rect.position + status_badge_source_rect.position * source_scale
		_status_badge.size = status_badge_source_rect.size * source_scale


func _sync_visuals() -> void:
	if not is_inside_tree():
		return

	_cache_layers_if_needed()
	_load_runtime_textures()
	_layout_layers()

	var resolved_base_state := _resolved_base_state()
	_set_texture_frame(_base, _base_states_texture, BASE_FRAME.get(resolved_base_state, 0), CELL_SIZE)

	if _building_icon != null:
		_building_icon.texture = building_icon
		_building_icon.visible = building_icon != null

	_set_texture_frame_region(_pips, _pips_states_texture, pips_active, CELL_SIZE, PIPS_SOURCE_RECT)
	_set_texture_frame_region(_bottom_tier, _bottom_tier_bars_texture, bottom_tier, CELL_SIZE, BOTTOM_TIER_SOURCE_RECT)
	_set_texture_frame_region(_top_bars, _top_microbars_texture, top_bars, CELL_SIZE, TOP_BARS_SOURCE_RECT)

	var overlay_state := _resolved_state_overlay()
	_set_texture_frame(_state_overlay, _state_overlays_texture, STATE_OVERLAY_FRAME.get(overlay_state, 0), CELL_SIZE)
	if _state_overlay != null:
		_state_overlay.visible = show_state_overlay and overlay_state != "none"

	var resolved_status := _resolved_status_state()
	_set_texture_frame(_status_overlay, _status_overlays_texture, STATUS_FRAME.get(resolved_status, 0), CELL_SIZE)
	if _status_overlay != null:
		_status_overlay.visible = resolved_status != "none"
	_sync_status_badge(resolved_status)

	_set_texture_frame(_lock_overlay, _lock_overlay_texture, 0, CELL_SIZE)
	if _lock_overlay != null:
		_lock_overlay.visible = locked

	mouse_default_cursor_shape = Control.CURSOR_ARROW if locked or _is_visually_disabled() else Control.CURSOR_POINTING_HAND
	_last_visual_key = _visual_key()


func _cache_layers_if_needed() -> void:
	if _base == null or _pips == null or _status_overlay == null:
		_cache_layers()


func _load_runtime_textures() -> void:
	if _base_states_texture != null:
		return

	_base_states_texture = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(BASE_STATES_PATH)
	_state_overlays_texture = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(STATE_OVERLAYS_PATH)
	_pips_states_texture = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(PIPS_STATES_PATH)
	_bottom_tier_bars_texture = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(BOTTOM_TIER_BARS_PATH)
	_top_microbars_texture = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(TOP_MICROBARS_PATH)
	_status_overlays_texture = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(STATUS_OVERLAYS_PATH)
	_warning_error_badges_texture = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(WARNING_ERROR_BADGES_PATH)
	_lock_overlay_texture = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(LOCK_OVERLAY_PATH)


func _sync_status_badge(resolved_status: String) -> void:
	if _status_badge == null:
		return

	var badge_cell := BADGE_SIZE
	var row := -1
	var column := 0

	if resolved_status.begins_with("warning"):
		row = 0
	elif resolved_status.begins_with("error"):
		row = 1

	if resolved_status.ends_with("active"):
		column = 1
	elif resolved_status.ends_with("pulse"):
		column = 2

	if row < 0:
		_status_badge.visible = false
		return

	_status_badge.texture = _atlas_texture(
		_warning_error_badges_texture,
		Rect2(Vector2(float(column) * badge_cell.x, float(row) * badge_cell.y), badge_cell)
	)
	_status_badge.visible = show_status_badge


func _set_texture_frame(target: TextureRect, texture: Texture2D, frame_index: int, cell_size: Vector2) -> void:
	if target == null:
		return

	target.texture = _atlas_texture(texture, Rect2(Vector2(float(frame_index) * cell_size.x, 0.0), cell_size))


func _set_texture_frame_region(
	target: TextureRect,
	texture: Texture2D,
	frame_index: int,
	cell_size: Vector2,
	source_rect: Rect2
) -> void:
	if target == null:
		return

	var frame_origin := Vector2(float(frame_index) * cell_size.x, 0.0)
	target.texture = _atlas_texture(texture, Rect2(frame_origin + source_rect.position, source_rect.size))


func _atlas_texture(texture: Texture2D, region: Rect2) -> Texture2D:
	if texture == null:
		return null

	var atlas := AtlasTexture.new()
	atlas.atlas = texture
	atlas.region = region
	return atlas


func _resolved_base_state() -> String:
	if base_state != "auto":
		return base_state

	if _is_visually_disabled():
		return "disabled"
	if locked or semantic_state == "critical" or semantic_state == "warning":
		return "empty"
	if drop_target:
		return "drop_target"
	if button_pressed:
		return "selected"
	if is_hovered() or has_focus():
		return "hover"

	return "empty"


func _resolved_state_overlay() -> String:
	if drag_ghost:
		return "drag_ghost"
	if not show_state_overlay:
		return "none"
	if _is_visually_disabled():
		return "disabled_scrim"
	if drop_target:
		return "drop_target"
	if button_pressed:
		return "selected"
	if is_hovered() or has_focus():
		return "hover"

	return "none"


func _resolved_status_state() -> String:
	if status_state != "auto":
		return status_state

	if semantic_state == "critical":
		return "error_active"
	if semantic_state == "warning":
		return "warning_active"

	return "none"


func _is_visually_disabled() -> bool:
	return disabled or semantic_state == "disabled"


func _visual_key() -> String:
	return "%s|%s|%s|%s|%s|%s|%d|%d|%d|%s|%s|%s|%s|%s" % [
		base_state,
		semantic_state,
		str(locked),
		str(drop_target),
		str(drag_ghost),
		str(button_pressed),
		pips_active,
		bottom_tier,
		top_bars,
		status_state,
		str(show_state_overlay),
		str(show_status_badge),
		str(is_hovered() or has_focus()),
		str(disabled),
	]


func _card_rect() -> Rect2:
	var target_size := size
	if target_size.x <= 0.0 or target_size.y <= 0.0:
		target_size = custom_minimum_size

	var fit_scale := minf(target_size.x / CELL_SIZE.x, target_size.y / CELL_SIZE.y)
	var fitted_size := CELL_SIZE * fit_scale
	return Rect2((target_size - fitted_size) * 0.5, fitted_size)


func _texture_filter_for_layer(layer_name: String) -> CanvasItem.TextureFilter:
	if ["Pips", "BottomTier", "TopBars", "StatusBadge"].has(layer_name):
		return CanvasItem.TEXTURE_FILTER_NEAREST

	return CanvasItem.TEXTURE_FILTER_LINEAR
