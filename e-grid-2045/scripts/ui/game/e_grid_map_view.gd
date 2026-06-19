extends Control
class_name EGridMapView

signal map_pressed(position: Vector2)
signal region_hovered(region_id: int, slug: String, display_name: String)
signal region_pressed(region_id: int, slug: String, display_name: String)

const E_GRID_MAP_ASSETS := preload("res://scripts/ui/game/e_grid_map_assets.gd")
const HEATMAP_LAYER := preload("res://scripts/presentation/HeatmapLayer.gd")
const NETWORK_FLOW_LAYER := preload("res://scripts/presentation/NetworkFlowLayer.gd")

@export var accept_map_input := true
@export_file("*.png") var backdrop_texture_path := "res://assets/map/europe_map_backdrop_generated_clean_v1.png"
@export_file("*.json") var contours_path := "res://assets/map/generated/regions_contours.json"
@export_file("*.png") var region_mask_path := "res://assets/map/generated/region_id_mask.png"

@export var map_title_text := "EUROPE GRID OPS":
	set(value):
		map_title_text = value
		_sync_labels()

@export var map_status_text := "SECTOR SELECT":
	set(value):
		map_status_text = value
		_sync_labels()

@export var grid_spacing := 42.0:
	set(value):
		grid_spacing = maxf(value, 12.0)
		queue_redraw()

@export var major_grid_every := 4:
	set(value):
		major_grid_every = maxi(value, 1)
		queue_redraw()

@export var background_color := Color("#050c0f"):
	set(value):
		background_color = value
		queue_redraw()

@export var grid_color := Color("#1d2d3158"):
	set(value):
		grid_color = value
		queue_redraw()

@export var major_grid_color := Color("#283b3f86"):
	set(value):
		major_grid_color = value
		queue_redraw()

@export var backdrop_modulate := Color("#d7e8e8ff"):
	set(value):
		backdrop_modulate = value
		queue_redraw()

@export var normal_region_fill_color := Color("#06171924"):
	set(value):
		normal_region_fill_color = value
		queue_redraw()

@export var normal_border_color := Color("#6fb9bf55"):
	set(value):
		normal_border_color = value
		queue_redraw()

@export var hover_fill_color := Color("#1fd0e22e"):
	set(value):
		hover_fill_color = value
		queue_redraw()

@export var hover_border_color := Color("#5ff1fff0"):
	set(value):
		hover_border_color = value
		queue_redraw()

@export var selected_fill_color := Color("#eea34a26"):
	set(value):
		selected_fill_color = value
		queue_redraw()

@export var selected_border_color := Color("#f5c979e4"):
	set(value):
		selected_border_color = value
		queue_redraw()

@export var selected_region_id := 0:
	set(value):
		selected_region_id = maxi(int(value), 0)
		queue_redraw()
@export var animate_network_flows := false:
	set(value):
		animate_network_flows = value
		_sync_processing()
@export_range(1.0, 30.0, 1.0) var flow_animation_fps := 8.0
@export_range(0.0, 32.0, 1.0) var hover_pick_step_pixels := 6.0

var _assets: RefCounted
var _map_rect := Rect2()
var _screen_regions: Array[Dictionary] = []
var _screen_regions_by_id := {}
var _region_ids_by_slug := {}
var _layout_positions := {}
var _layout_positions_dirty := true
var _screen_cache_dirty := true
var _hover_region_id := 0
var _regions_state := {}
var _region_layout := {}
var _network_flows := []
var _visible_network_flows := []
var _selected_region_slug := ""
var _heatmap_mode := "energy"
var _flow_phase := 0.0
var _flow_redraw_accumulator := 0.0
var _last_hover_pick_position := Vector2.INF


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	set_process(false)
	_load_map_assets()
	_sync_labels()
	_sync_processing()


func _process(delta: float) -> void:
	if not animate_network_flows or _visible_network_flows.is_empty() or not is_visible_in_tree():
		return

	_flow_redraw_accumulator += delta
	var redraw_interval := 1.0 / maxf(flow_animation_fps, 1.0)
	if _flow_redraw_accumulator < redraw_interval:
		return

	_flow_redraw_accumulator = fposmod(_flow_redraw_accumulator, redraw_interval)
	_flow_phase = fposmod(_flow_phase + redraw_interval * 0.38, 1.0)
	queue_redraw()


func set_simulation_overlay(regions_state: Dictionary, region_layout: Dictionary, network_flows: Array, selected_region_slug: String, heatmap_mode: String) -> void:
	_regions_state = regions_state
	if _region_layout != region_layout:
		_region_layout = region_layout
		_layout_positions_dirty = true
	_network_flows = network_flows
	_selected_region_slug = selected_region_slug
	_heatmap_mode = heatmap_mode
	selected_region_id = _region_id_for_slug(selected_region_slug)
	_refresh_visible_network_flows()
	_sync_processing()
	queue_redraw()


func set_selected_region_slug(region_slug: String) -> void:
	_selected_region_slug = region_slug
	selected_region_id = _region_id_for_slug(region_slug)
	_refresh_visible_network_flows()
	_sync_processing()
	queue_redraw()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_screen_cache_dirty = true
		_layout_positions_dirty = true
		queue_redraw()
	elif what == NOTIFICATION_MOUSE_EXIT:
		_last_hover_pick_position = Vector2.INF
		_set_hover_region_id(0)


func _gui_input(event: InputEvent) -> void:
	if not accept_map_input:
		_set_hover_region_id(0)
		return

	if event is InputEventMouseMotion:
		var motion_event := event as InputEventMouseMotion
		if _should_skip_hover_pick(motion_event.position):
			return
		_last_hover_pick_position = motion_event.position
		_set_hover_region_id(_pick_region_id_at_view_position(motion_event.position))
		return

	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if mouse_event.button_index == MOUSE_BUTTON_LEFT and mouse_event.pressed:
			map_pressed.emit(mouse_event.position)
			var region_id := _pick_region_id_at_view_position(mouse_event.position)
			selected_region_id = region_id
			if region_id > 0:
				var region := _get_region(region_id)
				_selected_region_slug = str(region.get("slug", ""))
				region_pressed.emit(
					region_id,
					str(region.get("slug", "")),
					str(region.get("display_name", ""))
				)
			accept_event()


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size)
	draw_rect(rect, background_color, true)
	_draw_grid(rect)

	if _assets == null or not _assets.is_valid():
		return

	if _screen_cache_dirty:
		_rebuild_screen_cache()

	_draw_map_backdrop()
	_draw_region_layer(normal_region_fill_color, normal_border_color, 1.0)
	_draw_heatmap_layer()
	_draw_network_flows()
	_draw_region_markers()
	_draw_region_state(selected_region_id, selected_fill_color, selected_border_color, 1.5, true)
	_draw_region_state(_hover_region_id, hover_fill_color, hover_border_color, 1.4, true)
	_draw_selected_region_slots()


func _draw_grid(rect: Rect2) -> void:
	var column := 0
	var x := 0.0
	while x <= rect.size.x:
		var color := major_grid_color if column % major_grid_every == 0 else grid_color
		draw_line(Vector2(x, 0.0), Vector2(x, rect.size.y), color, 1.0)
		x += grid_spacing
		column += 1

	var row := 0
	var y := 0.0
	while y <= rect.size.y:
		var color := major_grid_color if row % major_grid_every == 0 else grid_color
		draw_line(Vector2(0.0, y), Vector2(rect.size.x, y), color, 1.0)
		y += grid_spacing
		row += 1

	for offset in range(-3, 8):
		var start := Vector2(float(offset) * grid_spacing * 2.0, rect.size.y)
		var end := start + Vector2(rect.size.y * 1.4, -rect.size.y)
		draw_line(start, end, Color("#1461743a"), 1.0)


func _draw_map_backdrop() -> void:
	if _assets.backdrop_texture == null:
		return

	var shadow_rect := _map_rect.grow(10.0)
	draw_rect(shadow_rect, Color("#0205078a"), true)
	draw_texture_rect(_assets.backdrop_texture, _map_rect, false, backdrop_modulate)


func _draw_region_layer(fill_color: Color, border_color: Color, border_width: float) -> void:
	for region in _screen_regions:
		_draw_region_fill(region, fill_color)

	for region in _screen_regions:
		_draw_region_border(region, border_color, border_width)


func _draw_heatmap_layer() -> void:
	if _heatmap_mode.is_empty() or _heatmap_mode == "none":
		return

	for region in _screen_regions:
		var slug := str(region.get("slug", ""))
		var cached := _cached_for_region(slug)
		var color := HEATMAP_LAYER.color_for_region(_heatmap_mode, cached)
		if color.a > 0.0:
			_draw_region_fill(region, color)


func _draw_network_flows() -> void:
	if _visible_network_flows.is_empty():
		return

	for flow_variant in _visible_network_flows:
		var flow: Dictionary = flow_variant
		var source_id := str(flow.get("source_region_id", ""))
		var target_id := str(flow.get("target_region_id", ""))
		var source := _layout_position(source_id)
		var target := _layout_position(target_id)
		if source == Vector2.INF or target == Vector2.INF:
			continue

		var selected := source_id == _selected_region_slug or target_id == _selected_region_slug
		var color := NETWORK_FLOW_LAYER.color_for_flow(flow, selected)
		var width := NETWORK_FLOW_LAYER.width_for_flow(flow, selected)
		draw_line(source, target, color, width, true)

		if animate_network_flows:
			var dot_position := source.lerp(target, _flow_phase)
			draw_circle(dot_position, maxf(width * 0.75, 2.0), Color(color, minf(color.a + 0.2, 1.0)))


func _draw_region_markers() -> void:
	for region_id in _region_layout.keys():
		var marker_position := _layout_position(str(region_id))
		if marker_position == Vector2.INF:
			continue
		var cached := _cached_for_region(str(region_id))
		var state := HEATMAP_LAYER.semantic_state_for_region(cached)
		var color := _marker_color(state)
		var radius := 5.0 if str(region_id) != _selected_region_slug else 7.5
		draw_circle(marker_position, radius + 4.0, Color(color, 0.16))
		draw_circle(marker_position, radius, color)
		draw_arc(marker_position, radius + 6.0, 0.0, TAU, 24, Color(color, 0.55), 1.2)


func _draw_selected_region_slots() -> void:
	if _selected_region_slug.is_empty() or not _regions_state.has(_selected_region_slug):
		return

	var region: Dictionary = _regions_state.get(_selected_region_slug, {})
	var center := _layout_position(_selected_region_slug)
	if center == Vector2.INF:
		return

	var slots_max := int(region.get("slots_max", 0))
	var slots_used := int(region.get("slots_used", 0))
	var constructions: Array = region.get("construction_queue", [])
	var visible_slots := mini(slots_max, 12)
	if visible_slots <= 0:
		return

	var radius := clampf(minf(_map_rect.size.x, _map_rect.size.y) * 0.055, 28.0, 52.0)
	for index in range(visible_slots):
		var angle := -PI * 0.5 + (TAU * float(index) / float(visible_slots))
		var slot_position := center + Vector2(cos(angle), sin(angle)) * radius
		var color := Color("#233137e6")
		if index < slots_used:
			color = Color("#42d4cbdc")
		if index >= max(0, slots_used - constructions.size()) and index < slots_used:
			color = Color("#f4a23fdc")
		draw_circle(slot_position, 5.8, Color("#02090bdd"))
		draw_circle(slot_position, 4.4, color)

	if slots_max > visible_slots:
		var font := get_theme_default_font()
		var font_size := 12
		var text := "+%d" % (slots_max - visible_slots)
		draw_string(font, center + Vector2(radius + 8.0, 4.0), text, HORIZONTAL_ALIGNMENT_LEFT, -1.0, font_size, Color("#dfe8e8"))


func _draw_region_state(region_id: int, fill_color: Color, border_color: Color, border_width: float, glow: bool) -> void:
	if region_id <= 0:
		return

	var region := _get_screen_region(region_id)
	if region.is_empty():
		return

	_draw_region_fill(region, fill_color)
	if glow:
		_draw_region_border(region, Color(border_color, 0.16), border_width + 8.0)
		_draw_region_border(region, Color(border_color, 0.24), border_width + 4.0)
	_draw_region_border(region, border_color, border_width)


func _draw_region_fill(region: Dictionary, fill_color: Color) -> void:
	var components = region.get("components", [])
	if typeof(components) != TYPE_ARRAY:
		return

	for component in components:
		if component is PackedVector2Array and component.size() >= 3:
			draw_colored_polygon(component, fill_color)


func _draw_region_border(region: Dictionary, color: Color, width: float) -> void:
	var closed_components = region.get("closed_components", [])
	if typeof(closed_components) != TYPE_ARRAY:
		return

	for component in closed_components:
		if component is PackedVector2Array and component.size() >= 4:
			draw_polyline(component, color, width, true)


func _load_map_assets() -> void:
	_assets = E_GRID_MAP_ASSETS.new()
	_assets.call("load_from_paths", backdrop_texture_path, contours_path, region_mask_path)
	_screen_cache_dirty = true
	queue_redraw()


func _rebuild_screen_cache() -> void:
	_screen_cache_dirty = false
	_layout_positions_dirty = true
	_screen_regions.clear()
	_screen_regions_by_id.clear()
	_region_ids_by_slug.clear()

	if _assets == null or not _assets.is_valid():
		_map_rect = Rect2(Vector2.ZERO, size)
		return

	_map_rect = _get_aspect_fit_rect(size, _assets.image_size)
	for region in _assets.regions:
		var screen_components: Array[PackedVector2Array] = []
		var closed_screen_components: Array[PackedVector2Array] = []
		var source_components = region.get("components", [])

		if typeof(source_components) != TYPE_ARRAY:
			continue

		for source_component in source_components:
			if not (source_component is PackedVector2Array):
				continue

			var transformed := _transform_component(source_component)
			if transformed.size() < 3:
				continue

			screen_components.append(transformed)
			closed_screen_components.append(_closed_component(transformed))

		if screen_components.is_empty():
			continue

		var screen_region := {
			"id": int(region.get("id", 0)),
			"slug": str(region.get("slug", "")),
			"display_name": str(region.get("display_name", "")),
			"components": screen_components,
			"closed_components": closed_screen_components,
		}
		_screen_regions.append(screen_region)
		_screen_regions_by_id[int(screen_region.get("id", 0))] = screen_region
		_region_ids_by_slug[str(screen_region.get("slug", ""))] = int(screen_region.get("id", 0))


func _get_aspect_fit_rect(target_size: Vector2, source_size: Vector2) -> Rect2:
	if target_size.x <= 0.0 or target_size.y <= 0.0 or source_size.x <= 0.0 or source_size.y <= 0.0:
		return Rect2(Vector2.ZERO, target_size)

	var fit_scale := minf(target_size.x / source_size.x, target_size.y / source_size.y)
	var fitted_size := source_size * fit_scale
	return Rect2((target_size - fitted_size) * 0.5, fitted_size)


func _transform_component(component: PackedVector2Array) -> PackedVector2Array:
	var transformed := PackedVector2Array()
	transformed.resize(component.size())

	for index in range(component.size()):
		transformed[index] = _image_to_view_position(component[index])

	return transformed


func _closed_component(component: PackedVector2Array) -> PackedVector2Array:
	var closed := PackedVector2Array(component)
	if closed.size() > 0:
		closed.append(closed[0])
	return closed


func _image_to_view_position(image_position: Vector2) -> Vector2:
	if _assets == null or _assets.image_size == Vector2.ZERO:
		return image_position

	return _map_rect.position + Vector2(
		(image_position.x / _assets.image_size.x) * _map_rect.size.x,
		(image_position.y / _assets.image_size.y) * _map_rect.size.y
	)


func _normalized_to_view_position(normalized_position: Vector2) -> Vector2:
	return _map_rect.position + Vector2(normalized_position.x * _map_rect.size.x, normalized_position.y * _map_rect.size.y)


func _view_to_image_position(view_position: Vector2) -> Vector2:
	if _assets == null or _assets.image_size == Vector2.ZERO or _map_rect.size.x <= 0.0 or _map_rect.size.y <= 0.0:
		return Vector2(-1.0, -1.0)

	if not _map_rect.has_point(view_position):
		return Vector2(-1.0, -1.0)

	var local_position := view_position - _map_rect.position
	return Vector2(
		(local_position.x / _map_rect.size.x) * _assets.image_size.x,
		(local_position.y / _map_rect.size.y) * _assets.image_size.y
	)


func _pick_region_id_at_view_position(view_position: Vector2) -> int:
	if _screen_cache_dirty:
		_rebuild_screen_cache()

	if _assets == null:
		return 0

	return _assets.pick_region_id(_view_to_image_position(view_position))


func _set_hover_region_id(region_id: int) -> void:
	if _hover_region_id == region_id:
		return

	_hover_region_id = region_id
	var region := _get_region(region_id)
	region_hovered.emit(
		region_id,
		str(region.get("slug", "")),
		str(region.get("display_name", ""))
	)
	queue_redraw()


func _get_region(region_id: int) -> Dictionary:
	if _assets == null:
		return {}
	return _assets.get_region(region_id)


func _get_screen_region(region_id: int) -> Dictionary:
	var region = _screen_regions_by_id.get(region_id, {})
	return region if typeof(region) == TYPE_DICTIONARY else {}


func _region_id_for_slug(slug: String) -> int:
	if slug.is_empty():
		return 0
	var cached_id := int(_region_ids_by_slug.get(slug, 0))
	if cached_id > 0:
		return cached_id
	if _assets == null:
		return 0
	for region in _assets.regions:
		if str(region.get("slug", "")) == slug:
			return int(region.get("id", 0))
	return 0


func _layout_position(region_id: String) -> Vector2:
	if _layout_positions_dirty:
		_rebuild_layout_position_cache()
	var cached_position = _layout_positions.get(region_id, Vector2.INF)
	return cached_position if cached_position is Vector2 else Vector2.INF


func _rebuild_layout_position_cache() -> void:
	_layout_positions_dirty = false
	_layout_positions.clear()
	for region_id_variant in _region_layout.keys():
		var region_id := str(region_id_variant)
		var layout: Dictionary = _region_layout.get(region_id, {})
		if layout.is_empty():
			continue
		_layout_positions[region_id] = _normalized_to_view_position(Vector2(float(layout.get("x", 0.5)), float(layout.get("y", 0.5))))


func _refresh_visible_network_flows() -> void:
	_visible_network_flows = NETWORK_FLOW_LAYER.visible_flows(_network_flows, _selected_region_slug, 10)


func _sync_processing() -> void:
	set_process(animate_network_flows and not _visible_network_flows.is_empty())


func _should_skip_hover_pick(view_position: Vector2) -> bool:
	if hover_pick_step_pixels <= 0.0 or _last_hover_pick_position == Vector2.INF:
		return false
	return _last_hover_pick_position.distance_squared_to(view_position) < hover_pick_step_pixels * hover_pick_step_pixels


func _cached_for_region(region_id: String) -> Dictionary:
	var region: Dictionary = _regions_state.get(region_id, {})
	return region.get("cached", {})


func _marker_color(state_name: String) -> Color:
	match state_name:
		"blackout":
			return Color("#2d3338f0")
		"energy_deficit":
			return Color("#ff6b38f0")
		"cooling_low":
			return Color("#7ca4fff0")
		"network_saturated":
			return Color("#f2aa42f0")
		"surplus":
			return Color("#37e0a5f0")
		"compute_high":
			return Color("#9d7bfff0")
		_:
			return Color("#50d8e5d8")


func _sync_labels() -> void:
	if not is_inside_tree():
		return

	var title_label := get_node_or_null("MapLabels/TitleLabel") as Label
	var status_label := get_node_or_null("MapLabels/StatusLabel") as Label

	if title_label != null:
		title_label.text = map_title_text
	if status_label != null:
		status_label.text = map_status_text
