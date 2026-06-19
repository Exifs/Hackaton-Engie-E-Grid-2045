extends RefCounted
class_name EGridGameState

var year := 2025
var month := 1
var month_index := 0
var money := 1000.0
var monthly_income := 0.0
var eu_agi_progress := 0.0
var usa_agi_progress := 0.0
var cumulative_co2 := 0.0
var co2_tier := "low"
var researchers_available := 0.0
var researchers_required := 0.0
var compute_produced := 0.0
var compute_used := 0.0
var energy_produced := 0.0
var energy_consumed := 0.0
var cooling_available := 0.0
var cooling_used := 0.0
var blackout_regions := 0
var severe_blackout_regions := 0
var simulation_speed := 0.0
var paused := true
var selected_region_id := ""
var active_research_id := ""
var active_research_points := 0.0
var completed_technologies := {}
var alerts := []
var network_flows := []
var game_result := ""


func setup(constants: Dictionary) -> void:
	year = int(constants.get("starting_year", 2025))
	month = 1
	month_index = 0
	money = float(constants.get("starting_money", 1000.0))
	monthly_income = float(constants.get("starting_monthly_income", 80.0))
	eu_agi_progress = 0.0
	usa_agi_progress = 0.0
	cumulative_co2 = 0.0
	co2_tier = "low"
	researchers_available = 0.0
	researchers_required = 0.0
	compute_produced = 0.0
	compute_used = 0.0
	energy_produced = 0.0
	energy_consumed = 0.0
	cooling_available = 0.0
	cooling_used = 0.0
	blackout_regions = 0
	severe_blackout_regions = 0
	simulation_speed = 0.0
	paused = true
	selected_region_id = ""
	active_research_id = ""
	active_research_points = 0.0
	completed_technologies.clear()
	alerts.clear()
	network_flows.clear()
	game_result = ""


func advance_month() -> void:
	month_index += 1
	month += 1
	if month > 12:
		month = 1
		year += 1


func date_text() -> String:
	var month_names := [
		"JAN", "FEB", "MAR", "APR", "MAY", "JUN",
		"JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
	]
	return "%s %d" % [month_names[clampi(month - 1, 0, 11)], year]


func to_summary() -> Dictionary:
	return {
		"year": year,
		"month": month,
		"month_index": month_index,
		"date_text": date_text(),
		"money": money,
		"monthly_income": monthly_income,
		"eu_agi_progress": eu_agi_progress,
		"usa_agi_progress": usa_agi_progress,
		"cumulative_co2": cumulative_co2,
		"co2_tier": co2_tier,
		"researchers_available": researchers_available,
		"researchers_required": researchers_required,
		"compute_produced": compute_produced,
		"compute_used": compute_used,
		"energy_produced": energy_produced,
		"energy_consumed": energy_consumed,
		"cooling_available": cooling_available,
		"cooling_used": cooling_used,
		"blackout_regions": blackout_regions,
		"severe_blackout_regions": severe_blackout_regions,
		"simulation_speed": simulation_speed,
		"paused": paused,
		"selected_region_id": selected_region_id,
		"active_research_id": active_research_id,
		"active_research_points": active_research_points,
		"completed_technologies": completed_technologies,
		"alerts": alerts,
		"network_flows": network_flows,
		"game_result": game_result,
	}
