@tool
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
	var progress_bar := get_node_or_null("ProgressBar") as ProgressBar
	var detail_label := get_node_or_null("DetailLabel") as Label

	if title_label != null:
		title_label.text = title_text

	if value_label != null:
		value_label.text = value_text

	if progress_bar != null:
		progress_bar.value = progress_value

	if detail_label != null:
		detail_label.text = detail_text
		detail_label.visible = not detail_text.is_empty()
