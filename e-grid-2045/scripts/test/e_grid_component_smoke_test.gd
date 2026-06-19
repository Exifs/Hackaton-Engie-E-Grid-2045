extends Node

@export var quit_after_seconds := 0.0

const BITMAP_FONT_MANIFEST_PATH := "res://assets/ui/menu/font/egrid_2045_menu_font_manifest.json"
const BITMAP_FONT_CELL_HEIGHT := 112.0

const COMPONENT_SCENES := [
	"res://scenes/ui/components/e_grid_action_button.tscn",
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
	_test_slot_card()
	_test_radial_progress()
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

		var resolved_texture = node.texture
		if resolved_texture == null and node.has_method("get_resolved_texture"):
			resolved_texture = node.call("get_resolved_texture")

		if resolved_texture == null:
			_failures.append("Static texture not resolved: %s" % node_name)


func _test_slot_card() -> void:
	var slot_card := find_child("EGridSlotCard", true, false) as BaseButton
	if slot_card == null:
		_failures.append("Missing slot card")
		return

	for layer_name in [
		"Base",
		"BuildingIcon",
		"Pips",
		"BottomTier",
		"TopBars",
		"StateOverlay",
		"StatusOverlay",
		"StatusBadge",
		"LockOverlay",
	]:
		var layer := slot_card.get_node_or_null(layer_name) as TextureRect
		if layer == null:
			_failures.append("Slot card missing layer: %s" % layer_name)
			continue
		if not ["BuildingIcon", "StatusBadge"].has(layer_name) and layer.texture == null:
			_failures.append("Slot card layer has no texture: %s" % layer_name)

	slot_card.set("semantic_state", "warning")
	slot_card.set("pips_active", 4)
	slot_card.set("show_state_overlay", false)
	slot_card.set("show_status_badge", false)
	slot_card.set("building_icon_alpha", 0.35)
	var icon_layer := slot_card.get_node_or_null("BuildingIcon") as TextureRect
	if icon_layer == null or absf(icon_layer.modulate.a - 0.35) > 0.01:
		_failures.append("Slot card building icon alpha did not apply")
	slot_card.set("building_icon_alpha", 1.0)
	var status_overlay := slot_card.get_node_or_null("StatusOverlay") as TextureRect
	if status_overlay == null or not status_overlay.visible:
		_failures.append("Slot card warning status overlay did not become visible")

	var base_layer := slot_card.get_node_or_null("Base") as TextureRect
	var base_atlas: AtlasTexture = null
	if base_layer != null:
		base_atlas = base_layer.texture as AtlasTexture
	if base_atlas == null or base_atlas.region.position.x != 0.0:
		_failures.append("Slot card warning state should keep the empty base and use the status overlay")

	var state_overlay := slot_card.get_node_or_null("StateOverlay") as TextureRect
	if state_overlay != null and state_overlay.visible:
		_failures.append("Slot card state overlay should be opt-in to avoid doubled borders")

	var status_badge := slot_card.get_node_or_null("StatusBadge") as TextureRect
	if status_badge == null:
		_failures.append("Slot card warning badge layer is missing")
	elif status_badge.visible:
		_failures.append("Slot card warning badge should be hidden by default because the status overlay already includes the badge")

	slot_card.set("show_status_badge", true)
	if status_badge == null or not status_badge.visible:
		_failures.append("Slot card explicit warning badge did not become visible")

	var pips := slot_card.get_node_or_null("Pips") as TextureRect
	var bottom_tier := slot_card.get_node_or_null("BottomTier") as TextureRect
	var top_bars := slot_card.get_node_or_null("TopBars") as TextureRect
	for crisp_layer in [pips, bottom_tier, top_bars]:
		if crisp_layer != null and crisp_layer.texture_filter != CanvasItem.TEXTURE_FILTER_NEAREST:
			_failures.append("Slot card pips and microbars should use nearest filtering")

	if pips == null or absf((pips.position.x + pips.size.x * 0.5) - 40.0) > 0.5:
		_failures.append("Slot card pips should be horizontally centered")
	if pips == null or pips.position.y + pips.size.y > 76.0:
		_failures.append("Slot card pips should be inset from the bottom edge")

	if top_bars == null or top_bars.position.x < 58.0 or top_bars.position.x + top_bars.size.x > 74.0:
		_failures.append("Slot card top microbars should be inset from the right edge")
	if bottom_tier == null or bottom_tier.position.x < 58.0 or bottom_tier.position.x + bottom_tier.size.x > 74.0:
		_failures.append("Slot card bottom tier bars should be inset from the right edge")
	if bottom_tier != null and bottom_tier.position.y + bottom_tier.size.y > 77.0:
		_failures.append("Slot card bottom tier bars should be inset from the bottom edge")


func _test_radial_progress() -> void:
	var radial := find_child("EGridProgressRing", true, false) as Control
	if radial == null:
		_failures.append("Missing radial progress")
		return

	radial.set("value", 73.0)
	radial.set("semantic_state", "critical")

	var progress := radial.get_node_or_null("ProgressTexture") as TextureProgressBar
	if progress == null:
		_failures.append("Radial progress has no TextureProgressBar child")
		return

	if progress.texture_under == null or progress.texture_progress == null or progress.texture_over == null:
		_failures.append("Radial progress textures are not resolved")

	var cap := radial.get_node_or_null("EndCap") as TextureRect
	if cap == null or cap.texture == null:
		_failures.append("Radial progress cap texture is not resolved")
	else:
		if _object_has_property(progress, "radial_initial_angle"):
			var expected_start_angle := float(radial.get("progress_start_angle_degrees"))
			var actual_start_angle := float(progress.get("radial_initial_angle"))
			if absf(actual_start_angle - expected_start_angle) > 0.01:
				_failures.append("Radial progress cap and TextureProgressBar do not share the same start angle")

		radial.set("value", 25.0)
		radial.set("_display_value", 25.0)
		radial.call("_sync_visuals")
		var fitted_rect := Rect2(Vector2.ZERO, radial.size)
		var expected_angle := deg_to_rad(float(radial.get("progress_start_angle_degrees")) + 90.0)
		var expected_cap_center := fitted_rect.position + fitted_rect.size * 0.5 + Vector2(sin(expected_angle), -cos(expected_angle)) * float(radial.get("cap_radius"))
		var actual_cap_center := cap.position + cap.size * 0.5
		if actual_cap_center.distance_to(expected_cap_center) > 1.0:
			_failures.append("Radial progress cap is not aligned with the rendered progress angle")

	var value_label := radial.get_node_or_null("ValueBitmapText") as Control
	if value_label == null:
		_failures.append("Radial progress has no bitmap value label")
	else:
		if value_label.get("atlas_texture") == null:
			_failures.append("Radial progress value label has no menu font atlas")
		if int(value_label.get("opacity_passes")) < 3:
			_failures.append("Radial progress value label is not reinforced for readability")
		if not bool(value_label.get("outline_enabled")):
			_failures.append("Radial progress value label has no outline")
		if float(value_label.get("scale_px")) < 0.175:
			_failures.append("Radial progress value label is too small for readability")
		if value_label.size.x < 58.0 or value_label.size.y < 30.0:
			_failures.append("Radial progress value label box is too small for the percentage text")

		radial.set("value", 100.0)
		radial.set("_display_value", 100.0)
		radial.call("_sync_visuals")
		var label_text_size := _estimate_bitmap_text_size(str(value_label.get("text")), float(value_label.get("scale_px")))
		if label_text_size.x + 4.0 > value_label.size.x or label_text_size.y + 4.0 > value_label.size.y:
			_failures.append("Radial progress 100% label can overflow its render box")

	if cap != null:
		radial.set("semantic_state", "normal")
		var normal_cap := cap.texture
		radial.set("semantic_state", "success")
		var success_cap := cap.texture
		if normal_cap == success_cap:
			_failures.append("Radial progress success state reuses the cyan cap texture")


func _set_result(message: String) -> void:
	if _result_label != null:
		_result_label.text = message


func _object_has_property(target: Object, property_name: String) -> bool:
	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			return true

	return false


func _estimate_bitmap_text_size(text: String, text_scale: float) -> Vector2:
	var fallback_width := 80.0 * float(text.length())
	var file := FileAccess.open(BITMAP_FONT_MANIFEST_PATH, FileAccess.READ)
	if file == null:
		return Vector2(fallback_width * text_scale, BITMAP_FONT_CELL_HEIGHT * text_scale)

	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return Vector2(fallback_width * text_scale, BITMAP_FONT_CELL_HEIGHT * text_scale)

	var metrics = parsed.get("metrics", {})
	if typeof(metrics) != TYPE_DICTIONARY:
		return Vector2(fallback_width * text_scale, BITMAP_FONT_CELL_HEIGHT * text_scale)

	var width := 0.0
	for index in range(text.length()):
		var character := text.substr(index, 1)
		var metric = metrics.get(character, {})
		if typeof(metric) == TYPE_DICTIONARY and metric.has("advance"):
			width += float(metric["advance"])
		else:
			width += 80.0

	return Vector2(width * text_scale, BITMAP_FONT_CELL_HEIGHT * text_scale)
