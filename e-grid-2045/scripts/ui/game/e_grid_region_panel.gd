@tool
extends PanelContainer
class_name EGridRegionPanel

@export var region_name := "NO REGION":
	set(value):
		region_name = value
		_sync()

@export var level_text := "LEVEL 0":
	set(value):
		level_text = value
		_sync()

@export var xp_text := "0 / 0 XP":
	set(value):
		xp_text = value
		_sync()

@export_range(0.0, 100.0, 0.1) var xp_progress := 0.0:
	set(value):
		xp_progress = clampf(value, 0.0, 100.0)
		_sync()


func _ready() -> void:
	_sync()


func _sync() -> void:
	if not is_inside_tree():
		return

	var title_label := get_node_or_null("ContentMargin/PanelStack/HeaderRow/RegionNameLabel") as Label
	var level_label := get_node_or_null("ContentMargin/PanelStack/LevelRow/LevelLabel") as Label
	var xp_label := get_node_or_null("ContentMargin/PanelStack/LevelRow/XpLabel") as Label
	var xp_bar := get_node_or_null("ContentMargin/PanelStack/XpBar") as ProgressBar

	if title_label != null:
		title_label.text = region_name

	if level_label != null:
		level_label.text = level_text

	if xp_label != null:
		xp_label.text = xp_text

	if xp_bar != null:
		xp_bar.value = xp_progress
