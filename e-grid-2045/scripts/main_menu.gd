extends Control

const MENU_TEXTURE_PATH := "res://assets/ui/menu/menu_background.png"
const VERSION_TEXT_COLOR := Color("#506b72", 0.58)
const MENU_ASPECT := 1672.0 / 941.0
const E_GRID_MENU_BUTTON_SCRIPT := preload("res://scripts/ui/e_grid_menu_button.gd")

const BUTTON_LAYOUTS := [
	{
		"name": "PlayButton",
		"text": "JOUER",
		"action": "play",
		"fallback_label": "LANCER LA PARTIE",
		"center": Vector2(0.500, 0.466),
		"size": Vector2(0.310, 0.129)
	},
	{
		"name": "SettingsButton",
		"text": "PARAMÈTRES",
		"action": "settings",
		"fallback_label": "PARAMÈTRES",
		"center": Vector2(0.500, 0.592),
		"size": Vector2(0.310, 0.129)
	},
	{
		"name": "QuitButton",
		"text": "QUITTER",
		"action": "quit",
		"fallback_label": "QUITTER",
		"center": Vector2(0.500, 0.717),
		"size": Vector2(0.310, 0.129)
	}
]

var _button_layer: Control
var _buttons: Array[Button] = []
var _version_label: VersionText


func _ready() -> void:
	_build_background()
	_build_version_label()
	_build_buttons()
	_resized()
	resized.connect(_resized)


func _build_background() -> void:
	var background := TextureRect.new()
	background.name = "MenuImageBackground"
	background.texture = _load_texture(MENU_TEXTURE_PATH)
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)


func _load_texture(path: String) -> Texture2D:
	var image := Image.new()
	var error := image.load(path)

	if error != OK:
		push_error("Impossible de charger la texture UI: %s" % path)
		return ImageTexture.new()

	return ImageTexture.create_from_image(image)


func _build_version_label() -> void:
	_version_label = VersionText.new()
	_version_label.name = "VersionLabel"
	_version_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_version_label.display_text = _get_menu_version_text()
	_version_label.font_color = VERSION_TEXT_COLOR
	add_child(_version_label)


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


func _build_buttons() -> void:
	_button_layer = Control.new()
	_button_layer.name = "MenuButtons"
	_button_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_button_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_button_layer)

	for layout in BUTTON_LAYOUTS:
		var button = E_GRID_MENU_BUTTON_SCRIPT.new()
		button.name = layout["name"]
		button.action_name = layout["action"]
		button.button_text = layout["text"]
		button.tooltip_text = layout["fallback_label"]
		button.pressed.connect(_on_menu_button_pressed.bind(button.action_name, layout["fallback_label"]))
		_button_layer.add_child(button)
		_buttons.append(button)

	for i in _buttons.size():
		var previous := _buttons[posmod(i - 1, _buttons.size())]
		var next := _buttons[(i + 1) % _buttons.size()]
		_buttons[i].focus_neighbor_top = previous.get_path()
		_buttons[i].focus_neighbor_bottom = next.get_path()


func _unhandled_input(event: InputEvent) -> void:
	if _buttons.is_empty() or get_viewport().gui_get_focus_owner() != null:
		return

	if event.is_action_pressed("ui_up"):
		_buttons[_buttons.size() - 1].grab_focus()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("ui_down") or event.is_action_pressed("ui_accept"):
		_buttons[0].grab_focus()
		get_viewport().set_input_as_handled()


func _on_menu_button_pressed(action_name: String, fallback_label: String) -> void:
	match action_name:
		"quit":
			get_tree().quit()
		_:
			print("%s: action non connectee pour le prototype de menu." % fallback_label)


func _resized() -> void:
	var image_rect := _get_covered_image_rect(size)
	_update_version_label(image_rect)

	for i in _buttons.size():
		var layout = BUTTON_LAYOUTS[i]
		var normalized_center: Vector2 = layout["center"]
		var normalized_size: Vector2 = layout["size"]
		var button_size := image_rect.size * normalized_size
		var button_center := image_rect.position + image_rect.size * normalized_center

		_buttons[i].position = button_center - button_size * 0.5
		_buttons[i].size = button_size
		_buttons[i].queue_redraw()


func _update_version_label(image_rect: Rect2) -> void:
	if _version_label == null:
		return

	var font_size := maxi(8, roundi(image_rect.size.y / 941.0 * 15.0))
	var font := _version_label.get_theme_default_font()
	var target_baseline_y := image_rect.position.y + image_rect.size.y * (916.0 / 941.0)
	var label_top := target_baseline_y - font.get_ascent(font_size)

	_version_label.position = Vector2(image_rect.position.x + image_rect.size.x * (158.0 / 1672.0), label_top)
	_version_label.size = Vector2(image_rect.size.x * 0.16, font_size * 1.55)
	_version_label.font_size = font_size
	_version_label.queue_redraw()


func _get_covered_image_rect(viewport_size: Vector2) -> Rect2:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return Rect2(Vector2.ZERO, viewport_size)

	var viewport_aspect := viewport_size.x / viewport_size.y
	var covered_size := viewport_size

	if viewport_aspect > MENU_ASPECT:
		covered_size.y = viewport_size.x / MENU_ASPECT
	else:
		covered_size.x = viewport_size.y * MENU_ASPECT

	return Rect2((viewport_size - covered_size) * 0.5, covered_size)


class VersionText:
	extends Control

	var display_text := ""
	var font_size := 12
	var font_color := Color.WHITE

	func _draw() -> void:
		if display_text.is_empty():
			return

		var font := get_theme_default_font()
		var baseline := font.get_ascent(font_size)
		draw_string(font, Vector2(0.0, baseline), display_text, HORIZONTAL_ALIGNMENT_LEFT, -1.0, font_size, font_color)
