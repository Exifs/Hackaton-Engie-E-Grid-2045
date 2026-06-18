@tool
extends VBoxContainer
class_name EGridBuildCategory

@export var category_title := "CATEGORY":
	set(value):
		category_title = value
		_sync_title()

@export var tool_labels := PackedStringArray(["Tool A", "Tool B", "Tool C", "Tool D"]):
	set(value):
		tool_labels = value
		_rebuild_slots()

@export_range(1, 6, 1) var columns := 4:
	set(value):
		columns = value
		_rebuild_slots()

@export var slot_min_size := Vector2(46.0, 42.0):
	set(value):
		slot_min_size = value
		_rebuild_slots()

@export var auto_build_slots := true:
	set(value):
		auto_build_slots = value
		_rebuild_slots()


func _ready() -> void:
	_sync_title()
	_rebuild_slots()


func _sync_title() -> void:
	if not is_inside_tree():
		return

	var title_label := get_node_or_null("TitleLabel") as Label

	if title_label != null:
		title_label.text = category_title


func _rebuild_slots() -> void:
	if not is_inside_tree():
		return

	var slots_grid := get_node_or_null("SlotsGrid") as GridContainer

	if slots_grid == null or not auto_build_slots:
		return

	slots_grid.columns = columns

	for child in slots_grid.get_children():
		slots_grid.remove_child(child)
		child.free()

	for index in tool_labels.size():
		var label := tool_labels[index]
		var button := Button.new()
		button.name = "Slot%d" % (index + 1)
		button.text = label
		button.tooltip_text = "%s / %s" % [category_title, label]
		button.custom_minimum_size = slot_min_size
		button.focus_mode = Control.FOCUS_ALL
		button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		slots_grid.add_child(button)
