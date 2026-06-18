class_name EGridComponentWorkbench
extends Control

var _time := 0.0
var _progress_bar: Node
var _progress_ring: Node
var _status_label: Label


func _ready() -> void:
	_fit_to_viewport()
	var resize_call := Callable(self, "_fit_to_viewport")
	if not get_viewport().size_changed.is_connected(resize_call):
		get_viewport().size_changed.connect(resize_call)

	_progress_bar = find_child("ProgressBar", true, false)
	_progress_ring = find_child("ProgressRing", true, false)
	_status_label = find_child("StatusLabel", true, false) as Label

	_connect_slider("HorizontalSlider")
	_connect_slider("VerticalSlider")
	_connect_dropdown("Dropdown")
	_connect_dropdown("LongDropdown")
	_connect_dropdown("DisabledDropdown")
	_connect_button("MiniButton")
	_connect_button("IconButton")
	_connect_button("Checkbox")
	_connect_button("Radio")
	_connect_button("Toggle")
	_set_status("Workbench ready")


func _process(delta: float) -> void:
	_time += delta
	var animated_value := 50.0 + sin(_time * 0.9) * 42.0

	if _progress_bar != null:
		_progress_bar.set("value", animated_value)

	if _progress_ring != null:
		_progress_ring.set("value", 100.0 - animated_value)


func _connect_slider(node_name: String) -> void:
	var slider = find_child(node_name, true, false)
	if slider == null:
		return

	if not slider.has_signal("value_changed"):
		return

	slider.connect("value_changed", func(value: float) -> void:
		_set_status("%s %.0f" % [node_name, value])
	)


func _connect_dropdown(node_name: String) -> void:
	var dropdown = find_child(node_name, true, false)
	if dropdown == null:
		return

	if not dropdown.has_signal("item_selected"):
		return

	dropdown.connect("item_selected", func(_index: int, label: String) -> void:
		_set_status("%s %s" % [node_name, label])
	)


func _connect_button(node_name: String) -> void:
	var button := find_child(node_name, true, false) as BaseButton
	if button == null:
		return

	button.pressed.connect(func() -> void:
		_set_status("%s pressed" % node_name)
	)


func _set_status(message: String) -> void:
	if _status_label != null:
		_status_label.text = message


func _fit_to_viewport() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	offset_left = 0.0
	offset_top = 0.0
	offset_right = 0.0
	offset_bottom = 0.0
