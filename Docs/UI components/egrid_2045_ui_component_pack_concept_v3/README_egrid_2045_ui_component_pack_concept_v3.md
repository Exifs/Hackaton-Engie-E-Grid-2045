# E-Grid 2045 — UI Component Pack Concept-Faithful v3

Cette passe corrige la v2 en se rapprochant beaucoup plus des concept arts originaux :

- cadres fins à coins coupés discrets, comme les panneaux Build / Inspector ;
- fonds graphite bleu-noir texturés, très peu de glow ;
- cyan utilisé principalement pour focus, sélection et information active ;
- warning/critical portés par une bordure, un pictogramme et une petite accent-line, pas par un changement complet de composant ;
- sliders et progress bars contraints au langage des status bars de l’inspecteur ;
- slot cards et icon buttons dérivés des tuiles de bâtiments visibles dans les concepts ;
- texte volontairement absent des sprites de production pour rester dynamique dans Godot.

## Structure

- `spritesheets/` : spritesheets transparents par famille de composants.
- `sprites/` : PNG transparents individuels par état.
- `previews/` : planches de validation DA.
- `screenshots/` : exemples d’intégration sur les fonds/concepts existants.
- `manifest/egrid_ui_components_concept_v3_manifest.json` : découpe des spritesheets, états et chemins.

## États inclus

Dropdowns, list items, sliders horizontaux/verticaux, progress bars, construction rings, checkbox, radio, toggle, tabs, input fields, scrollbars, icon buttons, slot cards, resource chips, alert/toast cards, panels, tooltips et mini CTA.

## Godot

Importer les spritesheets en `Texture2D`, créer des `AtlasTexture` par frame selon `cell_size_px`, ou utiliser les PNG individuels. Les labels, valeurs, pourcentages et textes d’alerte doivent rester des `Label` dynamiques avec l’atlas de police déjà créé.
