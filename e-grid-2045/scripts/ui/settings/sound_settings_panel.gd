class_name SoundSettingsPanel
extends VBoxContainer

@export var master_bus_name := "Master"
@export var music_bus_name := "Music"
@export var fx_bus_name := "FX"

@export_node_path("Control") var master_slider_path: NodePath = ^"GeneralVolumeSlider"
@export_node_path("Control") var music_slider_path: NodePath = ^"MusicVolumeSlider"
@export_node_path("Control") var fx_slider_path: NodePath = ^"FxVolumeSlider"

var _master_slider: Control
var _music_slider: Control
var _fx_slider: Control


func _ready() -> void:
	_master_slider = get_node_or_null(master_slider_path) as Control
	_music_slider = get_node_or_null(music_slider_path) as Control
	_fx_slider = get_node_or_null(fx_slider_path) as Control

	_setup_volume_slider(_master_slider, master_bus_name)
	_setup_volume_slider(_music_slider, music_bus_name)
	_setup_volume_slider(_fx_slider, fx_bus_name)


func _setup_volume_slider(slider: Control, bus_name: String) -> void:
	if slider == null:
		return

	if slider.has_signal("value_changed"):
		slider.connect("value_changed", _on_volume_slider_changed.bind(bus_name))

	var bus_index := AudioServer.get_bus_index(bus_name)
	if bus_index == -1:
		return

	if slider.has_method("set_slider_value"):
		slider.call("set_slider_value", _get_bus_volume_percent(bus_index))


func _get_bus_volume_percent(bus_index: int) -> float:
	if AudioServer.is_bus_mute(bus_index):
		return 0.0

	return clampf(db_to_linear(AudioServer.get_bus_volume_db(bus_index)) * 100.0, 0.0, 100.0)


func _on_volume_slider_changed(value: float, bus_name: String) -> void:
	var bus_index := AudioServer.get_bus_index(bus_name)
	if bus_index == -1:
		return

	var linear_volume := clampf(value / 100.0, 0.0, 1.0)
	AudioServer.set_bus_mute(bus_index, linear_volume <= 0.0)
	AudioServer.set_bus_volume_db(bus_index, linear_to_db(maxf(linear_volume, 0.0001)))
