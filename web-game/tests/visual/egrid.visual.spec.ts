import { expect, test, type Page } from "@playwright/test";

type Rect = { selector: string; x: number; y: number; width: number; height: number };

test.describe("E-Grid 2045 web game visuals", () => {
  test("onboarding guides the first gameplay loop and persists completion", async ({ page }, testInfo) => {
    await openGameWithOnboarding(page, 1600, 900);
    await expect(page.locator(".onboarding-coach")).toBeVisible();
    await expect(page.locator(".onboarding-coach")).toContainText("Mission");

    await page.locator('[data-onboarding-action="next"]').click();
    await expect(page.locator(".onboarding-coach")).toContainText("Ressources cles");
    await page.locator('[data-onboarding-action="next"]').click();
    await expect(page.locator(".onboarding-coach")).toContainText("Universite");

    await page.locator('[data-build="university"]').click();
    await expect(page.locator(".onboarding-coach")).toContainText("Overlay refroidissement");
    await page.locator('[data-heatmap="cooling"]').click();
    await expect(page.locator(".onboarding-coach")).toContainText("Energie de depart");

    await page.locator('[data-build="gas_power_plant"]').click();
    await expect(page.locator(".onboarding-coach")).toContainText("Refroidissement");
    await page.locator('[data-build="air_cooling"]').click();
    await expect(page.locator(".onboarding-coach")).toContainText("Datacenter");

    await page.locator('[data-build="datacenter_standard"]').click();
    await expect(page.locator(".onboarding-coach")).toContainText("Recherche");
    await page.locator('[data-build="ai_research_center"]').click();
    await expect(page.locator(".onboarding-coach")).toContainText("Overlay reseau");

    await page.locator('[data-heatmap="network"]').click();
    await expect(page.locator(".onboarding-coach")).toContainText("Fin du guidage");
    await page.locator('[data-onboarding-action="next"]').click();
    await expect(page.locator(".onboarding-coach")).toHaveCount(0);

    const persisted = await page.evaluate(() => localStorage.getItem("egrid:onboarding:v1:completed"));
    expect(persisted).toContain("completed");

    await page.reload();
    await page.waitForFunction(() => Boolean(window.__EGRID__));
    await expect(page.locator(".onboarding-coach")).toHaveCount(0);

    await page.locator('[data-action="replay-onboarding"]').click();
    await expect(page.locator(".onboarding-coach")).toContainText("Mission");
    await page.screenshot({ path: testInfo.outputPath("onboarding-replay-visible.png"), fullPage: true });
  });

  test("initial desktop screen 1600x900", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await expectCanvasNonBlank(page);
    await expectHudNoMajorOverlap(page);
    await expect(page.locator(".top-kpi")).toBeVisible();
    const panelBackground = await page.locator(".top-kpi").evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(panelBackground).toContain("panel-chrome-texture-v1");
    const chromeLayerMetrics = await page.evaluate(() =>
      [".top-kpi", ".build-palette", ".region-panel", ".alerts-panel", ".grid-overview-card"].map((selector) => {
        const element = document.querySelector<HTMLElement>(selector);
        const style = element ? getComputedStyle(element) : undefined;
        return {
          selector,
          hasTexture: style?.backgroundImage.includes("panel-chrome-texture-v1") ?? false,
          linearGradientLayers: style?.backgroundImage.match(/linear-gradient/g)?.length ?? 0,
          radialGradientLayers: style?.backgroundImage.match(/radial-gradient/g)?.length ?? 0,
          overflowX: element ? Math.max(0, element.scrollWidth - element.clientWidth) : 999,
          overflowY: element ? Math.max(0, element.scrollHeight - element.clientHeight) : 999
        };
      })
    );
    expect(chromeLayerMetrics.every((metric) => metric.hasTexture)).toBe(true);
    expect(chromeLayerMetrics.every((metric) => metric.linearGradientLayers >= 8)).toBe(true);
    expect(chromeLayerMetrics.every((metric) => metric.radialGradientLayers >= 4)).toBe(true);
    expect(chromeLayerMetrics.every((metric) => metric.overflowX === 0 && metric.overflowY === 0)).toBe(true);
    const heatmapMetrics = await page.locator(".heatmap-switch").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const buttons = [...element.querySelectorAll<HTMLElement>(".heatmap-button")];
      return {
        width: rect.width,
        height: rect.height,
        compactLabels: buttons.every((button) => (button.textContent?.trim().length ?? 0) <= 3),
        richTooltipCount: buttons.filter((button) => button.dataset.richTooltip === "1").length
      };
    });
    expect(heatmapMetrics.width).toBeLessThanOrEqual(320);
    expect(heatmapMetrics.height).toBeLessThanOrEqual(44);
    expect(heatmapMetrics.compactLabels).toBe(true);
    expect(heatmapMetrics.richTooltipCount).toBe(6);
    const mapAtlas = await page.request.get("/assets/generated/building-map-atlas-v4.png");
    expect(mapAtlas.ok()).toBe(true);
    await expect(page.locator(".grid-overview-card")).toBeVisible();
    await expect(page.locator(".grid-overview-expand")).toHaveText("");
    const agiRingBackground = await page
      .locator(".agi-ring")
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(agiRingBackground).toBe("none");
    const overviewBackground = await page
      .locator(".grid-overview-map")
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(overviewBackground).toContain("grid-overview-europe-map-only-v1");
    expect(overviewBackground).not.toContain("grid-overview-europe-neon");
    const expandBackground = await page
      .locator(".grid-overview-expand")
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(expandBackground).not.toBe("none");
    const miniOverviewMetrics = await page.locator(".grid-overview-card").evaluate((card) => ({
      hubLineCount: card.querySelectorAll(".mini-flow-hub").length,
      nodeCount: card.querySelectorAll(".grid-overview-node").length,
      staticThreadCount: card.querySelectorAll(".mini-overview-thread, .mini-overview-orbit").length,
      relayNodeCount: card.querySelectorAll(".grid-overview-node.is-relay").length,
      flowNodeCount: card.querySelectorAll(".grid-overview-node.is-flow").length,
      dynamicNodeCount: card.querySelectorAll(
        ".grid-overview-node.is-relay, .grid-overview-node.is-flow, .grid-overview-node.is-congested"
      ).length,
      flowHaloOpacity: Number.parseFloat(
        getComputedStyle(card.querySelector(".grid-overview-node.is-flow:not(.is-selected)") ?? card, "::before").opacity
      ),
      selectedHaloOpacity: Number.parseFloat(
        getComputedStyle(card.querySelector(".grid-overview-node.is-selected") ?? card, "::before").opacity
      )
    }));
    expect(miniOverviewMetrics.hubLineCount).toBeGreaterThanOrEqual(8);
    expect(miniOverviewMetrics.nodeCount).toBeGreaterThanOrEqual(18);
    expect(miniOverviewMetrics.staticThreadCount).toBe(0);
    expect(miniOverviewMetrics.relayNodeCount).toBeGreaterThanOrEqual(1);
    expect(miniOverviewMetrics.flowNodeCount).toBeGreaterThanOrEqual(2);
    expect(miniOverviewMetrics.dynamicNodeCount).toBeGreaterThanOrEqual(6);
    expect(miniOverviewMetrics.flowHaloOpacity).toBeGreaterThan(0);
    expect(miniOverviewMetrics.selectedHaloOpacity).toBeGreaterThan(0);
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
    await expect(page.locator(".region-tabs button")).toHaveCount(3);
    await expect(page.locator('[data-region-tab="overview"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".region-tab-overview")).toBeVisible();

    await page.locator('[data-region-tab="buildings"]').click();
    await page.waitForTimeout(250);
    await expect(page.locator('[data-region-tab="buildings"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".region-tab-buildings .region-buildings")).toBeVisible();
    await expect(page.locator(".region-tab-buildings .region-queue")).toBeVisible();
    await expect(page.locator(".region-tab-buildings .region-status-stack")).toHaveCount(0);
    await expect(page.locator(".rich-tooltip.is-visible")).toHaveCount(0);

    await page.locator('[data-region-tab="stats"]').click();
    await page.waitForTimeout(250);
    await expect(page.locator('[data-region-tab="stats"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".region-tab-stats .region-stat-tile")).toHaveCount(6);
    await expect(page.locator(".region-tab-stats .region-status-stack")).toBeVisible();
    await expect(page.locator(".rich-tooltip.is-visible")).toHaveCount(0);

    const tabMetrics = await page.locator(".region-panel").evaluate((panel) => ({
      overflowY: Math.max(0, panel.scrollHeight - panel.clientHeight),
      activeTabs: [...panel.querySelectorAll(".region-tabs button.is-active")].map((element) => element.textContent?.trim())
    }));
    expect(tabMetrics.overflowY).toBeLessThanOrEqual(1);
    expect(tabMetrics.activeTabs).toEqual(["Stats"]);

    await page.waitForTimeout(550);
    await page.locator('[data-region-tab="overview"]').hover();
    await expect(page.locator(".rich-tooltip.is-visible")).toContainText("Vue synthese");
    await expectCanvasNonBlank(page);
    await page.screenshot({ path: testInfo.outputPath("france-nord-region-panel-tabs.png"), fullPage: true });
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

  test("map structures reflect empty, construction, then built states", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    const initialStructures = await countRegionsWithMapStructures(page);
    expect(initialStructures).toBe(0);
    expect(await countMapBuildingSprites(page)).toBe(0);

    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.requestBuilding("fr_nord", "datacenter_standard");
      game.scene.renderState();
      game.hud.render();
    });
    await page.waitForTimeout(150);

    expect(await countRegionsWithMapStructures(page)).toBe(1);
    expect(await countMapBuildingSprites(page)).toBe(0);
    await page.screenshot({ path: testInfo.outputPath("map-construction-cube-after-queued-building.png"), fullPage: true });

    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      for (let index = 0; index < 6; index += 1) {
        game.simulation.advanceMonth();
      }
      game.scene.renderState();
      game.hud.render();
    });
    await page.waitForTimeout(150);

    const franceNordState = await page.evaluate(() => {
      const region = window.__EGRID__?.simulation.getRegionSnapshot("fr_nord");
      return {
        built: region?.buildings.length ?? 0,
        constructing: region?.construction_queue.length ?? 0
      };
    });
    expect(franceNordState).toEqual({ built: 1, constructing: 0 });
    expect(await countMapBuildingSprites(page)).toBeGreaterThan(0);
    await page.screenshot({ path: testInfo.outputPath("map-building-icon-after-built-building.png"), fullPage: true });
  });

  test("concept central map keeps strategic labels and built modules uncluttered", async ({ page }, testInfo) => {
    await openConceptGame(page, 1600, 900);
    const metrics = await page.evaluate(() => {
      const scene = window.__EGRID__?.scene as unknown as {
        children?: {
          list?: unknown[];
        };
        strategicMapFlows?: (
          flows: Array<{ source_region_id: string; target_region_id: string; is_congested: boolean }>,
          selectedRegionId: string,
          regions: Record<string, unknown>
        ) => Array<{ source_region_id: string; target_region_id: string; is_congested: boolean }>;
        strategicAlertAccents?: (
          summary: unknown,
          regions: Record<string, unknown>,
          strategicFlows: Array<{ source_region_id: string; target_region_id: string; is_congested: boolean }>
        ) => Array<{ regionId: string; flow?: unknown }>;
      };
      const summary = window.__EGRID__?.simulation.getSummary();
      const regions = window.__EGRID__?.simulation.getRegionsSnapshot() ?? {};
      const selectedRegionId = summary?.selected_region_id ?? "";
      const strategicFlows = scene.strategicMapFlows?.(summary?.network_flows ?? [], selectedRegionId, regions) ?? [];
      const alertAccents = scene.strategicAlertAccents?.(summary, regions, strategicFlows) ?? [];
      const collectLabels = (items: unknown[]): string[] =>
        items.flatMap((item) => {
          const child = item as {
            text?: string;
            list?: unknown[];
          };
          const ownText = typeof child.text === "string" ? [child.text] : [];
          return [...ownText, ...(Array.isArray(child.list) ? collectLabels(child.list) : [])];
        });
      const labels = collectLabels(scene.children?.list ?? []).map((label) => label.replace(/\s+/g, " ").trim());
      const forbiddenInternalLabels = [
        "FRANCE NORD",
        "ALLEMAGNE OUEST",
        "SUEDE SUD",
        "BALTIQUE NORD",
        "MEDITERRANEE INSULAIRE"
      ];
      return {
        buildingTextureCount: countSceneBuildingTextures(scene.children?.list ?? []),
        visibleStructureEstimate: Math.round(countSceneBuildingTextures(scene.children?.list ?? []) / 4),
        forbiddenVisibleLabels: forbiddenInternalLabels.filter((label) => labels.includes(label)),
        hasBeneluxLabel: labels.includes("BENELUX"),
        hasGermanyLabel: labels.includes("GERMANY"),
        strategicFlowCount: strategicFlows.length,
        strategicCongestedCount: strategicFlows.filter((flow) => flow.is_congested).length,
        strategicSelectedEndpointCount: strategicFlows.filter(
          (flow) => flow.source_region_id === selectedRegionId || flow.target_region_id === selectedRegionId
        ).length,
        alertAccentCount: alertAccents.length,
        alertAccentFlowCount: alertAccents.filter((accent) => Boolean(accent.flow)).length,
        onboardingVisible: Boolean(document.querySelector(".onboarding-coach"))
      };

      function countSceneBuildingTextures(items: unknown[]): number {
        return items.reduce((total, item) => {
          const child = item as {
            texture?: { key?: string };
            list?: unknown[];
          };
          const ownTexture =
            child.texture?.key === "building-icon-atlas" || child.texture?.key === "building-map-atlas" ? 1 : 0;
          const nestedTextures = Array.isArray(child.list) ? countSceneBuildingTextures(child.list) : 0;
          return total + ownTexture + nestedTextures;
        }, 0);
      }
    });
    expect(metrics.onboardingVisible).toBe(false);
    expect(metrics.hasBeneluxLabel).toBe(true);
    expect(metrics.hasGermanyLabel).toBe(true);
    expect(metrics.forbiddenVisibleLabels).toEqual([]);
    expect(metrics.buildingTextureCount).toBeGreaterThanOrEqual(36);
    expect(metrics.visibleStructureEstimate).toBeGreaterThanOrEqual(9);
    expect(metrics.visibleStructureEstimate).toBeLessThanOrEqual(11);
    expect(metrics.strategicFlowCount).toBeGreaterThanOrEqual(8);
    expect(metrics.strategicFlowCount).toBeLessThanOrEqual(12);
    expect(metrics.strategicCongestedCount).toBeLessThanOrEqual(1);
    expect(metrics.strategicSelectedEndpointCount).toBeGreaterThanOrEqual(6);
    expect(metrics.alertAccentCount).toBeGreaterThanOrEqual(3);
    expect(metrics.alertAccentFlowCount).toBeGreaterThanOrEqual(1);
    await expectCanvasNonBlank(page);
    await expectHudNoMajorOverlap(page);
    await page.screenshot({ path: testInfo.outputPath("concept-central-map-strategic-labels.png"), fullPage: true });
  });

  test("construction accordion keeps one category active without vertical scroll", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await expect(page.locator(".build-category-tab.is-active")).toHaveCount(1);
    await expect(page.locator('[data-build-category="all"]')).toHaveClass(/is-active/);

    await page.locator('[data-build-category-title="energy"]').click();
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
    await expectBuildPaletteNoInternalOverlap(page);
    await page.screenshot({ path: testInfo.outputPath("construction-accordion-no-vertical-scroll.png"), fullPage: true });
  });

  test("construction all mode stacks categories with vertical scroll", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await expect(page.locator('[data-build-category="all"]')).toHaveClass(/is-active/);

    const allMetrics = await page.locator(".build-category-content").evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      paletteClientHeight: document.querySelector<HTMLElement>(".palette-body-construction")?.clientHeight ?? 0,
      paletteScrollHeight: document.querySelector<HTMLElement>(".palette-body-construction")?.scrollHeight ?? 0,
      visibleCategories: document.querySelectorAll(".build-category-content .build-category").length,
      contentDisplay: getComputedStyle(element).display,
      contentOverflowY: getComputedStyle(element).overflowY
    }));
    expect(allMetrics.visibleCategories).toBeGreaterThan(1);
    expect(allMetrics.paletteScrollHeight).toBeGreaterThanOrEqual(allMetrics.paletteClientHeight);
    expect(allMetrics.contentDisplay).toBe("flex");
    expect(["auto", "visible"]).toContain(allMetrics.contentOverflowY);
    await expectBuildPaletteNoInternalOverlap(page);

    if (allMetrics.paletteScrollHeight > allMetrics.paletteClientHeight + 1) {
      await page.locator(".palette-body-construction").evaluate((element) => {
        element.scrollTop = 0;
      });
      await page.locator(".build-card").first().hover();
      await page.mouse.wheel(0, 320);
      await page.waitForTimeout(80);
      const scrolledFromCardSurface = await page.locator(".palette-body-construction").evaluate((element) => element.scrollTop);
      expect(scrolledFromCardSurface).toBeGreaterThan(0);
    }

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

  test("dock filter toggles live in the palette header only when open", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);

    await expect(page.locator(".build-toolbar")).toHaveCount(0);
    await expect(page.locator(".research-toolbar")).toHaveCount(0);
    await expect(page.locator('.palette-header [data-filter-toggle="locked-buildings"]')).toBeVisible();
    await expect(page.locator('[data-filter-toggle="unavailable-research"]')).toHaveCount(0);

    await page.getByRole("button", { name: "Fermer" }).click();
    await expect(page.locator(".build-palette")).not.toHaveClass(/is-open/);
    await expect(page.locator(".palette-header [data-filter-toggle]")).toHaveCount(0);

    await page.getByRole("button", { name: "Construire" }).click();
    await page.locator('[data-palette-tab="research"]').click();
    await expect(page.locator('.palette-header [data-filter-toggle="unavailable-research"]')).toBeVisible();
    await expect(page.locator('[data-filter-toggle="locked-buildings"]')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("dock-filter-toggle-header.png"), fullPage: true });
  });

  test("construction cards are compact and content-sized across key viewports", async ({ page }, testInfo) => {
    for (const [width, height] of [[1600, 900], [768, 1024], [390, 844]] as const) {
      await openGame(page, width, height);
      if (width < 720) {
        await page.getByRole("button", { name: "Construire" }).click();
      }
      const metrics = await page.locator(".build-card").first().evaluate((element) => {
        const style = getComputedStyle(element);
        const visualElement = element.querySelector<HTMLElement>(".build-visual");
        const artElement = element.querySelector<HTMLElement>(".building-art");
        const visual = visualElement?.getBoundingClientRect();
        const art = artElement?.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        const artBefore = artElement ? getComputedStyle(artElement, "::before") : null;
        const artAfter = artElement ? getComputedStyle(artElement, "::after") : null;
        return {
          height: rect.height,
          width: rect.width,
          paddingTop: parseFloat(style.paddingTop),
          paddingRight: parseFloat(style.paddingRight),
          alignSelf: style.alignSelf,
          visualWidth: visual?.width ?? 0,
          visualHeight: visual?.height ?? 0,
          artWidth: art?.width ?? 0,
          artHeight: art?.height ?? 0,
          overflowY: Math.max(0, element.scrollHeight - element.clientHeight),
          visualBeforeContent: visualElement ? getComputedStyle(visualElement, "::before").content : "none",
          visualAfterContent: visualElement ? getComputedStyle(visualElement, "::after").content : "none",
          visualAfterOpacity: visualElement ? getComputedStyle(visualElement, "::after").opacity : "",
          artBeforeContent: artBefore?.content ?? "none",
          artAfterContent: artAfter?.content ?? "none",
          artBeforeBorderColor: artBefore?.borderColor ?? "",
          artAfterBackground: artAfter?.backgroundImage ?? "",
          artFilter: artElement ? getComputedStyle(artElement).filter : "",
          artOpacity: artElement ? getComputedStyle(artElement).opacity : ""
        };
      });
      expect(metrics.height).toBeLessThanOrEqual(width < 720 ? 96 : 88);
      expect(metrics.width).toBeLessThanOrEqual(width < 720 ? 214 : 226);
      expect(metrics.paddingTop).toBe(width >= 1180 ? 3 : 4);
      expect(metrics.paddingRight).toBe(width >= 1180 ? 3 : 4);
      expect(metrics.alignSelf).toBe("flex-start");
      expect(metrics.visualWidth).toBe(width >= 1180 ? 42 : 52);
      expect(metrics.visualHeight).toBe(width >= 1180 ? 38 : 48);
      expect(metrics.overflowY).toBe(0);
      if (width >= 1180) {
        expect(metrics.artWidth).toBeLessThan(metrics.visualWidth);
        expect(metrics.artHeight).toBeLessThan(metrics.visualHeight);
        expect(metrics.visualBeforeContent).toBe('""');
        expect(metrics.visualAfterContent).toBe('""');
        expect(metrics.artBeforeContent).toBe('""');
        expect(metrics.artAfterContent).toBe('""');
        expect(parseFloat(metrics.visualAfterOpacity)).toBeGreaterThanOrEqual(0.8);
        expect(metrics.artBeforeBorderColor).not.toBe("rgba(0, 0, 0, 0)");
        expect(metrics.artAfterBackground).not.toBe("none");
        expect(metrics.artFilter).toContain("brightness");
        expect(parseFloat(metrics.artOpacity)).toBeGreaterThanOrEqual(0.9);
      }
      await expectHudNoMajorOverlap(page);
    }
    await page.screenshot({ path: testInfo.outputPath("construction-card-compact-responsive.png"), fullPage: true });
  });

  test("bottom dock and right panel can be resized and reset", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);

    const dockBefore = await page.locator(".build-palette").boundingBox();
    const cardBefore = await page.locator(".build-card").first().boundingBox();
    const regionBeforeMetrics = await regionPanelMetrics(page);
    const dockHandle = await page.locator(".dock-resize-handle").boundingBox();
    expect(dockBefore).toBeTruthy();
    expect(cardBefore).toBeTruthy();
    if (dockHandle) {
      await page.mouse.move(dockHandle.x + dockHandle.width / 2, dockHandle.y + 4);
      await page.mouse.down();
      await page.mouse.move(dockHandle.x + dockHandle.width / 2, dockHandle.y - 82);
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
    } else {
      expect(dockBefore?.height ?? 0).toBeGreaterThan(650);
      await expect(page.locator(".grid-overview-card")).toBeVisible();
      const overviewBackground = await page
        .locator(".grid-overview-map")
        .evaluate((element) => getComputedStyle(element).backgroundImage);
      expect(overviewBackground).toContain("grid-overview-europe-map-only-v1");
      await expect(page.locator(".dock-resize-handle")).toBeHidden();
    }

    const panelBefore = await page.locator(".region-panel").boundingBox();
    const panelHandle = await page.locator(".region-resize-handle").boundingBox();
    expect(panelBefore).toBeTruthy();
    if (panelHandle) {
      await page.mouse.move(panelHandle.x + 4, panelHandle.y + 40);
      await page.mouse.down();
      await page.mouse.move(panelHandle.x - 84, panelHandle.y + 40);
      await page.mouse.up();

      const panelAfter = await page.locator(".region-panel").boundingBox();
      const regionAfterWidthMetrics = await regionPanelMetrics(page);
      expect(panelAfter?.width ?? 0).toBeGreaterThan((panelBefore?.width ?? 0) + 50);
      expect(Math.abs(regionAfterWidthMetrics.tagHeight - regionBeforeMetrics.tagHeight)).toBeLessThanOrEqual(1);
      const storedPanel = await page.evaluate(() => Number(localStorage.getItem("egrid:right-panel-width")));
      expect(storedPanel).toBeGreaterThan(336);

      await page.locator(".region-resize-handle").dblclick();
      const resetPanel = await page.locator(".region-panel").boundingBox();
      expect(Math.round(resetPanel?.width ?? 0)).toBe(336);
    } else {
      expect(panelBefore?.width ?? 0).toBeGreaterThanOrEqual(336);
      await expect(page.locator(".region-resize-handle")).toBeHidden();
    }

    if (dockHandle) {
      await page.locator(".dock-resize-handle").dblclick();
      await expect(page.locator(".build-palette")).toHaveCSS("height", "320px");
    }
    await page.screenshot({ path: testInfo.outputPath("resized-panels-reset.png"), fullPage: true });
  });

  test("P0 completed buildings render as visual active cards", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.evaluate(() => window.__EGRID__?.runP0Scenario());

    await expect(page.locator(".built-card")).toHaveCount(4);
    await expect(page.locator(".built-card").first()).toBeVisible();
    const artBackground = await page.locator(".built-card .building-art").first().evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(artBackground).toContain("building-card-art-atlas");
    const regionSlotMetrics = await page.locator(".region-panel").evaluate((panel) => {
      const statusIcons = [...panel.querySelectorAll<HTMLElement>(".region-status-icon")].map((icon) => {
        const before = getComputedStyle(icon, "::before");
        const after = getComputedStyle(icon, "::after");
        return {
          beforeContent: before.content,
          beforeWidth: Number.parseFloat(before.width),
          beforeHeight: Number.parseFloat(before.height),
          afterContent: after.content,
          afterWidth: Number.parseFloat(after.width),
          afterHeight: Number.parseFloat(after.height)
        };
      });
      const builtCards = [...panel.querySelectorAll<HTMLElement>(".built-card")].map((card) => {
        const cardAfter = getComputedStyle(card, "::after");
        const art = card.querySelector<HTMLElement>(".building-art");
        const artBefore = art ? getComputedStyle(art, "::before") : undefined;
        const artAfter = art ? getComputedStyle(art, "::after") : undefined;
        const artRect = art?.getBoundingClientRect();
        return {
          cardOverflow: Math.max(0, card.scrollWidth - card.clientWidth, card.scrollHeight - card.clientHeight),
          cardAfterContent: cardAfter.content,
          cardAfterWidth: Number.parseFloat(cardAfter.width),
          artWidth: artRect?.width ?? 0,
          artHeight: artRect?.height ?? 0,
          artFilter: art ? getComputedStyle(art).filter : "",
          artBeforeContent: artBefore?.content ?? "",
          artAfterContent: artAfter?.content ?? "",
          artAfterWidth: artAfter ? Number.parseFloat(artAfter.width) : 0
        };
      });
      const lockCards = [...panel.querySelectorAll<HTMLElement>(".locked-slot-card")].map((lock) => {
        const before = getComputedStyle(lock, "::before");
        const lockBody = lock.querySelector<HTMLElement>("i");
        const keyhole = lockBody ? getComputedStyle(lockBody, "::after") : undefined;
        return {
          beforeContent: before.content,
          beforeWidth: Number.parseFloat(before.width),
          keyholeContent: keyhole?.content ?? "",
          keyholeHeight: keyhole ? Number.parseFloat(keyhole.height) : 0
        };
      });
      return { statusIcons, builtCards, lockCards };
    });
    expect(regionSlotMetrics.statusIcons).toHaveLength(3);
    expect(regionSlotMetrics.statusIcons.every((icon) =>
      icon.beforeContent === '""' &&
      icon.afterContent === '""' &&
      icon.beforeWidth > 0 &&
      icon.beforeHeight > 0 &&
      icon.afterWidth > 0 &&
      icon.afterHeight > 0
    )).toBe(true);
    expect(regionSlotMetrics.builtCards.every((card) =>
      card.cardOverflow === 0 &&
      card.cardAfterContent === '""' &&
      card.cardAfterWidth > 0 &&
      card.artWidth >= 58 &&
      card.artHeight >= 48 &&
      card.artFilter.includes("brightness") &&
      card.artBeforeContent === '""' &&
      card.artAfterContent === '""' &&
      card.artAfterWidth > 0
    )).toBe(true);
    expect(regionSlotMetrics.lockCards.every((lock) =>
      lock.beforeContent === '""' &&
      lock.beforeWidth > 0 &&
      lock.keyholeContent === '""' &&
      lock.keyholeHeight > 0
    )).toBe(true);
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
    const alertTextMetrics = await page.locator(".alerts-panel .alert-item").evaluateAll((cards) =>
      cards.map((card) => {
        const main = card.querySelector(".alert-main");
        const title = card.querySelector("strong");
        const icon = card.querySelector(".alert-icon");
        const iconBefore = icon ? getComputedStyle(icon, "::before") : undefined;
        const iconAfter = icon ? getComputedStyle(icon, "::after") : undefined;
        return {
          mainWidthRatio: main ? main.getBoundingClientRect().width / card.getBoundingClientRect().width : 0,
          titleOverflowX: title ? Math.max(0, title.scrollWidth - title.clientWidth) : 0,
          cardOverflowY: Math.max(0, card.scrollHeight - card.clientHeight),
          iconBeforeContent: iconBefore?.content ?? "",
          iconBeforeWidth: iconBefore ? Number.parseFloat(iconBefore.width) : 0,
          iconAfterWidth: iconAfter ? Number.parseFloat(iconAfter.width) : 0
        };
      })
    );
    expect(alertTextMetrics.every((metric) => metric.mainWidthRatio >= 0.66)).toBe(true);
    expect(alertTextMetrics.every((metric) => metric.titleOverflowX === 0)).toBe(true);
    expect(alertTextMetrics.every((metric) => metric.cardOverflowY === 0)).toBe(true);
    expect(alertTextMetrics.every((metric) => !/[!*#]/.test(metric.iconBeforeContent))).toBe(true);
    expect(alertTextMetrics.every((metric) => metric.iconBeforeWidth > 0 && metric.iconAfterWidth > 0)).toBe(true);
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

    await openRegionBuildingsTab(page);
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
    await page.locator('[data-build-category-title="grid"]').click();
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

  test("research tab keeps compact cards readable and scrolls from card surfaces", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.locator('[data-palette-tab="research"]').click();
    await expect(page.locator(".grid-overview-card")).toBeVisible();

    const defaultMetrics = await researchCardReadabilityMetrics(page);
    expect(defaultMetrics.bodyOverflowY).toBe(0);
    expect(defaultMetrics.overviewVisibleInPalette).toBe(true);
    expect(defaultMetrics.cardCount).toBeGreaterThanOrEqual(4);
    expect(defaultMetrics.titleOverflowMax).toBe(0);
    expect(defaultMetrics.cardOverflowMax).toBe(0);
    expect(defaultMetrics.glyphsWithPseudo).toBe(defaultMetrics.cardCount);

    await page.locator('[data-filter-toggle="unavailable-research"]').click();
    await expect(page.locator('[data-research="batteries"]')).toBeVisible();
    const expandedMetrics = await researchCardReadabilityMetrics(page);
    expect(expandedMetrics.titleOverflowMax).toBe(0);
    expect(expandedMetrics.cardOverflowMax).toBe(0);
    expect(expandedMetrics.glyphsWithPseudo).toBe(expandedMetrics.cardCount);

    if (expandedMetrics.bodyOverflowY > 1) {
      await page.locator(".palette-body-research").evaluate((element) => {
        element.scrollTop = 0;
      });
      await page.locator(".research-card").first().hover();
      await page.mouse.wheel(0, 260);
      await page.waitForTimeout(80);
      const scrolledFromCardSurface = await page.locator(".palette-body-research").evaluate((element) => element.scrollTop);
      expect(scrolledFromCardSurface).toBeGreaterThan(0);
    }

    await page.screenshot({ path: testInfo.outputPath("research-compact-readable-scroll.png"), fullPage: true });
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
      game.simulation.selectRegion("fr_nord");
      game.scene.focusRegion("fr_nord");
      game.simulation.setSimulationSpeed(1);
      game.simulation.stepSimulationTime(game.simulation.secondsPerMonth / 2);
      game.hud.render();
      game.scene.renderState();
    });
    await openRegionBuildingsTab(page);
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

  test("construction progress remains monotone when the monthly tick rerenders the HUD", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.state.money = 10000;
      game.simulation.requestBuilding("fr_nord", "energy_research_center");
      game.simulation.selectRegion("fr_nord");
      game.scene.focusRegion("fr_nord");
      game.simulation.setSimulationSpeed(1);
      game.simulation.stepSimulationTime(game.simulation.secondsPerMonth * 0.96);
      game.hud.render();
      game.scene.renderState();
    });
    await openRegionBuildingsTab(page);

    const beforeTick = await progressVariable(page, '[data-progress-kind="construction"]');
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.stepSimulationTime(game.simulation.secondsPerMonth * 0.08);
      game.hud.render();
    });

    const afterRender = await progressVariable(page, '[data-progress-kind="construction"]');
    expect(afterRender).toBeGreaterThanOrEqual(beforeTick - 0.01);
    await page.waitForTimeout(80);
    const afterAnimationFrame = await progressVariable(page, '[data-progress-kind="construction"]');
    expect(afterAnimationFrame).toBeGreaterThanOrEqual(afterRender);
    await page.screenshot({ path: testInfo.outputPath("construction-progress-monotone-after-tick.png"), fullPage: true });
  });

  test("active research progress remains monotone when the monthly tick rerenders the HUD", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await buildCompletedResearchCenter(page, "energy_research_center");
    await page.locator('[data-palette-tab="research"]').click();
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.startResearch("batteries");
      game.simulation.setSimulationSpeed(1);
      game.simulation.stepSimulationTime(game.simulation.secondsPerMonth * 0.96);
      game.hud.render();
    });

    const beforeTick = await researchStatusProgress(page);
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.stepSimulationTime(game.simulation.secondsPerMonth * 0.08);
      game.hud.render();
    });

    const afterRender = await researchStatusProgress(page);
    expect(afterRender).toBeGreaterThanOrEqual(beforeTick - 0.01);
    await page.waitForTimeout(80);
    const afterAnimationFrame = await researchStatusProgress(page);
    expect(afterAnimationFrame).toBeGreaterThanOrEqual(afterRender);
    await page.screenshot({ path: testInfo.outputPath("research-progress-monotone-after-tick.png"), fullPage: true });
  });

  test("month progress patch keeps construction progress DOM stable within a month", async ({ page }) => {
    await openGame(page, 1600, 900);
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.state.money = 10000;
      game.simulation.requestBuilding("fr_nord", "energy_research_center");
      game.simulation.selectRegion("fr_nord");
      game.scene.focusRegion("fr_nord");
      game.simulation.setSimulationSpeed(1);
      game.hud.render();
      game.scene.renderState();
    });
    await openRegionBuildingsTab(page);

    const result = await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return { hasProgress: false, markerKept: false, sameKey: false, progress: 0 };
      }
      const before = document.querySelector<HTMLElement>('[data-progress-kind="construction"]');
      if (!before) {
        return { hasProgress: false, markerKept: false, sameKey: false, progress: 0 };
      }
      before.dataset.stabilityProbe = "kept";
      const key = before.dataset.progressKey;
      game.simulation.stepSimulationTime(game.simulation.secondsPerMonth / 2);
      game.hud.updateVisualProgress();

      const after = document.querySelector<HTMLElement>('[data-progress-kind="construction"]');
      const progress = after ? parseFloat(getComputedStyle(after).getPropertyValue("--progress")) : 0;
      return {
        hasProgress: true,
        markerKept: after?.dataset.stabilityProbe === "kept",
        sameKey: after?.dataset.progressKey === key,
        progress
      };
    });

    expect(result.hasProgress).toBe(true);
    expect(result.markerKept).toBe(true);
    expect(result.sameKey).toBe(true);
    expect(result.progress).toBeGreaterThan(0);
  });

  test("live x1 cadence waits for the 4.8s month threshold", async ({ page }) => {
    await openLiveGame(page, 1600, 900);
    const startMonth = await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return 0;
      }
      game.simulation.newGame("live-cadence");
      game.simulation.selectRegion("fr_nord");
      game.scene.focusRegion("fr_nord");
      game.scene.renderState();
      game.simulation.setSimulationSpeed(1);
      game.hud.render();
      return game.simulation.getSummary().month_index;
    });

    await page.waitForTimeout(4_100);
    const beforeThreshold = await page.evaluate(() => window.__EGRID__?.simulation.getSummary().month_index ?? 0);
    expect(beforeThreshold).toBe(startMonth);

    await page.waitForFunction(
      (month) => (window.__EGRID__?.simulation.getSummary().month_index ?? month) > month,
      startMonth,
      { timeout: 5_000, polling: 100 }
    );
    const afterThreshold = await page.evaluate(() => window.__EGRID__?.simulation.getSummary().month_index ?? 0);
    expect(afterThreshold).toBeGreaterThanOrEqual(startMonth + 1);
  });

  test("speed controls pause immediately and stop month progress", async ({ page }, testInfo) => {
    await openLiveGame(page, 1600, 900);
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.setSimulationSpeed(1);
      game.hud.render();
      game.scene.renderState();
    });
    await expect(page.locator('[data-speed="1"]')).toHaveClass(/is-active/);
    await page.waitForTimeout(260);

    await page.locator('[data-speed="0"]').click();
    await expect(page.locator('[data-speed="0"]')).toHaveClass(/is-active/);
    const pausedState = await page.evaluate(() => {
      const game = window.__EGRID__;
      const summary = game?.simulation.getSummary();
      return {
        paused: summary?.paused,
        running: game?.simulation.isRunning(),
        month: summary?.month_index,
        progress: game?.simulation.getMonthProgress()
      };
    });
    expect(pausedState.paused).toBe(true);
    expect(pausedState.running).toBe(false);

    await page.waitForTimeout(650);
    const afterWait = await page.evaluate(() => {
      const game = window.__EGRID__;
      const summary = game?.simulation.getSummary();
      return {
        month: summary?.month_index,
        progress: game?.simulation.getMonthProgress()
      };
    });
    expect(afterWait.month).toBe(pausedState.month);
    expect(Math.abs((afterWait.progress ?? 0) - (pausedState.progress ?? 0))).toBeLessThan(0.01);
    await page.screenshot({ path: testInfo.outputPath("speed-pause-active.png"), fullPage: true });
  });

  test("month progress updates visual bars without replacing dock DOM nodes", async ({ page }, testInfo) => {
    await openGame(page, 1600, 900);
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.state.money = 10000;
      game.simulation.selectRegion("fr_nord");
      game.simulation.requestBuilding("fr_nord", "university");
      game.simulation.setSimulationSpeed(1);
      game.hud.render();
      game.scene.focusRegion("fr_nord");
      game.scene.renderState();
    });
    await openRegionBuildingsTab(page);

    const before = await page.evaluate(() => {
      const progress = document.querySelector<HTMLElement>('[data-progress-fill="construction"]');
      (window as any).__EGRID_STABLE_NODES__ = {
        palette: document.querySelector(".build-palette"),
        paletteToggle: document.querySelector('[data-action="toggle-palette"]'),
        constructionTab: document.querySelector('[data-palette-tab="construction"]'),
        firstBuildButton: document.querySelector("[data-build]"),
        progress
      };
      return {
        hasProgress: Boolean(progress),
        progress: progress ? parseFloat(getComputedStyle(progress).getPropertyValue("--progress")) : 0
      };
    });
    expect(before.hasProgress).toBe(true);

    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.stepSimulationTime(game.simulation.secondsPerMonth / 2);
      game.hud.updateVisualProgress();
    });

    const after = await page.evaluate(() => {
      const nodes = (window as any).__EGRID_STABLE_NODES__;
      const progress = document.querySelector<HTMLElement>('[data-progress-fill="construction"]');
      return {
        progress: progress ? parseFloat(getComputedStyle(progress).getPropertyValue("--progress")) : 0,
        paletteStable: nodes.palette === document.querySelector(".build-palette"),
        toggleStable: nodes.paletteToggle === document.querySelector('[data-action="toggle-palette"]'),
        tabStable: nodes.constructionTab === document.querySelector('[data-palette-tab="construction"]'),
        buildButtonStable: nodes.firstBuildButton === document.querySelector("[data-build]"),
        progressStable: nodes.progress === progress
      };
    });
    expect(after.progress).toBeGreaterThan(before.progress);
    expect(after.paletteStable).toBe(true);
    expect(after.toggleStable).toBe(true);
    expect(after.tabStable).toBe(true);
    expect(after.buildButtonStable).toBe(true);
    expect(after.progressStable).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("month-progress-dom-stability.png"), fullPage: true });
  });

  test("speed 4 keeps dock clicks reliable across filters tabs categories and build", async ({ page }, testInfo) => {
    await openLiveGame(page, 1600, 900);
    await page.evaluate(() => {
      const game = window.__EGRID__;
      if (!game) {
        return;
      }
      game.simulation.state.money = 10000;
      game.simulation.setSimulationSpeed(4);
      game.hud.render();
    });

    await page.locator('[data-filter-toggle="locked-buildings"]').click();
    await expect(page.locator('[data-build="battery_storage"]')).toBeVisible();
    await page.locator('[data-palette-tab="research"]').click();
    await expect(page.locator('[data-filter-toggle="unavailable-research"]')).toBeVisible();
    await page.locator('[data-filter-toggle="unavailable-research"]').click();
    await expect(page.locator('[data-research="batteries"]')).toBeVisible();
    await page.locator('[data-palette-tab="construction"]').click();
    await page.locator('[data-build-category-title="energy"]').click();
    await page.locator('[data-build="gas_power_plant"]').click();

    const queueLength = await page.evaluate(() =>
      window.__EGRID__?.simulation.getRegionSnapshot("fr_nord")?.construction_queue.length ?? 0
    );
    expect(queueLength).toBeGreaterThan(0);
    await page.screenshot({ path: testInfo.outputPath("speed4-dock-click-regression.png"), fullPage: true });
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

async function openLiveGame(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto("/?seed=p0&onboarding=0");
  await page.waitForFunction(() => Boolean(window.__EGRID__));
  await page.locator("#game-canvas canvas").waitFor({ state: "visible" });
  await page.evaluate(() => {
    window.__EGRID__?.hud.render();
    window.__EGRID__?.scene.renderState();
  });
  await page.waitForTimeout(150);
}

async function openConceptGame(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto("/?testMode=1&seed=p0&scenario=concept&onboarding=0");
  await page.waitForFunction(() => Boolean(window.__EGRID__));
  await page.locator("#game-canvas canvas").waitFor({ state: "visible" });
  await page.evaluate(() => {
    window.__EGRID__?.hud.render();
    window.__EGRID__?.scene.renderState();
  });
  await page.waitForTimeout(150);
}

async function openGameWithOnboarding(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto("/?testMode=1&seed=onboarding&onboarding=1");
  await page.waitForFunction(() => Boolean(window.__EGRID__));
  await page.locator("#game-canvas canvas").waitFor({ state: "visible" });
  await page.evaluate(() => {
    const game = window.__EGRID__;
    if (!game) {
      return;
    }
    localStorage.removeItem("egrid:onboarding:v1:completed");
    game.simulation.state.money = 10000;
    game.hud.render();
    game.scene.renderState();
    game.onboarding.start({ force: true });
  });
  await page.waitForTimeout(150);
}

async function openRegionBuildingsTab(page: Page): Promise<void> {
  await page.locator('[data-region-tab="buildings"]').click();
  await expect(page.locator('[data-region-tab="buildings"]')).toHaveAttribute("aria-selected", "true");
}

async function countRegionsWithMapStructures(page: Page): Promise<number> {
  return page.evaluate(() => {
    const regions = window.__EGRID__?.simulation.getRegionsSnapshot() ?? {};
    return Object.values(regions).filter((region) =>
      region.buildings.length + region.construction_queue.length > 0
    ).length;
  });
}

async function countMapBuildingSprites(page: Page): Promise<number> {
  return page.evaluate(() => {
    const scene = window.__EGRID__?.scene as unknown as {
      children?: {
        list?: unknown[];
      };
    };

    const countTextures = (items: unknown[]): number =>
      items.reduce((total, item) => {
        const child = item as {
          texture?: { key?: string };
          list?: unknown[];
        };
        const ownTexture =
          child.texture?.key === "building-icon-atlas" || child.texture?.key === "building-map-atlas" ? 1 : 0;
        const nestedTextures = Array.isArray(child.list) ? countTextures(child.list) : 0;
        return total + ownTexture + nestedTextures;
      }, 0);

    return countTextures(scene.children?.list ?? []);
  });
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

async function researchCardReadabilityMetrics(page: Page): Promise<{
  bodyOverflowY: number;
  cardCount: number;
  cardOverflowMax: number;
  copyOverflowMax: number;
  glyphsWithPseudo: number;
  overviewVisibleInPalette: boolean;
  titleOverflowMax: number;
}> {
  return page.evaluate(() => {
    const body = document.querySelector<HTMLElement>(".palette-body-research");
    const palette = document.querySelector<HTMLElement>(".build-palette");
    const overview = document.querySelector<HTMLElement>(".grid-overview-card");
    const paletteRect = palette?.getBoundingClientRect();
    const overviewRect = overview?.getBoundingClientRect();
    const cards = [...document.querySelectorAll<HTMLElement>(".research-card")];
    const cardMetrics = cards.map((card) => {
      const title = card.querySelector<HTMLElement>("strong");
      const copy = card.querySelector<HTMLElement>(".research-copy");
      const glyph = card.querySelector<HTMLElement>(".research-card-glyph");
      const glyphBefore = glyph ? getComputedStyle(glyph, "::before") : undefined;
      const glyphAfter = glyph ? getComputedStyle(glyph, "::after") : undefined;
      return {
        cardOverflow: Math.max(0, card.scrollWidth - card.clientWidth, card.scrollHeight - card.clientHeight),
        copyOverflow: copy ? Math.max(0, copy.scrollHeight - copy.clientHeight) : 0,
        glyphHasPseudo:
          glyphBefore?.content === '""' &&
          glyphAfter?.content === '""' &&
          Number.parseFloat(glyphBefore.width) > 0 &&
          Number.parseFloat(glyphAfter.width) > 0,
        titleOverflow: title ? Math.max(0, title.scrollWidth - title.clientWidth) : 0
      };
    });
    return {
      bodyOverflowY: body ? Math.max(0, body.scrollHeight - body.clientHeight) : 0,
      cardCount: cards.length,
      cardOverflowMax: Math.max(0, ...cardMetrics.map((metric) => metric.cardOverflow)),
      copyOverflowMax: Math.max(0, ...cardMetrics.map((metric) => metric.copyOverflow)),
      glyphsWithPseudo: cardMetrics.filter((metric) => metric.glyphHasPseudo).length,
      overviewVisibleInPalette: Boolean(
        overviewRect &&
        paletteRect &&
        overviewRect.top >= paletteRect.top &&
        overviewRect.bottom <= paletteRect.bottom + 1
      ),
      titleOverflowMax: Math.max(0, ...cardMetrics.map((metric) => metric.titleOverflow))
    };
  });
}

async function progressVariable(page: Page, selector: string): Promise<number> {
  return page.locator(selector).first().evaluate((element) =>
    parseFloat(getComputedStyle(element).getPropertyValue("--progress"))
  );
}

async function researchStatusProgress(page: Page): Promise<number> {
  return page.locator(".research-status.is-active").evaluate((element) =>
    parseFloat(getComputedStyle(element).getPropertyValue("--research-progress"))
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

async function expectBuildPaletteNoInternalOverlap(page: Page): Promise<void> {
  const collisions = await page.evaluate(() => {
    const elements = [
      ...document.querySelectorAll<HTMLElement>(".build-category h2"),
      ...document.querySelectorAll<HTMLElement>(".build-card")
    ];
    const rects = elements
      .map((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === "none" || rect.width < 2 || rect.height < 2) {
          return null;
        }
        return {
          selector: `${element.matches("h2") ? "heading" : "card"}:${(element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 32)}`,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        };
      })
      .filter(Boolean) as Rect[];

    const found: string[] = [];
    const intersects = (a: Rect, b: Rect): boolean => {
      const pad = 2;
      return !(
        a.x + a.width <= b.x + pad ||
        b.x + b.width <= a.x + pad ||
        a.y + a.height <= b.y + pad ||
        b.y + b.height <= a.y + pad
      );
    };
    for (let a = 0; a < rects.length; a += 1) {
      for (let b = a + 1; b < rects.length; b += 1) {
        if (intersects(rects[a], rects[b])) {
          found.push(`${rects[a].selector} overlaps ${rects[b].selector}`);
        }
      }
    }
    return found;
  });
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
