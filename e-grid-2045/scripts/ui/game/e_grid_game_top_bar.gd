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

@export var play_button_text := ">":
	set(value):
		play_button_text = value
		_sync()

@export var fast_button_text := ">>":
	set(value):
		fast_button_text = value
		_sync()

@export var faster_button_text := ">>>":
	set(value):
		faster_button_text = value
		_sync()

@export var menu_button_text := "":
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

@export var faster_active := false:
	set(value):
		faster_active = value
		_sync()


func _ready() -> void:
	_sync()


func _sync() -> void:
	if not is_inside_tree():
		return

	_set_text("ContentMargin/MainRow/BrandSegment/BrandBlock/TitleLabel", title_text)
	_set_text("ContentMargin/MainRow/BrandSegment/BrandBlock/SubtitleLabel", subtitle_text)
	_sync_progress_side("Europe", europe_progress_text, europe_chip_state)
	_sync_progress_side("Usa", usa_progress_text, usa_chip_state)
	_set_text("ContentMargin/MainRow/BudgetSegment/BudgetBlock/BudgetValueLabel", budget_text)
	_set_text("ContentMargin/MainRow/BudgetSegment/BudgetBlock/BudgetDeltaLabel", budget_delta_text)
	_set_text("ContentMargin/MainRow/DateSegment/DateBlock/DateValueLabel", date_text)
	_set_text("ContentMargin/MainRow/DateSegment/DateBlock/WeekLabel", week_text)
	_set_text("ContentMargin/MainRow/SpeedSegment/SpeedBlock/SpeedControls/SpeedValueLabel", speed_text)
	_set_button("ContentMargin/MainRow/SpeedSegment/SpeedBlock/SpeedControls/PauseButton", pause_button_text, pause_active)
	_set_button("ContentMargin/MainRow/SpeedSegment/SpeedBlock/SpeedControls/PlayButton", play_button_text, play_active)
	_set_button("ContentMargin/MainRow/SpeedSegment/SpeedBlock/SpeedControls/FastButton", fast_button_text, fast_active)
	_set_button("ContentMargin/MainRow/SpeedSegment/SpeedBlock/SpeedControls/FasterButton", faster_button_text, faster_active)
	_set_button("ContentMargin/MainRow/MenuSegment/MenuButton", menu_button_text, false)


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


func _sync_progress_side(side_name: String, progress_text: String, visual_state: String) -> void:
	var side_prefix := side_name
	var group_path := "ContentMargin/MainRow/ProgressSegment/ProgressBlock/ProgressContent/%sGroup" % side_prefix
	var text_path := "%s/%sText/%sNameLabel" % [group_path, side_prefix, side_prefix]
	var ring_path := "%s/%sRing" % [group_path, side_prefix]
	var ring := get_node_or_null(ring_path)

	_set_text(NodePath(text_path), _progress_name(progress_text).to_upper())
	if ring == null:
		return

	_set_property_if_available(ring, "value", _progress_percent(progress_text))
	_set_property_if_available(ring, "semantic_state", _ring_semantic_state(visual_state))
	_set_property_if_available(ring, "value_label_color", _ring_value_color(visual_state))


func _set_button(path: NodePath, value: String, active: bool) -> void:
	var button := get_node_or_null(path) as BaseButton
	if button == null:
		return

	_set_property_if_available(button, "label_text", value)
	if _object_has_property(button, "text"):
		button.set("text", "")
	if button.toggle_mode:
		button.button_pressed = active


func _progress_name(progress_text: String) -> String:
	var tokens := progress_text.strip_edges().split(" ", false)
	if tokens.size() <= 1:
		return progress_text.strip_edges()

	var last_token := tokens[tokens.size() - 1].replace("%", "")
	if not last_token.is_valid_float():
		return progress_text.strip_edges()

	var name_tokens: Array[String] = []
	for index in range(tokens.size() - 1):
		name_tokens.append(tokens[index])

	return " ".join(name_tokens)


func _progress_percent(progress_text: String) -> float:
	for token in progress_text.strip_edges().split(" ", false):
		var normalized := token.replace("%", "").replace(",", ".")
		if normalized.is_valid_float():
			return clampf(normalized.to_float(), 0.0, 100.0)

	return 0.0


func _ring_semantic_state(visual_state: String) -> String:
	if visual_state == "disabled":
		return "disabled"
	if visual_state == "energy_critical":
		return "critical"
	if visual_state.contains("warning") or visual_state == "co2_warning":
		return "warning"
	if visual_state == "energy" or visual_state == "money":
		return "success"
	return "normal"


func _ring_value_color(visual_state: String) -> Color:
	var ring_state := _ring_semantic_state(visual_state)
	if ring_state == "critical":
		return Color("#ff4f24")
	if ring_state == "warning":
		return Color("#ff5b20")
	if ring_state == "success":
		return Color("#4ce38a")
	if ring_state == "disabled":
		return Color("#546467")
	return Color("#1fd0e2")


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if _object_has_property(target, property_name):
		target.set(property_name, property_value)


func _object_has_property(target: Object, property_name: String) -> bool:
	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			return true

	return false
