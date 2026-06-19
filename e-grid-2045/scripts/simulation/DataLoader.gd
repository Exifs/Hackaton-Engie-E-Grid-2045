extends RefCounted
class_name EGridDataLoader

const EXPORT_DIAGNOSTICS := preload("res://scripts/debug/EGridExportDiagnostics.gd")
const DATA_ROOT := "res://data/"

static var _game_data_cache: Dictionary = {}


static func clear_cache_for_tests() -> void:
	_game_data_cache.clear()


func load_game_data() -> Dictionary:
	if not _game_data_cache.is_empty():
		return _game_data_cache.duplicate(true)

	var constants: Dictionary = _load_constants()
	var data := {
		"constants": constants,
		"regions": _load_regions(),
		"buildings": _load_buildings(),
		"network_graph": _load_json("network_graph.json", {}),
		"region_layout": _load_region_layout(),
		"technologies": _load_technologies(),
		"events": _load_events(),
		"co2_tiers": _load_co2_tiers(),
		"distance_efficiency": _load_distance_efficiency(),
		"volume_efficiency_tiers": _load_volume_efficiency_tiers(),
	}
	EXPORT_DIAGNOSTICS.log_data_snapshot(data)
	_game_data_cache = data.duplicate(true)
	return _game_data_cache.duplicate(true)


func _load_constants() -> Dictionary:
	var raw: Dictionary = _load_json("balance_constants.json", {})
	var constants := {
		"starting_money": _number(raw.get("starting_money", 1000.0), 1000.0),
		"starting_year": int(_number(raw.get("starting_year", raw.get("start_year", 2025)), 2025.0)),
		"ending_year": int(_number(raw.get("ending_year", raw.get("end_year", 2045)), 2045.0)),
		"tick_duration_months": int(_number(raw.get("tick_duration_months", 1), 1.0)),
		"starting_monthly_income": _number(raw.get("starting_monthly_income", raw.get("base_monthly_income", 80.0)), 80.0),
		"base_research_monthly": _number(raw.get("base_research_monthly", raw.get("base_agi_gain_monthly_pct", 0.35)), 0.35),
		"compute_optimal_start": _number(raw.get("compute_optimal_start", 100.0), 100.0),
		"compute_optimal_end": _number(raw.get("compute_optimal_end", 400.0), 400.0),
		"regional_distance_cap": int(_number(raw.get("regional_distance_cap", 5), 5.0)),
		"population_units_total": _number(raw.get("population_units_total", 45.0), 45.0),
		"income_per_population_unit": _number(raw.get("income_per_population_unit", 2.0), 2.0),
		"income_per_agi_percent": _number(raw.get("income_per_agi_percent", 3.0), 3.0),
		"income_energy_efficiency_tech_bonus": _number(raw.get("income_energy_efficiency_tech_bonus", 30.0), 30.0),
		"blackout_light_income_penalty": absf(_number(raw.get("blackout_light_income_penalty", -20.0), -20.0)),
		"blackout_severe_income_penalty": absf(_number(raw.get("blackout_severe_income_penalty", -60.0), -60.0)),
		"co2_moderate_income_penalty": absf(_number(raw.get("co2_moderate_income_penalty", -10.0), -10.0)),
		"co2_elevated_income_penalty": absf(_number(raw.get("co2_elevated_income_penalty", -30.0), -30.0)),
		"co2_critical_income_penalty": absf(_number(raw.get("co2_critical_income_penalty", -80.0), -80.0)),
		"construction_cancel_refund_min_pct": _number(raw.get("construction_cancel_refund_min_pct", 50.0), 50.0) / 100.0,
		"construction_cancel_refund_max_pct": _number(raw.get("construction_cancel_refund_max_pct", 75.0), 75.0) / 100.0,
		"supergrid_distance_bonus": 0.15,
		"supergrid_volume_threshold_bonus": 0.25,
	}
	return constants


func _load_regions() -> Dictionary:
	var regions := {}
	for row in _load_csv_rows("regions.csv"):
		var region_id := str(row.get("region_id", "")).strip_edges()
		if region_id.is_empty():
			continue

		var tags := _split_list(row.get("tags", ""))
		regions[region_id] = {
			"id": region_id,
			"display_name": str(row.get("region_name", region_id)),
			"slots_max": int(_number(row.get("slots_total", 12), 12.0)),
			"tags": tags,
			"potential_cooling": _number(row.get("cooling_potential", 1), 1.0),
			"potential_solar": _number(row.get("solar_potential", 1), 1.0),
			"potential_wind_onshore": _number(row.get("wind_onshore_potential", 1), 1.0),
			"potential_wind_offshore": _number(row.get("wind_offshore_potential", 0), 0.0),
			"potential_hydro": _number(row.get("hydro_potential", 0), 0.0),
			"potential_nuclear": _number(row.get("nuclear_potential", 0), 0.0),
			"potential_grid": _number(row.get("grid_potential", 1), 1.0),
			"potential_research": _number(row.get("research_potential", 1), 1.0),
			"population_units": _number(row.get("population_units_2025", 0), 0.0),
			"base_energy_demand": _number(row.get("base_energy_demand", 0), 0.0),
			"starting_energy_generation": _number(row.get("starting_energy_generation", 0), 0.0),
			"starting_cooling_capacity": _number(row.get("starting_cooling_capacity", 0), 0.0),
			"starting_compute": _number(row.get("starting_compute", 0), 0.0),
			"starting_researchers": _number(row.get("starting_researchers", 0), 0.0),
			"starting_co2_pressure_per_month": _number(row.get("starting_co2_pressure_per_month", 0), 0.0),
			"buildings": [],
			"construction_queue": [],
			"cached": {},
		}
	return regions


func _load_buildings() -> Dictionary:
	var buildings := {}
	for row in _load_csv_rows("buildings.csv"):
		var building_id := str(row.get("building_id", "")).strip_edges()
		if building_id.is_empty():
			continue

		var category := str(row.get("category", "misc"))
		if category == "storage":
			category = "grid"

		buildings[building_id] = {
			"id": building_id,
			"display_name": str(row.get("display_name", building_id)),
			"category": category,
			"slots_required": int(_number(row.get("slots", 1), 1.0)),
			"cost": int(_number(row.get("cost", 0), 0.0)),
			"construction_months": int(_number(row.get("construction_months", 1), 1.0)),
			"produces_energy": maxf(_number(row.get("energy_delta", 0), 0.0), 0.0),
			"produces_cooling": maxf(_number(row.get("cooling_delta", 0), 0.0), 0.0),
			"produces_researchers": _number(row.get("output_amount", 0), 0.0) if str(row.get("output_resource", "")) == "researchers" else 0.0,
			"produces_compute": maxf(_number(row.get("compute_delta", 0), 0.0), 0.0),
			"produces_storage": maxf(_number(row.get("storage_delta", 0), 0.0), 0.0),
			"consumes_energy": _number(row.get("consumes_energy", 0), 0.0),
			"consumes_cooling": _number(row.get("consumes_cooling", 0), 0.0),
			"consumes_compute": _number(row.get("consumes_compute", 0), 0.0),
			"researchers_required": _number(row.get("required_researchers", 0), 0.0),
			"co2_monthly": _number(row.get("co2_per_month", 0), 0.0),
			"variable_output": not str(row.get("variation_profile", "")).strip_edges().is_empty(),
			"variation_profile": str(row.get("variation_profile", "")).strip_edges(),
			"availability": str(row.get("availability", "available_2025")),
			"unlock_technology": str(row.get("unlock_technology", "")).strip_edges(),
			"required_tags": _split_list(row.get("required_region_tag_any", "")),
			"required_potential": str(row.get("required_potential_key", "")).strip_edges(),
			"required_potential_min": _number(row.get("required_potential_min", 0), 0.0),
			"scaling_potential": str(row.get("scaling_potential_key", "")).strip_edges(),
			"icon_key": _icon_key_for_building(building_id, category),
			"description": str(row.get("notes", "")),
		}
	return buildings


func _load_region_layout() -> Dictionary:
	var parsed: Dictionary = _load_json("region_layout.json", {})
	var regions: Variant = parsed.get("regions", {})
	if typeof(regions) == TYPE_DICTIONARY and not regions.is_empty():
		return regions

	var layout := {}
	for row in _load_csv_rows("region_layout.csv"):
		var region_id := str(row.get("region_id", "")).strip_edges()
		if region_id.is_empty():
			continue
		layout[region_id] = {
			"display_name": str(row.get("display_name", region_id)),
			"x": _number(row.get("x", 0.5), 0.5),
			"y": _number(row.get("y", 0.5), 0.5),
			"hitbox_radius": _number(row.get("hitbox_radius", 0.04), 0.04),
			"slot_anchor_dx": _number(row.get("slot_anchor_dx", 0), 0.0),
			"slot_anchor_dy": _number(row.get("slot_anchor_dy", 0.045), 0.045),
			"slot_grid_cols": int(_number(row.get("slot_grid_cols", 4), 4.0)),
			"slot_grid_rows": int(_number(row.get("slot_grid_rows", 4), 4.0)),
			"slot_spacing": _number(row.get("slot_spacing", 0.014), 0.014),
		}
	return layout


func _load_technologies() -> Dictionary:
	var technologies := {}
	for row in _load_csv_rows("technologies.csv"):
		var technology_id := str(row.get("technology_id", "")).strip_edges()
		if technology_id.is_empty():
			continue
		technologies[technology_id] = {
			"id": technology_id,
			"display_name": str(row.get("display_name", technology_id)),
			"branch": str(row.get("branch", "")),
			"tier": int(_number(row.get("tier", 1), 1.0)),
			"cost": _number(row.get("cost", 0), 0.0),
			"research_months": int(_number(row.get("research_months", 1), 1.0)),
			"prereq_technology_ids": _split_list(row.get("prereq_technology_ids", "")),
			"unlocks": _split_list(row.get("unlocks", "")),
			"effect_key": str(row.get("effect_key", "")),
			"effect_value": str(row.get("effect_value", "")),
			"effect_value_pct": _number(row.get("effect_value_pct", 0), 0.0),
			"notes": str(row.get("notes", "")),
		}
	return technologies


func _load_events() -> Dictionary:
	var events := {}
	for row in _load_csv_rows("events.csv"):
		var event_id := str(row.get("event_id", "")).strip_edges()
		if event_id.is_empty():
			continue
		events[event_id] = row
	return events


func _load_co2_tiers() -> Array:
	var tiers := []
	for row in _load_csv_rows("co2_tiers.csv"):
		tiers.append({
			"id": str(row.get("tier_id", "low")),
			"min": _number(row.get("min_cumulative_co2", 0), 0.0),
			"max": _number_or_inf(row.get("max_cumulative_co2", "")),
			"income_penalty": absf(_number(row.get("income_penalty", 0), 0.0)),
			"cooling_demand_pct": _number(row.get("cooling_demand_pct", 0), 0.0),
		})
	return tiers


func _load_distance_efficiency() -> Dictionary:
	var values := {}
	for row in _load_csv_rows("network_distance_efficiency.csv"):
		var distance := int(_number(row.get("distance", 0), 0.0))
		values[distance] = _number(row.get("distance_efficiency", 1), 1.0)
	return values if not values.is_empty() else {0: 1.0, 1: 0.92, 2: 0.84, 3: 0.72, 4: 0.58, 5: 0.4}


func _load_volume_efficiency_tiers() -> Array:
	var tiers := []
	for row in _load_csv_rows("network_volume_efficiency.csv"):
		tiers.append({
			"id": str(row.get("tier_id", "")),
			"min_energy_sent": _number(row.get("min_energy_sent", 0), 0.0),
			"max_energy_sent": _number_or_inf(row.get("max_energy_sent", "")),
			"max_after_supergrid": _number_or_inf(row.get("max_after_supergrid", "")),
			"volume_efficiency": _number(row.get("volume_efficiency", 1), 1.0),
		})
	if tiers.is_empty():
		tiers = [
			{"min_energy_sent": 0.0, "max_energy_sent": 50.0, "max_after_supergrid": 62.0, "volume_efficiency": 1.0},
			{"min_energy_sent": 51.0, "max_energy_sent": 100.0, "max_after_supergrid": 125.0, "volume_efficiency": 0.9},
			{"min_energy_sent": 101.0, "max_energy_sent": 200.0, "max_after_supergrid": 250.0, "volume_efficiency": 0.75},
			{"min_energy_sent": 201.0, "max_energy_sent": 400.0, "max_after_supergrid": 500.0, "volume_efficiency": 0.55},
			{"min_energy_sent": 401.0, "max_energy_sent": INF, "max_after_supergrid": INF, "volume_efficiency": 0.35},
		]
	return tiers


func _load_json(file_name: String, fallback: Variant) -> Variant:
	var path := DATA_ROOT + file_name
	if not FileAccess.file_exists(path):
		return fallback

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return fallback

	var parsed = JSON.parse_string(file.get_as_text())
	return parsed if parsed != null else fallback


func _load_csv_rows(file_name: String) -> Array:
	var rows := []
	var path := DATA_ROOT + file_name
	if not FileAccess.file_exists(path):
		return rows

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return rows

	var headers := file.get_csv_line()
	while not file.eof_reached():
		var values := file.get_csv_line()
		if values.size() == 0 or (values.size() == 1 and str(values[0]).strip_edges().is_empty()):
			continue

		var row := {}
		for index in range(headers.size()):
			var key := str(headers[index]).strip_edges()
			if key.is_empty():
				continue
			row[key] = str(values[index]).strip_edges() if index < values.size() else ""
		rows.append(row)
	return rows


func _split_list(raw_value: Variant) -> Array:
	var text := str(raw_value).strip_edges()
	if text.is_empty():
		return []

	var values := []
	for item in text.split(";", false):
		var value := str(item).strip_edges()
		if not value.is_empty():
			values.append(value)
	return values


func _number(raw_value: Variant, fallback: float) -> float:
	if raw_value == null:
		return fallback

	var text := str(raw_value).strip_edges()
	if text.is_empty():
		return fallback

	if text.is_valid_float() or text.is_valid_int():
		return text.to_float()
	return fallback


func _number_or_inf(raw_value: Variant) -> float:
	var text := str(raw_value).strip_edges()
	if text.is_empty():
		return INF
	return _number(text, INF)


func _icon_key_for_building(building_id: String, category: String) -> String:
	if building_id.contains("wind"):
		return "energy"
	if building_id.contains("solar"):
		return "energy"
	if building_id.contains("battery"):
		return "battery"
	if building_id.contains("cooling"):
		return "cooling"
	if building_id.contains("datacenter"):
		return "datacenter"
	if building_id.contains("research") or building_id.contains("university"):
		return "science"
	if category == "grid":
		return "grid"
	return category
