@tool
extends PanelContainer
class_name EGridGameTopBar

@export var title_text := "E-GRID 2045":
	set(value):
		title_text = value
		_sync()

@export var subtitle_text := "BUILD. OPTIMIZE. POWER EUROPE.":
	set(value):
		subtitle_text = value
		_sync()

@export var europe_progress_text := "EUROPE 62%":
	set(value):
		europe_progress_text = value
		_sync()

@export var usa_progress_text := "USA 48%":
	set(value):
		usa_progress_text = value
		_sync()

@export var budget_text := "EUR 24.7B":
	set(value):
		budget_text = value
		_sync()

@export var budget_delta_text := "+1.35B / DAY":
	set(value):
		budget_delta_text = value
		_sync()

@export var date_text := "17 MAY 2045":
	set(value):
		date_text = value
		_sync()

@export var week_text := "WEEK 20":
	set(value):
		week_text = value
		_sync()

@export var speed_text := "1.0x":
	set(value):
		speed_text = value
		_sync()


func _ready() -> void:
	_sync()


func _sync() -> void:
	if not is_inside_tree():
		return

	_set_label("ContentMargin/MainRow/BrandBlock/TitleLabel", title_text)
	_set_label("ContentMargin/MainRow/BrandBlock/SubtitleLabel", subtitle_text)
	_set_label("ContentMargin/MainRow/AgiBlock/EuropeProgressLabel", europe_progress_text)
	_set_label("ContentMargin/MainRow/AgiBlock/UsaProgressLabel", usa_progress_text)
	_set_label("ContentMargin/MainRow/BudgetBlock/BudgetValueLabel", budget_text)
	_set_label("ContentMargin/MainRow/BudgetBlock/BudgetDeltaLabel", budget_delta_text)
	_set_label("ContentMargin/MainRow/DateBlock/DateValueLabel", date_text)
	_set_label("ContentMargin/MainRow/DateBlock/WeekLabel", week_text)
	_set_label("ContentMargin/MainRow/SpeedBlock/SpeedControls/SpeedValueLabel", speed_text)


func _set_label(path: NodePath, value: String) -> void:
	var label := get_node_or_null(path) as Label

	if label != null:
		label.text = value
