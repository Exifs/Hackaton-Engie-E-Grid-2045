class_name EGridSceneTransition
extends RefCounted


static func change_scene(owner: Node, scene_path: String, loading_text := "CHARGEMENT") -> int:
	if owner == null or owner.get_tree() == null:
		return ERR_UNCONFIGURED

	if scene_path.strip_edges().is_empty() or not ResourceLoader.exists(scene_path):
		return ERR_FILE_NOT_FOUND

	var tree := owner.get_tree()
	var overlay := _create_loading_overlay(owner, loading_text)
	await tree.process_frame

	var request_error := ResourceLoader.load_threaded_request(scene_path, "PackedScene", true)
	if request_error != OK and request_error != ERR_BUSY:
		_free_overlay(overlay)
		return request_error

	var progress: Array = []
	while true:
		var status := ResourceLoader.load_threaded_get_status(scene_path, progress)
		match status:
			ResourceLoader.THREAD_LOAD_LOADED:
				_update_loading_overlay(overlay, 1.0)
				break
			ResourceLoader.THREAD_LOAD_FAILED, ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
				_free_overlay(overlay)
				return ERR_CANT_OPEN
			_:
				_update_loading_overlay(overlay, _progress_value(progress))
				await tree.process_frame

	var packed_scene := ResourceLoader.load_threaded_get(scene_path) as PackedScene
	if packed_scene == null:
		_free_overlay(overlay)
		return ERR_CANT_OPEN

	return tree.change_scene_to_packed(packed_scene)


static func change_scene_to_node(owner: Node, prepared_scene: Node, loading_text := "CHARGEMENT") -> int:
	if owner == null or owner.get_tree() == null:
		return ERR_UNCONFIGURED

	if prepared_scene == null or not is_instance_valid(prepared_scene):
		return ERR_INVALID_PARAMETER

	var tree := owner.get_tree()
	var previous_scene := tree.current_scene
	var overlay := _create_loading_overlay(owner, loading_text)
	await tree.process_frame
	_update_loading_overlay(overlay, 1.0)

	var prepared_parent := prepared_scene.get_parent()
	if prepared_parent != null:
		prepared_parent.remove_child(prepared_scene)

	if prepared_scene is CanvasItem:
		(prepared_scene as CanvasItem).show()
	prepared_scene.process_mode = Node.PROCESS_MODE_INHERIT

	tree.root.add_child(prepared_scene)
	tree.current_scene = prepared_scene

	if previous_scene != null and is_instance_valid(previous_scene) and previous_scene != prepared_scene:
		previous_scene.queue_free()
	else:
		_free_overlay(overlay)

	return OK


static func _create_loading_overlay(owner: Node, loading_text: String) -> Control:
	var overlay := Control.new()
	overlay.name = "EGridLoadingOverlay"
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	overlay.z_index = 4096
	owner.add_child(overlay)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)

	var background := ColorRect.new()
	background.name = "Background"
	background.color = Color("#050c0ff0")
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	overlay.add_child(background)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)

	var content := VBoxContainer.new()
	content.name = "Content"
	content.mouse_filter = Control.MOUSE_FILTER_IGNORE
	content.anchor_left = 0.5
	content.anchor_top = 0.5
	content.anchor_right = 0.5
	content.anchor_bottom = 0.5
	content.offset_left = -180.0
	content.offset_top = -30.0
	content.offset_right = 180.0
	content.offset_bottom = 30.0
	content.add_theme_constant_override("separation", 10)
	overlay.add_child(content)

	var label := Label.new()
	label.name = "StatusLabel"
	label.text = loading_text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 18)
	label.add_theme_color_override("font_color", Color("#e0e8e8"))
	content.add_child(label)

	var progress_bar := ProgressBar.new()
	progress_bar.name = "ProgressBar"
	progress_bar.min_value = 0.0
	progress_bar.max_value = 100.0
	progress_bar.value = 0.0
	progress_bar.show_percentage = false
	progress_bar.custom_minimum_size = Vector2(360.0, 10.0)
	content.add_child(progress_bar)

	return overlay


static func _update_loading_overlay(overlay: Control, progress_value: float) -> void:
	if overlay == null or not is_instance_valid(overlay):
		return

	var progress_bar := overlay.get_node_or_null("Content/ProgressBar") as ProgressBar
	if progress_bar != null:
		progress_bar.value = clampf(progress_value, 0.0, 1.0) * 100.0


static func _progress_value(progress: Array) -> float:
	if progress.is_empty():
		return 0.0

	return float(progress[0])


static func _free_overlay(overlay: Control) -> void:
	if overlay != null and is_instance_valid(overlay):
		overlay.queue_free()
