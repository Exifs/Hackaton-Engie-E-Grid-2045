@tool
extends PanelContainer
class_name EGridMapView

signal map_pressed(position: Vector2)
signal region_selected(region_id: String, display_name: String)
signal region_hovered(region_id: String, display_name: String)

@export var accept_map_input := true:
	set(value):
		accept_map_input = value
		_sync_canvas_properties()

@export var selected_region_id := "benelux":
	set(value):
		selected_region_id = value
		_sync_canvas_properties()

@export_node_path("Control") var map_canvas_path: NodePath = ^"MapCanvas"

var _map_canvas: Control


func _ready() -> void:
	_install_panel_style()
	_cache_map_canvas()
	_sync_canvas_properties()


func _gui_input(event: InputEvent) -> void:
	if not accept_map_input:
		return

	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if mouse_event.button_index == MOUSE_BUTTON_LEFT and mouse_event.pressed:
			map_pressed.emit(mouse_event.position)
			accept_event()


func _cache_map_canvas() -> void:
	_map_canvas = get_node_or_null(map_canvas_path) as Control

	if _map_canvas == null:
		push_warning("EGridMapView is missing its map canvas at %s." % map_canvas_path)
		return

	_connect_signal_once(_map_canvas, "map_pressed", Callable(self, "_on_canvas_map_pressed"))
	_connect_signal_once(_map_canvas, "region_selected", Callable(self, "_on_canvas_region_selected"))
	_connect_signal_once(_map_canvas, "region_hovered", Callable(self, "_on_canvas_region_hovered"))


func _sync_canvas_properties() -> void:
	if _map_canvas == null:
		return

	_map_canvas.set("accept_map_input", accept_map_input)
	_map_canvas.set("selected_region_id", selected_region_id)


func _on_canvas_map_pressed(local_position: Vector2) -> void:
	map_pressed.emit(local_position)


func _on_canvas_region_selected(region_id: String, display_name: String) -> void:
	selected_region_id = region_id
	region_selected.emit(region_id, display_name)


func _on_canvas_region_hovered(region_id: String, display_name: String) -> void:
	region_hovered.emit(region_id, display_name)


func _install_panel_style() -> void:
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = Color("#071015")
	panel_style.border_color = Color("#29434a")
	panel_style.set_border_width_all(1)
	panel_style.set_corner_radius_all(4)
	panel_style.shadow_color = Color("#00000099")
	panel_style.shadow_size = 8
	panel_style.content_margin_left = 4
	panel_style.content_margin_top = 4
	panel_style.content_margin_right = 4
	panel_style.content_margin_bottom = 4

	add_theme_stylebox_override("panel", panel_style)


func _connect_signal_once(emitter: Object, signal_name: String, callback: Callable) -> void:
	if not emitter.has_signal(signal_name):
		push_warning("EGridMapView cannot connect missing signal %s." % signal_name)
		return

	if not emitter.is_connected(signal_name, callback):
		emitter.connect(signal_name, callback)
