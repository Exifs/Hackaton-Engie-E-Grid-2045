extends RefCounted
class_name EGridMapDataSource


static func load_map_data(region_layout_path: String, regions_path: String, network_edges_path: String, region_shapes_path := "") -> Dictionary:
	var layout_data := _load_region_layout(region_layout_path)
	var regions: Dictionary = layout_data.get("regions", {})
	var region_order: Array = layout_data.get("region_order", [])

	_merge_region_stats(regions, regions_path)
	_merge_region_shapes(regions, region_shapes_path)

	return {
		"regions": regions,
		"region_order": region_order,
		"edges": _load_network_edges(network_edges_path, regions),
	}


static func _load_region_layout(path: String) -> Dictionary:
	var regions := {}
	var region_order := []
	var rows := _read_csv_rows(path)

	for row in rows:
		var region_id := _text(row, "region_id")

		if region_id.is_empty():
			continue

		regions[region_id] = {
			"id": region_id,
			"display_name": _text(row, "display_name", region_id),
			"position": Vector2(_float(row, "x", 0.5), _float(row, "y", 0.5)),
			"hitbox_radius": _float(row, "hitbox_radius", 0.045),
			"slot_anchor": Vector2(_float(row, "slot_anchor_dx", 0.0), _float(row, "slot_anchor_dy", 0.045)),
			"slot_grid_cols": _int(row, "slot_grid_cols", 4),
			"slot_grid_rows": _int(row, "slot_grid_rows", 4),
			"slot_spacing": _float(row, "slot_spacing", 0.014),
		}
		region_order.append(region_id)

	return {
		"regions": regions,
		"region_order": region_order,
	}


static func _merge_region_stats(regions: Dictionary, path: String) -> void:
	var rows := _read_csv_rows(path)

	for row in rows:
		var region_id := _text(row, "region_id")

		if not regions.has(region_id):
			continue

		var region := regions[region_id] as Dictionary
		var tags := _text(row, "tags").split(";", false)

		region["region_name"] = _text(row, "region_name", region.get("display_name", region_id))
		region["tags"] = tags
		region["slots_total"] = _int(row, "slots_total", 0)
		region["cooling_potential"] = _int(row, "cooling_potential", 0)
		region["solar_potential"] = _int(row, "solar_potential", 0)
		region["wind_onshore_potential"] = _int(row, "wind_onshore_potential", 0)
		region["wind_offshore_potential"] = _int(row, "wind_offshore_potential", 0)
		region["hydro_potential"] = _int(row, "hydro_potential", 0)
		region["nuclear_potential"] = _int(row, "nuclear_potential", 0)
		region["grid_potential"] = _int(row, "grid_potential", 0)
		region["research_potential"] = _int(row, "research_potential", 0)
		region["base_energy_demand"] = _float(row, "base_energy_demand", 0.0)
		region["starting_energy_generation"] = _float(row, "starting_energy_generation", 0.0)
		region["starting_energy_balance"] = _float(row, "starting_energy_balance", 0.0)
		region["starting_cooling_capacity"] = _float(row, "starting_cooling_capacity", 0.0)
		region["starting_compute"] = _float(row, "starting_compute", 0.0)
		region["starting_researchers"] = _float(row, "starting_researchers", 0.0)
		region["starting_slots_used"] = _int(row, "starting_slots_used", 0)


static func _merge_region_shapes(regions: Dictionary, path: String) -> void:
	if path.strip_edges().is_empty() or not FileAccess.file_exists(path):
		return

	var source := FileAccess.get_file_as_string(path)
	var parsed: Variant = JSON.parse_string(source)

	if not (parsed is Dictionary):
		push_warning("Map region shape file is invalid: %s" % path)
		return

	var shape_regions: Variant = (parsed as Dictionary).get("regions", {})

	if not (shape_regions is Dictionary):
		return

	for region_id in shape_regions.keys():
		if not regions.has(region_id):
			continue

		var raw_shape_entry: Variant = shape_regions[region_id]
		var polygons := _parse_region_shape_polygons(raw_shape_entry)

		if not polygons.is_empty():
			var region := regions[region_id] as Dictionary
			region["shapes"] = polygons
			region["shape"] = polygons[0]


static func _parse_region_shape_polygons(raw_shape_entry: Variant) -> Array[PackedVector2Array]:
	var polygons: Array[PackedVector2Array] = []

	if raw_shape_entry is Dictionary:
		var shape_dict := raw_shape_entry as Dictionary
		var raw_polygons: Variant = shape_dict.get("polygons", [])

		if raw_polygons is Array:
			return _parse_polygon_collection(raw_polygons)

		var raw_shape: Variant = shape_dict.get("shape", [])

		if raw_shape is Array:
			var points := _parse_shape_points(raw_shape)

			if points.size() >= 3:
				polygons.append(points)

		return polygons

	if raw_shape_entry is Array:
		var raw_array := raw_shape_entry as Array

		if _looks_like_point_list(raw_array):
			var points := _parse_shape_points(raw_array)

			if points.size() >= 3:
				polygons.append(points)

			return polygons

		return _parse_polygon_collection(raw_array)

	return polygons


static func _parse_polygon_collection(raw_polygons: Variant) -> Array[PackedVector2Array]:
	var polygons: Array[PackedVector2Array] = []

	if not (raw_polygons is Array):
		return polygons

	for raw_polygon in raw_polygons:
		var points := _parse_shape_points(raw_polygon)

		if points.size() >= 3:
			polygons.append(points)

	return polygons


static func _parse_shape_points(raw_points: Variant) -> PackedVector2Array:
	var points := PackedVector2Array()

	if not (raw_points is Array):
		return points

	for raw_point in raw_points:
		if not _is_point_array(raw_point):
			continue

		var point_array := raw_point as Array
		points.append(Vector2(float(point_array[0]), float(point_array[1])))

	return points


static func _looks_like_point_list(raw_array: Array) -> bool:
	if raw_array.is_empty():
		return false

	return _is_point_array(raw_array[0])


static func _is_point_array(raw_point: Variant) -> bool:
	if not (raw_point is Array):
		return false

	var point_array := raw_point as Array

	if point_array.size() < 2:
		return false

	return _is_number(point_array[0]) and _is_number(point_array[1])


static func _is_number(value: Variant) -> bool:
	var value_type := typeof(value)
	return value_type == TYPE_FLOAT or value_type == TYPE_INT


static func _load_network_edges(path: String, regions: Dictionary) -> Array:
	var edges := []
	var rows := _read_csv_rows(path)

	for row in rows:
		var region_a := _text(row, "region_a_id")
		var region_b := _text(row, "region_b_id")

		if not regions.has(region_a) or not regions.has(region_b):
			continue

		edges.append({
			"a": region_a,
			"b": region_b,
			"distance": _float(row, "distance", 1.0),
			"connection_type": _text(row, "connection_type", "abstract_grid_or_geographic"),
		})

	return edges


static func _read_csv_rows(path: String) -> Array:
	var rows := []

	if path.strip_edges().is_empty():
		push_warning("Map data path is empty.")
		return rows

	if not FileAccess.file_exists(path):
		push_warning("Map data file not found: %s" % path)
		return rows

	var file := FileAccess.open(path, FileAccess.READ)

	if file == null:
		push_error("Could not open map data file %s. Error code: %d" % [path, FileAccess.get_open_error()])
		return rows

	var headers := PackedStringArray()

	while not file.eof_reached():
		var candidate_headers := file.get_csv_line()

		if _is_empty_csv_line(candidate_headers):
			continue

		headers = candidate_headers
		break

	if headers.size() == 0:
		return rows

	while not file.eof_reached():
		var values := file.get_csv_line()

		if _is_empty_csv_line(values):
			continue

		var row := {}
		var field_count := mini(headers.size(), values.size())

		for index in range(field_count):
			row[str(headers[index])] = str(values[index])

		rows.append(row)

	return rows


static func _is_empty_csv_line(values: PackedStringArray) -> bool:
	if values.size() == 0:
		return true

	if values.size() == 1 and str(values[0]).strip_edges().is_empty():
		return true

	return false


static func _text(row: Dictionary, field_name: String, fallback := "") -> String:
	return str(row.get(field_name, fallback)).strip_edges()


static func _float(row: Dictionary, field_name: String, fallback := 0.0) -> float:
	var value := _text(row, field_name)

	if value.is_empty():
		return fallback

	return value.to_float()


static func _int(row: Dictionary, field_name: String, fallback := 0) -> int:
	var value := _text(row, field_name)

	if value.is_empty():
		return fallback

	return value.to_int()
