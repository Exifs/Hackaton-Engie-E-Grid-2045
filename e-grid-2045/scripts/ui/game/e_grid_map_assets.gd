extends RefCounted
class_name EGridMapAssets

const E_GRID_RUNTIME_TEXTURE_LOADER := preload("res://scripts/ui/components/e_grid_runtime_texture_loader.gd")

const EMPTY_REGION_ID := 0

static var _asset_cache: Dictionary = {}

var backdrop_texture: Texture2D
var mask_image: Image
var image_size := Vector2.ZERO
var regions: Array[Dictionary] = []
var regions_by_id: Dictionary = {}


static func load_cached(backdrop_path: String, contours_path: String, mask_path: String) -> EGridMapAssets:
	var cache_key := "%s|%s|%s" % [backdrop_path, contours_path, mask_path]
	if _asset_cache.has(cache_key):
		return _asset_cache[cache_key]

	var assets := EGridMapAssets.new()
	assets.load_from_paths(backdrop_path, contours_path, mask_path)
	if assets.is_valid():
		_asset_cache[cache_key] = assets
	return assets


static func clear_cache_for_tests() -> void:
	_asset_cache.clear()


func load_from_paths(backdrop_path: String, contours_path: String, mask_path: String) -> RefCounted:
	backdrop_texture = E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(backdrop_path)
	_load_mask(mask_path)
	_load_contours(contours_path)
	_resolve_image_size()
	return self


func is_valid() -> bool:
	return image_size.x > 0.0 and image_size.y > 0.0 and not regions.is_empty()


func get_region(region_id: int) -> Dictionary:
	var region = regions_by_id.get(region_id, {})
	return region if typeof(region) == TYPE_DICTIONARY else {}


func pick_region_id(image_position: Vector2) -> int:
	var mask_region_id := _pick_region_id_from_mask(image_position)
	if mask_region_id != EMPTY_REGION_ID:
		return mask_region_id

	return _pick_region_id_from_contours(image_position)


func _pick_region_id_from_contours(image_position: Vector2) -> int:
	for index in range(regions.size() - 1, -1, -1):
		var region := regions[index]
		var bounds: Rect2 = region.get("bounds", Rect2())
		if bounds.size != Vector2.ZERO and not bounds.has_point(image_position):
			continue

		var components = region.get("components", [])
		if typeof(components) != TYPE_ARRAY:
			continue

		for component in components:
			if component is PackedVector2Array and _contains_point(component, image_position):
				return int(region.get("id", EMPTY_REGION_ID))

	return EMPTY_REGION_ID


func _pick_region_id_from_mask(image_position: Vector2) -> int:
	if mask_image == null or mask_image.is_empty():
		return EMPTY_REGION_ID

	var width := mask_image.get_width()
	var height := mask_image.get_height()
	if width <= 0 or height <= 0:
		return EMPTY_REGION_ID

	if image_position.x < 0.0 or image_position.y < 0.0:
		return EMPTY_REGION_ID
	if image_position.x >= float(width) or image_position.y >= float(height):
		return EMPTY_REGION_ID

	var pixel := Vector2i(
		clampi(floori(image_position.x), 0, width - 1),
		clampi(floori(image_position.y), 0, height - 1)
	)
	var color := mask_image.get_pixelv(pixel)
	return clampi(roundi(color.r * 255.0), EMPTY_REGION_ID, 255)


func _contains_point(component: PackedVector2Array, point: Vector2) -> bool:
	if component.size() < 3:
		return false

	var inside := false
	var previous_index := component.size() - 1
	for index in range(component.size()):
		var current := component[index]
		var previous := component[previous_index]
		var crosses_y := (current.y > point.y) != (previous.y > point.y)
		if crosses_y:
			var intersection_x := ((previous.x - current.x) * (point.y - current.y) / (previous.y - current.y)) + current.x
			if point.x < intersection_x:
				inside = not inside
		previous_index = index

	return inside


func _load_mask(mask_path: String) -> void:
	if mask_path.is_empty():
		return

	var mask_texture := E_GRID_RUNTIME_TEXTURE_LOADER.load_texture(mask_path)
	if mask_texture != null:
		mask_image = mask_texture.get_image()
		if mask_image != null and not mask_image.is_empty():
			return

	var image := Image.new()
	var error := image.load(mask_path)
	if error == OK:
		mask_image = image


func _load_contours(contours_path: String) -> void:
	if contours_path.is_empty():
		push_error("Missing E-Grid map contours path.")
		return

	if not FileAccess.file_exists(contours_path):
		push_error("Missing E-Grid map contours: %s" % contours_path)
		return

	var file := FileAccess.open(contours_path, FileAccess.READ)
	if file == null:
		push_error("Unable to open E-Grid map contours: %s" % contours_path)
		return

	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Invalid E-Grid map contours JSON: %s" % contours_path)
		return

	var parsed_size := _parse_size(parsed.get("image_size", []))
	if parsed_size != Vector2.ZERO:
		image_size = parsed_size

	var raw_regions = parsed.get("regions", {})
	if typeof(raw_regions) != TYPE_DICTIONARY:
		push_error("E-Grid map contours have no regions dictionary: %s" % contours_path)
		return

	regions.clear()
	regions_by_id.clear()
	for slug_key in raw_regions.keys():
		var raw_region = raw_regions.get(slug_key, {})
		if typeof(raw_region) != TYPE_DICTIONARY:
			continue

		var region_id := int(raw_region.get("id", EMPTY_REGION_ID))
		if region_id <= EMPTY_REGION_ID:
			continue

		var components := _parse_components(raw_region.get("components", []))
		if components.is_empty():
			continue

		var region := {
			"id": region_id,
			"slug": str(raw_region.get("slug", slug_key)),
			"display_name": str(raw_region.get("display_name", slug_key)),
			"components": components,
			"bounds": _compute_bounds(components),
			"centroid": _parse_point(raw_region.get("centroid", [])),
			"label_point": _parse_point(raw_region.get("label_point", [])),
			"point_count": int(raw_region.get("point_count", 0)),
		}
		regions.append(region)
		regions_by_id[region_id] = region


func _resolve_image_size() -> void:
	if image_size != Vector2.ZERO:
		return

	if backdrop_texture != null:
		image_size = Vector2(backdrop_texture.get_width(), backdrop_texture.get_height())
		return

	if mask_image != null and not mask_image.is_empty():
		image_size = Vector2(mask_image.get_width(), mask_image.get_height())


func _parse_components(raw_components: Variant) -> Array[PackedVector2Array]:
	var parsed_components: Array[PackedVector2Array] = []
	if typeof(raw_components) != TYPE_ARRAY:
		return parsed_components

	for raw_component in raw_components:
		if typeof(raw_component) != TYPE_ARRAY:
			continue

		var component := PackedVector2Array()
		for raw_point in raw_component:
			if typeof(raw_point) != TYPE_ARRAY or raw_point.size() < 2:
				continue
			component.append(Vector2(float(raw_point[0]), float(raw_point[1])))

		if component.size() >= 3:
			parsed_components.append(component)

	return parsed_components


func _compute_bounds(components: Array[PackedVector2Array]) -> Rect2:
	var initialized := false
	var min_point := Vector2.ZERO
	var max_point := Vector2.ZERO

	for component in components:
		for point in component:
			if not initialized:
				min_point = point
				max_point = point
				initialized = true
			else:
				min_point.x = minf(min_point.x, point.x)
				min_point.y = minf(min_point.y, point.y)
				max_point.x = maxf(max_point.x, point.x)
				max_point.y = maxf(max_point.y, point.y)

	if not initialized:
		return Rect2()

	return Rect2(min_point, max_point - min_point).grow(1.0)


func _parse_size(raw_size: Variant) -> Vector2:
	if typeof(raw_size) != TYPE_ARRAY or raw_size.size() < 2:
		return Vector2.ZERO

	var width := float(raw_size[0])
	var height := float(raw_size[1])
	if width <= 0.0 or height <= 0.0:
		return Vector2.ZERO

	return Vector2(width, height)


func _parse_point(raw_point: Variant) -> Vector2:
	if typeof(raw_point) != TYPE_ARRAY or raw_point.size() < 2:
		return Vector2.ZERO

	return Vector2(float(raw_point[0]), float(raw_point[1]))
