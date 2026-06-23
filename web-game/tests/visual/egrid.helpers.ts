import { expect, type Page } from "@playwright/test";

export type Rect = { selector: string; x: number; y: number; width: number; height: number };

export async function openGame(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto("/?testMode=1&seed=p0&lng=fr", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__EGRID__), { timeout: 120_000 });
  await page.locator("#game-canvas canvas").waitFor({ state: "visible" });
  await page.evaluate(() => {
    window.__EGRID__?.hud.render();
    window.__EGRID__?.scene.renderState();
  });
  await page.waitForTimeout(150);
}

export async function expectMapZoomOverlayVisible(page: Page): Promise<void> {
  const zoomText = await findSceneText(page, /^Zoom \d+%$/);
  const resetText = await findSceneText(page, "Reinit.");
  expect(zoomText).toBeTruthy();
  expect(resetText).toBeTruthy();
  if (zoomText && resetText) {
    expect(resetText.x).toBeGreaterThan(zoomText.x);
    expect(resetText.y).toBeGreaterThanOrEqual(zoomText.y - 12);
  }
}

export async function expectMapZoomOverlayHidden(page: Page): Promise<void> {
  expect(await findVisibleSceneText(page, /^Zoom \d+%$/)).toBeUndefined();
  expect(await findVisibleSceneText(page, "Reinit.")).toBeUndefined();
}

export async function findSceneText(
  page: Page,
  matcher: string | RegExp
): Promise<{ text: string; x: number; y: number; width: number; height: number } | undefined> {
  const query =
    typeof matcher === "string"
      ? { kind: "text" as const, value: matcher }
      : { kind: "regex" as const, value: matcher.source, flags: matcher.flags };

  return page.evaluate((textQuery) => {
    const scene = window.__EGRID__?.scene as unknown as {
      children?: {
        list?: unknown[];
      };
    };
    const matches = (value: string): boolean =>
      textQuery.kind === "text" ? value === textQuery.value : new RegExp(textQuery.value, textQuery.flags).test(value);

    const findText = (
      items: unknown[]
    ): { text: string; x: number; y: number; width: number; height: number } | undefined => {
      for (const item of items) {
        const child = item as {
          getBounds?: () => { x: number; y: number; width: number; height: number };
          list?: unknown[];
          text?: string;
        };
        if (typeof child.text === "string" && matches(child.text) && typeof child.getBounds === "function") {
          const bounds = child.getBounds();
          return { text: child.text, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
        }
        if (Array.isArray(child.list)) {
          const nested = findText(child.list);
          if (nested) {
            return nested;
          }
        }
      }
      return undefined;
    };

    return findText(scene.children?.list ?? []);
  }, query);
}

export async function findVisibleSceneText(
  page: Page,
  matcher: string | RegExp
): Promise<{ text: string; x: number; y: number; width: number; height: number } | undefined> {
  const query =
    typeof matcher === "string"
      ? { kind: "text" as const, value: matcher }
      : { kind: "regex" as const, value: matcher.source, flags: matcher.flags };

  return page.evaluate((textQuery) => {
    const scene = window.__EGRID__?.scene as unknown as {
      children?: {
        list?: unknown[];
      };
    };
    const matches = (value: string): boolean =>
      textQuery.kind === "text" ? value === textQuery.value : new RegExp(textQuery.value, textQuery.flags).test(value);

    const isVisible = (child: { visible?: boolean; parentContainer?: unknown }): boolean => {
      if (child.visible === false) {
        return false;
      }
      let parent = child.parentContainer as { visible?: boolean; parentContainer?: unknown } | undefined;
      while (parent) {
        if (parent.visible === false) {
          return false;
        }
        parent = parent.parentContainer as { visible?: boolean; parentContainer?: unknown } | undefined;
      }
      return true;
    };

    const findText = (
      items: unknown[]
    ): { text: string; x: number; y: number; width: number; height: number } | undefined => {
      for (const item of items) {
        const child = item as {
          getBounds?: () => { x: number; y: number; width: number; height: number };
          list?: unknown[];
          parentContainer?: unknown;
          text?: string;
          visible?: boolean;
        };
        if (
          typeof child.text === "string" &&
          matches(child.text) &&
          isVisible(child) &&
          typeof child.getBounds === "function"
        ) {
          const bounds = child.getBounds();
          return { text: child.text, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
        }
        if (Array.isArray(child.list)) {
          const nested = findText(child.list);
          if (nested) {
            return nested;
          }
        }
      }
      return undefined;
    };

    return findText(scene.children?.list ?? []);
  }, query);
}

export async function openLiveGame(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto("/?seed=p0&onboarding=0&lng=fr", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__EGRID__), { timeout: 120_000 });
  await page.locator("#game-canvas canvas").waitFor({ state: "visible" });
  await page.evaluate(() => {
    window.__EGRID__?.hud.render();
    window.__EGRID__?.scene.renderState();
  });
  await page.waitForTimeout(150);
}

export async function openConceptGame(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto("/?testMode=1&seed=p0&scenario=concept&onboarding=0&lng=fr", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__EGRID__), { timeout: 120_000 });
  await page.locator("#game-canvas canvas").waitFor({ state: "visible" });
  await page.evaluate(() => {
    window.__EGRID__?.hud.render();
    window.__EGRID__?.scene.renderState();
  });
  await page.waitForTimeout(150);
}

export async function openGameWithOnboarding(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto("/?testMode=1&seed=onboarding&onboarding=1&lng=fr", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__EGRID__), { timeout: 120_000 });
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

export async function openRegionBuildingsTab(page: Page): Promise<void> {
  await page.locator('[data-region-tab="buildings"]').click();
  await expect(page.locator('[data-region-tab="buildings"]')).toHaveAttribute("aria-selected", "true");
}

export async function expectOnboardingStep(page: Page, stepId: string, targetId: string): Promise<void> {
  await expect(page.locator(`.onboarding-layer[data-onboarding-step="${stepId}"]`)).toBeVisible();
  await expect(page.locator(`.onboarding-layer[data-onboarding-step="${stepId}"]`)).toHaveAttribute(
    "data-onboarding-mode",
    "instruction"
  );
  await expect(page.locator(".onboarding-spotlight.is-attached")).toBeVisible();
  await expectSpotlightCoversTarget(page, targetId);
  await expectCoachDoesNotFullyCoverTarget(page, targetId);
}

export async function expectConsequence(page: Page, stepId: string, text: string): Promise<void> {
  await expect(page.locator(`.onboarding-layer[data-onboarding-step="${stepId}"]`)).toHaveAttribute(
    "data-onboarding-mode",
    "consequence"
  );
  await expect(page.locator(".onboarding-coach")).toContainText("Consequence");
  await expect(page.locator(".onboarding-coach")).toContainText(text);
  await expect(page.locator('[data-onboarding-action="next"]')).toHaveText("Compris");
}

export async function expectSpotlightCoversTarget(page: Page, targetId: string): Promise<void> {
  const metrics = await page.evaluate((target) => {
    const targetElement = document.querySelector<HTMLElement>(`[data-onboarding-target="${target}"]`);
    const spotlight = document.querySelector<HTMLElement>(".onboarding-spotlight.is-attached");
    if (!targetElement || !spotlight) {
      return { ok: false, reason: "missing target or spotlight" };
    }
    const targetRect = targetElement.getBoundingClientRect();
    const spotlightRect = spotlight.getBoundingClientRect();
    const tolerance = 10;
    return {
      ok:
        spotlightRect.left <= targetRect.left + tolerance &&
        spotlightRect.top <= targetRect.top + tolerance &&
        spotlightRect.right >= targetRect.right - tolerance &&
        spotlightRect.bottom >= targetRect.bottom - tolerance,
      target,
      targetRect: { x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height },
      spotlightRect: { x: spotlightRect.x, y: spotlightRect.y, width: spotlightRect.width, height: spotlightRect.height }
    };
  }, targetId);
  expect(metrics).toMatchObject({ ok: true });
}

export async function expectCoachDoesNotFullyCoverTarget(page: Page, targetId: string): Promise<void> {
  const metrics = await page.evaluate((target) => {
    const targetElement = document.querySelector<HTMLElement>(`[data-onboarding-target="${target}"]`);
    const coach = document.querySelector<HTMLElement>(".onboarding-coach");
    if (!targetElement || !coach) {
      return { ok: false, reason: "missing target or coach" };
    }
    const targetRect = targetElement.getBoundingClientRect();
    const coachRect = coach.getBoundingClientRect();
    const horizontal = Math.max(0, Math.min(targetRect.right, coachRect.right) - Math.max(targetRect.left, coachRect.left));
    const vertical = Math.max(0, Math.min(targetRect.bottom, coachRect.bottom) - Math.max(targetRect.top, coachRect.top));
    const targetArea = Math.max(1, targetRect.width * targetRect.height);
    const coveredRatio = (horizontal * vertical) / targetArea;
    return {
      ok: coveredRatio < 0.95,
      coveredRatio,
      target,
      targetRect: { x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height },
      coachRect: { x: coachRect.x, y: coachRect.y, width: coachRect.width, height: coachRect.height }
    };
  }, targetId);
  expect(metrics).toMatchObject({ ok: true });
}

export async function countRegionsWithMapStructures(page: Page): Promise<number> {
  return page.evaluate(() => {
    const regions = window.__EGRID__?.simulation.getRegionsSnapshot() ?? {};
    return Object.values(regions).filter((region) =>
      region.buildings.length + region.construction_queue.length > 0
    ).length;
  });
}

export async function countMapBuildingSprites(page: Page): Promise<number> {
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

export async function buildCompletedResearchCenter(page: Page, buildingId: "energy_research_center" | "ai_research_center"): Promise<void> {
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

export async function regionPanelMetrics(page: Page): Promise<{ tagHeight: number; sectionGap: number }> {
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

export async function researchCardReadabilityMetrics(page: Page): Promise<{
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

export async function progressVariable(page: Page, selector: string): Promise<number> {
  return page.locator(selector).first().evaluate((element) =>
    parseFloat(getComputedStyle(element).getPropertyValue("--progress"))
  );
}

export async function researchStatusProgress(page: Page): Promise<number> {
  return page.locator(".research-status.is-active").evaluate((element) =>
    parseFloat(getComputedStyle(element).getPropertyValue("--research-progress"))
  );
}

export async function expectCanvasNonBlank(page: Page): Promise<void> {
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

export async function expectHudNoMajorOverlap(page: Page): Promise<void> {
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

export async function expectBuildPaletteNoInternalOverlap(page: Page): Promise<void> {
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

export async function createSlotsAlert(page: Page): Promise<void> {
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

export async function expectPointNotCoveredByHud(page: Page, point: { x: number; y: number }): Promise<void> {
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

export function overlaps(a: Rect, b: Rect): boolean {
  const pad = 2;
  return !(
    a.x + a.width <= b.x + pad ||
    b.x + b.width <= a.x + pad ||
    a.y + a.height <= b.y + pad ||
    b.y + b.height <= a.y + pad
  );
}
