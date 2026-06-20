# E-Grid 2045 Visual Feedback Log

Reference: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review\reference-v2-2.png`

## Iteration 00 - Baseline

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review\iteration-00-baseline.png`

What is closer to the concept art:
- The base Europe map already has the right dark satellite-map material and cyan overlays.
- The right-side region inspector and construction controls exist as functional UI surfaces.

What still differs visibly:
- Composition is dominated by a bottom construction tray instead of the concept's left build rail.
- Top HUD is separate metric cards rather than a continuous sci-fi command header.
- Map network is sparse and node-based; concept has dense cyan, purple, and orange lines plus module markers.
- Bottom alert/status area is not concept-like.

What was changed in code:
- No changes yet.

What should be tried next:
- Reframe the desktop HUD: left build rail, right region panel, continuous top bar, bottom alert strip.

Regressions introduced:
- None.

## Iteration 01 - Layout Reframe

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review\iteration-01-layout.png`

What is closer to the concept art:
- Desktop composition now has a left build rail, right inspector, top command bar, bottom status strip, and central map window.
- Overall framing and proportions read much closer to the reference at a glance.

What still differs visibly:
- Map remains mostly flat, with large circular nodes and too little route density.
- Region labels are sparse, and there are no 3D module/building silhouettes on the map.
- Bottom alert strip looks mostly empty.

What was changed in code:
- Added wide-screen CSS overrides for HUD frame, top bar, left palette rail, right panel, and bottom alerts.

What should be tried next:
- Add a denser network overlay and deterministic map module markers using existing game data.

Regressions introduced:
- Left build rail content is tighter and can clip labels at the lower edge, but remains scrollable.

## Iteration 02 - Map Density

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review\iteration-02-map-density.png`

What is closer to the concept art:
- The map now has dense graph connections, cyan/purple/orange accents, smaller network nodes, persistent region labels, and module silhouettes.
- The center map reads more like a strategic network view rather than plain heatmap markers.

What still differs visibly:
- The mood is still too clean and low-contrast compared with the reference's heavier glow, vignette, and dark metal UI.
- The selected region is France Nord, while the concept focuses on Netherlands/Benelux.
- Right panel content is sparse compared with the concept's module cards and status blocks.
- Bottom alert strip needs stronger warning/status cards.

What was changed in code:
- Exposed a read-only network graph from the simulation.
- Added a Phaser structure layer with decorative graph edges, route nodes, labels, and deterministic module markers.

What should be tried next:
- Increase atmosphere, contrast, selected-region glow, bottom alert visual weight, and capture a Benelux-focused deterministic state.

Regressions introduced:
- Some labels are French and dense around central Europe; acceptable for now because the visual density is closer.

## Iteration 03 - Atmosphere and Benelux Framing

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review\iteration-03-atmosphere-benelux.png`

What is closer to the concept art:
- Darker vignette, scanline texture, and stronger HUD atmosphere make the render less flat.
- The reviewed state focuses Benelux, which is closer to the reference's Netherlands focus.
- Bottom strip now has four status cards when there are no active warnings.

What still differs visibly:
- The scene is still an empty 2025 state, so the region panel lacks modules and the warning/status bar is less dramatic than the concept.
- Top values do not match the late-game concept timeframe.
- Right panel remains sparse when no region buildings exist.

What was changed in code:
- Added a `region` URL parameter for deterministic review framing.
- Added stable status cards to the alert strip.
- Added wide-screen atmosphere overlays and subtle right-panel texture.

What should be tried next:
- Create a deterministic mature review state using normal game actions so the same renderer can be compared against the concept's populated 2045 screen.

Regressions introduced:
- None significant.

## Iteration 04 - Populated Concept State

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review\iteration-04-concept-state.png`

What is closer to the concept art:
- Header values, date, AGI progress, selected Benelux region, active modules, and warning cards now read like a late-game command view.
- Dense bright power flows radiate from Benelux similarly to the concept's highlighted selected region.
- Right panel contains active module cards instead of empty placeholders.

What still differs visibly:
- Left rail card labels overlap in the compact desktop rail.
- The right panel uses gameplay built-card rows instead of the concept's square module grid.
- The base map is still top-down satellite art rather than the concept's stronger isometric relief.

What was changed in code:
- Added `scenario=concept`, a deterministic review scenario that uses existing build and month-advance APIs, then sets concept-timeframe display values.

What should be tried next:
- Polish the left rail into icon-first controls to eliminate cramped text and better match the reference.

Regressions introduced:
- Left-rail text overlap from forcing card-style controls into icon-sized cells.

## Iteration 05 - Final Polish

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review\iteration-05-polish.png`

What is closer to the concept art:
- Left rail now behaves like the concept's icon-first build controls, with no overlapping labels.
- Final render keeps the mature concept state, dense network, selected Benelux focus, populated side panel, and warning strip.

What still differs visibly:
- The right inspector is still a functional gameplay list rather than the concept's exact module-card grid.
- Country and region labels are French/localized in places rather than matching the English concept.
- The map remains a dark top-down map with added module silhouettes, not a fully isometric hand-painted relief.

What was changed in code:
- Hid compact build-card text in the desktop left rail and kept the icon grid.

What should be tried next:
- Stop here unless exact module-grid parity is required; further gains would require broader UI markup changes or new map artwork.

Regressions introduced:
- Build-card names are hidden in the desktop rail, but category headings and tooltips/context still preserve the construction workflow.

## Iteration 06 - Delivered Final

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review\iteration-06-final.png`

What is closer to the concept art:
- Keeps the mature 2045 concept state with Benelux selected, high-density network flows, active warnings, populated right panel, and icon-first build rail.
- Final code also waits for the Phaser scene to finish creation before exposing the canvas as visible, making captures more deterministic.

What still differs visibly:
- The exact right-panel module grid and English copy from the concept are not reproduced.
- The map is still based on the existing top-down Europe artwork rather than a new isometric map asset.

What was changed in code:
- Restored the build-grid flex contract for existing visual tests while preserving the icon rail.
- Added a scene-ready data attribute so screenshots do not capture a blank canvas during preload.

What should be tried next:
- Treat this as the stopping point for the current task; further changes would be larger art/markup work rather than incremental convergence.

Regressions introduced:
- None observed in the final focused visual test run.
