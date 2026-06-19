# Landing page E-Grid 2045

Landing statique créée pour présenter le projet du hackathon avec une DA raccord au prototype : carte stratégique vivante, bleu nuit, cyan énergie, violet compute, alertes chaudes, glassmorphism et effets 3D.

## Lancer localement

Ouvrir directement :

```text
landing/index.html
landing/download.html
```

Ou servir depuis la racine du repo pour respecter les chemins relatifs des images :

```bash
python -m http.server 8080
```

Puis ouvrir :

```text
http://127.0.0.1:8080/landing/
http://127.0.0.1:8080/landing/download.html
```

## Contenu

- `index.html` : structure de la landing, sections pitch, souveraineté IA, partenaires/sponsors, captures, outil de régions, liens web play, lien GitHub discret et CTA de téléchargement.
- `favicon.svg` : icône de page E-Grid 2045, utilisée par la landing et le manifeste web.
- `site.webmanifest` : métadonnées d’application web pour les navigateurs.
- `download.html` : page dédiée aux téléchargements Windows, macOS et Linux, avec texte centré sur le projet et les partenaires.
- `styles.css` : DA premium commune, layout responsive, glass panels, cartes 3D, halos, ticker.
- `sponsors.css` : styles de la section de remerciement, carte photo DefendIntelligence et cartes partenaires.
- `download.css` : effets spécifiques à la page de download : réacteur 3D, cartes OS, overlay de cérémonie, terminal et responsive.
- `download-polish.css` : correctifs de layout, notamment le conflit de classe Linux, plus les styles du bloc partenaires.
- `main.js` : canvas de réseau énergétique, tilt 3D, parallax souris, magnetic buttons, reveal au scroll et barre de progression.
- `download.js` : détection OS, résolution des assets de la dernière GitHub Release, mise en avant du build recommandé, terminal animé, overlay de téléchargement et confettis canvas.

## Métadonnées de partage

`index.html` contient les balises utiles aux cartes de prévisualisation dans les applications de discussion : Open Graph, Twitter Card, canonical URL, image de partage et alt text. L’image de partage utilise le concept art `Docs/Concept art - EU-Grid 2026-v2-1.png`, copié dans le site GitHub Pages par le workflow de release.

URLs déclarées :

```text
https://exifs.github.io/Hackaton-Engie-E-Grid-2045/landing/
https://exifs.github.io/Hackaton-Engie-E-Grid-2045/Docs/Concept%20art%20-%20EU-Grid%202026-v2-1.png
```

## Disponibilité web

Le jeu est également disponible en version web sur GitHub Pages. Depuis la landing publiée, les liens `Jouer web` ciblent :

```text
../play/
```

Ce chemin correspond à la même URL publique que la landing, avec `/play/` à la racine du site GitHub Pages. Exemple attendu après publication :

```text
https://exifs.github.io/Hackaton-Engie-E-Grid-2045/play/
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
