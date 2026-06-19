# Landing page E-Grid 2045

Landing statique créée pour présenter le projet du hackathon avec une DA raccord au prototype : carte stratégique vivante, bleu nuit, cyan énergie, violet compute, alertes chaudes, glassmorphism et effets 3D.

## Lancer localement

Ouvrir directement :

```text
landing/index.html
```

Ou servir depuis la racine du repo pour respecter les chemins relatifs des images :

```bash
python -m http.server 8080
```

Puis ouvrir :

```text
http://127.0.0.1:8080/landing/
```

## Contenu

- `index.html` : structure de la landing, sections pitch, captures, vidéo placeholder, outil de régions et CTA.
- `styles.css` : DA premium, layout responsive, glass panels, cartes 3D, halos, ticker, video shell.
- `main.js` : canvas de réseau énergétique, tilt 3D, parallax souris, magnetic buttons, reveal au scroll et barre de progression.

## Assets utilisés

La page référence directement les assets existants du repo :

- `Docs/menu.png`
- `Docs/Concept art - EU-Grid 2026-v2-0.png`
- `Docs/Concept art - EU-Grid 2026-v2-1.png`
- `Docs/Concept art - EU-Grid 2026-v2-2.png`
- `egrid_region_editor_tool/assets/map/europe_map_backdrop_generated_clean_v1.png`

## Emplacement vidéo

La section `#video` est un placeholder 16:9 prêt à remplacer par un embed ou un lecteur vidéo quand la présentation sera disponible.

## Notes

- Aucun framework ni dépendance externe.
- Compatible ouverture locale, GitHub Pages ou serveur statique.
- Les animations respectent `prefers-reduced-motion`.
