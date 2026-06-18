@tool
extends Control
class_name EGridGameTopBar

const RESOURCE_CHIP_STATES := "energy,cooling,compute,co2_warning,money,research,usa_warning,energy_critical,disabled"

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

@export_enum("energy", "cooling", "compute", "co2_warning", "money", "research", "usa_warning", "energy_critical", "disabled") var europe_chip_state := "research":
	set(value):
		europe_chip_state = value
		_sync()

@export_enum("energy", "cooling", "compute", "co2_warning", "money", "research", "usa_warning", "energy_critical", "disabled") var usa_chip_state := "usa_warning":
	set(value):
		usa_chip_state = value
		_sync()

@export_enum("energy", "cooling", "compute", "co2_warning", "money", "research", "usa_warning", "energy_critical", "disabled") var budget_chip_state := "money":
	set(value):
		budget_chip_state = value
		_sync()

@export var pause_button_text := "II":
	set(value):
		pause_button_text = value
		_sync()

@export var play_button_text := "1X":
	set(value):
		play_button_text = value
		_sync()

@export var fast_button_text := "2X":
	set(value):
		fast_button_text = value
		_sync()

@export var menu_button_text := "MENU":
	set(value):
		menu_button_text = value
		_sync()

@export var pause_active := false:
	set(value):
		pause_active = value
		_sync()

@export var play_active := true:
	set(value):
		play_active = value
		_sync()

@export var fast_active := false:
	set(value):
		fast_active = value
		_sync()


func _ready() -> void:
	_sync()


func _sync() -> void:
	if not is_inside_tree():
		return

	_set_text("ContentMargin/MainRow/BrandBlock/TitleLabel", title_text)
	_set_text("ContentMargin/MainRow/BrandBlock/SubtitleLabel", subtitle_text)
	_set_chip("ContentMargin/MainRow/KpiStrip/EuropeChip", europe_progress_text, europe_chip_state)
	_set_chip("ContentMargin/MainRow/KpiStrip/UsaChip", usa_progress_text, usa_chip_state)
	_set_chip("ContentMargin/MainRow/KpiStrip/BudgetChip", budget_text, budget_chip_state)
	_set_text("ContentMargin/MainRow/KpiStrip/BudgetDeltaLabel", budget_delta_text)
	_set_text("ContentMargin/MainRow/DateBlock/DateValueLabel", date_text)
	_set_text("ContentMargin/MainRow/DateBlock/WeekLabel", week_text)
	_set_text("ContentMargin/MainRow/SpeedBlock/SpeedControls/SpeedValueLabel", speed_text)
	_set_button("ContentMargin/MainRow/SpeedBlock/SpeedControls/PauseButton", pause_button_text, pause_active)
	_set_button("ContentMargin/MainRow/SpeedBlock/SpeedControls/PlayButton", play_button_text, play_active)
	_set_button("ContentMargin/MainRow/SpeedBlock/SpeedControls/FastButton", fast_button_text, fast_active)
	_set_button("ContentMargin/MainRow/MenuButton", menu_button_text, false)


func _set_text(path: NodePath, value: String) -> void:
	var node := get_node_or_null(path)
	if node == null:
		return

	if _object_has_property(node, "label_text"):
		node.set("label_text", value)
		if node is BaseButton and _object_has_property(node, "text"):
			node.set("text", "")
	elif _object_has_property(node, "text"):
		node.set("text", value)


func _set_chip(path: NodePath, value: String, state_name: String) -> void:
	var node := get_node_or_null(path)
	if node == null:
		return

	_set_property_if_available(node, "label_text", value)
	_set_property_if_available(node, "normal_state", state_name)
	_set_property_if_available(node, "hover_state", state_name)
	_set_property_if_available(node, "pressed_state", state_name)
	_set_property_if_available(node, "selected_state", state_name)
	_set_property_if_available(node, "semantic_state", "normal")


func _set_button(path: NodePath, value: String, active: bool) -> void:
	var button := get_node_or_null(path) as BaseButton
	if button == null:
		return

	_set_property_if_available(button, "label_text", value)
	if _object_has_property(button, "text"):
		button.set("text", "")
	if button.toggle_mode:
		button.button_pressed = active


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if _object_has_property(target, property_name):
		target.set(property_name, property_value)


func _object_has_property(target: Object, property_name: String) -> bool:
	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			return true

	return false
