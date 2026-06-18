class_name SoundSettingsPanel
extends VBoxContainer

signal settings_changed

@export var master_bus_name := "Master"
@export var music_bus_name := "Music"
@export var fx_bus_name := "FX"

@export_node_path("Control") var master_slider_path: NodePath = ^"GeneralVolumeSlider"
@export_node_path("Control") var music_slider_path: NodePath = ^"MusicVolumeSlider"
@export_node_path("Control") var fx_slider_path: NodePath = ^"FxVolumeSlider"

var _master_slider: Control
var _music_slider: Control
var _fx_slider: Control
var _is_setting_controls := false


func _ready() -> void:
	_master_slider = get_node_or_null(master_slider_path) as Control
	_music_slider = get_node_or_null(music_slider_path) as Control
	_fx_slider = get_node_or_null(fx_slider_path) as Control

	_ensure_audio_bus(master_bus_name)
	_ensure_audio_bus(music_bus_name)
	_ensure_audio_bus(fx_bus_name)

	_setup_volume_slider(_master_slider)
	_setup_volume_slider(_music_slider)
	_setup_volume_slider(_fx_slider)
	set_settings(get_runtime_settings())


func get_settings() -> Dictionary:
	return {
		"master_volume": _get_slider_value(_master_slider, 100.0),
		"music_volume": _get_slider_value(_music_slider, 100.0),
		"fx_volume": _get_slider_value(_fx_slider, 100.0),
	}


func get_runtime_settings() -> Dictionary:
	return {
		"master_volume": _get_bus_volume_percent(_ensure_audio_bus(master_bus_name)),
		"music_volume": _get_bus_volume_percent(_ensure_audio_bus(music_bus_name)),
		"fx_volume": _get_bus_volume_percent(_ensure_audio_bus(fx_bus_name)),
	}


func set_settings(settings: Dictionary) -> void:
	_is_setting_controls = true
	_set_slider_value(_master_slider, float(settings.get("master_volume", 100.0)))
	_set_slider_value(_music_slider, float(settings.get("music_volume", 100.0)))
	_set_slider_value(_fx_slider, float(settings.get("fx_volume", 100.0)))
	_is_setting_controls = false


func apply_settings(settings: Dictionary = {}) -> void:
	var applied_settings := settings if not settings.is_empty() else get_settings()

	_apply_volume(master_bus_name, float(applied_settings.get("master_volume", 100.0)))
	_apply_volume(music_bus_name, float(applied_settings.get("music_volume", 100.0)))
	_apply_volume(fx_bus_name, float(applied_settings.get("fx_volume", 100.0)))


func _setup_volume_slider(slider: Control) -> void:
	if slider == null:
		return

	if slider.has_signal("value_changed"):
		slider.connect("value_changed", _on_slider_value_changed)


func _ensure_audio_bus(bus_name: String) -> int:
	if bus_name.strip_edges().is_empty():
		return -1

	var bus_index := AudioServer.get_bus_index(bus_name)
	if bus_index != -1:
		return bus_index

	AudioServer.add_bus(AudioServer.get_bus_count())
	bus_index = AudioServer.get_bus_count() - 1
	AudioServer.set_bus_name(bus_index, bus_name)
	return bus_index


func _get_bus_volume_percent(bus_index: int) -> float:
	if bus_index == -1:
		return 100.0

	if AudioServer.is_bus_mute(bus_index):
		return 0.0

	return clampf(db_to_linear(AudioServer.get_bus_volume_db(bus_index)) * 100.0, 0.0, 100.0)


func _apply_volume(bus_name: String, value: float) -> void:
	var bus_index := _ensure_audio_bus(bus_name)
	if bus_index == -1:
		return

	var linear_volume := clampf(value / 100.0, 0.0, 1.0)
	AudioServer.set_bus_mute(bus_index, linear_volume <= 0.0)
	AudioServer.set_bus_volume_db(bus_index, linear_to_db(maxf(linear_volume, 0.0001)))


func _get_slider_value(slider: Control, fallback: float) -> float:
	if slider == null:
		return fallback

	if slider.has_method("get_slider_value"):
		return float(slider.call("get_slider_value"))

	var property_value = slider.get("slider_value")
	if property_value == null:
		return fallback

	return float(property_value)


func _set_slider_value(slider: Control, value: float) -> void:
	if slider == null:
		return

	if slider.has_method("set_slider_value"):
		slider.call("set_slider_value", value)
		return

	slider.set("slider_value", value)


func _on_slider_value_changed(_value: float) -> void:
	if not _is_setting_controls:
		settings_changed.emit()
