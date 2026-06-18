class_name EGridSettingsRuntime
extends RefCounted

const CONFIG_PATH := "user://settings.cfg"


static func apply_saved_settings() -> void:
	var config := ConfigFile.new()
	if config.load(CONFIG_PATH) != OK:
		return

	_apply_sound_settings(_read_section(config, "sound"))
	_apply_display_settings(_read_section(config, "display"))


static func _read_section(config: ConfigFile, section: String) -> Dictionary:
	var settings := {}
	if not config.has_section(section):
		return settings

	for key in config.get_section_keys(section):
		settings[key] = config.get_value(section, key)

	return settings


static func _apply_sound_settings(settings: Dictionary) -> void:
	if settings.has("master_volume"):
		_apply_volume("Master", float(settings["master_volume"]))
	if settings.has("music_volume"):
		_apply_volume("Music", float(settings["music_volume"]))
	if settings.has("fx_volume"):
		_apply_volume("FX", float(settings["fx_volume"]))


static func _apply_volume(bus_name: String, value: float) -> void:
	var bus_index := _ensure_audio_bus(bus_name)
	if bus_index == -1:
		return

	var linear_volume := clampf(value / 100.0, 0.0, 1.0)
	AudioServer.set_bus_mute(bus_index, linear_volume <= 0.0)
	AudioServer.set_bus_volume_db(bus_index, linear_to_db(maxf(linear_volume, 0.0001)))


static func _ensure_audio_bus(bus_name: String) -> int:
	if bus_name.strip_edges().is_empty():
		return -1

	var bus_index := AudioServer.get_bus_index(bus_name)
	if bus_index != -1:
		return bus_index

	AudioServer.add_bus(AudioServer.get_bus_count())
	bus_index = AudioServer.get_bus_count() - 1
	AudioServer.set_bus_name(bus_index, bus_name)
	return bus_index


static func _apply_display_settings(settings: Dictionary) -> void:
	if settings.is_empty():
		return

	var screen_count := maxi(DisplayServer.get_screen_count(), 1)
	var screen := clampi(int(settings.get("screen", DisplayServer.window_get_current_screen())), 0, screen_count - 1)
	var fullscreen := bool(settings.get("fullscreen", _is_fullscreen()))
	DisplayServer.window_set_current_screen(screen)

	if settings.has("fullscreen"):
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN if fullscreen else DisplayServer.WINDOW_MODE_WINDOWED)

	if not fullscreen and settings.has("resolution_width") and settings.has("resolution_height"):
		var resolution := Vector2i(int(settings["resolution_width"]), int(settings["resolution_height"]))
		if resolution.x > 0 and resolution.y > 0:
			DisplayServer.window_set_size(resolution)
			_center_window_on_screen(screen, resolution)

	if settings.has("vsync"):
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED if bool(settings["vsync"]) else DisplayServer.VSYNC_DISABLED)

	if settings.has("max_fps"):
		Engine.max_fps = maxi(int(settings["max_fps"]), 0)


static func _is_fullscreen() -> bool:
	var window_mode := DisplayServer.window_get_mode()
	return window_mode == DisplayServer.WINDOW_MODE_FULLSCREEN or window_mode == DisplayServer.WINDOW_MODE_EXCLUSIVE_FULLSCREEN


static func _center_window_on_screen(screen: int, resolution: Vector2i) -> void:
	var screen_position := DisplayServer.screen_get_position(screen)
	var screen_size := DisplayServer.screen_get_size(screen)
	var centered_offset := Vector2i(
		maxi(0, roundi(float(screen_size.x - resolution.x) * 0.5)),
		maxi(0, roundi(float(screen_size.y - resolution.y) * 0.5))
	)

	DisplayServer.window_set_position(screen_position + centered_offset)
