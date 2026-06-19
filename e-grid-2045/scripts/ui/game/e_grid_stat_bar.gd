extends VBoxContainer
class_name EGridStatBar

@export var title_text := "STAT":
	set(value):
		title_text = value
		_sync()

@export var value_text := "0%":
	set(value):
		value_text = value
		_sync()

@export_range(0.0, 100.0, 0.1) var progress_value := 0.0:
	set(value):
		progress_value = clampf(value, 0.0, 100.0)
		_sync()

@export_enum("normal", "warning", "critical", "success", "disabled") var semantic_state := "normal":
	set(value):
		semantic_state = value
		_sync()

@export var detail_text := "":
	set(value):
		detail_text = value
		_sync()


func _ready() -> void:
	_sync()


func _sync() -> void:
	if not is_inside_tree():
		return

	var title_label := get_node_or_null("Header/TitleLabel") as Label
	var value_label := get_node_or_null("Header/ValueLabel") as Label
	var progress_bar := get_node_or_null("ProgressBar")
	var detail_label := get_node_or_null("DetailLabel") as Label

	if title_label != null:
		title_label.text = title_text

	if value_label != null:
		value_label.text = value_text

	_set_property_if_available(progress_bar, "value", progress_value)
	_set_property_if_available(progress_bar, "semantic_state", semantic_state)
	_set_property_if_available(progress_bar, "show_value_label", false)

	if detail_label != null:
		detail_label.text = detail_text
		detail_label.visible = not detail_text.is_empty()


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return
