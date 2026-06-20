# E-Grid 2045 v2-0 Visual Feedback Log

Reference: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0\reference-v2-0.png`

## Iteration 00 - Current State

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0\iteration-00-current.png`

What is closer to the concept art:
- The app already has the main concept structure: top command bar, left build rail, central Europe map, right region panel, and bottom alert area.
- The mature `scenario=concept` state gives a dense network and populated Benelux panel.

What still differs visibly:
- The bottom alert panel is too tall (`220px`) and starts around `y=713`, forcing the map to be vertically compressed.
- The bottom strip only occupies the central area, leaving the lower screen under the side panels visually empty.
- The map is using contain-style fit, leaving unused vertical space.
- Left build cards and right active buildings are too list-like compared with the icon grids in the concept.

What was changed:
- No changes in this iteration.

What should be tried next:
- Fix bottom strip geometry first; it is the main cause of panel/map misfit.

Regressions introduced:
- None.

## Iteration 01 - Bottom Strip Geometry

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0\iteration-01-alert-strip.png`

What is closer to the concept art:
- Bottom strip now spans the full viewport width and sits at the correct height (`y=849`, `84px` tall).
- Left and right panels align cleanly above it, ending at `y=837`.
- Five warning/status cards fit in a single row like the reference.

What still differs visibly:
- The map still does not fill the vertical space because it is fitted inside the central safe rectangle.

What was changed:
- Desktop `.alerts-panel` set to a fixed 84px height, full-width positioning, five columns, and hidden overflow.

What should be tried next:
- Change desktop map framing from contain to cover.

Regressions introduced:
- None observed.

## Iteration 02 - Map Cover Framing

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0\iteration-02-map-cover.png`

What is closer to the concept art:
- The map now fills the available vertical space between header, side panels, and alert strip.
- The result reads closer to the reference's cropped strategic map instead of a centered image with empty bands.

What still differs visibly:
- The left and right panels still use list-like cards rather than compact module/icon grids.

What was changed:
- Desktop `EGridMapScene.targetMapRect()` now uses cover scaling for large desktop frames.

What should be tried next:
- Compact the left build palette and right region modules.

Regressions introduced:
- Map is intentionally cropped more on desktop, matching the concept better.

## Iteration 03 - Panel Grids

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0\iteration-03-panel-grids.png`

What is closer to the concept art:
- Left build palette now uses compact icon cells instead of wide text cards.
- Right active buildings now render as a two-column module grid, filling the panel more like the concept.
- Empty construction/demolition sections are hidden on desktop.

What still differs visibly:
- The overlay selector still floats over the top of the map, which is not present in the concept art.

What was changed:
- Added higher-specificity desktop CSS overrides for `.palette-body-construction .build-card`.
- Added desktop right-panel grid styling for active buildings.

What should be tried next:
- Hide the floating overlay switch in the concept review state without changing normal gameplay.

Regressions introduced:
- Build names are hidden in the compact desktop rail, but the icon-first layout is closer to the target.

## Iteration 04 - Concept Overlay Cleanup

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0\iteration-04-hide-overlay-switch.png`

What is closer to the concept art:
- Floating heatmap/overlay buttons are hidden in `scenario=concept`, removing a non-reference UI element over the map.
- Header, side panels, map, and alert strip now occupy the same broad screen bands as the reference.

What still differs visibly:
- The top bar lacks the exact circular AGI progress widgets and the right panel is still a simplified gameplay panel, not a pixel-identical concept panel.
- The map uses existing top-down art with added module/network overlays rather than the exact concept relief and assets.

What was changed:
- Added `data-concept-scenario` on the document.
- Hid `.heatmap-switch` only when `scenario=concept`.

What should be tried next:
- Stop here for this pass unless exact top-bar widgets or new map art are required; the reported overlap and fill issues are resolved.

Regressions introduced:
- None observed in the concept review state; normal gameplay still shows the overlay switch.

## Iteration 05 - Left Panel Crop Fix

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0\iteration-05-no-left-crop.png`

What is closer to the concept art:
- The left build rail no longer shows a partially clipped `COMPUTE` item at the bottom.
- Concept review mode now shows the build groups directly rather than spending vertical space on filter tabs.
- Asset cells are slightly larger while the cells themselves remain compact.

What still differs visibly:
- The bottom alert cards still had minor vertical text overflow in measurement.

What was changed:
- Hid category filter tabs only in `scenario=concept`.
- Reduced compact build cell height and enlarged the icon area slightly.

What should be tried next:
- Clamp alert text cleanly and fill the remaining left-panel blank with a grid overview area rather than leaving an incomplete-looking void.

Regressions introduced:
- None observed in the review state; default gameplay still has the category tabs.

## Iteration 06 - Readability and Incomplete Zones

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0\iteration-06-readable-assets.png`

What is closer to the concept art:
- No visible cropped controls remain in the left rail.
- Alert cards no longer overflow vertically; measured `scrollHeight` equals `clientHeight` for every alert card.
- The lower-left area is filled with a grid-overview style block instead of looking unfinished.

What still differs visibly:
- Some alert titles are ellipsized because five cards share the bottom strip, while the concept uses more tailored copy lengths.
- The mini grid overview is a simplified visual component, not the final data-rich version from the concept.

What was changed:
- Added alert title/body overflow handling with ellipsis and two-line body clamp.
- Added a concept-review grid overview block in the unused lower-left panel area.

What should be tried next:
- Keep future work component-driven: if more parity is needed, implement real top-bar AGI rings and a real grid-overview component rather than further screenshot-only styling.

Regressions introduced:
- None observed in visual inspection.

## Iteration 07 - Rich Hover Tooltip

Screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0\iteration-07-rich-tooltip.png`

What is closer to the concept art:
- Icon-first controls remain minimal, but hover now exposes rich contextual detail in a dark glass tooltip matching the HUD style.
- Tooltip is rendered at HUD root level, so it is not clipped by panel overflow.

What still differs visibly:
- The tooltip is an intentional in-game affordance and is not present in the static concept art.

What was changed:
- Added reusable rich tooltip attributes for build cards, built modules, and alert cards.
- Added a single positioned tooltip renderer in `GameHud`.
- Added matching tooltip styling in CSS.

What should be tried next:
- Extend the same tooltip system to research cards and top-bar stats if those controls are made more icon-only.

Regressions introduced:
- None observed in hover capture.
