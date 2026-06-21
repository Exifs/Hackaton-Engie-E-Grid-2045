# Component diagnostics - E-Grid 2045 v2.0 convergence

Current audit screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-global.png`

Current targeted component captures:
- Top bar: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-topbar.png`
- Left rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-left-rail.png`
- Right panel: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-right-panel.png`
- Alerts: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-alerts.png`
- Mini overview: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-grid-overview.png`
- Real start: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-real-start-global.png`
- Construction state: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-construction-canvas.png`
- Recherche state: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-research-left-rail.png`

Reference: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\reference-v2-0.png`

Component reference crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\reference-v2-0-grid-overview-crop.png`

Central map reference crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\reference-v2-0-central-map-crop.png`

## Current priority audit - Iteration 74

Fresh evidence:
- Concept-state global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-global.png`
- Concept-state metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-concept-state-metrics.json`
- Real-start global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-real-start-global.png`
- Real-start metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-real-start-metrics.json`
- Construction canvas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-construction-canvas.png`
- Construction metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-construction-metrics.json`
- Recherche crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-research-left-rail.png`
- Recherche metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-74-priority-audit-research-metrics.json`

Stable / accepted:
- Main screen composition is stable. The top bar, BUILD rail, right panel, alert dock and GRID OVERVIEW all report zero measured overflow in the iteration-74 concept-state and real-start metrics.
- The mini GRID OVERVIEW background is accepted by user feedback. Keep `grid-overview-europe-map-only-v1.png`; do not iterate on that background asset unless a regression appears.
- AGI rings are ticks-only and should stay that way.
- Construction state is protected: real start reports `buildingTextureCount: 0`; queued construction reports one construction item, zero built items and `buildingTextureCount: 0`.
- Recherche default real-start view has no body/card/title overflow and keeps the mini GRID OVERVIEW visible.
- Targeted scroll validation passes for construction accordion, construction all-mode card-surface scroll and recherche card-surface scroll.
- Iteration 73's central-map sprite grounding remains the current code-side state: lower/smaller/desaturated built sprites with a foreground terrain skirt.

Updated priority list:
1. Central map module and terrain fidelity - High. The map still carries the most visible remaining gap: generated isometric module props, darker relief texture, and state-shaped route/alert composition. Further generic glow/scale tuning is lower return; the next map pass should be a true tiny map-marker atlas or a selected-region composition pass. Any next map pass must preserve the no-start-sprite / grey-construction-cube / final-built-sprite invariant.
2. Right region panel slot treatment - Medium to high. The panel is stable and useful, but building slots still read as blue UI thumbnails rather than concept-like technical building tiles.
3. BUILD rail icon/card fidelity - Medium. The layout now fits and the mini overview remains visible, but card art and glyphs are darker and more abstract than the concept's stronger pictogram grid.
4. Bottom alerts polish - Medium. Alert text now fits and occupies the cards, but live copy rhythm and CSS glyphs remain less bespoke than the concept.
5. Scroll hotspot regression coverage - Medium / guard. Construction and recherche card-surface scroll are validated; add right-panel and alert-dock hotspot tests before major panel layout work, especially if those panels become scrollable again.
6. Top bar chrome micro-detail - Low. Structure is close enough that further work should wait until higher-impact map/panel issues are handled.

Deprecated priority notes:
- Any note asking to regenerate the mini GRID OVERVIEW background is superseded by user acceptance after iteration 71/72.
- Any note treating the old `grid-overview-europe-neon-v1.png` as current is obsolete.
- Any note that assumes map buildings exist at real game start is incorrect; current real-start metrics verify zero building textures.

## Component-by-component status snapshot - Iteration 74

Global frame:
- Status: stable / regression guard.
- Evidence: iteration-74 metrics show zero measured overflow on top bar, BUILD rail, right panel, alert dock and GRID OVERVIEW in concept-state and real-start.
- Next action: do not resize global panels unless a future screenshot shows clipping, incomplete fill or content cut-off.

Top bar:
- Status: stable / regression guard.
- Evidence: crop shows the expected brand, ticks-only AGI duel, budget/date, speed controls and command block.
- Next action: keep AGI ticks-only; only tune top-bar micro-detail after higher-value map/panel work.

Central map:
- Status: active high priority.
- Evidence: playable state rules hold, but the concept-state crop still differs strongly in asset style and terrain mood.
- Next action: choose between a tiny painted map-marker atlas and selected-region composition, not more generic glow/scale tweaking.

BUILD rail:
- Status: medium priority.
- Evidence: layout fits, tabs work, mini overview remains visible, but the construction card art is dark and more abstract than the concept's clear pictogram grid.
- Next action: refine BUILD card/glyph readability if not working on the map or right panel.

Recherche tab:
- Status: functional guard, not a concept-copy target.
- Evidence: default real-start view has 4 readable cards, no measured title/card/body overflow and the mini overview stays visible.
- Next action: keep it visually consistent with BUILD, but do not force a fake concept match because no reference exists.

Mini GRID OVERVIEW:
- Status: accepted / regression guard.
- Evidence: current background is `grid-overview-europe-map-only-v1.png`; metrics report `staticThreadCount: 0`, 10 dynamic hub lines and 20 nodes.
- Next action: preserve the accepted map-only raster and dynamic topology separation.

Right region panel:
- Status: medium-high priority.
- Evidence: no overflow and readable status blocks, but building slots still read as dark blue UI thumbnails rather than painted technical tiles.
- Next action: run a slot tile/glyph treatment pass before spending more time on top-bar chrome.

Bottom alerts:
- Status: medium priority.
- Evidence: alert text now occupies the cards in the iteration-74 crop; no overflow is measured on the alert dock.
- Next action: polish bespoke alert glyphs and copy rhythm only after map/right-panel work, unless text overflow reappears.

Scroll hotspots:
- Status: medium guard.
- Evidence: targeted Playwright tests pass for construction accordion, construction all-mode card-surface scroll and recherche card-surface scroll.
- Next action: add right-panel/alert-dock hotspot coverage before future panel layout changes or after any reproduced cursor-location failure.

## 1. Global frame and composition

Current state:
- Major frame positions are stable: top bar, left build rail, right region panel, bottom alerts and central map all fill their intended zones.
- DOM measurements show no overflow or collisions between major HUD panels.
- Desktop panel chrome now adds bevels, corner highlights, scan texture and stronger inner shadows in the real game and the concept-state capture.
- The main HUD panels now share an ImageGen-generated raster texture, `public/assets/generated/panel-chrome-texture-v1.png`, applied as a low-contrast material layer under the existing CSS bevels.
- The real desktop game now uses the same primary component styling as the concept-state capture; `scenario=concept` is no longer a separate HUD variant.
- Iteration 59 adds a shared background-layer corner hardware pass to the five main panels: top bar, BUILD rail, right panel, alert dock and mini GRID OVERVIEW.
- `iteration-59-panel-corner-hardware-metrics.json` reports the texture preserved, 8 linear corner/bracket gradient layers, 4 radial bolt layers and zero overflow on all five panels.

Visible differences:
- The concept still has heavier custom mechanical brackets and more bespoke per-panel corner hardware.
- The new texture is intentionally subtle for readability; the concept still has stronger painted panel cuts, bolts and per-panel bespoke hardware.
- The texture is shared and stretched per panel, so it does not yet align exactly to every panel's geometry.

Future actions:
- If panel fidelity remains a priority, split the generated texture into specific border/corner assets instead of using one stretched full-panel texture.
- If chrome remains a priority, replace the procedural shared corner layer with separate generated horizontal/vertical/corner assets.
- Keep current panel bounds; do not change composition unless a later screenshot shows clipping.

Priority: Accepted / regression guard only.

## 25. Iteration 59 shared panel corner hardware

Current evidence:
- Before global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-before-panel-chrome-global.png`
- Before top bar crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-before-panel-chrome-topbar.png`
- Before right panel crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-before-panel-chrome-right-panel.png`
- Before metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-before-panel-chrome-metrics.json`
- Final global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-panel-corner-hardware-global.png`
- Final top bar crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-panel-corner-hardware-topbar.png`
- Final left rail crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-panel-corner-hardware-left-rail.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-59-panel-corner-hardware-metrics.json`

Updated current state:
- The main panel frames now have a shared procedural corner hardware layer: short luminous bracket strokes and small radial bolt points.
- The layer is background-only and does not consume pseudo-elements already used by specific panels.
- Top bar, BUILD rail, right region panel, alert dock and mini GRID OVERVIEW keep the existing 9-patch texture and zero-overflow dimensions.
- The initial desktop visual test now verifies the texture plus 8 linear and 4 radial corner layers on all five main panels.

Visible differences:
- The hardware is shared/procedural, while the concept has bespoke, differently worn brackets per panel.
- The current pass is intentionally subtle so it does not reduce text readability or collide with panel contents.

Future actions:
- If panel exactness becomes a high priority, generate separate corner/edge hardware bitmap assets and apply them per panel type.
- Keep the shared corner-layer regression until those assets replace it.

Priority: Accepted / regression guard only.

## 2. Top bar

Current state:
- Brand, AGI duel rings, budget, date and speed controls are now structurally close to the concept.
- `E-GRID 2045` is a real DOM brand panel with large title type and a rich tooltip.
- AGI rings are now rendered as individual segmented ticks only, without a continuous progress circle underneath.
- Iteration 52 removes the remaining circular background/box-shadow from the `.agi-ring` container. The only circular progression marks are the 48 tick elements; the percent keeps only a small dark readability backing.
- Simulation speed is a dedicated concept-like module with pause/play/fast buttons and a `1.0x` readout in the real game, not only in the concept scenario.
- A separate hamburger command block now occupies the far-right top-bar slot in both real and concept-state views.
- Tooltips are available on brand/AGI/budget/date.
- The top bar container and its brand, AGI, KPI, speed and menu submodules now use the shared panel texture layer.

Visible differences:
- The deterministic game state highlights pause, while the static concept highlights play.
- The hamburger currently triggers the existing onboarding/replay command rather than a full command menu.
- AGI rings still lack the exact painted micro-detailing and value state of the concept, but no continuous progress circle should be reintroduced.
- Top-bar separators and corner hardware remain CSS/simple compared with the concept's bespoke mechanical frame.

Future actions:
- Add a real command menu behind the hamburger only if that becomes a functional requirement.
- Add finer tick noise/micro-detail only if top bar exactness remains a priority after map work.

Priority: Low to medium after iteration 72; keep current structure unless top-bar exactness becomes the explicit target.

## 3. Central map

Current state:
- The map fills the central region and uses network lines, labels, region halos, selected slots and atlas-backed building markers.
- ImageGen-generated atlas assets now make modules more concrete than vector-only markers.
- Desktop rendering limits visible module markers to the most important regions, reducing clutter versus the previous pass.
- Desktop rendering now brightens module sprites with a small additive glow and slightly larger display size.
- Desktop rendering now filters secondary route lines and draws active flows as curved highlighted routes with pulse points.
- Desktop rendering now renders country and sea labels, while suppressing most low-value internal gameplay region labels.
- Desktop real game now uses the same curved route hierarchy, geographic label layer, enhanced sprite glow/size and strategic structure cap.
- A subtle Phaser map-atmosphere layer now adds cool highlights, map arcs and edge grading below flows/modules in desktop and concept-state views.
- Built structures now draw a terrain integration layer: contact shadow, subtle accent pad, connector to the regional node and small anchor points before the final sprite.
- Selected-region slots now become smaller and dimmer when the selected region already has buildings or queued construction, while empty regions keep a clear planning grid.
- Map structures now reflect gameplay state: absent at empty start, grey cube during construction, real building icon only once built.
- The central map now uses a dedicated map-only atlas, `public/assets/generated/building-map-atlas-v2.png`, instead of the brighter UI/card atlas.
- Iteration 53 replaced that with `public/assets/generated/building-map-atlas-v3.png`, a darker ImageGen atlas with transparent chroma-key cleanup, smaller terrain footprints and no thick cyan sticker outline for the mapped building cells.
- Iteration 63 replaces the active map texture with `public/assets/generated/building-map-atlas-v4.png`, another ImageGen/chroma-key atlas in the same 1254x1254 RGBA / 4x4 format. Cells 0-11 remain building modules; cells 12-15 are neutral spare pads instead of warning/CO2/lock symbols.
- Iteration 64 adds a strategic per-region module cap and slightly reduces enhanced sprite size/glow. The concept-state capture now renders 12 visible structures instead of the previous denser cluster, while empty real start remains at zero building sprites.
- Iteration 73 lowers and slightly shrinks enhanced built sprites, reduces additive glow/detail lift, lightly desaturates non-primary sprites and adds a small foreground terrain skirt to make sprite feet sit into the map.
- Structure placement is deterministic and type-aware, with offshore/sea assets pushed toward water and coastal land assets inset back toward land.
- A global visible-structure cap prevents overloading the map.
- Iteration 50 makes selected-region slot markers much smaller and dimmer when the selected region already has built/queued structures. Empty selected regions keep the clearer planning grid.
- `iteration-50-slot-dim-metrics.json` reports built-region slot size reduced from `8.7` to `4.53`, occupied alpha reduced to `0.16`, and empty-start slot size/alpha preserved at `8.7` / `0.42`.
- Iteration 51 adds stronger terrain grounding below built modules: a broader dark contact shadow, secondary inset shadow, subtle accent pad, connector struts and anchor dots, plus a low-alpha dark sprite shadow behind enhanced map sprites.
- `iteration-51-map-module-grounding-metrics.json` confirms the gameplay state rule remains intact: empty real start has `buildingTextureCount: 0`, construction real state has `buildingTextureCount: 0`, and the built concept state has visible final sprite textures.
- Iteration 61 reduces central-map clutter in the concept-style desktop rendering: live problem/region labels are suppressed under the geographic label layer, strategic flow rendering is capped to the top 12 sorted flows, built-region slots are dimmer/smaller, and map sprites receive a subtle additive detail lift.
- Iteration 61 also lightens/shrinks the built module pads so the generated building sprite reads above the terrain base instead of the base reading as a black diamond.
- `iteration-61b-central-map-pad-tune-metrics.json` confirms empty real start still has `buildingTextureCount: 0`, concept-state has built module textures, and onboarding is absent in both captures.
- Iteration 62 rebalances central-map strategic routes: concept-style rendering still draws 12 state-derived routes, but caps congested/orange routes to 3 and uses thinner/lower-alpha warning strokes so cyan/green topology remains dominant.
- `iteration-62b-route-balance-metrics.json` reports concept-state `networkFlowCount: 23`, `strategicFlowCount: 12`, `strategicCongestedCount: 3`, `strategicRegularCount: 9`, and empty real start still has `buildingTextureCount: 0`.
- Superseded capture note: do not use `iteration-21-construction-map-building-visible.png` as current evidence, because it predates the grey construction cube fix.

Visible differences:
- Current map remains darker and more texture-heavy than the concept, though the added atmosphere layer and iteration-73 grounding give it a cooler painted glow.
- Concept modules are still more hand-painted and bespoke than the generated atlas sprites, even with the v4 atlas, per-region cap, grounding layer and terrain skirt.
- The map backdrop relief and generated route topology do not match the exact concept map.
- Label positions are approximate; live region/problem labels are now suppressed in the concept-style geographic layer, but exact country placement still differs from the static art.
- Selected-region slot markers remain visible in empty regions as a gameplay planning affordance. Built-region slots are now very subdued, but exact concept art would likely hide them unless placement is active.

Future actions:
- If the v4 atlas still reads too icon-like after iteration 73, generate a more drastic atlas focused on tiny painted map markers rather than isometric building props. Avoid text-bearing CO2/lock/warning cells unless they become actively mapped.
- Avoid more generic sprite glow/scale tweaking unless a targeted crop shows a concrete regression; the current code pass improves grounding but does not replace a real painted module atlas.
- Consider hover/build-mode-only slot rendering only if the remaining slot grid still feels too game-like after further map asset work.
- If route exactness becomes the next target, define an explicit strategic route list for the concept-state scenario instead of deriving all long arcs from current network pressure.

Priority: High, but asset-heavy.

## 28. Iteration 62 central map route balance

Current evidence:
- Before route-balance crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-central-map-pad-tune-concept-state-crop.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-62b-route-balance-concept-state-crop.png`
- Final real-start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-62b-route-balance-real-start-crop.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-62b-route-balance-metrics.json`

Updated current state:
- Strategic central-map flows are still derived from simulation state, but warning/congested routes are capped to 3 in concept-style desktop rendering.
- The remaining warning strokes are thinner and lower alpha; cyan/green routes now carry more of the network structure.
- Real start remains empty of building sprites.

Visible differences:
- The exact route topology is still simulation-derived and does not match the hand-authored concept route layout.
- Long warning routes can still appear when the simulation scenario has long-distance congestion, just less dominantly.

Future actions:
- If route exactness remains important, add a concept-state route curation layer that selects visually local/representative routes from state instead of only ranking by intensity.
- Keep congestion visible; do not hide network problems entirely to match the static image.

Priority: Medium to high.

## 29. Iteration 63 map module atlas v4

Current evidence:
- Generated chroma-key source: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-building-map-atlas-v4-source.png`
- Project atlas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\public\assets\generated\building-map-atlas-v4.png`
- Atlas preview: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-building-map-atlas-v4-preview.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-map-atlas-v4-concept-state-crop.png`
- Final real-start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-map-atlas-v4-real-start-crop.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-map-atlas-v4-metrics.json`

Updated current state:
- The active Phaser map texture now points at `building-map-atlas-v4.png`.
- The atlas is 1254x1254 RGBA and preserves the 4x4 crop math.
- Cells 0-11 are building modules in the existing mapping order. Cells 12-15 are neutral spare pads, not status symbols.
- `iteration-63-map-atlas-v4-metrics.json` reports the atlas loaded in real start and concept-state, zero building textures in real start, and 60 rendered map-atlas texture instances in concept-state.

Visible differences:
- V4 has thinner terrain feet and safer spare cells than v3, but the buildings still read as generated isometric props rather than fully painted concept modules.
- Some sprites remain taller and more detailed than the concept map's small infrastructure markers.

Future actions:
- If module exactness remains the next priority, tune the sprite display size/alpha after v4 or generate a more aggressive tiny-map-marker atlas.
- Keep the v4 asset-request regression until a later atlas replaces it.

Priority: High.

## 30. Iteration 64 map module scale and density

Current evidence:
- Before crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-63-map-atlas-v4-concept-state-crop.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-64-module-scale-density-concept-state-crop.png`
- Final real-start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-64-module-scale-density-real-start-crop.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-64-module-scale-density-metrics.json`

Updated current state:
- Strategic desktop/concept-style rendering now caps visible map structures per region: selected region up to 6, other regions up to 2, still bounded by the global cap.
- Enhanced map sprites render slightly smaller with lower shadow/glow/detail alpha.
- `iteration-64-module-scale-density-metrics.json` reports concept-state `buildingTextureCount: 48`, inferred 12 visible structures, and real-start `buildingTextureCount: 0`.
- The concept central-map visual test now guards against returning to the previous denser module count by checking an estimated 10-13 visible structures.

Visible differences:
- The current module density is closer to the concept, but sprite art still has a generated isometric style.
- The selected region still shows multiple modules rather than one hand-composed dominant Netherlands module.

Future actions:
- If map modules remain the priority, either tune selected-region composition toward one dominant module plus satellites or generate a tiny-marker atlas with less prop-like perspective.
- Keep the per-region cap unless gameplay feedback requires showing more built structures on the central map.

Priority: High.

## 27. Iteration 61 central map declutter and module grounding

Current evidence:
- Reference central-map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\reference-v2-0-central-map-crop.png`
- Before concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-before-central-map-concept-state-crop.png`
- Before real-start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-before-central-map-real-start-crop.png`
- Final concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-central-map-pad-tune-concept-state-crop.png`
- Final real-start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-central-map-pad-tune-real-start-crop.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-61b-central-map-pad-tune-metrics.json`

Updated current state:
- Concept-style desktop map rendering now shows only geographic labels plus the selected region label, not every live region with a problem.
- Strategic flow rendering now sorts congestion/intensity first and caps the central-map flow overlay to 12 flows, while the simulation state itself remains unchanged.
- Built-region selected slots are smaller and much lower alpha; empty selected regions keep a planning grid.
- Enhanced map sprites are slightly larger and get a low-alpha additive detail pass; built pads are smaller and less black.
- A Playwright visual test now guards the concept central map against internal problem-label clutter while checking built module textures remain present.

Visible differences:
- Route topology still comes from the simulation graph and does not match the exact painted concept routes.
- Modules now come from `building-map-atlas-v4.png`; they are safer after the atlas swap, but still not as bespoke as the reference's painted infrastructure.
- The heatmap switch remains a real-game control above the map, unlike the static concept art.

Future actions:
- If map fidelity remains the next priority, either generate a tighter 0-11 map module atlas or define a concept-state route curation layer.
- Keep the empty-start invariant: no building sprites on the map until construction/built state exists.

Priority: High.

## 4. Left build rail

Current state:
- Rail is contained and no longer clipped.
- It lists construction groups and a real GRID OVERVIEW module.
- Desktop build rail now has category rows, large utility icon tiles, compact cards, and category order closer to the concept.
- The mini GRID OVERVIEW and compact category-card treatment are now present in the real game too.
- The desktop header is compact: BUILD/collapse, construction/research tabs and the lock filter fit into about 100px.
- Real-game category tabs remain visible for functionality as a one-row horizontal strip, avoiding the previous cut Research section above the mini overview.
- The default real-game BUILD body now fits the visible card groups and mini GRID OVERVIEW without vertical clipping.
- Iteration 49 re-centered compact construction cards and makes their bitmap art read more like small technical module slots: reduced art scale, desaturated/toned thumbnails, internal pad lines and a subtle schematic overlay.
- `iteration-49b-build-card-composition-metrics.json` reports centered art (`centerDeltaX/Y: 0`), `overflowY: 0` for cards, `railOverflowY: 0`, and active pseudo overlays on compact desktop cards.
- Iteration 55 adds CSS line-art glyph overlays per building type on compact desktop cards, while keeping the existing bitmap atlas as a subdued backing layer.
- `iteration-55b-build-card-glyph-overlay-metrics.json` reports `railOverflowY: 0`, 11 compact cards, 10 glyph-backed real building cards, and the locked preview label hidden (`lockedLabelDisplay: none`).
- Iteration 57 brings the Recherche tab closer to the BUILD card language: research cards now use compact technical glyph tiles, two-line clamped uppercase titles and stronger legibility for locked/unavailable states.
- `iteration-57b-research-compact-metrics.json` reports zero title/card overflow, pseudo-glyphs on every research card, visible mini GRID OVERVIEW in the palette, and zero `.palette-body-research` overflow in both real start and concept-state captures.

Visible differences:
- Category glyphs use current project utility PNGs, not the exact concept-painted white symbols.
- Building cards now read more like compact technical pictograms, but the underlying building art is still present as a backing layer and the glyphs are CSS-drawn rather than exact painted concept icons.
- Recherche has no static concept reference, so it deliberately follows BUILD's material/spacing instead of inventing a separate page language.
- Locked/research-gated cells still use current game disabled card treatment.
- The real rail is denser than the concept because it keeps construction/research tabs, locked filtering and category tabs available.
- Category access uses a horizontal tab strip, which is a real-game affordance absent from the static concept.

Future actions:
- If rail fidelity remains a priority, replace the CSS glyph overlays with a dedicated small glyph atlas or refine each glyph shape further.
- If rail fidelity remains a priority, create a tighter monochrome utility icon set or tune the existing symbols.
- Keep the existing construction functionality and rich tooltips.
- Consider icon-only category tabs with rich tooltips if the horizontal strip still feels too game-like, but do not hide real gameplay controls only to match the static concept.
- If Recherche grows more content, preserve the card-surface wheel-scroll test and keep the mini GRID OVERVIEW visible in the default real-game Recherche view.

Priority: Medium.

## 5. Right region panel

Current state:
- Region level, tabs, building slots, locked slots, Energy/Cooling/Compute status and Manage Region are now close to the concept.
- Energy, Cooling and Compute status headings now have compact pictograms aligned with the concept's icon-led status rows.
- Status blocks now expose rich hover tooltips with their metric breakdowns.
- Iteration 56 turns Overview/Buildings/Stats into real tab buttons. Overview remains the default concept-like view, Buildings isolates slots/chantier/demolition, and Stats shows compact live metric tiles plus the status stack.
- Tab clicks suppress stale hover overlays briefly, then rich tab tooltips remain available on hover/focus.
- `iteration-56c-region-tabs-metrics.json` reports `overflowY: 0` for Overview, Buildings and Stats; one active tab per state; 6 stat tiles in Stats; and no tooltip stuck after tab clicks.
- Iteration 58 adds richer status pictogram detail, a stronger technical frame for built slot cards, green slot pips, small module readiness badges and clearer locked-slot keyholes.
- `iteration-58b-region-panel-slot-status-tab-metrics.json` reports zero overflow in Overview, Buildings and Stats; all three status icons have before/after pseudo-detail; six visible built cards have pips/badges; and both visible locked slots have frame/keyhole pseudo-elements.

Visible differences:
- Values are live Benelux values rather than the exact Netherlands concept values.
- Slot art still uses the current generated game atlas tiles, now with concept-like framing/pips rather than exact painted reference art.
- Buildings and Stats do not have exact concept references, so they stay gameplay-driven while borrowing the same panel material, density and typography.
- Status pictograms are CSS-built approximations, not exact painted concept glyph assets.

Future actions:
- Consider a concept-state override for selected region name/values only if exact screenshot mimicry becomes more important than game-state fidelity.
- Replace CSS pictograms with a tiny monochrome glyph atlas only if right-panel icon fidelity becomes more important than the central map and mini overview.
- Keep Overview as the default visual reference path, and treat Buildings/Stats as functional extensions in the same art direction.
- Preserve the right-panel P0 regression that checks status/slot pseudo-details before replacing CSS glyphs with atlas assets.

Priority: Low to medium.

## 24. Iteration 58 right-panel slot/status glyph polish

Current evidence:
- Before concept Overview crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-before-concept-region-panel-overview.png`
- Before concept Buildings crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-before-concept-region-panel-buildings.png`
- Before metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-before-region-panel-metrics.json`
- Final concept Overview crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-region-panel-slot-status-concept-overview.png`
- Final concept Buildings crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-region-panel-slot-status-concept-buildings.png`
- Final real Overview crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58-region-panel-slot-status-real-overview.png`
- Final tab metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-58b-region-panel-slot-status-tab-metrics.json`

Updated current state:
- Status icons now have richer pseudo-detail: energy has a halo/spark, cooling has a more complete snowflake hub, and compute has chip pins.
- Right-panel built slots have a stronger concept-like frame, scan line, green slot pips and a small readiness badge over the art tile.
- Locked slots now have an internal frame and keyhole, so they read more like intentional locked panels than plain grey outlines.
- Overview and Buildings remain zero-overflow after the slot art pass.
- The P0 visual test now guards status icon pseudo-detail, built-slot pips/badges and locked-slot keyholes.

Visible differences:
- Slot artwork still comes from the current generated atlas, not exact painted concept modules.
- The new pips are uniform; the concept varies tiny slot indicators per building.
- CSS glyphs remain procedural and cleaner than painted concept glyphs.

Future actions:
- If this panel becomes a visual priority again, generate a compact right-panel slot/glyph atlas and map it into the existing card structure.
- Keep any future replacement constrained by the P0 pseudo-detail/overflow regression.

Priority: Low to medium.

## 6. Bottom alert strip

Current state:
- Five alerts fit without overflow and match concept placement more closely.
- Alert cards now include a left icon, compact title/body, a right action button, and a final collapse control.
- The enriched alert strip is now used by the real desktop game, not only `scenario=concept`.
- The alert text column was widened by removing the dismiss button from the grid flow and shrinking icon/action columns; `iteration-33-alert-dock-metrics.json` reports about 59% of each alert card width is now available to the main text.
- Iteration 47 compacted the alert icon/action columns further and allows long alert titles to wrap to two controlled lines.
- `iteration-47c-alert-text-fit-metrics.json` reports `panelOverflowY: 0`, `cardOverflowY: 0`, no horizontal title overflow, and a main text width ratio around 0.71 per card at the concept viewport.
- Iteration 48 replaced literal punctuation alert symbols with CSS-drawn warning, research, network, cooling and market glyphs. Metrics report empty pseudo text content and preserved 0 overflow.

Visible differences:
- Alert icons are now CSS-drawn pictograms rather than punctuation text, but they are still procedural CSS rather than exact painted glyph assets.
- Text is real gameplay copy and can be longer than concept copy.
- Very long titles now use more of the card instead of being forced into one-line ellipsis, but copy rhythm still differs from the hand-authored concept labels.

Future actions:
- Replace CSS glyphs with proper small utility assets only if this component becomes a priority again.
- Tune alert copy lengths or scenario data if exact concept text rhythm becomes necessary.

Priority: Low to medium.

## 7. Mini GRID OVERVIEW

Current state:
- It is a real data-driven component with nodes, flows, legend and a simplified Europe silhouette.
- Its concept layout now matches the reference more closely: legend left, map inset right.
- It is visible in the real desktop game and in the concept-state capture.
- The inset now uses `public/assets/generated/grid-overview-europe-map-only-v1.png`, an ImageGen raster map inspired by the main Europe backdrop and simplified into a ghostly neon overview.
- User review after iteration 71 accepts the current map-only background asset. Treat this background as done unless a regression appears.
- This raster is map-only: it must not contain static hubs, network links, routes or connection lines because the mini overview is dynamic.
- Live mini-map flow paths and DOM nodes overlay the raster with the compacted coordinate projection.
- `GameHud.gridOverviewEuropePaths()` now returns no static route/orbit paths. Metrics from iteration 44 report `staticThreadCount: 0` and `staticOrbitCount: 0`; visible links come from `getNetworkGraph()` and `network_flows`.
- `iteration-44-mini-overview-map-only-metrics.json` verifies raster background loading, visibility in real start/concept-state captures, dynamic path counts, and no card overflow.
- Iteration 45 increased only dynamic graph/node readability: `.mini-flow-data` is brighter and selected nodes now render as a smaller luminous hub with a soft halo.
- `iteration-45-dynamic-mini-overview-metrics.json` keeps `staticThreadCount: 0`, `staticOrbitCount: 0`, `cardOverflowY: 0`, and `mapOverflowY: 0`.
- Iteration 46 replaced the textual `[]` expand mark with a compact four-corner glyph drawn in CSS. Metrics report `expandText: ""`, unchanged 24x20 bounds, and no card overflow.
- Iteration 54 adds only dynamic SVG/DOM density: 10 selected-region hub paths, 4 stronger hub paths, and 20 ranked region nodes derived from graph/flow state.
- `iteration-54b-mini-overview-density-tuned-metrics.json` reports `staticThreadCount: 0`, `cardOverflowY: 0`, `mapOverflowY: 0`, 10 hub lines and 20 nodes in both real start and concept-state captures.
- Iteration 60 adds a dynamic node hierarchy: flow endpoints, non-active relay hubs and congested endpoints now receive separate DOM classes and visual halos.
- Iteration 60 also prioritizes congested dynamic flow paths before ordinary power paths when the compact mini-map has to choose the top 14 flows.
- `iteration-60c-dynamic-congestion-priority-metrics.json` reports the map-only background still active, no old network raster, `staticThreadCount: 0`, zero card/map overflow, 20 dynamic nodes in the concept-state capture, and one dynamic congestion line.

Visible differences:
- The geography is now raster and recognizable. Remaining hand-painted differences are accepted for now and should not drive more background-asset work.
- The reference crop still has a more hand-composed starburst, but the current central dynamic hub is closer than the earlier sparse graph.
- The expand glyph is now concept-compatible in structure, but still CSS-drawn rather than a bespoke painted asset.

Future actions:
- No active work is planned for the mini overview background asset.
- If this component is touched later for gameplay/readability, tune dynamic mini-node sizes, glow and flow opacity only through SVG/DOM layers.
- Keep the bitmap as a background geography/texture only. Do not bake network connections into future overview assets.
- Keep legend and data-driven flow dots.
- Verify future mini-map changes in the real game first, then in `scenario=concept` second.

Priority: Accepted / regression guard only.

## 26. Iteration 60 dynamic mini GRID OVERVIEW hierarchy

Current evidence:
- Before real start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-60-before-dynamic-overview-real-start-card.png`
- Before concept-state crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-60-before-dynamic-overview-concept-state-card.png`
- Final real start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-60c-dynamic-congestion-priority-real-start-card.png`
- Final concept-state crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-60c-dynamic-congestion-priority-concept-state-card.png`
- Final metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-60c-dynamic-congestion-priority-metrics.json`

Updated current state:
- The mini overview keeps `grid-overview-europe-map-only-v1.png` as a geography-only raster. It must not be replaced by a raster containing routes, hubs, network nodes or connection lines.
- User review after iteration 71 accepts this raster; do not keep iterating on the mini overview background during other component passes.
- Dynamic nodes now distinguish active flow endpoints, non-active relay hubs and congested endpoints with separate classes and halos.
- Congested flow paths are prioritized before ordinary power flow paths in the compact 14-flow overlay, so visible orange network state comes from simulation data rather than from the background.
- The initial desktop visual regression now checks the map-only raster, rejects the old `grid-overview-europe-neon` raster, verifies no static thread/orbit paths, and verifies dynamic node classes/halos.

Visible differences:
- The current dynamic hub is more readable than before, but the concept crop still has a more hand-painted starburst and denser tiny cyan connectors.
- The real-start view is intentionally sparser than the concept-state view because the component reflects actual game state.

Future actions:
- Do not generate a new mini overview background asset unless a concrete regression or gameplay need appears.
- Any future mini-map fidelity work should tune `mini-flow-*` paths, node ranking, node size and glow only through DOM/SVG layers.

Priority: Medium.

## 8. Rich tooltips

Current state:
- Rich tooltips exist for build cards, built assets, alerts, top KPIs, GRID OVERVIEW, right-panel tabs and right-panel status blocks.
- Recherche cards keep rich tooltips after the compact glyph pass.

Visible differences:
- Tooltips are gameplay additions and absent from static concept.

Future actions:
- Add tooltips to category headers if controls become more icon-only.
- Ensure pointer-events remain enabled for non-button tooltip triggers.

Priority: Low.

## 9. Panel scrolling

Current state:
- User testing found that scroll could fail depending on cursor position inside panels.
- Panel wrappers now receive pointer events directly, not only their buttons/tooltip triggers.
- `GameHud` now forwards wheel events to the relevant panel scroller when the cursor is over internal chrome, cards or non-scrollable child nodes.
- Desktop right-panel overflow is vertical-auto again, and the build dock has Playwright regression checks that scroll from both build-card and research-card surfaces.

Visible differences:
- Scrollbars remain intentionally subtle and may not be obvious in the concept-like skin.
- The current automated check covers the construction dock; other panel cursor positions should be expanded into tests if the issue reappears.

Future actions:
- Add a targeted wheel test for the region panel if further manual testing finds a cursor-position dead zone there.
- Keep pointer-event changes scoped to HUD panels so the central map remains interactive outside the UI.

Priority: Medium.

## 10. Iteration 41 targeted component audit

Current evidence:
- Contact sheet: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-component-contact-sheet.png`
- Concept-state global capture: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-concept-global-component-audit.png`
- BUILD rail crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-concept-left-rail.png`
- Real Recherche tab crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-real-research-tab-left-rail.png`
- Recherche tooltip: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-41-final-real-research-tooltip.png`

Updated current state:
- The left BUILD rail no longer lets the mini GRID OVERVIEW cover the lower construction categories. `Grid & Network` is visible in both the real game and concept-state capture.
- The `Grid & Network` row uses a non-actionable locked preview cell while the real locked `battery_storage` button remains absent at game start. This preserves the gameplay rule that locked buildings are not constructible before unlock.
- Category titles are clickable and carry rich tooltips. In desktop `All` view, the horizontal category tab strip is hidden to recover vertical space; selecting a title switches to the single-category view where the category tabs return.
- The Recherche tab now has a concept-compatible rail treatment even though it has no direct reference crop: active status, queue, compact preview cards, branch glyphs, and rich hover tooltips.
- Recherche preview cards are non-actionable until prerequisites are met; metrics report `trueResearchActions: 0` at initial start and `previewTooltips: 4`.
- Long Recherche labels are intentionally ellipsized inside cards and expanded through tooltips. Metrics confirm title boxes remain inside their card bounds.

Visible differences:
- The BUILD rail is more compact than the static concept because it keeps real controls for Construction/Recherche and locked filtering.
- The current mini GRID OVERVIEW raster is accepted and visible in the real game. Any remaining topology density should stay dynamic and is no longer an active background-asset priority.
- Recherche has no concept-art reference and therefore follows the BUILD rail material/spacing rather than trying to copy a nonexistent layout.
- The central map still shows real overlay controls, live routes and selected-slot affordances that are not present in the static art.

Future actions:
- If BUILD rail exactness becomes the next priority, generate or draw a monochrome card glyph set so compact cards look less like UI thumbnails and more like the concept's abstract slot icons.
- If Recherche receives more content, add a dedicated wheel regression test for `.palette-body-research` from card surfaces, mirroring the construction scroll test.
- Do not revisit the mini GRID OVERVIEW background unless a regression appears. If gameplay/readability later requires mini-map work, tune dynamic node/flow styling only; keep raster variants map-only without prepainted links or hubs.
- Keep validating the real game first for empty start, locked construction and Recherche prerequisites before comparing against `scenario=concept`.

Priority: Medium for BUILD rail/card fidelity; mini overview background is accepted / regression guard only.

## 11. Iteration 43 panel texture scale correction

Current evidence:
- Contact sheet: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-contact-sheet.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-metrics.json`
- Top bar crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-topbar.png`
- BUILD rail crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-left-rail.png`
- Recherche crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-43-panel-texture-9patch-scale-research-left-rail.png`

Updated current state:
- `panel-chrome-texture-v1.png` is now used as an opaque panel material, not a soft-light/translucent layer.
- The bitmap is rendered with overscan and `border-image-slice: 92 fill`, so its thick painted border is compressed into a 7-10px CSS border instead of passing behind text and controls.
- The center texture remains visible in panel interiors while large corner hardware is kept near the outer edge.
- Metrics confirm `backgroundBlendMode: normal`, `borderImageSlice: 92 fill`, and component-specific overscan values on top bar, BUILD rail, region panel, alert dock and GRID OVERVIEW.

Visible differences:
- The texture is still a single source image adapted to many aspect ratios, not a hand-authored separate 9-patch for each panel shape.
- The original concept has bespoke corner hardware per module; the game now uses a consistent shared material frame.

Future actions:
- If exact panel chrome remains a priority, generate separate horizontal, vertical and corner assets instead of deriving all panels from one square source.
- Keep any future panel texture changes checked against text legibility crops, especially right-panel metrics and bottom alert cards.

Priority: Low to medium after iteration 72; panel texture is currently a regression-guard area unless readability regresses.

## 12. Iteration 44 mini GRID OVERVIEW map-only asset

Current evidence:
- Source ImageGen asset: `C:\Users\cleme\.codex\generated_images\019ee6ab-f27a-78b2-904c-b7a46fb678d8\ig_097243fff3a88f3f016a376415b5848191a75da5950798c453.png`
- Project asset: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\public\assets\generated\grid-overview-europe-map-only-v1.png`
- Real start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-44-real-start-mini-overview-card.png`
- Concept-state crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-44-concept-state-mini-overview-card.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-44-mini-overview-map-only-metrics.json`

Updated current state:
- The real game now consumes the no-connection map asset through `--grid-overview-map`.
- The previous unused `grid-overview-europe-neon-v2.png` draft contained static network lines and was removed from the project asset folder.
- Static mini overview thread/orbit paths are disabled; iteration 44 metrics show zero static thread/orbit paths in both real start and concept-state captures.
- Real start and concept-state crops both show the component present, bounded, and not vertically overflowing.

Visible differences:
- The concept mini overview has more painterly cyan clustering and stronger central glow.
- The current map is intentionally only geography/texture; topology exactness must be improved through dynamic SVG flow and DOM node styling.

Future actions:
- No active background-asset work. Tune `.mini-flow-data`, `.mini-flow-power`, `.mini-flow-congestion` and `.grid-overview-node` only if a future gameplay/readability need justifies touching the mini overview.
- Keep checking both empty start and concept-state so no static buildings, hubs or links appear before gameplay state creates them.

Priority: Accepted / regression guard only.

## 13. Iteration 45 dynamic mini GRID OVERVIEW styling

Current evidence:
- Real start crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-45-real-start-dynamic-mini-overview-card.png`
- Concept-state crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-45-concept-state-dynamic-mini-overview-card.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-45-dynamic-mini-overview-metrics.json`

Updated current state:
- The map-only bitmap remains unchanged.
- Dynamic data lines are more visible and selected nodes are rendered as luminous hubs instead of filled green dots.
- Real start and concept-state crops still show no mini overview overflow and no static background route/orbit paths.

Visible differences:
- The concept crop still has a more painterly central starburst and exact hand-composed network rhythm.
- The current network remains simulation-driven, so topology exactness will vary by game state.

Future actions:
- Tune the expand glyph and optional selected-node pulse if the mini overview remains the next priority.
- Do not solve remaining topology density by adding painted network lines to the raster.

Priority: Medium.

## 14. Iteration 46 mini GRID OVERVIEW expand glyph

Current evidence:
- Before crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-before-miniOverview.png`
- After crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-expand-glyph-mini-overview-card.png`
- Glyph crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-expand-glyph-crop.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-expand-glyph-metrics.json`

Updated current state:
- The mini overview expand control no longer renders literal `[]` text.
- The replacement uses a same-size CSS four-corner glyph, closer to the concept crop's expand mark.
- The initial desktop Playwright test now checks that the glyph text stays empty and the CSS icon background remains present.

Visible differences:
- The glyph is still procedural CSS rather than a painted bitmap or icon asset.
- The concept's icon has slightly more bespoke line noise and corner wear.

Future actions:
- Leave this component alone unless a later full-screen crop shows the glyph too bright or too noisy.
- Prioritize higher-impact components next: central map module art, BUILD-card glyph assets, or alert glyphs.

Priority: Low.

## 15. Iteration 47 bottom alert text fit

Current evidence:
- Before crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-46-before-alerts.png`
- First after crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-47-alert-text-fit-dock.png`
- Final after crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-47c-alert-text-fit-dock.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-47c-alert-text-fit-metrics.json`

Updated current state:
- Alert cards keep five visible alerts plus the collapse control in the bottom dock.
- Icon/action columns are slightly smaller, increasing main text width without changing card height.
- Alert titles can wrap to two lines, which avoids the previous early ellipsis on long region/problem titles.
- The alert Playwright scenario now checks main text width ratio, title horizontal overflow and card vertical overflow.

Visible differences:
- The concept alert copy is shorter and more rhythmically balanced than live generated gameplay copy.
- Icons are still CSS punctuation-style marks, not concept-grade glyph assets.

Future actions:
- Replace alert icons with a tiny generated or hand-drawn glyph set if the alert strip becomes the next visual priority.
- Consider shorter scenario alert titles only for concept-state captures if exact text rhythm matters more than live data fidelity.

Priority: Low to medium.

## 16. Iteration 48 bottom alert glyphs

Current evidence:
- Before crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-48-before-alert-glyphs-dock.png`
- After crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-48-alert-glyphs-dock.png`
- Global capture: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-48-alert-glyphs-global.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-48-alert-glyphs-metrics.json`

Updated current state:
- Warning, research, network, cooling and market alerts now have CSS line/shape glyphs instead of literal punctuation marks.
- Existing card sizing from iteration 47 is preserved: main text ratio is around 0.71 at the concept viewport and no card/panel overflow is reported.
- The stressed-alert Playwright scenario now checks that pseudo-glyph content does not contain `!`, `*` or `#`, and that pseudo glyph boxes exist.

Visible differences:
- CSS glyphs are cleaner and more mechanical than the concept's painted alert icons.
- Icon exactness is improved enough that the next likely higher-impact work is central map art or BUILD-card glyphs.

Future actions:
- If alert icon fidelity becomes important again, create a small bitmap/vector glyph set instead of pushing CSS shapes further.
- Keep checking alert text metrics after any icon-width change.

Priority: Low.

## 17. Iteration 49 BUILD card composition

Current evidence:
- Before construction crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49-before-build-construction-left-rail.png`
- Before research crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49-before-build-research-left-rail.png`
- Final construction crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49b-build-card-composition-left-rail.png`
- Global capture: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49b-build-card-composition-global.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-49b-build-card-composition-metrics.json`

Updated current state:
- Compact desktop construction cards keep their 4-column row rhythm, but their art is now centered exactly in the card.
- Thumbnails are smaller, toned down and placed over a technical pad/scan overlay so they read less like raw image tiles.
- Card and rail overflow remain zero.
- The responsive construction-card test now distinguishes desktop compact cards from tablet/mobile text cards and checks desktop overlay presence.

Visible differences:
- The cards still use the existing building atlas, not a true concept-style monochrome/abstract glyph atlas.
- Some locked or unavailable cards remain dim by gameplay state, which is intentional but differs from the static concept's hand-picked icon state.

Future actions:
- Generate a dedicated small BUILD-card glyph atlas if this rail remains a priority.
- Keep current card dimensions and tooltips; do not make the rail taller just to improve art fidelity.

Priority: Medium.

## 18. Iteration 50 central map selected-slot dimming

Current evidence:
- Built concept-state global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-50-concept-built-slot-dim-global.png`
- Built map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-50-concept-built-slot-dim-map.png`
- Empty real-game global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-50-real-empty-slot-dim-global.png`
- Empty real-game map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-50-real-empty-slot-dim-map.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-50-slot-dim-metrics.json`

Updated current state:
- Built/queued selected regions now use compact, low-alpha slot markers, so the slot grid no longer competes as strongly with painted modules and route lines.
- Empty selected regions still show a full planning grid for gameplay readability.
- This does not alter the building state invariant: no start buildings, construction cube while queued, final building sprite only after completion.

Visible differences:
- The concept art still does not show a gameplay slot grid at all.
- Future exactness may require showing slots only during active placement/hover, but this pass keeps the current gameplay affordance visible.

Future actions:
- If the grid still feels too game-like, make built-region slots appear only during explicit construction/placement interaction.
- Continue central map asset work with a more painted module atlas if high-impact map fidelity remains the priority.

Priority: Medium.

## 19. Iteration 51 central map module grounding

Current evidence:
- Built concept-state global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-51-map-module-grounding-built-global.png`
- Built map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-51-map-module-grounding-built-map.png`
- Empty real-game global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-51-map-module-grounding-empty-global.png`
- Construction real-game map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-51-map-module-grounding-construction-map.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-51-map-module-grounding-metrics.json`

Updated current state:
- Built modules now sit on a darker contact shadow with a subtle accent pad, connector struts and anchor dots, so the atlas sprites feel less pasted onto the terrain.
- Enhanced map sprites now add a low-alpha dark sprite shadow before the luminous sprite pass.
- The empty-start and construction-state invariants are preserved: no final building texture before a building completes.

Visible differences:
- This is still the current generated map-module atlas, not a hand-painted module cluster set matching the concept art.
- Dense live labels/routes can still make the central map busier than the static concept.

Future actions:
- If central-map asset fidelity remains the main priority, generate a dedicated painted in-map module atlas rather than further CSS/Phaser grounding tweaks.
- Keep testing empty start, construction cube and built-only final icon every time map module rendering changes.

Priority: High.

## 23. Iteration 57 Recherche compact readability

Current evidence:
- Before real-game Recherche rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57-before-real-research-rail.png`
- Before concept-state Recherche rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57-before-concept-research-rail.png`
- Final real-game Recherche rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57b-research-compact-real-research-rail.png`
- Final concept-state Recherche rail: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57b-research-compact-concept-research-rail.png`
- Tooltip/global check: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57b-research-compact-real-research-tooltip-global.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-57b-research-compact-metrics.json`

Updated current state:
- Recherche cards now use the same compact tactical-card language as BUILD: framed glyph tile, subdued dark material, scan-line highlight and brighter locked-state readability.
- Long research names wrap into two controlled uppercase lines instead of overflowing horizontally or becoming unreadable one-line ellipses.
- Branch glyphs now have CSS pseudo-detail for energy, grid/infrastructure, cooling and generic research branches.
- The default real-game Recherche tab keeps the mini GRID OVERVIEW visible without panel overflow.
- The visual test now verifies readable cards and wheel scrolling from research-card surfaces when unavailable research is expanded.

Visible differences:
- Recherche still has no direct concept-art reference, so exact static matching is not possible.
- The glyphs remain procedural CSS, not a generated painted glyph atlas.
- The real start state shows mostly locked research because the required research centers are not built yet; this is intentional gameplay state.

Future actions:
- If Recherche becomes a visual priority again, generate a small research-branch glyph atlas and swap it under the same card structure.
- Keep the two-line title clamp and card-surface wheel regression when adding more research tiers.

Priority: Low to medium.

## 22. Iteration 56 right region functional tabs

Current evidence:
- Before concept-state panel: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56-before-region-tabs-concept-panel.png`
- Before real-game panel: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56-before-region-tabs-real-panel.png`
- Final Overview crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56c-region-tabs-overview-panel.png`
- Final Buildings crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56c-region-tabs-buildings-panel.png`
- Final Stats crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56c-region-tabs-stats-panel.png`
- Tooltip/global check: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56c-region-tabs-tooltip-global.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-56c-region-tabs-metrics.json`

Updated current state:
- Right-panel tabs are now functional gameplay views instead of static labels.
- Overview preserves the concept-like default stack: region tags, slots, Energy/Cooling/Compute status and Manage Region.
- Buildings isolates built slots, free/locked slots, construction queue and demolition queue.
- Stats adds six compact live stat tiles while keeping the status bars readable.
- Tab clicks no longer leave a rich tooltip overlay stuck over the new panel content; hover still reveals the rich tab tooltip after the short suppression window.

Visible differences:
- Buildings and Stats are functional extensions without direct concept-art reference.
- Values and slot contents remain live state, not copied from the Netherlands concept image.

Future actions:
- Use targeted right-panel crops after any future slot-art, stat-tile or status-glyph change.
- If exact right-panel art becomes important, generate a small monochrome status/slot glyph atlas rather than adding more CSS pictogram complexity.

Priority: Low to medium.

## 20. Iteration 52 AGI ticks-only correction

Current evidence:
- Global capture: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-52-agi-ticks-global.png`
- Top bar crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-52-agi-ticks-topbar.png`
- AGI duel crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-52-agi-ticks-duel.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-52-agi-ticks-metrics.json`

Updated current state:
- `.agi-ring` now has `background-image: none` and `box-shadow: none`, so it cannot render a continuous circular progress track.
- The EU ring still has 48 DOM ticks, with 32 active ticks in the concept-state capture at 67%.
- The rich tooltip now describes the progress marks as ticks.
- The initial desktop Playwright visual test checks that the AGI ring background remains `none`.

Visible differences:
- Tick spacing, length and center typography remain CSS-rendered approximations, not exact painted concept micro-detail.
- The concept-state values remain live scenario values and not necessarily the exact concept image values.

Future actions:
- Do not add a conic/radial continuous progress track back to `.agi-ring`.
- If top-bar exactness comes back as a priority, tune only tick geometry/noise and panel separators.

Priority: Medium.

## 21. Iteration 53 painted map-module atlas v3

Current evidence:
- ImageGen source: `C:\Users\cleme\.codex\generated_images\019ee6ab-f27a-78b2-904c-b7a46fb678d8\ig_096e597f0995260f016a377752165c81919ef67819926f7b7b.png`
- Project atlas: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\public\assets\generated\building-map-atlas-v3.png`
- Built concept-state global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-53c-map-atlas-v3-built-global.png`
- Built map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-53c-map-atlas-v3-built-map.png`
- Empty real-game global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-53c-map-atlas-v3-empty-global.png`
- Construction real-game map crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-53c-map-atlas-v3-construction-map.png`
- Metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-53c-map-atlas-v3-metrics.json`

Updated current state at iteration 53:
- The active Phaser map texture pointed at `building-map-atlas-v3.png` at iteration 53. This is now superseded by iteration 63 / `building-map-atlas-v4.png`.
- The atlas keeps the 1254x1254 RGBA / 4x4 cell format used by the existing crop code.
- The v3 source was generated on magenta chroma-key and cleaned locally to alpha; validation shows transparent corners and preserved dimensions.
- The mapped building cells are darker, more terrain-footed and less cyan-outlined than v2.
- Metrics confirm no onboarding overlay in the evidence captures, `buildingTextureCount: 0` for empty start, `buildingTextureCount: 0` during construction, and final building textures only in the built state.

Visible differences:
- The atlas is still generated art, not an exact paint-over of the concept modules.
- Cells 14-16 include warning/CO2/locked symbols and should not be mapped to real buildings unless they are reworked; current `moduleIconIndex()` uses cells 0-11 for built structures.
- Some sprites are intentionally darker to blend into the map and may need a small brightness pass if later screenshots show poor readability.

Future actions:
- Historical note only: v3 is no longer the active map atlas.
- If further fidelity is needed after v4, generate a more aggressive tiny-map-marker atlas only for actual building categories instead of a decorative 16-cell sheet.

Priority: High.

## Latest current state - Iterations 65-71 central map, alerts and heatmap

Current evidence:
- Iteration 65 node/route concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-65-node-route-scale-concept-state-crop.png`
- Iteration 68 primary sprite grounding concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-68-primary-sprite-grounding-concept-state-crop.png`
- Iteration 69 compact heatmap concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-69-compact-heatmap-concept-state-global.png`
- Iteration 69 heatmap tooltip global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-69-compact-heatmap-tooltip-global.png`
- Iteration 70 route curation concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-70-route-geography-curation-concept-state-global.png`
- Iteration 70 route curation concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-70-route-geography-curation-concept-state-crop.png`
- Iteration 71 alert accents concept global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-71-alert-route-accents-concept-state-global.png`
- Iteration 71 alert accents concept crop: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-71-alert-route-accents-concept-state-crop.png`
- Iteration 69 real-start global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-69-compact-heatmap-real-start-global.png`
- Iteration 70 real-start global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-70-route-geography-curation-real-start-global.png`
- Iteration 71 real-start global: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-71-alert-route-accents-real-start-global.png`
- Iteration 71 metrics: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-71-alert-route-accents-metrics.json`

Updated current state:
- Central map nodes are smaller and less dominant; non-selected regions now read as faint tactical nodes rather than large filled discs.
- Strategic route rendering is thinner, lower-alpha, less pulse-heavy and now geographically curated while remaining simulation-driven.
- Concept-state strategic route selection currently draws 10 flows: 8 attached to Benelux and 2 local Nordic links, instead of the previous 12-route set with three long orange congestion routes.
- Orange alert accents are now data-driven: concept-state reports 4 regional alert accents and 1 flow-backed short warning segment; real-start reports 0 alert accents.
- Selected-region building rendering now uses a primary/satellite hierarchy with a cap of four selected structures and two per other region in strategic mode.
- The selected primary structure prefers visually readable datacenter/research/major infrastructure; successful atlas sprites no longer receive an extra procedural iso base.
- The heatmap switch is compact in desktop/concept captures: three-character codes, 294x40 measured size, six rich hover tooltips.
- Real game start remains correct: no map building texture is rendered before construction/build completion.

Visible differences:
- Building sprites are still generated isometric assets, not exact painted map-integrated concept modules.
- The central route topology remains simulation-derived and does not exactly match the concept art's hand-painted routes.
- The alert accent layer avoids misleading long orange strokes; it is still less painted/editorial than the concept's handcrafted warning paths.
- The compact heatmap switch is still a necessary gameplay control that does not appear in the static concept.

Future actions:
- Next central-map improvement should be either a more concept-specific tiny marker atlas or a richer alert-cause-to-nearby-flow mapping; more generic scale tuning is now lower return.
- Preserve the current state rules for map structures: no start sprites, grey cube during construction, final atlas sprite only after completion.
- Keep the compact heatmap guard when changing labels or tooltips.

Validation:
- Passed `pnpm lint`.
- Passed targeted Playwright: `pnpm exec playwright test tests/visual/egrid.visual.spec.ts --grep "initial desktop|map structures reflect|concept central map"`.
- Passed `pnpm build`; only the existing Vite chunk-size warning remains.

Priority: High.
