# Component diagnostics - E-Grid 2045 v2.0 convergence

Current audit screenshot: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\iteration-26b-concept-state-balanced-map-modules.png`

Reference: `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game\tmp\visual-review-v2-0-continued\reference-v2-0.png`

## 1. Global frame and composition

Current state:
- Major frame positions are stable: top bar, left build rail, right region panel, bottom alerts and central map all fill their intended zones.
- DOM measurements show no overflow or collisions between major HUD panels.
- Desktop panel chrome now adds bevels, corner highlights, scan texture and stronger inner shadows in the real game and the concept-state capture.
- The real desktop game now uses the same primary component styling as the concept-state capture; `scenario=concept` is no longer a separate HUD variant.

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
- Simulation speed is a dedicated concept-like module with pause/play/fast buttons and a `1.0x` readout in the real game, not only in the concept scenario.
- A separate hamburger command block now occupies the far-right top-bar slot in both real and concept-state views.
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
- Desktop rendering limits visible module markers to the most important regions, reducing clutter versus the previous pass.
- Desktop rendering now brightens module sprites with a small additive glow and slightly larger display size.
- Desktop rendering now filters secondary route lines and draws active flows as curved highlighted routes with pulse points.
- Desktop rendering now renders country and sea labels, while suppressing most low-value internal gameplay region labels.
- Desktop real game now uses the same curved route hierarchy, geographic label layer, enhanced sprite glow/size and strategic structure cap.
- Built structures now draw a terrain integration layer: contact shadow, subtle accent pad, connector to the regional node and small anchor points before the final sprite.
- Map structures now reflect gameplay state: absent at empty start, grey cube during construction, real building icon only once built.
- Structure placement is deterministic and type-aware, with offshore/sea assets pushed toward water and land assets kept near regional anchors.
- A global visible-structure cap prevents overloading the map.
- Superseded capture note: do not use `iteration-21-construction-map-building-visible.png` as current evidence, because it predates the grey construction cube fix.

Visible differences:
- Current map is still darker than the concept.
- Concept modules are still more hand-painted and less icon-like than the generated atlas sprites.
- The map backdrop relief and generated route topology do not match the exact concept map.
- Label positions are approximate; in the concept-state capture, live region/problem labels can still add visual density beyond the static art.
- Selected-region slot markers can visually crowd nearby built structures in gameplay views.

Future actions:
- Generate a dedicated tiny in-map module atlas if the existing icon atlas remains too detailed or too icon-like, preserving the empty-start, grey-construction, built-only-final-icon state rule.
- Tune terrain integration and module sprites so country/sea text sits on a more concept-like painted base.
- Consider reducing selected slot marker prominence near built modules if it continues to compete with infrastructure readability.

Priority: High, but asset-heavy.

## 4. Left build rail

Current state:
- Rail is contained and no longer clipped.
- It lists construction groups and a real GRID OVERVIEW module.
- Desktop build rail now has category rows, large utility icon tiles, compact cards, and category order closer to the concept.
- The mini GRID OVERVIEW and compact category-card treatment are now present in the real game too.
- The desktop header is compact: BUILD/collapse, construction/research tabs and the lock filter fit into about 100px.
- Real-game category tabs remain visible for functionality as a one-row horizontal strip, avoiding the previous cut Research section above the mini overview.
- The default real-game BUILD body now fits the visible card groups and mini GRID OVERVIEW without vertical clipping.

Visible differences:
- Category glyphs use current project utility PNGs, not the exact concept-painted white symbols.
- Locked/research-gated cells still use current game disabled card treatment.
- The real rail is denser than the concept because it keeps construction/research tabs, locked filtering and category tabs available.
- Category access uses a horizontal tab strip, which is a real-game affordance absent from the static concept.

Future actions:
- If rail fidelity remains a priority, create a tighter monochrome utility icon set or tune the existing symbols.
- Keep the existing construction functionality and rich tooltips.
- Consider icon-only category tabs with rich tooltips if the horizontal strip still feels too game-like, but do not hide real gameplay controls only to match the static concept.

Priority: Medium.

## 5. Right region panel

Current state:
- Region level, tabs, building slots, locked slots, Energy/Cooling/Compute status and Manage Region are now close to the concept.
- Energy, Cooling and Compute status headings now have compact pictograms aligned with the concept's icon-led status rows.
- Status blocks now expose rich hover tooltips with their metric breakdowns.

Visible differences:
- Values are live Benelux values rather than the exact Netherlands concept values.
- Slot art uses current game atlas tiles, not the exact concept building art.
- Tabs are visual state only, not separate subviews yet.
- Status pictograms are CSS-built approximations, not exact painted concept glyph assets.

Future actions:
- Add tab behavior only if the user needs functional panel subviews.
- Consider a concept-state override for selected region name/values only if exact screenshot mimicry becomes more important than game-state fidelity.
- Replace CSS pictograms with a tiny monochrome glyph atlas only if right-panel icon fidelity becomes more important than the central map and mini overview.

Priority: Low to medium.

## 6. Bottom alert strip

Current state:
- Five alerts fit without overflow and match concept placement more closely.
- Alert cards now include a left icon, compact title/body, a right action button, and a final collapse control.
- The enriched alert strip is now used by the real desktop game, not only `scenario=concept`.

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
- It is visible in the real desktop game and in the concept-state capture.
- The inset now uses a denser glowing Europe silhouette, coastline hints, scan/vignette overlays and curved flow paths.

Visible differences:
- The geography remains simplified SVG blobs rather than the concept's painted glowing Europe inset.
- The inset is still darker and less detailed than the reference.

Future actions:
- Generate a small static raster inset or refine the SVG coastline if this component remains a priority.
- Keep legend and data-driven flow dots.
- Verify future mini-map changes in the real game first, then in `scenario=concept` second.

Priority: Medium.

## 8. Rich tooltips

Current state:
- Rich tooltips exist for build cards, built assets, alerts, top KPIs, GRID OVERVIEW and right-panel status blocks.

Visible differences:
- Tooltips are gameplay additions and absent from static concept.

Future actions:
- Add tooltips to category headers if controls become more icon-only.
- Ensure pointer-events remain enabled for non-button tooltip triggers.

Priority: Low.
