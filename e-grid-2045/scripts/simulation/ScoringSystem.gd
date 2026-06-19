extends RefCounted
class_name EGridScoringSystem


func provisional_score(state_summary: Dictionary) -> Dictionary:
	var stability := 100.0
	stability -= float(state_summary.get("blackout_regions", 0)) * 8.0
	stability -= float(state_summary.get("severe_blackout_regions", 0)) * 16.0
	stability = clampf(stability, 0.0, 100.0)

	var energy_produced := maxf(float(state_summary.get("energy_produced", 0.0)), 0.01)
	var co2 := float(state_summary.get("cumulative_co2", 0.0))
	var decarbonized_share := clampf(100.0 - co2 / 24.0, 0.0, 100.0)
	var energy_efficiency := clampf(float(state_summary.get("energy_consumed", 0.0)) / energy_produced * 100.0, 0.0, 100.0)

	return {
		"network_stability": stability,
		"decarbonized_share": decarbonized_share,
		"energy_efficiency": energy_efficiency,
		"co2": co2,
		"score": roundi((stability + decarbonized_share + energy_efficiency + float(state_summary.get("eu_agi_progress", 0.0))) * 2.5),
	}
