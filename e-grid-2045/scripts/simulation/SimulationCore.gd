extends Node
class_name EGridSimulationCore

signal month_advanced(year: int, month: int)
signal region_updated(region_id: String)
signal resources_updated(summary: Dictionary)
signal construction_started(region_id: String, building_id: String)
signal construction_completed(region_id: String, building_id: String)
signal selected_region_changed(region_id: String)
signal alerts_updated(alerts: Array)
signal game_ended(result: String, score: Dictionary)

const DATA_LOADER := preload("res://scripts/simulation/DataLoader.gd")
const GAME_STATE := preload("res://scripts/simulation/GameState.gd")
const REGION_SYSTEM := preload("res://scripts/simulation/RegionSystem.gd")
const BUILDING_SYSTEM := preload("res://scripts/simulation/BuildingSystem.gd")
const ENERGY_NETWORK_SYSTEM := preload("res://scripts/simulation/EnergyNetworkSystem.gd")
const COOLING_SYSTEM := preload("res://scripts/simulation/CoolingSystem.gd")
const RESEARCH_SYSTEM := preload("res://scripts/simulation/ResearchSystem.gd")
const ECONOMY_SYSTEM := preload("res://scripts/simulation/EconomySystem.gd")
const EVENT_SYSTEM := preload("res://scripts/simulation/EventSystem.gd")
const SCORING_SYSTEM := preload("res://scripts/simulation/ScoringSystem.gd")

const MAX_MONTHS_PER_FRAME := 2

@export_range(0.2, 10.0, 0.1) var seconds_per_month := 1.6

var state = GAME_STATE.new()
var game_data := {}
var constants := {}
var regions := {}
var building_definitions := {}
var region_layout := {}
var technologies := {}
var events := {}
var co2_tiers := []

var _loader = DATA_LOADER.new()
var _region_system = REGION_SYSTEM.new()
var _building_system = BUILDING_SYSTEM.new()
var _energy_network = ENERGY_NETWORK_SYSTEM.new()
var _cooling_system = COOLING_SYSTEM.new()
var _research_system = RESEARCH_SYSTEM.new()
var _economy_system = ECONOMY_SYSTEM.new()
var _event_system = EVENT_SYSTEM.new()
var _scoring_system = SCORING_SYSTEM.new()
var _tick_accumulator := 0.0


func _process(delta: float) -> void:
	if state.paused or state.game_result != "":
		return

	_tick_accumulator += delta * maxf(state.simulation_speed, 0.0)
	var advanced_months := 0
	while _tick_accumulator >= seconds_per_month and advanced_months < MAX_MONTHS_PER_FRAME:
		_tick_accumulator -= seconds_per_month
		advanced_months += 1
		advance_month()
	if _tick_accumulator >= seconds_per_month:
		_tick_accumulator = fposmod(_tick_accumulator, seconds_per_month)


func new_game() -> void:
	game_data = _loader.load_game_data()
	constants = (game_data.get("constants", {}) as Dictionary).duplicate(true)
	constants["distance_efficiency"] = game_data.get("distance_efficiency", {})
	constants["volume_efficiency_tiers"] = game_data.get("volume_efficiency_tiers", [])
	regions = _region_system.clone_regions(game_data.get("regions", {}), game_data.get("region_layout", {}))
	building_definitions = game_data.get("buildings", {})
	region_layout = game_data.get("region_layout", {})
	technologies = game_data.get("technologies", {})
	events = game_data.get("events", {})
	co2_tiers = game_data.get("co2_tiers", [])
	state.setup(constants)
	_event_system.reset()
	_energy_network.configure(game_data.get("network_graph", {}), int(constants.get("regional_distance_cap", 5)))

	var first_region := "fr_nord" if regions.has("fr_nord") else _first_key(regions)
	select_region(first_region)
	_recalculate(false)
	_emit_refresh()


func set_simulation_speed(speed_multiplier: float) -> void:
	state.simulation_speed = clampf(speed_multiplier, 0.0, 4.0)
	state.paused = state.simulation_speed <= 0.0
	resources_updated.emit(get_summary())


func set_paused(paused: bool) -> void:
	state.paused = paused
	if paused:
		state.simulation_speed = 0.0
	elif state.simulation_speed <= 0.0:
		state.simulation_speed = 1.0
	resources_updated.emit(get_summary())


func advance_month() -> void:
	if state.game_result != "":
		return

	state.advance_month()
	_event_system.advance_month(state.to_summary(), events)

	for region_id in regions.keys():
		var region: Dictionary = regions[region_id]
		var completed: Array = _building_system.advance_construction(region)
		for item in completed:
			construction_completed.emit(region_id, str(item.get("building_id", "")))

	_recalculate(true)
	month_advanced.emit(state.year, state.month)
	_emit_refresh()
	_check_endgame()


func select_region(region_id: String) -> void:
	if not region_id.is_empty() and not regions.has(region_id):
		return
	if state.selected_region_id == region_id:
		return

	state.selected_region_id = region_id
	selected_region_changed.emit(region_id)
	if not region_id.is_empty():
		region_updated.emit(region_id)


func request_building(region_id: String, building_id: String) -> Dictionary:
	if region_id.is_empty():
		region_id = state.selected_region_id
	var region: Dictionary = regions.get(region_id, {})
	var definition: Dictionary = building_definitions.get(building_id, {})
	var check: Dictionary = _building_system.can_start_construction(
		region,
		definition,
		state.money,
		state.completed_technologies,
		building_definitions
	)
	if not bool(check.get("ok", false)):
		return check

	state.money -= float(definition.get("cost", 0.0))
	_building_system.start_construction(region, definition)
	_recalculate(false)
	construction_started.emit(region_id, building_id)
	region_updated.emit(region_id)
	_emit_refresh()
	return {"ok": true, "reason": ""}


func cancel_construction(region_id: String, queue_index: int) -> Dictionary:
	var region: Dictionary = regions.get(region_id, {})
	if region.is_empty():
		return {"ok": false, "reason": "No region selected.", "refund": 0.0}

	var result: Dictionary = _building_system.cancel_construction(region, queue_index, constants)
	if bool(result.get("ok", false)):
		state.money += float(result.get("refund", 0.0))
		_recalculate(false)
		region_updated.emit(region_id)
		_emit_refresh()
	return result


func start_research(technology_id: String) -> void:
	if technology_id.is_empty() or not technologies.has(technology_id):
		return
	if state.completed_technologies.has(technology_id):
		return
	state.active_research_id = technology_id
	state.active_research_points = 0.0
	resources_updated.emit(get_summary())


func get_summary() -> Dictionary:
	return state.to_summary()


func get_regions_snapshot() -> Dictionary:
	var snapshots := {}
	for region_id in regions.keys():
		var region: Dictionary = regions[region_id]
		snapshots[region_id] = {
			"id": region_id,
			"display_name": str(region.get("display_name", region_id)),
			"slots_max": int(region.get("slots_max", 0)),
			"slots_used": _region_system.slots_used(region, building_definitions),
			"construction_queue": region.get("construction_queue", []),
			"cached": region.get("cached", {}),
		}
	return snapshots


func get_region_snapshot(region_id: String = "") -> Dictionary:
	if region_id.is_empty():
		region_id = state.selected_region_id
	if not regions.has(region_id):
		return {}
	return _region_system.region_snapshot(regions[region_id], building_definitions)


func get_building_definitions() -> Dictionary:
	return building_definitions


func get_region_layout() -> Dictionary:
	return region_layout


func get_build_availability(region_id: String = "") -> Dictionary:
	if region_id.is_empty():
		region_id = state.selected_region_id
	var region: Dictionary = regions.get(region_id, {})
	var result := {}
	for building_id in building_definitions.keys():
		var definition: Dictionary = building_definitions[building_id]
		result[building_id] = _building_system.can_start_construction(
			region,
			definition,
			state.money,
			state.completed_technologies,
			building_definitions
		)
	return result


func _recalculate(apply_monthly_changes: bool) -> void:
	var metrics := _build_region_metrics()
	var network_result: Dictionary = _energy_network.resolve(metrics, constants, _has_supergrid())
	var network_regions: Dictionary = network_result.get("regions", {})
	state.network_flows = network_result.get("flows", [])

	var totals := {
		"energy_produced": 0.0,
		"energy_consumed": 0.0,
		"cooling_available": 0.0,
		"cooling_used": 0.0,
		"compute_produced": 0.0,
		"compute_demand": 0.0,
		"co2_monthly": 0.0,
		"technology_points": 0.0,
		"ai_research_centers": 0,
		"blackout_regions": 0,
		"severe_blackout_regions": 0,
		"network_efficiency_sum": 0.0,
	}

	for region_id in regions.keys():
		var region: Dictionary = regions[region_id]
		var region_metrics: Dictionary = metrics.get(region_id, {})
		var network: Dictionary = network_regions.get(region_id, {})
		var cooling: Dictionary = _cooling_system.resolve_region(
			float(region_metrics.get("cooling_available", 0.0)),
			float(region_metrics.get("cooling_used", 0.0))
		)
		var energy_efficiency := float(network.get("energy_efficiency", 1.0))
		var cooling_efficiency := float(cooling.get("cooling_efficiency", 1.0))
		var researcher_efficiency := float(region_metrics.get("researcher_efficiency", 1.0))
		var final_efficiency := minf(energy_efficiency, cooling_efficiency)
		final_efficiency = minf(final_efficiency, researcher_efficiency)

		var compute_produced := float(region_metrics.get("compute_potential", 0.0)) * final_efficiency
		var technology_points := float(region_metrics.get("technology_points", 0.0)) * final_efficiency
		var cached := {
			"energy_production": float(region_metrics.get("energy_production", 0.0)),
			"energy_consumption": float(region_metrics.get("energy_consumption", 0.0)),
			"energy_balance_local": float(region_metrics.get("energy_production", 0.0)) - float(region_metrics.get("energy_consumption", 0.0)),
			"energy_imported": float(network.get("energy_imported", 0.0)),
			"energy_exported": float(network.get("energy_exported", 0.0)),
			"energy_unserved": float(network.get("energy_unserved", 0.0)),
			"energy_efficiency": energy_efficiency,
			"cooling_available": float(region_metrics.get("cooling_available", 0.0)),
			"cooling_used": float(region_metrics.get("cooling_used", 0.0)),
			"cooling_efficiency": cooling_efficiency,
			"cooling_state": str(cooling.get("cooling_state", "stable")),
			"compute_produced": compute_produced,
			"compute_demand": float(region_metrics.get("compute_demand", 0.0)),
			"researchers_required": float(region_metrics.get("researchers_required", 0.0)),
			"researchers_available": float(region_metrics.get("researchers_available", 0.0)),
			"researcher_efficiency": researcher_efficiency,
			"regional_efficiency": final_efficiency,
			"blackout_state": str(network.get("blackout_state", "stable")),
			"network_congested": bool(network.get("network_congested", false)),
			"co2_monthly": float(region_metrics.get("co2_monthly", 0.0)),
			"technology_points": technology_points,
			"problems": _region_problems(network, cooling, final_efficiency),
		}
		region["cached"] = cached

		totals["energy_produced"] += cached["energy_production"]
		totals["energy_consumed"] += cached["energy_consumption"]
		totals["cooling_available"] += cached["cooling_available"]
		totals["cooling_used"] += cached["cooling_used"]
		totals["compute_produced"] += compute_produced
		totals["compute_demand"] += cached["compute_demand"]
		totals["co2_monthly"] += cached["co2_monthly"]
		totals["technology_points"] += technology_points
		totals["ai_research_centers"] += int(region_metrics.get("ai_research_centers", 0))
		totals["network_efficiency_sum"] += energy_efficiency
		if cached["blackout_state"] != "stable":
			totals["blackout_regions"] += 1
		if cached["blackout_state"] == "severe":
			totals["severe_blackout_regions"] += 1

	state.energy_produced = totals["energy_produced"]
	state.energy_consumed = totals["energy_consumed"]
	state.cooling_available = totals["cooling_available"]
	state.cooling_used = totals["cooling_used"]
	state.compute_produced = totals["compute_produced"]
	state.compute_used = minf(totals["compute_produced"], totals["compute_demand"])
	state.blackout_regions = int(totals["blackout_regions"])
	state.severe_blackout_regions = int(totals["severe_blackout_regions"])
	state.co2_tier = _co2_tier_for_value(state.cumulative_co2)

	if apply_monthly_changes:
		state.cumulative_co2 += totals["co2_monthly"]
		state.co2_tier = _co2_tier_for_value(state.cumulative_co2)
		_advance_research(totals["technology_points"])

	var network_stability := 1.0
	if regions.size() > 0:
		network_stability = clampf(totals["network_efficiency_sum"] / float(regions.size()), 0.0, 1.0)
	var summary_for_agi: Dictionary = state.to_summary()
	var ai_bonus: float = _research_system.ai_efficiency_bonus(state.completed_technologies, technologies)
	var agi_gain: float = _research_system.compute_eu_agi_gain(
		summary_for_agi,
		constants,
		int(totals["ai_research_centers"]),
		network_stability,
		ai_bonus
	)
	if apply_monthly_changes:
		state.eu_agi_progress = clampf(state.eu_agi_progress + agi_gain, 0.0, 100.0)
	state.usa_agi_progress = _research_system.compute_usa_progress(state.year, state.month)

	state.monthly_income = _economy_system.calculate_monthly_income(state.to_summary(), constants, state.completed_technologies)
	if apply_monthly_changes:
		state.money += state.monthly_income

	state.researchers_available = _global_researchers_available(metrics)
	state.researchers_required = _global_researchers_required(metrics)
	state.alerts = _generate_alerts()


func _build_region_metrics() -> Dictionary:
	var metrics := {}
	var global_researchers_available := 0.0
	var global_researchers_required := 0.0

	for region_id in regions.keys():
		var region: Dictionary = regions[region_id]
		var region_metrics := _base_region_metrics(region)
		for building_id in region.get("buildings", []):
			var definition: Dictionary = building_definitions.get(str(building_id), {})
			if definition.is_empty():
				continue
			region_metrics["researchers_available"] += _researchers_from_building(definition, region)
			region_metrics["researchers_required"] += float(definition.get("researchers_required", 0.0))

		global_researchers_available += float(region_metrics.get("researchers_available", 0.0))
		global_researchers_required += float(region_metrics.get("researchers_required", 0.0))
		metrics[region_id] = region_metrics

	var researcher_efficiency := 1.0
	if global_researchers_required > 0.01:
		researcher_efficiency = clampf(global_researchers_available / global_researchers_required, 0.0, 1.0)

	for region_id in regions.keys():
		var region: Dictionary = regions[region_id]
		var region_metrics: Dictionary = metrics[region_id]
		region_metrics["researcher_efficiency"] = researcher_efficiency
		for building_id in region.get("buildings", []):
			var definition: Dictionary = building_definitions.get(str(building_id), {})
			if definition.is_empty():
				continue
			_apply_active_building(region_id, region, definition, region_metrics, researcher_efficiency)
		metrics[region_id] = region_metrics

	return metrics


func _base_region_metrics(region: Dictionary) -> Dictionary:
	return {
		"energy_production": float(region.get("starting_energy_generation", 0.0)),
		"energy_consumption": float(region.get("base_energy_demand", 0.0)),
		"cooling_available": float(region.get("starting_cooling_capacity", 0.0)),
		"cooling_used": 0.0,
		"compute_potential": float(region.get("starting_compute", 0.0)),
		"compute_demand": 0.0,
		"researchers_available": float(region.get("starting_researchers", 0.0)),
		"researchers_required": 0.0,
		"researcher_efficiency": 1.0,
		"co2_monthly": float(region.get("starting_co2_pressure_per_month", 0.0)),
		"technology_points": 0.0,
		"ai_research_centers": 0,
	}


func _apply_active_building(region_id: String, region: Dictionary, definition: Dictionary, metrics: Dictionary, researcher_efficiency: float) -> void:
	var requires_researchers := float(definition.get("researchers_required", 0.0)) > 0.01
	var labor_efficiency := researcher_efficiency if requires_researchers else 1.0
	var output_scale := labor_efficiency * _potential_scale(definition, region) * _variation_multiplier(region_id, definition)

	metrics["energy_production"] += float(definition.get("produces_energy", 0.0)) * output_scale
	metrics["cooling_available"] += float(definition.get("produces_cooling", 0.0)) * output_scale
	metrics["compute_potential"] += float(definition.get("produces_compute", 0.0)) * output_scale
	metrics["cooling_used"] += float(definition.get("consumes_cooling", 0.0))
	metrics["energy_consumption"] += float(definition.get("consumes_energy", 0.0))
	metrics["compute_demand"] += float(definition.get("consumes_compute", 0.0))
	metrics["co2_monthly"] += float(definition.get("co2_monthly", 0.0)) * output_scale

	match str(definition.get("id", "")):
		"ai_research_center":
			metrics["ai_research_centers"] = int(metrics.get("ai_research_centers", 0)) + 1
		"energy_research_center":
			metrics["technology_points"] += 18.0 * output_scale


func _researchers_from_building(definition: Dictionary, region: Dictionary) -> float:
	var base := float(definition.get("produces_researchers", 0.0))
	if base <= 0.0:
		return 0.0
	return base * _potential_scale(definition, region)


func _potential_scale(definition: Dictionary, region: Dictionary) -> float:
	var key := str(definition.get("scaling_potential", "")).strip_edges()
	if key.is_empty():
		return 1.0
	var potential: float = _region_system.potential(region, key)
	return clampf(0.7 + 0.1 * potential, 0.65, 1.35)


func _variation_multiplier(region_id: String, definition: Dictionary) -> float:
	var profile := str(definition.get("variation_profile", "")).strip_edges()
	if profile.is_empty():
		return 1.0

	var min_value := 0.8
	var max_value := 1.2
	match profile:
		"wind_offshore":
			min_value = 0.85
			max_value = 1.25
		"solar":
			min_value = 0.7
			max_value = 1.3
		"hydro":
			min_value = 0.9
			max_value = 1.1

	var region_variation_seed: int = absi(("%s:%s" % [region_id, profile]).hash())
	var phase := (float(region_variation_seed % 1000) / 1000.0) * TAU
	var wave := (sin((float(state.month_index) / 18.0) * TAU + phase) + 1.0) * 0.5
	var variation_noise_seed: int = absi(("%s:%s:%d" % [region_id, profile, state.month_index]).hash())
	var noise := ((float(variation_noise_seed % 100) / 100.0) - 0.5) * 0.04
	return clampf(lerpf(min_value, max_value, wave) + noise, min_value, max_value)


func _advance_research(technology_points: float) -> void:
	if technology_points <= 0.01:
		return

	if state.active_research_id.is_empty():
		state.active_research_id = _research_system.next_available_technology(technologies, state.completed_technologies)
		state.active_research_points = 0.0

	if state.active_research_id.is_empty():
		return

	var technology: Dictionary = technologies.get(state.active_research_id, {})
	state.active_research_points += technology_points
	if state.active_research_points >= float(technology.get("cost", 0.0)):
		state.completed_technologies[state.active_research_id] = true
		state.active_research_id = ""
		state.active_research_points = 0.0


func _generate_alerts() -> Array:
	var alerts := []
	for region_id in regions.keys():
		var region: Dictionary = regions[region_id]
		var cached: Dictionary = region.get("cached", {})
		var display_name := str(region.get("display_name", region_id))

		if str(cached.get("blackout_state", "stable")) == "severe":
			alerts.append(_alert(1, "Blackout severe", display_name, "local energy deficit", "build local production or reduce imports", region_id, "critical"))
		elif float(cached.get("energy_efficiency", 1.0)) < 0.94:
			alerts.append(_alert(2, "Energy deficit", display_name, "imports too weak or too distant", "build local production or nearby surplus", region_id, "power_warning"))

		if float(cached.get("cooling_efficiency", 1.0)) < 0.92:
			alerts.append(_alert(3, "Cooling insufficient", display_name, "datacenters exceed regional cooling", "build river, sea or air cooling", region_id, "cooling_warning"))

		if bool(cached.get("network_congested", false)):
			alerts.append(_alert(5, "Network saturated", display_name, "high-loss power flows", "spread production or unlock supergrid", region_id, "power_warning"))

		if _region_system.slots_free(region, building_definitions) <= 0 and not region.get("buildings", []).is_empty():
			alerts.append(_alert(6, "Slots saturated", display_name, "regional construction capacity is full", "choose another region for expansion", region_id, "market_info"))

	if state.researchers_required > 0.01 and state.researchers_available / state.researchers_required < 0.9:
		alerts.append(_alert(4, "Researchers insufficient", "Europe", "needs exceed capacity", "build universities in research regions", "", "power_warning"))

	if state.co2_tier in ["elevated", "very_high", "critical"]:
		alerts.append(_alert(5, "CO2 elevated", "Europe", "fossil dependence rising", "shift toward nuclear and renewables", "", "power_warning"))

	if state.usa_agi_progress >= 85.0 and state.eu_agi_progress < state.usa_agi_progress:
		alerts.append(_alert(7, "USA near AGI", "Global", "US curve is pulling ahead", "accelerate AI research and compute", "", "critical"))

	alerts.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return int(a.get("priority", 99)) < int(b.get("priority", 99))
	)
	return alerts.slice(0, mini(alerts.size(), 5))


func _alert(priority: int, problem: String, region_name: String, cause: String, action: String, region_id: String, state_name: String) -> Dictionary:
	return {
		"priority": priority,
		"title": "%s - %s" % [problem, region_name],
		"body": "%s -> %s" % [cause, action],
		"region_id": region_id,
		"state": state_name,
	}


func _region_problems(network: Dictionary, cooling: Dictionary, final_efficiency: float) -> Array:
	var problems := []
	if str(network.get("blackout_state", "stable")) != "stable":
		problems.append("blackout")
	if float(network.get("energy_efficiency", 1.0)) < 0.94:
		problems.append("energy")
	if float(cooling.get("cooling_efficiency", 1.0)) < 0.92:
		problems.append("cooling")
	if final_efficiency < 0.9:
		problems.append("efficiency")
	if bool(network.get("network_congested", false)):
		problems.append("network")
	return problems


func _co2_tier_for_value(value: float) -> String:
	for tier_variant in co2_tiers:
		var tier: Dictionary = tier_variant
		if value >= float(tier.get("min", 0.0)) and value <= float(tier.get("max", INF)):
			return str(tier.get("id", "low"))
	return "critical"


func _check_endgame() -> void:
	if state.game_result != "":
		return

	if state.eu_agi_progress >= 100.0 and state.eu_agi_progress >= state.usa_agi_progress:
		state.game_result = "victory"
	elif state.usa_agi_progress >= 100.0 and state.usa_agi_progress > state.eu_agi_progress:
		state.game_result = "defeat"

	if state.game_result != "":
		game_ended.emit(state.game_result, _scoring_system.provisional_score(state.to_summary()))


func _emit_refresh() -> void:
	var summary: Dictionary = get_summary()
	resources_updated.emit(summary)
	alerts_updated.emit(state.alerts)
	if not state.selected_region_id.is_empty():
		region_updated.emit(state.selected_region_id)


func _global_researchers_available(metrics: Dictionary) -> float:
	var total := 0.0
	for region_id in metrics.keys():
		total += float((metrics[region_id] as Dictionary).get("researchers_available", 0.0))
	return total


func _global_researchers_required(metrics: Dictionary) -> float:
	var total := 0.0
	for region_id in metrics.keys():
		total += float((metrics[region_id] as Dictionary).get("researchers_required", 0.0))
	return total


func _has_supergrid() -> bool:
	return state.completed_technologies.has("supergrid") or state.completed_technologies.has("supergrid_european")


func _first_key(dictionary: Dictionary) -> String:
	for key in dictionary.keys():
		return str(key)
	return ""
