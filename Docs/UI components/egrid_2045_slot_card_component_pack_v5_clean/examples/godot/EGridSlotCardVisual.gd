extends Control
class_name EGridSlotCardVisual

# Runtime node recipe:
# Base TextureRect        -> slot_card_base_states_80.png frame 0 or a direct base texture
# BuildingIcon TextureRect -> your building icon, no placeholder texture supplied here
# Pips TextureRect        -> slot_card_bottom_pips_states_80.png, frame 0..5
# BottomTier TextureRect  -> slot_card_bottom_tier_bars_80.png, frame 0..3
# TopBars TextureRect     -> slot_card_top_microbars_80.png, frame 0..3
# Status TextureRect      -> slot_card_warning_error_status_overlays_80.png, frame 0..6
# Lock TextureRect        -> slot_card_lock_overlay_80.png, visible only if locked
#
# All runtime PNGs are texture-only: no text baked into them.

const CELL_SIZE := Vector2i(80, 80)

enum BaseState { EMPTY, HOVER, SELECTED, DROP_TARGET, DISABLED, LOCKED, WARNING, ERROR }
enum StatusState { NONE, WARNING_INACTIVE, WARNING_ACTIVE, WARNING_PULSE, ERROR_INACTIVE, ERROR_ACTIVE, ERROR_PULSE }

@export_range(0, 5, 1) var pips_active: int = 0:
	set(value):
		pips_active = clampi(value, 0, 5)
		_update_region($Pips, pips_active)

@export_range(0, 3, 1) var bottom_tier: int = 0:
	set(value):
		bottom_tier = clampi(value, 0, 3)
		_update_region($BottomTier, bottom_tier)

@export_range(0, 3, 1) var top_bars: int = 0:
	set(value):
		top_bars = clampi(value, 0, 3)
		_update_region($TopBars, top_bars)

@export var base_state: BaseState = BaseState.EMPTY:
	set(value):
		base_state = value
		_update_region($Base, int(base_state))

@export var status_state: StatusState = StatusState.NONE:
	set(value):
		status_state = value
		_update_region($Status, int(status_state))

func _ready() -> void:
	custom_minimum_size = CELL_SIZE
	_apply_all()

func _apply_all() -> void:
	_update_region($Base, int(base_state))
	_update_region($Pips, pips_active)
	_update_region($BottomTier, bottom_tier)
	_update_region($TopBars, top_bars)
	_update_region($Status, int(status_state))

func _update_region(texture_rect: TextureRect, frame_index: int) -> void:
	if texture_rect == null:
		return
	texture_rect.region_enabled = true
	texture_rect.region_rect = Rect2(Vector2(frame_index * CELL_SIZE.x, 0), CELL_SIZE)
