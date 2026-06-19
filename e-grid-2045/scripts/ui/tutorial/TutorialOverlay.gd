extends Control
class_name EGridTutorialOverlay

signal next_requested
signal skip_requested

@export_node_path("Control") var highlighter_path: NodePath = ^"Highlighter"
@export_node_path("Control") var text_panel_path: NodePath = ^"TextPanel"
@export_node_path("Label") var step_label_path: NodePath = ^"TextPanel/PanelMargin/PanelStack/HeaderRow/StepLabel"
@export_node_path("Label") var title_label_path: NodePath = ^"TextPanel/PanelMargin/PanelStack/TitleLabel"
@export_node_path("Label") var body_label_path: NodePath = ^"TextPanel/PanelMargin/PanelStack/BodyLabel"
@export_node_path("Label") var objective_label_path: NodePath = ^"TextPanel/PanelMargin/PanelStack/ObjectiveLabel"
@export_node_path("Button") var next_button_path: NodePath = ^"TextPanel/PanelMargin/PanelStack/ButtonRow/NextButton"
@export_node_path("Button") var skip_button_path: NodePath = ^"TextPanel/PanelMargin/PanelStack/ButtonRow/SkipButton"

var _highlighter
var _text_panel: Control
var _step_label: Label
var _title_label: Label
var _body_label: Label
var _objective_label: Label
var _next_button: Button
var _skip_button: Button
var _target := Rect2()


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_cache_nodes()
	_wire_buttons()
	hide_tutorial()


func show_step(step: Dictionary, step_index: int, total_steps: int, target: Variant) -> void:
	visible = true
	_cache_nodes()

	if _step_label != null:
		_step_label.text = "Étape %d / %d" % [step_index, total_steps]
	if _title_label != null:
		_title_label.text = str(step.get("title", "Tutoriel"))
	if _body_label != null:
		_body_label.text = str(step.get("body", ""))
	if _objective_label != null:
		_objective_label.text = "Objectif : %s" % str(step.get("objective", "Continuer."))

	if _next_button != null:
		var is_next_step := str(step.get("required_event", "")) == "tutorial_next"
		_next_button.visible = is_next_step
		_next_button.disabled = not is_next_step
		_next_button.text = "Terminer" if bool(step.get("complete_tutorial", false)) else "Continuer"

	if _highlighter != null:
		_highlighter.set_target(target)
		_target = _highlighter.target_rect

	_position_text_panel()


func hide_tutorial() -> void:
	visible = false
	if _highlighter != null:
		_highlighter.clear_target()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED and visible:
		_position_text_panel()


func _cache_nodes() -> void:
	_highlighter = get_node_or_null(highlighter_path)
	_text_panel = get_node_or_null(text_panel_path) as Control
	_step_label = get_node_or_null(step_label_path) as Label
	_title_label = get_node_or_null(title_label_path) as Label
	_body_label = get_node_or_null(body_label_path) as Label
	_objective_label = get_node_or_null(objective_label_path) as Label
	_next_button = get_node_or_null(next_button_path) as Button
	_skip_button = get_node_or_null(skip_button_path) as Button


func _wire_buttons() -> void:
	if _next_button != null and not _next_button.pressed.is_connected(_on_next_pressed):
		_next_button.pressed.connect(_on_next_pressed)
	if _skip_button != null and not _skip_button.pressed.is_connected(_on_skip_pressed):
		_skip_button.pressed.connect(_on_skip_pressed)


func _position_text_panel() -> void:
	if _text_panel == null:
		return

	var viewport_size := size
	var panel_size := Vector2(440.0, 0.0)
	if viewport_size.x < 760.0:
		panel_size.x = maxf(viewport_size.x - 32.0, 320.0)
	_text_panel.custom_minimum_size = Vector2(panel_size.x, 0.0)

	await get_tree().process_frame
	if _text_panel == null or not is_instance_valid(_text_panel):
		return

	panel_size = _text_panel.size
	if panel_size.y <= 0.0:
		panel_size.y = 210.0

	var margin := 18.0
	var target_center := _target.get_center()
	var panel_position := Vector2((viewport_size.x - panel_size.x) * 0.5, viewport_size.y - panel_size.y - margin)
	if _target.size != Vector2.ZERO and target_center.y > viewport_size.y * 0.5:
		panel_position.y = margin
	if _target.size != Vector2.ZERO:
		panel_position.x = clampf(target_center.x - panel_size.x * 0.5, margin, maxf(margin, viewport_size.x - panel_size.x - margin))

	_text_panel.position = panel_position


func _on_next_pressed() -> void:
	next_requested.emit()


func _on_skip_pressed() -> void:
	skip_requested.emit()
