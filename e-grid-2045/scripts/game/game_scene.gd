extends Control
class_name EGridGameScene

const E_GRID_SCENE_TRANSITION := preload("res://scripts/ui/e_grid_scene_transition.gd")
const SIMULATION_CORE := preload("res://scripts/simulation/SimulationCore.gd")
const DEFAULT_MENU_SCENE := "res://scenes/main_menu.tscn"

@export_file("*.tscn") var menu_scene_path := DEFAULT_MENU_SCENE
@export_node_path("Control") var top_bar_path: NodePath = ^"SafeArea/Root/TopBar"
@export_node_path("Control") var build_palette_path: NodePath = ^"SafeArea/Root/MainRow/BuildPalette"
@export_node_path("Control") var map_view_path: NodePath = ^"SafeArea/Root/MainRow/MapView"
@export_node_path("Control") var region_panel_path: NodePath = ^"SafeArea/Root/MainRow/RegionPanel"
@export_node_path("Control") var alert_bar_path: NodePath = ^"SafeArea/Root/AlertBar"
@export_node_path("Button") var menu_button_path: NodePath = ^"SafeArea/Root/TopBar/ContentMargin/MainRow/MenuButton"
@export_node_path("Button") var pause_button_path: NodePath = ^"SafeArea/Root/TopBar/ContentMargin/MainRow/SpeedBlock/SpeedControls/PauseButton"
@export_node_path("Button") var play_button_path: NodePath = ^"SafeArea/Root/TopBar/ContentMargin/MainRow/SpeedBlock/SpeedControls/PlayButton"
@export_node_path("Button") var fast_button_path: NodePath = ^"SafeArea/Root/TopBar/ContentMargin/MainRow/SpeedBlock/SpeedControls/FastButton"
@export_node_path("Node") var input_controller_path: NodePath = ^"InputController"

var _top_bar: Control
var _build_palette: Control
var _map_view: Control
var _region_panel: Control
var _alert_bar: Control
var _input_controller: Node
var _simulation_core: EGridSimulationCore
var _is_changing_scene := false
var _selected_building_id := ""
var _heatmap_mode := "energy"
var _last_feedback := ""
var _endgame_panel: Control
var _refresh_pending := false


func _ready() -> void:
	_cache_layout_regions()
	_setup_simulation()
	_wire_input_controller()
	_wire_navigation()
	_wire_gameplay_ui()
	_start_new_game()


func get_layout_regions() -> Dictionary:
	return {
		"top_bar": _top_bar,
		"build_palette": _build_palette,
		"map_view": _map_view,
		"region_panel": _region_panel,
		"alert_bar": _alert_bar,
	}


func _cache_layout_regions() -> void:
	_top_bar = _get_required_control(top_bar_path, "top bar")
	_build_palette = _get_required_control(build_palette_path, "build palette")
	_map_view = _get_required_control(map_view_path, "map view")
	_region_panel = _get_required_control(region_panel_path, "region panel")
	_alert_bar = _get_required_control(alert_bar_path, "alert bar")


func _setup_simulation() -> void:
	_simulation_core = SIMULATION_CORE.new()
	_simulation_core.name = "SimulationCore"
	add_child(_simulation_core)

	_simulation_core.resources_updated.connect(_on_resources_updated)
	_simulation_core.region_updated.connect(_on_region_updated)
	_simulation_core.selected_region_changed.connect(_on_selected_region_changed)
	_simulation_core.alerts_updated.connect(_on_alerts_updated)
	_simulation_core.construction_started.connect(_on_construction_started)
	_simulation_core.construction_completed.connect(_on_construction_completed)
	_simulation_core.game_ended.connect(_on_game_ended)


func _start_new_game() -> void:
	_simulation_core.new_game()
	_simulation_core.set_simulation_speed(1.0)
	_request_refresh_game_ui()


func _wire_gameplay_ui() -> void:
	if _map_view != null:
		_connect_signal_once(_map_view, "region_pressed", Callable(self, "_on_map_region_pressed"))
		_connect_signal_once(_map_view, "region_hovered", Callable(self, "_on_map_region_hovered"))

	if _build_palette != null:
		_connect_signal_once(_build_palette, "build_requested", Callable(self, "_on_build_requested"))
		_connect_signal_once(_build_palette, "heatmap_mode_requested", Callable(self, "_on_heatmap_mode_requested"))

	if _region_panel != null:
		_connect_signal_once(_region_panel, "cancel_construction_requested", Callable(self, "_on_cancel_construction_requested"))

	if _alert_bar != null:
		_connect_signal_once(_alert_bar, "alert_region_requested", Callable(self, "_on_alert_region_requested"))


func _wire_input_controller() -> void:
	_input_controller = get_node_or_null(input_controller_path)

	if _input_controller == null:
		push_warning("GameScene layout is missing its input controller at %s." % input_controller_path)
		return

	_connect_signal_once(_input_controller, "back_requested", Callable(self, "_request_return_to_menu"))
	_connect_signal_once(_input_controller, "pause_toggle_requested", Callable(self, "_on_pause_toggle_requested"))
	_connect_signal_once(_input_controller, "speed_requested", Callable(self, "_on_speed_requested"))


func _wire_navigation() -> void:
	_connect_button_once(menu_button_path, Callable(self, "_request_return_to_menu"))
	_connect_button_once(pause_button_path, Callable(self, "_on_pause_button_pressed"))
	_connect_button_once(play_button_path, Callable(self, "_on_play_button_pressed"))
	_connect_button_once(fast_button_path, Callable(self, "_on_fast_button_pressed"))


func _request_return_to_menu() -> void:
	if _is_changing_scene:
		return

	_is_changing_scene = true
	call_deferred("_change_scene_to_menu")


func _on_pause_toggle_requested() -> void:
	var summary: Dictionary = _simulation_core.get_summary()
	_simulation_core.set_paused(not bool(summary.get("paused", false)))


func _on_pause_button_pressed() -> void:
	_simulation_core.set_paused(true)


func _on_play_button_pressed() -> void:
	_simulation_core.set_simulation_speed(1.0)


func _on_fast_button_pressed() -> void:
	_simulation_core.set_simulation_speed(4.0)


func _on_speed_requested(speed_multiplier: float) -> void:
	_simulation_core.set_simulation_speed(speed_multiplier)


func _on_map_region_pressed(_region_id: int, slug: String, _display_name: String) -> void:
	_simulation_core.select_region(slug)
	_last_feedback = "Selected %s" % slug
	_request_refresh_game_ui()


func _on_map_region_hovered(_region_id: int, _slug: String, display_name: String) -> void:
	if _map_view == null:
		return
	var selected := str(_simulation_core.get_summary().get("selected_region_id", ""))
	if display_name.is_empty():
		_map_view.set("map_status_text", "SELECTED %s" % selected.to_upper())
	else:
		_map_view.set("map_status_text", display_name.to_upper())


func _on_build_requested(building_id: String) -> void:
	_selected_building_id = building_id
	var result: Dictionary = _simulation_core.request_building("", building_id)
	if bool(result.get("ok", false)):
		_last_feedback = "Construction started: %s" % building_id
	else:
		_last_feedback = str(result.get("reason", "Cannot build here."))
	_request_refresh_game_ui()


func _on_cancel_construction_requested(region_id: String, queue_index: int) -> void:
	var result: Dictionary = _simulation_core.cancel_construction(region_id, queue_index)
	if bool(result.get("ok", false)):
		_last_feedback = "Construction cancelled, EUR %.0f refunded" % float(result.get("refund", 0.0))
	else:
		_last_feedback = str(result.get("reason", "Cannot cancel construction."))
	_request_refresh_game_ui()


func _on_heatmap_mode_requested(mode: String) -> void:
	_heatmap_mode = mode
	_request_refresh_game_ui()


func _on_alert_region_requested(region_id: String) -> void:
	_simulation_core.select_region(region_id)
	_request_refresh_game_ui()


func _on_resources_updated(_summary: Dictionary) -> void:
	_request_refresh_game_ui()


func _on_region_updated(region_id: String) -> void:
	var selected_region := str(_simulation_core.get_summary().get("selected_region_id", ""))
	if region_id == selected_region:
		_request_refresh_game_ui()


func _on_selected_region_changed(region_id: String) -> void:
	if _map_view != null and _map_view.has_method("set_selected_region_slug"):
		_map_view.call("set_selected_region_slug", region_id)
	_request_refresh_game_ui()


func _on_alerts_updated(alerts: Array) -> void:
	if _alert_bar != null and _alert_bar.has_method("set_alerts"):
		_alert_bar.call("set_alerts", alerts)


func _on_construction_started(region_id: String, building_id: String) -> void:
	_last_feedback = "%s started in %s" % [building_id, region_id]
	_request_refresh_game_ui()


func _on_construction_completed(region_id: String, building_id: String) -> void:
	_last_feedback = "%s online in %s" % [building_id, region_id]
	_request_refresh_game_ui()


func _request_refresh_game_ui() -> void:
	if _refresh_pending:
		return
	_refresh_pending = true
	call_deferred("_flush_refresh_game_ui")


func _flush_refresh_game_ui() -> void:
	_refresh_pending = false
	_refresh_game_ui()


func _refresh_game_ui() -> void:
	if _simulation_core == null:
		return

	var summary: Dictionary = _simulation_core.get_summary()
	_sync_top_bar(summary)

	var selected_region := str(summary.get("selected_region_id", ""))
	var building_definitions: Dictionary = _simulation_core.get_building_definitions()
	var regions_snapshot: Dictionary = _simulation_core.get_regions_snapshot()

	if _build_palette != null and _build_palette.has_method("set_build_context"):
		_build_palette.call("set_build_context", building_definitions, _simulation_core.get_build_availability(selected_region), _selected_building_id)
		_build_palette.call("set_active_heatmap_mode", _heatmap_mode)

	if _region_panel != null and _region_panel.has_method("display_region"):
		_region_panel.call("display_region", _simulation_core.get_region_snapshot(selected_region), building_definitions, summary)

	if _map_view != null and _map_view.has_method("set_simulation_overlay"):
		_map_view.call("set_simulation_overlay", regions_snapshot, _simulation_core.get_region_layout(), summary.get("network_flows", []), selected_region, _heatmap_mode)
		if not _last_feedback.is_empty():
			_map_view.set("map_status_text", _last_feedback.to_upper())

	if _alert_bar != null and _alert_bar.has_method("set_alerts"):
		_alert_bar.call("set_alerts", summary.get("alerts", []))


func _sync_top_bar(summary: Dictionary) -> void:
	if _top_bar == null:
		return

	var paused := bool(summary.get("paused", false))
	var speed := float(summary.get("simulation_speed", 0.0))
	var speed_text := "PAUSED" if paused else "%.0fx" % speed
	var co2_tier := str(summary.get("co2_tier", "low")).to_upper()

	_top_bar.set("title_text", "E-GRID 2045")
	_top_bar.set("subtitle_text", "E %.0f/%.0f  F %.0f/%.0f  R %.0f/%.0f  C %.0f/%.0f" % [
		float(summary.get("energy_produced", 0.0)),
		float(summary.get("energy_consumed", 0.0)),
		float(summary.get("cooling_available", 0.0)),
		float(summary.get("cooling_used", 0.0)),
		float(summary.get("researchers_available", 0.0)),
		float(summary.get("researchers_required", 0.0)),
		float(summary.get("compute_produced", 0.0)),
		float(summary.get("compute_used", 0.0)),
	])
	_top_bar.set("europe_progress_text", "EU %.1f%%" % float(summary.get("eu_agi_progress", 0.0)))
	_top_bar.set("usa_progress_text", "USA %.1f%%" % float(summary.get("usa_agi_progress", 0.0)))
	_top_bar.set("budget_text", "EUR %.0f" % float(summary.get("money", 0.0)))
	_top_bar.set("budget_delta_text", "+%.0f / MO  CO2 %.0f %s" % [float(summary.get("monthly_income", 0.0)), float(summary.get("cumulative_co2", 0.0)), co2_tier])
	_top_bar.set("date_text", str(summary.get("date_text", "JAN 2025")))
	_top_bar.set("week_text", "MONTH %03d" % int(summary.get("month_index", 0)))
	_top_bar.set("speed_text", speed_text)
	_top_bar.set("pause_button_text", "II")
	_top_bar.set("play_button_text", "1X")
	_top_bar.set("fast_button_text", "4X")
	_top_bar.set("pause_active", paused)
	_top_bar.set("play_active", not paused and speed <= 1.0)
	_top_bar.set("fast_active", not paused and speed > 1.0)


func _on_game_ended(result: String, score: Dictionary) -> void:
	_show_endgame_panel(result, score)


func _show_endgame_panel(result: String, score: Dictionary) -> void:
	if _endgame_panel != null and is_instance_valid(_endgame_panel):
		_endgame_panel.queue_free()

	var overlay := ColorRect.new()
	overlay.name = "EndGamePanel"
	overlay.color = Color("#020507dd")
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(overlay)
	_endgame_panel = overlay

	var box := VBoxContainer.new()
	box.anchor_left = 0.34
	box.anchor_top = 0.28
	box.anchor_right = 0.66
	box.anchor_bottom = 0.72
	box.add_theme_constant_override("separation", 10)
	overlay.add_child(box)

	var title := Label.new()
	title.text = "VICTORY" if result == "victory" else "DEFEAT"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	box.add_child(title)

	var details := Label.new()
	details.text = "Score %d\nCO2 %.0f\nNetwork %.0f%%\nDecarbonized %.0f%%\nEnergy efficiency %.0f%%" % [
		int(score.get("score", 0)),
		float(score.get("co2", 0.0)),
		float(score.get("network_stability", 0.0)),
		float(score.get("decarbonized_share", 0.0)),
		float(score.get("energy_efficiency", 0.0)),
	]
	details.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(details)

	var restart := Button.new()
	restart.text = "NEW RUN"
	restart.pressed.connect(func() -> void:
		overlay.queue_free()
		_endgame_panel = null
		_last_feedback = ""
		_start_new_game()
	)
	box.add_child(restart)


func _change_scene_to_menu() -> void:
	if menu_scene_path.strip_edges().is_empty():
		push_error("GameScene cannot return to menu: menu_scene_path is empty.")
		_is_changing_scene = false
		return

	if not ResourceLoader.exists(menu_scene_path):
		push_error("GameScene cannot return to menu: scene not found at %s." % menu_scene_path)
		_is_changing_scene = false
		return

	var error := await E_GRID_SCENE_TRANSITION.change_scene(self, menu_scene_path, "RETOUR AU MENU")

	if error != OK:
		push_error("GameScene failed to return to menu. Error code: %d." % error)
		_is_changing_scene = false


func _get_required_control(path: NodePath, label: String) -> Control:
	var node := get_node_or_null(path) as Control

	if node == null:
		push_warning("GameScene layout is missing its %s at %s." % [label, path])

	return node


func _connect_signal_once(emitter: Object, signal_name: String, callback: Callable) -> void:
	if emitter == null:
		return
	if not emitter.has_signal(signal_name):
		push_warning("GameScene cannot connect missing signal %s." % signal_name)
		return

	if not emitter.is_connected(signal_name, callback):
		emitter.connect(signal_name, callback)


func _connect_button_once(path: NodePath, callback: Callable) -> void:
	var button := get_node_or_null(path) as BaseButton

	if button == null:
		push_warning("GameScene cannot connect missing button at %s." % path)
		return

	if not button.pressed.is_connected(callback):
		button.pressed.connect(callback)



