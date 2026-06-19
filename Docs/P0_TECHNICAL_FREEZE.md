# E-Grid 2045 - Gel technique P0 v0.8

Objectif : ne pas dépasser 45 minutes de décisions avant de coder la première boucle jouable.

## Décisions verrouillées

1. **Constantes runtime** : `balance_constants.json` est la source chargée par `SimulationCore`. `global_constants.csv` est documentaire/fallback.
2. **Réseau** : `network_graph.json` est la source des voisins. Les distances sont générées au chargement par BFS, plafonnées par `regional_distance_cap`.
3. **Carte P0** : `region_layout.json` fournit les coordonnées normalisées `0..1` des points "capitales", précalculées depuis les centroïdes des polygones de régions. `region_layout.csv` est un miroir éditable.
4. **Ressources** : les `*_delta` positifs créent de la production/capacité. Les `consumes_*` créent la demande. Les `*_delta` négatifs sont ignorés en P0 pour éviter le double comptage.
5. **Éolien offshore** : `wind_offshore` est `locked` et débloqué par `offshore_wind`.
6. **Équilibrage** : CO2 et cooling sont à retester après la première boucle jouable, sans bloquer le début du code.

## Ordre de chargement recommandé

`balance_constants.json` -> `regions.csv` -> `region_layout.json` -> `buildings.csv` -> `technologies.csv` -> `network_graph.json` -> génération BFS -> `initial_state.csv`.

## Critère d'acceptation P0

Le joueur peut sélectionner une région, construire au moins une université, une centrale, un refroidissement et un datacenter, passer les mois, voir les KPI évoluer, et obtenir une alerte actionnable.
