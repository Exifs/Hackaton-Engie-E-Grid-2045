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

  test("construction palette is open with one generated art image per card", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await expect(page.locator(".build-palette.is-open")).toBeVisible();
    await expect(page.locator(".build-card").first()).toBeVisible();

    const manifest = await page.request.get("/assets/generated/manifest.json");
    expect(manifest.ok()).toBe(true);
    const cardAtlas = await page.request.get("/assets/generated/building-card-art-atlas.png");
    expect(cardAtlas.ok()).toBe(true);
    const artBackground = await page.locator(".building-art").first().evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(artBackground).toContain("building-card-art-atlas");
    await expect(page.locator(".build-card .building-icon")).toHaveCount(0);

    await page.screenshot({ path: testInfo.outputPath("construction-palette-open.png"), fullPage: true });
  });

  test("construction palette keeps scroll after HUD rerender", async ({ page }, testInfo) => {
    await openGame(page, 390, 844);
    await page.getByRole("button", { name: "Construire" }).click();
    const scrollState = await page.locator(".palette-body").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      return { before: element.scrollTop, max: element.scrollHeight - element.clientHeight };
    });
    expect(scrollState.before).toBeGreaterThan(0);

    await page.evaluate(() => window.__EGRID__?.hud.render());
    const after = await page.locator(".palette-body").evaluate((element) => element.scrollTop);
    expect(after).toBeGreaterThan(scrollState.max * 0.75);
    await expect(page.locator(".build-card").last()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("phone-build-scroll-preserved.png"), fullPage: true });
  });

  test("P0 completed buildings render as visual active cards", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.evaluate(() => window.__EGRID__?.runP0Scenario());

    await expect(page.locator(".built-card")).toHaveCount(4);
    await expect(page.locator(".built-card").first()).toBeVisible();
    const artBackground = await page.locator(".built-card .building-art").first().evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(artBackground).toContain("building-card-art-atlas");
    await expectHudNoMajorOverlap(page);

    await page.screenshot({ path: testInfo.outputPath("p0-built-building-cards.png"), fullPage: true });
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

  test("non-actionable notifications can be closed and auto-dismiss", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await createSlotsAlert(page);
    await expect(page.locator(".alert-item", { hasText: "Slots saturated" })).toBeVisible();

    await page.evaluate(() => window.__EGRID__?.simulation.selectRegion("fr_nord"));
    await page.locator(".alert-item", { hasText: "Slots saturated" }).locator(".alert-dismiss").click();
    await expect(page.locator(".alert-item", { hasText: "Slots saturated" })).toHaveCount(0);
    const selectedAfterClose = await page.evaluate(() => window.__EGRID__?.simulation.getSummary().selected_region_id);
    expect(selectedAfterClose).toBe("fr_nord");

    await page.reload();
    await page.waitForFunction(() => Boolean(window.__EGRID__));
    await createSlotsAlert(page);
    const slotsAlert = page.locator(".alert-item", { hasText: "Slots saturated" });
    await expect(slotsAlert).toBeVisible();
    await expect(slotsAlert.locator(".alert-life")).toBeVisible();
    await page.waitForTimeout(8_600);
    await expect(slotsAlert).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("slots-alert-dismissed.png"), fullPage: true });
  });

  test("built buildings can be demolished from the region panel", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.evaluate(() => window.__EGRID__?.runP0Scenario());
    const energyBefore = await page.evaluate(() => window.__EGRID__?.simulation.getSummary().energy_produced ?? 0);

    await page.locator(".built-card", { hasText: "Centrale gaz" }).click();
    await expect(page.locator(".region-demolition")).toContainText("Centrale gaz");
    const energyAfter = await page.evaluate(() => window.__EGRID__?.simulation.getSummary().energy_produced ?? 0);
    expect(energyAfter).toBeLessThan(energyBefore);
    await expectHudNoMajorOverlap(page);
    await page.screenshot({ path: testInfo.outputPath("demolition-started.png"), fullPage: true });
  });

  test("research tab launches Batteries and unlocks the Battery building", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.state.money = 10000;
      game.simulation.requestBuilding("fr_nord", "energy_research_center");
      for (let index = 0; index < 8; index += 1) {
        game.simulation.advanceMonth();
      }
      game.simulation.selectRegion("fr_nord");
      game.scene.focusRegion("fr_nord");
      game.hud.render();
      game.scene.renderState();
    });

    await page.locator('[data-palette-tab="research"]').click();
    await expect(page.locator(".research-card", { hasText: "Batteries" })).toBeVisible();
    await page.locator(".research-card", { hasText: "Batteries" }).click();
    await expect(page.locator(".research-status")).toContainText("Batteries");

    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      for (let index = 0; index < 20; index += 1) {
        game.simulation.advanceMonth();
      }
      game.hud.render();
    });
    await page.locator('[data-palette-tab="construction"]').click();
    const battery = page.locator(".build-card", { hasText: "Batterie" });
    await expect(battery).toBeVisible();
    await expect(battery).not.toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath("research-unlocks-battery.png"), fullPage: true });
  });

  test("research tab explains stalled research when technology output is zero", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.startResearch("batteries");
      game.hud.render();
    });
    await page.locator('[data-palette-tab="research"]').click();
    await expect(page.locator(".research-status")).toContainText("debit 0");
    await expect(page.locator(".research-card", { hasText: "Batteries" })).toContainText("centres de recherche energie");
    await page.screenshot({ path: testInfo.outputPath("research-stalled-zero-output.png"), fullPage: true });
  });

  test("selected far region is focused inside the visible map safe area", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    const focusedRegion = await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return "";
      }
      const [regionId] = Object.entries(game.simulation.getRegionLayout())
        .sort(([, a], [, b]) => b.x - a.x)[0];
      game.simulation.selectRegion(regionId);
      game.scene.focusRegion(regionId);
      game.hud.render();
      game.scene.renderState();
      return regionId;
    });
    expect(focusedRegion).not.toBe("");
    await page.waitForTimeout(150);
    const point = await page.evaluate((regionId) => window.__EGRID__?.scene.getRegionScreenPoint(regionId), focusedRegion);
    expect(point).toBeTruthy();
    await expectPointNotCoveredByHud(page, point as { x: number; y: number });
    await page.screenshot({ path: testInfo.outputPath("focused-region-safe-area.png"), fullPage: true });
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

async function createSlotsAlert(page: Page): Promise<void> {
  await page.evaluate(() => {
    const game = window.__EGRID__;
    if (!game) {
      return;
    }
    game.simulation.newGame("slots-alert");
    game.simulation.state.money = 10000;
    game.simulation.selectRegion("dk");
    let guard = 0;
    while (game.simulation.getBuildAvailability("dk").gas_power_plant.ok && guard < 40) {
      game.simulation.requestBuilding("dk", "gas_power_plant");
      guard += 1;
    }
    for (let index = 0; index < 4; index += 1) {
      game.simulation.advanceMonth();
    }
    game.hud.render();
    game.scene.focusRegion("dk");
    game.scene.renderState();
  });
}

async function expectPointNotCoveredByHud(page: Page, point: { x: number; y: number }): Promise<void> {
  const coveredBy = await page.evaluate(({ x, y }) => {
    const selectors = [".top-kpi", ".heatmap-switch", ".alerts-panel", ".region-panel", ".build-palette"];
    return selectors.filter((selector) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) {
        return false;
      }
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || rect.width < 2 || rect.height < 2) {
        return false;
      }
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
  }, point);
  expect(coveredBy).toEqual([]);
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
