import {
  applyMapViewport,
  clampMapZoom,
  computeBaseMapRect,
  computeSafeViewportRect,
  panMapViewport,
  zoomMapViewportAtPoint,
  type MapRect,
  type MapViewportTransform
} from "../../src/game/mapViewport";

describe("map viewport helpers", () => {
  const safe: MapRect = { x: 0, y: 0, width: 1000, height: 800 };
  const base: MapRect = { x: 100, y: 100, width: 800, height: 600 };
  const initial: MapViewportTransform = { zoom: 1, panX: 0, panY: 0 };

  it("keeps the base map rect unchanged without user interaction", () => {
    expect(applyMapViewport(base, safe, initial)).toEqual(base);
  });

  it("clamps zoom between 80% and 200%", () => {
    expect(clampMapZoom(0.2)).toBe(0.8);
    expect(clampMapZoom(1.4)).toBe(1.4);
    expect(clampMapZoom(3)).toBe(2);
  });

  it("zooms around the pointer anchor", () => {
    const anchor = { x: 300, y: 250 };
    const transform = zoomMapViewportAtPoint(base, safe, initial, anchor, 2);
    const rect = applyMapViewport(base, safe, transform);

    const beforeRatioX = (anchor.x - base.x) / base.width;
    const beforeRatioY = (anchor.y - base.y) / base.height;
    const afterRatioX = (anchor.x - rect.x) / rect.width;
    const afterRatioY = (anchor.y - rect.y) / rect.height;

    expect(afterRatioX).toBeCloseTo(beforeRatioX, 5);
    expect(afterRatioY).toBeCloseTo(beforeRatioY, 5);
  });

  it("pans the zoomed map while keeping it inside the safe area", () => {
    const zoomed = zoomMapViewportAtPoint(base, safe, initial, { x: 500, y: 400 }, 1.5);
    const before = applyMapViewport(base, safe, zoomed);
    const panned = panMapViewport(base, safe, zoomed, { x: 50, y: 30 });
    const after = applyMapViewport(base, safe, panned);

    expect(after.x - before.x).toBeCloseTo(50, 5);
    expect(after.y - before.y).toBeCloseTo(30, 5);
    expect(after.x).toBeLessThanOrEqual(safe.x);
    expect(after.x + after.width).toBeGreaterThanOrEqual(safe.x + safe.width);
    expect(after.y).toBeLessThanOrEqual(safe.y);
    expect(after.y + after.height).toBeGreaterThanOrEqual(safe.y + safe.height);
  });

  it("computes a safe viewport around top, bottom, and right HUD panels", () => {
    const rect = computeSafeViewportRect(
      { width: 1600, height: 900 },
      [
        { x: 0, y: 0, width: 1600, height: 80 },
        { x: 0, y: 650, width: 1600, height: 250 },
        { x: 1280, y: 100, width: 320, height: 650 }
      ]
    );

    expect(rect).toEqual({ x: 0, y: 92, width: 1268, height: 546 });
  });

  it("drops side occluders when they would make the map area too narrow", () => {
    const rect = computeSafeViewportRect(
      { width: 1600, height: 900 },
      [
        { x: 0, y: 120, width: 700, height: 620 },
        { x: 900, y: 120, width: 700, height: 620 }
      ]
    );

    expect(rect.x).toBe(0);
    expect(rect.width).toBe(1600);
  });

  it("fits the base map rect to desktop and mobile framing rules", () => {
    const desktopRect = computeBaseMapRect(
      { width: 1600, height: 900 },
      { width: 1600, height: 1000 },
      { x: 0, y: 0, width: 1600, height: 900 },
      false
    );
    const mobileRect = computeBaseMapRect(
      { width: 800, height: 600 },
      { width: 1600, height: 1000 },
      { x: 0, y: 0, width: 800, height: 600 },
      false
    );

    expect(desktopRect).toEqual({ x: 0, y: -50, width: 1600, height: 1000 });
    expect(mobileRect).toEqual({ x: 0, y: 50, width: 800, height: 500 });
  });

  it("adds a focus scale and keeps the focused point inside the safe margin", () => {
    const focused = computeBaseMapRect(
      { width: 800, height: 600 },
      { width: 1600, height: 1000 },
      { x: 0, y: 0, width: 800, height: 600 },
      true,
      { x: 0.92, y: 0.5 }
    );
    const focusScreenX = focused.x + focused.width * 0.92;

    expect(focused.width).toBeGreaterThan(800);
    expect(focusScreenX).toBeLessThanOrEqual(800 - 72);
  });
});
