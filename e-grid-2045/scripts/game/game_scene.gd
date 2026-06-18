extends Control
class_name EGridGameScene

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
var _is_changing_scene := false
var _simulation_paused := false
var _simulation_speed := 1.0


func _ready() -> void:
	_cache_layout_regions()
	_wire_input_controller()
	_wire_navigation()
	_sync_simulation_status()


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
	_simulation_paused = not _simulation_paused
	_sync_simulation_status()


func _on_pause_button_pressed() -> void:
	_simulation_paused = true
	_sync_simulation_status()


func _on_play_button_pressed() -> void:
	_simulation_paused = false
	_simulation_speed = 1.0
	_sync_simulation_status()


func _on_fast_button_pressed() -> void:
	_simulation_paused = false
	_simulation_speed = 2.0
	_sync_simulation_status()


func _on_speed_requested(speed_multiplier: float) -> void:
	_simulation_speed = maxf(speed_multiplier, 0.0)
	_simulation_paused = false
	_sync_simulation_status()


func _sync_simulation_status() -> void:
	if _top_bar == null:
		return

	if _simulation_paused:
		_top_bar.set("speed_text", "PAUSED")
	else:
		_top_bar.set("speed_text", "%.1fx" % _simulation_speed)

	_top_bar.set("pause_active", _simulation_paused)
	_top_bar.set("play_active", not _simulation_paused and _simulation_speed <= 1.0)
	_top_bar.set("fast_active", not _simulation_paused and _simulation_speed > 1.0)


func _change_scene_to_menu() -> void:
	if menu_scene_path.strip_edges().is_empty():
		push_error("GameScene cannot return to menu: menu_scene_path is empty.")
		_is_changing_scene = false
		return

	if not ResourceLoader.exists(menu_scene_path):
		push_error("GameScene cannot return to menu: scene not found at %s." % menu_scene_path)
		_is_changing_scene = false
		return

	var error := get_tree().change_scene_to_file(menu_scene_path)

	if error != OK:
		push_error("GameScene failed to return to menu. Error code: %d." % error)
		_is_changing_scene = false


func _get_required_control(path: NodePath, label: String) -> Control:
	var node := get_node_or_null(path) as Control

	if node == null:
		push_warning("GameScene layout is missing its %s at %s." % [label, path])

	return node


func _connect_signal_once(emitter: Object, signal_name: String, callback: Callable) -> void:
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
