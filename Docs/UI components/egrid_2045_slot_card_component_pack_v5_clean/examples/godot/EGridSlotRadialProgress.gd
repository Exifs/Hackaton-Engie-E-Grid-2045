extends TextureProgressBar
class_name EGridSlotRadialProgress

# Use with:
# texture_under    = radial_under_64.png
# texture_progress = radial_fill_cyan_64.png, radial_fill_warning_64.png, or radial_fill_error_64.png
# texture_over     = radial_over_bezel_64.png
#
# This is not a frame-based spritesheet. The value is continuous.

@export_range(0.0, 1.0, 0.001) var normalized_value: float = 0.0:
	set(v):
		normalized_value = clampf(v, 0.0, 1.0)
		value = normalized_value

func _ready() -> void:
	min_value = 0.0
	max_value = 1.0
	step = 0.001
	value = normalized_value
	fill_mode = TextureProgressBar.FILL_CLOCKWISE
	nine_patch_stretch = false
