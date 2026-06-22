import { createTestI18n } from "../../src/i18n";
import { AlertVisibilityController } from "../../src/ui/hud/alertVisibility";
import { parseHudButtonAction } from "../../src/ui/hud/actions";
import { renderAlertsPanel } from "../../src/ui/hud/alertsPanel";
import { renderConstructionDock } from "../../src/ui/hud/constructionDock";
import { renderRegionPanelShell } from "../../src/ui/hud/regionPanel";
import { renderHeatmapSwitch, renderTopBar } from "../../src/ui/hud/topBar";
import type { Alert } from "../../src/sim";
import { createCore } from "./testData";

describe("HUD pure renderers", () => {
  beforeAll(async () => {
    await createTestI18n("en");
  });

  it("renders top-level HUD selectors and onboarding targets without GameHud", async () => {
    const core = await createCore("hud-renderers");
    const summary = core.getSummary();
    const ctx = {
      heatmapMode: "energy" as const,
      activeDockTab: "construction" as const,
      tooltipAttrs: (title: string, body: string, meta = "") =>
        `data-rich-tooltip="1" data-tooltip-title="${title}" data-tooltip-body="${body}" data-tooltip-meta="${meta}"`
    };

    const markup = [
      renderTopBar(summary, ctx),
      renderHeatmapSwitch(ctx),
      renderRegionPanelShell({
        selectedRegion: core.getRegionSnapshot(),
        buildings: core.getBuildingDefinitions(),
        monthProgress: 0,
        renderRegionPanel: () => `<div class="panel-title">Region body</div>`
      }),
      renderConstructionDock({
        paletteOpen: true,
        activeDockTab: "construction",
        filterToggleMarkup: "",
        bodyMarkup: `<button class="build-card" type="button" data-build="gas_power_plant">Gas</button>`,
        gridOverviewMarkup: `<aside class="grid-overview-card"></aside>`,
        renderContext: ctx
      })
    ].join("");

    expect(markup).toContain('class="top-kpi"');
    expect(markup).toContain('class="resource-summary"');
    expect(markup).toContain('class="region-panel"');
    expect(markup).toContain('class="build-palette is-open"');
    expect(markup).toContain('data-onboarding-target="construction.menu"');
    expect(markup).toContain('data-build="gas_power_plant"');
  });

  it("renders alert item data attributes from alertsPanel", () => {
    const alert: Alert = {
      id: "energy-deficit:fr_nord",
      state: "warning",
      title: "Energy deficit - France Nord",
      body: "Energy imports are weak.",
      actionable: true,
      region_id: "fr_nord",
      autoDismissMs: 0
    };

    const markup = renderAlertsPanel([alert], {
      alertFirstSeen: new Map([[alert.id, Date.now()]]),
      localizedAlertRegionName: () => "France Nord",
      tooltipAttrs: (title: string, body: string, meta = "") =>
        `data-rich-tooltip="1" data-tooltip-title="${title}" data-tooltip-body="${body}" data-tooltip-meta="${meta}"`
    });

    expect(markup).toContain('class="alert-item alert-warning');
    expect(markup).toContain('data-alert="energy-deficit:fr_nord"');
    expect(markup).toContain('data-region="fr_nord"');
  });

  it("parses HUD button dataset into typed actions", () => {
    expect(parseHudButtonAction({ dataset: { build: "gas_power_plant" } } as HTMLButtonElement)).toEqual({
      type: "build",
      buildingId: "gas_power_plant"
    });
    expect(parseHudButtonAction({ dataset: { historyPeriod: "24" } } as HTMLButtonElement)).toEqual({
      type: "history-period",
      period: 24
    });
    expect(parseHudButtonAction({ dataset: { action: "toggle-palette" } } as HTMLButtonElement)).toEqual({
      type: "command",
      command: "toggle-palette"
    });
  });

  it("tracks visible alerts and dismisses them without GameHud state", () => {
    (globalThis as unknown as { window: typeof globalThis }).window = globalThis;
    let changed = 0;
    const visibility = new AlertVisibilityController(() => {
      changed += 1;
    });
    const alert: Alert = {
      id: "slots-saturated:fr_nord",
      priority: 6,
      state: "market_info",
      title: "Slots saturated - France Nord",
      body: "Regional capacity is full.",
      actionable: false,
      region_id: "fr_nord",
      autoDismissMs: 0
    };

    expect(visibility.visibleAlerts([alert])).toEqual([alert]);
    expect(visibility.firstSeen.has(alert.id)).toBe(true);

    visibility.dismiss(alert.id);

    expect(visibility.visibleAlerts([alert])).toEqual([]);
    expect(changed).toBe(1);
  });
});
