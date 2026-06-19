extends RefCounted
class_name EGridEventSystem

var active_events := []


func reset() -> void:
	active_events.clear()


func advance_month(_state_summary: Dictionary, _events: Dictionary) -> Array:
	for index in range(active_events.size() - 1, -1, -1):
		var event: Dictionary = active_events[index]
		event["months_remaining"] = int(event.get("months_remaining", 1)) - 1
		if int(event.get("months_remaining", 0)) <= 0:
			active_events.remove_at(index)
		else:
			active_events[index] = event
	return active_events


func modifiers() -> Dictionary:
	var result := {}
	for event_variant in active_events:
		var event: Dictionary = event_variant
		result[str(event.get("effect_key", ""))] = event.get("effect_value", 0)
	return result
