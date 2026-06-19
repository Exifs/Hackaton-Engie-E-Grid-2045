extends RefCounted
class_name EGridHeatmapLayer


static func color_for_region(mode: String, cached: Dictionary) -> Color:
	match mode:
		"energy":
			var balance := float(cached.get("energy_balance_local", 0.0)) + float(cached.get("energy_imported", 0.0)) - float(cached.get("energy_unserved", 0.0))
			if float(cached.get("energy_efficiency", 1.0)) < 0.94:
				return Color("#f15b2a70")
			if balance >= 0.0:
				return Color("#35e6b260")
			return Color("#f2a13a62")
		"cooling":
			if float(cached.get("cooling_efficiency", 1.0)) < 0.92:
				return Color("#6f86a870")
			return Color("#55c7ff55")
		"network":
			return Color("#f0a33d68") if bool(cached.get("network_congested", false)) else Color("#40c9e840")
		"research":
			var researchers := float(cached.get("researchers_available", 0.0))
			return Color("#9d7bff55") if researchers > 1.0 else Color("#38415d35")
		"co2":
			var co2 := float(cached.get("co2_monthly", 0.0))
			return Color(0.7, 0.43, 0.18, clampf(co2 / 12.0, 0.12, 0.7))
		_:
			return Color.TRANSPARENT


static func semantic_state_for_region(cached: Dictionary) -> String:
	if str(cached.get("blackout_state", "stable")) == "severe":
		return "blackout"
	if float(cached.get("energy_efficiency", 1.0)) < 0.94:
		return "energy_deficit"
	if float(cached.get("cooling_efficiency", 1.0)) < 0.92:
		return "cooling_low"
	if bool(cached.get("network_congested", false)):
		return "network_saturated"
	if float(cached.get("energy_balance_local", 0.0)) > 8.0:
		return "surplus"
	if float(cached.get("compute_produced", 0.0)) > 8.0:
		return "compute_high"
	return "stable"
