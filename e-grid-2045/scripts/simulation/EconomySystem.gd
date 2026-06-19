extends RefCounted
class_name EGridEconomySystem


func calculate_monthly_income(state_summary: Dictionary, constants: Dictionary, completed_technologies: Dictionary) -> float:
	var income := float(constants.get("starting_monthly_income", 80.0))
	income += float(constants.get("population_units_total", 45.0)) * float(constants.get("income_per_population_unit", 2.0))
	income += float(state_summary.get("eu_agi_progress", 0.0)) * float(constants.get("income_per_agi_percent", 3.0))

	if completed_technologies.has("energy_efficiency"):
		income += float(constants.get("income_energy_efficiency_tech_bonus", 30.0))

	income -= int(state_summary.get("blackout_regions", 0)) * float(constants.get("blackout_light_income_penalty", 20.0))
	income -= int(state_summary.get("severe_blackout_regions", 0)) * float(constants.get("blackout_severe_income_penalty", 60.0))

	match str(state_summary.get("co2_tier", "low")):
		"moderate":
			income -= float(constants.get("co2_moderate_income_penalty", 10.0))
		"elevated", "very_high":
			income -= float(constants.get("co2_elevated_income_penalty", 30.0))
		"critical":
			income -= float(constants.get("co2_critical_income_penalty", 80.0))

	return maxf(income, 0.0)
