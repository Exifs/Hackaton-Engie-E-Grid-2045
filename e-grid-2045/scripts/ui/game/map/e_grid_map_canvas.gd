@tool
extends Control
class_name EGridMapCanvas

signal map_pressed(position: Vector2)
signal region_selected(region_id: String, display_name: String)
signal region_hovered(region_id: String, display_name: String)

const MAP_DATA_SOURCE := preload("res://scripts/ui/game/map/e_grid_map_data_source.gd")
const TWO_PI := PI * 2.0

const GEOGRAPHIC_LABELS := [
	{"text": "IRELAND", "position": Vector2(0.18, 0.325), "width": 88.0, "size": 12, "alpha": 0.58},
	{"text": "UNITED\nKINGDOM", "position": Vector2(0.285, 0.375), "width": 112.0, "size": 12, "alpha": 0.60},
	{"text": "FRANCE", "position": Vector2(0.355, 0.595), "width": 104.0, "size": 12, "alpha": 0.62},
	{"text": "BENELUX", "position": Vector2(0.445, 0.390), "width": 104.0, "size": 12, "alpha": 0.64},
	{"text": "GERMANY", "position": Vector2(0.560, 0.505), "width": 112.0, "size": 12, "alpha": 0.64},
	{"text": "DENMARK", "position": Vector2(0.540, 0.282), "width": 104.0, "size": 12, "alpha": 0.60},
	{"text": "SWEDEN", "position": Vector2(0.660, 0.225), "width": 104.0, "size": 12, "alpha": 0.60},
	{"text": "FINLAND", "position": Vector2(0.803, 0.140), "width": 104.0, "size": 12, "alpha": 0.60},
	{"text": "POLAND", "position": Vector2(0.720, 0.475), "width": 96.0, "size": 12, "alpha": 0.62},
	{"text": "CZECHIA", "position": Vector2(0.600, 0.555), "width": 96.0, "size": 11, "alpha": 0.58},
	{"text": "AUSTRIA", "position": Vector2(0.585, 0.625), "width": 96.0, "size": 11, "alpha": 0.58},
	{"text": "SWITZERLAND", "position": Vector2(0.445, 0.630), "width": 124.0, "size": 11, "alpha": 0.52},
	{"text": "ITALY", "position": Vector2(0.555, 0.762), "width": 80.0, "size": 12, "alpha": 0.60},
	{"text": "SPAIN", "position": Vector2(0.230, 0.778), "width": 88.0, "size": 12, "alpha": 0.60},
	{"text": "PORTUGAL", "position": Vector2(0.082, 0.765), "width": 104.0, "size": 12, "alpha": 0.58},
	{"text": "HUNGARY", "position": Vector2(0.680, 0.675), "width": 96.0, "size": 11, "alpha": 0.56},
	{"text": "ROMANIA", "position": Vector2(0.812, 0.690), "width": 104.0, "size": 12, "alpha": 0.58},
	{"text": "BULGARIA", "position": Vector2(0.800, 0.792), "width": 104.0, "size": 11, "alpha": 0.56},
	{"text": "GREECE", "position": Vector2(0.772, 0.885), "width": 96.0, "size": 12, "alpha": 0.58},
]

const SEA_LABELS := [
	{"text": "NORTH\nSEA", "position": Vector2(0.388, 0.240), "width": 116.0, "size": 10, "alpha": 0.22},
	{"text": "BALTIC\nSEA", "position": Vector2(0.655, 0.325), "width": 116.0, "size": 10, "alpha": 0.22},
	{"text": "ATLANTIC\nOCEAN", "position": Vector2(0.105, 0.540), "width": 132.0, "size": 10, "alpha": 0.19},
	{"text": "MEDITERRANEAN\nSEA", "position": Vector2(0.445, 0.885), "width": 150.0, "size": 10, "alpha": 0.19},
	{"text": "ADRIATIC\nSEA", "position": Vector2(0.635, 0.765), "width": 126.0, "size": 10, "alpha": 0.18},
]

const LABEL_OVERRIDES := {
	"fr_nord": "FRANCE NORD",
	"fr_sud": "FRANCE SUD",
	"de_west": "ALLEMAGNE O.",
	"de_east": "ALLEMAGNE E.",
	"de_north": "ALLEMAGNE N.",
	"benelux": "BENELUX",
	"dk": "DANEMARK",
	"se_south": "SUEDE SUD",
	"se_north": "SUEDE NORD",
	"fi": "FINLANDE",
	"ie": "IRLANDE",
	"es_north": "ESPAGNE NORD",
	"es_south": "ESPAGNE SUD",
	"pt": "PORTUGAL",
	"it_north": "ITALIE NORD",
	"it_south_islands": "ITALIE SUD",
	"at": "AUTRICHE",
	"pl": "POLOGNE",
	"cz": "TCHEQUIE",
	"sk": "SLOVAQUIE",
	"hu": "HONGRIE",
	"ro": "ROUMANIE",
	"bg": "BULGARIE",
	"gr": "GRECE",
	"eu_north_balkans": "BALKANS NORD",
	"baltic_north": "BALTIQUE N.",
	"baltic_south": "BALTIQUE S.",
	"si_hr": "SLOVENIE-CROATIE",
	"lux_saarlorlux": "SAARLORLUX",
	"med_islands": "ILES MED.",
}

var _land_polygons := [
	[
		Vector2(0.10, 0.72),
		Vector2(0.12, 0.65),
		Vector2(0.18, 0.59),
		Vector2(0.25, 0.56),
		Vector2(0.31, 0.49),
		Vector2(0.37, 0.43),
		Vector2(0.44, 0.36),
		Vector2(0.52, 0.32),
		Vector2(0.61, 0.35),
		Vector2(0.70, 0.40),
		Vector2(0.78, 0.49),
		Vector2(0.82, 0.60),
		Vector2(0.80, 0.71),
		Vector2(0.74, 0.80),
		Vector2(0.66, 0.86),
		Vector2(0.58, 0.81),
		Vector2(0.53, 0.72),
		Vector2(0.48, 0.67),
		Vector2(0.42, 0.65),
		Vector2(0.36, 0.70),
		Vector2(0.29, 0.77),
		Vector2(0.20, 0.78),
	],
	[
		Vector2(0.19, 0.49),
		Vector2(0.18, 0.41),
		Vector2(0.21, 0.34),
		Vector2(0.27, 0.31),
		Vector2(0.32, 0.38),
		Vector2(0.30, 0.48),
		Vector2(0.24, 0.52),
	],
	[
		Vector2(0.13, 0.42),
		Vector2(0.15, 0.36),
		Vector2(0.20, 0.34),
		Vector2(0.22, 0.42),
		Vector2(0.18, 0.49),
	],
	[
		Vector2(0.55, 0.32),
		Vector2(0.57, 0.22),
		Vector2(0.61, 0.10),
		Vector2(0.68, 0.04),
		Vector2(0.76, 0.08),
		Vector2(0.80, 0.18),
		Vector2(0.77, 0.29),
		Vector2(0.70, 0.35),
		Vector2(0.62, 0.36),
	],
	[
		Vector2(0.48, 0.75),
		Vector2(0.52, 0.78),
		Vector2(0.54, 0.86),
		Vector2(0.51, 0.90),
		Vector2(0.46, 0.85),
	],
	[
		Vector2(0.58, 0.77),
		Vector2(0.64, 0.81),
		Vector2(0.66, 0.89),
		Vector2(0.61, 0.92),
		Vector2(0.56, 0.86),
	],
]

@export_group("Data")
@export_file("*.csv") var region_layout_path := "res://data/region_layout.csv":
	set(value):
		region_layout_path = value
		_reload_data()

@export_file("*.csv") var regions_path := "res://data/regions.csv":
	set(value):
		regions_path = value
		_reload_data()

@export_file("*.csv") var network_edges_path := "res://data/network_edges.csv":
	set(value):
		network_edges_path = value
		_reload_data()

@export_file("*.json") var region_shapes_path := "res://data/region_shapes.json":
	set(value):
		region_shapes_path = value
		_reload_data()

@export_file("*.png") var backdrop_texture_path := "res://assets/map/europe_map_backdrop_generated_clean_v1.png":
	set(value):
		backdrop_texture_path = value
		_load_backdrop_texture()
		queue_redraw()

@export var selected_region_id := "benelux":
	set(value):
		selected_region_id = value
		queue_redraw()

@export var accept_map_input := true:
	set(value):
		accept_map_input = value
		mouse_filter = Control.MOUSE_FILTER_STOP if accept_map_input else Control.MOUSE_FILTER_IGNORE

@export_group("Rendering")
@export var map_padding := 2.0:
	set(value):
		map_padding = maxf(value, 0.0)
		queue_redraw()

@export_range(0.6, 1.6, 0.05) var region_shape_scale := 1.02:
	set(value):
		region_shape_scale = value
		queue_redraw()

@export var region_shape_offset := Vector2.ZERO:
	set(value):
		region_shape_offset = value
		queue_redraw()

@export_range(8, 20, 1) var label_font_size := 12:
	set(value):
		label_font_size = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var network_opacity := 0.30:
	set(value):
		network_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var map_trace_opacity := 0.50:
	set(value):
		map_trace_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var map_trace_pulse_opacity := 0.48:
	set(value):
		map_trace_pulse_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var map_trace_relay_opacity := 0.78:
	set(value):
		map_trace_relay_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var selected_neighbor_halo_opacity := 0.52:
	set(value):
		selected_neighbor_halo_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var region_port_opacity := 0.78:
	set(value):
		region_port_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var import_export_route_opacity := 0.62:
	set(value):
		import_export_route_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var congestion_route_opacity := 0.56:
	set(value):
		congestion_route_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var region_overlay_opacity := 0.72:
	set(value):
		region_overlay_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var region_boundary_emboss_opacity := 0.90:
	set(value):
		region_boundary_emboss_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var region_status_opacity := 0.62:
	set(value):
		region_status_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var region_status_glyph_opacity := 0.82:
	set(value):
		region_status_glyph_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var selected_region_texture_opacity := 0.82:
	set(value):
		selected_region_texture_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var selected_region_anchor_opacity := 0.70:
	set(value):
		selected_region_anchor_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var backdrop_opacity := 1.0:
	set(value):
		backdrop_opacity = value
		queue_redraw()

@export_range(0.0, 1.0, 0.05) var glass_reflection_opacity := 0.18:
	set(value):
		glass_reflection_opacity = value
		queue_redraw()

@export var show_region_labels := false:
	set(value):
		show_region_labels = value
		queue_redraw()

@export var show_geographic_labels := true:
	set(value):
		show_geographic_labels = value
		queue_redraw()

@export var show_selected_region_label := true:
	set(value):
		show_selected_region_label = value
		queue_redraw()

@export var show_selected_region_texture := true:
	set(value):
		show_selected_region_texture = value
		queue_redraw()

@export var show_selected_region_anchors := true:
	set(value):
		show_selected_region_anchors = value
		queue_redraw()

@export var show_region_status_wash := true:
	set(value):
		show_region_status_wash = value
		queue_redraw()

@export var show_region_status_glyphs := true:
	set(value):
		show_region_status_glyphs = value
		queue_redraw()

@export var show_screen_treatment := true:
	set(value):
		show_screen_treatment = value
		queue_redraw()

@export var show_glass_reflection := true:
	set(value):
		show_glass_reflection = value
		queue_redraw()

@export var show_map_traces := true:
	set(value):
		show_map_traces = value
		queue_redraw()

@export var show_map_trace_pulses := true:
	set(value):
		show_map_trace_pulses = value
		queue_redraw()

@export var show_map_trace_relays := true:
	set(value):
		show_map_trace_relays = value
		queue_redraw()

@export var show_selected_neighbor_halos := true:
	set(value):
		show_selected_neighbor_halos = value
		queue_redraw()

@export var show_import_export_routes := true:
	set(value):
		show_import_export_routes = value
		queue_redraw()

@export var show_congestion_routes := true:
	set(value):
		show_congestion_routes = value
		queue_redraw()

@export var show_network := false:
	set(value):
		show_network = value
		queue_redraw()

@export var show_region_hubs := false:
	set(value):
		show_region_hubs = value
		queue_redraw()

@export var animate_selection := true:
	set(value):
		animate_selection = value
		if is_inside_tree():
			set_process(animate_selection)

@export_group("Palette")
@export var ocean_color := Color("#07151a"):
	set(value):
		ocean_color = value
		queue_redraw()

@export var land_color := Color("#223238"):
	set(value):
		land_color = value
		queue_redraw()

@export var coastline_color := Color("#8aa2a061"):
	set(value):
		coastline_color = value
		queue_redraw()

@export var region_outline_color := Color("#c8b66b61"):
	set(value):
		region_outline_color = value
		queue_redraw()

@export var selection_color := Color("#31f6ef"):
	set(value):
		selection_color = value
		queue_redraw()

@export var power_flow_color := Color("#42f0ba"):
	set(value):
		power_flow_color = value
		queue_redraw()

@export var data_flow_color := Color("#28aef5"):
	set(value):
		data_flow_color = value
		queue_redraw()

@export var cooling_flow_color := Color("#a66cff"):
	set(value):
		cooling_flow_color = value
		queue_redraw()

@export var congestion_color := Color("#ff7a2d"):
	set(value):
		congestion_color = value
		queue_redraw()

var _regions := {}
var _region_order := []
var _edges := []
var _hovered_region_id := ""
var _backdrop_texture: Texture2D


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP if accept_map_input else Control.MOUSE_FILTER_IGNORE
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	clip_contents = true
	_load_backdrop_texture()
	_reload_data()

	if not resized.is_connected(_request_redraw):
		resized.connect(_request_redraw)

	set_process(animate_selection)


func _process(_delta: float) -> void:
	if animate_selection:
		queue_redraw()


func _draw() -> void:
	if _regions.is_empty():
		_reload_data()

	var map_rect := _get_map_rect()

	_draw_background(map_rect)

	if _backdrop_texture != null:
		_draw_backdrop_texture(map_rect)
		_draw_backdrop_atmosphere(map_rect)
	else:
		_draw_reference_routes(map_rect)
		_draw_landmasses(map_rect)

	_draw_regions(map_rect)

	if show_region_status_wash:
		_draw_region_status_wash(map_rect)

	if show_map_traces:
		_draw_map_traces(map_rect)

	if show_selected_neighbor_halos:
		_draw_selected_neighbor_halos(map_rect)

	if show_congestion_routes:
		_draw_congestion_routes(map_rect)

	if show_import_export_routes:
		_draw_import_export_routes(map_rect)

	if show_region_status_glyphs:
		_draw_region_status_glyphs(map_rect)

	if show_network:
		_draw_network(map_rect)

	_draw_selected_region(map_rect)

	if show_geographic_labels:
		_draw_geographic_labels(map_rect)

	if show_selected_region_label:
		_draw_selected_region_label(map_rect)

	if show_glass_reflection:
		_draw_glass_reflection(map_rect)

	if show_region_hubs:
		_draw_region_hubs(map_rect)

	if show_region_labels:
		_draw_region_labels(map_rect)

	_draw_panel_frame()


func _gui_input(event: InputEvent) -> void:
	if not accept_map_input:
		return

	if event is InputEventMouseMotion:
		_update_hovered_region((event as InputEventMouseMotion).position)
		return

	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton

		if mouse_event.button_index != MOUSE_BUTTON_LEFT or not mouse_event.pressed:
			return

		var region_id := get_region_id_at(mouse_event.position)
		map_pressed.emit(mouse_event.position)

		if not region_id.is_empty():
			selected_region_id = region_id
			region_selected.emit(region_id, _get_region_display_name(region_id))

		accept_event()


func reload_data() -> void:
	_reload_data()


func get_region_id_at(local_position: Vector2) -> String:
	if _regions.is_empty():
		return ""

	var map_rect := _get_map_rect()
	var best_region_id := ""
	var best_area := INF
	var best_distance := INF

	for region_id in _region_order:
		var region := _regions.get(region_id, {}) as Dictionary

		if region.has("shapes"):
			var shape_polygons := _region_shape_polygons(region, map_rect)

			for shape_points in shape_polygons:
				if not _point_in_polygon(local_position, shape_points):
					continue

				var area := absf(_polygon_area(shape_points))

				if area < best_area:
					best_area = area
					best_region_id = region_id

			if not shape_polygons.is_empty():
				continue

		if not is_inf(best_area):
			continue

		var center := _region_screen_position(region, map_rect)
		var hit_radius := _region_hit_radius(region, map_rect)
		var distance := local_position.distance_to(center)

		if distance <= hit_radius and distance < best_distance:
			best_distance = distance
			best_region_id = region_id

	return best_region_id


func _reload_data() -> void:
	var data := MAP_DATA_SOURCE.load_map_data(region_layout_path, regions_path, network_edges_path, region_shapes_path)
	_regions = data.get("regions", {})
	_region_order = data.get("region_order", [])
	_edges = data.get("edges", [])

	if not selected_region_id.is_empty() and not _regions.has(selected_region_id) and not _region_order.is_empty():
		selected_region_id = _region_order[0]

	queue_redraw()


func _load_backdrop_texture() -> void:
	if backdrop_texture_path.strip_edges().is_empty():
		_backdrop_texture = null
		return

	if ResourceLoader.exists(backdrop_texture_path, "Texture2D"):
		_backdrop_texture = load(backdrop_texture_path) as Texture2D

		if _backdrop_texture != null:
			return

	var image := Image.load_from_file(backdrop_texture_path)

	if image == null or image.is_empty():
		push_warning("Could not load map backdrop texture: %s" % backdrop_texture_path)
		return

	_backdrop_texture = ImageTexture.create_from_image(image)


func _request_redraw() -> void:
	queue_redraw()


func _get_map_rect() -> Rect2:
	var safe_padding := minf(map_padding, minf(size.x, size.y) * 0.22)
	var rect_position := Vector2(safe_padding, safe_padding)
	var rect_size := Vector2(
			maxf(1.0, size.x - safe_padding * 2.0),
			maxf(1.0, size.y - safe_padding * 2.0)
	)

	return Rect2(rect_position, rect_size)


func _draw_background(map_rect: Rect2) -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color("#03080b"), true)
	draw_rect(map_rect, ocean_color, true)

	for index in range(15):
		var x := map_rect.position.x + map_rect.size.x * float(index) / 14.0
		draw_line(Vector2(x, map_rect.position.y), Vector2(x, map_rect.end.y), _with_alpha(Color("#5ec6d7"), 0.045), 1.0)

	for index in range(9):
		var y := map_rect.position.y + map_rect.size.y * float(index) / 8.0
		draw_line(Vector2(map_rect.position.x, y), Vector2(map_rect.end.x, y), _with_alpha(Color("#5ec6d7"), 0.035), 1.0)

	for index in range(190):
		var point := map_rect.position + Vector2(
			_fract(sin(float(index) * 12.9898) * 43758.5453) * map_rect.size.x,
			_fract(sin(float(index) * 78.233) * 12515.8731) * map_rect.size.y
		)
		var alpha := 0.025 + _fract(float(index) * 0.371) * 0.055
		draw_rect(Rect2(point, Vector2.ONE), _with_alpha(Color("#8bdde5"), alpha), true)

	if _backdrop_texture == null:
		_draw_sea_label(map_rect, Vector2(0.32, 0.27), "NORTH\nSEA")
		_draw_sea_label(map_rect, Vector2(0.70, 0.28), "BALTIC\nSEA")
		_draw_sea_label(map_rect, Vector2(0.25, 0.58), "ATLANTIC\nOCEAN")
		_draw_sea_label(map_rect, Vector2(0.46, 0.86), "MEDITERRANEAN\nSEA")
		_draw_sea_label(map_rect, Vector2(0.63, 0.76), "ADRIATIC\nSEA")


func _draw_backdrop_texture(map_rect: Rect2) -> void:
	if _backdrop_texture == null:
		return

	var texture_size := _backdrop_texture.get_size()

	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return

	var source_rect := _get_backdrop_source_rect(map_rect)

	draw_texture_rect_region(_backdrop_texture, map_rect, source_rect, _with_alpha(Color("#ffffff"), backdrop_opacity))


func _get_backdrop_source_rect(map_rect: Rect2) -> Rect2:
	if _backdrop_texture == null:
		return Rect2(Vector2.ZERO, Vector2.ONE)

	var texture_size := _backdrop_texture.get_size()

	if texture_size.x <= 0.0 or texture_size.y <= 0.0 or map_rect.size.x <= 0.0 or map_rect.size.y <= 0.0:
		return Rect2(Vector2.ZERO, texture_size)

	var texture_aspect := texture_size.x / texture_size.y
	var target_aspect := map_rect.size.x / map_rect.size.y
	var source_rect := Rect2(Vector2.ZERO, texture_size)

	if texture_aspect > target_aspect:
		var crop_width := texture_size.y * target_aspect
		source_rect.position.x = (texture_size.x - crop_width) * 0.5
		source_rect.size.x = crop_width
	else:
		var crop_height := texture_size.x / target_aspect
		source_rect.position.y = (texture_size.y - crop_height) * 0.5
		source_rect.size.y = crop_height

	return source_rect


func _draw_backdrop_atmosphere(map_rect: Rect2) -> void:
	draw_rect(map_rect, _with_alpha(Color("#02080a"), 0.12), true)
	draw_rect(Rect2(map_rect.position, Vector2(map_rect.size.x, 18.0)), _with_alpha(Color("#02070a"), 0.28), true)
	draw_rect(Rect2(Vector2(map_rect.position.x, map_rect.end.y - 26.0), Vector2(map_rect.size.x, 26.0)), _with_alpha(Color("#02070a"), 0.24), true)
	draw_rect(Rect2(map_rect.position, Vector2(26.0, map_rect.size.y)), _with_alpha(Color("#02070a"), 0.16), true)
	draw_rect(Rect2(Vector2(map_rect.end.x - 26.0, map_rect.position.y), Vector2(26.0, map_rect.size.y)), _with_alpha(Color("#02070a"), 0.16), true)

	if show_screen_treatment:
		_draw_screen_treatment(map_rect)

	for index in range(7):
		var alpha := 0.028 + float(index) * 0.006
		draw_rect(map_rect.grow(-float(index) * 7.0), _with_alpha(Color("#48d7df"), alpha), false, 1.0)


func _draw_screen_treatment(map_rect: Rect2) -> void:
	var scanline_step := 4
	var scanline_count := int(map_rect.size.y / float(scanline_step))

	for index in range(scanline_count):
		var y := map_rect.position.y + float(index * scanline_step)
		draw_line(Vector2(map_rect.position.x, y), Vector2(map_rect.end.x, y), _with_alpha(Color("#67ddea"), 0.018), 1.0)

	for index in range(5):
		var inset := float(index) * 18.0 + 10.0
		var line_rect := map_rect.grow(-inset)

		if line_rect.size.x <= 0.0 or line_rect.size.y <= 0.0:
			continue

		draw_rect(line_rect, _with_alpha(Color("#5be6f4"), 0.020 - float(index) * 0.002), false, 1.0)


func _draw_reference_routes(map_rect: Rect2) -> void:
	var route_color := _with_alpha(Color("#9fd7d9"), 0.25)
	var routes := [
		[Vector2(0.04, 0.52), Vector2(0.24, 0.42), Vector2(0.45, 0.38)],
		[Vector2(0.12, 0.18), Vector2(0.36, 0.06), Vector2(0.58, 0.02)],
		[Vector2(0.82, 0.66), Vector2(0.92, 0.60), Vector2(0.98, 0.52)],
		[Vector2(0.52, 0.88), Vector2(0.66, 0.97), Vector2(0.80, 0.90)],
	]

	for route in routes:
		var points := PackedVector2Array()

		for normalized_point in route:
			points.append(_map_point(normalized_point, map_rect))

		_draw_dashed_polyline(points, route_color, 1.4, 8.0, 7.0)


func _draw_landmasses(map_rect: Rect2) -> void:
	for polygon in _land_polygons:
		var points := _scale_points(polygon, map_rect)
		var shadow_points := _offset_points(points, Vector2(6.0, 8.0))
		var relief_points := _offset_points(points, Vector2(2.0, 3.0))

		_draw_solid_polygon(shadow_points, _with_alpha(Color("#020506"), 0.55))
		_draw_solid_polygon(relief_points, _with_alpha(Color("#0d1719"), 0.85))
		_draw_solid_polygon(points, land_color)
		draw_polyline(_closed_polyline(points), _with_alpha(Color("#0d2023"), 0.95), 4.0, true)
		draw_polyline(_closed_polyline(points), coastline_color, 1.5, true)

	for region_id in _region_order:
		var region := _regions.get(region_id, {}) as Dictionary
		var center := _region_screen_position(region, map_rect)
		var terrain_color := _with_alpha(Color("#c2d1ca"), 0.055)
		var hash_seed := _hash_unit(region_id)

		for index in range(2):
			var offset := Vector2(cos(hash_seed * TWO_PI + index), sin(hash_seed * TWO_PI + index * 1.7)) * 18.0
			draw_line(center - offset, center + offset * 0.72, terrain_color, 1.0, true)


func _draw_regions(map_rect: Rect2) -> void:
	var has_backdrop := _backdrop_texture != null

	for region_id in _region_order:
		if region_id == selected_region_id:
			continue

		var region := _regions.get(region_id, {}) as Dictionary
		var fill := _region_fill_color(region)
		var outline := region_outline_color
		var outline_width := 1.2

		if has_backdrop:
			fill.a = 0.018 * region_overlay_opacity
			outline = _with_alpha(region_outline_color, 0.20 * region_overlay_opacity)
			outline_width = 0.85

		if region_id == _hovered_region_id:
			fill = _mix_color(fill, selection_color, 0.28)
			fill.a = 0.16 if has_backdrop else 0.28
			outline = _with_alpha(selection_color, 0.72 if has_backdrop else 0.5)
			outline_width = 1.85

		for points in _region_polygons(region_id, region, map_rect):
			_draw_solid_polygon(points, fill)
			_draw_region_boundary(points, outline, outline_width, has_backdrop, region_id == _hovered_region_id)


func _draw_region_boundary(points: PackedVector2Array, outline: Color, outline_width: float, has_backdrop: bool, is_hovered: bool) -> void:
	if points.size() < 2:
		return

	var closed_points := _closed_polyline(points)

	if has_backdrop:
		var emboss_scale := region_boundary_emboss_opacity * (1.45 if is_hovered else 1.0)
		draw_polyline(_offset_points(closed_points, Vector2(0.8, 1.0)), _with_alpha(Color("#020608"), 0.22 * emboss_scale), 1.35, true)
		draw_polyline(closed_points, _with_alpha(Color("#b9f3ee"), 0.055 * emboss_scale), 2.35, true)
		draw_polyline(closed_points, _with_alpha(Color("#53d5df"), 0.036 * emboss_scale), 3.9 if is_hovered else 2.75, true)

	draw_polyline(closed_points, outline, outline_width, true)


func _draw_selected_region(map_rect: Rect2) -> void:
	if selected_region_id.is_empty() or not _regions.has(selected_region_id):
		return

	var region := _regions.get(selected_region_id, {}) as Dictionary
	var pulse := 0.65 + 0.35 * sin(float(Time.get_ticks_msec()) / 430.0)
	var has_backdrop := _backdrop_texture != null
	var glow_color := _with_alpha(selection_color, 0.095 + pulse * 0.055 if has_backdrop else 0.12 + pulse * 0.08)
	var fill_color := _with_alpha(selection_color, 0.048 if has_backdrop else 0.18)
	var outer_width := 6.2 if has_backdrop else 12.0
	var inner_width := 2.9 if has_backdrop else 6.0
	var stroke_width := 1.45 if has_backdrop else 2.2
	var polygons := _region_polygons(selected_region_id, region, map_rect)

	_draw_selected_region_aura(polygons, has_backdrop, pulse)

	for points in polygons:
		_draw_solid_polygon(points, fill_color)

		if show_selected_region_texture:
			_draw_selected_region_texture(points, has_backdrop, pulse)

		draw_polyline(_closed_polyline(points), glow_color, outer_width, true)
		draw_polyline(_closed_polyline(points), _with_alpha(selection_color, 0.42), inner_width, true)
		draw_polyline(_closed_polyline(points), selection_color, stroke_width, true)

		if show_selected_region_anchors:
			_draw_selected_region_anchors(points, has_backdrop, pulse)


func _draw_selected_region_aura(polygons: Array[PackedVector2Array], has_backdrop: bool, pulse: float) -> void:
	if polygons.is_empty():
		return

	var outer_alpha := 0.045 + pulse * 0.030 if has_backdrop else 0.075 + pulse * 0.035
	var mid_alpha := 0.105 + pulse * 0.045 if has_backdrop else 0.12 + pulse * 0.045
	var outer_width := 14.0 if has_backdrop else 16.0
	var mid_width := 7.6 if has_backdrop else 9.0

	for points in polygons:
		var closed_points := _closed_polyline(points)
		draw_polyline(closed_points, _with_alpha(selection_color, outer_alpha), outer_width, true)
		draw_polyline(closed_points, _with_alpha(selection_color, mid_alpha), mid_width, true)
		draw_polyline(_offset_points(closed_points, Vector2(1.0, 1.35)), _with_alpha(Color("#02080a"), 0.24 if has_backdrop else 0.34), 1.8, true)


func _draw_selected_region_texture(points: PackedVector2Array, has_backdrop: bool, pulse: float) -> void:
	if points.size() < 3 or selected_region_texture_opacity <= 0.0:
		return

	var bounds := _polygon_bounds(points)

	if bounds.size.x <= 4.0 or bounds.size.y <= 4.0:
		return

	var line_gap := 5.0 if has_backdrop else 8.0
	var alpha := selected_region_texture_opacity * (0.21 + pulse * 0.045 if has_backdrop else 0.18 + pulse * 0.04)
	var line_color := _with_alpha(selection_color, alpha)
	var shadow_color := _with_alpha(Color("#021719"), alpha * 0.38)
	var y := bounds.position.y + 4.0
	var row_index := 0

	while y < bounds.end.y - 3.0:
		var intersections := _polygon_horizontal_intersections(points, y)
		var intersection_index := 0

		while intersection_index < intersections.size() - 1:
			var start_x := float(intersections[intersection_index]) + 2.0
			var end_x := float(intersections[intersection_index + 1]) - 2.0

			if end_x - start_x > 5.0:
				var wave_offset := sin(float(row_index) * 1.71 + pulse * PI) * 0.6
				var start := Vector2(start_x + wave_offset, y)
				var end := Vector2(end_x + wave_offset, y)
				draw_line(start + Vector2(0.0, 1.0), end + Vector2(0.0, 1.0), shadow_color, 1.0, true)
				draw_line(start, end, line_color, 0.9, true)

			intersection_index += 2

		y += line_gap
		row_index += 1


func _draw_selected_region_anchors(points: PackedVector2Array, has_backdrop: bool, pulse: float) -> void:
	if points.size() < 3 or selected_region_anchor_opacity <= 0.0:
		return

	var bounds := _polygon_bounds(points)
	var anchors := _polygon_extreme_points(points, bounds)
	var anchor_alpha := selected_region_anchor_opacity * (0.70 + pulse * 0.18 if has_backdrop else 0.86 + pulse * 0.12)
	var anchor_radius := maxf(2.6, minf(bounds.size.x, bounds.size.y) * 0.043)
	var center := bounds.get_center()

	for anchor in anchors:
		var outward := (anchor - center).normalized()

		if outward.length_squared() <= 0.001:
			outward = Vector2.UP

		var tangent := Vector2(-outward.y, outward.x)
		var node_points := _regular_polygon_points(anchor, anchor_radius * 0.92, 4, PI * 0.25)
		var tick_start := anchor + outward * anchor_radius * 1.20
		var tick_end := anchor + outward * anchor_radius * 2.55

		draw_circle(anchor, anchor_radius * 3.0, _with_alpha(selection_color, anchor_alpha * 0.12))
		_draw_solid_polygon(node_points, _with_alpha(Color("#031719"), anchor_alpha * 0.62))
		draw_polyline(_closed_polyline(node_points), _with_alpha(selection_color, anchor_alpha), 0.9, true)
		draw_line(tick_start, tick_end, _with_alpha(selection_color, anchor_alpha * 0.78), 0.9, true)
		draw_line(tick_start - tangent * anchor_radius * 0.88, tick_start + tangent * anchor_radius * 0.88, _with_alpha(selection_color, anchor_alpha * 0.42), 0.75, true)


func _draw_region_status_wash(map_rect: Rect2) -> void:
	if region_status_opacity <= 0.0:
		return

	for region_id in _region_order:
		if region_id == selected_region_id:
			continue

		var region := _regions.get(region_id, {}) as Dictionary
		var wash_color := _region_status_wash_color(region)

		if wash_color.a <= 0.0:
			continue

		if _region_is_selected_neighbor(region_id):
			wash_color.a *= 1.22

		for points in _region_polygons(region_id, region, map_rect):
			_draw_solid_polygon(points, wash_color)


func _draw_region_status_glyphs(map_rect: Rect2) -> void:
	if region_status_glyph_opacity <= 0.0:
		return

	var has_backdrop := _backdrop_texture != null
	var base_size := maxf(6.5, minf(map_rect.size.x, map_rect.size.y) * (0.010 if has_backdrop else 0.014))

	for region_id in _region_order:
		if region_id == selected_region_id:
			continue

		var region := _regions.get(region_id, {}) as Dictionary
		var balance := float(region.get("starting_energy_balance", 0.0))

		if balance >= -0.05:
			continue

		var severity := clampf(absf(balance) / 0.7, 0.45, 1.0)
		var size_scale := lerpf(0.82, 1.18, severity)
		var glyph_size := base_size * size_scale
		var alpha := region_status_glyph_opacity * lerpf(0.58, 0.94, severity)
		var glyph_position := _region_visual_position(region, map_rect)
		var polygons := _region_polygons(region_id, region, map_rect)

		if not polygons.is_empty():
			var bounds := _polygon_collection_bounds(polygons)

			if bounds.size.x > 0.0 and bounds.size.y > 0.0:
				glyph_position = Vector2(
					bounds.position.x + bounds.size.x * 0.68,
					bounds.position.y + bounds.size.y * 0.18
				) + Vector2(glyph_size * 0.40, -glyph_size * 0.42)

		glyph_position.x = clampf(glyph_position.x, map_rect.position.x + glyph_size, map_rect.end.x - glyph_size)
		glyph_position.y = clampf(glyph_position.y, map_rect.position.y + glyph_size, map_rect.end.y - glyph_size)

		_draw_warning_glyph(glyph_position, glyph_size, alpha)


func _draw_warning_glyph(center: Vector2, glyph_size: float, alpha: float) -> void:
	var color := congestion_color
	var top := center + Vector2(0.0, -glyph_size)
	var left := center + Vector2(-glyph_size * 0.88, glyph_size * 0.72)
	var right := center + Vector2(glyph_size * 0.88, glyph_size * 0.72)
	var points := PackedVector2Array([top, right, left])
	var glow_points := PackedVector2Array([
		center + (top - center) * 1.34,
		center + (right - center) * 1.34,
		center + (left - center) * 1.34,
	])

	_draw_solid_polygon(glow_points, _with_alpha(color, alpha * 0.075))
	_draw_solid_polygon(points, _with_alpha(Color("#190905"), alpha * 0.62))
	draw_polyline(_closed_polyline(points), _with_alpha(color, alpha * 0.90), 1.25, true)
	draw_polyline(_closed_polyline(points), _with_alpha(Color("#ffd18f"), alpha * 0.28), 0.55, true)
	draw_line(center + Vector2(0.0, -glyph_size * 0.42), center + Vector2(0.0, glyph_size * 0.20), _with_alpha(color, alpha), 1.15, true)
	draw_circle(center + Vector2(0.0, glyph_size * 0.43), maxf(1.0, glyph_size * 0.095), _with_alpha(Color("#ffe2b8"), alpha))


func _draw_import_export_routes(map_rect: Rect2) -> void:
	if import_export_route_opacity <= 0.0:
		return

	var font := get_theme_default_font()
	var candidates := []

	for region_id in _region_order:
		var region := _regions.get(region_id, {}) as Dictionary

		if not _region_is_trade_coastal(region):
			continue

		var balance := float(region.get("starting_energy_balance", 0.0))
		var route_type := ""
		var route_color := power_flow_color

		if balance < -0.05:
			route_type = "IMP"
			route_color = _mix_color(data_flow_color, Color("#f2ffff"), 0.34)
		elif balance >= 1.0:
			route_type = "EXP"
			route_color = _mix_color(power_flow_color, Color("#e8fff6"), 0.26)

		if route_type.is_empty():
			continue

		var amount := absf(balance)
		var score := amount + (1.6 if route_type == "IMP" else 0.0)
		candidates.append({
			"region_id": region_id,
			"region": region,
			"route_type": route_type,
			"amount": amount,
			"color": route_color,
			"score": score,
		})

	candidates.sort_custom(Callable(self, "_sort_trade_candidate_descending"))

	for index in range(mini(6, candidates.size())):
		var candidate := candidates[index] as Dictionary
		_draw_trade_route(
			str(candidate.get("region_id", "")),
			candidate.get("region", {}) as Dictionary,
			str(candidate.get("route_type", "")),
			float(candidate.get("amount", 0.0)),
			candidate.get("color", power_flow_color) as Color,
			map_rect,
			font
		)


func _sort_trade_candidate_descending(a: Variant, b: Variant) -> bool:
	var candidate_a := a as Dictionary
	var candidate_b := b as Dictionary
	return float(candidate_a.get("score", 0.0)) > float(candidate_b.get("score", 0.0))


func _draw_trade_route(region_id: String, region: Dictionary, route_type: String, amount: float, route_color: Color, map_rect: Rect2, font: Font) -> void:
	var center := _region_visual_position(region, map_rect)
	var anchor := _trade_route_anchor_for_point(center, map_rect)
	var direction := center - anchor

	if direction.length_squared() <= 1.0:
		return

	var normal := Vector2(-direction.y, direction.x).normalized()
	var route_seed := _hash_unit("trade:%s" % region_id)
	var midpoint := anchor.lerp(center, 0.48) + normal * (route_seed - 0.5) * 34.0
	var route_points := PackedVector2Array([anchor, midpoint, center])
	var alpha := import_export_route_opacity
	var label_position := anchor.lerp(center, 0.13)
	var arrow_direction := direction.normalized() if route_type == "IMP" else -direction.normalized()
	var arrow_position := anchor.lerp(center, 0.23)

	_draw_dashed_polyline(route_points, _with_alpha(Color("#d9eeef"), alpha * 0.48), 1.0, 8.0, 6.0)
	_draw_dashed_polyline(route_points, _with_alpha(route_color, alpha * 0.24), 2.2, 8.0, 6.0)
	_draw_trade_arrow(arrow_position, arrow_direction, route_color, alpha)

	if font == null:
		return

	var amount_text := "%.1f GW" % amount
	var label_text := "%s\n%s" % [route_type, amount_text]
	var label_width := 54.0
	var trade_label_font_size := 10
	var label_lines := label_text.split("\n", false)
	var label_start_y := label_position.y - float(label_lines.size() - 1) * float(trade_label_font_size + 1) * 0.5

	for index in range(label_lines.size()):
		var line := str(label_lines[index])
		var line_position := Vector2(label_position.x - label_width * 0.5, label_start_y + float(index) * float(trade_label_font_size + 1))
		draw_string(font, line_position + Vector2(1.0, 1.0), line, HORIZONTAL_ALIGNMENT_CENTER, label_width, trade_label_font_size, _with_alpha(Color("#031014"), alpha * 0.72))
		draw_string(font, line_position, line, HORIZONTAL_ALIGNMENT_CENTER, label_width, trade_label_font_size, _with_alpha(route_color, alpha * (0.92 if index == 0 else 0.72)))


func _draw_trade_arrow(arrow_center: Vector2, direction: Vector2, color: Color, alpha: float) -> void:
	if direction.length_squared() <= 0.001:
		return

	var arrow_direction := direction.normalized()
	var normal := Vector2(-arrow_direction.y, arrow_direction.x)
	var arrow_size := 7.5
	var points := PackedVector2Array([
		arrow_center + arrow_direction * arrow_size,
		arrow_center - arrow_direction * arrow_size * 0.58 + normal * arrow_size * 0.48,
		arrow_center - arrow_direction * arrow_size * 0.58 - normal * arrow_size * 0.48,
	])

	_draw_solid_polygon(points, _with_alpha(color, alpha * 0.26))
	draw_polyline(_closed_polyline(points), _with_alpha(color, alpha * 0.92), 0.95, true)


func _draw_selected_neighbor_halos(map_rect: Rect2) -> void:
	if selected_neighbor_halo_opacity <= 0.0 or selected_region_id.is_empty():
		return

	var has_backdrop := _backdrop_texture != null
	var pulse := 0.65 + 0.35 * sin(float(Time.get_ticks_msec()) / 680.0)
	var base_alpha := selected_neighbor_halo_opacity * (0.052 + pulse * 0.018 if has_backdrop else 0.11 + pulse * 0.03)
	var outline_alpha := selected_neighbor_halo_opacity * (0.22 + pulse * 0.08 if has_backdrop else 0.34 + pulse * 0.10)

	for region_id in _region_order:
		if region_id == selected_region_id or not _region_is_selected_neighbor(region_id):
			continue

		var region := _regions.get(region_id, {}) as Dictionary
		var neighbor_color := _mix_color(_region_signal_color(region), selection_color, 0.48)

		for points in _region_polygons(region_id, region, map_rect):
			_draw_solid_polygon(points, _with_alpha(neighbor_color, base_alpha))
			draw_polyline(_closed_polyline(points), _with_alpha(neighbor_color, outline_alpha), 0.9, true)


func _draw_congestion_routes(map_rect: Rect2) -> void:
	if congestion_route_opacity <= 0.0:
		return

	var route_candidates := []

	for edge in _edges:
		var edge_a := str(edge.get("a", ""))
		var edge_b := str(edge.get("b", ""))
		var deficit := maxf(_region_deficit(edge_a), _region_deficit(edge_b))

		if deficit <= 0.05:
			continue

		route_candidates.append({
			"edge": edge,
			"deficit": deficit,
			"selected": edge_a == selected_region_id or edge_b == selected_region_id,
		})

	route_candidates.sort_custom(Callable(self, "_sort_congestion_route_descending"))

	for index in range(mini(route_candidates.size(), 8)):
		var candidate := route_candidates[index] as Dictionary
		var edge := candidate.get("edge", {}) as Dictionary
		var deficit := float(candidate.get("deficit", 0.0))
		var is_selected_link := bool(candidate.get("selected", false))
		var points := _edge_points(edge, map_rect)
		var severity := clampf(deficit / 0.7, 0.35, 1.0)
		var alpha := congestion_route_opacity * (0.30 + severity * 0.34) * (1.18 if is_selected_link else 1.0)
		var width := 1.0 + severity * 0.45
		var color := _mix_color(congestion_color, Color("#ffd28d"), 0.22)

		_draw_dashed_polyline(points, _with_alpha(color, alpha * 0.28), width * 3.2, 9.0, 7.0)
		_draw_dashed_polyline(points, _with_alpha(color, alpha), width, 9.0, 7.0)


func _sort_congestion_route_descending(a: Variant, b: Variant) -> bool:
	var candidate_a := a as Dictionary
	var candidate_b := b as Dictionary
	var selected_a := 0.35 if bool(candidate_a.get("selected", false)) else 0.0
	var selected_b := 0.35 if bool(candidate_b.get("selected", false)) else 0.0
	return float(candidate_a.get("deficit", 0.0)) + selected_a > float(candidate_b.get("deficit", 0.0)) + selected_b


func _draw_map_traces(map_rect: Rect2) -> void:
	var has_backdrop := _backdrop_texture != null
	var base_opacity := map_trace_opacity * (0.68 if has_backdrop else 0.72)

	for edge in _edges:
		var edge_points := _edge_points(edge, map_rect)
		var edge_color := _edge_color(edge)
		var alpha_scale := 1.0
		var edge_a := str(edge.get("a", ""))
		var edge_b := str(edge.get("b", ""))
		var is_selected_link := selected_region_id == edge_a or selected_region_id == edge_b
		var color := _mix_color(edge_color, Color("#56deda"), 0.58)

		if is_selected_link:
			alpha_scale = 1.72
			color = _mix_color(edge_color, selection_color, 0.42)

		if _edge_is_subsea(edge):
			_draw_dashed_polyline(edge_points, _with_alpha(color, base_opacity * 0.30 * alpha_scale), 1.1, 7.0, 7.0)
		else:
			draw_polyline(edge_points, _with_alpha(color, base_opacity * 0.22 * alpha_scale), 3.8, true)
			draw_polyline(edge_points, _with_alpha(color, base_opacity * 0.52 * alpha_scale), 1.05, true)

		if show_map_trace_relays:
			_draw_map_trace_relays(edge_points, color, base_opacity * alpha_scale, has_backdrop, is_selected_link)

		if show_map_trace_pulses and is_selected_link:
			var pulse_seed := _hash_unit("%s:%s" % [edge_a, edge_b])
			var pulse_progress := fmod(float(Time.get_ticks_msec()) / 1850.0 + pulse_seed, 1.0)
			_draw_trace_pulse(edge_points, _with_alpha(color, map_trace_pulse_opacity * 0.45), pulse_progress, 0.105, 1.15)

	for region_id in _region_order:
		var region := _regions.get(region_id, {}) as Dictionary
		var center := _region_visual_position(region, map_rect)
		var marker_color := selection_color if region_id == selected_region_id else _region_signal_color(region)
		var marker_radius := maxf(2.6, minf(map_rect.size.x, map_rect.size.y) * 0.0044)
		var marker_alpha := map_trace_opacity * (0.58 if has_backdrop else 0.58)
		var is_selected_port: bool = region_id == selected_region_id
		var is_neighbor_port: bool = _region_is_selected_neighbor(region_id)

		if is_selected_port:
			marker_alpha *= 1.8
			marker_radius *= 1.25
		elif is_neighbor_port:
			marker_alpha *= 1.15

		_draw_region_network_port(center, marker_radius, marker_color, marker_alpha, is_selected_port, is_neighbor_port, has_backdrop)


func _draw_network(map_rect: Rect2) -> void:
	var has_backdrop := _backdrop_texture != null

	for edge in _edges:
		var edge_points := _edge_points(edge, map_rect)
		var color := _edge_color(edge)
		var is_dashed := _edge_is_subsea(edge)
		var outer_width := 5.0 if has_backdrop else 9.0
		var mid_width := 2.4 if has_backdrop else 4.0
		var core_width := 1.15 if has_backdrop else 1.7

		if is_dashed:
			_draw_dashed_polyline(edge_points, _with_alpha(color, 0.16 * network_opacity), outer_width, 9.0, 8.0)
			_draw_dashed_polyline(edge_points, _with_alpha(color, 0.78 * network_opacity), core_width, 9.0, 8.0)
		else:
			draw_polyline(edge_points, _with_alpha(color, 0.14 * network_opacity), outer_width, true)
			draw_polyline(edge_points, _with_alpha(color, 0.30 * network_opacity), mid_width, true)
			draw_polyline(edge_points, _with_alpha(color, 0.82 * network_opacity), core_width, true)

		if edge_points.size() >= 3:
			var midpoint := edge_points[1]
			draw_circle(midpoint, 3.2 if has_backdrop else 4.4, _with_alpha(color, 0.18 * network_opacity))
			draw_circle(midpoint, 1.5 if has_backdrop else 2.0, _with_alpha(color, 0.76 * network_opacity))


func _draw_region_network_port(center: Vector2, radius: float, color: Color, alpha: float, is_selected_port: bool, is_neighbor_port: bool, has_backdrop: bool) -> void:
	if region_port_opacity <= 0.0:
		return

	var port_alpha := alpha * region_port_opacity
	var plate_radius := radius * (2.18 if is_selected_port else 1.74)

	if is_neighbor_port:
		plate_radius *= 1.12
		port_alpha *= 1.10

	var plate_points := _regular_polygon_points(center, plate_radius, 8, PI * 0.125)
	var shadow_points := _offset_points(plate_points, Vector2(0.9, 1.2))

	draw_circle(center, plate_radius * 2.55, _with_alpha(color, port_alpha * (0.22 if is_selected_port else 0.13)))
	draw_circle(center, plate_radius * 1.20, _with_alpha(Color("#b8ffff"), port_alpha * 0.055))
	_draw_solid_polygon(shadow_points, _with_alpha(Color("#02080a"), 0.46 if has_backdrop else 0.65))
	_draw_solid_polygon(plate_points, _with_alpha(Color("#031417"), 0.62 if has_backdrop else 0.78))
	draw_polyline(_closed_polyline(plate_points), _with_alpha(color, port_alpha * 0.78), 1.05, true)
	draw_circle(center, radius * 0.98, _with_alpha(Color("#061417"), 0.70))
	draw_circle(center, radius * 0.82, _with_alpha(color, port_alpha * 0.90), false, 1.05, true)
	draw_circle(center, radius * 0.36, _with_alpha(Color("#f3ffff"), port_alpha * 0.96))

	if not is_selected_port and not is_neighbor_port:
		return

	var tick_radius := plate_radius * 1.34
	var tick_alpha := port_alpha * (0.74 if is_selected_port else 0.48)

	for index in range(4):
		var angle := PI * 0.25 + float(index) * PI * 0.5
		var direction := Vector2(cos(angle), sin(angle))
		var start := center + direction * tick_radius * 0.80
		var end := center + direction * tick_radius
		draw_line(start, end, _with_alpha(color, tick_alpha), 0.9, true)


func _draw_map_trace_relays(points: PackedVector2Array, color: Color, base_opacity: float, has_backdrop: bool, is_selected_link: bool) -> void:
	if points.size() < 2 or map_trace_relay_opacity <= 0.0:
		return

	var relay_alpha := base_opacity * map_trace_relay_opacity * (0.90 if has_backdrop else 1.0)
	var radius := 3.05 if has_backdrop else 3.7
	var ratios := [0.50]

	if is_selected_link:
		radius *= 1.22
		relay_alpha *= 1.20
		ratios = [0.34, 0.66]

	for ratio in ratios:
		var point := _polyline_point_at_ratio(points, ratio)
		draw_circle(point, radius * 3.1, _with_alpha(color, relay_alpha * 0.24))
		draw_circle(point, radius * 1.45, _with_alpha(Color("#031417"), relay_alpha * 0.72))
		draw_circle(point, radius * 1.25, _with_alpha(color, relay_alpha * 0.82), false, 1.0, true)
		draw_circle(point, radius * 0.42, _with_alpha(Color("#e9ffff"), relay_alpha))


func _draw_trace_pulse(points: PackedVector2Array, color: Color, progress: float, length_ratio: float, width: float) -> void:
	if points.size() < 2:
		return

	var total_length := _polyline_length(points)

	if total_length <= 0.0:
		return

	var pulse_length := clampf(length_ratio, 0.04, 0.65) * total_length
	var pulse_start := fposmod(progress, 1.0) * total_length
	var pulse_end := pulse_start + pulse_length

	_draw_polyline_span(points, pulse_start, minf(pulse_end, total_length), color, width)

	if pulse_end > total_length:
		_draw_polyline_span(points, 0.0, pulse_end - total_length, color, width)


func _draw_polyline_span(points: PackedVector2Array, span_start: float, span_end: float, color: Color, width: float) -> void:
	if span_end <= span_start:
		return

	var cursor := 0.0

	for index in range(points.size() - 1):
		var segment_start := points[index]
		var segment_end := points[index + 1]
		var segment_length := segment_start.distance_to(segment_end)

		if segment_length <= 0.0:
			continue

		var next_cursor := cursor + segment_length
		var local_start := maxf(span_start, cursor)
		var local_end := minf(span_end, next_cursor)

		if local_end > local_start:
			var t0 := (local_start - cursor) / segment_length
			var t1 := (local_end - cursor) / segment_length
			var start := segment_start.lerp(segment_end, t0)
			var end := segment_start.lerp(segment_end, t1)
			draw_line(start, end, _with_alpha(color, color.a * 0.35), width * 4.2, true)
			draw_line(start, end, color, width, true)

		cursor = next_cursor


func _draw_region_hubs(map_rect: Rect2) -> void:
	var has_backdrop := _backdrop_texture != null

	for region_id in _region_order:
		var region := _regions.get(region_id, {}) as Dictionary
		var center := _region_visual_position(region, map_rect)
		var marker_color := selection_color if region_id == selected_region_id else _region_signal_color(region)
		var marker_radius := maxf(4.0, minf(map_rect.size.x, map_rect.size.y) * 0.006)
		var alpha_scale := 0.52 if has_backdrop else 1.0

		if has_backdrop:
			marker_radius *= 0.72

		draw_circle(center, marker_radius * 3.4, _with_alpha(marker_color, 0.09 * alpha_scale))
		draw_circle(center, marker_radius * 1.85, _with_alpha(Color("#071318"), 0.72 if has_backdrop else 0.95))
		draw_circle(center, marker_radius * 1.85, _with_alpha(marker_color, 0.70 * alpha_scale), false, 1.4, true)
		draw_circle(center, marker_radius * 0.62, _with_alpha(Color("#ffffff"), 0.78 * alpha_scale))

		if has_backdrop:
			continue

		var tick_count := clampi(int(region.get("grid_potential", 3)), 2, 5)
		var tick_start := center + Vector2(-marker_radius * 1.8, marker_radius * 2.8)

		for tick in range(tick_count):
			var tick_rect := Rect2(tick_start + Vector2(float(tick) * marker_radius * 0.9, 0.0), Vector2(marker_radius * 0.45, marker_radius * 0.42))
			draw_rect(tick_rect, _with_alpha(marker_color, 0.72), true)


func _draw_region_labels(map_rect: Rect2) -> void:
	var font := get_theme_default_font()

	if font == null:
		return

	for region_id in _region_order:
		var region := _regions.get(region_id, {}) as Dictionary
		var center := _region_visual_position(region, map_rect)
		var radii := _region_radii(region, map_rect)
		var label := _label_for_region(region_id)
		var label_width := clampf(radii.x * 3.2, 72.0, 150.0)
		var label_position := center + Vector2(-label_width * 0.5, -radii.y * 1.08)
		var color := _with_alpha(Color("#d9e7e5"), 0.72)

		if region_id == selected_region_id:
			color = _with_alpha(Color("#eaffff"), 0.94)
		elif region_id == _hovered_region_id:
			color = _with_alpha(Color("#d9ffff"), 0.86)

		draw_string(font, label_position + Vector2(1.0, 1.0), label, HORIZONTAL_ALIGNMENT_CENTER, label_width, label_font_size, _with_alpha(Color("#02070a"), 0.88))
		draw_string(font, label_position, label, HORIZONTAL_ALIGNMENT_CENTER, label_width, label_font_size, color)


func _draw_geographic_labels(map_rect: Rect2) -> void:
	var font := get_theme_default_font()

	if font == null:
		return

	for label in SEA_LABELS:
		_draw_map_label(font, map_rect, label as Dictionary, Color("#5bcfe0"), 0.84)

	for label in GEOGRAPHIC_LABELS:
		var label_dictionary := label as Dictionary

		if _is_selected_region_duplicate_label(label_dictionary):
			continue

		_draw_map_label(font, map_rect, label_dictionary, Color("#e7f2ee"), 0.96)


func _is_selected_region_duplicate_label(label: Dictionary) -> bool:
	if selected_region_id.is_empty():
		return false

	var text := str(label.get("text", "")).replace("\n", " ").strip_edges().to_upper()
	return text == _label_for_region(selected_region_id)


func _draw_selected_region_label(map_rect: Rect2) -> void:
	if selected_region_id.is_empty() or not _regions.has(selected_region_id):
		return

	var font := get_theme_default_font()

	if font == null:
		return

	var region := _regions.get(selected_region_id, {}) as Dictionary
	var polygons := _region_polygons(selected_region_id, region, map_rect)

	if polygons.is_empty():
		return

	var bounds := _polygon_collection_bounds(polygons)
	var label := _label_for_region(selected_region_id)
	var font_size := maxi(label_font_size - 1, 10)
	var label_width := clampf(maxf(bounds.size.x * 1.16, 76.0), 76.0, 180.0)
	var label_position := Vector2(
		bounds.get_center().x - label_width * 0.5,
		clampf(bounds.position.y + bounds.size.y * 0.24, map_rect.position.y + 12.0, map_rect.end.y - float(font_size) * 1.5)
	)
	var plate_rect := Rect2(label_position + Vector2(3.0, -float(font_size) * 0.88), Vector2(label_width - 6.0, float(font_size) + 8.0))

	draw_rect(plate_rect.grow(2.0), _with_alpha(Color("#011013"), 0.42), true)
	draw_rect(Rect2(Vector2(plate_rect.position.x, plate_rect.end.y - 1.0), Vector2(plate_rect.size.x, 1.0)), _with_alpha(selection_color, 0.42), true)
	draw_string(font, label_position + Vector2(1.0, 1.0), label, HORIZONTAL_ALIGNMENT_CENTER, label_width, font_size, _with_alpha(Color("#001014"), 0.96))
	draw_string(font, label_position, label, HORIZONTAL_ALIGNMENT_CENTER, label_width, font_size, _with_alpha(Color("#e8ffff"), 0.90))


func _draw_map_label(font: Font, map_rect: Rect2, label: Dictionary, base_color: Color, alpha_scale: float) -> void:
	var text := str(label.get("text", ""))

	if text.strip_edges().is_empty():
		return

	var normalized_position: Vector2 = label.get("position", Vector2(0.5, 0.5))
	var center := _map_point(normalized_position, map_rect)
	var width := float(label.get("width", 108.0))
	var font_size := int(label.get("size", label_font_size))
	var alpha := float(label.get("alpha", 0.55)) * alpha_scale
	var lines := text.split("\n", false)
	var line_height := float(font_size + 1)
	var start_y := center.y - float(lines.size() - 1) * line_height * 0.5

	for index in range(lines.size()):
		var line := str(lines[index])
		var line_position := Vector2(center.x - width * 0.5, start_y + float(index) * line_height)
		draw_string(font, line_position + Vector2(1.0, 1.0), line, HORIZONTAL_ALIGNMENT_CENTER, width, font_size, _with_alpha(Color("#010507"), alpha * 0.70))
		draw_string(font, line_position, line, HORIZONTAL_ALIGNMENT_CENTER, width, font_size, _with_alpha(base_color, minf(alpha * 1.08, 1.0)))


func _draw_glass_reflection(map_rect: Rect2) -> void:
	if glass_reflection_opacity <= 0.0:
		return

	var alpha := glass_reflection_opacity
	var upper_band := PackedVector2Array([
		Vector2(map_rect.position.x + map_rect.size.x * 0.04, map_rect.position.y + map_rect.size.y * 0.08),
		Vector2(map_rect.position.x + map_rect.size.x * 0.56, map_rect.position.y + map_rect.size.y * 0.08),
		Vector2(map_rect.position.x + map_rect.size.x * 0.40, map_rect.position.y + map_rect.size.y * 0.22),
		Vector2(map_rect.position.x, map_rect.position.y + map_rect.size.y * 0.25),
	])
	var lower_band := PackedVector2Array([
		Vector2(map_rect.position.x + map_rect.size.x * 0.08, map_rect.position.y + map_rect.size.y * 0.62),
		Vector2(map_rect.position.x + map_rect.size.x * 0.72, map_rect.position.y + map_rect.size.y * 0.45),
		Vector2(map_rect.position.x + map_rect.size.x * 0.82, map_rect.position.y + map_rect.size.y * 0.56),
		Vector2(map_rect.position.x + map_rect.size.x * 0.18, map_rect.position.y + map_rect.size.y * 0.78),
	])

	_draw_solid_polygon(upper_band, _with_alpha(Color("#d9ffff"), 0.020 * alpha))
	_draw_solid_polygon(lower_band, _with_alpha(Color("#d9ffff"), 0.014 * alpha))
	draw_line(upper_band[0], upper_band[1], _with_alpha(Color("#b7ffff"), 0.032 * alpha), 1.0, true)
	draw_line(lower_band[0], lower_band[1], _with_alpha(Color("#b7ffff"), 0.020 * alpha), 1.0, true)


func _draw_panel_frame() -> void:
	var frame_rect := Rect2(Vector2.ZERO, size).grow(-1.0)
	_draw_frame_bezel(frame_rect)

	draw_rect(frame_rect, _with_alpha(Color("#2d464c"), 0.76), false, 1.5)
	draw_rect(frame_rect.grow(-4.0), _with_alpha(Color("#5be6f4"), 0.10), false, 1.0)
	draw_rect(frame_rect.grow(-9.0), _with_alpha(Color("#10272e"), 0.58), false, 1.0)

	if not show_screen_treatment:
		return

	_draw_frame_corner(frame_rect, Vector2(1.0, 1.0))
	_draw_frame_corner(frame_rect, Vector2(-1.0, 1.0))
	_draw_frame_corner(frame_rect, Vector2(1.0, -1.0))
	_draw_frame_corner(frame_rect, Vector2(-1.0, -1.0))

	for index in range(5):
		var x := frame_rect.position.x + 30.0 + float(index) * 22.0
		draw_line(Vector2(x, frame_rect.position.y + 7.0), Vector2(x + 10.0, frame_rect.position.y + 7.0), _with_alpha(Color("#5be6f4"), 0.11), 1.0)

	for index in range(5):
		var x := frame_rect.end.x - 40.0 - float(index) * 22.0
		draw_line(Vector2(x, frame_rect.end.y - 7.0), Vector2(x + 10.0, frame_rect.end.y - 7.0), _with_alpha(Color("#5be6f4"), 0.09), 1.0)


func _draw_frame_bezel(frame_rect: Rect2) -> void:
	var band_size := 14.0
	var dark := _with_alpha(Color("#02070a"), 0.46)
	var shade := _with_alpha(Color("#061116"), 0.36)
	var inner_line := _with_alpha(Color("#74edff"), 0.13)

	draw_rect(Rect2(frame_rect.position, Vector2(frame_rect.size.x, band_size)), dark, true)
	draw_rect(Rect2(Vector2(frame_rect.position.x, frame_rect.end.y - band_size), Vector2(frame_rect.size.x, band_size)), dark, true)
	draw_rect(Rect2(frame_rect.position, Vector2(band_size, frame_rect.size.y)), shade, true)
	draw_rect(Rect2(Vector2(frame_rect.end.x - band_size, frame_rect.position.y), Vector2(band_size, frame_rect.size.y)), shade, true)

	draw_line(frame_rect.position + Vector2(16.0, band_size), Vector2(frame_rect.end.x - 16.0, frame_rect.position.y + band_size), inner_line, 1.0, true)
	draw_line(Vector2(frame_rect.position.x + 16.0, frame_rect.end.y - band_size), frame_rect.end - Vector2(16.0, band_size), inner_line, 1.0, true)
	draw_line(frame_rect.position + Vector2(band_size, 16.0), Vector2(frame_rect.position.x + band_size, frame_rect.end.y - 16.0), inner_line, 1.0, true)
	draw_line(Vector2(frame_rect.end.x - band_size, frame_rect.position.y + 16.0), frame_rect.end - Vector2(band_size, 16.0), inner_line, 1.0, true)

	_draw_frame_plate(frame_rect, Vector2(1.0, 1.0))
	_draw_frame_plate(frame_rect, Vector2(-1.0, 1.0))
	_draw_frame_plate(frame_rect, Vector2(1.0, -1.0))
	_draw_frame_plate(frame_rect, Vector2(-1.0, -1.0))


func _draw_frame_plate(frame_rect: Rect2, direction: Vector2) -> void:
	var corner := Vector2(
		frame_rect.position.x if direction.x > 0.0 else frame_rect.end.x,
		frame_rect.position.y if direction.y > 0.0 else frame_rect.end.y
	)
	var sx := direction.x
	var sy := direction.y
	var points := PackedVector2Array([
		corner,
		corner + Vector2(54.0 * sx, 0.0),
		corner + Vector2(46.0 * sx, 8.0 * sy),
		corner + Vector2(12.0 * sx, 8.0 * sy),
		corner + Vector2(8.0 * sx, 46.0 * sy),
		corner + Vector2(0.0, 54.0 * sy),
	])
	var colors := PackedColorArray()

	for _index in range(points.size()):
		colors.append(_with_alpha(Color("#03090d"), 0.54))

	draw_polygon(points, colors)
	draw_polyline(_closed_polyline(points), _with_alpha(Color("#67eaff"), 0.13), 1.0, true)


func _draw_frame_corner(frame_rect: Rect2, direction: Vector2) -> void:
	var corner := Vector2(
		frame_rect.end.x if direction.x < 0.0 else frame_rect.position.x,
		frame_rect.end.y if direction.y < 0.0 else frame_rect.position.y
	)
	var inward_x := Vector2(28.0 * direction.x, 0.0)
	var inward_y := Vector2(0.0, 28.0 * direction.y)
	var short_x := Vector2(12.0 * direction.x, 0.0)
	var short_y := Vector2(0.0, 12.0 * direction.y)
	var color := _with_alpha(Color("#64f2ff"), 0.36)
	var glow := _with_alpha(Color("#64f2ff"), 0.10)

	draw_line(corner, corner + inward_x, glow, 4.0, true)
	draw_line(corner, corner + inward_y, glow, 4.0, true)
	draw_line(corner, corner + inward_x, color, 1.4, true)
	draw_line(corner, corner + inward_y, color, 1.4, true)
	draw_line(corner + inward_x + short_y, corner + inward_x + short_y + short_x, _with_alpha(Color("#64f2ff"), 0.17), 1.0, true)
	draw_line(corner + inward_y + short_x, corner + inward_y + short_x + short_y, _with_alpha(Color("#64f2ff"), 0.17), 1.0, true)


func _draw_sea_label(map_rect: Rect2, normalized_position: Vector2, text: String) -> void:
	var font := get_theme_default_font()

	if font == null:
		return

	var lines := text.split("\n", false)
	var center := _map_point(normalized_position, map_rect)
	var font_size := maxi(10, label_font_size - 1)
	var width := 120.0
	var start_y := center.y - float(lines.size() - 1) * float(font_size) * 0.5

	for index in range(lines.size()):
		var line := str(lines[index])
		var line_position := Vector2(center.x - width * 0.5, start_y + float(index) * float(font_size + 1))
		draw_string(font, line_position, line, HORIZONTAL_ALIGNMENT_CENTER, width, font_size, _with_alpha(Color("#58cbe1"), 0.30))


func _update_hovered_region(local_position: Vector2) -> void:
	var next_hovered_region_id := get_region_id_at(local_position)

	if next_hovered_region_id == _hovered_region_id:
		return

	_hovered_region_id = next_hovered_region_id
	tooltip_text = _get_region_display_name(_hovered_region_id) if not _hovered_region_id.is_empty() else ""

	if not _hovered_region_id.is_empty():
		region_hovered.emit(_hovered_region_id, _get_region_display_name(_hovered_region_id))

	queue_redraw()


func _region_polygons(region_id: String, region: Dictionary, map_rect: Rect2) -> Array[PackedVector2Array]:
	var polygons := _region_shape_polygons(region, map_rect)

	if not polygons.is_empty():
		return polygons

	var fallback_polygons: Array[PackedVector2Array] = []
	fallback_polygons.append(_fallback_region_polygon(region_id, region, map_rect))
	return fallback_polygons


func _fallback_region_polygon(region_id: String, region: Dictionary, map_rect: Rect2) -> PackedVector2Array:
	var center := _region_screen_position(region, map_rect)
	var radii := _region_radii(region, map_rect)
	var hash_seed := _hash_unit(region_id)
	var point_count := 18
	var points := PackedVector2Array()

	for index in range(point_count):
		var angle := -PI * 0.5 + TWO_PI * float(index) / float(point_count) + (hash_seed - 0.5) * 0.18
		var wave := 0.88 + 0.16 * sin(float(index) * 2.11 + hash_seed * TWO_PI)
		points.append(center + Vector2(cos(angle) * radii.x * wave, sin(angle) * radii.y * wave))

	return points


func _region_shape_polygons(region: Dictionary, map_rect: Rect2) -> Array[PackedVector2Array]:
	var polygons: Array[PackedVector2Array] = []
	var raw_polygons: Array = region.get("shapes", [])

	for raw_polygon in raw_polygons:
		if not (raw_polygon is PackedVector2Array):
			continue

		polygons.append(_scale_shape_points(raw_polygon, map_rect))

	return polygons


func _region_shape_points(region: Dictionary, map_rect: Rect2) -> PackedVector2Array:
	var raw_points: PackedVector2Array = region.get("shape", PackedVector2Array())
	return _scale_shape_points(raw_points, map_rect)


func _scale_shape_points(raw_points: PackedVector2Array, map_rect: Rect2) -> PackedVector2Array:
	var points := PackedVector2Array()

	for normalized_point in raw_points:
		points.append(_map_point(normalized_point + region_shape_offset, map_rect))

	return points


func _region_screen_position(region: Dictionary, map_rect: Rect2) -> Vector2:
	var normalized_position: Vector2 = region.get("position", Vector2(0.5, 0.5))
	return _map_point(normalized_position, map_rect)


func _region_visual_position(region: Dictionary, map_rect: Rect2) -> Vector2:
	var polygons := _region_shape_polygons(region, map_rect)

	if polygons.is_empty():
		return _region_screen_position(region, map_rect)

	return _polygon_collection_centroid(polygons)


func _region_radii(region: Dictionary, map_rect: Rect2) -> Vector2:
	var radius := float(region.get("hitbox_radius", 0.045)) * region_shape_scale
	return Vector2(
		maxf(22.0, radius * map_rect.size.x * 0.95),
		maxf(18.0, radius * map_rect.size.y * 0.72)
	)


func _region_hit_radius(region: Dictionary, map_rect: Rect2) -> float:
	var radii := _region_radii(region, map_rect)
	return maxf(radii.x, radii.y) * 1.12


func _region_fill_color(region: Dictionary) -> Color:
	var balance := float(region.get("starting_energy_balance", 0.0))
	var color := land_color

	if balance < -0.05:
		color = Color("#4a3525")
	elif _region_has_tag(region, "froid"):
		color = Color("#243d46")
	elif _region_has_tag(region, "sud") or _region_has_tag(region, "solaire"):
		color = Color("#3f3929")
	elif _region_has_tag(region, "littoral"):
		color = Color("#243f3c")
	elif _region_has_tag(region, "industriel"):
		color = Color("#333d3d")

	color.a = 0.30
	return color


func _region_status_wash_color(region: Dictionary) -> Color:
	var balance := float(region.get("starting_energy_balance", 0.0))
	var color := power_flow_color
	var alpha := 0.0

	if balance < -0.05:
		var deficit_weight := clampf(absf(balance) / 1.6, 0.0, 1.0)
		color = _mix_color(congestion_color, Color("#ffb24a"), 0.28)
		alpha = lerpf(0.055, 0.130, deficit_weight)
	elif balance > 0.05:
		var surplus_weight := clampf(balance / 3.0, 0.0, 1.0)
		color = _mix_color(power_flow_color, Color("#76ffd2"), 0.28)
		alpha = lerpf(0.038, 0.100, surplus_weight)
	elif float(region.get("starting_compute", 0.0)) > 0.0:
		color = data_flow_color
		alpha = 0.050

	if _region_has_tag(region, "froid"):
		color = _mix_color(color, cooling_flow_color, 0.22)
		alpha = maxf(alpha, 0.044)

	if alpha <= 0.0:
		return _with_alpha(color, 0.0)

	return _with_alpha(color, alpha * region_status_opacity)


func _region_signal_color(region: Dictionary) -> Color:
	var balance := float(region.get("starting_energy_balance", 0.0))

	if balance < -0.05:
		return congestion_color

	if float(region.get("starting_compute", 0.0)) > 0.0:
		return data_flow_color

	if int(region.get("cooling_potential", 0)) >= 5:
		return cooling_flow_color

	return power_flow_color


func _region_deficit(region_id: String) -> float:
	if region_id.is_empty() or not _regions.has(region_id):
		return 0.0

	var region := _regions.get(region_id, {}) as Dictionary
	return maxf(0.0, -float(region.get("starting_energy_balance", 0.0)))


func _region_has_tag(region: Dictionary, tag_name: String) -> bool:
	var tags = region.get("tags", PackedStringArray())

	for tag in tags:
		if str(tag).strip_edges() == tag_name:
			return true

	return false


func _region_is_trade_coastal(region: Dictionary) -> bool:
	var trade_tags := ["littoral", "atlantique", "mer_du_nord", "iles"]

	for tag_name in trade_tags:
		if _region_has_tag(region, tag_name):
			return true

	return false


func _edge_points(edge: Dictionary, map_rect: Rect2) -> PackedVector2Array:
	var region_a := _regions.get(edge.get("a", ""), {}) as Dictionary
	var region_b := _regions.get(edge.get("b", ""), {}) as Dictionary
	var start := _region_visual_position(region_a, map_rect)
	var end := _region_visual_position(region_b, map_rect)
	var direction := end - start
	var normal := Vector2(-direction.y, direction.x).normalized()
	var edge_hash := _hash_unit("%s:%s" % [edge.get("a", ""), edge.get("b", "")])
	var curvature := (edge_hash - 0.5) * minf(map_rect.size.x, map_rect.size.y) * 0.045
	var midpoint := start.lerp(end, 0.5) + normal * curvature

	return PackedVector2Array([start, midpoint, end])


func _edge_color(edge: Dictionary) -> Color:
	var region_a := _regions.get(edge.get("a", ""), {}) as Dictionary
	var region_b := _regions.get(edge.get("b", ""), {}) as Dictionary
	var balance_a := float(region_a.get("starting_energy_balance", 0.0))
	var balance_b := float(region_b.get("starting_energy_balance", 0.0))

	if balance_a < -0.05 or balance_b < -0.05:
		return congestion_color

	var bucket := absi(("%s%s" % [edge.get("a", ""), edge.get("b", "")]).hash()) % 4

	if bucket == 0:
		return data_flow_color
	if bucket == 1:
		return cooling_flow_color

	return power_flow_color


func _edge_is_subsea(edge: Dictionary) -> bool:
	var a := str(edge.get("a", ""))
	var b := str(edge.get("b", ""))
	var sea_regions := ["ie", "dk", "se_south", "se_north", "fi", "baltic_north", "baltic_south", "med_islands", "gr", "it_south_islands"]

	return sea_regions.has(a) and sea_regions.has(b)


func _region_is_selected_neighbor(region_id: String) -> bool:
	if selected_region_id.is_empty():
		return false

	for edge in _edges:
		var edge_a := str(edge.get("a", ""))
		var edge_b := str(edge.get("b", ""))

		if edge_a == selected_region_id and edge_b == region_id:
			return true

		if edge_b == selected_region_id and edge_a == region_id:
			return true

	return false


func _get_region_display_name(region_id: String) -> String:
	if region_id.is_empty() or not _regions.has(region_id):
		return ""

	var region := _regions.get(region_id, {}) as Dictionary
	return str(region.get("region_name", region.get("display_name", region_id)))


func _label_for_region(region_id: String) -> String:
	if LABEL_OVERRIDES.has(region_id):
		return LABEL_OVERRIDES[region_id]

	return _get_region_display_name(region_id).to_upper()


func _map_point(normalized_point: Vector2, map_rect: Rect2) -> Vector2:
	if _backdrop_texture != null:
		var texture_size := _backdrop_texture.get_size()
		var source_rect := _get_backdrop_source_rect(map_rect)

		if texture_size.x > 0.0 and texture_size.y > 0.0 and source_rect.size.x > 0.0 and source_rect.size.y > 0.0:
			var source_x := source_rect.position.x / texture_size.x
			var source_y := source_rect.position.y / texture_size.y
			var source_width := source_rect.size.x / texture_size.x
			var source_height := source_rect.size.y / texture_size.y
			var remapped := Vector2(
				(normalized_point.x - source_x) / source_width,
				(normalized_point.y - source_y) / source_height
			)

			return map_rect.position + Vector2(remapped.x * map_rect.size.x, remapped.y * map_rect.size.y)

	return map_rect.position + Vector2(normalized_point.x * map_rect.size.x, normalized_point.y * map_rect.size.y)


func _scale_points(normalized_points: Array, map_rect: Rect2) -> PackedVector2Array:
	var points := PackedVector2Array()

	for normalized_point in normalized_points:
		points.append(_map_point(normalized_point, map_rect))

	return points


func _offset_points(points: PackedVector2Array, offset: Vector2) -> PackedVector2Array:
	var offset_points := PackedVector2Array()

	for point in points:
		offset_points.append(point + offset)

	return offset_points


func _regular_polygon_points(center: Vector2, radius: float, point_count: int, angle_offset := 0.0) -> PackedVector2Array:
	var points := PackedVector2Array()
	var safe_point_count := maxi(point_count, 3)

	for index in range(safe_point_count):
		var angle := angle_offset + TWO_PI * float(index) / float(safe_point_count)
		points.append(center + Vector2(cos(angle), sin(angle)) * radius)

	return points


func _closed_polyline(points: PackedVector2Array) -> PackedVector2Array:
	var closed := PackedVector2Array()

	for point in points:
		closed.append(point)

	if points.size() > 0:
		closed.append(points[0])

	return closed


func _polyline_length(points: PackedVector2Array) -> float:
	var length := 0.0

	for index in range(points.size() - 1):
		length += points[index].distance_to(points[index + 1])

	return length


func _polyline_point_at_ratio(points: PackedVector2Array, ratio: float) -> Vector2:
	if points.is_empty():
		return Vector2.ZERO

	if points.size() == 1:
		return points[0]

	var total_length := _polyline_length(points)

	if total_length <= 0.0:
		return points[0]

	var target_distance := clampf(ratio, 0.0, 1.0) * total_length
	var walked_distance := 0.0

	for index in range(points.size() - 1):
		var start := points[index]
		var end := points[index + 1]
		var segment_length := start.distance_to(end)

		if segment_length <= 0.0:
			continue

		if walked_distance + segment_length >= target_distance:
			var local_ratio := (target_distance - walked_distance) / segment_length
			return start.lerp(end, local_ratio)

		walked_distance += segment_length

	return points[points.size() - 1]


func _trade_route_anchor_for_point(point: Vector2, map_rect: Rect2) -> Vector2:
	var map_center := map_rect.get_center()
	var direction := point - map_center

	if direction.length_squared() <= 0.001:
		direction = Vector2.RIGHT

	direction = direction.normalized()

	var inset := 18.0
	var min_x := map_rect.position.x + inset
	var max_x := map_rect.end.x - inset
	var min_y := map_rect.position.y + inset
	var max_y := map_rect.end.y - inset
	var distance_to_edge := INF

	if direction.x > 0.001:
		distance_to_edge = minf(distance_to_edge, (max_x - map_center.x) / direction.x)
	elif direction.x < -0.001:
		distance_to_edge = minf(distance_to_edge, (min_x - map_center.x) / direction.x)

	if direction.y > 0.001:
		distance_to_edge = minf(distance_to_edge, (max_y - map_center.y) / direction.y)
	elif direction.y < -0.001:
		distance_to_edge = minf(distance_to_edge, (min_y - map_center.y) / direction.y)

	if is_inf(distance_to_edge):
		return point

	return map_center + direction * maxf(distance_to_edge, 0.0)


func _polygon_extreme_points(points: PackedVector2Array, bounds: Rect2) -> Array[Vector2]:
	var anchors: Array[Vector2] = []

	if points.is_empty():
		return anchors

	var center := bounds.get_center()
	var directions := [
		Vector2(-1.0, -0.35).normalized(),
		Vector2(0.15, -1.0).normalized(),
		Vector2(1.0, -0.15).normalized(),
		Vector2(0.35, 1.0).normalized(),
		Vector2(-1.0, 0.35).normalized(),
	]
	var minimum_distance := maxf(8.0, minf(bounds.size.x, bounds.size.y) * 0.20)

	for direction in directions:
		var best_point := points[0]
		var best_score := -INF

		for point in points:
			var score := (point - center).dot(direction)

			if score > best_score:
				best_score = score
				best_point = point

		var is_duplicate := false

		for anchor in anchors:
			if anchor.distance_to(best_point) < minimum_distance:
				is_duplicate = true
				break

		if not is_duplicate:
			anchors.append(best_point)

	return anchors


func _polygon_bounds(points: PackedVector2Array) -> Rect2:
	if points.is_empty():
		return Rect2()

	var minimum := points[0]
	var maximum := points[0]

	for point in points:
		minimum.x = minf(minimum.x, point.x)
		minimum.y = minf(minimum.y, point.y)
		maximum.x = maxf(maximum.x, point.x)
		maximum.y = maxf(maximum.y, point.y)

	return Rect2(minimum, maximum - minimum)


func _polygon_collection_bounds(polygons: Array[PackedVector2Array]) -> Rect2:
	var has_point := false
	var minimum := Vector2.ZERO
	var maximum := Vector2.ZERO

	for polygon in polygons:
		for point in polygon:
			if not has_point:
				minimum = point
				maximum = point
				has_point = true
				continue

			minimum.x = minf(minimum.x, point.x)
			minimum.y = minf(minimum.y, point.y)
			maximum.x = maxf(maximum.x, point.x)
			maximum.y = maxf(maximum.y, point.y)

	if not has_point:
		return Rect2()

	return Rect2(minimum, maximum - minimum)


func _polygon_collection_centroid(polygons: Array[PackedVector2Array]) -> Vector2:
	var weighted_center := Vector2.ZERO
	var total_area := 0.0

	for polygon in polygons:
		var area := absf(_polygon_area(polygon))

		if area <= 0.01:
			continue

		weighted_center += _polygon_centroid(polygon) * area
		total_area += area

	if total_area > 0.0:
		return weighted_center / total_area

	var bounds := _polygon_collection_bounds(polygons)

	if bounds.size.x > 0.0 or bounds.size.y > 0.0:
		return bounds.get_center()

	return Vector2.ZERO


func _polygon_centroid(polygon: PackedVector2Array) -> Vector2:
	if polygon.size() < 3:
		return _polygon_average_point(polygon)

	var signed_area := 0.0
	var centroid := Vector2.ZERO
	var previous_index := polygon.size() - 1

	for current_index in range(polygon.size()):
		var current := polygon[current_index]
		var previous := polygon[previous_index]
		var cross := previous.x * current.y - current.x * previous.y
		signed_area += cross
		centroid += (previous + current) * cross
		previous_index = current_index

	if absf(signed_area) <= 0.01:
		return _polygon_average_point(polygon)

	return centroid / (3.0 * signed_area)


func _polygon_average_point(polygon: PackedVector2Array) -> Vector2:
	if polygon.is_empty():
		return Vector2.ZERO

	var total := Vector2.ZERO

	for point in polygon:
		total += point

	return total / float(polygon.size())


func _draw_solid_polygon(points: PackedVector2Array, color: Color) -> void:
	if points.size() < 3 or color.a <= 0.0:
		return

	var indices := Geometry2D.triangulate_polygon(points)

	if indices.size() < 3:
		return

	var triangle_colors := PackedColorArray([color, color, color])

	for index in range(0, indices.size() - 2, 3):
		var triangle := PackedVector2Array([
			points[indices[index]],
			points[indices[index + 1]],
			points[indices[index + 2]],
		])

		if absf(_polygon_area(triangle)) <= 1.0:
			continue

		if _triangle_has_short_edge(triangle, 0.35):
			continue

		draw_polygon(triangle, triangle_colors)


func _triangle_has_short_edge(triangle: PackedVector2Array, minimum_length: float) -> bool:
	if triangle.size() != 3:
		return true

	var minimum_length_squared := minimum_length * minimum_length

	return (
		triangle[0].distance_squared_to(triangle[1]) <= minimum_length_squared
		or triangle[1].distance_squared_to(triangle[2]) <= minimum_length_squared
		or triangle[2].distance_squared_to(triangle[0]) <= minimum_length_squared
	)


func _draw_dashed_polyline(points: PackedVector2Array, color: Color, width: float, dash_length: float, gap_length: float) -> void:
	if points.size() < 2:
		return

	for index in range(points.size() - 1):
		_draw_dashed_segment(points[index], points[index + 1], color, width, dash_length, gap_length)


func _draw_dashed_segment(start: Vector2, end: Vector2, color: Color, width: float, dash_length: float, gap_length: float) -> void:
	var length := start.distance_to(end)

	if length <= 0.0:
		return

	var direction := (end - start) / length
	var cursor := 0.0

	while cursor < length:
		var dash_end := minf(cursor + dash_length, length)
		draw_line(start + direction * cursor, start + direction * dash_end, color, width, true)
		cursor += dash_length + gap_length


func _point_in_polygon(point: Vector2, polygon: PackedVector2Array) -> bool:
	if polygon.size() < 3:
		return false

	var inside := false
	var previous_index := polygon.size() - 1

	for current_index in range(polygon.size()):
		var current := polygon[current_index]
		var previous := polygon[previous_index]
		var crosses_y := (current.y > point.y) != (previous.y > point.y)

		if crosses_y:
			var intersection_x := (previous.x - current.x) * (point.y - current.y) / (previous.y - current.y) + current.x

			if point.x < intersection_x:
				inside = not inside

		previous_index = current_index

	return inside


func _polygon_horizontal_intersections(points: PackedVector2Array, y: float) -> Array:
	var intersections := []

	if points.size() < 3:
		return intersections

	var previous := points[points.size() - 1]

	for current in points:
		var crosses_y := (current.y > y) != (previous.y > y)

		if crosses_y:
			var denominator := previous.y - current.y

			if absf(denominator) > 0.001:
				var intersection_x := (previous.x - current.x) * (y - current.y) / denominator + current.x
				intersections.append(intersection_x)

		previous = current

	intersections.sort()
	return intersections


func _polygon_area(polygon: PackedVector2Array) -> float:
	if polygon.size() < 3:
		return 0.0

	var area := 0.0
	var previous_index := polygon.size() - 1

	for current_index in range(polygon.size()):
		var current := polygon[current_index]
		var previous := polygon[previous_index]
		area += previous.x * current.y - current.x * previous.y
		previous_index = current_index

	return area * 0.5


func _with_alpha(color: Color, alpha: float) -> Color:
	var output := color
	output.a = alpha
	return output


func _mix_color(a: Color, b: Color, weight: float) -> Color:
	return Color(
		lerpf(a.r, b.r, weight),
		lerpf(a.g, b.g, weight),
		lerpf(a.b, b.b, weight),
		lerpf(a.a, b.a, weight)
	)


func _hash_unit(value: String) -> float:
	return float(absi(value.hash()) % 100000) / 100000.0


func _fract(value: float) -> float:
	return value - floor(value)
