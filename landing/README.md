# Landing page E-Grid 2045

Landing statique créée pour présenter le projet du hackathon avec une DA raccord au prototype : carte stratégique vivante, bleu nuit, cyan énergie, violet compute, alertes chaudes, glassmorphism et effets 3D.

## Lancer localement

Ouvrir directement :

```text
landing/index.html
landing/access.html
landing/download.html
```

Ou servir depuis la racine du repo pour respecter les chemins relatifs des images :

```bash
python -m http.server 8080
```

Puis ouvrir :

```text
http://127.0.0.1:8080/landing/
http://127.0.0.1:8080/landing/access.html
http://127.0.0.1:8080/landing/download.html
```

## Contenu

- `index.html` : vraie landing marketing grand public, avec pitch, souveraineté IA, captures, partenaires et CTA principaux.
- `access.html` : page dédiée aux accès jouables, builds, téléchargements, GitHub, releases et outils techniques.
- `favicon.svg` : icône de page E-Grid 2045, utilisée par la landing et le manifeste web.
- `site.webmanifest` : métadonnées d’application web pour les navigateurs.
- `download.html` : page dédiée aux téléchargements Windows, macOS et Linux, avec texte centré sur le projet et les partenaires.
- `styles.css` : DA premium commune, layout responsive, glass panels, cartes 3D, halos, ticker.
- `sponsors.css` : styles de la section de remerciement, carte photo DefendIntelligence et cartes partenaires.
- `polish.css` : correctifs de lisibilité landing : menu simplifié, superposition propre du hero text et prévention du clipping.
- `access.css` : styles spécifiques de la page `access.html`.
- `download.css` : effets spécifiques à la page de download : réacteur 3D, cartes OS, overlay de cérémonie, terminal et responsive.
- `download-polish.css` : correctifs de layout, notamment le conflit de classe Linux, plus les styles du bloc partenaires.
- `main.js` : canvas de réseau énergétique, tilt 3D, parallax souris, magnetic buttons, reveal au scroll et barre de progression.
- `download.js` : détection OS, résolution des assets de la dernière GitHub Release, mise en avant du build recommandé, terminal animé, overlay de téléchargement et confettis canvas.
- `../play-js/` : version JS/TypeScript + Phaser publiée par le workflow Pages, séparée du build Godot historique.

## Organisation landing / technique

La navigation de `index.html` reste volontairement courte pour éviter de casser le layout du header : Pitch, Souveraineté, Captures, Partenaires et Accès. Les liens techniques et de build sont regroupés dans `access.html` : version JS, build Godot Web, téléchargements desktop, GitHub, releases, docs et Region Shape Editor.

Le texte du hero conserve son impact visuel, mais `polish.css` élargit la boîte du titre et le place au-dessus du visuel hero pour éviter que `Pilote l’Europe énergétique dans la course à l’AGI.` soit coupé sur les largeurs intermédiaires.

## Métadonnées de partage

`index.html` contient les balises utiles aux cartes de prévisualisation dans les applications de discussion : Open Graph, Twitter Card, canonical URL, image de partage et alt text. L’image de partage utilise le concept art `Docs/Concept art - EU-Grid 2026-v2-1.png`, copié dans le site GitHub Pages par le workflow de release.

URLs déclarées :

```text
https://exifs.github.io/Hackaton-Engie-E-Grid-2045/landing/
https://exifs.github.io/Hackaton-Engie-E-Grid-2045/Docs/Concept%20art%20-%20EU-Grid%202026-v2-1.png
```

## Disponibilité web

Le jeu et le Region Shape Editor sont disponibles sur GitHub Pages. Depuis la landing publiée, les liens publics ciblent :

```text
../play-js/
../play/
../region-editor/
```

Ces chemins correspondent à la même URL publique que la landing, avec `/play-js/`, `/play/` et `/region-editor/` à la racine du site GitHub Pages. `/play-js/` sert la version Vite + Phaser ; `/play/` conserve le build Web Godot. Exemples attendus après publication :

```text
https://exifs.github.io/Hackaton-Engie-E-Grid-2045/landing/
https://exifs.github.io/Hackaton-Engie-E-Grid-2045/play-js/
https://exifs.github.io/Hackaton-Engie-E-Grid-2045/play/
https://exifs.github.io/Hackaton-Engie-E-Grid-2045/region-editor/
```

## Message souveraineté IA

La landing insiste sur le fait que l’IA n’est pas seulement un sujet logiciel. Elle dépend d’une chaîne matérielle et industrielle : énergie, refroidissement, datacenters, compute, chercheurs, maintenance et approvisionnement. La section `#sovereignty` sert à sensibiliser sur l’indépendance d’usage de l’IA et sur la souveraineté européenne de la chaîne nécessaire à son déploiement.

## Partenaires affichés

La landing et la page de téléchargement mentionnent :

- DefendIntelligence, streamer Twitch ;
- ENGIE ;
- OpenAI.

La section `#partners` remplace l’ancien placeholder vidéo. Elle remercie les partenaires et utilise une image publique issue de l’article Les Numériques “Le 27 novembre, le live Twitch des Nums accueille Defend Intelligence”.

## Assets utilisés

La page référence directement les assets existants du repo :

- `Docs/menu.png`
- `Docs/Concept art - EU-Grid 2026-v2-0.png`
- `Docs/Concept art - EU-Grid 2026-v2-1.png`
- `Docs/Concept art - EU-Grid 2026-v2-2.png`
- `egrid_region_editor_tool/assets/map/europe_map_backdrop_generated_clean_v1.png`

## Liens GitHub et téléchargements

Le lien GitHub public cible :

```text
https://github.com/Exifs/Hackaton-Engie-E-Grid-2045
```

Les boutons de téléchargement ne hardcodent plus un nom de fichier complet : ils résolvent l’asset correspondant dans la dernière GitHub Release via l’API publique GitHub. Si l’API n’est pas accessible, ils ouvrent la page `releases/latest` en fallback.

Les assets générés par le workflow de release utilisent ces préfixes :

```text
e-grid-2045-windows-x86_64-<tag>.zip
e-grid-2045-macos-universal-<tag>.zip
e-grid-2045-linux-x86_64-<tag>.zip
```

Ces préfixes viennent de `.github/workflows/godot-release.yml` et le suffixe `<tag>` correspond au tag GitHub qui déclenche la release.

## Déploiement GitHub Pages

Le workflow `.github/workflows/godot-release.yml` se déclenche à chaque tag. Après la création de la GitHub Release, il prépare un artefact GitHub Pages contenant :

- le répertoire `landing/` ;
- la version Web Godot dans `play/` ;
- la version Web JS/Phaser dans `play-js/` ;
- le Region Shape Editor dans `region-editor/` ;
- les assets `Docs/` et `egrid_region_editor_tool/assets/map/` référencés par les pages HTML ;
- un `index.html` racine qui redirige vers `./landing/`.

Le site est publié sur GitHub Pages via `actions/upload-pages-artifact@v4` et `actions/deploy-pages@v5`.

### Configuration Pages et environnement

La source `GitHub Actions` dans `Settings -> Pages` active les workflows Pages, mais l’environnement `github-pages` peut encore limiter les branches ou tags autorisés à déployer.

Pour un déploiement déclenché par tag :

1. Aller dans `Settings -> Environments -> github-pages`.
2. Dans `Deployment branches and tags`, choisir `No restriction` ou `Selected branches and tags`.
3. Avec `Selected branches and tags`, ajouter une règle `Ref type = Tag` avec le motif `v*`.
4. Retirer ou valider les règles d’approbation si les tags doivent publier sans intervention manuelle.

Le workflow peut aussi créer automatiquement la règle de tag `v*` quand l’identifiant d’administration du dépôt est fourni dans les secrets de l’action.

Après déploiement, le workflow ajoute l’URL du site aux notes de release et tente de mettre à jour le champ **Website** du dépôt avec l’URL retournée par `actions/deploy-pages`.
