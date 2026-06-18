@tool
class_name SettingsSliderRow
extends HBoxContainer

signal value_changed(value: float)

@export var label_text := "Option":
	set(value):
		label_text = value
		_sync_nodes()

@export var min_value := 0.0:
	set(value):
		min_value = value
		_sync_nodes()

@export var max_value := 100.0:
	set(value):
		max_value = value
		_sync_nodes()

@export var step := 1.0:
	set(value):
		step = value
		_sync_nodes()

@export var slider_value := 100.0:
	set(value):
		slider_value = value
		_sync_nodes()

@export var value_suffix := "":
	set(value):
		value_suffix = value
		_sync_nodes()

@export var max_label := "":
	set(value):
		max_label = value
		_sync_nodes()

var _name_label: Label
var _slider: Control
var _value_label: Label


func _ready() -> void:
	_cache_nodes()
	_connect_slider()
	_sync_nodes()


func set_slider_value(value: float) -> void:
	slider_value = clampf(value, min_value, max_value)
	_sync_nodes()


func get_slider_value() -> float:
	return clampf(slider_value, min_value, max_value)


func _cache_nodes() -> void:
	_name_label = get_node_or_null("NameLabel") as Label
	_slider = get_node_or_null("Slider") as Control
	_value_label = get_node_or_null("ValueLabel") as Label


func _connect_slider() -> void:
	if _slider == null:
		return

	if not _slider.value_changed.is_connected(_on_slider_value_changed):
		_slider.value_changed.connect(_on_slider_value_changed)


func _sync_nodes() -> void:
	if not is_inside_tree():
		return

	if _name_label == null or _slider == null or _value_label == null:
		_cache_nodes()

	var safe_min := minf(min_value, max_value)
	var safe_max := maxf(min_value, max_value)
	var safe_value := clampf(slider_value, safe_min, safe_max)

	if _name_label != null:
		_name_label.text = label_text

	if _slider != null:
		_slider.set("min_value", safe_min)
		_slider.set("max_value", safe_max)
		_slider.set("step", step)
		_slider.set("value_suffix", value_suffix)
		_slider.set("show_value_label", false)
		_set_slider_control_value(safe_value)

	_update_value_label(safe_value)


func _update_value_label(value: float) -> void:
	if _value_label == null:
		return

	_value_label.text = _format_value(value)


func _format_value(value: float) -> String:
	if not max_label.strip_edges().is_empty() and is_equal_approx(value, max_value):
		return max_label

	var rounded_value := roundf(value)

	if is_equal_approx(value, rounded_value):
		return "%d%s" % [int(rounded_value), value_suffix]

	return "%.1f%s" % [value, value_suffix]


func _on_slider_value_changed(value: float) -> void:
	slider_value = value
	_update_value_label(value)
	value_changed.emit(value)


func _set_slider_control_value(value: float) -> void:
	if _slider == null:
		return

	if _slider.has_method("set_slider_value"):
		_slider.call("set_slider_value", value)
	elif _slider.has_method("set_value"):
		_slider.call("set_value", value, false)
	elif _slider is Range:
		(_slider as Range).set_value_no_signal(value)
	else:
		_slider.set("slider_value", value)
