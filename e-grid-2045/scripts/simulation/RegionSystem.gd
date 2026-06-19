extends RefCounted
class_name EGridRegionSystem


func clone_regions(region_definitions: Dictionary, layout: Dictionary) -> Dictionary:
	var regions := {}
	for region_id in region_definitions.keys():
		var source: Dictionary = region_definitions[region_id]
		var region := source.duplicate(true)
		region["buildings"] = []
		region["construction_queue"] = []
		region["cached"] = {}
		region["layout"] = layout.get(region_id, {})
		regions[region_id] = region
	return regions


func slots_used(region: Dictionary, building_definitions: Dictionary) -> int:
	var used := 0
	for building_id in region.get("buildings", []):
		var definition: Dictionary = building_definitions.get(str(building_id), {})
		used += int(definition.get("slots_required", 1))

	for item in region.get("construction_queue", []):
		var definition: Dictionary = building_definitions.get(str(item.get("building_id", "")), {})
		used += int(definition.get("slots_required", 1))
	return used


func slots_free(region: Dictionary, building_definitions: Dictionary) -> int:
	return maxi(int(region.get("slots_max", 0)) - slots_used(region, building_definitions), 0)


func region_has_any_tag(region: Dictionary, required_tags: Array) -> bool:
	if required_tags.is_empty():
		return true

	var tags: Array = region.get("tags", [])
	for required_tag in required_tags:
		if tags.has(str(required_tag)):
			return true
	return false


func potential(region: Dictionary, key: String) -> float:
	match key:
		"cooling":
			return float(region.get("potential_cooling", 0.0))
		"solar":
			return float(region.get("potential_solar", 0.0))
		"wind_onshore":
			return float(region.get("potential_wind_onshore", 0.0))
		"wind_offshore":
			return float(region.get("potential_wind_offshore", 0.0))
		"hydro":
			return float(region.get("potential_hydro", 0.0))
		"nuclear":
			return float(region.get("potential_nuclear", 0.0))
		"grid":
			return float(region.get("potential_grid", 0.0))
		"research":
			return float(region.get("potential_research", 0.0))
		_:
			return 0.0


func region_snapshot(region: Dictionary, building_definitions: Dictionary) -> Dictionary:
	var snapshot := region.duplicate(true)
	snapshot["slots_used"] = slots_used(region, building_definitions)
	snapshot["slots_free"] = slots_free(region, building_definitions)
	return snapshot
