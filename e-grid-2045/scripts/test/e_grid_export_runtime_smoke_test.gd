extends SceneTree

const DATA_LOADER := preload("res://scripts/simulation/DataLoader.gd")
const EXPORT_DIAGNOSTICS := preload("res://scripts/debug/EGridExportDiagnostics.gd")
const GAME_SCENE := preload("res://scenes/game/game_scene.tscn")

const REQUIRED_FILES := [
	"res://data/buildings.csv",
	"res://data/tutorial_first_loop.json",
]
const REQUIRED_RESOURCES := [
	"res://scenes/ui/game/e_grid_build_palette.tscn",
	"res://scenes/ui/tutorial/TutorialOverlay.tscn",
	"res://scripts/ui/game/e_grid_build_palette.gd",
	"res://scripts/tutorial/TutorialManager.gd",
	"res://scripts/ui/tutorial/TutorialHighlighter.gd",
	"res://scripts/ui/tutorial/TutorialOverlay.gd",
]
const EXPECTED_BUILD_TARGETS := [
	"build_menu.cooling_overlay_button",
	"build_menu.river_cooling_button",
	"build_menu.datacenter_button",
	"build_menu.ai_research_center_button",
]
const EXPECTED_BUILD_TARGET_IDS := {
	"build_menu.river_cooling_button": "river_cooling",
	"build_menu.datacenter_button": "datacenter_standard",
	"build_menu.ai_research_center_button": "ai_research_center",
}
const COOLING_OVERLAY_PATH_SUFFIX := "ContentMargin/PaletteStack/OverlayPanel/CongestionRow/CongestionCheck"
const EXPECTED_COOLING_BUILDINGS := [
	"air_cooling",
	"river_cooling",
	"sea_cooling",
]
const CATEGORIES_SCROLL_PATH := "ContentMargin/PaletteStack/CategoriesScroll"
const GAME_BUILD_PALETTE_PATH := "SafeArea/Root/MainRow/BuildPalette"

var _failures: Array[String] = []
var _buildings := {}


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	root.size = Vector2i(1280, 720)
	_validate_exported_resources()
	_validate_exported_data()
	await _validate_exported_game_scene()
	_report()


func _validate_exported_resources() -> void:
	for path in REQUIRED_FILES:
		if not FileAccess.file_exists(path):
			_failures.append("Export is missing required data file: %s" % path)

	for path in REQUIRED_RESOURCES:
		if not ResourceLoader.exists(path):
			_failures.append("Export is missing required resource: %s" % path)


func _validate_exported_data() -> void:
	var loader = DATA_LOADER.new()
	var data: Dictionary = loader.load_game_data()
	EXPORT_DIAGNOSTICS.log_data_snapshot(data)

	_buildings = data.get("buildings", {})
	if _buildings.is_empty():
		_failures.append("Exported DataLoader returned no buildings")
		return

	var counts := _building_counts_by_category(_buildings)
	if int(counts.get("energy", 0)) != 6:
		_failures.append("Exported energy building count mismatch: expected 6, got %d" % int(counts.get("energy", 0)))
	if int(counts.get("cooling", 0)) < EXPECTED_COOLING_BUILDINGS.size():
		_failures.append("Exported cooling building count is too low: %d" % int(counts.get("cooling", 0)))

	for building_id in EXPECTED_COOLING_BUILDINGS:
		if not _buildings.has(building_id):
			_failures.append("Exported building data is missing %s" % building_id)


func _validate_exported_game_scene() -> void:
	var game_scene := GAME_SCENE.instantiate() as Control
	if game_scene == null:
		_failures.append("Unable to instantiate exported game scene")
		return

	root.add_child(game_scene)
	for _index in range(10):
		await process_frame

	var palette := game_scene.get_node_or_null(GAME_BUILD_PALETTE_PATH) as Control
	if palette == null:
		_failures.append("Exported game scene build palette is missing")
		_cleanup_scene(game_scene)
		return

	EXPORT_DIAGNOSTICS.log_palette("export_runtime_smoke", palette)
	_validate_palette_snapshot(palette)

	var manager := game_scene.get_node_or_null("TutorialManager")
	if manager == null:
		_failures.append("Exported game scene tutorial manager is missing")
		_cleanup_scene(game_scene)
		return

	for target_id in EXPECTED_BUILD_TARGETS:
		var target = manager.call("_resolve_target", target_id)
		await process_frame
		if target is Control and is_instance_valid(target):
			target = manager.call("_resolve_target", target_id)
			await process_frame
		_validate_tutorial_target(target_id, palette, target)

	_cleanup_scene(game_scene)


func _validate_palette_snapshot(palette: Control) -> void:
	if not palette.has_method("get_export_diagnostics_snapshot"):
		_failures.append("Build palette does not expose export diagnostics snapshot")
		return

	var snapshot: Dictionary = palette.call("get_export_diagnostics_snapshot")
	var categories: Dictionary = snapshot.get("categories", {})
	var counts := _building_counts_by_category(_buildings)

	for category_id in counts.keys():
		var category: Dictionary = categories.get(category_id, {})
		var visible_count := int(category.get("visible_count", -1))
		var expected_count := int(counts.get(category_id, 0))
		if visible_count != expected_count:
			_failures.append("Exported palette category %s visible count mismatch: expected %d, got %d" % [category_id, expected_count, visible_count])

	var cooling: Dictionary = categories.get("cooling", {})
	var cooling_ids: Array = cooling.get("ids", [])
	for building_id in EXPECTED_COOLING_BUILDINGS:
		if not cooling_ids.has(building_id):
			_failures.append("Exported cooling palette is missing button id %s" % building_id)


func _validate_tutorial_target(target_id: String, palette: Control, target: Variant) -> void:
	if target is Rect2:
		_failures.append("Exported tutorial target fell back to a map/rect highlight: %s" % target_id)
		return
	if not (target is Control) or not is_instance_valid(target):
		_failures.append("Exported tutorial target did not resolve to Control: %s" % target_id)
		return

	var control := target as Control
	if not control.is_visible_in_tree():
		_failures.append("Exported tutorial target is not visible: %s" % target_id)
		return

	var target_rect := control.get_global_rect()
	if target_rect.size.x <= 0.0 or target_rect.size.y <= 0.0:
		_failures.append("Exported tutorial target has non-positive bounds: %s" % target_id)
		return

	if not _rect_contains(palette.get_global_rect().grow(1.0), target_rect):
		_failures.append("Exported tutorial target is outside build palette bounds: %s" % target_id)

	if EXPECTED_BUILD_TARGET_IDS.has(target_id):
		var expected_building_id := str(EXPECTED_BUILD_TARGET_IDS[target_id])
		var actual_building_id := str(control.get_meta("tutorial_building_id", ""))
		if actual_building_id != expected_building_id:
			_failures.append("Exported tutorial target %s resolved to %s instead of %s" % [target_id, actual_building_id, expected_building_id])

	if target_id == "build_menu.cooling_overlay_button" and not str(control.get_path()).ends_with(COOLING_OVERLAY_PATH_SUFFIX):
		_failures.append("Exported cooling overlay tutorial target resolved to unexpected path: %s" % str(control.get_path()))

	var scroll := palette.get_node_or_null(CATEGORIES_SCROLL_PATH) as ScrollContainer
	if scroll != null and scroll.is_ancestor_of(control):
		if not _rect_contains(scroll.get_global_rect().grow(1.0), target_rect):
			_failures.append("Exported tutorial target is outside build palette scroll viewport: %s" % target_id)


func _building_counts_by_category(buildings: Dictionary) -> Dictionary:
	var counts := {}
	for building_id in buildings.keys():
		var definition: Dictionary = buildings[building_id]
		var category := str(definition.get("category", "grid"))
		if category == "storage":
			category = "grid"
		counts[category] = int(counts.get(category, 0)) + 1
	return counts


func _cleanup_scene(game_scene: Control) -> void:
	root.remove_child(game_scene)
	game_scene.free()


func _rect_contains(outer: Rect2, inner: Rect2) -> bool:
	return (
		inner.position.x >= outer.position.x
		and inner.position.y >= outer.position.y
		and inner.end.x <= outer.end.x
		and inner.end.y <= outer.end.y
	)


func _report() -> void:
	if _failures.is_empty():
		print("E-Grid export runtime smoke test passed.")
		quit(0)
		return

	for failure in _failures:
		push_error(failure)
	quit(1)
