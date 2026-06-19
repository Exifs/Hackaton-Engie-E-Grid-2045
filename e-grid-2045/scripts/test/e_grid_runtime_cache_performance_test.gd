extends SceneTree

const DATA_LOADER := preload("res://scripts/simulation/DataLoader.gd")
const E_GRID_MAP_ASSETS := preload("res://scripts/ui/game/e_grid_map_assets.gd")
const E_GRID_RUNTIME_TEXTURE_LOADER := preload("res://scripts/ui/components/e_grid_runtime_texture_loader.gd")

const GAME_MAP_BACKDROP_PATH := "res://assets/map/europe_map_backdrop_generated_clean_v1.png"
const GAME_MAP_CONTOURS_PATH := "res://assets/map/generated/regions_contours.json"
const GAME_MAP_MASK_PATH := "res://assets/map/generated/region_id_mask.png"

const MAX_DATA_WARM_RATIO := 1.10
const MAX_MAP_WARM_RATIO := 0.35


func _init() -> void:
	_clear_runtime_caches()

	var data_cold := _measure_data_load_usec()
	var data_warm := _measure_data_load_usec()
	if float(data_warm) > float(data_cold) * MAX_DATA_WARM_RATIO:
		_fail("Warm data load did not improve enough: cold=%d warm=%d." % [data_cold, data_warm])
		return

	var map_cold := _measure_map_load_usec()
	var map_warm := _measure_map_load_usec()
	if float(map_warm) > float(map_cold) * MAX_MAP_WARM_RATIO:
		_fail("Warm map asset load did not improve enough: cold=%d warm=%d." % [map_cold, map_warm])
		return

	print("E-Grid runtime cache performance test passed. data_cold_usec=%d data_warm_usec=%d map_cold_usec=%d map_warm_usec=%d" % [
		data_cold,
		data_warm,
		map_cold,
		map_warm,
	])
	_clear_runtime_caches()
	quit(0)


func _measure_data_load_usec() -> int:
	var loader := DATA_LOADER.new()
	var started := Time.get_ticks_usec()
	var data := loader.load_game_data()
	var elapsed := Time.get_ticks_usec() - started
	if data.is_empty():
		_fail("Data loader returned no data.")
	return elapsed


func _measure_map_load_usec() -> int:
	var started := Time.get_ticks_usec()
	var assets := E_GRID_MAP_ASSETS.load_cached(GAME_MAP_BACKDROP_PATH, GAME_MAP_CONTOURS_PATH, GAME_MAP_MASK_PATH)
	var elapsed := Time.get_ticks_usec() - started
	if assets == null or not assets.is_valid():
		_fail("Map assets did not load.")
	return elapsed


func _fail(message: String) -> void:
	push_error(message)
	quit(1)


func _clear_runtime_caches() -> void:
	DATA_LOADER.clear_cache_for_tests()
	E_GRID_MAP_ASSETS.clear_cache_for_tests()
	E_GRID_RUNTIME_TEXTURE_LOADER.clear_cache_for_tests()
