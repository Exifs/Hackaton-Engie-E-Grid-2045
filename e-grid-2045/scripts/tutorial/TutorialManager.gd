extends Node
class_name EGridTutorialManager

signal tutorial_started
signal tutorial_completed
signal tutorial_skipped

const OVERLAY_SCENE := preload("res://scenes/ui/tutorial/TutorialOverlay.tscn")
const DATA_PATH := "res://data/tutorial_first_loop.json"
const CONFIG_PATH := "user://settings.cfg"
const CONFIG_SECTION := "tutorial"
const COMPLETED_KEY := "tutorial_first_loop_v2_completed"
const SKIPPED_KEY := "tutorial_first_loop_v2_skipped"
const LEGACY_COMPLETED_KEY := "tutorial_first_loop_completed"
const LEGACY_SKIPPED_KEY := "tutorial_first_loop_skipped"
const DEFAULT_RECOMMENDED_REGION := "fr_nord"

var _game_scene: Control
var _simulation_core: Node
var _overlay
var _targets := {}
var _steps: Array = []
var _current_step_index := 0
var _active := false
var _paused_by_tutorial := false
var _pause_snapshot := {}
var _timeout_token := 0

var _events_seen := {}
var _buildings_queued_by_id := {}
var _buildings_completed_by_id := {}
var _heatmaps_enabled := {}
var _resources_seen_increase := {}
var _alerts_seen_by_type := {}
var _alert_signatures_seen := {}
var _research_started_by_id := {}
var _last_resource_values := {}
var _last_construction_region_id := ""


func setup(game_scene: Control, simulation_core: Node, targets: Dictionary) -> void:
	_game_scene = game_scene
	_simulation_core = simulation_core
	_targets = targets.duplicate()
	_load_steps()
	_connect_simulation_signals()
	call_deferred("start_if_needed")


func register_target(target_id: String, node: Node) -> void:
	if target_id.strip_edges().is_empty() or node == null:
		return
	node.set_meta("tutorial_target_id", target_id)
	_targets[target_id] = node


func start_if_needed() -> void:
	if _active:
		return
	if has_saved_completion_state():
		return
	start(false)


func start(force: bool = false) -> void:
	if _steps.is_empty():
		_load_steps()
	if _steps.is_empty():
		push_warning("TutorialManager cannot start: no tutorial steps loaded.")
		return
	if not force and has_saved_completion_state():
		return

	_reset_runtime_state()
	_ensure_overlay()
	if _overlay == null:
		return
	_current_step_index = 0
	_active = true
	_overlay.visible = true
	tutorial_started.emit()
	_show_current_step()


func skip() -> void:
	if not _active:
		return
	_save_flag(SKIPPED_KEY, true)
	_stop_tutorial()
	tutorial_skipped.emit()


func complete() -> void:
	if not _active:
		return
	_save_flag(COMPLETED_KEY, true)
	_stop_tutorial()
	tutorial_completed.emit()


func reset_saved_state() -> void:
	var error := reset_saved_state_flags()
	if error != OK:
		push_warning("TutorialManager could not reset tutorial flags. Error code: %d." % error)


static func get_active_state_keys() -> Array[String]:
	return [
		COMPLETED_KEY,
		SKIPPED_KEY,
	]


static func get_reset_state_keys() -> Array[String]:
	return [
		COMPLETED_KEY,
		SKIPPED_KEY,
		LEGACY_COMPLETED_KEY,
		LEGACY_SKIPPED_KEY,
	]


static func has_saved_completion_state(config_path: String = CONFIG_PATH) -> bool:
	var config := ConfigFile.new()
	if config.load(config_path) != OK:
		return false

	for key in get_active_state_keys():
		if bool(config.get_value(CONFIG_SECTION, key, false)):
			return true

	return false


static func reset_saved_state_flags(config_path: String = CONFIG_PATH) -> int:
	var config := ConfigFile.new()
	var load_error := config.load(config_path)
	if load_error != OK and load_error != ERR_FILE_NOT_FOUND:
		return load_error

	for key in get_reset_state_keys():
		if config.has_section_key(CONFIG_SECTION, key):
			config.erase_section_key(CONFIG_SECTION, key)

	return config.save(config_path)


func record_event(event_name: String, params: Dictionary = {}) -> void:
	if event_name.strip_edges().is_empty():
		return

	_remember_event(event_name, params)
	if not _active:
		return

	var step := _current_step()
	if step.is_empty():
		return
	if _step_matches_event(step, event_name, params):
		_complete_current_step()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey:
		var key_event := event as InputEventKey
		if key_event.pressed and not key_event.echo and key_event.keycode == KEY_F1:
			reset_saved_state()
			start(true)
			var viewport := get_viewport()
			if viewport != null:
				viewport.set_input_as_handled()


func _load_steps() -> void:
	_steps.clear()
	if not FileAccess.file_exists(DATA_PATH):
		push_warning("TutorialManager cannot find tutorial data at %s." % DATA_PATH)
		return

	var file := FileAccess.open(DATA_PATH, FileAccess.READ)
	if file == null:
		push_warning("TutorialManager cannot open tutorial data at %s." % DATA_PATH)
		return

	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_ARRAY:
		push_warning("TutorialManager tutorial data must be a JSON array.")
		return

	_steps = parsed


func _connect_simulation_signals() -> void:
	if _simulation_core == null:
		return

	_connect_signal_once(_simulation_core, "construction_started", Callable(self, "_on_construction_started"))
	_connect_signal_once(_simulation_core, "construction_completed", Callable(self, "_on_construction_completed"))
	_connect_signal_once(_simulation_core, "resources_updated", Callable(self, "_on_resources_updated"))
	_connect_signal_once(_simulation_core, "alerts_updated", Callable(self, "_on_alerts_updated"))
	_connect_signal_once(_simulation_core, "research_started", Callable(self, "_on_research_started"))


func _connect_signal_once(emitter: Object, signal_name: String, callback: Callable) -> void:
	if emitter == null or not emitter.has_signal(signal_name):
		return
	if not emitter.is_connected(signal_name, callback):
		emitter.connect(signal_name, callback)


func _ensure_overlay() -> void:
	if _overlay != null and is_instance_valid(_overlay):
		return
	if _game_scene == null:
		return

	_overlay = OVERLAY_SCENE.instantiate()
	if _overlay == null:
		push_warning("TutorialManager could not instantiate tutorial overlay.")
		return

	_game_scene.add_child(_overlay)
	_overlay.visible = false
	if not _overlay.next_requested.is_connected(_on_overlay_next_requested):
		_overlay.next_requested.connect(_on_overlay_next_requested)
	if not _overlay.skip_requested.is_connected(_on_overlay_skip_requested):
		_overlay.skip_requested.connect(_on_overlay_skip_requested)


func _reset_runtime_state() -> void:
	_events_seen.clear()
	_buildings_queued_by_id.clear()
	_buildings_completed_by_id.clear()
	_heatmaps_enabled.clear()
	_resources_seen_increase.clear()
	_alerts_seen_by_type.clear()
	_alert_signatures_seen.clear()
	_research_started_by_id.clear()
	_last_resource_values.clear()
	_last_construction_region_id = ""
	_timeout_token += 1


func _stop_tutorial() -> void:
	_active = false
	_timeout_token += 1
	_restore_pause_snapshot()
	if _overlay != null and is_instance_valid(_overlay):
		_overlay.hide_tutorial()


func _show_current_step() -> void:
	if not _active:
		return
	if _current_step_index >= _steps.size():
		complete()
		return

	var step := _current_step()
	if step.is_empty():
		_complete_current_step()
		return

	if _step_already_done(step):
		call_deferred("_complete_current_step")
		return

	_apply_pause_for_step(step)
	_ensure_overlay()
	if _overlay == null:
		return

	var target = _resolve_target(str(step.get("target", "")))
	_overlay.show_step(step, _current_step_index + 1, _steps.size(), target)
	_arm_step_timeout(step)


func _current_step() -> Dictionary:
	if _current_step_index < 0 or _current_step_index >= _steps.size():
		return {}
	var step: Dictionary = _steps[_current_step_index]
	return step


func _complete_current_step() -> void:
	if not _active:
		return

	var step := _current_step()
	if bool(step.get("complete_tutorial", false)):
		complete()
		return

	_current_step_index += 1
	if _current_step_index >= _steps.size():
		complete()
		return
	_show_current_step()


func _arm_step_timeout(step: Dictionary) -> void:
	_timeout_token += 1
	var timeout_seconds := float(step.get("allow_timeout_seconds", 0.0))
	if timeout_seconds <= 0.0:
		return

	var expected_token := _timeout_token
	var timer := get_tree().create_timer(timeout_seconds)
	timer.timeout.connect(func() -> void:
		if _active and expected_token == _timeout_token and _current_step_index < _steps.size():
			_complete_current_step()
	)


func _apply_pause_for_step(step: Dictionary) -> void:
	var should_pause := bool(step.get("pause_simulation", false))
	if should_pause:
		_pause_simulation_for_tutorial()
	elif _paused_by_tutorial:
		_restore_pause_snapshot()


func _pause_simulation_for_tutorial() -> void:
	if _simulation_core == null or not _simulation_core.has_method("set_paused"):
		return
	if not _paused_by_tutorial:
		var summary := _simulation_core.call("get_summary") as Dictionary
		_pause_snapshot = {
			"paused": bool(summary.get("paused", false)),
			"speed": float(summary.get("simulation_speed", 1.0)),
		}
		_paused_by_tutorial = true
	_simulation_core.call("set_paused", true)


func _restore_pause_snapshot() -> void:
	if not _paused_by_tutorial or _simulation_core == null:
		return
	if bool(_pause_snapshot.get("paused", false)):
		if _simulation_core.has_method("set_paused"):
			_simulation_core.call("set_paused", true)
	elif _simulation_core.has_method("set_simulation_speed"):
		_simulation_core.call("set_simulation_speed", maxf(float(_pause_snapshot.get("speed", 1.0)), 1.0))
	_paused_by_tutorial = false
	_pause_snapshot.clear()


func _on_overlay_next_requested() -> void:
	record_event("tutorial_next", {})


func _on_overlay_skip_requested() -> void:
	skip()


func _on_construction_started(region_id: String, building_id: String) -> void:
	record_event("building_queued", {
		"region_id": region_id,
		"building_id": building_id,
	})


func _on_construction_completed(region_id: String, building_id: String) -> void:
	record_event("building_completed", {
		"region_id": region_id,
		"building_id": building_id,
	})


func _on_resources_updated(summary: Dictionary) -> void:
	_track_resource_change(summary, "energy", "energy_produced")
	_track_resource_change(summary, "cooling", "cooling_available")
	_track_resource_change(summary, "researchers", "researchers_available")
	_track_resource_change(summary, "compute", "compute_produced")


func _track_resource_change(summary: Dictionary, resource_id: String, summary_key: String) -> void:
	var next_value := float(summary.get(summary_key, 0.0))
	if not _last_resource_values.has(resource_id):
		_last_resource_values[resource_id] = next_value
		return

	var old_value := float(_last_resource_values.get(resource_id, 0.0))
	_last_resource_values[resource_id] = next_value
	if next_value > old_value + 0.001:
		record_event("resource_changed", {
			"resource_id": resource_id,
			"old_value": old_value,
			"new_value": next_value,
			"direction": "increase",
		})


func _on_alerts_updated(alerts: Array) -> void:
	for alert_variant in alerts:
		var alert: Dictionary = alert_variant
		var signature := "%s|%s|%s|%s" % [
			str(alert.get("title", "")),
			str(alert.get("body", "")),
			str(alert.get("region_id", "")),
			str(alert.get("state", "")),
		]
		if _alert_signatures_seen.has(signature):
			continue
		_alert_signatures_seen[signature] = true
		var alert_type := _alert_type_for(alert)
		record_event("alert_created", {
			"alert_id": signature,
			"alert_type": alert_type,
			"region_id": str(alert.get("region_id", "")),
		})


func _on_research_started(research_id: String) -> void:
	record_event("research_started", {"research_id": research_id})


func _alert_type_for(alert: Dictionary) -> String:
	var text := ("%s %s %s" % [
		str(alert.get("title", "")),
		str(alert.get("body", "")),
		str(alert.get("state", "")),
	]).to_lower()
	if text.contains("research"):
		return "researcher_shortage"
	if text.contains("cooling") or text.contains("froid"):
		return "cooling_deficit"
	if text.contains("energy") or text.contains("blackout") or text.contains("power"):
		return "energy_deficit"
	return str(alert.get("state", "generic"))


func _remember_event(event_name: String, params: Dictionary) -> void:
	_events_seen[event_name] = true
	match event_name:
		"build_menu_category_opened":
			var category_id := str(params.get("category_id", ""))
			if not category_id.is_empty():
				_events_seen["%s:%s" % [event_name, category_id]] = true
		"building_queued":
			var building_id := str(params.get("building_id", ""))
			if not building_id.is_empty():
				_buildings_queued_by_id[building_id] = true
			_last_construction_region_id = str(params.get("region_id", _last_construction_region_id))
		"building_completed":
			var building_id := str(params.get("building_id", ""))
			if not building_id.is_empty():
				_buildings_completed_by_id[building_id] = true
			_last_construction_region_id = str(params.get("region_id", _last_construction_region_id))
		"heatmap_enabled":
			var heatmap_id := str(params.get("heatmap_id", ""))
			if not heatmap_id.is_empty() and heatmap_id != "none":
				_heatmaps_enabled[heatmap_id] = true
		"resource_changed":
			if str(params.get("direction", "")) == "increase":
				var resource_id := str(params.get("resource_id", ""))
				if not resource_id.is_empty():
					_resources_seen_increase[resource_id] = true
		"alert_created":
			var alert_type := str(params.get("alert_type", ""))
			if not alert_type.is_empty():
				_alerts_seen_by_type[alert_type] = true
		"research_started":
			var research_id := str(params.get("research_id", ""))
			if not research_id.is_empty():
				_research_started_by_id[research_id] = true


func _step_matches_event(step: Dictionary, event_name: String, params: Dictionary) -> bool:
	var required_event := str(step.get("required_event", ""))
	if event_name == required_event and _step_params_match(step, params, false):
		return true

	var alternative_event := str(step.get("allow_alternative_event", ""))
	if not alternative_event.is_empty() and event_name == alternative_event:
		return _step_params_match(step, params, true)

	return false


func _step_params_match(step: Dictionary, params: Dictionary, alternative: bool) -> bool:
	var required_params: Dictionary = step.get("alternative_params", {}) if alternative else step.get("required_params", {})
	for key in required_params.keys():
		if not params.has(key):
			return false
		if str(params.get(key, "")) != str(required_params.get(key, "")):
			return false

	if step.has("accepted_building_ids"):
		if params.has("building_id"):
			var building_id := str(params.get("building_id", ""))
			if not _array_contains_string(step.get("accepted_building_ids", []), building_id):
				return false
		elif not params.has("research_id"):
			return false

	if step.has("accepted_alert_types"):
		var alert_type := str(params.get("alert_type", ""))
		if not _array_contains_string(step.get("accepted_alert_types", []), alert_type):
			return false

	if step.has("accepted_research_ids"):
		if params.has("research_id"):
			var research_id := str(params.get("research_id", ""))
			if not _array_contains_string(step.get("accepted_research_ids", []), research_id):
				return false
		elif not params.has("building_id"):
			return false

	return true


func _step_already_done(step: Dictionary) -> bool:
	var required_event := str(step.get("required_event", ""))
	if required_event == "tutorial_next":
		return false

	match required_event:
		"region_selected":
			return _events_seen.has("region_selected")
		"building_queued":
			if step.has("accepted_building_ids"):
				if _any_key_seen(step.get("accepted_building_ids", []), _buildings_queued_by_id):
					return true
				return _alternative_already_done(step)
			var params: Dictionary = step.get("required_params", {})
			if _buildings_queued_by_id.has(str(params.get("building_id", ""))):
				return true
			return _alternative_already_done(step)
		"building_completed":
			var params: Dictionary = step.get("required_params", {})
			return _buildings_completed_by_id.has(str(params.get("building_id", "")))
		"heatmap_enabled":
			var params: Dictionary = step.get("required_params", {})
			if _heatmaps_enabled.has(str(params.get("heatmap_id", ""))):
				return true
			var alternative_event := str(step.get("allow_alternative_event", ""))
			if alternative_event == "build_menu_category_opened":
				var alternative_params: Dictionary = step.get("alternative_params", {})
				return _events_seen.has("%s:%s" % [alternative_event, str(alternative_params.get("category_id", ""))])
		"resource_changed":
			var params: Dictionary = step.get("required_params", {})
			return _resources_seen_increase.has(str(params.get("resource_id", "")))
		"alert_created":
			return _any_key_seen(step.get("accepted_alert_types", []), _alerts_seen_by_type)
		"research_started":
			if step.has("accepted_research_ids"):
				return _any_key_seen(step.get("accepted_research_ids", []), _research_started_by_id)
			return not _research_started_by_id.is_empty()

	return _alternative_already_done(step)


func _alternative_already_done(step: Dictionary) -> bool:
	var alternative_event := str(step.get("allow_alternative_event", ""))
	match alternative_event:
		"research_started":
			if step.has("accepted_research_ids"):
				return _any_key_seen(step.get("accepted_research_ids", []), _research_started_by_id)
			return not _research_started_by_id.is_empty()
	return false


func _any_key_seen(keys: Array, seen: Dictionary) -> bool:
	for key in keys:
		if seen.has(str(key)):
			return true
	return false


func _array_contains_string(values: Array, needle: String) -> bool:
	for value in values:
		if str(value) == needle:
			return true
	return false


func _resolve_target(target_id: String) -> Variant:
	if target_id.is_empty():
		return _fallback_rect()
	if _targets.has(target_id):
		var direct = _targets[target_id]
		if direct is Node and is_instance_valid(direct):
			return direct

	var context := _target_context()
	for target_variant in _targets.values():
		if not (target_variant is Object):
			continue
		var target_object := target_variant as Object
		if target_object.has_method("prepare_tutorial_target"):
			target_object.call("prepare_tutorial_target", target_id)
		if target_object.has_method("get_tutorial_target_node"):
			var node = target_object.call("get_tutorial_target_node", target_id)
			if node is Node and is_instance_valid(node):
				return node
		if target_object.has_method("get_tutorial_target_rect"):
			var rect = target_object.call("get_tutorial_target_rect", target_id, context)
			if rect is Rect2 and rect.size.x > 0.0 and rect.size.y > 0.0:
				return rect

	return _fallback_rect()


func _target_context() -> Dictionary:
	var selected_region_id := ""
	if _simulation_core != null and _simulation_core.has_method("get_summary"):
		var summary := _simulation_core.call("get_summary") as Dictionary
		selected_region_id = str(summary.get("selected_region_id", ""))
	return {
		"recommended_region_id": DEFAULT_RECOMMENDED_REGION,
		"selected_region_id": selected_region_id,
		"last_construction_region_id": _last_construction_region_id,
	}


func _fallback_rect() -> Rect2:
	if _game_scene == null:
		return Rect2(Vector2(700.0, 360.0), Vector2(200.0, 120.0))
	var screen_size := _game_scene.size
	return Rect2(screen_size * 0.5 - Vector2(100.0, 60.0), Vector2(200.0, 120.0))


func _save_flag(key: String, value: bool) -> void:
	var config := ConfigFile.new()
	config.load(CONFIG_PATH)
	config.set_value(CONFIG_SECTION, key, value)
	var error := config.save(CONFIG_PATH)
	if error != OK:
		push_warning("TutorialManager could not save %s. Error code: %d." % [key, error])
