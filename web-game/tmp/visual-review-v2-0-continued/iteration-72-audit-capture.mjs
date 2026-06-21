import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.EGRID_AUDIT_BASE_URL ?? "http://127.0.0.1:4176";
const outputDir = path.resolve("tmp/visual-review-v2-0-continued");
const prefix = process.env.EGRID_AUDIT_PREFIX ?? "iteration-72-current-audit";

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });

    await captureState(page, "concept-state", "/?testMode=1&seed=p0&scenario=concept&onboarding=0");
    await captureState(page, "real-start", "/?testMode=1&seed=web&onboarding=0");
    await captureConstructionState(page);
    await captureResearchState(page);
  } finally {
    await browser.close();
  }
}

async function captureState(page, name, url) {
  await openGame(page, url);
  await page.mouse.move(900, 450);
  await page.waitForTimeout(40);
  await page.screenshot({ path: path.join(outputDir, `${prefix}-${name}-global.png`), fullPage: true });
  await crop(page, "#game-canvas canvas", `${prefix}-${name}-canvas.png`);
  await crop(page, ".top-kpi", `${prefix}-${name}-topbar.png`);
  await crop(page, ".build-palette", `${prefix}-${name}-left-rail.png`);
  await crop(page, ".region-panel", `${prefix}-${name}-right-panel.png`);
  await crop(page, ".alerts-panel", `${prefix}-${name}-alerts.png`);
  await crop(page, ".grid-overview-card", `${prefix}-${name}-grid-overview.png`);

  if (name === "concept-state") {
    await page.locator(".heatmap-button").first().hover();
    await page.waitForTimeout(80);
    await page.screenshot({ path: path.join(outputDir, `${prefix}-concept-state-tooltip.png`), fullPage: true });
    await page.mouse.move(900, 450);
    await page.waitForTimeout(40);
  }

  const metrics = await page.evaluate(() => {
    const countSceneBuildingTextures = (items) =>
      items.reduce((total, item) => {
        const ownTexture = item?.texture?.key === "building-icon-atlas" || item?.texture?.key === "building-map-atlas" ? 1 : 0;
        const nestedTextures = Array.isArray(item?.list) ? countSceneBuildingTextures(item.list) : 0;
        return total + ownTexture + nestedTextures;
      }, 0);
    const scene = window.__EGRID__?.scene;
    const summary = window.__EGRID__?.simulation.getSummary();
    const regions = window.__EGRID__?.simulation.getRegionsSnapshot() ?? {};
    const selectedRegionId = summary?.selected_region_id ?? "";
    const strategicFlows = scene?.strategicMapFlows?.(summary?.network_flows ?? [], selectedRegionId, regions) ?? [];
    const alertAccents = scene?.strategicAlertAccents?.(summary, regions, strategicFlows) ?? [];
    const panelSelectors = [".top-kpi", ".build-palette", ".region-panel", ".alerts-panel", ".grid-overview-card"];
    const panels = Object.fromEntries(panelSelectors.map((selector) => {
      const element = document.querySelector(selector);
      const rect = element?.getBoundingClientRect();
      return [selector, {
        visible: Boolean(rect && rect.width > 0 && rect.height > 0),
        width: rect?.width ?? 0,
        height: rect?.height ?? 0,
        overflowX: element ? Math.max(0, element.scrollWidth - element.clientWidth) : 999,
        overflowY: element ? Math.max(0, element.scrollHeight - element.clientHeight) : 999
      }];
    }));
    const gridOverview = document.querySelector(".grid-overview-card");
    const heatmap = document.querySelector(".heatmap-switch");
    const heatmapRect = heatmap?.getBoundingClientRect();
    return {
      selectedRegionId,
      alertCount: summary?.alerts?.length ?? 0,
      alertAccentCount: alertAccents.length,
      alertAccentFlowCount: alertAccents.filter((accent) => Boolean(accent.flow)).length,
      strategicFlowCount: strategicFlows.length,
      strategicCongestedCount: strategicFlows.filter((flow) => flow.is_congested).length,
      buildingTextureCount: countSceneBuildingTextures(scene?.children?.list ?? []),
      onboardingVisible: Boolean(document.querySelector(".onboarding-coach")),
      panels,
      heatmap: {
        visible: Boolean(heatmapRect && heatmapRect.width > 0 && heatmapRect.height > 0),
        width: heatmapRect?.width ?? 0,
        height: heatmapRect?.height ?? 0,
        compactLabels: [...document.querySelectorAll(".heatmap-button")].every(
          (button) => (button.textContent?.trim().length ?? 0) <= 3
        ),
        richTooltipCount: [...document.querySelectorAll(".heatmap-button")].filter(
          (button) => button.dataset.richTooltip === "1"
        ).length
      },
      miniOverview: {
        visible: Boolean(gridOverview?.getBoundingClientRect().height),
        background: getComputedStyle(document.querySelector(".grid-overview-map") ?? document.body).backgroundImage,
        staticThreadCount: gridOverview?.querySelectorAll(".mini-overview-thread, .mini-overview-orbit").length ?? -1,
        hubLineCount: gridOverview?.querySelectorAll(".mini-flow-hub").length ?? -1,
        nodeCount: gridOverview?.querySelectorAll(".grid-overview-node").length ?? -1
      }
    };
  });
  await fs.writeFile(
    path.join(outputDir, `${prefix}-${name}-metrics.json`),
    JSON.stringify(metrics, null, 2)
  );
}

async function captureConstructionState(page) {
  await openGame(page, "/?testMode=1&seed=web&onboarding=0");
  await page.evaluate(() => {
    window.__EGRID__?.simulation.requestBuilding("fr_nord", "datacenter_standard");
    window.__EGRID__?.scene.renderState();
    window.__EGRID__?.hud.render();
  });
  await page.mouse.move(900, 450);
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(outputDir, `${prefix}-construction-global.png`), fullPage: true });
  await crop(page, "#game-canvas canvas", `${prefix}-construction-canvas.png`);
  const metrics = await page.evaluate(() => ({
    constructionQueue: window.__EGRID__?.simulation.getRegionSnapshot("fr_nord")?.construction_queue.length ?? 0,
    builtCount: window.__EGRID__?.simulation.getRegionSnapshot("fr_nord")?.buildings.length ?? 0,
    buildingTextureCount: ((items) => {
      const countSceneBuildingTextures = (children) =>
        children.reduce((total, item) => {
          const ownTexture = item?.texture?.key === "building-icon-atlas" || item?.texture?.key === "building-map-atlas" ? 1 : 0;
          const nestedTextures = Array.isArray(item?.list) ? countSceneBuildingTextures(item.list) : 0;
          return total + ownTexture + nestedTextures;
        }, 0);
      return countSceneBuildingTextures(items);
    })(window.__EGRID__?.scene.children?.list ?? [])
  }));
  await fs.writeFile(
    path.join(outputDir, `${prefix}-construction-metrics.json`),
    JSON.stringify(metrics, null, 2)
  );
}

async function captureResearchState(page) {
  await openGame(page, "/?testMode=1&seed=web&onboarding=0");
  await page.locator('[data-palette-tab="research"]').click();
  await page.mouse.move(900, 450);
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(outputDir, `${prefix}-research-global.png`), fullPage: true });
  await crop(page, ".build-palette", `${prefix}-research-left-rail.png`);
  const metrics = await page.evaluate(() => {
    const body = document.querySelector(".palette-body-research");
    const palette = document.querySelector(".build-palette");
    const overview = document.querySelector(".grid-overview-card");
    const paletteRect = palette?.getBoundingClientRect();
    const overviewRect = overview?.getBoundingClientRect();
    const cards = [...document.querySelectorAll(".research-card")];
    return {
      bodyOverflowY: body ? Math.max(0, body.scrollHeight - body.clientHeight) : 999,
      cardCount: cards.length,
      titleOverflowMax: Math.max(0, ...cards.map((card) => {
        const title = card.querySelector("strong");
        return title ? Math.max(0, title.scrollWidth - title.clientWidth) : 0;
      })),
      cardOverflowMax: Math.max(0, ...cards.map((card) => Math.max(0, card.scrollWidth - card.clientWidth, card.scrollHeight - card.clientHeight))),
      overviewVisibleInPalette: Boolean(
        overviewRect &&
        paletteRect &&
        overviewRect.top >= paletteRect.top &&
        overviewRect.bottom <= paletteRect.bottom + 1
      )
    };
  });
  await fs.writeFile(
    path.join(outputDir, `${prefix}-research-metrics.json`),
    JSON.stringify(metrics, null, 2)
  );
}

async function openGame(page, url) {
  await page.goto(`${baseUrl}${url}`);
  await page.waitForFunction(() => Boolean(window.__EGRID__));
  await page.locator("#game-canvas canvas").waitFor({ state: "visible" });
  await page.evaluate(() => {
    window.__EGRID__?.hud.render();
    window.__EGRID__?.scene.renderState();
  });
  await page.mouse.move(900, 450);
  await page.waitForTimeout(150);
}

async function crop(page, selector, filename) {
  const locator = page.locator(selector).first();
  await locator.screenshot({ path: path.join(outputDir, filename) });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
