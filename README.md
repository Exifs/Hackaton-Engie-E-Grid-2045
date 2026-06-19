# E-Grid 2045

> Build. Optimize. Power Europe.

**E-Grid 2045** est un prototype de jeu de stratégie / simulation créé dans le cadre du **Hackathon Energie 2026**, avec **DefendIntelligence**, **ENGIE** et **OpenAI**.

Le pitch: piloter le réseau énergétique européen face à l'explosion des besoins en calcul, aux tensions de capacité, aux contraintes carbone et à la course mondiale à l'IA. Le joueur construit, arbitre, optimise et encaisse les alertes jusqu'à trouver un équilibre viable entre énergie, datacenters, refroidissement, recherche et souveraineté numérique.

![E-Grid 2045 gameplay concept](<Docs/Concept art - EU-Grid 2026-v2-0.png>)

## Pourquoi regarder ?

- Un concept clair: transformer les enjeux énergie x IA en boucle de gameplay lisible.
- Une base **data-driven**: régions, technologies, bâtiments, événements, scoring et réseau sont décrits dans des fichiers CSV/JSON.
- Un prototype **Godot** pensé pour avancer vite vers une première boucle jouable.
- Une direction artistique déjà posée: interface strategy game, carte européenne, flux énergie/data/cooling et ambiance techno-industrielle.
- Un outillage de production créé pour le hackathon: éditeur de régions dans navigateur, exports JSON/SVG et génération d'assets carte pour Godot.

## Apercu

| Menu principal | Réseau énergétique | Datacenters & cooling |
| --- | --- | --- |
| ![Menu principal](<Docs/menu.png>) | ![Réseau énergétique](<Docs/Concept art - EU-Grid 2026-v2-1.png>) | ![Datacenters et cooling](<Docs/Concept art - EU-Grid 2026-v2-2.png>) |

## Outil hackathon: Region Shape Editor

Pour transformer rapidement une Europe stylisée en carte jouable, le repo embarque `egrid_region_editor_tool/`: un éditeur web standalone conçu pour créer et affiner les délimitations gameplay des **30 régions E-Grid 2045** directement dans un navigateur, par-dessus le fond de carte du projet.

L'objectif est très hackathon: éviter de perdre du temps dans un logiciel externe lourd, permettre à un designer ou à un développeur d'ajuster les frontières en quelques minutes, puis réinjecter le résultat dans Godot sous forme d'assets data-driven.

Ce que permet l'outil:

- sélectionner une région depuis la liste ou directement sur la carte;
- déplacer les sommets, ajouter/supprimer des points et déplacer une région entière;
- gérer les composants séparés, comme les îles ou morceaux de régions;
- activer les **sommets liés** pour garder des bordures raccordées entre régions voisines;
- zoomer, panner, filtrer les régions, afficher les labels, isoler la région sélectionnée et utiliser undo/redo;
- sauvegarder localement dans le navigateur;
- exporter un JSON éditeur, un `regions_contours.json` runtime ou un SVG master retouchable.

Le pipeline ne s'arrête pas à l'édition visuelle: l'export JSON peut être passé à `tools/map_regions/apply_region_editor_export.py` pour régénérer les contours, le masque d'IDs de régions, la LUT de région, l'overlay de debug et le SVG master. En pratique, cela donne une chaîne courte: **édition navigateur -> export -> assets Godot vérifiables**.

Lancer l'éditeur:

```bash
cd egrid_region_editor_tool
python tools/region_editor/launch_region_editor.py
```

Pour une démo sans serveur local, ouvrir directement:

```text
egrid_region_editor_tool/tools/region_editor/region_shape_editor_standalone.html
```

## Contenu du repo

- `e-grid-2045/` - projet Godot, scènes, scripts et assets intégrés.
- `Docs/` - game design, direction artistique, visuels, données de simulation et gel technique P0.
- `Docs/*.csv` / `Docs/*.json` - constantes de gameplay, régions, graphe réseau, technologies, bâtiments et événements.
- `egrid_region_editor_tool/` - éditeur web et scripts d'intégration pour produire les délimitations des régions et les assets carte Godot.

## Lancer le projet

1. Ouvrir `e-grid-2045/project.godot` avec Godot 4.6 ou plus récent.
2. Lancer la scène principale configurée dans le projet.

## Builds Godot

La CI exporte les versions Linux, Windows, macOS et Web depuis le projet `e-grid-2045/`. Les artefacts sont publiés en ZIP dans l'onglet Actions.

La version Web utilise le preset Godot `Web`, génère `e-grid-2045/build/web/index.html` comme point d'entrée et produit l'artefact `e-grid-2045-web`.

Lorsqu'un tag est poussé, le workflow de release publie aussi la landing dans `/landing/`, déploie la version Web jouable dans `/play/` à partir de l'artefact `e-grid-2045-web` déjà buildé, et met en ligne le Region Shape Editor dans `/region-editor/`.

État actuel: prototype de hackathon, avec un scope P0 centré sur une première boucle jouable et une base technique suffisamment lisible pour contribuer rapidement.
