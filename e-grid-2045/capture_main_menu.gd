extends SceneTree

const OUTPUT_PATH := "C:/Users/cleme/Documents/Hackaton Energie 2026/e-grid-2045/main_menu_screenshot.png"


func _initialize() -> void:
	root.size = Vector2i(1600, 900)
	root.content_scale_mode = Window.CONTENT_SCALE_MODE_DISABLED
	call_deferred("_capture")


func _capture() -> void:
	var scene := load("res://scenes/main_menu.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	await process_frame
	await process_frame

	var image := root.get_texture().get_image()
	var error := image.save_png(OUTPUT_PATH)
	if error != OK:
		push_error("Failed to save screenshot: %s" % error)
		quit(1)
		return

	print("Saved screenshot: %s" % OUTPUT_PATH)
	quit()
