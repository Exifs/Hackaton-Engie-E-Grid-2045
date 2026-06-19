extends VBoxContainer
class_name EGridStatBar

const E_GRID_UI_ATLAS := preload("res://scripts/ui/components/e_grid_ui_atlas.gd")

const DETAIL_COLUMN_COUNT := 3
const DETAIL_VALUE_START_CHARS := "0123456789+-"

@export var title_text := "STAT":
	set(value):
		title_text = value
		_sync()

@export var value_text := "0%":
	set(value):
		value_text = value
		_sync()

@export_range(0.0, 100.0, 0.1) var progress_value := 0.0:
	set(value):
		progress_value = clampf(value, 0.0, 100.0)
		_sync()

@export_enum("normal", "warning", "critical", "success", "disabled") var semantic_state := "normal":
	set(value):
		semantic_state = value
		_sync()

@export var icon_state := "":
	set(value):
		icon_state = value
		_sync()

@export var detail_text := "":
	set(value):
		detail_text = value
		_sync()


func _ready() -> void:
	_sync()


func _sync() -> void:
	if not is_inside_tree():
		return

	var title_label := get_node_or_null("Header/TitleLabel") as Label
	var value_label := get_node_or_null("Header/ValueLabel") as Label
	var icon := get_node_or_null("Header/Icon") as TextureRect
	var progress_bar := get_node_or_null("ProgressBar") as Range
	var detail_label := get_node_or_null("DetailLabel") as Label
	var detail_columns := get_node_or_null("DetailColumns") as HBoxContainer
	var semantic_color := _semantic_color()

	if title_label != null:
		title_label.text = title_text
		title_label.modulate = Color("#e0e8e8") if semantic_state != "disabled" else Color("#546467")

	if value_label != null:
		value_label.text = value_text
		value_label.modulate = semantic_color

	_sync_icon(icon, semantic_color)
	_sync_progress_meter(progress_bar, semantic_color)

	if detail_label != null:
		detail_label.text = detail_text
		detail_label.visible = not detail_text.is_empty()

	_sync_detail_columns(detail_columns)


func _sync_detail_columns(detail_columns: HBoxContainer) -> void:
	if detail_columns == null:
		return

	var segments := _detail_segments()
	detail_columns.visible = not segments.is_empty()

	for index in range(DETAIL_COLUMN_COUNT):
		var column := detail_columns.get_node_or_null("Column%d" % [index + 1]) as Control
		if column == null:
			continue

		var has_segment := index < segments.size()
		column.visible = has_segment
		if not has_segment:
			continue

		var parsed := _parse_detail_segment(segments[index])
		var key_label := column.get_node_or_null("KeyLabel") as Label
		var value_label := column.get_node_or_null("ValueLabel") as Label

		if key_label != null:
			key_label.text = str(parsed.get("key", ""))
			key_label.visible = not key_label.text.is_empty()
			key_label.modulate = Color("#8a999c") if semantic_state != "disabled" else Color("#546467")

		if value_label != null:
			value_label.text = str(parsed.get("value", ""))
			value_label.visible = not value_label.text.is_empty()
			value_label.modulate = _detail_value_color(str(parsed.get("key", "")))


func _detail_segments() -> PackedStringArray:
	var segments := PackedStringArray()
	for raw_segment in detail_text.split("/"):
		var segment := raw_segment.strip_edges()
		if not segment.is_empty():
			segments.append(segment)

	return segments


func _parse_detail_segment(segment: String) -> Dictionary:
	var value_start := _value_start_index(segment)
	if value_start < 0:
		return {"key": segment.to_upper(), "value": ""}

	if value_start == 0:
		return {"key": "", "value": segment}

	return {
		"key": segment.substr(0, value_start).strip_edges().to_upper(),
		"value": segment.substr(value_start).strip_edges(),
	}


func _value_start_index(segment: String) -> int:
	for index in range(segment.length()):
		var character := segment.substr(index, 1)
		if DETAIL_VALUE_START_CHARS.contains(character):
			return index

	return -1


func _sync_icon(icon: TextureRect, semantic_color: Color) -> void:
	if icon == null:
		return

	var resolved_icon := icon_state.strip_edges()
	if resolved_icon.is_empty():
		resolved_icon = _infer_icon_state()

	icon.texture = E_GRID_UI_ATLAS.get_texture("utility_icons_48px", resolved_icon) if not resolved_icon.is_empty() else null
	icon.visible = icon.texture != null
	icon.modulate = semantic_color


func _sync_progress_meter(progress_bar: Range, semantic_color: Color) -> void:
	if progress_bar == null:
		return

	progress_bar.value = progress_value
	progress_bar.modulate = Color(1.0, 1.0, 1.0, 0.5) if semantic_state == "disabled" else Color.WHITE

	var meter := progress_bar as ProgressBar
	if meter == null:
		_set_property_if_available(progress_bar, "semantic_state", semantic_state)
		_set_property_if_available(progress_bar, "show_value_label", false)
		return

	var fill := meter.get_theme_stylebox("fill") as StyleBoxFlat
	if fill != null:
		fill = fill.duplicate() as StyleBoxFlat
		fill.bg_color = semantic_color
		meter.add_theme_stylebox_override("fill", fill)

	var background := meter.get_theme_stylebox("background") as StyleBoxFlat
	if background != null:
		background = background.duplicate() as StyleBoxFlat
		background.bg_color = Color("#081417e6")
		background.border_color = Color("#40565c88")
		meter.add_theme_stylebox_override("background", background)


func _infer_icon_state() -> String:
	var normalized_title := title_text.to_lower()
	if normalized_title.contains("energy"):
		return "energy"
	if normalized_title.contains("cool"):
		return "cooling"
	if normalized_title.contains("compute"):
		return "compute"
	if normalized_title.contains("grid") or normalized_title.contains("load"):
		return "grid"
	if normalized_title.contains("reserve") or normalized_title.contains("battery"):
		return "battery"
	if normalized_title.contains("research"):
		return "science"

	return ""


func _semantic_color() -> Color:
	if semantic_state == "disabled":
		return Color("#546467cc")
	if semantic_state == "warning":
		return Color("#ff5a24")
	if semantic_state == "critical":
		return Color("#cf3a30")
	if semantic_state == "success":
		return Color("#4ce38a")

	return Color("#2fc7f0")


func _detail_value_color(key_text: String) -> Color:
	var key := key_text.to_lower()
	if semantic_state == "disabled":
		return Color("#546467cc")
	if semantic_state in ["warning", "critical"] and (
		key.contains("deficit")
		or key.contains("drift")
		or key.contains("risk")
		or key.contains("unserved")
		or key.contains("issues")
	):
		return _semantic_color()

	return Color("#e0e8e8")


func _set_property_if_available(target: Object, property_name: String, property_value: Variant) -> void:
	if target == null:
		return

	for property in target.get_property_list():
		if str(property.get("name", "")) == property_name:
			target.set(property_name, property_value)
			return
