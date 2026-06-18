# Region Shape Editor — guide designer

Ouvre `region_shape_editor_standalone.html` dans Chrome, Edge, Firefox ou Safari.

## Modes

- **Sélection / sommets** : cliquer une région, puis déplacer ses sommets.
- **Ajouter point** : cliquer un segment de la région sélectionnée pour insérer un sommet.
- **Déplacer région** : glisser une région entière. Avec `Ctrl`/`Cmd`, seul le composant touché est déplacé.
- **Pan** : glisser la vue. La molette zoome toujours.

## Raccourcis

- `V` : mode sélection.
- `A` : mode ajout de point.
- `M` : mode déplacement région.
- `F` : focus sur la région sélectionnée.
- `Delete` / `Backspace` : supprimer le sommet sélectionné.
- `Ctrl+Z` / `Cmd+Z` : undo.
- `Ctrl+Y` ou `Ctrl+Shift+Z` : redo.
- `Espace` + glisser : pan temporaire.

## Bordures partagées

Active **Déplacer sommets liés** pour déplacer automatiquement tous les sommets dans le rayon configuré. C'est utile quand deux régions partagent une frontière et que leurs points sont presque superposés.

Pour une reprise propre :

1. Zoome sur une frontière.
2. Active les sommets liés avec un rayon de 8 à 16 px.
3. Déplace les points des deux régions ensemble.
4. Si un raccord manque, ajoute un point dans la région voisine puis rapproche-le.

## Exports

- **JSON éditeur** : format recommandé. Il contient `region_ids` + `contours`.
- **regions_contours.json** : format directement lisible par `RegionContourLayer.gd`.
- **SVG master** : fichier source pour retouche externe ou archivage.

Après export, lance `tools/map_regions/apply_region_editor_export.py` depuis le repo pour régénérer le mask, le JSON runtime, le SVG master et l'overlay debug.
