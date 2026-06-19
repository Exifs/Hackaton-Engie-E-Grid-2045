@tool
class_name EGridUIAtlas
extends RefCounted

const PACK_ROOT := "res://assets/ui/components/egrid_2045_ui_component_pack_concept_v3"
const MANIFEST_PATH := PACK_ROOT + "/manifest/egrid_ui_components_concept_v3_manifest.json"

static var _manifest_cache: Dictionary = {}
static var _texture_cache: Dictionary = {}
static var _spritesheet_cache: Dictionary = {}


static func get_manifest() -> Dictionary:
	if not _manifest_cache.is_empty():
		return _manifest_cache

	if not FileAccess.file_exists(MANIFEST_PATH):
		push_error("Missing E-Grid UI manifest: %s" % MANIFEST_PATH)
		return {}

	var file := FileAccess.open(MANIFEST_PATH, FileAccess.READ)
	if file == null:
		push_error("Unable to open E-Grid UI manifest: %s" % MANIFEST_PATH)
		return {}

	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Invalid E-Grid UI manifest JSON: %s" % MANIFEST_PATH)
		return {}

	_manifest_cache = parsed
	return _manifest_cache


static func get_component(component_name: String) -> Dictionary:
	var manifest := get_manifest()
	var components = manifest.get("components", {})

	if typeof(components) != TYPE_DICTIONARY:
		return {}

	if not components.has(component_name):
		push_warning("Unknown E-Grid UI component: %s" % component_name)
		return {}

	var component = components.get(component_name, {})
	return component if typeof(component) == TYPE_DICTIONARY else {}


static func get_states(component_name: String) -> PackedStringArray:
	var result := PackedStringArray()
	var component := get_component(component_name)
	var states = component.get("states", [])

	if typeof(states) != TYPE_ARRAY:
		return result

	for state in states:
		result.append(str(state))

	return result


static func has_state(component_name: String, state_name: String) -> bool:
	return get_states(component_name).has(state_name)


static func get_cell_size(component_name: String) -> Vector2i:
	var component := get_component(component_name)
	var cell_size = component.get("cell_size_px", [])

	if typeof(cell_size) != TYPE_ARRAY or cell_size.size() < 2:
		return Vector2i.ZERO

	return Vector2i(int(cell_size[0]), int(cell_size[1]))


static func get_frame(component_name: String, state_name: String) -> Dictionary:
	var component := get_component(component_name)
	var frames = component.get("frames", [])

	if typeof(frames) != TYPE_ARRAY:
		return {}

	for frame in frames:
		if typeof(frame) == TYPE_DICTIONARY and str(frame.get("state", "")) == state_name:
			return frame

	if frames.size() > 0 and typeof(frames[0]) == TYPE_DICTIONARY:
		push_warning("State '%s' not found for '%s', using first frame." % [state_name, component_name])
		return frames[0]

	return {}


static func get_texture(component_name: String, state_name: String) -> Texture2D:
	var cache_key := "%s|%s" % [component_name, state_name]

	if _texture_cache.has(cache_key):
		return _texture_cache[cache_key]

	var component := get_component(component_name)
	var frame := get_frame(component_name, state_name)

	if component.is_empty() or frame.is_empty():
		return null

	var spritesheet := str(component.get("spritesheet", ""))
	var texture_path := "%s/%s" % [PACK_ROOT, spritesheet]
	var sheet := _load_spritesheet(texture_path)

	if sheet == null:
		push_error("Unable to load E-Grid UI spritesheet: %s" % texture_path)
		return null

	var texture := AtlasTexture.new()
	texture.atlas = sheet
	texture.region = Rect2(
		float(frame.get("x", 0)),
		float(frame.get("y", 0)),
		float(frame.get("w", sheet.get_width())),
		float(frame.get("h", sheet.get_height()))
	)

	_texture_cache[cache_key] = texture
	return texture


static func get_first_available_state(component_name: String, preferred_states: Array) -> String:
	var states := get_states(component_name)

	for state in preferred_states:
		if states.has(state):
			return state

	return states[0] if states.size() > 0 else ""


static func get_aspect_fit_rect(component_name: String, target_size: Vector2) -> Rect2:
	var cell_size := get_cell_size(component_name)

	if cell_size == Vector2i.ZERO or target_size.x <= 0.0 or target_size.y <= 0.0:
		return Rect2(Vector2.ZERO, target_size)

	var source_size := Vector2(cell_size)
	var scale := minf(target_size.x / source_size.x, target_size.y / source_size.y)
	var fitted_size := source_size * scale
	return Rect2((target_size - fitted_size) * 0.5, fitted_size)


static func _load_spritesheet(texture_path: String) -> Texture2D:
	if _spritesheet_cache.has(texture_path):
		return _spritesheet_cache[texture_path]

	var imported_texture := ResourceLoader.load(texture_path, "Texture2D") as Texture2D
	if imported_texture != null:
		_spritesheet_cache[texture_path] = imported_texture
		return imported_texture

	return null


static func clear_cache_for_tests() -> void:
	_manifest_cache.clear()
	_texture_cache.clear()
	_spritesheet_cache.clear()
