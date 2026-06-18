extends Control

@export_node_path("Control") var button_container_path: NodePath = ^"MenuArtboardAspect/MenuArtboard/MenuButtons"
@export_node_path("Control") var version_label_path: NodePath = ^"MenuArtboardAspect/MenuArtboard/VersionLabel"

var _button_layer: Control
var _version_label: Control
var _buttons: Array[EGridMenuButton] = []


func _ready() -> void:
	_button_layer = get_node_or_null(button_container_path) as Control
	_version_label = get_node_or_null(version_label_path) as Control

	_collect_buttons()
	_wire_focus_navigation()
	_update_version_label_text()


func _collect_buttons() -> void:
	_buttons.clear()

	if _button_layer == null:
		push_warning("Le menu principal ne trouve pas son conteneur de boutons.")
		return

	for child in _button_layer.get_children():
		if child is EGridMenuButton:
			var button := child as EGridMenuButton
			button.pressed.connect(_on_menu_button_pressed.bind(button))
			_buttons.append(button)


func _wire_focus_navigation() -> void:
	if _buttons.size() < 2:
		return

	for i in _buttons.size():
		var previous := _buttons[posmod(i - 1, _buttons.size())]
		var next := _buttons[(i + 1) % _buttons.size()]
		_buttons[i].focus_neighbor_top = previous.get_path()
		_buttons[i].focus_neighbor_bottom = next.get_path()


func _update_version_label_text() -> void:
	if _version_label != null:
		_version_label.set("display_text", _get_menu_version_text())


func _get_menu_version_text() -> String:
	var version := str(ProjectSettings.get_setting("application/config/version", "0.0.0")).strip_edges()
	var build_number := str(ProjectSettings.get_setting("application/config/build_number", "0000")).strip_edges()

	if version.is_empty():
		version = "0.0.0"

	if build_number.is_empty():
		build_number = "0000"

	if version.begins_with("v") or version.begins_with("V"):
		version = version.substr(1)

	if build_number.begins_with("B") or build_number.begins_with("b"):
		build_number = build_number.substr(1)

	if build_number.is_valid_int():
		build_number = str(build_number.to_int()).pad_zeros(3)
	else:
		build_number = build_number.substr(0, 3).pad_zeros(3)

	return "V%s:%s" % [version.to_upper(), build_number]


func _unhandled_input(event: InputEvent) -> void:
	if _buttons.is_empty() or get_viewport().gui_get_focus_owner() != null:
		return

	if event.is_action_pressed("ui_up"):
		_buttons[_buttons.size() - 1].grab_focus()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("ui_down") or event.is_action_pressed("ui_accept"):
		_buttons[0].grab_focus()
		get_viewport().set_input_as_handled()


func _on_menu_button_pressed(button: EGridMenuButton) -> void:
	match button.action_name:
		"quit":
			get_tree().quit()
		_:
			print("%s: action non connectee pour le prototype de menu." % button.get_display_label())
