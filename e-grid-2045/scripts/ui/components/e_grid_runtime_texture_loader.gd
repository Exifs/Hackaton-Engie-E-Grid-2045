@tool
class_name EGridRuntimeTextureLoader
extends RefCounted

static var _texture_cache: Dictionary = {}


static func load_texture(texture_path: String) -> Texture2D:
	if _texture_cache.has(texture_path):
		return _texture_cache[texture_path]

	if texture_path.get_extension().to_lower() != "png":
		var imported_texture := load(texture_path) as Texture2D
		if imported_texture != null:
			_texture_cache[texture_path] = imported_texture
			return imported_texture

	var image := Image.new()
	var error := image.load(ProjectSettings.globalize_path(texture_path))
	if error != OK:
		var imported_texture := load(texture_path) as Texture2D
		if imported_texture != null:
			_texture_cache[texture_path] = imported_texture
			return imported_texture

		push_error("Unable to load runtime texture: %s" % texture_path)
		return null

	var texture := ImageTexture.create_from_image(image)
	_texture_cache[texture_path] = texture
	return texture
