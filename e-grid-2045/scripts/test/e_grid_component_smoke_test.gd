extends Node

@export var quit_after_seconds := 0.0

const COMPONENT_SCENES := [
	"res://scenes/ui/components/e_grid_alert_toast.tscn",
	"res://scenes/ui/components/e_grid_checkbox.tscn",
	"res://scenes/ui/components/e_grid_dropdown.tscn",
	"res://scenes/ui/components/e_grid_horizontal_slider.tscn",
	"res://scenes/ui/components/e_grid_icon_button.tscn",
	"res://scenes/ui/components/e_grid_input_field.tscn",
	"res://scenes/ui/components/e_grid_dropdown_item.tscn",
	"res://scenes/ui/components/e_grid_list_item.tscn",
	"res://scenes/ui/components/e_grid_mini_button.tscn",
	"res://scenes/ui/components/e_grid_panel.tscn",
	"res://scenes/ui/components/e_grid_progress_bar.tscn",
	"res://scenes/ui/components/e_grid_progress_ring.tscn",
	"res://scenes/ui/components/e_grid_radio.tscn",
	"res://scenes/ui/components/e_grid_resource_chip.tscn",
	"res://scenes/ui/components/e_grid_scrollbar_horizontal.tscn",
	"res://scenes/ui/components/e_grid_scrollbar_vertical.tscn",
	"res://scenes/ui/components/e_grid_slot_card.tscn",
	"res://scenes/ui/components/e_grid_tab.tscn",
	"res://scenes/ui/components/e_grid_toggle.tscn",
	"res://scenes/ui/components/e_grid_tooltip.tscn",
	"res://scenes/ui/components/e_grid_vertical_slider.tscn",
]

var _failures: Array[String] = []
var _result_label: Label


func _ready() -> void:
	_result_label = find_child("ResultLabel", true, false) as Label
	call_deferred("_run")


func _run() -> void:
	for scene_path in COMPONENT_SCENES:
		_test_scene(scene_path)

	await get_tree().process_frame
	await get_tree().process_frame

	_test_slider("EGridHorizontalSlider")
	_test_slider("EGridVerticalSlider")
	await _test_dropdown()
	_test_static_textures()

	if _failures.is_empty():
		var message := "EGrid component smoke test passed: %d scenes" % COMPONENT_SCENES.size()
		print(message)
		_set_result(message)
		if quit_after_seconds > 0.0:
			await get_tree().create_timer(quit_after_seconds).timeout
			get_tree().quit(0)
	else:
		for failure in _failures:
			push_error(failure)
		_set_result("EGrid component smoke test failed: %d issue(s)" % _failures.size())
		if quit_after_seconds > 0.0:
			await get_tree().create_timer(quit_after_seconds).timeout
			get_tree().quit(1)


func _test_scene(scene_path: String) -> void:
	var packed := load(scene_path) as PackedScene
	if packed == null:
		_failures.append("Unable to load scene: %s" % scene_path)
		return

	var instance := packed.instantiate()
	if instance == null:
		_failures.append("Unable to instantiate scene: %s" % scene_path)
		return

	if instance is CanvasItem:
		(instance as CanvasItem).visible = false

	add_child(instance)

	if instance is Control and (instance as Control).custom_minimum_size == Vector2.ZERO:
		_failures.append("Component has no minimum size: %s" % scene_path)


func _test_slider(node_name: String) -> void:
	var slider := find_child(node_name, true, false)
	if slider == null:
		_failures.append("Missing slider: %s" % node_name)
		return

	if not slider.has_method("set_value") or not slider.has_method("get_value"):
		_failures.append("Slider API missing: %s" % node_name)
		return

	slider.call("set_value", 37.0, true)
	var current_value := float(slider.call("get_value"))
	if absf(current_value - 37.0) > 0.01:
		_failures.append("Slider did not apply value: %s" % node_name)


func _test_dropdown() -> void:
	var dropdown := find_child("EGridDropdown", true, false)
	if dropdown == null:
		_failures.append("Missing dropdown")
		return

	if not dropdown.has_method("open") or not dropdown.has_method("close"):
		_failures.append("Dropdown API missing")
		return

	dropdown.set("options", PackedStringArray([
		"Energy",
		"Cooling",
		"Compute",
		"Storage",
		"Transmission",
		"Grid upgrade",
		"Research",
		"Budget",
	]))
	dropdown.set("visible_item_count", 3)
	dropdown.set("warning_item_indices", PackedInt32Array([1]))
	dropdown.set("critical_item_indices", PackedInt32Array([2]))
	dropdown.set("success_item_indices", PackedInt32Array([3]))
	dropdown.set("disabled_item_indices", PackedInt32Array([6]))
	dropdown.call("open")
	await get_tree().process_frame

	var open_panel := dropdown.get_node_or_null("OpenPanel") as Control
	if open_panel == null or not open_panel.visible:
		_failures.append("Dropdown open panel did not become visible")
		return
	if open_panel.has_method("is_set_as_top_level") and not bool(open_panel.call("is_set_as_top_level")):
		_failures.append("Dropdown open panel should be top-level while expanded")
	if open_panel.z_index < 1000:
		_failures.append("Dropdown open panel z-index is too low to own pointer interactions")

	var selected_label := dropdown.get_node_or_null("SelectedBitmapText") as Control
	if selected_label == null:
		_failures.append("Dropdown selected bitmap label is missing")
	elif selected_label.position.x < 36.0:
		_failures.append("Dropdown selected label overlaps the left status chip")

	var indicator := dropdown.get_node_or_null("IndicatorOverlay") as Control
	if indicator == null:
		_failures.append("Dropdown indicator overlay is missing")
	elif not bool(indicator.get("opened")):
		_failures.append("Dropdown indicator overlay did not sync the open state")

	var open_texture := open_panel.get_node_or_null("OpenTexture") as TextureRect
	if open_texture != null and (open_texture.visible or open_texture.texture != null):
		_failures.append("Dropdown open panel still renders baked open texture")

	if dropdown.get("item_scene") == null:
		_failures.append("Dropdown item scene is not exposed")

	var scroll := open_panel.get_node_or_null("Scroll") as ScrollContainer
	if scroll == null:
		_failures.append("Dropdown long list has no scroll container")
	else:
		var items := scroll.find_child("Items", true, false) as VBoxContainer
		if items == null or items.get_child_count() != 8:
			_failures.append("Dropdown long list items were not rebuilt for scroll test")
		else:
			var warning_item := items.get_child(1)
			var critical_item := items.get_child(2)
			var success_item := items.get_child(3)
			var disabled_item := items.get_child(6) as BaseButton
			if warning_item.get("semantic_state") != "normal":
				_failures.append("Dropdown warning status should not masquerade as selection")
			if critical_item.get("semantic_state") != "normal":
				_failures.append("Dropdown critical status should not masquerade as selection")
			if success_item.get("semantic_state") != "normal":
				_failures.append("Dropdown success status should not masquerade as selection")
			if disabled_item == null or not disabled_item.disabled:
				_failures.append("Dropdown disabled item state not applied")
			var selected_count := 0
			for child in items.get_children():
				var item_button := child as BaseButton
				if item_button != null and item_button.button_pressed:
					selected_count += 1
			if selected_count != 1:
				_failures.append("Dropdown should keep exactly one selected item, got %d" % selected_count)
			if items.get_child_count() >= 3:
				(items.get_child(0) as BaseButton).button_pressed = true
				(items.get_child(2) as BaseButton).button_pressed = true
				dropdown.call("_apply_item_runtime_states")
				selected_count = 0
				for child in items.get_children():
					var item_button := child as BaseButton
					if item_button != null and item_button.button_pressed:
						selected_count += 1
				if selected_count != 1:
					_failures.append("Dropdown item button group allows multiple selected items")
			var cooling_item := items.get_child(1) as BaseButton
			if cooling_item != null:
				cooling_item.button_pressed = true
				await get_tree().process_frame
				if int(dropdown.get("selected_index")) != 1:
					_failures.append("Dropdown visual item selection did not update selected_index")
				var selected_label_after_toggle := dropdown.get_node_or_null("SelectedBitmapText") as Control
				if selected_label_after_toggle == null or str(selected_label_after_toggle.get("text")) != "Cooling":
					_failures.append("Dropdown closed field did not mirror toggled item text")
				dropdown.call("open")
				await get_tree().process_frame
			dropdown.call("select_index", 3, false, true)
			await get_tree().process_frame
			if int(dropdown.get("selected_index")) != 3:
				_failures.append("Dropdown click selection did not update selected_index")
			var selected_label_after_click := dropdown.get_node_or_null("SelectedBitmapText") as Control
			if selected_label_after_click == null or str(selected_label_after_click.get("text")) != "Storage":
				_failures.append("Dropdown closed field did not mirror selected item text")
			selected_count = 0
			for child in items.get_children():
				var item_button := child as BaseButton
				if item_button != null and item_button.button_pressed:
					selected_count += 1
			if selected_count != 1:
				_failures.append("Dropdown selection sync should leave exactly one pressed item after select_index")
			var before_scroll := scroll.scroll_vertical
			dropdown.call("_scroll_popup_by_items", 2)
			if scroll.scroll_vertical <= before_scroll:
				_failures.append("Dropdown scroll helper did not move the popup list")
			var before_wheel_scroll := scroll.scroll_vertical
			var wheel_event := InputEventMouseButton.new()
			wheel_event.button_index = MOUSE_BUTTON_WHEEL_DOWN
			wheel_event.pressed = true
			wheel_event.position = Vector2(24.0, 24.0)
			wheel_event.global_position = open_panel.global_position + wheel_event.position
			dropdown.call("_handle_global_scroll_input", wheel_event)
			if scroll.scroll_vertical <= before_wheel_scroll:
				_failures.append("Dropdown global wheel input did not scroll the popup list")
			scroll.scroll_vertical = 0
			var popup_scrollbar := open_panel.get_node_or_null("DropdownScrollbar") as Control
			if popup_scrollbar == null:
				_failures.append("Dropdown popup has no custom scrollbar")
			elif not popup_scrollbar.visible:
				_failures.append("Dropdown popup scrollbar is hidden for a long list")
			else:
				var dropdown_item_size: Vector2 = dropdown.get("item_size")
				if popup_scrollbar.position.x <= scroll.position.x + dropdown_item_size.x:
					_failures.append("Dropdown popup scrollbar should be placed on the right of the list items")
				var click_event := InputEventMouseButton.new()
				click_event.button_index = MOUSE_BUTTON_LEFT
				click_event.pressed = true
				click_event.position = Vector2(popup_scrollbar.size.x * 0.5, popup_scrollbar.size.y - 2.0)
				click_event.global_position = popup_scrollbar.global_position + click_event.position
				popup_scrollbar.call("_gui_input", click_event)
				if scroll.scroll_vertical <= 0:
					_failures.append("Dropdown popup scrollbar click did not move the popup list")

	dropdown.call("close")
	dropdown.set("disabled", true)
	dropdown.call("open")
	if open_panel != null and open_panel.visible:
		_failures.append("Disabled dropdown should not open")
	dropdown.set("disabled", false)


func _test_static_textures() -> void:
	var static_nodes := [
		"EGridPanel",
		"EGridTooltip",
		"EGridInputField",
		"EGridScrollbarHorizontal",
		"EGridScrollbarVertical",
	]

	for node_name in static_nodes:
		var node := find_child(node_name, true, false) as TextureRect
		if node == null:
			_failures.append("Missing static texture node: %s" % node_name)
			continue

		if node.texture == null:
			_failures.append("Static texture not resolved: %s" % node_name)


func _set_result(message: String) -> void:
	if _result_label != null:
		_result_label.text = message
