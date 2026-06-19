@tool
class_name EGridRuntimeTextureLoader
extends RefCounted

static var _texture_cache: Dictionary = {}


static func load_texture(texture_path: String) -> Texture2D:
	if texture_path.is_empty():
		return null

	if _texture_cache.has(texture_path):
		return _texture_cache[texture_path]

	var imported_texture := ResourceLoader.load(texture_path, "Texture2D") as Texture2D
	if imported_texture == null:
		push_error("Unable to load runtime texture through Godot import cache: %s" % texture_path)
		return null

	_texture_cache[texture_path] = imported_texture
	return imported_texture


static func clear_cache_for_tests() -> void:
	_texture_cache.clear()
