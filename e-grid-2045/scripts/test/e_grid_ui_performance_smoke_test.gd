extends SceneTree

const GAME_SCENE := "res://scenes/game/game_scene.tscn"
const MAX_PICK_TEST_USEC := 250000
const MAX_PROCESSING_NODES := 6


func _init() -> void:
	var packed_scene := load(GAME_SCENE) as PackedScene
	if packed_scene == null:
		_fail("Cannot load game scene.")
		return

	var game_scene := packed_scene.instantiate()
	if game_scene == null:
		_fail("Cannot instantiate game scene.")
		return

	root.add_child(game_scene)
	current_scene = game_scene
	for _index in range(20):
		await process_frame

	var map_view := game_scene.get_node_or_null("SafeArea/Root/MainRow/MapView") as Control
	if map_view == null:
		_fail("Cannot find map view.")
		return

	if map_view.is_processing():
		_fail("MapView should not process every frame when network flow animation is disabled.")
		return

	var processing_nodes := _collect_processing_nodes(game_scene)
	if processing_nodes.size() > MAX_PROCESSING_NODES:
		_fail("Too many nodes process every frame: %s" % ", ".join(processing_nodes))
		return

	var elapsed_usec := _benchmark_map_picking(map_view)
	if elapsed_usec > MAX_PICK_TEST_USEC:
		_fail("Map picking is too slow: %d usec." % elapsed_usec)
		return

	print("E-Grid UI performance smoke test passed. pick_usec=%d processing=%s" % [elapsed_usec, ", ".join(processing_nodes)])
	quit(0)


func _benchmark_map_picking(map_view: Control) -> int:
	var test_size := map_view.size
	if test_size.x <= 0.0 or test_size.y <= 0.0:
		test_size = Vector2(1280.0, 720.0)

	var started_usec := Time.get_ticks_usec()
	for index in range(1000):
		var position := Vector2(
			fposmod(37.0 * float(index), test_size.x),
			fposmod(53.0 * float(index), test_size.y)
		)
		map_view.call("_pick_region_id_at_view_position", position)
	return Time.get_ticks_usec() - started_usec


func _collect_processing_nodes(root_node: Node) -> PackedStringArray:
	var result := PackedStringArray()
	_collect_processing_nodes_recursive(root_node, result)
	return result


func _collect_processing_nodes_recursive(node: Node, result: PackedStringArray) -> void:
	if node.is_processing() or node.is_physics_processing():
		result.append(str(node.get_path()))

	for child in node.get_children():
		_collect_processing_nodes_recursive(child, result)


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
