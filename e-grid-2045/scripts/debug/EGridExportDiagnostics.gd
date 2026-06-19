extends RefCounted
class_name EGridExportDiagnostics

const FEATURE_FLAG := "egrid_export_diagnostics"
const USER_ARG := "--egrid-export-diagnostics"
const PREFIX := "[EGridExportDiagnostics]"


static func is_enabled() -> bool:
	if OS.has_feature(FEATURE_FLAG):
		return true

	for argument in OS.get_cmdline_user_args():
		if str(argument) == USER_ARG:
			return true

	return false


static func log_data_snapshot(data: Dictionary) -> void:
	if not is_enabled():
		return

	var buildings: Dictionary = data.get("buildings", {})
	var counts := {}
	for building_id in buildings.keys():
		var definition: Dictionary = buildings[building_id]
		var category := str(definition.get("category", ""))
		counts[category] = int(counts.get(category, 0)) + 1

	_log("data buildings=%d categories=%s" % [buildings.size(), JSON.stringify(counts)])


static func log_game_scene(game_scene: Control, simulation_core: Node, build_palette: Control) -> void:
	if not is_enabled():
		return

	var summary := {}
	var buildings := {}
	if simulation_core != null and simulation_core.has_method("get_summary"):
		summary = simulation_core.call("get_summary") as Dictionary
	if simulation_core != null and simulation_core.has_method("get_building_definitions"):
		buildings = simulation_core.call("get_building_definitions") as Dictionary

	_log("game_scene size=%s buildings=%d selected_region=%s" % [
		_vector_to_string(game_scene.size if game_scene != null else Vector2.ZERO),
		buildings.size(),
		str(summary.get("selected_region_id", "")),
	])
	log_palette("game_scene", build_palette)


static func log_palette(context: String, palette: Control) -> void:
	if not is_enabled():
		return

	if palette == null or not is_instance_valid(palette):
		_log("%s palette=null" % context)
		return

	if palette.has_method("get_export_diagnostics_snapshot"):
		_log("%s palette=%s" % [context, JSON.stringify(palette.call("get_export_diagnostics_snapshot"))])
		return

	_log("%s palette_rect=%s" % [context, _rect_to_string(palette.get_global_rect())])


static func log_tutorial_target(target_id: String, target: Variant, palette: Variant = null) -> void:
	if not is_enabled():
		return

	var target_description := _target_to_string(target)
	var palette_state := ""
	if palette is Control and target is Control:
		var palette_rect := (palette as Control).get_global_rect().grow(1.0)
		var target_rect := (target as Control).get_global_rect()
		palette_state = " palette_rect=%s inside_palette=%s" % [
			_rect_to_string((palette as Control).get_global_rect()),
			str(_rect_contains(palette_rect, target_rect)),
		]

	_log("tutorial_target id=%s target=%s%s" % [target_id, target_description, palette_state])


static func log_tutorial_target_rejected(target_id: String, target: Variant, palette: Control) -> void:
	if not is_enabled():
		return

	var palette_rect := palette.get_global_rect() if palette != null else Rect2()
	_log("tutorial_target_rejected id=%s target=%s palette_rect=%s" % [
		target_id,
		_target_to_string(target),
		_rect_to_string(palette_rect),
	])


static func log_tutorial_fallback(target_id: String, fallback: Rect2) -> void:
	if not is_enabled():
		return

	_log("tutorial_target_fallback id=%s rect=%s" % [target_id, _rect_to_string(fallback)])


static func _target_to_string(target: Variant) -> String:
	if target is Control:
		var control := target as Control
		if is_instance_valid(control):
			return "Control(path=%s visible=%s rect=%s)" % [
				str(control.get_path()),
				str(control.is_visible_in_tree()),
				_rect_to_string(control.get_global_rect()),
			]
	if target is CanvasItem:
		var item := target as CanvasItem
		if is_instance_valid(item):
			return "CanvasItem(path=%s visible=%s)" % [str(item.get_path()), str(item.is_visible_in_tree())]
	if target is Rect2:
		return "Rect2(%s)" % _rect_to_string(target)
	if target is Vector2:
		return "Vector2(%s)" % _vector_to_string(target)
	return str(target)


static func _rect_contains(outer: Rect2, inner: Rect2) -> bool:
	return (
		inner.position.x >= outer.position.x
		and inner.position.y >= outer.position.y
		and inner.end.x <= outer.end.x
		and inner.end.y <= outer.end.y
	)


static func _rect_to_string(rect: Rect2) -> String:
	return "{pos=%s,size=%s}" % [_vector_to_string(rect.position), _vector_to_string(rect.size)]


static func _vector_to_string(vector: Vector2) -> String:
	return "(%.1f,%.1f)" % [vector.x, vector.y]


static func _log(message: String) -> void:
	print("%s %s" % [PREFIX, message])
