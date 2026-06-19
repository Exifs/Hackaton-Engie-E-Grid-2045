extends RefCounted
class_name EGridEnergyNetworkSystem

var _distances := {}
var _distance_cap := 5


func configure(network_graph: Dictionary, distance_cap: int) -> void:
	_distance_cap = maxi(distance_cap, 1)
	_distances.clear()
	for region_id in network_graph.keys():
		_distances[region_id] = _bfs_distances(str(region_id), network_graph)


func resolve(region_metrics: Dictionary, constants: Dictionary, supergrid_enabled: bool) -> Dictionary:
	var flows := []
	var region_results := {}
	var surplus_regions := []
	var deficit_regions := []

	for region_id in region_metrics.keys():
		var metrics: Dictionary = region_metrics[region_id]
		var production := float(metrics.get("energy_production", 0.0))
		var consumption := float(metrics.get("energy_consumption", 0.0))
		var balance := production - consumption
		region_results[region_id] = {
			"energy_imported": 0.0,
			"energy_exported": 0.0,
			"energy_unserved": 0.0,
			"energy_efficiency": 1.0,
			"blackout_state": "stable",
			"network_congested": false,
		}

		if balance > 0.01:
			surplus_regions.append({"id": region_id, "available": balance})
		elif balance < -0.01:
			deficit_regions.append({"id": region_id, "deficit": -balance})

	for deficit in deficit_regions:
		var target_id := str(deficit.get("id", ""))
		var remaining_deficit := float(deficit.get("deficit", 0.0))

		while remaining_deficit > 0.01:
			var source_index := _nearest_surplus_index(target_id, surplus_regions)
			if source_index < 0:
				break

			var source: Dictionary = surplus_regions[source_index]
			var source_id := str(source.get("id", ""))
			var available := float(source.get("available", 0.0))
			var distance := _distance(source_id, target_id)
			var distance_efficiency := _distance_efficiency(distance, constants, supergrid_enabled)
			var tentative_sent := minf(available, remaining_deficit / maxf(distance_efficiency, 0.01))
			var volume_efficiency := _volume_efficiency(tentative_sent, constants, supergrid_enabled)
			var transfer_efficiency := clampf(distance_efficiency * volume_efficiency, 0.0, 1.0)

			if transfer_efficiency <= 0.01:
				source["available"] = 0.0
				surplus_regions[source_index] = source
				continue

			var sent := minf(available, remaining_deficit / transfer_efficiency)
			var received := sent * transfer_efficiency
			var losses := maxf(sent - received, 0.0)
			var congested := volume_efficiency < 0.75 or distance >= _distance_cap

			source["available"] = maxf(available - sent, 0.0)
			surplus_regions[source_index] = source
			if float(source.get("available", 0.0)) <= 0.01:
				surplus_regions.remove_at(source_index)

			remaining_deficit = maxf(remaining_deficit - received, 0.0)
			region_results[target_id]["energy_imported"] = float(region_results[target_id].get("energy_imported", 0.0)) + received
			region_results[source_id]["energy_exported"] = float(region_results[source_id].get("energy_exported", 0.0)) + sent
			region_results[target_id]["network_congested"] = bool(region_results[target_id].get("network_congested", false)) or congested
			region_results[source_id]["network_congested"] = bool(region_results[source_id].get("network_congested", false)) or congested

			flows.append({
				"source_region_id": source_id,
				"target_region_id": target_id,
				"sent_amount": sent,
				"received_amount": received,
				"losses": losses,
				"distance": distance,
				"intensity_normalized": clampf(sent / 90.0, 0.05, 1.0),
				"is_congested": congested,
			})

		if remaining_deficit > 0.01:
			var target_metrics: Dictionary = region_metrics.get(target_id, {})
			var consumption := maxf(float(target_metrics.get("energy_consumption", 0.0)), 0.01)
			var efficiency := clampf(1.0 - (remaining_deficit / consumption), 0.0, 1.0)
			region_results[target_id]["energy_unserved"] = remaining_deficit
			region_results[target_id]["energy_efficiency"] = efficiency
			if efficiency < 0.72:
				region_results[target_id]["blackout_state"] = "severe"
			elif efficiency < 0.94:
				region_results[target_id]["blackout_state"] = "light"

	return {
		"regions": region_results,
		"flows": flows,
	}


func _nearest_surplus_index(target_id: String, surplus_regions: Array) -> int:
	var best_index := -1
	var best_distance := _distance_cap + 1
	var best_available := -1.0

	for index in range(surplus_regions.size()):
		var source: Dictionary = surplus_regions[index]
		var available := float(source.get("available", 0.0))
		if available <= 0.01:
			continue

		var distance := _distance(str(source.get("id", "")), target_id)
		if distance < best_distance or (distance == best_distance and available > best_available):
			best_index = index
			best_distance = distance
			best_available = available

	return best_index


func _bfs_distances(source_id: String, graph: Dictionary) -> Dictionary:
	var distances := {source_id: 0}
	var queue := [source_id]
	var queue_index := 0

	while queue_index < queue.size():
		var current := str(queue[queue_index])
		queue_index += 1
		var current_distance := int(distances.get(current, 0))
		if current_distance >= _distance_cap:
			continue

		var neighbors: Array = graph.get(current, [])
		for neighbor_variant in neighbors:
			var neighbor := str(neighbor_variant)
			if distances.has(neighbor):
				continue
			distances[neighbor] = current_distance + 1
			queue.append(neighbor)
	return distances


func _distance(source_id: String, target_id: String) -> int:
	if source_id == target_id:
		return 0
	var source_distances: Dictionary = _distances.get(source_id, {})
	return mini(int(source_distances.get(target_id, _distance_cap)), _distance_cap)


func _distance_efficiency(distance: int, constants: Dictionary, supergrid_enabled: bool) -> float:
	var table: Dictionary = constants.get("distance_efficiency", {})
	var efficiency := float(table.get(distance, 0.4))
	if supergrid_enabled and distance > 0:
		efficiency = minf(1.0, efficiency + float(constants.get("supergrid_distance_bonus", 0.15)))
	return efficiency


func _volume_efficiency(sent_amount: float, constants: Dictionary, supergrid_enabled: bool) -> float:
	var tiers: Array = constants.get("volume_efficiency_tiers", [])
	for tier_variant in tiers:
		var tier: Dictionary = tier_variant
		var min_sent := float(tier.get("min_energy_sent", 0.0))
		var max_key := "max_after_supergrid" if supergrid_enabled else "max_energy_sent"
		var max_sent := float(tier.get(max_key, INF))
		if sent_amount >= min_sent and sent_amount <= max_sent:
			return float(tier.get("volume_efficiency", 1.0))
	return 0.35
