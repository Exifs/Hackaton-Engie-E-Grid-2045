# Visual feedback - continued v2.0 pass

Reference: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\reference-v2-0.png`

Current audit after iteration 79:
- A bottom alert-dock polish pass was captured as `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-79-alert-dock-polish-*`.
- Capture workflow is now documented in `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\visual-capture-workflow.md` for future iterations.
- The selected-region map composition remains stable: concept-state `buildingTextureCount` is 36, approximately 9 visible structures.
- Central-map lighting and route density improved: concept-state strategic routes increased from 10 to 12, with 1 controlled congested route; central-map crop luma moved from 42.24 to 44.00, cyan pixels from 19315 to 22229 and bright pixels from 58443 to 70350.
- Right-panel building slots are more legible and closer to the concept's technical tile language: larger/brighter slot art, stronger inner frames, clearer bottom status ticks and more subdued lock tiles.
- BUILD rail construction cards now have brighter pictogram overlays and clearer technical frames. Left-rail crop metrics moved from luma 32.18 / bright pixels 11240 / cyan pixels 6686 in iteration 76 to luma 35.76 / bright pixels 16487 / cyan pixels 11034 in iteration 77.
- Bottom alerts now have clearer type-specific card accents, larger technical glyphs, and better text/body rhythm while preserving the previous no-overflow behavior.
- Gameplay state invariants still hold: real-start `buildingTextureCount: 0`; construction has one queued item, zero built items and `buildingTextureCount: 0`.
- Panels still report zero measured overflow in concept-state and real-start captures.
- The accepted mini GRID OVERVIEW background remains `grid-overview-europe-map-only-v1.png`; it has `staticThreadCount: 0`, 10 dynamic hub lines and 20 dynamic nodes. Do not iterate on this asset unless it regresses.
- Recherche remains stable: no body/card/title overflow, 4 readable cards in the default real-start view, and the mini GRID OVERVIEW remains visible in the rail.
- Calibration against the reference shows the largest remaining map gap is still brightness/detail: reference central luma is about 63.97 versus render 44.00, and reference Benelux cyan/detail density remains higher than the render.

Current priority order:
1. Human review gate - High. Stop autonomous iteration after iteration 79 and wait for user feedback on the latest capture set.
2. Central map module and terrain fidelity - High after review. Iteration 78 improves lighting and route density, but the map remains the largest concept gap: generated isometric props, darker/grittier terrain than reference, and state-derived route composition. The next useful map pass should be a true tiny painted map-marker atlas or a more deliberate terrain grade; avoid more small alpha-only tweaks unless a screenshot shows regression.
3. Bottom alerts polish - Medium/guard. Iteration 79 improves type-specific accents, icon scale and text rhythm; keep as guard unless human feedback flags the strip.
4. Right region panel polish - Medium/guard. Iteration 76 improves slot readability and tile framing, but the art still comes from the shared card atlas rather than bespoke painted concept tiles.
5. BUILD rail icon/card fidelity - Medium/guard. Iteration 77 improves glyph brightness/readability while preserving layout and mini overview visibility. Further work should be a true generated glyph atlas, not more CSS brightness tuning.
6. Scroll hotspot regression coverage - Medium/guard. Existing focused tests pass for construction and recherche card surfaces; add right-panel/alert-dock hotspot tests only when those panels contain scrollable overflow again or before major layout changes.
7. Top bar and mini GRID OVERVIEW - Regression guard only. AGI rings must remain ticks-only, and the accepted mini overview background must stay map-only with dynamic topology layered separately.

Standing constraints superseding older notes:
- The mini GRID OVERVIEW is now a real, visible component in the playable game and in `scenario=concept`.
- Its bitmap background is `grid-overview-europe-map-only-v1.png` and must remain map-only. Do not bake static hubs, routes, links or network nodes into future overview rasters.
- User review after iteration 71 accepts the current mini GRID OVERVIEW background asset. Do not spend further iteration time on this asset unless a regression appears; move attention to other components.
- Mini overview topology must remain dynamic SVG flows and DOM nodes only if it is touched for gameplay/readability reasons.
- Earlier notes about raster topology or static route/orbit threads are historical and superseded by iterations 44-46.
- The bottom alert strip now gives more width to alert copy, allows controlled two-line titles, and uses CSS-drawn pictograms instead of punctuation marks; earlier notes about early one-line title ellipsis or `!/*/#` icons are superseded by iterations 47-48.
- Compact desktop BUILD cards are now centered module slots with toned bitmap art and CSS schematic overlays; earlier notes about off-center cards are superseded by iteration 49, but a true generated glyph atlas is still a future fidelity option.
- On the central map, selected-region slot markers are now much dimmer/smaller when buildings or construction already exist; empty selected regions keep the full planning grid. Earlier notes about built-region slot grids dominating modules are superseded by iteration 50.
- On the central map, built modules now have stronger contact shadows, accent pads, connector struts and anchor dots. This improves grounding but does not replace the need for a true painted map-module atlas if asset exactness remains the priority.
- The central map now uses `building-map-atlas-v4.png`, generated with ImageGen and chroma-key-cleaned to RGBA. It preserves the 4x4 atlas format, maps cells 0-11 to actual buildings, and keeps cells 12-15 as neutral spare pads with no warning/CO2/lock symbols.
- AGI progress rings are ticks-only. `.agi-ring` must not regain a continuous circular progress track, radial ring background or conic progress layer.
- The mini GRID OVERVIEW now has a denser dynamic topology layer: selected-region hub paths and ranked graph nodes are generated as SVG/DOM per game state. The raster background remains map-only with no baked routes.
- Compact BUILD cards now have CSS line-art glyph overlays per building type. The thumbnail atlas remains as a subdued backing layer; future rail work should refine glyphs, not return to raw thumbnails.

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

## Iteration 44 - Mini GRID OVERVIEW map-only raster and dynamic links

Screenshots and metrics:
- Source ImageGen asset: `C:\Users\cleme\.codex\generated_images\019ee6ab-f27a-78b2-904c-b7a46fb678d8\ig_097243fff3a88f3f016a376415b5848191a75da5950798c453.png`
- Project asset: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\public\assets\generated\grid-overview-europe-map-only-v1.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-44-real-start-mini-overview-global.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-44-real-start-mini-overview-card.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-44-real-start-mini-overview-map.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-44-concept-state-mini-overview-global.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-44-concept-state-mini-overview-card.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-44-concept-state-mini-overview-map.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-44-mini-overview-map-only-metrics.json`

What is closer to the concept art and the playable game:
- The mini GRID OVERVIEW now uses a cleaner ghostly Europe raster that matches the main map's cold tactical material without baking in routes, hubs or network links.
- The real game consumes this asset through `--grid-overview-map`; this is not limited to a test-only view.
- Static route/orbit overlays were removed from `GameHud.gridOverviewEuropePaths()`. Iteration 44 metrics report `staticThreadCount: 0` and `staticOrbitCount: 0` in both real start and concept-state captures.
- The visible mini-map links and nodes now come from `getNetworkGraph()` and `network_flows`, so the component reflects gameplay state.
- The card remains visible and bounded in both empty real start and concept-state captures, with `cardOverflowY: 0` and `mapOverflowY: 0`.

What still differs visibly:
- The reference crop has a more painterly, denser cyan hub cluster and stronger central glow.
- The current dynamic topology is readable but still more UI-like and less painted than the concept's miniature network.
- The expand glyph remains a simple bracket mark rather than the exact four-corner icon.

What was changed:
- Generated a new no-connections ImageGen raster and saved it as `grid-overview-europe-map-only-v1.png`.
- Updated `main.ts` to reference the new project asset.
- Removed the unused project draft `grid-overview-europe-neon-v2.png` because it contained static network lines and would be misleading for this dynamic component.
- Disabled static SVG thread/orbit paths in `GameHud.gridOverviewEuropePaths()`.
- Updated the visual regression expectation from `grid-overview-europe-neon-v1` to `grid-overview-europe-map-only-v1`.
- Updated `component-diagnostics.md` so future work does not reintroduce baked network links into the background asset.

What should be tried next:
- Tune dynamic mini-node and mini-flow styling for denser cyan clusters and a stronger selected-region glow while keeping all topology data-driven.
- Keep validating empty start and concept-state captures whenever map overview assets or flow overlays change.

Regressions introduced:
- None observed in the iteration 44 crops or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/BUILD/Recherche/dock interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 45 - Dynamic mini GRID OVERVIEW density pass

Screenshots and metrics:
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-45-real-start-dynamic-mini-overview-global.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-45-real-start-dynamic-mini-overview-card.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-45-real-start-dynamic-mini-overview-map.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-45-concept-state-dynamic-mini-overview-global.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-45-concept-state-dynamic-mini-overview-card.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-45-concept-state-dynamic-mini-overview-map.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-45-dynamic-mini-overview-metrics.json`

What is closer to the concept art and the playable game:
- The mini-map now reads closer to the concept crop's dense cyan tactical network without baking that network into the raster.
- Data graph lines are more visible and slightly tighter, improving the perceived topology in both empty real start and concept-state captures.
- The selected node is less like a solid UI dot and more like a luminous hub, with a smaller core and broader soft halo.
- Metrics still report `staticThreadCount: 0`, `staticOrbitCount: 0`, `cardOverflowY: 0`, and `mapOverflowY: 0`.

What still differs visibly:
- The concept has a more hand-painted electric starburst at the central hub.
- The dynamic line placement is still governed by the simulation graph rather than a concept-composed topology, so exact line rhythm differs.
- The expand glyph remains simplified.

What was changed:
- Tuned `.mini-flow-data` opacity, dash rhythm, stroke width and glow.
- Tuned `.grid-overview-node` and `.grid-overview-node.is-selected` gradients, border, halo and selected core size.
- Added a selected-node pseudo halo without adding static topology.

What should be tried next:
- If the mini overview remains the priority, tune the expand glyph and add a subtle dynamic pulse to the selected node in non-test mode.
- Keep any further network-density work attached to dynamic graph/flow data only.

Regressions introduced:
- None observed in the iteration 45 crops or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/BUILD/Recherche/dock interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 46 - Mini GRID OVERVIEW expand glyph

Screenshots and metrics:
- Before crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-before-miniOverview.png`
- Before glyph crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-before-miniExpand.png`
- After global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-expand-glyph-global.png`
- After crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-expand-glyph-mini-overview-card.png`
- After glyph crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-expand-glyph-crop.png`
- `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-expand-glyph-metrics.json`

What is closer to the concept art and the playable game:
- The mini overview expand control no longer displays literal `[]` text.
- The replacement is a compact four-corner glyph, matching the concept crop's visual language more closely while keeping the same 24x20 control bounds.
- Metrics report `expandText: ""`, unchanged bounds and `cardOverflowY: 0`.

What still differs visibly:
- The glyph is CSS-drawn and cleaner than the concept's painted four-corner mark.
- The broader mini overview still differs in exact hand-painted hub/starburst rhythm, but topology remains correctly dynamic.

What was changed:
- Removed `[]` from the `grid-overview-expand` markup.
- Drew the four-corner icon with CSS layered gradients inside the existing button frame.
- Added a desktop visual regression assertion that the expand glyph text remains empty and its icon background is present.
- Updated `component-diagnostics.md` with iteration 46 evidence and next actions.

What should be tried next:
- Move to a higher-impact component: central map module art, BUILD-card glyph assets or alert icon assets.
- Keep the mini overview background map-only and data-driven.

Regressions introduced:
- None observed in the iteration 46 crop or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/BUILD/Recherche/dock interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 47 - Bottom alert text fit

Screenshots and metrics:
- Before crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-before-alerts.png`
- First after crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-47-alert-text-fit-dock.png`
- First after metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-47-alert-text-fit-metrics.json`
- Second after crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-47b-alert-text-fit-dock.png`
- Second after metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-47b-alert-text-fit-metrics.json`
- Final after global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-47c-alert-text-fit-global.png`
- Final after crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-47c-alert-text-fit-dock.png`
- Final after metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-47c-alert-text-fit-metrics.json`

What is closer to the concept art and the playable game:
- The bottom alert strip still fits five cards plus the collapse control, but the main text column now gets about 71% of each alert card at the concept viewport and about 67.2% at the 1600px Playwright viewport.
- Long titles such as `Energy deficit - Mediterranee insulaire` and `Researchers insufficient - Europe` now use controlled two-line wrapping instead of being cut off early.
- Icon and action columns are more compact, closer to the concept's dense operational alert cards, while `VIEW` and `CLAIM` remain readable.
- Final metrics show `panelOverflowY: 0`, `cardOverflowY: 0`, and `titleOverflowX: 0` for every alert card.

What still differs visibly:
- Live alert copy remains longer than the hand-authored concept labels, so some cards are text-denser than the reference.
- Alert icons are still CSS punctuation-like symbols, not dedicated concept glyphs.

What was changed:
- Reduced desktop alert icon/action column widths and icon size across two adjustment passes.
- Allowed alert titles to clamp to two lines and reduced title/body font metrics to fit the fixed 66px card height.
- Added a Playwright assertion in the stressed alert scenario for main text width, title horizontal overflow and card vertical overflow.
- Updated `component-diagnostics.md` with iteration 47 evidence and next actions.

What should be tried next:
- Replace alert icons with a tiny glyph asset set if the alert strip remains a priority.
- Otherwise return to higher-impact work: central map module art or BUILD-card glyph assets.

Regressions introduced:
- The first alert fit attempt introduced a 1px vertical card overflow on one long-title card. The `47b` adjustment fixed this; `47c` then compacted icon/action columns further so the 1600px alert test also keeps the text column above the regression threshold.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/BUILD/Recherche/dock/alert interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 48 - Bottom alert glyph replacement

Screenshots and metrics:
- Before crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-48-before-alert-glyphs-dock.png`
- Before metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-48-before-alert-glyphs-metrics.json`
- After global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-48-alert-glyphs-global.png`
- After crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-48-alert-glyphs-dock.png`
- After metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-48-alert-glyphs-metrics.json`

What is closer to the concept art and the playable game:
- Alert icons no longer read as raw punctuation (`!`, `*`, `#`).
- Warning alerts now use a compact triangular glyph inside the existing ring; research uses a nucleus/crosshair mark; network uses a tiny node-grid mark.
- Cooling and market alert kinds also have dedicated CSS glyphs for consistency even when not present in the current concept-state crop.
- The alert text improvements from iteration 47 hold: metrics still show `panelOverflowY: 0`, `cardOverflowY: 0`, `titleOverflowX: 0`, and `mainWidthRatio: 0.71` at the concept viewport.

What still differs visibly:
- These are procedural CSS glyphs, not bespoke painted bitmap icons.
- The concept's alert symbols have more handcrafted wear and slightly richer line weight variation.

What was changed:
- Replaced punctuation `content` values in `.alert-icon::before` with CSS-drawn shape layers.
- Added `::after` detail layers for warning, research, network, cooling and market alert kinds.
- Extended the stressed-alert Playwright check so alert pseudo-glyphs cannot regress to `!`, `*` or `#`, and so glyph pseudo boxes must exist.
- Updated `component-diagnostics.md` with iteration 48 evidence and future actions.

What should be tried next:
- Move to a higher-impact component: central map module art or BUILD-card glyph/card composition.
- If alert icons come back as a priority, use a small generated or hand-authored glyph atlas instead of further CSS complexity.

Regressions introduced:
- None observed in the iteration 48 crop or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/BUILD/Recherche/dock/alert interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 49 - BUILD card composition pass

Screenshots and metrics:
- Before construction crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49-before-build-construction-left-rail.png`
- Before research crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49-before-build-research-left-rail.png`
- Before metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49-before-build-rail-metrics.json`
- First after crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49-build-card-composition-left-rail.png`
- First after metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49-build-card-composition-metrics.json`
- Final after global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49b-build-card-composition-global.png`
- Final after crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49b-build-card-composition-left-rail.png`
- Final after metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49b-build-card-composition-metrics.json`

What is closer to the concept art and the playable game:
- Desktop construction cards are more centered and read more like compact technical module slots than raw image thumbnails.
- Existing bitmap art is scaled down, desaturated and placed under a subtle internal pad/crosshair overlay, closer to the concept's abstract build-slot treatment.
- The left rail remains compact: the five BUILD groups and mini GRID OVERVIEW still fit without vertical clipping.
- Final metrics report `railOverflowY: 0`, `overflowY: 0`, and exact centered art (`centerDeltaX: 0`, `centerDeltaY: 0`) for the sampled compact cards.

What still differs visibly:
- The underlying art remains the existing atlas, so it is not as clean or deliberately painted as the concept's small monochrome build symbols.
- Locked/unavailable cards still dim according to real gameplay state, which differs from the static concept's chosen active state.

What was changed:
- Added desktop compact-card overlays with pseudo-element pad lines and a small schematic highlight.
- Reduced compact-card art scale and tuned image filter/opacity.
- Adjusted compact-card visual height to avoid internal 2px overflow found in the first pass.
- Updated the construction-card responsive test to check desktop compact card dimensions, zero overflow, centered smaller art and pseudo-overlay presence while preserving tablet/mobile card expectations.
- Updated `component-diagnostics.md` with iteration 49 evidence and future actions.

What should be tried next:
- Generate a dedicated abstract BUILD-card glyph atlas if the rail remains a visual priority.
- Otherwise move back to higher-impact central map module art.

Regressions introduced:
- The first 49 pass had 2px internal card overflow; the `49b` adjustment fixed it.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/BUILD/Recherche/dock/alert interactions including the responsive construction-card test, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 50 - Central map selected-slot dimming

Screenshots and metrics:
- Built concept-state global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-50-concept-built-slot-dim-global.png`
- Built concept-state map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-50-concept-built-slot-dim-map.png`
- Empty real-game global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-50-real-empty-slot-dim-global.png`
- Empty real-game map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-50-real-empty-slot-dim-map.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-50-slot-dim-metrics.json`

What is closer to the concept art and the playable game:
- The selected-region slot grid no longer reads as a bright green square cluster over built Benelux modules.
- Built/queued regions now use smaller, lower-alpha slot markers, so modules, terrain and flow lines carry the visual hierarchy.
- Empty selected regions still retain the stronger planning grid needed at game start.
- Metrics show the built-region slot size reduced from `8.7` to `4.53`, occupied alpha reduced to `0.16`, and empty-start slot size/alpha preserved at `8.7` / `0.42`.

What still differs visibly:
- The concept crop has no gameplay slot grid at all.
- The map modules still rely on the current generated atlas and remain less painted than the reference.

What was changed:
- Tuned `EGridMapScene.drawSelectedSlots()` so selected regions with buildings/construction use smaller slots, tighter gaps and lower fill/stroke alpha.
- Preserved the empty-region planning grid parameters.
- Updated `component-diagnostics.md` with iteration 50 evidence and future actions.

What should be tried next:
- If the remaining selected-slot affordance still feels too game-like, gate built-region slot visibility to explicit construction/placement interaction.
- Otherwise prioritize a more painted map module atlas.

Regressions introduced:
- None observed in the iteration 50 captures or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for map state/BUILD/alert interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 51 - Central map module grounding

Screenshots and metrics:
- Built concept-state global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-51-map-module-grounding-built-global.png`
- Built concept-state map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-51-map-module-grounding-built-map.png`
- Empty real-game global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-51-map-module-grounding-empty-global.png`
- Construction real-game map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-51-map-module-grounding-construction-map.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-51-map-module-grounding-metrics.json`

What is closer to the concept art and the playable game:
- Built map modules now sit on a darker contact shadow and subtle accent pad instead of reading as raw icons floating over the terrain.
- Enhanced map sprites get a low-alpha dark sprite shadow behind the luminous sprite pass.
- Small connector struts and anchor dots make modules feel more physically attached to the selected region cluster.
- Gameplay-state rules remain intact: empty real start and construction real state both report `buildingTextureCount: 0`; the final sprite appears only in the built state.

What still differs visibly:
- This remains a code/rendering integration pass on the current generated atlas, not a new hand-painted module asset set.
- The concept modules still have better painterly integration, bespoke silhouettes and less UI-icon flavor.

What was changed:
- Tuned `EGridMapScene.drawModuleGroundIntegration()` with stronger contact shadows, inset shadow, pad glow, struts and anchor dots.
- Added a subtle dark sprite shadow in `drawModuleSprite()` for enhanced map sprites.
- Updated `component-diagnostics.md` with iteration 51 evidence and state-invariant notes.

What should be tried next:
- If the central map remains the priority, generate a dedicated painted in-map module atlas rather than continuing to push the current atlas.
- Keep verifying empty start, grey construction cube and built-only final icon after every map-module change.

Regressions introduced:
- None observed in the iteration 51 captures or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map/BUILD/alert interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 52 - AGI ticks-only correction

Screenshots and metrics:
- Global capture: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-52-agi-ticks-global.png`
- Top bar crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-52-agi-ticks-topbar.png`
- AGI duel crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-52-agi-ticks-duel.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-52-agi-ticks-metrics.json`

What is closer to the concept art and the playable game:
- AGI progress now reads as segmented ticks only. The `.agi-ring` container reports `background-image: none` and `box-shadow: none`.
- The concept-state EU ring has 48 ticks with 32 active ticks at 67%.
- The rich tooltip now describes the marks as ticks, avoiding the misleading "ring" wording.
- The initial desktop Playwright visual test now prevents a continuous AGI ring background from coming back.

What still differs visibly:
- Tick geometry is still CSS-rendered and cleaner than the concept's painted micro-detail.
- The exact progress values and top-bar state follow the playable scenario rather than copying the static reference image.

What was changed:
- Removed the remaining radial background/box-shadow from `.agi-ring`.
- Kept a small dark readability backing directly behind the percent text, without a continuous progress track.
- Updated `GameHud.agiDuel()` tooltip text.
- Added a visual regression assertion for AGI ring background.
- Updated `component-diagnostics.md` with iteration 52 evidence and future constraints.

What should be tried next:
- Do not add conic/radial progress circles back to AGI.
- Continue with higher-impact remaining gaps: true painted map-module atlas, mini overview dynamic topology density, or BUILD-card glyph atlas.

Regressions introduced:
- None observed in the iteration 52 crop or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map/BUILD/alert interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 53 - Painted map-module atlas v3

Screenshots and metrics:
- ImageGen source: `C:\Users\cleme\.codex\generated_images\019ee6ab-f27a-78b2-904c-b7a46fb678d8\ig_096e597f0995260f016a377752165c81919ef67819926f7b7b.png`
- Project atlas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\public\assets\generated\building-map-atlas-v3.png`
- Built concept-state global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-53c-map-atlas-v3-built-global.png`
- Built concept-state map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-53c-map-atlas-v3-built-map.png`
- Empty real-game global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-53c-map-atlas-v3-empty-global.png`
- Construction real-game map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-53c-map-atlas-v3-construction-map.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-53c-map-atlas-v3-metrics.json`

What is closer to the concept art and the playable game:
- The main map no longer uses the brighter cyan-outlined v2 atlas for built modules.
- The v3 atlas is darker, more terrain-footed and less like a standalone UI sticker, while keeping the same 1254x1254 RGBA / 4x4 cell format.
- Chroma-key cleanup produced transparent corners and preserved cell compatibility.
- The real gameplay state rule remains intact: empty start and construction state both report `buildingTextureCount: 0`; final sprite textures appear only after buildings are built.

What still differs visibly:
- V3 is still generated art, not an exact painted extraction from the concept map.
- The source sheet contains decorative warning/CO2/locked cells with symbols; current map building mapping uses only cells 0-11, so those text/symbol cells should stay unmapped.
- The darker palette blends better into terrain but may need a small brightness pass if future full-map screenshots show poor readability.

What was changed:
- Generated a second, more map-oriented 4x4 atlas with ImageGen on magenta chroma-key.
- Removed the chroma-key locally with the imagegen helper and saved `building-map-atlas-v3.png` in project assets.
- Updated `EGridMapScene.preload()` to load `building-map-atlas-v3.png`.
- Added a Playwright asset-request assertion for `building-map-atlas-v3.png`.
- Updated `component-diagnostics.md` with iteration 53 evidence and future constraints.

What should be tried next:
- If map-module fidelity remains a priority, generate a focused 12-cell atlas for mapped building categories only, with no symbolic/text cells.
- If readability drops on smaller screens, tune sprite brightness/scale in Phaser rather than returning to the cyan sticker outline.

Regressions introduced:
- None observed in the iteration 53c captures or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map/BUILD/alert interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 54 - Mini GRID OVERVIEW dynamic density

Screenshots and metrics:
- Reference crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\reference-v2-0-grid-overview-crop.png`
- Before real start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-54-before-mini-overview-real-card.png`
- Before concept-state crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-54-before-mini-overview-concept-card.png`
- Before metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-54-before-mini-overview-metrics.json`
- Final real start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-54b-mini-overview-density-tuned-real-card.png`
- Final concept-state crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-54b-mini-overview-density-tuned-concept-card.png`
- Final global capture: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-54b-mini-overview-density-tuned-global.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-54b-mini-overview-density-tuned-metrics.json`

What is closer to the concept art and the playable game:
- The mini overview now has a brighter central topology cluster without baking any network into the raster.
- The selected region emits 10 dynamic hub paths toward top ranked graph/flow regions; the first 4 are stronger to create a concept-like core.
- Region dots now include graph-derived satellites, so the real start state no longer looks sparse just because few flows are active.
- The tuned pass keeps 20 compact nodes instead of the first 24-node attempt, reducing the “large glowing bead” effect.
- Metrics report `staticThreadCount: 0`, `cardOverflowY: 0`, `mapOverflowY: 0`, 10 hub lines, 4 strong hub lines and 20 nodes in both real start and concept-state captures.

What still differs visibly:
- The reference crop is still more hand-composed and painterly in its exact cyan starburst rhythm.
- The current hub topology follows live graph/flow ranking, so exact node positions vary with gameplay state.
- The expand glyph and legend remain CSS/DOM approximations rather than painted assets.

What was changed:
- Added `gridOverviewHubLines()` to generate selected-region SVG hub paths from current graph/flow state.
- Changed mini overview nodes to rank both network graph regions and active flow endpoints.
- Tuned node count and node styling so satellites are smaller, with a stronger selected hub core.
- Added Playwright assertions for hub line count, node count and absence of old static thread/orbit paths.
- Updated `component-diagnostics.md` with iteration 54 evidence and future constraints.

What should be tried next:
- Leave the bitmap map-only. Any further topology density must stay in SVG/DOM.
- If this component remains a priority, tune the exact dynamic glow/line opacity; otherwise move to BUILD-card glyph assets or right-panel icon fidelity.

Regressions introduced:
- The first 54 density pass had 24 larger nodes and read slightly too bead-like. The `54b` tuning reduced nodes to 20 and softened satellite halos.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map/BUILD/alert interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 55 - BUILD compact card glyph overlays

Screenshots and metrics:
- Reference left rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-35-reference-left-rail.png`
- Before rail crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-55-before-build-glyph-rail.png`
- Before metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-55-before-build-glyph-metrics.json`
- First after rail crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-55-build-card-glyph-overlay-rail.png`
- Tooltip check: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-55-build-card-glyph-overlay-tooltip.png`
- First after metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-55-build-card-glyph-overlay-metrics.json`
- Final rail crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-55b-build-card-glyph-overlay-rail.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-55b-build-card-glyph-overlay-metrics.json`

What is closer to the concept art and the playable game:
- Compact BUILD cards now read as technical glyph tiles rather than raw miniature art thumbnails.
- Each mapped building type has a CSS line-art overlay: gas stacks, nuclear tower, wind rotor, solar grid, datacenter rack, cooling fan, research/campus mark, battery/supergrid variants.
- The bitmap card atlas remains behind the glyph as a subdued material layer, preserving visual richness without making the thumbnail the main signal.
- Locked `Grid & Network` preview no longer displays the small `Rech.` text in compact desktop mode; it stays icon-led like the concept.
- Rich tooltips still work on build cards after the overlay pass.
- Metrics report `railOverflowY: 0`, 11 compact cards, 10 glyph-backed real building cards and hidden locked preview label.

What still differs visibly:
- Glyphs are CSS-built approximations, not a bespoke painted monochrome icon atlas.
- Category rail glyphs still use the current project utility icons rather than exact concept symbols.
- The rail still keeps gameplay controls absent from the static concept: Construction/Recherche tabs, locked filter and active category affordances.

What was changed:
- Added compact desktop `.building-art::before/::after` line-art overlays scoped to `.palette-body-construction`.
- Added per-building CSS custom glyph definitions for energy, datacenter, cooling, research, storage and grid structures.
- Hid the locked preview micro-label in compact desktop cards.
- Extended the construction-card responsive Playwright test to assert glyph pseudo-elements exist on desktop cards.
- Updated `component-diagnostics.md` with iteration 55 evidence and future constraints.

What should be tried next:
- If BUILD rail fidelity remains a priority, replace CSS glyphs with a small generated/painted glyph atlas or tune the category utility icons.
- Otherwise move to right-panel icon/tab fidelity, because the BUILD rail now has a stronger concept-like card language.

Regressions introduced:
- None observed in the iteration 55 captures or metrics. The first pass left the locked preview text visible; `55b` hides it in compact desktop mode.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map/BUILD/alert interactions, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 56 - Right region panel functional tabs

Screenshots and metrics:
- Before concept-state panel: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56-before-region-tabs-concept-panel.png`
- Before real-game panel: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56-before-region-tabs-real-panel.png`
- Final Overview crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56c-region-tabs-overview-panel.png`
- Final Buildings crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56c-region-tabs-buildings-panel.png`
- Final Stats crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56c-region-tabs-stats-panel.png`
- Tooltip/global check: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56c-region-tabs-tooltip-global.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56c-region-tabs-metrics.json`

What is closer to the concept art and the playable game:
- The right panel no longer has dead tab labels. Overview/Buildings/Stats are real buttons with active state, aria state and rich tooltips.
- Overview stays the default concept-like view with slots, live Energy/Cooling/Compute status blocks and Manage Region.
- Buildings separates active slots, free/locked slots and chantier/demolition lists, which keeps gameplay details out of the default concept-like view.
- Stats adds six compact live metric tiles while preserving the right-panel chrome, spacing and status-bar rhythm.
- Metrics report `overflowY: 0` for all three tab views, one active tab per view, 6 stat tiles in Stats and no sticky tooltip after tab clicks.

What still differs visibly:
- Buildings and Stats have no direct concept reference, so they are functional extensions rather than copied static art.
- Region name, values and slot contents remain live scenario/game state, not an exact Netherlands screenshot override.
- Slot art and status pictograms are still current game/CSS assets rather than final painted glyph assets.

What was changed:
- Added `activeRegionTab` state and real tab buttons in `GameHud`.
- Split right-panel content into Overview, Buildings and Stats tab views.
- Added compact stat tiles and a reusable Manage Region button helper.
- Suppressed stale rich tooltip display immediately after tab clicks, then kept tab hover/focus tooltips active.
- Added a Playwright visual regression path for France Nord region tabs, overflow, tooltip suppression and post-click tooltip hover.
- Updated `component-diagnostics.md` with iteration 56 evidence and future constraints.

What should be tried next:
- Continue component-by-component with either right-panel slot/status glyph fidelity or another high-visibility central-map crop.
- Keep the mini GRID OVERVIEW raster map-only; any route, hub or connection density must remain dynamic SVG/DOM from game state.

Regressions introduced:
- The first tab pass left a tooltip overlay visible over the Stats view in targeted screenshots. The `56c` pass fixed this with a short click suppression window while preserving hover tooltips.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/right-panel tabs/map state/BUILD/alerts/safe-area, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 57 - Recherche compact readability

Screenshots and metrics:
- Before real-game rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57-before-real-research-rail.png`
- Before concept-state rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57-before-concept-research-rail.png`
- Before metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57-before-research-metrics.json`
- Final real-game rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57b-research-compact-real-research-rail.png`
- Final concept-state rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57b-research-compact-concept-research-rail.png`
- Final tooltip/global check: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57b-research-compact-real-research-tooltip-global.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57b-research-compact-metrics.json`

What is closer to the concept art and the playable game:
- Recherche now follows the same compact technical-card language as BUILD instead of looking like a plain secondary list.
- Research card titles wrap into two controlled uppercase lines, removing the previous horizontal title overflow on long names.
- Research branch glyphs now have visible technical pseudo-detail, with energy, grid/infrastructure, cooling and generic research variants.
- Locked/unavailable research cards are still visibly disabled but less muddy, so the real start state remains readable.
- The default real-game Recherche view keeps the mini GRID OVERVIEW visible and uncut below the research cards.
- Metrics report zero body overflow, zero card/title overflow, pseudo-glyphs on every research card, and visible GRID OVERVIEW in both real start and concept-state captures.

What still differs visibly:
- Recherche has no direct concept-art reference, so this is a style-aligned functional view rather than a copied static panel.
- Glyphs are CSS-built approximations, not a bespoke painted atlas.
- Real start shows mostly locked research because the required research buildings are absent, which is correct gameplay state.

What was changed:
- Added research-card material, scan highlight and technical glyph pseudo-elements in `game.css`.
- Changed compact desktop research titles to two-line clamped uppercase text.
- Tuned compact research card height/progress height so the mini GRID OVERVIEW remains visible.
- Lightened locked research cards enough to keep labels and glyphs legible.
- Added a Playwright regression for readable research cards and wheel scrolling from a research-card surface.
- Updated `component-diagnostics.md` with iteration 57 evidence and future constraints.

What should be tried next:
- Continue component-by-component with either right-panel status/slot glyph fidelity or another central-map crop.
- If Recherche becomes visually important again, replace the CSS branch glyphs with a small generated glyph atlas while preserving the current layout and scroll behavior.

Regressions introduced:
- The first 57 pass removed title overflow but created 9px of Recherche body overflow in the concept-state capture. The `57b` compact height adjustment restored zero overflow.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/right-panel tabs/map state/BUILD/Recherche/alerts/safe-area, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 58 - Right panel slot/status glyph polish

Screenshots and metrics:
- Before concept Overview crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-before-concept-region-panel-overview.png`
- Before concept Buildings crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-before-concept-region-panel-buildings.png`
- Before real Overview crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-before-real-region-panel-overview.png`
- Before metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-before-region-panel-metrics.json`
- Final concept Overview crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-region-panel-slot-status-concept-overview.png`
- Final concept Buildings crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-region-panel-slot-status-concept-buildings.png`
- Final real Overview crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-region-panel-slot-status-real-overview.png`
- Final tab metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58b-region-panel-slot-status-tab-metrics.json`

What is closer to the concept art and the playable game:
- Right-panel status icons now have richer technical detail instead of single-shape glyphs: energy halo/spark, cooling snowflake hub and compute chip pins.
- Built slot cards now read more like the concept's active building slots, with a darker technical frame, scan overlay, green slot pips and a small readiness badge.
- Locked slots now have an internal frame and keyhole detail, closer to the concept's deliberate locked-slot cells.
- The changes are applied in the real game and concept-state view, and they preserve the tab behavior from iteration 56.
- Final metrics report zero overflow for Overview, Buildings and Stats; six visible built slots with pips/badges; two visible locked slots with frame/keyhole detail; and no sticky tooltip.

What still differs visibly:
- Slot modules still use the generated game atlas rather than exact painted right-panel concept art.
- Slot pips are uniform, while the concept has more varied tiny indicator rhythms.
- CSS pseudo-glyphs remain cleaner and more procedural than painted glyph assets.

What was changed:
- Added richer pseudo-elements for `.region-status-icon` variants.
- Added built-slot card framing, scan overlay, green pips and mini readiness badges scoped to `.region-panel`.
- Added locked-slot internal frame and keyhole detail.
- Extended the P0 visual test to verify status icon pseudo-detail, built-slot pips/badges and locked-slot keyholes.
- Updated `component-diagnostics.md` with iteration 58 evidence and future constraints.

What should be tried next:
- Continue with central-map asset fidelity or panel chrome/corner hardware, because right-panel slot/status polish is now guarded.
- If exact right-panel art becomes a priority, replace CSS slot/status glyphs with a small generated atlas while preserving the current card structure.

Regressions introduced:
- None observed in the final iteration 58 crops or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/right-panel tabs/P0 slots/map state/BUILD/Recherche/alerts/safe-area, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 59 - Shared panel corner hardware

Screenshots and metrics:
- Before global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-before-panel-chrome-global.png`
- Before top bar crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-before-panel-chrome-topbar.png`
- Before left rail crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-before-panel-chrome-left-rail.png`
- Before right panel crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-before-panel-chrome-right-panel.png`
- Before metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-before-panel-chrome-metrics.json`
- Final global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-panel-corner-hardware-global.png`
- Final top bar crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-panel-corner-hardware-topbar.png`
- Final left rail crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-panel-corner-hardware-left-rail.png`
- Final right panel crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-panel-corner-hardware-right-panel.png`
- Final alerts crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-panel-corner-hardware-alerts.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-panel-corner-hardware-metrics.json`

What is closer to the concept art and the playable game:
- The five main HUD panels now have a shared mechanical corner layer: short luminous bracket strokes plus small bolt points.
- The pass improves the concept-like panel frame without changing panel bounds or adding DOM.
- The texture remains active underneath; this is an additional chrome layer, not a replacement for the 9-patch material.
- Metrics report zero overflow and preserved `panel-chrome-texture-v1` on top bar, BUILD rail, right panel, alert dock and mini GRID OVERVIEW.

What still differs visibly:
- The concept has heavier bespoke hardware and unique corner wear per panel.
- This pass is intentionally subtle to avoid the earlier readability issues from thick panel texture borders.
- Inner modules such as individual top-bar KPI chips still use their existing local chrome rather than a separate generated bracket set.

What was changed:
- Added a common multi-layer CSS background for `.top-kpi`, `.build-palette`, `.region-panel`, `.alerts-panel` and `.grid-overview-card` in desktop concept-grade layout.
- Kept the panel texture as the final background layer and added 8 bracket gradient layers plus 4 radial bolt layers.
- Extended the initial desktop Playwright test to verify all five main panels retain texture, corner layers and zero overflow.
- Updated `component-diagnostics.md` with iteration 59 evidence and future constraints.

What should be tried next:
- Continue with central-map asset fidelity, because global panel chrome is now improved and guarded.
- If panel exactness becomes a priority again, replace this shared procedural layer with generated per-panel corner/edge assets.

Regressions introduced:
- None observed in the iteration 59 crops or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop chrome/right-panel tabs/P0 slots/map state/BUILD/Recherche/alerts/safe-area, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 60 - Dynamic mini GRID OVERVIEW hierarchy

Screenshots and metrics:
- Before real start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-60-before-dynamic-overview-real-start-card.png`
- Before concept-state crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-60-before-dynamic-overview-concept-state-card.png`
- Final real start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-60c-dynamic-congestion-priority-real-start-card.png`
- Final concept-state crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-60c-dynamic-congestion-priority-concept-state-card.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-60c-dynamic-congestion-priority-metrics.json`

What is closer to the concept art and the playable game:
- The mini overview still uses `grid-overview-europe-map-only-v1.png` as a map-only geography raster; no routes, hubs, network nodes or connection lines were baked into the background.
- Dynamic node classes now distinguish active flow endpoints, non-active relay hubs and congested endpoints, giving the inset a clearer hub hierarchy without making the background static.
- Congested flow paths are prioritized before ordinary power paths in the compact overlay, so the orange warning state appears when simulation data contains congestion.
- Final metrics report `backgroundHasMapOnlyAsset: true`, `backgroundHasOldNetworkAsset: false`, `staticThreadCount: 0`, zero card/map overflow, 20 dynamic nodes in concept-state, and one dynamic congestion line.

What still differs visibly:
- The concept mini overview still has a more hand-painted starburst and denser tiny cyan connector rhythm.
- The real start state is intentionally less dense than the concept-state crop because it reflects the actual early game network state.
- The background geography remains a generated raster and does not exactly match the concept's painted inset.

What was changed:
- Added dynamic `is-flow`, `is-relay` and `is-congested` node classes in `GameHud.gridOverviewNodes()`.
- Added CSS halos and state-specific coloring for dynamic mini overview nodes.
- Prioritized congested `network_flows` before ordinary flows in the compact mini-map path selection.
- Extended the initial desktop Playwright test so it rejects the old network-raster asset, keeps static route/orbit paths at zero, and checks dynamic node halos.
- Updated `component-diagnostics.md` with the map-only asset constraint and iteration 60 evidence.

What should be tried next:
- Continue with central-map asset fidelity; the mini overview is now guarded against static-background regressions.
- If mini-map fidelity remains a priority, adjust dynamic path/node styling only through DOM/SVG layers, not the background raster.

Regressions introduced:
- None observed in the iteration 60 crops or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop mini-overview/alerts, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 61 - Central map declutter and module grounding

Screenshots and metrics:
- Reference central-map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\reference-v2-0-central-map-crop.png`
- Before concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-before-central-map-concept-state-crop.png`
- Before real-start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-before-central-map-real-start-crop.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-central-map-pad-tune-concept-state-crop.png`
- Final real-start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-central-map-pad-tune-real-start-crop.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-central-map-pad-tune-metrics.json`

What is closer to the concept art and the playable game:
- The central map now reads less like a live debug overlay: concept-style desktop rendering suppresses live internal problem labels and keeps geographic/country labels plus the selected region label.
- Long route clutter is reduced by sorting central-map strategic flows by congestion/intensity and drawing only the top 12 in the strategic overlay.
- Built-region slots are much smaller and lower-alpha, so they no longer compete as strongly with the selected-region module cluster.
- Map modules are slightly larger with a low-alpha additive detail lift, and their terrain pads are smaller/lighter so the building sprite reads above the base.
- Real-start capture still shows no building sprites on the map, preserving the gameplay rule that buildings appear only after construction starts/completes.

What still differs visibly:
- The concept uses hand-painted route topology; the current routes still come from the simulation graph and can create different long arcs.
- The building atlas is clearer but still not as bespoke or high-contrast as the painted concept modules.
- The heatmap switch is a real-game control over the map and remains absent from the static concept.

What was changed:
- Changed `EGridMapScene.drawFlows()` to sort/cap strategic flow rendering and avoid random warning-colored secondary edges in concept-style mode.
- Changed `EGridMapScene.drawRegions()` so geographic-label mode no longer draws every live problem region label.
- Tuned built-region slot size/alpha in `drawSelectedSlots()`.
- Tuned enhanced map sprite size/detail lift and built module pad opacity/size.
- Added a Playwright visual regression for the concept central map label/module state.
- Updated `component-diagnostics.md` with iteration 61 evidence and future constraints.

What should be tried next:
- Continue with central-map asset fidelity: either generate a tighter map module atlas for cells 0-11 or add a curated strategic route layer for the concept-state scenario.
- Keep route/slot improvements constrained by the real-game state rules: no static buildings at start, grey cube during construction, final sprite only when built.

Regressions introduced:
- None observed in the iteration 61 crops or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map-state/concept-central-map/safe-area, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 62 - Central map route balance

Screenshots and metrics:
- Before route-balance crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-central-map-pad-tune-concept-state-crop.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-62b-route-balance-concept-state-crop.png`
- Final real-start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-62b-route-balance-real-start-crop.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-62b-route-balance-metrics.json`

What is closer to the concept art and the playable game:
- The central map keeps congestion visible, but orange warning routes no longer dominate as much of the topology.
- Concept-style route rendering still uses simulation state, but now draws 12 strategic routes with a cap of 3 congested routes and 9 regular routes in the current concept-state capture.
- Warning routes are thinner and lower-alpha, closer to the concept's occasional orange accents rather than a full orange route layer.
- Empty real start still has zero map building sprites.

What still differs visibly:
- Routes are still selected from live simulation pressure, so their exact endpoints and long arcs differ from the painted concept.
- Some long warning lines remain because the scenario really has long-distance deficits/congestion.

What was changed:
- Added `EGridMapScene.strategicMapFlows()` to choose a balanced strategic route subset.
- Tuned warning-route width, alpha and pulse size in strategic rendering.
- Updated `component-diagnostics.md` with iteration 62 evidence and future constraints.

What should be tried next:
- If central map remains the priority, either curate route selection by geography/representativeness or generate a tighter building map atlas for cells 0-11.
- Keep all route state data-driven; do not paint static central-map routes into a background asset.

Regressions introduced:
- None observed in the iteration 62 crops or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map-state/concept-central-map/alerts/safe-area, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 63 - Map module atlas v4

Screenshots and metrics:
- Generated source: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-building-map-atlas-v4-source.png`
- Project atlas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\public\assets\generated\building-map-atlas-v4.png`
- Atlas dark preview: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-building-map-atlas-v4-preview.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-map-atlas-v4-concept-state-crop.png`
- Final real-start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-map-atlas-v4-real-start-crop.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-map-atlas-v4-metrics.json`

What is closer to the concept art and the playable game:
- The active map atlas now uses a new ImageGen v4 pass with thinner terrain feet, clearer silhouettes and neutral spare cells instead of text/status-symbol cells.
- Cells 0-11 remain actual building modules in the same mapping order; cells 12-15 are safe neutral pads and are not mapped to normal buildings.
- The v4 atlas keeps the same 1254x1254 RGBA / 4x4 format, so Phaser cropping and scale logic remain stable.
- Real-start capture still reports `buildingTextureCount: 0`; built concept-state capture reports module textures loaded from the map atlas.

What still differs visibly:
- The generated sprites are cleaner and safer than v3 but still read more like isometric game assets than the concept's painted map-integrated modules.
- Some modules remain taller/brighter than the reference modules once rendered on the map.

What was changed:
- Generated a second ImageGen atlas variant on a magenta chroma-key background.
- Removed chroma locally with the imagegen helper and saved `building-map-atlas-v4.png` in project assets.
- Updated `EGridMapScene.preload()` to load `building-map-atlas-v4.png`.
- Updated the initial desktop visual test to request/assert `building-map-atlas-v4.png`.

What should be tried next:
- Judge the v4 module scale against a full concept crop. If still too isometric, prefer code-side scale/alpha/grounding adjustments or a more drastic hand-painted atlas prompt with very small map markers.
- Keep the state rule unchanged: no building sprites before construction, grey cube while queued, final module sprite only after build completion.

Regressions introduced:
- None observed in the iteration 63 captures or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map-state/concept-central-map, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 64 - Map module scale and density

Screenshots and metrics:
- Before crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-map-atlas-v4-concept-state-crop.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-64-module-scale-density-concept-state-crop.png`
- Final real-start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-64-module-scale-density-real-start-crop.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-64-module-scale-density-metrics.json`

What is closer to the concept art and the playable game:
- The Benelux module cluster is less overloaded: strategic rendering now caps selected-region visible modules at 6 and other regions at 2.
- Enhanced map sprites are slightly smaller and less glow-heavy, so they sit closer to the map instead of reading as large standalone props.
- Metrics show concept-state `buildingTextureCount: 48`, inferred 12 visible structures, and real-start `buildingTextureCount: 0`.
- The concept central-map regression now guards both label cleanliness and module density.

What still differs visibly:
- The modules still use generated isometric art and are not fully hand-painted into the terrain like the concept.
- The selected region still has several modules rather than a single dominant composed Netherlands building plus smaller satellites.

What was changed:
- Added `strategicStructureCandidates()` in `EGridMapScene` to cap visible structures per region in strategic desktop rendering.
- Reduced enhanced sprite display size and lowered shadow/glow/detail lift alpha.
- Extended the concept central-map Playwright test with an estimated visible-structure density range.
- Updated `component-diagnostics.md` with iteration 64 evidence and constraints.

What should be tried next:
- Continue component-by-component with central-map route curation or selected-region module composition if map fidelity remains the priority.
- Preserve the state rules: no starting building sprites, grey construction cube while queued, final module sprite only after completion.

Regressions introduced:
- None observed in the iteration 64 captures or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map-state/concept-central-map, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 65 - Central map node and route scale

Screenshots and metrics:
- Before crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-64-module-scale-density-concept-state-crop.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-65-node-route-scale-concept-state-crop.png`
- Final real-start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-65-node-route-scale-real-start-crop.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-65-node-route-scale-metrics.json`

What is closer to the concept art and the playable game:
- Non-selected region markers now read as small tactical nodes instead of large filled circles.
- Strategic route strokes, incidental route dots and animated pulses are thinner and less visually dominant.
- Real-start capture still has zero map building textures.

What still differs visibly:
- The route topology is still generated from the simulation graph, not the hand-painted concept layout.
- The selected Benelux cluster still needed a stronger primary/satellite hierarchy after this pass.

What was changed:
- Reduced strategic route widths, dark underlay width and pulse sizes in `EGridMapScene`.
- Added a desktop/concept branch in `drawRegions()` for small non-selected node rendering.

What should be tried next:
- Improve selected-region module composition without violating the building state rules.

Regressions introduced:
- None observed in the iteration 65 captures or metrics.

## Iterations 66-68 - Selected module hierarchy and sprite grounding

Screenshots and metrics:
- Iteration 66 hierarchy crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-66-selected-module-hierarchy-concept-state-crop.png`
- Iteration 67 primary priority crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-67-primary-module-priority-concept-state-crop.png`
- Final iteration 68 concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-68-primary-sprite-grounding-concept-state-crop.png`
- Final iteration 68 real-start global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-68-primary-sprite-grounding-real-start-global.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-68-primary-sprite-grounding-metrics.json`

What is closer to the concept art and the playable game:
- The selected region now uses a primary-and-satellite composition instead of rendering too many equivalent modules.
- The visible structure estimate is reduced to 10 in concept-state, closer to the concept's lower map clutter.
- The active primary selection favors datacenter/research/major infrastructure instead of allowing flatter utility assets to become the selected-region hero.
- Atlas sprites no longer get an additional procedural iso base, so the dark pad effect is reduced.

What still differs visibly:
- The primary module is still generated isometric art, not a bespoke painted Netherlands module from the concept.
- Some satellite pads remain darker and flatter than the concept's painted structures.

What was changed:
- Reduced selected-region strategic structure cap from 6 to 4.
- Added selected primary selection and visual priority helpers in `EGridMapScene`.
- Removed the extra procedural base when `building-map-atlas` sprite rendering succeeds.
- Added a primary sprite emphasis path for scale/glow/detail lift.

What should be tried next:
- If module fidelity remains the main target, create a more map-integrated atlas or paint-over variant; generic scale tuning is nearing diminishing returns.

Regressions introduced:
- Iteration 66/67 briefly made the selected primary read like a dark pad; iteration 68 corrected this by removing the duplicate base and brightening the primary sprite.

## Iteration 69 - Compact heatmap switch and rich hover detail

Screenshots and metrics:
- Final concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-69-compact-heatmap-concept-state-global.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-69-compact-heatmap-concept-state-crop.png`
- Tooltip global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-69-compact-heatmap-tooltip-global.png`
- Final real-start global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-69-compact-heatmap-real-start-global.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-69-compact-heatmap-metrics.json`

What is closer to the concept art and the playable game:
- The heatmap switch no longer occupies a long textual band over the map; it is now a compact 294x40 command strip in the desktop capture.
- Heatmap controls now use short tactical codes and six rich hover tooltips, matching the user's request for richer hover detail while keeping the visual weight low.
- Real-start capture remains clean with no starting building sprites.

What still differs visibly:
- The heatmap switch remains a gameplay control absent from the static concept art.
- The central map still has generated asset differences and live route topology differences.

What was changed:
- Added `heatmapTooltip()` and rich tooltip attributes to heatmap buttons in `GameHud`.
- Replaced long visible labels with compact codes: `PWR`, `CLD`, `NET`, `CPU`, `CO2`, `OFF`.
- Tightened desktop CSS for the heatmap switch and added a Playwright regression for compact labels, width and tooltip presence.

What should be tried next:
- Continue component-by-component with central map asset fidelity or route curation.
- Keep heatmap controls compact unless a future gameplay requirement justifies expanding them.

Regressions introduced:
- None observed in iteration 69 captures or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map-state/concept-central-map, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 70 - Geographic route curation

Screenshots and metrics:
- Before concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-69-compact-heatmap-concept-state-crop.png`
- Final concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-70-route-geography-curation-concept-state-global.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-70-route-geography-curation-concept-state-crop.png`
- Final real-start global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-70-route-geography-curation-real-start-global.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-70-route-geography-curation-metrics.json`

What is closer to the concept art and the playable game:
- The central map no longer shows three long orange congestion routes running from Scandinavia into eastern/southern Europe.
- Strategic concept rendering now selects 10 routes maximum, with 8 routes attached to the selected Benelux region and two local Nordic links in the current concept-state capture.
- The route layer now reads more like a local tactical mesh around the selected region, closer to the concept's Netherlands/Germany/France network density.
- The route selection still comes from live `summary.network_flows`; no static route background or baked topology was introduced.
- Real-start capture still reports zero map building textures before construction.

What still differs visibly:
- The concept art includes carefully painted warning accents; the current curated route set avoids misleading long congestion accents and therefore has fewer orange route strokes.
- Route endpoints and exact curvature still differ because they remain simulation-derived.

What was changed:
- Reworked `EGridMapScene.strategicMapFlows()` to rank routes by selected-region involvement, geographic centrality, route length and local-network value.
- Capped strategic routes at 10 and restricted non-selected long congested routes.
- Added Playwright guards for strategic route count, selected-endpoint coverage and congestion count.

What should be tried next:
- If route fidelity remains the priority, add a data-driven warning-accent layer from actual alerts instead of coloring arbitrary routes orange.
- Keep the central route selection data-driven and do not bake connections into the map asset.

Regressions introduced:
- None observed in iteration 70 captures or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map-state/concept-central-map, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 71 - Data-driven alert route accents

Screenshots and metrics:
- Before concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-70-route-geography-curation-concept-state-crop.png`
- Final concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-71-alert-route-accents-concept-state-global.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-71-alert-route-accents-concept-state-crop.png`
- Final real-start global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-71-alert-route-accents-real-start-global.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-71-alert-route-accents-metrics.json`

What is closer to the concept art and the playable game:
- Orange warning detail is back on the map, but now it is tied to real `summary.alerts` instead of arbitrary hash coloring.
- Concept-state metrics show 4 alert accents, covering the current actionable regional alerts: Italie Sud & îles, Baltique Nord, Méditerranée insulaire and Suède Sud.
- One alert accent is attached to an actual flow endpoint, creating a short orange segment near the affected route without reintroducing full long warning arcs.
- Real-start metrics show zero alert accents and zero building textures, so the start state stays clean.

What still differs visibly:
- The concept art's orange accents are more editorial and route-like; the current version favors small alert beacons and short route stubs to avoid misleading topology.
- Some alert regions are outside the main selected Benelux cluster, so their accents sit at map edges rather than in the concept's central warning paths.

What was changed:
- Added `MapAlertAccent`, `strategicAlertAccents()`, `drawAlertAccents()` and `drawQuadraticSegment()` in `EGridMapScene`.
- Alert accents are capped to the first four regional alerts by priority.
- Added Playwright guards for alert accent count and at least one flow-backed accent in the concept central-map test.

What should be tried next:
- If alert-route fidelity remains important, derive route-like warning accents from alert cause categories and nearby real flows, but keep them short and clearly state-backed.
- Continue avoiding static connections in any map background or asset.

Regressions introduced:
- None observed in iteration 71 captures or metrics.
- Final validation passed `pnpm lint`, the targeted Playwright visual subset for desktop/map-state/concept-central-map, and `pnpm build`.
- `pnpm build` still emits the existing Vite chunk-size warning for the large bundled game chunk.

## Tracking update - Mini GRID OVERVIEW background accepted

User feedback:
- The current map-only overview asset is good and should no longer be an active visual target.

Tracking consequence:
- Keep `grid-overview-europe-map-only-v1.png` as the accepted geography-only raster.
- Do not generate or swap another mini overview background while working on unrelated visual gaps.
- Preserve the existing regression guards: no static route/orbit SVG paths and no baked network connections in the background.
- Next iterations should focus on other differences, primarily central map module fidelity, alert-route semantics, or component-level HUD polish.

## Iteration 73 - Central map module ground blend

Screenshots and metrics:
- Before concept canvas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-72-current-audit-concept-state-canvas.png`
- Final concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-73-module-ground-blend-concept-state-global.png`
- Final concept canvas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-73-module-ground-blend-concept-state-canvas.png`
- Final real-start global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-73-module-ground-blend-real-start-global.png`
- Final construction canvas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-73-module-ground-blend-construction-canvas.png`
- Final concept metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-73-module-ground-blend-concept-state-metrics.json`
- Final real-start metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-73-module-ground-blend-real-start-metrics.json`
- Final construction metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-73-module-ground-blend-construction-metrics.json`

What is closer to the concept art and the playable game:
- Built map modules are slightly smaller, lower on the terrain and less cyan-glow dominant.
- Non-primary modules are lightly desaturated and lower-alpha, so they read less like bright atlas stickers.
- A small foreground terrain skirt now crosses the sprite foot, making the modules feel more embedded in the map.
- Metrics preserve the important state invariants: concept-state has `buildingTextureCount: 40`, real-start has `buildingTextureCount: 0`, and construction has one queued building with `buildingTextureCount: 0`.

What still differs visibly:
- The sprites are still generated isometric assets. This pass improves grounding, but does not replace a true tiny painted map-marker atlas.
- The central map is still darker and more texture-heavy than the concept, and route/alert composition remains simulation-derived.

What was changed:
- Tuned `drawModuleSprite()` display size, vertical anchor, alpha, tint, shadow and glow in `EGridMapScene`.
- Added `drawModuleTerrainSkirt()` to overlay a subtle terrain-colored foot mask on enhanced map sprites.
- Reused the iteration-72 audit capture script with a new prefix for iteration-73 artifacts.

What should be tried next:
- If continuing central-map fidelity, decide between a new tiny marker atlas and a selected-region composition pass; generic scale/glow tuning is now lower return.
- Add scroll hotspot regression coverage before more panel layout work.

Regressions introduced:
- None observed in iteration-73 screenshots or metrics.
- Final validation passed `pnpm lint`, targeted Playwright `initial desktop|map structures reflect|concept central map`, and `pnpm build`.
- `pnpm build` still emits only the existing Vite chunk-size warning for the large bundled game chunk.

## Iteration 74 - Priority audit reset

Screenshots and metrics:
- Concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-global.png`
- Concept top bar: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-topbar.png`
- Concept left rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-left-rail.png`
- Concept right panel: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-right-panel.png`
- Concept alerts: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-alerts.png`
- Concept mini overview: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-grid-overview.png`
- Real-start global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-real-start-global.png`
- Construction canvas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-construction-canvas.png`
- Recherche rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-research-left-rail.png`
- Concept metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-metrics.json`
- Real-start metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-real-start-metrics.json`
- Construction metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-construction-metrics.json`
- Recherche metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-research-metrics.json`

What is closer to the concept art and the playable game:
- The actual playable state remains aligned with the user constraints: empty start has no built building sprites, construction shows only the grey placeholder cube, and completed/module sprites appear only in the concept/built state.
- Major panels still fill the desktop viewport without measured overflow or incomplete zones.
- AGI rings remain ticks-only, and the mini GRID OVERVIEW keeps the accepted map-only raster with dynamic topology over it.
- Bottom alert text now occupies each alert card; this is no longer a blocking layout problem.

What still differs visibly:
- The central map remains the largest art gap: the terrain is darker/grittier, modules are generated isometric props, and route/alert topology is state-derived rather than hand-composed like the concept.
- The right region panel is stable but still uses dark blue thumbnail slot cards instead of concept-like painted technical tiles.
- The BUILD rail is usable but visually more abstract and darker than the concept's strong icon grid.
- The Recherche tab has no direct concept reference and remains in the right spirit, but should be protected as a functional panel rather than overfitted to the BUILD reference.

What was changed:
- No UI code change in this iteration. This was a state reset and tracking cleanup after the long visual pass.
- Updated this feedback file and `component-diagnostics.md` to point at iteration-74 artifacts and to revise priority order.

What should be tried next:
- Work next on central-map asset/composition fidelity or right-panel slot tile treatment; those are now the highest-return visual gaps.
- Keep mini GRID OVERVIEW and top-bar work to regression guard unless a new screenshot shows a concrete issue.
- Add broader scroll hotspot tests only before touching panel layout again or if the user reproduces cursor-location scroll failure in a current build.

Regressions introduced:
- None observed in iteration-74 screenshots or metrics.
- Targeted Playwright validation passed: `construction accordion|construction all mode|research tab keeps compact`.


## Iteration 75 - Central map selected composition

Screenshots and metrics:
- Final concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-75-central-map-composition-concept-state-global.png`
- Final concept canvas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-75-central-map-composition-concept-state-canvas.png`
- Final real-start global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-75-central-map-composition-real-start-global.png`
- Final construction canvas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-75-central-map-composition-construction-canvas.png`
- Final concept metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-75-central-map-composition-concept-state-metrics.json`
- Final real-start metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-75-central-map-composition-real-start-metrics.json`
- Final construction metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-75-central-map-composition-construction-metrics.json`

What is closer to the concept art and the playable game:
- The selected Benelux cluster is less crowded: the selected-region cap is now 3 structures instead of 4.
- The selected primary module is more clearly dominant, while selected-region satellites are smaller and less visually competitive.
- The central map atmosphere is slightly brighter in the playable/concept desktop view; pixel metrics show central-map luma rising from 42.71 to 43.09.
- Real-start and construction rules are preserved: no final building sprites at empty start or while the queued building is still under construction.

What still differs visibly:
- The reference map remains much brighter and more luminous than the current render: reference central luma measured about 63.97 versus 43.09 in iteration 75.
- The reference Benelux area has much more cyan/white detail density than the current generated map and atlas modules.
- The current modules are still generated isometric props; composition improved, but asset source fidelity remains the hard gap.

What was changed:
- Increased the subtle additive map-atmosphere fills in `EGridMapScene`.
- Reduced selected-region strategic structure cap from 4 to 3.
- Increased selected primary render scale and reduced selected satellite scale.
- Reduced non-primary enhanced map sprite display size from 50 to 47 while keeping the primary at 62.
- Updated the concept central-map visual guard for the new 36-texture / approximately 9-structure target.
- Documented the repeatable capture workflow in `visual-capture-workflow.md`.

What should be tried next:
- Continue central-map work only if the next pass tackles a bigger gap: terrain/lighting grade or a true tiny painted map-marker atlas.
- Otherwise move to right-panel slot tile treatment, now the next high-value HUD component.

Regressions introduced:
- None observed in metrics or tests.
- Passed `pnpm lint`.
- Passed targeted Playwright: `map structures reflect|concept central map`.
- Passed `pnpm build`; only the existing Vite chunk-size warning remains.

## Iteration 76 - Right region slot tiles

Screenshots and metrics:
- Final concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-76-region-slot-tiles-concept-state-global.png`
- Final right-panel crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-76-region-slot-tiles-concept-state-right-panel.png`
- Final real-start right-panel crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-76-region-slot-tiles-real-start-right-panel.png`
- Final concept metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-76-region-slot-tiles-concept-state-metrics.json`
- Final real-start metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-76-region-slot-tiles-real-start-metrics.json`

What is closer to the concept art and the playable game:
- Active building slots in the right panel now read more like technical tiles instead of tiny dark thumbnails.
- The slot art is larger, brighter and more saturated, with a stronger inner technical frame and clearer green status ticks.
- Empty/locked slots keep a quieter tactical frame, so they remain visible without dominating the active tiles.
- The real-start panel remains clean and does not show built slots before buildings exist.

What still differs visibly:
- The slot art still uses the shared generated building-card atlas, not bespoke painted right-panel tiles matching the concept one-for-one.
- Concept values/region name remain live game state (`BENELUX`, `16/18`) rather than static Netherlands copy, by design.

What was changed:
- Tuned the desktop right-panel `.built-card`, `.building-art` and `.locked-slot-card` CSS.
- Enlarged and brightened right-panel building art while preserving the same markup and demolition behavior.
- Added a regression guard that right-panel slot art remains at least 58x48 and keeps a brightness filter.

What should be tried next:
- Move to BUILD rail glyph/card fidelity, unless central-map terrain lighting or a new map-marker atlas becomes the next explicit target.
- Keep right-panel slot work to regression guard unless bespoke slot artwork is generated later.

Regressions introduced:
- None observed in iteration-76 screenshots or metrics.
- Passed `pnpm lint`.
- Passed targeted Playwright: `P0 completed buildings render|France Nord selection shows`.
- Passed `pnpm build`; only the existing Vite chunk-size warning remains.

## Iteration 77 - BUILD rail glyph contrast

Screenshots and metrics:
- Final concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-77-build-rail-glyphs-concept-state-global.png`
- Final concept left rail crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-77-build-rail-glyphs-concept-state-left-rail.png`
- Final real-start left rail crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-77-build-rail-glyphs-real-start-left-rail.png`
- Final concept metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-77-build-rail-glyphs-concept-state-metrics.json`
- Final real-start metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-77-build-rail-glyphs-real-start-metrics.json`
- Final construction metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-77-build-rail-glyphs-construction-metrics.json`

What is closer to the concept art and the playable game:
- The BUILD rail sub-cards now read less like dark thumbnails and more like compact technical pictogram buttons.
- Card frames are brighter, inner schematic overlays are stronger, and the generated atlas is treated more as backing material than as the primary readable symbol.
- The left rail still fits the desktop panel, keeps the mini GRID OVERVIEW visible, and reports zero measured overflow in concept-state and real-start.
- Pixel sampling on the left-rail crop shows a visible contrast lift: luma 32.18 to 35.76, bright pixels 11240 to 16487, cyan pixels 6686 to 11034.

What still differs visibly:
- The concept's rail icons are cleaner painted/line-art glyphs; the current version is still CSS line-art over a shared atlas.
- The real game must expose Construction/Recherche tabs and live locked-state behavior, so it cannot be a blind static copy of the concept rail.
- A future higher-fidelity pass should generate a dedicated BUILD glyph atlas if this component becomes the focus again.

What was changed:
- Tuned desktop `.palette-body-construction .build-card` backgrounds, borders and inner glow.
- Strengthened `.build-visual` frame/crosshair overlays.
- Brightened and clarified `.building-art::before` and `.building-art::after` glyph layers in the construction rail only.
- Added a Playwright guard that desktop construction card glyph overlays remain active, bright and non-overflowing.

What should be tried next:
- Return to the central map for the largest remaining visual gap, ideally with terrain/lighting grade or a true tiny map-marker atlas while preserving gameplay state invariants.
- If HUD polish is preferred next, bottom alert glyph/copy rhythm is now a higher-value component than more BUILD rail CSS tuning.

Regressions introduced:
- None observed in iteration-77 screenshots or metrics.
- Real-start still reports `buildingTextureCount: 0`.
- Construction still reports one queued item, zero built items and `buildingTextureCount: 0`.
- Passed `pnpm lint`.
- Passed targeted Playwright: `construction palette is open|construction cards are compact`.
- Passed targeted Playwright: `map structures reflect`.
- Passed `pnpm build`; only the existing Vite chunk-size warning remains.

## Iteration 78 - Central map light and route density

Screenshots and metrics:
- Final concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-78-central-map-light-routes-concept-state-global.png`
- Final concept canvas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-78-central-map-light-routes-concept-state-canvas.png`
- Final central-map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-78-central-map-light-routes-concept-state-central-map-crop.png`
- Final real-start canvas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-78-central-map-light-routes-real-start-canvas.png`
- Final concept metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-78-central-map-light-routes-concept-state-metrics.json`
- Final real-start metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-78-central-map-light-routes-real-start-metrics.json`
- Final construction metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-78-central-map-light-routes-construction-metrics.json`

What is closer to the concept art and the playable game:
- The central map has a stronger cyan/white atmosphere layer, closer to the brighter painted reference.
- Strategic route density increased from 10 to 12, so the Benelux hub reads less sparse while staying capped.
- Route strokes, route nodes and built-module additive detail are slightly more legible.
- Central-map crop metrics improved versus iteration 77: luma 42.24 to 44.00, cyan pixels 19315 to 22229, bright pixels 58443 to 70350.
- Real-start and construction invariants remain protected: no final building sprites at empty start and no final building sprite while a building is only queued.

What still differs visibly:
- The reference central map is still much brighter and more hand-painted; measured reference luma remains about 63.97 versus 44.00 for iteration 78.
- Map modules are still generated atlas props rather than concept-grade tiny painted infrastructure.
- One controlled congested route is now visible; it adds concept-like orange alert energy, but route composition remains simulation-derived rather than art-directed.

What was changed:
- Increased desktop/concept map atmosphere fill and arc alpha in `EGridMapScene`.
- Increased concept strategic route cap from 10 to 12 and adjusted the Playwright guard accordingly.
- Increased concept route stroke/node highlight alpha and built-module additive lift.
- Created a central-map crop artifact for component-level review.

What should be tried next:
- For the map, stop doing tiny alpha-only changes and move to a stronger terrain grade or a true map-marker atlas if further central-map work is chosen.
- If switching to HUD polish, bottom alerts are now the next useful component-level pass.

Regressions introduced:
- None observed in iteration-78 screenshots or metrics.
- Concept-state panels still report zero overflow.
- Real-start still reports `buildingTextureCount: 0`.
- Construction still reports one queued item, zero built items and `buildingTextureCount: 0`.
- Passed `pnpm lint`.
- Passed targeted Playwright: `concept central map|map structures reflect`.
- Passed `pnpm build`; only the existing Vite chunk-size warning remains.

## Iteration 79 - Bottom alert dock polish

Screenshots and metrics:
- Final concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-79-alert-dock-polish-concept-state-global.png`
- Final alert crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-79-alert-dock-polish-concept-state-alerts.png`
- Final real-start alert crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-79-alert-dock-polish-real-start-alerts.png`
- Final concept metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-79-alert-dock-polish-concept-state-metrics.json`
- Final real-start metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-79-alert-dock-polish-real-start-metrics.json`
- Final construction metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-79-alert-dock-polish-construction-metrics.json`

What is closer to the concept art and the playable game:
- Alert cards now have clearer type-specific color treatment: warning red/orange, research blue, network amber.
- Alert glyphs are larger and more readable while remaining CSS-drawn technical symbols rather than punctuation.
- Text hierarchy is slightly calmer: title/body sizing is tighter and the body color separates from the title.
- The bottom dock still fits the same 84px height and reports zero measured overflow.
- Real-start stable cards remain visible and unclipped.

What still differs visibly:
- The concept alert strip has more bespoke painted icon assets and more editorial copy rhythm.
- The live game must handle variable alert titles and actions, so card text is still more compressed than the static concept art.
- If the alert dock is revisited after human feedback, a generated icon atlas would be higher value than more CSS-only icon tuning.

What was changed:
- Tuned desktop `.alert-item` grid, padding, borders, backgrounds and inset glow.
- Increased `.alert-icon` size and strengthened pseudo-element glyphs.
- Added type-specific card and action-button treatment for research and network alerts.
- Tightened desktop alert title/body typography without changing the markup or actions.

What should be tried next:
- Stop autonomous iterations here and wait for human feedback.
- If feedback asks for continued map fidelity, prioritize a true map-marker atlas or stronger terrain grade.
- If feedback focuses on the alert strip, use generated/painted icon assets rather than another small CSS-only pass.

Regressions introduced:
- None observed in iteration-79 screenshots or metrics.
- Concept-state panels still report zero overflow.
- Real-start still reports `buildingTextureCount: 0`.
- Construction still reports one queued item, zero built items and `buildingTextureCount: 0`.
- Passed `pnpm lint`.
- Passed targeted Playwright: `network flows and actionable alerts`.
- Passed `pnpm build`; only the existing Vite chunk-size warning remains.
