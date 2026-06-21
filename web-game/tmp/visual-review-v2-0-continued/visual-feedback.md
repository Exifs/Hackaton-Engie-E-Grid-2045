# Visual feedback - continued v2.0 pass

Reference: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\reference-v2-0.png`

## Iteration 00 - Continued baseline

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-00-current.png`

What is closer to the concept art:
- Previous pass already solved the main panel fill/crop problems and the bottom alert strip.
- The left and right panels occupy the correct edges and the map fills the central space.

What still differs visibly:
- Top bar still uses simple KPI chips for AGI progress instead of the two circular EU/USA progress rings.
- Mini GRID OVERVIEW is a CSS decoration, not a real data HUD module.
- Map modules are still flat and partially icon-like rather than small painted infrastructure assets.

What was changed:
- No code change in this baseline step.

What should be tried next:
- Build the AGI duel as a real component first because it is a high-visibility top-bar landmark.

Regressions introduced:
- None observed.

## Iteration 01 - AGI rings and top bar structure

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-01-agi-rings.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-01b-agi-kpi-order.png`

What is closer to the concept art:
- The top bar now has a dedicated EU vs USA AGI section with circular progress rings, VS separator, cyan/orange color split, and strong uppercase labels.
- Budget and date are separate top-bar panels with secondary lines, closer to the concept's budget/date blocks.
- Top-bar tooltip affordances remain available for richer hover detail.

What still differs visibly:
- The concept has more industrial trim and a right-side menu block; the game HUD still keeps its playable speed controls.
- Ring geometry is CSS-rendered, not identical to the painted concept's exact tick marks.

What was changed:
- Added `agiDuel`, `budgetKpi`, and `dateKpi` rendering in `GameHud`.
- Added desktop AGI-ring styling and KPI subline styling in CSS.
- Added rich tooltip data to AGI, budget, and date components.

What should be tried next:
- Replace the simplified GRID OVERVIEW pseudo-element with a real component tied to network data.

Regressions introduced:
- A later Playwright check found the taller desktop top bar overlapped non-concept desktop panels. This was fixed in the final pass by increasing desktop offsets.

## Iteration 02 - Real GRID OVERVIEW

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-02-grid-overview.png`

What is closer to the concept art:
- The lower-left panel now has a contained GRID OVERVIEW card with heading, mini map, nodes, flow lines, and legend.
- The card is data-driven from current network flows and region layout rather than being a static CSS label.
- The mini panel fills the formerly incomplete lower-left area without cropping.

What still differs visibly:
- The mini-map remains stylized and abstract, not the same hand-painted Europe inset from the concept.
- It intentionally stays compact to avoid stealing space from the construction controls.

What was changed:
- Added `gridOverviewCard`, graph line, flow line, and node generation in `GameHud`.
- Disabled the old `build-palette::before` pseudo overview.
- Added CSS for the real overview card, mini map, SVG flows, node glows, and legend.

What should be tried next:
- Improve the map modules so the central map reads less like simple icons and more like built infrastructure.

Regressions introduced:
- None observed. DOM measurements showed no overflow in the grid overview card.

## Iteration 03 - Map module assets

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-03-map-modules.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-03b-module-depth.png`

What is closer to the concept art:
- Map modules are now drawn as small isometric infrastructure pieces with bases, side faces, roof highlights, windows, cooling fans, and energy stacks.
- The building layer now sits above region halos, so modules remain readable like the concept's placed infrastructure assets.
- Labels and selected slots remain above or readable around the modules.

What still differs visibly:
- The modules are vector-drawn game assets, not the same high-detail painted buildings used in the concept.
- The exact geography relief and painted coast/city details still come from the current generated map backdrop.

What was changed:
- Reworked `drawModuleMarker` in `EGridMapScene`.
- Added reusable helpers for isometric bases, towers, cooling modules, energy modules, and polygon drawing.
- Swapped region/structure layer depths so infrastructure is not buried under region halos.

What should be tried next:
- Stop broad map-asset work unless a dedicated painted/atlas asset pass is requested; the remaining gap is mainly art-source fidelity.

Regressions introduced:
- None observed in the final capture. Panel measurements showed no overflow or collisions.

## Iteration 04 - Final offset and validation pass

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-04-final-pass.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-04b-agi-tooltip.png`

What is closer to the concept art:
- Final capture combines AGI rings, denser top bar, real GRID OVERVIEW, and more dimensional map modules.
- The main panels fill the screen without cropped or incomplete zones.
- Bottom alert strip remains contained and readable.

What still differs visibly:
- The concept uses a more bespoke painted map and building asset set.
- The right panel still remains a playable game panel, not a pixel-identical reproduction of the static concept's Netherlands detail panel.
- The top bar keeps gameplay speed controls instead of exactly matching every menu glyph in the concept.

What was changed:
- Increased desktop offsets for heatmap, build palette, and region panel to prevent overlap with the taller top bar in non-concept desktop tests.
- Enabled pointer events on every HUD element with `data-rich-tooltip`, so rich tooltips also work on non-button KPI panels such as the AGI duel.
- Re-captured the concept scenario at 1672x941.

What should be tried next:
- A future high-impact pass would be a dedicated painted map/module atlas and a fuller right-panel concept skin, but those are larger art-system tasks.

Regressions introduced:
- None after the offset fix. Final DOM capture reported no JS errors, no panel overflow, and no panel collisions.

## Iteration 05 - Right region panel convergence

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-05-right-panel.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-05b-right-panel-tuned.png`

What is closer to the concept art:
- The right panel now follows the concept structure more closely: region title, close glyph, level/XP row, Overview/Buildings/Stats tabs, building slots, lock placeholders, status bars, and a Manage Region command.
- The building slot grid uses four compact columns and shows six active assets plus two locked cells, much closer to the concept's dense module grid.
- Energy, cooling, and compute status blocks now expose production/demand/reserve style detail instead of only generic meter rows.

What still differs visibly:
- The panel is still tied to the live Benelux simulation data, so values are adapted rather than copied from the static Netherlands concept.
- The tabs are visual state indicators for this pass; they are not separate subviews yet.

What was changed:
- Reworked `regionPanel` markup in `GameHud`.
- Added a `regionStatusBlock` helper.
- Added a real `open-construction` action for the Manage Region button.
- Added right-panel CSS for level, tabs, compact slots, lock cells, status blocks, and desktop fit.

What should be tried next:
- Improve the map module assets by reusing the existing ImageGen building atlas in Phaser.

Regressions introduced:
- None observed. DOM measurements showed no panel overflow.

## Iteration 06 - ImageGen atlas on map modules

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-06-map-imagegen-atlas.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-06b-map-atlas-scale.png`

What is closer to the concept art:
- Map modules now use the existing ImageGen-generated `building-icon-atlas.png` instead of relying only on vector primitives.
- Infrastructure markers are more asset-like and readable from the map view, with recognizable wind, datacenter, gas, research, and cooling silhouettes.
- The atlas was already project-local and transparent, so no new low-quality or external bitmap was introduced.

What still differs visibly:
- The map is now richer but also busier than the concept in some areas because live regional modules are distributed across Europe.
- The exact painted concept buildings are not reproduced one-for-one; this is a reuse of the current game atlas.

What was changed:
- Loaded `assets/generated/building-icon-atlas.png` in `EGridMapScene`.
- Added a sprite container above region halos and below labels/slots.
- Cropped atlas cells per region building type and rendered them on top of existing isometric bases.
- Fixed atlas crop scaling so cells render at intended map size.

What should be tried next:
- Only generate a new dedicated map-module atlas if the current atlas feels too busy or too icon-like in playtests; otherwise the remaining gap is mostly art direction rather than layout.

Regressions introduced:
- Initial atlas scaling made sprites too small and showed mostly bases; fixed in `iteration-06b-map-atlas-scale.png`.
- Validation after the fix passed lint, unit tests, build, and the focused Playwright visual subset.

## Iteration 07 - Final continuation capture

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-07-final-continuation.png`

What is closer to the concept art:
- The full composition now combines the AGI top bar, concept-like right region panel, real GRID OVERVIEW, dense alert strip, and raster-backed map modules.
- Final panel measurements reported no overflow and no collisions between top bar, side panels, grid overview, and alerts.

What still differs visibly:
- The atlas-based map modules are more game-icon-like than the exact painted concept modules.
- The concept's exact relief map and static Netherlands panel values are not copied; this remains a playable Benelux game state.

What was changed:
- No additional code change after iteration 06; this is the final verification capture for the continued pass.

What should be tried next:
- If further art convergence is needed, generate a dedicated map-module atlas with ImageGen specifically for tiny in-map buildings rather than reusing the larger UI icon atlas.

Regressions introduced:
- None observed.

## Iteration 08 - Component audit baseline

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-08-current-audit.png`

What is closer to the concept art:
- The previous work holds: top bar, right panel, GRID OVERVIEW and atlas map modules are stable.
- DOM measurements showed no overflow or panel collisions.

What still differs visibly:
- The left BUILD rail is still structurally different from the concept: generic dock header, missing category icon column, and category order differs.
- Map modules remain more icon-like than painted concept modules.

What was changed:
- Added a separate component-by-component audit at `component-diagnostics.md`.

What should be tried next:
- Prioritize the left BUILD rail because it is the largest remaining component-level mismatch that can be improved without new art generation.

Regressions introduced:
- None observed.

## Iteration 09 - BUILD rail category structure

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-09-build-rail-categories.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-09b-build-rail-order.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-09c-build-rail-fit.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-09d-build-rail-no-overlap.png`

What is closer to the concept art:
- Left rail now has a fixed `BUILD` header with collapse glyph.
- Construction categories now use a large category icon tile on the left and compact building cells on the right.
- Concept mode orders categories as Energy, Datacenters, Cooling, Research, Grid & Network.
- `GRID & NETWORK` is visible before the mini GRID OVERVIEW.

What still differs visibly:
- The category icon art comes from the existing building icon atlas, not the exact monochrome utility symbols from the concept.
- Some locked/research-gated cells show current game art/disabled state rather than the concept's exact placeholders.

What was changed:
- Added concept-only category label/order logic in `GameHud`.
- Added category icon key mapping and category heading markup.
- Added concept desktop CSS for BUILD header, category rows, large icon tiles, compact card cells and a shorter GRID OVERVIEW.
- Limited concept mode category rows to four visible cards so the rail does not overlap the mini-map.

What should be tried next:
- If the left rail remains a priority, generate or draw monochrome utility category symbols closer to the concept's lightning/datacenter/fan/microscope/grid set.
- Otherwise return to map art fidelity and module density.

Regressions introduced:
- First category-order pass overlapped `GRID OVERVIEW`; fixed by limiting visible cards and reducing the mini overview height. Final measurement showed no overlap.

## Iteration 10 - Utility category icons

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-10-utility-category-icons.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-10b-utility-icons-contrast.png`

What is closer to the concept art:
- The left BUILD rail category tiles now use the existing utility symbols: lightning, datacenter, cooling fan, research microscope and grid tower.
- These symbols are closer to the concept's icon-first build rail than the previous large building thumbnails.
- The icon tiles have stronger borders, cyan glow and a more readable monochrome silhouette.

What still differs visibly:
- The exact concept glyph style is not identical; current glyphs come from existing project PNG assets.
- The category rows are still game-driven, so locked/research-gated cells use current disabled card treatment.

What was changed:
- Exposed utility icon URLs as CSS variables from `main.ts`.
- Swapped build category icon markup to use `utility-category-icon-*` classes.
- Added CSS for centered utility icon backgrounds, larger symbol sizing, glow and borders.

What should be tried next:
- Continue with map module density and visual hierarchy, which remains a marked difference.

Regressions introduced:
- None observed. Measurements showed no rail/grid overview overlap.

## Iteration 11 - Map module density

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-11-map-module-density.png`

What is closer to the concept art:
- Concept scenario now shows fewer map module sprites, prioritizing regions with stronger visual/gameplay weight.
- The central map reads less cluttered and closer to the concept's lower-density painted infrastructure distribution.

What still differs visibly:
- Some map markers still use icon-like raster sprites rather than fully integrated painted structures.
- Region halos and network lines remain gameplay-forward compared with the concept's more art-directed routes.

What was changed:
- In `EGridMapScene.drawStructures`, concept mode now collects candidates, scores them by importance, limits to 15 visible module markers, then draws them back-to-front.
- Normal gameplay keeps the broader marker set.

What should be tried next:
- If map fidelity remains the top priority, generate or build a dedicated small in-map module atlas with fewer details and stronger terrain integration.
- Otherwise improve panel chrome/corner trim and bottom alert icons.

Regressions introduced:
- None observed in the concept capture; major panels still report no overflow.

## Iteration 12 - Alert strip actions and icons

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-12-alert-strip-baseline.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-12-alert-strip-actions.png`

What is closer to the concept art:
- Bottom alert cards now have a dedicated left icon, compact title/body area, and right action button.
- Action labels match concept behavior more closely: `VIEW` for map/region alerts and `CLAIM` for research-style alerts.
- A final collapse control now occupies the rightmost slot, matching the concept's extra bottom-bar control.

What still differs visibly:
- Alert icons are CSS/text symbols rather than exact concept glyph art.
- Alert copy is live gameplay text, so truncation and wording differ from the static concept cards.

What was changed:
- Added alert kind classification, action labels, action titles, icon markup and action buttons in `GameHud`.
- Added a `dismiss-all-alerts` action for the rightmost collapse control.
- Added concept desktop CSS for alert icons, action buttons, hidden per-card dismiss buttons, and the collapse slot.

What should be tried next:
- If bottom-strip fidelity remains a priority, replace CSS/text symbols with proper utility alert icons.
- Otherwise focus on panel chrome/borders or map art integration.

Regressions introduced:
- None observed. The alert strip remains within 84px and no card overflows.

## Iteration 13 - Panel chrome and bevels

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-13-chrome-baseline.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-13-panel-chrome.png`

What is closer to the concept art:
- Major HUD panels now have stronger borders, corner bevels, subtle internal scan texture and cyan edge highlights.
- The top bar, left rail, region panel, alerts strip and mini overview read more like hard sci-fi panels than generic translucent cards.

What still differs visibly:
- The concept uses more layered mechanical corner brackets and richer edge hardware.
- The chrome remains CSS-driven rather than custom painted panel art.

What was changed:
- Added concept-only bevel clipping, layered corner gradients and stronger inner panel shadows in `game.css`.
- Kept the established panel bounds to avoid reintroducing clipping or overlap.

What should be tried next:
- Strengthen the top brand typography and mini GRID OVERVIEW, which still look simplified next to the concept.

Regressions introduced:
- None observed. Measurements showed no overflow for `.top-kpi`, `.build-palette`, `.region-panel`, `.alerts-panel`, `.grid-overview-card` or alert cards.

## Iteration 14 - Top brand and mini GRID OVERVIEW geography

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-14-brand-minimap.png`

What is closer to the concept art:
- The `E-GRID 2045` brand is now a real dominant top-bar panel with large title type and a compact subtitle.
- The simulation speed area now has a concept-style label above the controls.
- The mini `GRID OVERVIEW` now uses a left legend and a right-side Europe silhouette with live flow dots/lines, closer to the concept's inset map composition.

What still differs visibly:
- The top bar still lacks the concept's separate hamburger/menu block.
- The mini Europe silhouette is simplified SVG geography rather than the exact painted glowing inset.

What was changed:
- Added `topBrand()` markup and rich tooltip metadata in `GameHud`.
- Added a `Simulation speed` label in the time-controls block.
- Reworked concept CSS for top-bar grid columns, brand typography and speed control layout.
- Added SVG Europe land paths to the mini overview and changed its layout to legend-left/map-right.

What should be tried next:
- Improve central map module legibility without increasing density or causing label collisions.

Regressions introduced:
- None observed. Screenshot metrics showed no overflow for top bar children, mini overview map or legend.

## Iteration 15 - Map module contrast and tooltip check

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-15-map-module-contrast.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-15b-rich-tooltip-brand.png`

What is closer to the concept art:
- Map modules are larger and brighter in concept scenario, with additive glow behind atlas sprites and a brighter isometric base.
- Buildings read more clearly against the dark terrain while the previous reduced-density pass still prevents heavy clutter.
- The new top brand tooltip renders in the same rich HUD style as the rest of the interface.

What still differs visibly:
- Some markers remain icon-like and dark compared with the concept's hand-painted building clusters.
- The map still uses live region labels and network topology, so it differs from the concept's country-label rhythm.

What was changed:
- Added concept-only sprite glow and slightly larger display size in `EGridMapScene.drawModuleSprite`.
- Added a subtle accent fill on isometric module bases.
- Captured a hover screenshot to validate rich tooltip styling on the new top brand component.

What should be tried next:
- If continuing, choose between: map route hierarchy/label treatment, dedicated painted module atlas, or small status icons in the right region panel.

Regressions introduced:
- None observed. Major HUD panels still report no overflow after the map-module pass.

## Iteration 16 - AGI ring tick detailing

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-16-agi-ring-ticks.png`

What is closer to the concept art:
- AGI rings now have segmented outer tick marks instead of a simple dashed outline.
- The cyan Europe and orange USA rings read closer to the reference top-bar gauges.

What still differs visibly:
- The gauge values come from live deterministic game state rather than the exact concept numbers.
- The ring rendering is still CSS-based, so it does not exactly match the concept's painted edge noise and micro-ticks.

What was changed:
- Replaced the dashed AGI pseudo-border with a solid subtle ring plus a masked repeating-conic tick layer.
- Lifted the ring value text above the tick layer.

What should be tried next:
- If continuing, the next highest-value items are map route hierarchy/label treatment or a dedicated painted module atlas.

Regressions introduced:
- None observed. The tick pseudo-elements intentionally extend beyond each ring box, but the AGI duel and top bar still report no overflow.

## Iteration 17 - AGI rings as ticks only

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-17-agi-ticks-only.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-17b-agi-ticks-only-no-ring-glow.png`

What is closer to the concept art:
- AGI gauges are now built from individual tick elements only.
- The continuous conic progress circle and the extra circular glow behind the ticks were removed.
- The central percentage remains readable on a dark disk while the surrounding ring is entirely segmented.

What still differs visibly:
- The exact tick count, tick weight and live progress values are still game-driven rather than matching the static concept exactly.

What was changed:
- Added deterministic tick markup in `GameHud.agiRingTicks`.
- Replaced CSS pseudo-ring rendering with per-tick styling in `game.css`.
- Removed the continuous conic-gradient progress layer and the continuous radial ring glow.

What should be tried next:
- Continue with map route hierarchy, label treatment or painted module atlas if further convergence is required.

Regressions introduced:
- None observed. The top bar still reports no overflow; each gauge renders 48 ticks with active ticks derived from progress.

## Iteration 18 - Top bar speed module and command menu

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-18-current-audit.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-18-topbar-speed-menu.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-18b-normal-overlap-fix.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-18c-concept-speed-menu-scoped.png`

What is closer to the concept art:
- The right side of the top bar now has a dedicated simulation speed module with pause/play/fast controls and a `1.0x` readout.
- A separate hamburger command block now occupies the far-right top-bar slot, matching the concept's terminal menu structure.
- The top bar remains a single continuous row with stable spacing and no clipped KPI text.

What still differs visibly:
- The deterministic game state currently highlights pause, while the static concept highlights play.
- The menu button reuses the existing onboarding/replay action rather than opening a full command menu.

What was changed:
- Replaced inline speed controls with `timeControls()` and concept-specific speed button markup in `GameHud`.
- Added `topMenuCommand()` for a real hamburger panel in the top bar.
- Updated desktop HUD CSS grid columns and added styling for the speed readout and menu block.
- Scoped the 5-column concept speed layout and hamburger visibility to `data-concept-scenario="1"` after Playwright exposed a normal-mode overlap regression.

What should be tried next:
- Continue with central map route hierarchy/label treatment, since it remains a larger visual difference than the now-stabilized top bar.

Regressions introduced:
- Initial pass caused the normal desktop speed `?` button to wrap and triggered a `.top-kpi` overlap failure at 1600x900.
- Fixed by restoring the normal 6-button speed grid and hiding the hamburger outside concept scenario. Final metrics showed no overflow for normal or concept top-bar components.

## Iteration 19 - Concept map route hierarchy

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-19-map-route-hierarchy.png`

What is closer to the concept art:
- The concept scenario now reduces secondary network clutter and gives active routes stronger visual priority.
- Major flows are drawn as curved routes with dark backing, cyan/orange color, a fine highlight and a pulse point on the curve.
- The map reads less like a dense graph overlay and more like the concept's curated strategic routes.

What still differs visibly:
- The map routes are still generated from live topology, so their exact layout does not match the painted concept routes.
- The central map assets/modules remain more icon-like than hand-painted infrastructure.

What was changed:
- Added concept-only route filtering in `EGridMapScene.drawFlows`.
- Added quadratic route helpers for curved route drawing and pulse placement.
- Kept the full graph-line rendering unchanged outside concept scenario.

What should be tried next:
- Continue with map labels/terrain integration or generate a dedicated painted module atlas if asset fidelity remains the top priority.

Regressions introduced:
- None observed in the concept screenshot. Major HUD panels still report no overflow.

## Iteration 20 - Concept geographic map labels

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-20-map-geo-labels.png`

What is closer to the concept art:
- Concept scenario now renders country labels and sea/ocean labels similar to the reference map.
- Internal gameplay region labels are suppressed in concept mode except for the selected region, so the map reads less like debug/game topology and more like the concept's strategic Europe view.
- Sea labels use a dim cyan treatment while country labels use compact pale uppercase text.

What still differs visibly:
- Label positions are normalized approximations, not exact painted label placement.
- Some eastern labels are partially covered by the right HUD, matching the layered HUD behavior but reducing readability.
- The map relief and building modules are still generated/game-driven rather than painted exactly like the concept.

What was changed:
- Added `CONCEPT_MAP_LABELS` data in `EGridMapScene`.
- Added `drawConceptGeoLabels()` for concept-only country and sea labels.
- Changed `drawRegions()` so concept mode keeps only the selected gameplay region label while normal mode keeps existing label behavior.

What should be tried next:
- Continue with asset fidelity: either refine module sprites/terrain integration or improve mini GRID OVERVIEW geography.

Regressions introduced:
- None observed in the concept screenshot. Major HUD panels still report no overflow.

## Iteration 21 - Map building icon visibility rule

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-21b-start-empty-map.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-21c-construction-grey-cube.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-21d-built-real-icon.png`

What is closer to the intended game state:
- Main-map building icons no longer appear at the start of a normal game when no buildings exist.
- Regions with queued construction now show a grey construction cube on the main map, not the final building icon.
- Real building icons appear only after the building is completed.
- Map placement is deterministic and type-aware: offshore/sea-cooling markers are pushed toward water, hydro/river assets toward water edges, and land buildings stay near the regional land anchor.
- A global visibility cap prevents built assets from overloading the map.

What still differs visibly:
- Concept scenario still contains pre-seeded buildings by design, so map icons remain there.
- Built/queued icons are still atlas sprites rather than fully painted infrastructure.

What was changed:
- Changed `EGridMapScene.drawStructures` to use `region.buildings.length + region.construction_queue.length` as the only visibility rule.
- Removed structure visibility from `starting_compute`, `starting_energy_generation`, region potential values and random fallback hashes.
- Added separate built/construction map marker candidates.
- Added `drawConstructionPlaceholder()` for the grey construction cube.
- Added type-aware `structureOffset()` placement and a global visible-structure cap.
- Added a Playwright regression test that verifies empty start, queued construction with zero building-atlas sprites, then completed construction with a real building sprite.

What should be tried next:
- Continue asset fidelity work only after preserving this gameplay invariant. Do not use the superseded `iteration-21-construction-map-building-visible.png` capture as current evidence; it came from the first pass before the grey construction cube correction.

Regressions introduced:
- None observed. Normal start reports `regionsWithStructures = 0`; construction queue shows a grey cube; after 6 months the datacenter becomes built and exactly one atlas sprite appears.

## Iteration 22 - Right panel status icons and hover diagnostics

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-22-region-status-icons.png`

What is closer to the concept art:
- The right region panel status blocks now include compact Energy, Cooling and Compute pictograms beside their headings.
- Status blocks expose rich hover tooltips with their metric breakdowns, keeping the more icon-heavy interface understandable in play.
- The panel remains stable: `.region-panel`, `.region-status-stack` and the three status icons report no overflow in the captured concept viewport.

What still differs visibly:
- The status pictograms are CSS-built utility icons, not exact painted concept glyphs.
- Values remain live scenario/game values rather than a hard-coded Netherlands mock.
- Region tabs are still mostly visual state and do not yet open separate subviews.

What was changed:
- Updated `GameHud.regionStatusBlock` to emit a heading icon and rich tooltip metadata for each status block.
- Added CSS icon variants for energy, cooling and compute in `game.css`.
- Verified the result with a focused right-panel screenshot and DOM overflow metrics.

What should be tried next:
- Continue with the remaining high-visibility differences: mini GRID OVERVIEW geography, central-map asset fidelity, or small chrome/glyph polish.
- Preserve the map construction-state invariant while improving any future building assets.

Regressions introduced:
- None observed in the right-panel capture. The status icons are fixed-size `18x18` elements and do not push metric text outside the panel.

## Iteration 23 - Mini GRID OVERVIEW map density

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-23-mini-grid-overview.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-23-mini-grid-overview-crop.png`

What is closer to the concept art:
- The mini GRID OVERVIEW no longer reads as a flat simplified SVG only; it now has a denser glowing Europe silhouette, coastline hints, scan texture and tactical halos.
- Power/data/congestion paths are curved with a dark backing, so the inset feels closer to the concept's illuminated strategic network.
- The legend-left/map-right composition remains intact and the component fills the lower left rail without clipping.

What still differs visibly:
- The inset geography is still code-generated, not a painted raster miniature of Europe.
- The exact node positions and flow counts remain live game data, so they do not match the static concept one-for-one.
- The new silhouette is more abstract/glowy than the concept's precise miniature coastline.

What was changed:
- Reworked `GameHud.gridOverviewEuropePaths()` with additional land fragments, coastline strokes and orbit arcs.
- Changed mini overview graph/flow rendering from straight SVG lines to deterministic quadratic paths.
- Added `miniRoutePath`, `miniClampCoord` and `miniHashString` helpers.
- Updated `game.css` with map halos, scan/vignette overlay, glow styling and fixed node layering.

What should be tried next:
- Continue asset fidelity on the central map modules/building clusters, or add small chrome/glyph polish if the map assets are deferred.
- If exact mini-map fidelity becomes important, replace the code-generated silhouette with a small raster inset while keeping the live nodes and flows.

Regressions introduced:
- None observed. Captured metrics report no overflow for `.build-palette`, `.grid-overview-card`, `.grid-overview-map` or `.grid-overview-legend`.

## Iteration 24 - Transfer concept-view improvements to the real game

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-24-real-game-transferred-overview.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-24b-real-game-grid-overview-visible.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-24b-real-game-build-rail-crop.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-24c-concept-state-aligned-components.png`

What is closer to the concept art and the playable game:
- The mini GRID OVERVIEW is now visible in the real game without `scenario=concept`, not only in the deterministic concept capture.
- Desktop normal play now uses the same concept-inspired topbar, hamburger command block, panel chrome, curved map routes, geographic labels and brighter map sprite treatment.
- The test/concept view now keeps the same component structure as the real game: heatmap switch, construction/research tabs, category tabs, hamburger and mini overview are all visible in both.
- The building visibility gameplay invariant remains intact: the real normal start has zero built/queued structures and zero map building icons.

What still differs visibly:
- The real game starts in January 2025 with live values and no prebuilt buildings, so it intentionally does not match the concept's 2045 Netherlands/Benelux state.
- The real build rail needs functional controls, so it is denser than the pure concept art; category tabs are compressed to reduce the gap but remain visible.
- The concept-state capture now shows more real-game controls than the static art because it is no longer a separate HUD variant.

What was changed:
- Made the concept-style simulation speed module the normal `GameHud.timeControls()` output.
- Moved panel chrome, top hamburger, mini GRID OVERVIEW, category icon rows and enriched alert strip styling out of `data-concept-scenario` desktop-only gates.
- Removed HUD structure differences from `GameHud`: category order/labels are shared, and building availability filtering is no longer bypassed in concept mode.
- Applied desktop map rendering improvements outside the concept scenario: curated curved routes, geographic labels, enhanced sprite glow/size and a lower visible-structure cap.
- Compressed desktop category tabs to two columns so the real build rail keeps controls visible without hiding the mini overview.
- Fixed follow-up regressions found by the full Playwright suite: removed duplicate `data-speed="1"` from the readout, restored individual alert dismiss controls, kept build-card art at the tested readable size, disabled onboarding in live-control regression tests, and updated layout tests for the new fixed desktop rail.

What should be tried next:
- Continue from the real-game screenshot, not only from `scenario=concept`.
- If the rail still feels too dense, tune the control stack height or introduce a compact icon tab row while preserving construction/research access.
- Remaining asset fidelity work should target the real map and real build cards first, then verify the concept-state capture as a secondary check.

Regressions introduced:
- Initial full-suite pass found regressions in alert dismissal, speed control targeting, old dock-resize assumptions and compact-card sizing; all were fixed before this iteration was closed.
- Final checked desktop captures report no overflow for topbar, build palette, mini overview, right panel and alert strip.
- `.palette-body` scrolls vertically in the real build rail because the real game has more functional controls than the concept art; this is expected and not a clipping bug.

## Iteration 25 - Compact real BUILD rail header

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-25b-real-game-compact-build-tabs.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-25b-real-game-build-rail-crop.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-25c-concept-state-compact-build-header.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-25c-concept-state-build-rail-crop.png`

What is closer to the concept art and the playable game:
- The BUILD rail header is much shorter: the desktop header dropped from about 148px to 100px.
- The main toggle now reads visually as a concept-like `BUILD` header with a compact collapse affordance.
- The locked/unavailable filter remains functional but becomes a compact icon-sized control on desktop.
- Category tabs now use a single horizontal strip instead of taking three vertical rows, so Energy, Datacenters, Cooling, Research and the mini GRID OVERVIEW are visible without a cut section on first render.

What still differs visibly:
- The real game still needs construction/research tabs and the locked filter, so the rail remains more functional and denser than the static concept.
- Category tabs are horizontally scrollable, while the concept does not show this extra control layer.
- GRID & Network cards are not shown in the default real start because locked/unavailable buildings remain hidden until the filter is enabled.

What was changed:
- Reworked desktop `.palette-header` into a two-column compact grid.
- Restyled `.palette-toggle` as the `BUILD` header/collapse control without changing its action or DOM target.
- Compressed `.dock-filter-toggle` to an icon-like control while preserving its label for accessibility and tests.
- Replaced the two-column category tab grid with a one-row horizontal strip.

What should be tried next:
- Continue with central-map asset fidelity or small chrome/glyph polish.
- If the horizontal category strip feels too game-like later, replace labels with compact icons/tooltips while preserving category access.

Regressions introduced:
- None observed. Real and concept-state captures report no vertical overflow in `.palette-header`, `.palette-body`, `.build-category-content` or `.grid-overview-card`.
- Targeted Playwright palette/filter/category interaction tests passed after the change.

## Iteration 26 - Grounded central map modules

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-26b-real-game-p0-balanced-map-modules.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-26b-concept-state-balanced-map-modules.png`

What is closer to the concept art and the playable game:
- Built map structures now have a terrain integration layer before the sprite: soft shadow, subtle accent glow, connector to the regional node and small anchor points.
- Buildings read less like detached UI sprites placed on top of the map and more like infrastructure sitting on the terrain/network layer.
- The change applies only to built structures, so the empty-start and grey-construction gameplay states remain visually distinct.

What still differs visibly:
- The building silhouettes still come from the generated icon atlas, so they remain cleaner and more icon-like than the concept's painted infrastructure clusters.
- The generated route topology and exact module positions still differ from the static concept.
- In selected regions, gameplay slot markers still add visual density around the module cluster.

What was changed:
- Added `drawModuleGroundIntegration()` in `EGridMapScene`.
- Built modules now draw a lighter terrain pad, contact shadow, accent halo, regional connector and small anchor nodes before the isometric base and sprite.
- Reduced pad size/opacity after the first capture because the initial version was too visually heavy around France Nord.

What should be tried next:
- Continue central-map fidelity with either a dedicated tiny in-map module atlas or more terrain/color integration.
- Preserve the invariant that construction shows a grey cube and completed buildings show final sprites.

Regressions introduced:
- None observed after balancing. Major HUD panels report no overflow.
- Targeted Playwright map tests passed: empty/construction/built states, P0 completed buildings, and far-region safe-area focus.

## Iteration 27 - Softer selected-region slot markers

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-27-real-game-empty-region-slots-visible.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-27-real-game-p0-soft-selected-slots.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-27-concept-state-soft-selected-slots.png`

What is closer to the concept art and the playable game:
- Selected-region slot markers no longer form a bright block over built infrastructure.
- Empty regions still show a clear capacity grid, preserving the building-planning affordance.
- Regions that already contain buildings or construction queues use smaller, dimmer slot cells so map modules and terrain remain the visual priority.

What still differs visibly:
- The static concept does not expose a gameplay slot grid at all; the real game keeps it for planning.
- Slot markers remain visible in selected built regions, just less dominant.
- Building sprites are still generated atlas art rather than fully painted terrain clusters.

What was changed:
- Updated `EGridMapScene.drawSelectedSlots()` to detect whether the selected region already has buildings or queued construction.
- Reduced slot size, empty-slot alpha, occupied-slot alpha and stroke alpha only in regions with visible structures.

What should be tried next:
- Continue central-map fidelity with a dedicated in-map module atlas or additional terrain color grading.
- If slot markers still feel too game-like later, consider a hover/build-mode-only treatment rather than permanent suppression.

Regressions introduced:
- None observed. HUD panels report no overflow in captured concept-state metrics.
- Targeted Playwright tests passed for construction palette, empty/construction/built map states and P0 completed buildings.

## Iteration 28 - Mini GRID OVERVIEW silhouette and network density

Screenshots:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\reference-v2-0-grid-overview-crop.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-28d-real-game-start-mini-overview.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-28d-real-game-start-mini-overview-crop.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-28d-real-game-p0-mini-overview.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-28d-real-game-p0-mini-overview-crop.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-28d-concept-state-mini-overview.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-28d-concept-state-mini-overview-crop.png`

What is closer to the concept art and the playable game:
- The mini GRID OVERVIEW now reads less like a broad translucent blob and more like a compact luminous Europe/network inset.
- The SVG geography has additional shoreline/ridge strokes, static backbone routes and small hubs behind the live flow lines.
- Live mini-map routes and DOM nodes now use a compressed horizontal coordinate transform, so the inset is closer to the vertical Europe silhouette in the reference crop.
- The change is active in the real game start, the real P0 state and the concept-state capture.

What still differs visibly:
- The reference crop still has a much more recognizable painted Europe coastline; the current version is improved but remains a stylized SVG approximation.
- The current map still lacks the exact mechanical expand icon and small painted texture inside the panel.
- Live data values and flow density differ from the static concept state, especially outside the concept scenario.

What was changed:
- Reworked `GameHud.gridOverviewEuropePaths()` with more detailed Europe fragments, shoreline/ridge paths, static route threads and hub circles.
- Added `miniCoordX()` / `miniCoordY()` so mini overview flows and nodes share the same compacted map projection as the static inset.
- Tuned `.grid-overview-map`, `.mini-europe-*` and `.mini-overview-*` CSS to reduce diffuse fill and emphasize crisp cyan lines/hubs.
- Created a reference crop for the component-level comparison.

What should be tried next:
- Replace or augment the SVG with a small painted/raster Europe inset if exact mini-map geography becomes the next priority.
- Add a concept-like expand glyph if panel chrome/glyph exactness rises above central-map asset fidelity.
- Continue central-map asset work: main map building sprites are still more icon-like than the painted clusters in the concept.

Regressions introduced:
- None observed in capture metrics. The mini overview is visible in real start, real P0 and concept-state captures.
- `iteration-28d-mini-overview-metrics.json` reports no card overflow; map/legend/card bounds remain stable.

## Iteration 29 - ImageGen raster mini-map asset

Screenshots and assets:
- Generated source: `C:\Users\cleme\.codex\generated_images\019ee6ab-f27a-78b2-904c-b7a46fb678d8\ig_051688e3d5aaa1f5016a37435e2b188191bede86e71a260aed.png`
- Project asset: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\public\assets\generated\grid-overview-europe-neon-v1.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-29b-real-game-start-raster-overview.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-29b-real-game-start-raster-overview-grid-overview-crop.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-29b-real-game-p0-raster-overview.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-29b-real-game-p0-raster-overview-grid-overview-crop.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-29b-concept-state-raster-overview.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-29b-concept-state-raster-overview-grid-overview-crop.png`

What is closer to the concept art and the playable game:
- The mini GRID OVERVIEW now uses a raster Europe asset generated with ImageGen, inspired by the main map backdrop and simplified into a ghostly neon inset.
- The Europe silhouette is much more recognizable at panel size than the previous SVG approximation.
- The live data-driven mini flow lines and nodes still render above the raster, so the component remains a real gameplay overview rather than a static screenshot.
- The asset is installed in the project under `public/assets/generated` and loaded through a CSS variable in the real game, real P0 state and concept-state capture.
- A subtle central-map atmosphere layer was also added underneath routes/modules, nudging the main map closer to the concept's cool painted glow without changing building-state rules.

What still differs visibly:
- The reference mini overview remains more hand-painted and has a tighter node topology; the generated asset is more detailed terrain-like and slightly darker.
- The expand glyph remains the current compact control mark rather than the exact four-corner concept icon.
- The main map still uses the existing generated building icon atlas, so building clusters remain more icon-like than the painted concept modules.

What was changed:
- Generated `grid-overview-europe-neon-v1.png` using the built-in ImageGen workflow.
- Exposed the raster as `--grid-overview-map` in `main.ts`.
- Reworked `.grid-overview-map` so the raster is the primary inset layer, with scan/vignette overlays and live SVG routes above it.
- Simplified `GameHud.gridOverviewEuropePaths()` to remove the old SVG landmass and keep only subtle route/orbit threads under live flows.
- Added `EGridMapScene.drawMapAtmosphere()` as a low-opacity map grading layer below flows and structures.

What should be tried next:
- If mini-map exactness remains a priority, generate one more asset variant with less terrain detail and more concentrated cyan network hubs.
- Continue central map asset fidelity: dedicated in-map module sprites are still the biggest remaining visual gap.
- Consider replacing the mini expand mark with a four-corner icon matching the concept.

Regressions introduced:
- None observed in captures. `iteration-29b-raster-overview-metrics.json` verifies raster background loading, no mini-card overflow, and stable real/concept bounds.

## Iteration 30 - Dedicated main-map building atlas

Screenshots and assets:
- Project asset draft: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\public\assets\generated\building-map-atlas-v1.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-30b-real-game-start-empty-map-atlas.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-30b-real-game-construction-cube-map-atlas.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-30b-real-game-built-map-atlas.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-30b-concept-state-map-atlas.png`

What is closer to the concept art and the playable game:
- The central map no longer reuses the brighter UI card/icon atlas directly; built map modules now load a separate map-only texture.
- The gameplay state invariant is preserved: empty start has no final building sprites, construction shows the grey cube, and completed construction swaps to the final building sprite.
- Metrics confirmed `mapAtlasSprites: 0` at start, `0` during construction, `2` after one built structure, and `30` in the dense concept scenario; `iconAtlasSprites` stayed `0` on the map.

What still differs visibly:
- The first map-only atlas pass was too ghostly on the terrain and still felt like scaled icon art rather than painted map structures.
- Some coastal clusters, especially Benelux in the concept scenario, needed better land/offshore separation.

What was changed:
- Added `public/assets/generated/building-map-atlas-v1.png`.
- Loaded it as `building-map-atlas` in `EGridMapScene`.
- Updated map sprite counting tests to recognize the map atlas separately from the UI atlas.

What should be tried next:
- Brighten and rebalance the map atlas while keeping it colder and less UI-like than the card art.
- Add a placement pass so offshore assets go to water and land assets do not drift into sea areas.

Regressions introduced:
- None observed in gameplay state metrics. The v1 asset was visually too subdued, so it should not be treated as the final map-asset evidence.

## Iteration 31 - Brighter map-only module atlas

Screenshots and assets:
- Project asset: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\public\assets\generated\building-map-atlas-v2.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-31-real-game-start-empty-map-atlas.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-31-real-game-construction-cube-map-atlas.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-31-real-game-built-map-atlas.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-31-concept-state-map-atlas.png`

What is closer to the concept art and the playable game:
- Map modules are more readable against the dark Europe terrain.
- The v2 atlas keeps a colder painted-map grade and a diffuse cyan bloom, but avoids the harder cyan sticker outline from the v1 draft.
- Phaser display size and additive halo were increased slightly, bringing completed buildings closer to the visual weight of the concept modules.

What still differs visibly:
- The modules are still derived from the existing generated building atlas, not hand-painted specifically into the map projection.
- The Benelux cluster showed that type-aware placement needed another pass: land assets were improved but not yet sufficiently constrained away from the North Sea.

What was changed:
- Generated `building-map-atlas-v2.png` from `building-icon-atlas.png` with reduced saturation, cool grading, diffuse bloom and a small shadow pass.
- Pointed the Phaser `building-map-atlas` texture to v2.
- Increased map sprite display size from the previous v1 pass and restored full alpha for enhanced desktop/concept rendering.

What should be tried next:
- Add coast-aware land/offshore offsets so the same built-state system remains credible in real play.
- Keep the right-panel/build-card art on the UI atlases; only the central map should consume `building-map-atlas-v2.png`.

Regressions introduced:
- None in state metrics: `iteration-31-map-atlas-metrics.json` still reports no final sprites at start or during construction.

## Iteration 32 - Coast-aware map structure placement

Screenshots and metrics:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-32-real-game-start-empty-map-atlas.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-32-real-game-construction-cube-map-atlas.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-32-real-game-built-map-atlas.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-32-concept-state-map-atlas.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-32-map-atlas-metrics.json`

What is closer to the concept art and the playable game:
- Coastal land buildings now receive a small inland inset, while `sea_cooling` and other offshore assets still use the regional coast vector.
- The Benelux concept cluster reads more credibly: land modules sit closer to the continent and the sea-cooling pair remains in the North Sea.
- The real game still starts with no map building sprites, shows only the grey cube during construction, and shows final sprites only after construction completes.
- The mini GRID OVERVIEW remains visible in the real start, real built state and concept-state captures after the central-map changes.

What still differs visibly:
- The concept modules are still more integrated into the painted terrain than the current atlas-derived sprites.
- Exact route topology, module positions and country label placements still differ from the static concept.
- The mini GRID OVERVIEW asset is now much closer, but its network topology remains a live simplified overlay rather than the exact painted reference crop.

What was changed:
- Added `landStructureInset()` so littoral/island land buildings move inward from the local coast vector.
- Added a North Sea coast direction for Benelux-like littoral regions, so offshore assets place toward water and land structures place away from it.
- Kept the strategic visible-structure cap and built-state rendering rules intact.

What should be tried next:
- If central-map fidelity stays highest priority, create a map-specific painted module cluster set rather than deriving from the UI atlas.
- Continue component-level convergence on AGI ring micro-detailing, top-bar hardware and alert/right-panel glyph exactness after map assets.

Regressions introduced:
- None observed. `iteration-32-map-atlas-metrics.json` reports start `0/0`, construction `0/0`, built `2/0`, and concept `30/0` for map/icon atlas sprites.

## Iteration 33 - Alert dock text occupancy and panel wheel routing

Screenshots and metrics:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-33-real-alert-dock-text-layout.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-33-concept-alert-dock-text-layout.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-33-alert-dock-metrics.json`

What is closer to the concept art and the playable game:
- Alert card text now occupies the card more naturally instead of being squeezed into a narrow center strip.
- The dismiss control is absolutely positioned, so it no longer steals a full grid column from the title/body copy.
- Icon and action columns are slightly narrower, giving the main text about 59% of each alert card width in both real alert and concept-state captures.
- The bottom dock still keeps five alerts plus the collapse control without overflow.

What still differs visibly:
- Alert glyphs are still CSS symbols rather than exact painted assets.
- Long live alert titles still ellipsize, while the concept uses shorter hand-authored copy.

What was changed:
- Reworked desktop `.alert-item` columns from icon/text/action/dismiss to icon/text/action, with dismiss positioned in the corner.
- Aligned alert text vertically inside the card and shrank icon/action controls slightly.
- Made HUD panels receive pointer events directly and added `GameHud.handleWheel()` to forward wheel input from non-scrollable child areas to the active panel scroller.
- Restored desktop right-panel vertical scrolling and added a Playwright regression check for scrolling the construction dock while hovering a build card.

What should be tried next:
- If the dock remains visually underfilled, tune live alert copy length and consider a denser icon atlas.
- Expand wheel-position regression tests to the region panel and research tab if manual testing finds another cursor dead zone.

Regressions introduced:
- None observed. `pnpm lint` and the targeted construction-scroll Playwright test passed after the wheel handler and CSS changes.

## Cross-component note - Panel textures and borders

User feedback:
- All panels still do not have background textures and border treatments close enough to the concept art.
- The current panel styling is mostly CSS-generated; it lacks the painted dark glass texture, beveled metal edges, mechanical corner cuts and subtle worn/noise details visible in the reference.

Future action:
- Generate a reusable ImageGen asset set for panel backgrounds, borders and corners, then apply it consistently to the top bar, left build rail, right region panel, bottom alert dock, mini GRID OVERVIEW and modal/card surfaces where appropriate.

## Iteration 34 - Shared ImageGen panel chrome texture

Screenshots and assets:
- Generated source: `C:\Users\cleme\.codex\generated_images\019ee6ab-f27a-78b2-904c-b7a46fb678d8\ig_07ae84ef8f8336f6016a3751a608ac8191a6837a916cd69d81.png`
- Project asset: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\public\assets\generated\panel-chrome-texture-v1.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-34-concept-panel-texture.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-34-real-alert-panel-texture.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-34b-concept-panel-texture-topbar.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-34b-panel-texture-metrics.json`

What is closer to the concept art and the playable game:
- Major HUD panels now have a shared raster material layer: dark glass, graphite metal, subtle scan/noise, cyan edge accents and mechanical corner detail.
- The texture is active in the real game and concept-state views on the top bar, left rail, right panel, bottom alert dock and mini GRID OVERVIEW.
- The second pass also applies it to top-bar submodules: brand, AGI duel, KPI chips, speed controls and hamburger command.
- Text remains readable because the texture is kept under a dark overlay and blended softly rather than replacing the existing panel backgrounds.

What still differs visibly:
- The concept uses bespoke panel hardware per component; the current implementation stretches one reusable texture across differently shaped panels.
- Bolts, deep cut lines and heavy corner brackets are still less pronounced than the reference.
- The texture pass does not address central-map module art or exact route topology.

What was changed:
- Generated `panel-chrome-texture-v1.png` with the built-in ImageGen workflow.
- Exposed the project asset as `--panel-chrome-texture` in `main.ts`.
- Added the texture as a blended CSS background layer on main HUD panels and top-bar submodules.
- Added a Playwright assertion that `.top-kpi` includes `panel-chrome-texture-v1` in its computed background.

What should be tried next:
- If panel exactness remains a focus, split panel chrome into separate corner/border assets so the mechanical cuts align to each panel instead of stretching one texture.
- Continue high-priority central-map work with map-painted building clusters.

Regressions introduced:
- None observed in screenshots. `iteration-34b-panel-texture-metrics.json` verifies the texture is loaded on all major desktop panels and top-bar submodules.

## Iteration 41 - Targeted component audit, BUILD rail fit and Recherche tab

Screenshots and metrics:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-component-contact-sheet.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-concept-global-component-audit.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-concept-left-rail.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-concept-mini-grid-overview.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-real-research-tab-left-rail.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-real-research-tooltip.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-concept-component-metrics.json`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-real-research-metrics.json`

What is closer to the concept art and the playable game:
- The left rail now shows the five BUILD families before GRID OVERVIEW. The mini overview no longer covers the lower category stack.
- `GRID & NETWORK` remains visible even at game start, but only as a locked preview cell. The actual locked building button is still absent until unlock, preserving gameplay state.
- The mini GRID OVERVIEW is visible in the real game and in the concept-state capture after the rail layout changes.
- Recherche now has a compact rail treatment matching BUILD's material language: status card, queue card, branch-glyph preview cards, and rich hover tooltips.
- Recherche preview cards are not real research actions before prerequisites are met; the initial real-game metric reports `trueResearchActions: 0`.
- Long Recherche titles are clipped inside their cards rather than overlapping adjacent cards, with the full detail available in tooltip.

What still differs visibly:
- The BUILD rail remains denser than the static concept because it keeps Construction/Recherche and filter controls.
- The mini GRID OVERVIEW still uses a generated terrain-like raster rather than the reference's exact painted cyan topology.
- Recherche has no direct concept reference, so it is intentionally adapted rather than copied.
- Alert titles can still ellipsize because live alert copy is longer than the concept's short hand-authored labels.
- Central-map assets and routes remain the largest art-source gap versus the painted concept.

What was changed:
- Fixed desktop rail layout so the BUILD body and mini GRID OVERVIEW occupy separate rows.
- Hid the horizontal category tab strip in desktop `All` view and made category titles clickable with rich tooltips, recovering vertical space without removing category navigation.
- Added non-actionable locked preview cells for categories with no currently visible build options.
- Added Recherche preview cards, branch glyph mapping, and rich tooltips for Recherche cards.
- Updated Playwright tests to use visible category-title interactions and preserve locked-state expectations.
- Updated `component-diagnostics.md` with the current targeted audit.

What should be tried next:
- Generate a tighter mini GRID OVERVIEW raster variant if this component remains the priority.
- Consider a compact monochrome slot/glyph atlas for BUILD cards if the card thumbnails still feel too literal.
- Add a Recherche wheel-position regression test if manual testing finds scroll dead zones in that tab.

Regressions introduced:
- Initial test runs caught hidden-category-tab selectors and a real locked building button appearing too early; both were fixed.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for BUILD/Recherche/dock interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 43 - Opaque panel texture with scaled 9-patch treatment

Screenshots and metrics:
- Source texture: `C:\Users\cleme\.codex\generated_images\019ee6ab-f27a-78b2-904c-b7a46fb678d8\ig_07ae84ef8f8336f6016a3751a608ac8191a6837a916cd69d81.png`
- Project asset: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\public\assets\generated\panel-chrome-texture-v1.png`
- Contact sheet: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-contact-sheet.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-topbar.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-left-rail.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-right-panel.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-alert-dock.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-research-left-rail.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-metrics.json`

What is closer to the concept art and the playable game:
- The generated panel texture is now visibly used as an opaque bitmap on the major panels and top-bar modules.
- It is no longer blended as `soft-light`, so the material, scan grain and edge hardware are perceptible.
- The too-large painted borders from the first opaque pass were corrected with overscan plus `border-image-slice: 92 fill`; the border now renders at 7-10px instead of sitting under content.
- Text readability is restored on the top bar, BUILD rail, right panel, alert dock, mini GRID OVERVIEW and Recherche tab.

What still differs visibly:
- This remains a shared square texture adapted to multiple rectangular panels, not a bespoke per-panel chrome asset.
- Some corners are less exact than the concept because the same source frame is being sliced and scaled everywhere.

What was changed:
- Replaced panel texture `soft-light` usage with normal opaque bitmap rendering.
- Added shared overscan variables and CSS `border-image` slicing for the panel texture.
- Tuned smaller overscan/border widths for top-bar modules and mini GRID OVERVIEW.
- Captured component-specific texture metrics showing `backgroundBlendMode: normal`, `backgroundSize: calc(...)`, and `borderImageWidth` values.

What should be tried next:
- If this still feels too generic, generate a real 9-patch asset set: corners, horizontal rails, vertical rails and center fill as separate images.
- Keep future panel changes checked with targeted crops before comparing the full screen.

Regressions introduced:
- The first opaque texture attempt made borders too large and hurt readability; iteration 43 fixed that by scaling/slicing the texture.
- Final validation passed `pnpm lint`, targeted Playwright visual tests for desktop/BUILD/Recherche/dock interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.
