extends RefCounted
class_name EGridResearchSystem


func compute_usa_progress(year: int, month: int) -> float:
	var timeline := [
		{"year": 2025, "value": 0.0},
		{"year": 2030, "value": 20.0},
		{"year": 2035, "value": 45.0},
		{"year": 2040, "value": 75.0},
		{"year": 2045, "value": 100.0},
	]
	var current_time := float(year) + (float(month - 1) / 12.0)

	for index in range(timeline.size() - 1):
		var start: Dictionary = timeline[index]
		var finish: Dictionary = timeline[index + 1]
		var start_year := float(start.get("year", 2025))
		var finish_year := float(finish.get("year", 2045))
		if current_time >= start_year and current_time <= finish_year:
			var ratio := clampf((current_time - start_year) / (finish_year - start_year), 0.0, 1.0)
			return lerpf(float(start.get("value", 0.0)), float(finish.get("value", 100.0)), ratio)

	return 100.0 if current_time >= 2045.0 else 0.0


func compute_eu_agi_gain(
	state_summary: Dictionary,
	constants: Dictionary,
	ai_research_centers: int,
	network_stability: float,
	ai_efficiency_bonus_pct: float
) -> float:
	if ai_research_centers <= 0:
		return 0.0

	var month_index := float(state_summary.get("month_index", 0))
	var ending_year := float(constants.get("ending_year", 2045))
	var starting_year := float(constants.get("starting_year", 2025))
	var total_months := maxf((ending_year - starting_year) * 12.0, 1.0)
	var progress_ratio := clampf(month_index / total_months, 0.0, 1.0)
	var compute_optimal := lerpf(
		float(constants.get("compute_optimal_start", 100.0)),
		float(constants.get("compute_optimal_end", 400.0)),
		progress_ratio
	)
	var compute_used := float(state_summary.get("compute_used", 0.0))
	var factor_compute := sqrt(maxf(compute_used, 0.0) / maxf(compute_optimal, 1.0))
	var researchers_available := float(state_summary.get("researchers_available", 0.0))
	var researchers_required := float(state_summary.get("researchers_required", 0.0))
	var factor_researchers := 1.0
	if researchers_required > 0.01:
		factor_researchers = clampf(researchers_available / researchers_required, 0.0, 1.0)
	var factor_ai := 1.0 + (ai_efficiency_bonus_pct / 100.0)
	var factor_stability := clampf(network_stability, 0.0, 1.0)
	if int(state_summary.get("severe_blackout_regions", 0)) > 0:
		factor_stability *= 0.8

	return float(constants.get("base_research_monthly", 0.35)) * factor_compute * factor_researchers * factor_ai * factor_stability


func next_available_technology(technologies: Dictionary, completed_technologies: Dictionary) -> String:
	var candidates := []
	for technology_id in technologies.keys():
		if completed_technologies.has(technology_id):
			continue
		var technology: Dictionary = technologies[technology_id]
		var prereqs: Array = technology.get("prereq_technology_ids", [])
		var ready := true
		for prereq in prereqs:
			if not completed_technologies.has(str(prereq)):
				ready = false
				break
		if ready:
			candidates.append(technology)

	candidates.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		if int(a.get("tier", 1)) == int(b.get("tier", 1)):
			return float(a.get("cost", 0.0)) < float(b.get("cost", 0.0))
		return int(a.get("tier", 1)) < int(b.get("tier", 1))
	)

	if candidates.is_empty():
		return ""
	return str(candidates[0].get("id", ""))


func ai_efficiency_bonus(completed_technologies: Dictionary, technologies: Dictionary) -> float:
	var bonus := 0.0
	for technology_id in completed_technologies.keys():
		var technology: Dictionary = technologies.get(technology_id, {})
		if str(technology.get("effect_key", "")) == "ai_efficiency_bonus":
			bonus += float(technology.get("effect_value_pct", 0.0))
		if str(technology.get("effect_key", "")) == "agi_gain_multiplier":
			bonus += float(technology.get("effect_value_pct", 0.0))
	return bonus
