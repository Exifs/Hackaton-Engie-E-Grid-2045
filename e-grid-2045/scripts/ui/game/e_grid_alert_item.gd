@tool
extends Control
class_name EGridAlertItem

signal action_requested(action_name: String)

const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")

@export var title_text := "ALERT":
	set(value):
		title_text = value
		_sync()

@export var body_text := "Alert details":
	set(value):
		body_text = value
		_sync()

@export var action_text := "VIEW":
	set(value):
		action_text = value
		_sync()

@export var action_name := "":
	set(value):
		action_name = value
		_sync()

@export_enum("power_warning", "critical", "cooling_warning", "research_success", "market_info", "disabled") var alert_state := "power_warning":
	set(value):
		alert_state = value
		_sync()


func _ready() -> void:
	_sync()
	_wire_buttons()


func _sync() -> void:
	if not is_inside_tree():
		return

	var toast_button := get_node_or_null("ToastButton") as BaseButton
	var action_button := get_node_or_null("ContentMargin/ContentRow/ActionButton") as BaseButton
	var title_label := get_node_or_null("ContentMargin/ContentRow/TextBlock/TitleLabel") as Label
	var body_label := get_node_or_null("ContentMargin/ContentRow/TextBlock/BodyLabel") as Label
	var icon := get_node_or_null("ContentMargin/ContentRow/IconFrame/Icon") as TextureRect
	var icon_frame := get_node_or_null("ContentMargin/ContentRow/IconFrame") as PanelContainer
	var bottom_accent := get_node_or_null("BottomAccent") as ColorRect
	var frame_overlay := get_node_or_null("FrameOverlay") as Control
	var composed_text := title_text if body_text.is_empty() else "%s / %s" % [title_text, body_text]
	var accent_color := _accent_color()

	if toast_button != null:
		toast_button.tooltip_text = composed_text
		_set_property_if_available(toast_button, "label_text", "")
		_set_property_if_available(toast_button, "semantic_state", "normal")
		if _object_has_property(toast_button, "text"):
			toast_button.set("text", "")

	if title_label != null:
		title_label.text = title_text
		title_label.modulate = accent_color

	if body_label != null:
		body_label.text = body_text
		body_label.visible = not body_text.is_empty()

	_sync_icon(icon, accent_color)
	_sync_icon_frame(icon_frame, accent_color)

	if bottom_accent != null:
		bottom_accent.color = Color(accent_color.r, accent_color.g, accent_color.b, 0.82)

	if frame_overlay != null:
		_set_property_if_available(frame_overlay, "alert_state", alert_state)
		frame_overlay.queue_redraw()

	if action_button != null:
		_set_property_if_available(action_button, "label_text", action_text)
		_set_property_if_available(action_button, "label_color", accent_color)
		if _object_has_property(action_button, "text"):
			action_button.set("text", "")
		action_button.tooltip_text = action_name if not action_name.is_empty() else title_text


func _wire_buttons() -> void:
	var action_button := get_node_or_null("ContentMargin/ContentRow/ActionButton") as BaseButton
	var toast_button := get_node_or_null("ToastButton") as BaseButton

	for button in [action_button, toast_button]:
		if button == null:
			continue

		if not button.pressed.is_connected(_on_action_button_pressed):
			button.pressed.connect(_on_action_button_pressed)


func _on_action_button_pressed() -> void:
	action_requested.emit(action_name)


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	if _object_has_property(target, property_name):
		target.set(property_name, property_value)


func _object_has_property(target: Object, property_name: String) -> bool:
	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			return true

	return false


func _sync_icon(icon: TextureRect, accent_color: Color) -> void:
	if icon == null:
		return

	icon.texture = E_GRID_UI_ATLAS.get_texture("utility_icons_48px", _icon_state())
	icon.visible = icon.texture != null
	icon.modulate = accent_color


func _sync_icon_frame(icon_frame: PanelContainer, accent_color: Color) -> void:
	if icon_frame == null:
		return

	var style := icon_frame.get_theme_stylebox("panel") as StyleBoxFlat
	if style == null:
		return

	style = style.duplicate() as StyleBoxFlat
	style.border_color = Color(accent_color.r, accent_color.g, accent_color.b, 0.78)
	style.bg_color = Color(accent_color.r * 0.12, accent_color.g * 0.12, accent_color.b * 0.12, 0.28)
	icon_frame.add_theme_stylebox_override("panel", style)


func _icon_state() -> String:
	match alert_state:
		"cooling_warning":
			return "cooling"
		"research_success":
			return "science"
		"market_info":
			return "money"
		"critical":
			return "grid"
		_:
			return "energy"


func _accent_color() -> Color:
	match alert_state:
		"research_success":
			return Color("#42b9e6")
		"market_info":
			return Color("#89999c")
		"critical":
			return Color("#e2c64a")
		_:
			return Color("#ee5824")
