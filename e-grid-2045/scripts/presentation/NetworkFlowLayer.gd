extends RefCounted
class_name EGridNetworkFlowLayer


static func visible_flows(flows: Array, selected_region_id: String, max_count: int = 9) -> Array:
	var candidates := []
	for flow_variant in flows:
		var flow: Dictionary = flow_variant
		var selected_related := selected_region_id.is_empty()
		selected_related = selected_related or str(flow.get("source_region_id", "")) == selected_region_id
		selected_related = selected_related or str(flow.get("target_region_id", "")) == selected_region_id
		if selected_related or float(flow.get("sent_amount", 0.0)) >= 6.0:
			candidates.append(flow)

	candidates.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return float(a.get("sent_amount", 0.0)) > float(b.get("sent_amount", 0.0))
	)
	return candidates.slice(0, mini(candidates.size(), max_count))


static func color_for_flow(flow: Dictionary, selected: bool) -> Color:
	if bool(flow.get("is_congested", false)):
		return Color("#ff8a3dcc") if selected else Color("#ff8a3d84")
	return Color("#40dce6d8") if selected else Color("#40dce684")


static func width_for_flow(flow: Dictionary, selected: bool) -> float:
	var width := lerpf(1.2, 6.0, clampf(float(flow.get("intensity_normalized", 0.0)), 0.0, 1.0))
	return width + 1.5 if selected else width
