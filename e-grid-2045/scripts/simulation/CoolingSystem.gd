extends RefCounted
class_name EGridCoolingSystem


func resolve_region(cooling_available: float, cooling_used: float) -> Dictionary:
	var efficiency := 1.0
	if cooling_used > 0.01:
		efficiency = clampf(cooling_available / cooling_used, 0.0, 1.0)

	var state := "stable"
	if efficiency < 0.65:
		state = "critical"
	elif efficiency < 0.92:
		state = "low"

	return {
		"cooling_efficiency": efficiency,
		"cooling_state": state,
	}
