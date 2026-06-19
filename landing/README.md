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

- `index.html` : structure de la landing, sections pitch, captures, vidéo placeholder, outil de régions, lien GitHub discret et CTA de téléchargement.
- `download.html` : page dédiée aux téléchargements Windows, macOS et Linux, avec texte centré sur le projet et les partenaires.
- `styles.css` : DA premium commune, layout responsive, glass panels, cartes 3D, halos, ticker, video shell.
- `download.css` : effets spécifiques à la page de download : réacteur 3D, cartes OS, overlay de cérémonie, terminal et responsive.
- `download-polish.css` : correctifs de layout, notamment le conflit de classe Linux, plus les styles du bloc partenaires.
- `main.js` : canvas de réseau énergétique, tilt 3D, parallax souris, magnetic buttons, reveal au scroll et barre de progression.
- `download.js` : détection OS, mise en avant du build recommandé, terminal animé, overlay de téléchargement et confettis canvas.

## Partenaires affichés

La landing et la page de téléchargement mentionnent :

- DefendIntelligence, streamer Twitch ;
- ENGIE ;
- OpenAI.

## Assets utilisés

La page référence directement les assets existants du repo :

- `Docs/menu.png`
- `Docs/Concept art - EU-Grid 2026-v2-0.png`
- `Docs/Concept art - EU-Grid 2026-v2-1.png`
- `Docs/Concept art - EU-Grid 2026-v2-2.png`
- `egrid_region_editor_tool/assets/map/europe_map_backdrop_generated_clean_v1.png`

## Emplacement vidéo

La section `#video` est un placeholder 16:9 prêt à remplacer par un embed ou un lecteur vidéo quand la présentation sera disponible.

## Liens GitHub et téléchargements

Le lien GitHub public cible :

```text
https://github.com/Exifs/Hackaton-Engie-E-Grid-2045
```

Les boutons de téléchargement ciblent les assets de la dernière release :

```text
https://github.com/Exifs/Hackaton-Engie-E-Grid-2045/releases/latest/download/E-Grid-2045-Windows.zip
https://github.com/Exifs/Hackaton-Engie-E-Grid-2045/releases/latest/download/E-Grid-2045-macOS.zip
https://github.com/Exifs/Hackaton-Engie-E-Grid-2045/releases/latest/download/E-Grid-2045-Linux.zip
```

Pour activer les téléchargements directs, publier ces trois archives dans GitHub Releases avec exactement ces noms, ou modifier les `href` / `data-file` dans `download.html`.

## Notes

- Aucun framework ni dépendance externe.
- Compatible ouverture locale, GitHub Pages ou serveur statique.
- Les animations respectent `prefers-reduced-motion`.
