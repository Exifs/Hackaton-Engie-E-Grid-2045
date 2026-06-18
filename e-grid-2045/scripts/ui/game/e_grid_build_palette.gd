@tool
extends Control
class_name EGridBuildPalette

const COLLAPSIBLE_CONTENT_PATHS := [
	^"ContentMargin/PaletteStack/CategoriesScroll",
	^"ContentMargin/PaletteStack/OverlayPanel",
]

@export var collapsed := false:
	set(value):
		collapsed = value
		_sync_collapsed_state()

@export_range(64.0, 420.0, 1.0) var expanded_width := 316.0:
	set(value):
		expanded_width = value
		_sync_collapsed_state()

@export_range(58.0, 120.0, 1.0) var collapsed_width := 78.0:
	set(value):
		collapsed_width = value
		_sync_collapsed_state()

@export_node_path("BaseButton") var collapse_button_path: NodePath = ^"ContentMargin/PaletteStack/HeaderRow/CollapseButton"


func _ready() -> void:
	clip_contents = true
	_wire_collapse_button()
	_sync_collapsed_state()


func _wire_collapse_button() -> void:
	var button := get_node_or_null(collapse_button_path) as BaseButton
	if button == null:
		return

	if not button.pressed.is_connected(_on_collapse_button_pressed):
		button.pressed.connect(_on_collapse_button_pressed)


func _on_collapse_button_pressed() -> void:
	collapsed = not collapsed
	_sync_collapsed_state()


func _sync_collapsed_state() -> void:
	custom_minimum_size = Vector2(collapsed_width if collapsed else expanded_width, 0.0)

	if not is_inside_tree():
		return

	clip_contents = true

	var title_label := get_node_or_null("ContentMargin/PaletteStack/HeaderRow/TitleLabel") as Control
	if title_label != null:
		title_label.visible = not collapsed

	for path in COLLAPSIBLE_CONTENT_PATHS:
		var content := get_node_or_null(path) as Control
		if content != null:
			content.visible = not collapsed

	var button := get_node_or_null(collapse_button_path) as BaseButton
	if button != null:
		_set_property_if_available(button, "label_text", ">" if collapsed else "<")
		_set_property_if_available(button, "text", "")
		button.tooltip_text = "Expand build palette" if collapsed else "Collapse build palette"


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return
