# E-Grid 2045 - Performance Review

## Points d'intervention

1. P0 - Ouverture des Parametres trop lourde.
   - Symptome: le clic Parametres payait le chargement/instanciation de toute la scene de settings.
   - Cause principale: l'onglet Clavier construisait toutes ses lignes dans `_ready()`, meme si l'onglet visible est Son.
   - Intervention: pre-instancier le menu Parametres cache depuis le menu principal, et initialiser l'onglet Clavier seulement a sa premiere ouverture.

2. P0 - Passage Menu -> Jeu avec pics CPU.
   - Symptome: le clic Jouer declenchait chargement de scene, parsing CSV/JSON, chargement texture carte, conversion du masque en Image et parsing des contours.
   - Cause principale: des ressources runtime etaient chargees dans `_ready()` de la scene de jeu, donc apres le clic.
   - Intervention: precharger la scene en thread, prechauffer les donnees de simulation, mettre en cache les assets de carte depuis le menu, puis instancier une GameScene cachee et desactivee pour payer `_ready()` avant le clic Jouer.

3. P1 - Absence de tests de non-regression perf sur les chemins de chargement.
   - Symptome: les gains etaient ressentis mais non mesures.
   - Intervention: ajouter des tests Godot headless qui verifient l'ouverture lazy des Parametres et mesurent cold/warm cache pour donnees + carte.

4. P1 - Rafraichissements UI trop larges.
   - Symptome: certains clics UI reconstruisent ou redraw des sous-arbres complets quand les donnees n'ont pas change.
   - Intervention deja faite: le build palette evite de se reconfigurer si le contexte est identique, et les textes bitmap evitent des redraws si la valeur ne change pas.
   - Suite possible: ajouter des compteurs/debug hooks sur MapView pour verifier les redraws redondants avant d'aller plus loin.

5. P1 - Textures importees sans compression VRAM.
   - Symptome: beaucoup de `.import` sont en `compress/mode=0`, y compris de gros fonds 1672x941.
   - Risque: plus de VRAM et de bande passante, surtout sur portable.
   - Decision: ne pas changer en aveugle les imports dans cette passe, car la compression peut degrader l'UI/polices. A traiter avec comparaison visuelle avant/apres.

6. P2 - Warnings GDScript au demarrage.
   - Symptome: `UNUSED_PARAMETER` et `SHADOWED_VARIABLE_BASE_CLASS` polluaient la console.
   - Intervention: nettoyer les noms de variables/parametres pour que les vrais warnings ressortent.

## Plan de correction

1. Ajouter un test qui prouve que l'ouverture Parametres ne construit pas l'onglet Clavier.
2. Ajouter un benchmark de cache runtime pour mesurer le cout cold vs warm des donnees et de la carte.
3. Ajouter un test de transition Jouer qui exige une GameScene prechauffee avant le clic.
4. Garder les corrections existantes sur prewarm, lazy init et caches.
5. Verifier avec les smoke tests existants: gameplay, transition menu, UI performance.
6. Documenter les mesures obtenues a chaque passe.

## Mesures

Les valeurs exactes dependent de la machine et du renderer headless. Les tests impriment les temps en microsecondes pour suivre l'evolution.

| Test | Mesure |
| --- | --- |
| `e_grid_settings_lazy_smoke_test.gd` | `open_usec=7768`, `keyboard_rows=14` |
| `e_grid_runtime_cache_performance_test.gd` | `data_cold_usec=5914`, `data_warm_usec=250`, `map_cold_usec=32247`, `map_warm_usec=9` |
| `e_grid_menu_transition_smoke_test.gd` | Clic immediat avant prewarm complet: `transition_usec=2257930` |
| `e_grid_menu_prewarm_transition_performance_test.gd` | Apres GameScene cachee + caches runtime: `transition_usec=92122` |
| `e_grid_ui_performance_smoke_test.gd` | `pick_usec=8609`, `processing=/root/GameScene/SimulationCore` |
| `e_grid_gameplay_smoke_test.gd` | Passed |

Le passage Jouer apres prewarm complet passe donc d'environ 1,02 s mesure avant cette derniere passe a environ 0,092 s, soit un gain d'environ 11x sur le pic visible au clic. Les warnings GDScript signales (`UNUSED_PARAMETER`, `SHADOWED_VARIABLE_BASE_CLASS`) sont absents de l'import headless filtre. Les tests de scenes peuvent encore afficher des warnings de teardown RID/ObjectDB propres au runner headless apres `quit()`, mais ils ne correspondent pas aux warnings GDScript de demarrage.
