# E-Grid 2045 — Slot Card Component Pack v5 Clean

Pack runtime dédié au composant `slot card` de l’inspecteur.  
Les PNG runtime ne contiennent aucun texte, aucun label et aucun placeholder. Les icônes bâtiment doivent rester des assets séparés et être placées dans la couche `BuildingIcon`.

## Taille et découpe

- Cellule slot card : `80 x 80 px`.
- Cellule radial progress : `64 x 64 px`.
- Badges warning/error : `24 x 24 px`.
- Les spritesheets sont alignées horizontalement, sauf `warning_error_badges_24.png` qui utilise 3 colonnes x 2 lignes.

## Ordre de calques recommandé dans Godot

1. `Base` : `slot_card_base_states_80.png`, frame 0 pour la base vide.
2. `BuildingIcon` : icône bâtiment externe au pack, placée dans la zone sûre `x=7 y=6 w=66 h=58`.
3. `Pips` : `slot_card_bottom_pips_states_80.png`, frame `0..5`.
4. `BottomTier` : `slot_card_bottom_tier_bars_80.png`, frame `0..3`.
5. `TopBars` : `slot_card_top_microbars_80.png`, frame `0..3`.
6. `Status` : `slot_card_warning_error_status_overlays_80.png`, frame `0..6`.
7. `Lock` : `slot_card_lock_overlay_80.png` si le slot est verrouillé.

## Spritesheets slot card

### slot_card_base_states_80.png
Frames horizontales :
0. empty
1. hover
2. selected
3. drop_target
4. disabled
5. locked
6. warning
7. error

### slot_card_state_overlays_80.png
Frames horizontales :
0. none
1. hover
2. selected
3. drop_target
4. warning
5. warning_pulse
6. error
7. error_pulse
8. disabled_scrim
9. drag_ghost

### slot_card_bottom_pips_states_80.png
Frames horizontales :
0. 0/5 active
1. 1/5 active
2. 2/5 active
3. 3/5 active
4. 4/5 active
5. 5/5 active

### slot_card_bottom_pips_active_masks_80.png
Même découpe que les pips, mais blanc/alpha pour modulation Godot.

### slot_card_bottom_tier_bars_80.png
Frames horizontales : 0/3, 1/3, 2/3, 3/3.

### slot_card_top_microbars_80.png
Frames horizontales : 0/3, 1/3, 2/3, 3/3.

### slot_card_warning_error_status_overlays_80.png
Frames horizontales :
0. none
1. warning_inactive
2. warning_active
3. warning_pulse
4. error_inactive
5. error_active
6. error_pulse

## Radial progress fluide

Utiliser `TextureProgressBar` avec :
- `texture_under = radial_under_64.png`
- `texture_progress = radial_fill_cyan_64.png`, `radial_fill_warning_64.png` ou `radial_fill_error_64.png`
- `texture_over = radial_over_bezel_64.png`
- `fill_mode = FILL_CLOCKWISE`
- `min_value = 0`
- `max_value = 1`
- `step = 0.001`

Ce système n’est pas une progression par frames/paliers. La valeur est pilotée directement par Godot.

## Fichiers Godot fournis

- `examples/godot/EGridSlotCardVisual.gd`
- `examples/godot/EGridSlotRadialProgress.gd`
- `examples/godot/EGridSlotRadialProgress.gdshader`

## Import conseillé

- Texture > Filter : off ou nearest pour les pips et microbars si le rendu pixel doit rester net.
- Texture > Filter : linear pour les radial progress et overlays si le rendu doit rester doux.
- Ne pas baked de texte dans les textures ; garder les labels via `Label` ou l’atlas bitmap du menu.
