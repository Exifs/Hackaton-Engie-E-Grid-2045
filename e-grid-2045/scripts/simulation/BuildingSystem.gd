extends RefCounted
class_name EGridBuildingSystem

const REGION_SYSTEM := preload("res://scripts/simulation/RegionSystem.gd")

var _regions := REGION_SYSTEM.new()


func can_start_construction(
	region: Dictionary,
	building_definition: Dictionary,
	money: float,
	completed_technologies: Dictionary,
	building_definitions: Dictionary
) -> Dictionary:
	if region.is_empty():
		return {"ok": false, "reason": "Select a region first."}
	if building_definition.is_empty():
		return {"ok": false, "reason": "Unknown building."}

	var cost := float(building_definition.get("cost", 0.0))
	if money < cost:
		return {"ok": false, "reason": "Insufficient budget."}

	var slots_required := int(building_definition.get("slots_required", 1))
	if _regions.slots_free(region, building_definitions) < slots_required:
		return {"ok": false, "reason": "Not enough regional slots."}

	var unlock_technology := str(building_definition.get("unlock_technology", "")).strip_edges()
	if not unlock_technology.is_empty() and not completed_technologies.has(unlock_technology):
		return {"ok": false, "reason": "Locked: research %s." % unlock_technology}

	var required_tags: Array = building_definition.get("required_tags", [])
	if not _regions.region_has_any_tag(region, required_tags):
		return {"ok": false, "reason": "Region lacks required tag."}

	var potential_key := str(building_definition.get("required_potential", "")).strip_edges()
	var potential_min := float(building_definition.get("required_potential_min", 0.0))
	if not potential_key.is_empty() and potential_min > 0.0:
		if _regions.potential(region, potential_key) < potential_min:
			return {"ok": false, "reason": "Regional potential too low."}

	return {"ok": true, "reason": ""}


func start_construction(region: Dictionary, building_definition: Dictionary) -> Dictionary:
	var item := {
		"building_id": str(building_definition.get("id", "")),
		"months_remaining": int(building_definition.get("construction_months", 1)),
		"total_months": int(building_definition.get("construction_months", 1)),
		"cost": int(building_definition.get("cost", 0)),
	}
	var queue: Array = region.get("construction_queue", [])
	queue.append(item)
	region["construction_queue"] = queue
	return item


func advance_construction(region: Dictionary) -> Array:
	var completed := []
	var queue: Array = region.get("construction_queue", [])
	var remaining_queue := []

	for raw_item in queue:
		var item: Dictionary = raw_item
		item["months_remaining"] = int(item.get("months_remaining", 1)) - 1
		if int(item.get("months_remaining", 0)) <= 0:
			var building_id := str(item.get("building_id", ""))
			if not building_id.is_empty():
				var buildings: Array = region.get("buildings", [])
				buildings.append(building_id)
				region["buildings"] = buildings
				completed.append(item)
		else:
			remaining_queue.append(item)

	region["construction_queue"] = remaining_queue
	return completed


func cancel_construction(region: Dictionary, queue_index: int, constants: Dictionary) -> Dictionary:
	var queue: Array = region.get("construction_queue", [])
	if queue_index < 0 or queue_index >= queue.size():
		return {"ok": false, "refund": 0.0, "reason": "No construction at this slot."}

	var item: Dictionary = queue[queue_index]
	var total_months := maxf(float(item.get("total_months", 1)), 1.0)
	var months_remaining := maxf(float(item.get("months_remaining", total_months)), 0.0)
	var progress_ratio := clampf(1.0 - (months_remaining / total_months), 0.0, 1.0)
	var refund_max := float(constants.get("construction_cancel_refund_max_pct", 0.75))
	var refund_min := float(constants.get("construction_cancel_refund_min_pct", 0.5))
	var refund_ratio := lerpf(refund_max, refund_min, progress_ratio)
	var refund := floorf(float(item.get("cost", 0.0)) * refund_ratio)

	queue.remove_at(queue_index)
	region["construction_queue"] = queue
	return {"ok": true, "refund": refund, "reason": ""}
