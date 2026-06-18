class_name DisplaySettingsPanel
extends VBoxContainer

signal settings_changed

const UNLIMITED_FPS_SLIDER_VALUE := 241.0
const COMMON_RESOLUTIONS := [
	Vector2i(1280, 720),
	Vector2i(1366, 768),
	Vector2i(1600, 900),
	Vector2i(1920, 1080),
	Vector2i(2560, 1440),
	Vector2i(3440, 1440),
	Vector2i(3840, 2160),
]

@export_node_path("OptionButton") var screen_option_path: NodePath = ^"OptionsGrid/ScreenOptionButton"
@export_node_path("OptionButton") var resolution_option_path: NodePath = ^"OptionsGrid/ResolutionOptionButton"
@export_node_path("CheckBox") var fullscreen_checkbox_path: NodePath = ^"OptionsGrid/FullscreenCheckBox"
@export_node_path("CheckBox") var vsync_checkbox_path: NodePath = ^"OptionsGrid/VsyncCheckBox"
@export_node_path("Control") var fps_slider_path: NodePath = ^"FpsSlider"

var _screen_option: OptionButton
var _resolution_option: OptionButton
var _fullscreen_checkbox: CheckBox
var _vsync_checkbox: CheckBox
var _fps_slider: Control
var _resolution_options: Array[Vector2i] = []
var _selected_screen := 0
var _selected_resolution := Vector2i.ZERO
var _is_setting_controls := false


func _ready() -> void:
	_cache_nodes()
	_populate_screen_options()
	set_settings(get_runtime_settings())
	_wire_signals()


func _cache_nodes() -> void:
	_screen_option = get_node_or_null(screen_option_path) as OptionButton
	_resolution_option = get_node_or_null(resolution_option_path) as OptionButton
	_fullscreen_checkbox = get_node_or_null(fullscreen_checkbox_path) as CheckBox
	_vsync_checkbox = get_node_or_null(vsync_checkbox_path) as CheckBox
	_fps_slider = get_node_or_null(fps_slider_path) as Control


func _wire_signals() -> void:
	if _screen_option != null:
		_screen_option.item_selected.connect(_on_screen_selected)

	if _resolution_option != null:
		_resolution_option.item_selected.connect(_on_resolution_selected)

	if _fullscreen_checkbox != null:
		_fullscreen_checkbox.toggled.connect(_on_fullscreen_toggled)

	if _vsync_checkbox != null:
		_vsync_checkbox.toggled.connect(_on_vsync_toggled)

	if _fps_slider != null:
		_fps_slider.connect("value_changed", _on_fps_slider_changed)


func get_settings() -> Dictionary:
	var max_fps := _get_fps_setting_value()
	return {
		"screen": _selected_screen,
		"resolution_width": _selected_resolution.x,
		"resolution_height": _selected_resolution.y,
		"fullscreen": _fullscreen_checkbox.button_pressed if _fullscreen_checkbox != null else _is_fullscreen(),
		"vsync": _vsync_checkbox.button_pressed if _vsync_checkbox != null else DisplayServer.window_get_vsync_mode() != DisplayServer.VSYNC_DISABLED,
		"max_fps": max_fps,
	}


func get_runtime_settings() -> Dictionary:
	var screen_count := maxi(DisplayServer.get_screen_count(), 1)
	var current_screen := clampi(DisplayServer.window_get_current_screen(), 0, screen_count - 1)
	var current_resolution := DisplayServer.window_get_size()

	return {
		"screen": current_screen,
		"resolution_width": current_resolution.x,
		"resolution_height": current_resolution.y,
		"fullscreen": _is_fullscreen(),
		"vsync": DisplayServer.window_get_vsync_mode() != DisplayServer.VSYNC_DISABLED,
		"max_fps": maxi(Engine.max_fps, 0),
	}


func set_settings(settings: Dictionary) -> void:
	_is_setting_controls = true

	var screen_count := maxi(DisplayServer.get_screen_count(), 1)
	var screen := clampi(int(settings.get("screen", DisplayServer.get_primary_screen())), 0, screen_count - 1)
	_select_screen(screen)
	_populate_resolution_options()

	var resolution := Vector2i(
		int(settings.get("resolution_width", DisplayServer.window_get_size().x)),
		int(settings.get("resolution_height", DisplayServer.window_get_size().y))
	)
	_select_resolution(_get_best_resolution_index(resolution))

	if _fullscreen_checkbox != null:
		_fullscreen_checkbox.set_pressed_no_signal(bool(settings.get("fullscreen", _is_fullscreen())))

	if _vsync_checkbox != null:
		_vsync_checkbox.set_pressed_no_signal(bool(settings.get("vsync", DisplayServer.window_get_vsync_mode() != DisplayServer.VSYNC_DISABLED)))

	_set_fps_slider_value(_fps_setting_to_slider_value(int(settings.get("max_fps", Engine.max_fps))))
	_is_setting_controls = false


func apply_settings(settings: Dictionary = {}) -> void:
	var applied_settings := settings if not settings.is_empty() else get_settings()
	var screen_count := maxi(DisplayServer.get_screen_count(), 1)
	var screen := clampi(int(applied_settings.get("screen", _selected_screen)), 0, screen_count - 1)
	var resolution := Vector2i(
		int(applied_settings.get("resolution_width", _selected_resolution.x)),
		int(applied_settings.get("resolution_height", _selected_resolution.y))
	)
	var fullscreen := bool(applied_settings.get("fullscreen", false))
	var vsync := bool(applied_settings.get("vsync", true))
	var max_fps := maxi(int(applied_settings.get("max_fps", 0)), 0)

	DisplayServer.window_set_current_screen(screen)

	if fullscreen:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
		_apply_resolution(screen, resolution)

	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED if vsync else DisplayServer.VSYNC_DISABLED)
	Engine.max_fps = max_fps


func _populate_screen_options() -> void:
	if _screen_option == null:
		return

	_screen_option.clear()

	var screen_count := maxi(DisplayServer.get_screen_count(), 1)
	var primary_screen := clampi(DisplayServer.get_primary_screen(), 0, screen_count - 1)

	for screen_index in screen_count:
		_screen_option.add_item(_format_screen_label(screen_index, primary_screen), screen_index)

	_select_screen(primary_screen)
	_populate_resolution_options()


func _format_screen_label(screen_index: int, primary_screen: int) -> String:
	var screen_size := DisplayServer.screen_get_size(screen_index)
	var label := "Ecran %d (%dx%d)" % [screen_index + 1, screen_size.x, screen_size.y]

	if screen_index == primary_screen:
		label += " - Principal"

	return label


func _select_screen(screen_index: int) -> void:
	_selected_screen = clampi(screen_index, 0, maxi(DisplayServer.get_screen_count() - 1, 0))

	if _screen_option == null:
		return

	for item_index in _screen_option.get_item_count():
		if _screen_option.get_item_id(item_index) == _selected_screen:
			_screen_option.select(item_index)
			return


func _populate_resolution_options() -> void:
	if _resolution_option == null:
		return

	_resolution_option.clear()
	_resolution_options = _get_resolutions_for_screen(_selected_screen)

	for item_index in _resolution_options.size():
		var resolution := _resolution_options[item_index]
		_resolution_option.add_item("%d x %d" % [resolution.x, resolution.y], item_index)

	var current_size := DisplayServer.window_get_size()
	var selected_index := _find_resolution_index(current_size)

	if selected_index == -1:
		selected_index = _find_resolution_index(DisplayServer.screen_get_size(_selected_screen))

	if selected_index == -1:
		selected_index = maxi(_resolution_options.size() - 1, 0)

	_select_resolution(selected_index)


func _get_resolutions_for_screen(screen_index: int) -> Array[Vector2i]:
	var screen_size := DisplayServer.screen_get_size(screen_index)
	var current_window_size := DisplayServer.window_get_size()
	var resolutions: Array[Vector2i] = []

	for resolution in COMMON_RESOLUTIONS:
		if resolution.x <= screen_size.x and resolution.y <= screen_size.y:
			_append_unique_resolution(resolutions, resolution)

	if screen_size.x > 0 and screen_size.y > 0:
		_append_unique_resolution(resolutions, screen_size)

	if current_window_size.x > 0 and current_window_size.y > 0:
		_append_unique_resolution(resolutions, current_window_size)

	resolutions.sort_custom(func(a: Vector2i, b: Vector2i) -> bool:
		if a.x == b.x:
			return a.y < b.y

		return a.x < b.x
	)

	return resolutions


func _append_unique_resolution(resolutions: Array[Vector2i], resolution: Vector2i) -> void:
	if not resolutions.has(resolution):
		resolutions.append(resolution)


func _find_resolution_index(resolution: Vector2i) -> int:
	for item_index in _resolution_options.size():
		if _resolution_options[item_index] == resolution:
			return item_index

	return -1


func _select_resolution(item_index: int) -> void:
	if item_index < 0 or item_index >= _resolution_options.size():
		return

	_selected_resolution = _resolution_options[item_index]

	if _resolution_option != null:
		_resolution_option.select(item_index)


func _is_fullscreen() -> bool:
	var window_mode := DisplayServer.window_get_mode()
	return window_mode == DisplayServer.WINDOW_MODE_FULLSCREEN or window_mode == DisplayServer.WINDOW_MODE_EXCLUSIVE_FULLSCREEN


func _apply_resolution(screen: int, resolution: Vector2i) -> void:
	if resolution.x <= 0 or resolution.y <= 0:
		return

	_selected_resolution = resolution

	DisplayServer.window_set_current_screen(screen)
	DisplayServer.window_set_size(resolution)
	_center_window_on_screen(screen, resolution)


func _center_window_on_screen(screen: int, resolution: Vector2i) -> void:
	var screen_position := DisplayServer.screen_get_position(screen)
	var screen_size := DisplayServer.screen_get_size(screen)
	var centered_offset := Vector2i(
		maxi(0, roundi(float(screen_size.x - resolution.x) * 0.5)),
		maxi(0, roundi(float(screen_size.y - resolution.y) * 0.5))
	)

	DisplayServer.window_set_position(screen_position + centered_offset)


func _on_screen_selected(item_index: int) -> void:
	if _screen_option == null:
		return

	_select_screen(_screen_option.get_item_id(item_index))
	_populate_resolution_options()
	_emit_settings_changed()


func _on_resolution_selected(item_index: int) -> void:
	_select_resolution(item_index)
	_emit_settings_changed()


func _on_fullscreen_toggled(_enabled: bool) -> void:
	_emit_settings_changed()


func _on_vsync_toggled(_enabled: bool) -> void:
	_emit_settings_changed()


func _on_fps_slider_changed(_value: float) -> void:
	_emit_settings_changed()


func _set_fps_slider_value(value: float) -> void:
	if _fps_slider != null and _fps_slider.has_method("set_slider_value"):
		_fps_slider.call("set_slider_value", value)


func _get_fps_slider_min_value() -> float:
	if _fps_slider == null:
		return 30.0

	var configured_min = _fps_slider.get("min_value")

	if configured_min == null:
		return 30.0

	return float(configured_min)


func _get_best_resolution_index(resolution: Vector2i) -> int:
	var selected_index := _find_resolution_index(resolution)

	if selected_index == -1:
		selected_index = _find_resolution_index(DisplayServer.window_get_size())

	if selected_index == -1:
		selected_index = _find_resolution_index(DisplayServer.screen_get_size(_selected_screen))

	if selected_index == -1:
		selected_index = maxi(_resolution_options.size() - 1, 0)

	return selected_index


func _get_fps_setting_value() -> int:
	if _fps_slider == null:
		return maxi(Engine.max_fps, 0)

	var slider_value := 0.0

	if _fps_slider.has_method("get_slider_value"):
		slider_value = float(_fps_slider.call("get_slider_value"))
	else:
		var property_value = _fps_slider.get("slider_value")
		slider_value = float(property_value) if property_value != null else UNLIMITED_FPS_SLIDER_VALUE

	if slider_value >= UNLIMITED_FPS_SLIDER_VALUE:
		return 0

	return maxi(roundi(slider_value), 0)


func _fps_setting_to_slider_value(max_fps: int) -> float:
	if max_fps <= 0:
		return UNLIMITED_FPS_SLIDER_VALUE

	return clampf(float(max_fps), _get_fps_slider_min_value(), UNLIMITED_FPS_SLIDER_VALUE - 1.0)


func _emit_settings_changed() -> void:
	if not _is_setting_controls:
		settings_changed.emit()
