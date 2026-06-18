# Intégration des frontières éditées E-Grid 2045

1. Copier l'export JSON de l'éditeur dans le repo, par exemple `tools/region_editor/exports/egrid_region_editor_shapes.json`.
2. Lancer :

```bash
python tools/map_regions/apply_region_editor_export.py \
  --editor-export tools/region_editor/exports/egrid_region_editor_shapes.json \
  --background assets/map/europe_map_backdrop_generated_clean_v1.png \
  --region-ids assets/map/region_ids.json \
  --out assets/map/generated \
  --svg-out assets/map/regions_master_template.svg \
  --debug
```

3. Relancer la validation existante :

```bash
python tools/map_regions/validate_region_assets.py \
  --background assets/map/europe_map_backdrop_generated_clean_v1.png \
  --region-ids assets/map/region_ids.json \
  --mask assets/map/generated/region_id_mask.png \
  --contours assets/map/generated/regions_contours.json
```

Les coordonnées exportées restent en pixels image, origine top-left. Le mask généré par le script est en IDs entiers 0..30.