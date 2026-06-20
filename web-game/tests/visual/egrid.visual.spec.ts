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

  test("construction accordion keeps one category active without vertical scroll", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await expect(page.locator(".build-category-tab.is-active")).toHaveCount(1);
    await expect(page.locator('[data-build-category="all"]')).toHaveClass(/is-active/);

    await page.locator('[data-build-category="energy"]').click();
    await expect(page.locator('[data-build-category="energy"]')).toHaveClass(/is-active/);
    await page.evaluate(() => window.__EGRID__?.hud.render());
    await expect(page.locator('[data-build-category="energy"]')).toHaveClass(/is-active/);

    const paletteMetrics = await page.locator(".palette-body-construction").evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      visibleCategories: document.querySelectorAll(".build-category-content .build-category").length,
      gridDisplay: getComputedStyle(document.querySelector(".build-grid") as HTMLElement).display,
      gridOverflowY: getComputedStyle(document.querySelector(".build-grid") as HTMLElement).overflowY
    }));
    expect(paletteMetrics.visibleCategories).toBe(1);
    expect(paletteMetrics.scrollHeight).toBeLessThanOrEqual(paletteMetrics.clientHeight + 1);
    expect(paletteMetrics.gridDisplay).toBe("flex");
    expect(paletteMetrics.gridOverflowY).toBe("hidden");
    await page.screenshot({ path: testInfo.outputPath("construction-accordion-no-vertical-scroll.png"), fullPage: true });
  });

  test("construction all mode stacks categories with vertical scroll", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await expect(page.locator('[data-build-category="all"]')).toHaveClass(/is-active/);

    const allMetrics = await page.locator(".build-category-content").evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      visibleCategories: document.querySelectorAll(".build-category-content .build-category").length,
      contentOverflowY: getComputedStyle(element).overflowY
    }));
    expect(allMetrics.visibleCategories).toBeGreaterThan(1);
    expect(allMetrics.scrollHeight).toBeGreaterThan(allMetrics.clientHeight);
    expect(allMetrics.contentOverflowY).toBe("auto");
    await page.screenshot({ path: testInfo.outputPath("construction-all-mode-stacked.png"), fullPage: true });
  });

  test("construction locked filter hides access locks but keeps temporary blockers", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);

    await expect(page.locator('[data-build="battery_storage"]')).toHaveCount(0);
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.state.money = 0;
      game.hud.render();
    });
    const budgetBlocked = page.locator('[data-build="gas_power_plant"]').first();
    await expect(budgetBlocked).toBeVisible();
    await expect(budgetBlocked).toBeDisabled();
    await expect(budgetBlocked).toHaveAttribute("data-availability-cause", "budget");

    await page.locator('[data-filter-toggle="locked-buildings"]').click();
    const lockedBattery = page.locator('[data-build="battery_storage"]');
    await expect(lockedBattery).toBeVisible();
    await expect(lockedBattery).toBeDisabled();
    await expect(lockedBattery).toHaveAttribute("data-availability-cause", "technology");
    await page.screenshot({ path: testInfo.outputPath("construction-locked-filter.png"), fullPage: true });
  });

  test("bottom dock and right panel can be resized and reset", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);

    const dockBefore = await page.locator(".build-palette").boundingBox();
    const cardBefore = await page.locator(".build-card").first().boundingBox();
    const regionBeforeMetrics = await regionPanelMetrics(page);
    const dockHandle = await page.locator(".dock-resize-handle").boundingBox();
    expect(dockBefore).toBeTruthy();
    expect(cardBefore).toBeTruthy();
    expect(dockHandle).toBeTruthy();
    await page.mouse.move((dockHandle?.x ?? 0) + (dockHandle?.width ?? 0) / 2, (dockHandle?.y ?? 0) + 4);
    await page.mouse.down();
    await page.mouse.move((dockHandle?.x ?? 0) + (dockHandle?.width ?? 0) / 2, (dockHandle?.y ?? 0) - 82);
    await page.mouse.up();

    const dockAfter = await page.locator(".build-palette").boundingBox();
    const cardAfter = await page.locator(".build-card").first().boundingBox();
    const regionAfterDockMetrics = await regionPanelMetrics(page);
    expect(dockAfter?.height ?? 0).toBeGreaterThan((dockBefore?.height ?? 0) + 50);
    expect(Math.abs((cardAfter?.height ?? 0) - (cardBefore?.height ?? 0))).toBeLessThanOrEqual(2);
    expect(cardAfter?.height ?? 0).toBeLessThanOrEqual(130);
    expect(Math.abs(regionAfterDockMetrics.tagHeight - regionBeforeMetrics.tagHeight)).toBeLessThanOrEqual(1);
    expect(Math.abs(regionAfterDockMetrics.sectionGap - regionBeforeMetrics.sectionGap)).toBeLessThanOrEqual(1);
    const storedDock = await page.evaluate(() => Number(localStorage.getItem("egrid:dock-height")));
    expect(storedDock).toBeGreaterThan(320);

    const panelBefore = await page.locator(".region-panel").boundingBox();
    const panelHandle = await page.locator(".region-resize-handle").boundingBox();
    expect(panelBefore).toBeTruthy();
    expect(panelHandle).toBeTruthy();
    await page.mouse.move((panelHandle?.x ?? 0) + 4, (panelHandle?.y ?? 0) + 40);
    await page.mouse.down();
    await page.mouse.move((panelHandle?.x ?? 0) - 84, (panelHandle?.y ?? 0) + 40);
    await page.mouse.up();

    const panelAfter = await page.locator(".region-panel").boundingBox();
    const regionAfterWidthMetrics = await regionPanelMetrics(page);
    expect(panelAfter?.width ?? 0).toBeGreaterThan((panelBefore?.width ?? 0) + 50);
    expect(Math.abs(regionAfterWidthMetrics.tagHeight - regionBeforeMetrics.tagHeight)).toBeLessThanOrEqual(1);
    const storedPanel = await page.evaluate(() => Number(localStorage.getItem("egrid:right-panel-width")));
    expect(storedPanel).toBeGreaterThan(336);

    await page.locator(".dock-resize-handle").dblclick();
    await page.locator(".region-resize-handle").dblclick();
    await expect(page.locator(".build-palette")).toHaveCSS("height", "320px");
    const resetPanel = await page.locator(".region-panel").boundingBox();
    expect(Math.round(resetPanel?.width ?? 0)).toBe(336);
    await page.screenshot({ path: testInfo.outputPath("resized-panels-reset.png"), fullPage: true });
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
    await page.locator('[data-build-category="grid"]').click();
    const battery = page.locator(".build-card", { hasText: "Batterie" });
    await expect(battery).toBeVisible();
    await expect(battery).not.toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath("research-unlocks-battery.png"), fullPage: true });
  });

  test("research queue is visible and supports promote and remove", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await buildCompletedResearchCenter(page, "energy_research_center");

    await page.locator('[data-palette-tab="research"]').click();
    await page.locator('[data-research="batteries"]').click();
    await expect(page.locator(".research-status")).toContainText("Batteries");

    await page.locator('[data-research="offshore_wind"]').click();
    await expect(page.locator('.research-queue-item[data-queued-research="offshore_wind"]')).toBeVisible();
    await page.locator('[data-research="smart_grids"]').click();
    await expect(page.locator(".research-queue-item")).toHaveCount(2);

    await page.locator('.research-queue-item[data-queued-research="smart_grids"] [data-promote-research]').click();
    await expect(page.locator(".research-queue-item").first()).toHaveAttribute("data-queued-research", "smart_grids");

    await page.locator('.research-queue-item[data-queued-research="smart_grids"] [data-remove-research]').click();
    await expect(page.locator('.research-queue-item[data-queued-research="smart_grids"]')).toHaveCount(0);
    await expect(page.locator('.research-queue-item[data-queued-research="offshore_wind"]')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("research-queue-promote-remove.png"), fullPage: true });
  });

  test("research tab blocks research when the required building is missing", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.locator('[data-palette-tab="research"]').click();
    const batteries = page.locator('[data-research="batteries"]');
    await expect(batteries).toHaveCount(0);
    await page.locator('[data-filter-toggle="unavailable-research"]').click();
    await expect(batteries).toBeDisabled();
    await expect(batteries).toHaveAttribute("data-lock-cause", "building");
    await expect(batteries).toContainText("Centre recherche energie");
    const result = await page.evaluate(() => window.__EGRID__?.simulation.startResearch("batteries"));
    expect(result).toMatchObject({ ok: false, reason: "Requires an active Centre recherche energie." });
    await page.screenshot({ path: testInfo.outputPath("research-blocked-no-building.png"), fullPage: true });
  });

  test("active research displays progress background and throughput details", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await buildCompletedResearchCenter(page, "energy_research_center");
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.startResearch("batteries");
      for (let index = 0; index < 3; index += 1) {
        game.simulation.advanceMonth();
      }
      game.hud.render();
    });

    await page.locator('[data-palette-tab="research"]').click();
    const status = page.locator(".research-status.is-active");
    await expect(status).toContainText("%");
    await expect(status).toContainText("pts/mois");
    await expect(status).toContainText("ETA");
    const progressStyle = await status.evaluate((element) => ({
      progress: getComputedStyle(element).getPropertyValue("--research-progress").trim(),
      background: getComputedStyle(element).backgroundImage
    }));
    expect(parseFloat(progressStyle.progress)).toBeGreaterThan(0);
    expect(progressStyle.background).toContain("linear-gradient");
    await page.screenshot({ path: testInfo.outputPath("research-active-progress-background.png"), fullPage: true });
  });

  test("month progress visually interpolates queues and active research", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.state.money = 10000;
      game.simulation.requestBuilding("fr_nord", "energy_research_center");
      game.simulation.setSimulationSpeed(1);
      game.simulation.stepSimulationTime(game.simulation.secondsPerMonth / 2);
      game.hud.render();
    });
    const constructionProgress = await progressVariable(page, ".queue-card .queue-copy i");
    expect(constructionProgress).toBeGreaterThan(0);
    expect(constructionProgress).toBeLessThan(20);

    await buildCompletedResearchCenter(page, "energy_research_center");
    await page.locator('[data-palette-tab="research"]').click();
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      const monthProgress = game.simulation.getMonthProgress();
      if (monthProgress > 0) {
        game.simulation.stepSimulationTime((1 - monthProgress) * game.simulation.secondsPerMonth);
      }
      game.simulation.startResearch("batteries");
      game.simulation.setSimulationSpeed(1);
      game.simulation.stepSimulationTime(game.simulation.secondsPerMonth / 2);
      game.hud.render();
    });
    const researchProgress = await page.locator(".research-status.is-active").evaluate((element) =>
      parseFloat(getComputedStyle(element).getPropertyValue("--research-progress"))
    );
    expect(researchProgress).toBeGreaterThan(0);

    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.stepSimulationTime(game.simulation.secondsPerMonth / 2 + 0.02);
      game.hud.render();
    });
    const afterTickProgress = await page.locator(".research-status.is-active").evaluate((element) =>
      parseFloat(getComputedStyle(element).getPropertyValue("--research-progress"))
    );
    expect(afterTickProgress).toBeGreaterThanOrEqual(researchProgress);
    await page.screenshot({ path: testInfo.outputPath("month-progress-interpolated-bars.png"), fullPage: true });
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
  await page.evaluate(() => {
    window.__EGRID__?.hud.render();
    window.__EGRID__?.scene.renderState();
  });
  await page.waitForTimeout(150);
}

async function buildCompletedResearchCenter(page: Page, buildingId: "energy_research_center" | "ai_research_center"): Promise<void> {
  await page.evaluate((targetBuildingId) => {
    const game = window.__EGRID__;
    if (!game) {
      return;
    }
    game.simulation.state.money = 10000;
    game.simulation.requestBuilding("fr_nord", targetBuildingId);
    for (let index = 0; index < 8; index += 1) {
      game.simulation.advanceMonth();
    }
    game.simulation.selectRegion("fr_nord");
    game.scene.focusRegion("fr_nord");
    game.hud.render();
    game.scene.renderState();
  }, buildingId);
}

async function regionPanelMetrics(page: Page): Promise<{ tagHeight: number; sectionGap: number }> {
  return page.evaluate(() => {
    const tag = document.querySelector<HTMLElement>(".region-tags span")?.getBoundingClientRect();
    const sections = [...document.querySelectorAll<HTMLElement>(".region-section")]
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.height > 0);
    const sectionGap = sections.length > 1 ? sections[1].top - sections[0].bottom : 0;
    return {
      tagHeight: tag?.height ?? 0,
      sectionGap
    };
  });
}

async function progressVariable(page: Page, selector: string): Promise<number> {
  return page.locator(selector).first().evaluate((element) =>
    parseFloat(getComputedStyle(element).getPropertyValue("--progress"))
  );
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
