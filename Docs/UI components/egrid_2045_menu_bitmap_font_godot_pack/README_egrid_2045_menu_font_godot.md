# E-Grid 2045 — Menu Bitmap Font pour Godot 4.6

Atlas PNG transparent pour recréer la police du menu avec texte dynamique dans Godot.

## Contenu

- `egrid_2045_menu_font_atlas_white.png` : atlas blanc/alpha, conseillé pour `Label`, `Button` et Theme avec modulation couleur.
- `egrid_2045_menu_font_atlas_normal.png` : rendu menu normal cyan/blanc.
- `egrid_2045_menu_font_atlas_hover.png` : rendu hover, glow plus fort.
- `egrid_2045_menu_font_manifest.json` : ordre des caractères, taille des cellules, métriques.
- `EGridMenuBitmapText.gd` : Control Godot 4.x optionnel pour dessiner le texte directement depuis l'atlas.

## Import en Font Data / Image Font

Dans Godot : sélectionne `egrid_2045_menu_font_atlas_white.png`, onglet Import, choisis **Font Data (Image Font)** puis :

- Columns: `16`
- Rows: `10`
- Character Ranges, dans cet ordre : `' '-'~', 'À', 'Á', 'Â', 'Ä', 'Æ', 'Ç', 'È'-'Ë', 'Î', 'Ï', 'Ô', 'Ö', 'Œ', 'Ù', 'Û', 'Ü', 'Ÿ', 'à', 'á', 'â', 'ä', 'æ', 'ç', 'è'-'ë', 'î', 'ï', 'ô', 'ö', 'œ', 'ù', 'û', 'ü', 'ÿ', '€', '°', '×', '–', '—', '…', '’', '“', '”', '²', '₂', '←', '→'`

Reimport ensuite le PNG et assigne la police au thème UI ou en override sur un `Label` / `Button`.

## Usage recommandé

- Pour les boutons : taille autour de 40–48 px.
- Pour les titres : taille autour de 76–90 px.
- Les minuscules existent mais sont dessinées en capitales, comme le menu.
- Les accents français sont inclus : PARAMÈTRES, ÉNERGIE, CO₂, etc.
