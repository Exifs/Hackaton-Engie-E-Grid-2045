# E-Grid 2045 — Region Shape Editor

Outil standalone pour reprendre les frontières gameplay des 30 régions E-Grid 2045 au-dessus de `europe_map_backdrop_generated_clean_v1.png`.

Le package contient :

- `tools/region_editor/region_shape_editor.html` : éditeur visuel léger, utilise les assets du package.
- `tools/region_editor/region_shape_editor_standalone.html` : variante autonome qui embarque aussi l’image de fond.
- `tools/map_regions/apply_region_editor_export.py` : script d'intégration pour convertir l'export de l'éditeur en assets Godot.
- `tools/map_regions/sync_region_layout_from_contours.py` : script de synchronisation hors runtime des positions de marqueurs depuis les centroïdes de polygones.
- `assets/map/europe_map_backdrop_generated_clean_v1.png` : fond de carte utilisé par l'éditeur.
- `assets/map/region_ids.json` : source des 30 IDs, slugs et noms.
- `assets/map/generated/regions_contours.json` : première passe de contours utilisée comme point de départ.
- `exports/sample_region_editor_export.json` : export exemple équivalent à la première passe.

## Utilisation rapide

1. Ouvrir directement :

   ```text
   tools/region_editor/region_shape_editor.html
   ```

   Ou lancer un petit serveur local :

   ```bash
   python tools/region_editor/launch_region_editor.py
   ```

   Si tu veux un fichier unique à partager, ouvrir plutôt :

   ```text
   tools/region_editor/region_shape_editor_standalone.html
   ```

2. Ajuster les formes :

   - Sélectionner une région dans la liste ou sur la carte.
   - Déplacer les sommets en les glissant.
   - Activer “Déplacer sommets liés” pour déplacer les points voisins ensemble et garder des bordures raccordées.
   - Utiliser le mode “Ajouter point” pour insérer un sommet sur un segment.
   - Utiliser `Delete` pour supprimer le sommet sélectionné.
   - Utiliser “+ Composant / île” pour créer une partie séparée de région.
   - Utiliser la molette pour zoomer et `Espace` + drag pour naviguer.

3. Exporter :

   - `Exporter JSON éditeur` : format recommandé pour intégration par script.
   - `Exporter regions_contours.json` : format runtime direct pour les contours.
   - `Exporter SVG master` : source vectorielle éditable dans Inkscape/Affinity/Illustrator.

## Intégration dans le repo Godot

Copier l'export JSON dans le repo, par exemple :

```text
tools/region_editor/exports/egrid_region_editor_shapes.json
```

Puis lancer :

```bash
python tools/map_regions/apply_region_editor_export.py \
  --editor-export tools/region_editor/exports/egrid_region_editor_shapes.json \
  --background assets/map/europe_map_backdrop_generated_clean_v1.png \
  --region-ids assets/map/region_ids.json \
  --out assets/map/generated \
  --svg-out assets/map/regions_master_template.svg \
  --debug
```

Ce script écrit :

```text
assets/map/generated/regions_contours.json
assets/map/generated/region_id_mask.png
assets/map/generated/region_lut_default.png
assets/map/generated/debug_region_overlay.png
assets/map/regions_master_template.svg
```

Le mask est dessiné sans antialiasing : les pixels contiennent uniquement les IDs entiers 0..30.

Synchroniser ensuite les points "capitales" du layout Godot depuis les centroïdes des polygones :

```bash
python tools/map_regions/sync_region_layout_from_contours.py \
  --contours assets/map/generated/regions_contours.json \
  --layout-in ../e-grid-2045/data/region_layout.json \
  --json-out ../e-grid-2045/data/region_layout.json
```

Le calcul reste ainsi dans le pipeline d'assets : au runtime, la scène de jeu lit simplement les coordonnées normalisées déjà écrites.

Relancer ensuite la validation existante :

```bash
python tools/map_regions/validate_region_assets.py \
  --background assets/map/europe_map_backdrop_generated_clean_v1.png \
  --region-ids assets/map/region_ids.json \
  --mask assets/map/generated/region_id_mask.png \
  --contours assets/map/generated/regions_contours.json
```

## Notes de production

- Les régions restent des formes gameplay stylisées, pas des frontières politiques exactes.
- L'outil ne vectorise pas automatiquement le décor : il édite la couche sémantique de gameplay.
- Les coordonnées exportées sont en pixels image, origine top-left, compatibles avec les scripts Godot déjà générés.
- Le budget de points est affiché dans l'éditeur ; viser ≤ 5 000 points au total.
- Pour préserver les petites régions, éviter de trop simplifier `lux_saarlorlux`, `dk`, `med_islands`, `baltic_south`, `sk` et `cz`.
