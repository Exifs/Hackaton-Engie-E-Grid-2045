import { expect, test, type Page } from "@playwright/test";

type Rect = { selector: string; x: number; y: number; width: number; height: number };

test.describe("E-Grid 2045 web game visuals", () => {
  test("initial desktop screen 1600x900", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await expectCanvasNonBlank(page);
    await expectHudNoMajorOverlap(page);
    await expect(page.locator(".top-kpi")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("initial-desktop-1600x900.png"), fullPage: true });
  });

  test("initial tablet/mobile screen", async ({ page }, testInfo) => {
    await openGame(page, 768, 1024);
    await expectCanvasNonBlank(page);
    await expectHudNoMajorOverlap(page);
    await expect(page.locator(".heatmap-switch")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("initial-tablet-768x1024.png"), fullPage: true });
  });

  test("phone portrait layout keeps map and construction usable", async ({ page }, testInfo) => {
    await openGame(page, 390, 844);
    await expectCanvasNonBlank(page);
    await expectHudNoMajorOverlap(page);
    await expect(page.locator(".build-palette")).not.toHaveClass(/is-open/);
    await expect(page.locator(".region-panel")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("initial-phone-390x844.png"), fullPage: true });

    await page.getByRole("button", { name: "Construire" }).click();
    await expect(page.locator(".build-palette")).toHaveClass(/is-open/);
    await expect(page.locator(".region-panel")).toBeHidden();
    await expect(page.locator(".build-card").first()).toBeVisible();
    await expectHudNoMajorOverlap(page);
    await page.screenshot({ path: testInfo.outputPath("phone-build-sheet-open.png"), fullPage: true });
  });

  test("France Nord selection shows the region panel", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.evaluate(() => {
      window.__EGRID__?.simulation.selectRegion("fr_nord");
      window.__EGRID__?.scene.renderState();
      window.__EGRID__?.hud.render();
    });
    await expect(page.locator(".region-panel")).toContainText("France Nord");
    await expectCanvasNonBlank(page);
    await page.screenshot({ path: testInfo.outputPath("france-nord-region-panel.png"), fullPage: true });
  });

  test("construction palette is open and generated icon atlas loads", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await expect(page.locator(".build-palette.is-open")).toBeVisible();
    await expect(page.locator(".build-card").first()).toBeVisible();

    const manifest = await page.request.get("/assets/generated/manifest.json");
    expect(manifest.ok()).toBe(true);
    const atlas = await page.request.get("/assets/generated/building-icon-atlas.png");
    expect(atlas.ok()).toBe(true);
    const backgroundImage = await page.locator(".building-icon").first().evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(backgroundImage).toContain("building-icon-atlas");

    await page.screenshot({ path: testInfo.outputPath("construction-palette-open.png"), fullPage: true });
  });

  test("energy and cooling heatmaps render", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.locator('[data-heatmap="energy"]').click();
    await expectCanvasNonBlank(page);
    await page.screenshot({ path: testInfo.outputPath("heatmap-energy.png"), fullPage: true });

    await page.locator('[data-heatmap="cooling"]').click();
    await expectCanvasNonBlank(page);
    await page.screenshot({ path: testInfo.outputPath("heatmap-cooling.png"), fullPage: true });
  });

  test("network flows and actionable alerts render in a stressed state", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.evaluate(() => window.__EGRID__?.runAlertScenario());

    await expect(page.locator(".alert-item").first()).toBeVisible();
    await expect(page.locator(".region-panel")).toContainText("Irlande");
    await expectCanvasNonBlank(page);
    await expectHudNoMajorOverlap(page);
    await page.screenshot({ path: testInfo.outputPath("flows-and-alerts.png"), fullPage: true });
  });
});

async function openGame(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto("/?testMode=1&seed=p0");
  await page.waitForFunction(() => Boolean(window.__EGRID__));
  await page.locator("#game-canvas canvas").waitFor({ state: "visible" });
  await page.waitForTimeout(150);
}

async function expectCanvasNonBlank(page: Page): Promise<void> {
  const result = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas canvas");
    if (!canvas) {
      return { ok: false, reason: "missing canvas" };
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return { ok: false, reason: "missing 2d context" };
    }
    const width = canvas.width;
    const height = canvas.height;
    const data = ctx.getImageData(0, 0, width, height).data;
    let colored = 0;
    let bright = 0;
    const step = 32;
    for (let index = 0; index < data.length; index += 4 * step) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      if (a > 0 && (r > 18 || g > 28 || b > 38)) {
        colored += 1;
      }
      if (a > 0 && r + g + b > 180) {
        bright += 1;
      }
    }
    return { ok: colored > 800 && bright > 50, colored, bright, width, height };
  });
  expect(result).toMatchObject({ ok: true });
}

async function expectHudNoMajorOverlap(page: Page): Promise<void> {
  const rects = await page.evaluate(() => {
    const selectors = [".top-kpi", ".heatmap-switch", ".alerts-panel", ".region-panel", ".build-palette"];
    return selectors
      .map((selector) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) {
          return null;
        }
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === "none" || rect.width < 2 || rect.height < 2) {
          return null;
        }
        return { selector, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })
      .filter(Boolean);
  });

  const collisions: string[] = [];
  for (let a = 0; a < rects.length; a += 1) {
    for (let b = a + 1; b < rects.length; b += 1) {
      const first = rects[a] as Rect;
      const second = rects[b] as Rect;
      if (overlaps(first, second)) {
        collisions.push(`${first.selector} overlaps ${second.selector}`);
      }
    }
  }
  expect(collisions).toEqual([]);
}

function overlaps(a: Rect, b: Rect): boolean {
  const pad = 2;
  return !(
    a.x + a.width <= b.x + pad ||
    b.x + b.width <= a.x + pad ||
    a.y + a.height <= b.y + pad ||
    b.y + b.height <= a.y + pad
  );
}
