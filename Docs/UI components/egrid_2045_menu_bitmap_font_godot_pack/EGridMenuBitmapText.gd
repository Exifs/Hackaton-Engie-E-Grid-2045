@tool
extends Control
class_name EGridMenuBitmapText

@export var atlas_texture: Texture2D
@export_multiline var text: String = "E-GRID 2045"
@export var scale_px: float = 1.0
@export var letter_spacing: float = 2.0
@export var line_spacing: float = 6.0
@export var uppercase_style: bool = true
@export var center: bool = false

const CELL_W := 80.0
const CELL_H := 112.0
const COLS := 16
const CHARSET := " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ÀÁÂÄÆÇÈÉÊËÎÏÔÖŒÙÛÜŸàáâäæçèéêëîïôöœùûüÿ€°×–—…’“”²₂←→"

var _map := {}

func _ready() -> void:
    _build_map()
    queue_redraw()

func _notification(what: int) -> void:
    if what == NOTIFICATION_ENTER_TREE:
        _build_map()

func _build_map() -> void:
    _map.clear()
    for i in CHARSET.length():
        _map[CHARSET.substr(i, 1)] = i

func _normalize_char(c: String) -> String:
    if _map.has(c):
        return c
    if uppercase_style:
        var up := c.to_upper()
        if _map.has(up):
            return up
    return " "

func _draw() -> void:
    if atlas_texture == null:
        return
    if _map.is_empty():
        _build_map()
    var lines := text.split("\n")
    var y := 0.0
    for line in lines:
        var x := 0.0
        if center:
            x = max(0.0, (size.x - line.length() * (CELL_W * scale_px + letter_spacing)) * 0.5)
        for i in line.length():
            var c := _normalize_char(line.substr(i, 1))
            var idx: int = _map.get(c, 0)
            var col := idx % COLS
            var row := int(idx / COLS)
            var src := Rect2(col * CELL_W, row * CELL_H, CELL_W, CELL_H)
            var dst := Rect2(x, y, CELL_W * scale_px, CELL_H * scale_px)
            draw_texture_rect_region(atlas_texture, dst, src)
            x += CELL_W * scale_px + letter_spacing
        y += CELL_H * scale_px + line_spacing
