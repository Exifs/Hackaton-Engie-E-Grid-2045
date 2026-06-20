# Component diagnostics - E-Grid 2045 v2.0 convergence

Current audit screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-19-map-route-hierarchy.png`

Reference: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\reference-v2-0.png`

## 1. Global frame and composition

Current state:
- Major frame positions are stable: top bar, left build rail, right region panel, bottom alerts and central map all fill their intended zones.
- DOM measurements show no overflow or collisions between major HUD panels.
- Concept-only panel chrome now adds bevels, corner highlights, scan texture and stronger inner shadows.

Visible differences:
- The concept still has heavier custom mechanical brackets and more layered corner hardware.
- Current frame is CSS-generated, so it lacks the exact painted panel cuts and bolts.

Future actions:
- Add small corner bolts/brackets to top, left, right and bottom panels if chrome remains a priority.
- Keep current panel bounds; do not change composition unless a later screenshot shows clipping.

Priority: Medium.

## 2. Top bar

Current state:
- Brand, AGI duel rings, budget, date and speed controls are now structurally close to the concept.
- `E-GRID 2045` is a real DOM brand panel with large title type and a rich tooltip.
- AGI rings are now rendered as individual segmented ticks only, without a continuous progress circle underneath.
- Simulation speed is a dedicated concept-like module with pause/play/fast buttons and a `1.0x` readout.
- A separate hamburger command block now occupies the far-right top-bar slot.
- Tooltips are available on brand/AGI/budget/date.

Visible differences:
- The deterministic game state highlights pause, while the static concept highlights play.
- The hamburger currently triggers the existing onboarding/replay command rather than a full command menu.
- AGI rings still lack the exact painted micro-detailing and value state of the concept.

Future actions:
- Add a real command menu behind the hamburger only if that becomes a functional requirement.
- Add finer ring noise/micro-ticks only if top bar exactness remains a priority after map work.

Priority: Medium.

## 3. Central map

Current state:
- The map fills the central region and uses network lines, labels, region halos, selected slots and atlas-backed building markers.
- ImageGen-generated atlas assets now make modules more concrete than vector-only markers.
- Concept mode limits visible module markers to the most important regions, reducing clutter versus the previous pass.
- Concept mode now brightens module sprites with a small additive glow and slightly larger display size.
- Concept mode now filters secondary route lines and draws active flows as curved highlighted routes with pulse points.

Visible differences:
- Current map is still darker than the concept.
- Concept modules are still more integrated into the painted terrain and less icon-like.
- The map backdrop relief, labels and generated route topology do not match the exact concept map.

Future actions:
- Generate a dedicated tiny in-map module atlas if the existing icon atlas remains too detailed or too icon-like.
- Tune label density and terrain integration so country/sea text reads closer to the concept.
- Add subtle sea labels only if they do not reduce gameplay clarity.

Priority: High, but asset-heavy.

## 4. Left build rail

Current state:
- Rail is contained and no longer clipped.
- It lists construction groups and a real GRID OVERVIEW module.
- Concept mode now has a fixed `BUILD` header, category rows, large utility icon tiles, compact cards, and category order matching the concept.

Visible differences:
- Category glyphs use current project utility PNGs, not the exact concept-painted white symbols.
- Locked/research-gated cells still use current game disabled card treatment.

Future actions:
- If rail fidelity remains a priority, create a tighter monochrome utility icon set or tune the existing symbols.
- Keep the existing construction functionality and rich tooltips.

Priority: Medium.

## 5. Right region panel

Current state:
- Region level, tabs, building slots, locked slots, Energy/Cooling/Compute status and Manage Region are now close to the concept.

Visible differences:
- Values are live Benelux values rather than the exact Netherlands concept values.
- Slot art uses current game atlas tiles, not the exact concept building art.
- Tabs are visual state only, not separate subviews yet.

Future actions:
- Add tab behavior only if the user needs functional panel subviews.
- Consider a concept-state override for selected region name/values only if exact screenshot mimicry becomes more important than game-state fidelity.

Priority: Low to medium.

## 6. Bottom alert strip

Current state:
- Five alerts fit without overflow and match concept placement more closely.
- Alert cards now include a left icon, compact title/body, a right action button, and a final collapse control.

Visible differences:
- Alert icons are CSS/text symbols rather than exact concept glyph assets.
- Text is real gameplay copy and can be longer than concept copy.

Future actions:
- Replace alert symbols with proper small utility assets if this component remains a priority.
- Tune alert copy lengths or scenario data if exact concept text rhythm becomes necessary.

Priority: Low to medium.

## 7. Mini GRID OVERVIEW

Current state:
- It is a real data-driven component with nodes, flows, legend and a simplified Europe silhouette.
- Its concept layout now matches the reference more closely: legend left, map inset right.

Visible differences:
- The geography remains simplified SVG blobs rather than the concept's painted glowing Europe inset.
- The inset is still darker and less detailed than the reference.

Future actions:
- Generate a small static raster inset or refine the SVG coastline if this component remains a priority.
- Keep legend and data-driven flow dots.

Priority: Medium.

## 8. Rich tooltips

Current state:
- Rich tooltips exist for build cards, built assets, alerts, top KPIs and GRID OVERVIEW.

Visible differences:
- Tooltips are gameplay additions and absent from static concept.

Future actions:
- Add tooltips to right-panel status blocks and category headers if controls become more icon-only.
- Ensure pointer-events remain enabled for non-button tooltip triggers.

Priority: Low.
