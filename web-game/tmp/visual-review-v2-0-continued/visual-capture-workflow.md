# Visual capture workflow - E-Grid 2045

Use this workflow for the iterative visual-convergence loop. It is the method that produced the usable iteration 72-78 captures.

## Primary capture path

1. Make sure a local web-game server is running. The current stable audit server has usually been `http://127.0.0.1:4175`.
2. From `C:\Users\cleme\Documents\Hackaton Energie 2026\web-game`, run the audit script with an explicit prefix:

```powershell
$env:EGRID_AUDIT_BASE_URL='http://127.0.0.1:4175'
$env:EGRID_AUDIT_PREFIX='iteration-XX-short-name'
pnpm exec node tmp/visual-review-v2-0-continued/iteration-72-audit-capture.mjs
```

3. The script writes all artifacts to `tmp/visual-review-v2-0-continued`.

## What the audit script captures

- `concept-state`: deterministic concept scenario, plus global screenshot, canvas crop, top bar crop, left rail crop, right panel crop, alerts crop, mini GRID OVERVIEW crop, tooltip screenshot and metrics JSON.
- `real-start`: actual new-game start state, with the same main crops and metrics. This is the authoritative guard that no building sprites appear at game start.
- `construction`: real-game state after queuing one building. This is the authoritative guard that construction shows a grey placeholder and `buildingTextureCount` remains `0`.
- `research`: Recherche tab state and rail crop, with readability and overflow metrics.

The viewport is fixed at `1600x900`, which is close enough to the concept aspect ratio for current comparisons. Keep using this unless deliberately changing the audit baseline.

## How to inspect captures

Preferred path:
- Use the generated PNGs directly from `tmp/visual-review-v2-0-continued`.
- Inspect the global image first, then targeted crops component by component.
- Compare against `reference-v2-0.png` and relevant component reference crops.

If `view_image` works:
- Open the absolute PNG paths for `reference-v2-0.png`, the latest `*-concept-state-global.png`, the latest `*-concept-state-canvas.png`, and the targeted component crops.

If `view_image` or the in-app browser is blocked by sandbox ACL errors:
- Do not assume the screenshot capture failed. Check that the PNG and JSON files exist.
- Use the metrics JSON from the audit script for state invariants and panel overflow.
- Use a small Python/Pillow pixel comparison only as secondary evidence for brightness, cyan/orange density, and localized change. Pixel metrics are not a replacement for visual judgment once image inspection works again.

## Current known-good command

```powershell
$env:EGRID_AUDIT_BASE_URL='http://127.0.0.1:4175'
$env:EGRID_AUDIT_PREFIX='iteration-78-central-map-light-routes'
pnpm exec node tmp/visual-review-v2-0-continued/iteration-72-audit-capture.mjs
```

For a new pass, keep the same script and change only `EGRID_AUDIT_PREFIX` to the new iteration name. Do not rename the capture script until there is a functional reason; the file name is historical, but it currently captures the real game states needed for regression checks.

## Required follow-up after each capture

- Update `visual-feedback.md` with screenshot paths, what moved closer, remaining visible differences, code changes, next action and regressions.
- Update `component-diagnostics.md` current screenshot/crop pointers and the component-by-component priority snapshot.
- Run focused Playwright checks that cover the touched component and preserve gameplay invariants.
- Run `pnpm lint`; run `pnpm build` after source changes.
