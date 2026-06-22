import type { HeatmapMode } from "../game/EGridMapScene";
import { t } from "../i18n";
import type { Alert, BuildAvailability, BuildingDefinition, RegionHistoryPoint, RegionSnapshot, ResearchOption, SimulationCore } from "../sim";

interface HudCallbacks {
  onBuild: (buildingId: string) => void;
  onCancel: (queueIndex: number) => void;
  onDemolish: (buildingIndex: number) => void;
  onStartResearch: (technologyId: string) => void;
  onRemoveQueuedResearch: (queueIndex: number) => void;
  onPromoteQueuedResearch: (queueIndex: number) => void;
  onAdvance: () => void;
  onSpeed: (speed: number) => void;
  onSelectRegion: (regionId: string) => void;
  onHeatmap: (mode: HeatmapMode) => void;
  onReplayOnboarding: () => void;
}

const CATEGORY_ORDER = ["energy", "compute", "cooling", "research", "grid", "storage"];
const ALL_BUILD_CATEGORY = "all";
const ALL_CATEGORIES_DESKTOP_QUERY = "(min-width: 1180px)";
const BUILD_ACCESS_LOCK_CAUSES: Array<NonNullable<BuildAvailability["cause"]>> = [
  "technology",
  "region_tag",
  "region_potential"
];
const RESEARCH_UNAVAILABLE_CAUSES: Array<NonNullable<ResearchOption["lock_cause"]>> = ["prerequisite", "building"];
const ALERT_LOCALIZATION_KEYS: Record<string, { title: string; body: string; action: string }> = {
  "blackout-severe": {
    title: "hud.alerts.titles.blackoutSevere",
    body: "hud.alerts.bodies.localEnergyDeficit",
    action: "hud.alerts.actions.buildLocalProduction"
  },
  "energy-deficit": {
    title: "hud.alerts.titles.energyDeficit",
    body: "hud.alerts.bodies.importsWeak",
    action: "hud.alerts.actions.buildNearbySurplus"
  },
  "cooling-insufficient": {
    title: "hud.alerts.titles.coolingInsufficient",
    body: "hud.alerts.bodies.coolingExceeded",
    action: "hud.alerts.actions.buildCooling"
  },
  "network-saturated": {
    title: "hud.alerts.titles.networkSaturated",
    body: "hud.alerts.bodies.highLossFlows",
    action: "hud.alerts.actions.spreadProduction"
  },
  "slots-saturated": {
    title: "hud.alerts.titles.slotsSaturated",
    body: "hud.alerts.bodies.regionalCapacityFull",
    action: "hud.alerts.actions.chooseAnotherRegion"
  },
  "researchers-insufficient": {
    title: "hud.alerts.titles.researchersInsufficient",
    body: "hud.alerts.bodies.needsExceedCapacity",
    action: "hud.alerts.actions.buildUniversities"
  },
  "co2-elevated": {
    title: "hud.alerts.titles.co2Elevated",
    body: "hud.alerts.bodies.fossilDependence",
    action: "hud.alerts.actions.shiftClean"
  },
  "usa-near-agi": {
    title: "hud.alerts.titles.usaNearAgi",
    body: "hud.alerts.bodies.usCurveAhead",
    action: "hud.alerts.actions.accelerateAi"
  }
};
const EFFECT_VALUE_KEYS: Record<string, string> = {
  "income_bonus=30;energy_demand_pct=-10": "content.effectValues.income_bonus_30_energy_demand_pct_minus_10",
  "distance_efficiency_pct=15;volume_threshold_pct=25": "content.effectValues.distance_efficiency_pct_15_volume_threshold_pct_25",
  "cost_pct=-10;construction_pct=-10;output_pct=15": "content.effectValues.cost_pct_minus_10_construction_pct_minus_10_output_pct_15"
};

const PANEL_STORAGE_KEYS = {
  dockHeight: "egrid:dock-height",
  rightPanelWidth: "egrid:right-panel-width"
};
const DEFAULT_DOCK_HEIGHT = 320;
const DEFAULT_RIGHT_PANEL_WIDTH = 336;
const DOCK_COLLAPSED_HEIGHT = 56;
const MIN_DOCK_HEIGHT = 190;
const MIN_RIGHT_PANEL_WIDTH = 280;
const OVERVIEW_CONSTRUCTION_QUEUE_LIMIT = 2;
const REGION_HISTORY_PERIODS = [6, 12, 24, 48] as const;
const REGION_HISTORY_RESOURCES = ["energy", "cooling", "compute"] as const;

type ResizeTarget = "dock" | "region";
type RegionPanelTab = "overview" | "buildings" | "stats";
type RegionHistoryPeriod = typeof REGION_HISTORY_PERIODS[number];
type RegionHistoryResource = typeof REGION_HISTORY_RESOURCES[number];
type QueueProgressItem = { building_id: string; months_remaining: number; total_months: number };
type ProgressCssVar = "--progress" | "--research-progress";

interface PendingProgressAnimation {
  key: string;
  cssVar: ProgressCssVar;
  target: number;
}

export class GameHud {
  private readonly root: HTMLElement;
  private readonly simulation: SimulationCore;
  private readonly callbacks: HudCallbacks;
  private heatmapMode: HeatmapMode = "energy";
  private paletteOpen = !window.matchMedia("(max-width: 720px)").matches;
  private activeDockTab: "construction" | "research" = "construction";
  private activeRegionTab: RegionPanelTab = "overview";
  private activeRegionHistoryPeriod: RegionHistoryPeriod = 12;
  private activeRegionHistoryResource: RegionHistoryResource = "energy";
  private activeBuildCategory = ALL_BUILD_CATEGORY;
  private showLockedBuildings = false;
  private showUnavailableResearch = false;
  private readonly paletteScroll: Record<string, { top: number; left: number }> = {
    construction: { top: 0, left: 0 },
    research: { top: 0, left: 0 }
  };
  private dockHeight = DEFAULT_DOCK_HEIGHT;
  private rightPanelWidth = DEFAULT_RIGHT_PANEL_WIDTH;
  private resizeDrag:
    | {
        target: ResizeTarget;
        startX: number;
        startY: number;
        startDockHeight: number;
        startRightPanelWidth: number;
      }
    | null = null;
  private readonly dismissedAlerts = new Set<string>();
  private readonly alertFirstSeen = new Map<string, number>();
  private readonly alertTimers = new Map<string, number>();
  private readonly visualProgress = new Map<string, number>();
  private pendingProgressAnimations: PendingProgressAnimation[] = [];
  private progressAnimationFrame: number | null = null;
  private tooltipElement?: HTMLElement;
  private tooltipTrigger?: HTMLElement;
  private tooltipSuppressedUntil = 0;

  constructor(root: HTMLElement, simulation: SimulationCore, callbacks: HudCallbacks) {
    this.root = root;
    this.simulation = simulation;
    this.callbacks = callbacks;
    this.dockHeight = this.clampDockHeight(this.loadStoredNumber(PANEL_STORAGE_KEYS.dockHeight, DEFAULT_DOCK_HEIGHT));
    this.rightPanelWidth = this.clampRightPanelWidth(
      this.loadStoredNumber(PANEL_STORAGE_KEYS.rightPanelWidth, DEFAULT_RIGHT_PANEL_WIDTH)
    );
    this.root.addEventListener("click", (event) => this.handleClick(event));
    this.root.addEventListener("pointerdown", (event) => this.handlePointerDown(event));
    this.root.addEventListener("pointerover", (event) => this.handleTooltipOver(event));
    this.root.addEventListener("pointermove", (event) => this.handleTooltipMove(event));
    this.root.addEventListener("pointerout", (event) => this.handleTooltipOut(event));
    this.root.addEventListener("focusin", (event) => this.handleTooltipFocus(event));
    this.root.addEventListener("focusout", () => this.hideTooltip());
    this.root.addEventListener("dblclick", (event) => this.handleDoubleClick(event));
    this.root.addEventListener("wheel", (event) => this.handleWheel(event), { passive: false });
    window.addEventListener("resize", () => this.handleViewportResize());
  }

  render(): void {
    this.capturePaletteScroll();
    this.captureVisualProgressFromDom();
    this.pendingProgressAnimations = [];
    const summary = this.simulation.getSummary();
    const selectedRegion = this.simulation.getRegionSnapshot();
    const buildings = this.simulation.getBuildingDefinitions();
    const availability = this.simulation.getBuildAvailability();
    const researchOptions = this.simulation.getResearchOptions();
    const alerts = this.visibleAlerts(summary.alerts);
    const monthProgress = summary.month_progress ?? 0;
    this.ensureActiveBuildCategory(buildings);
    this.applyPanelSizing();

    this.root.innerHTML = `
      <section class="top-kpi" aria-label="${escapeHtml(t("hud.aria.indicators"))}" data-onboarding-target="kpi.bar">
        ${this.topBrand()}
        ${this.agiDuel(summary.eu_agi_progress, summary.usa_agi_progress)}
        ${this.budgetKpi(summary)}
        ${this.dateKpi(summary)}
        ${this.resourceSummary(summary)}
        ${this.timeControls(summary)}
        ${this.topMenuCommand()}
      </section>

      <section class="heatmap-switch" aria-label="${escapeHtml(t("hud.aria.heatmaps"))}" data-onboarding-target="overlay.switch">
        ${this.heatmapButton("energy")}
        ${this.heatmapButton("cooling")}
        ${this.heatmapButton("network")}
        ${this.heatmapButton("compute")}
        ${this.heatmapButton("co2")}
        ${this.heatmapButton("none")}
      </section>

      <section class="alerts-panel" aria-label="${escapeHtml(t("hud.aria.alerts"))}" data-onboarding-target="alerts.panel">
        ${alerts.length === 0 ? `<span class="alert-empty">${escapeHtml(t("hud.alerts.noActive"))}</span>` : alerts.map((alert) => `
          ${this.alertCard(alert)}
        `).join("")}
        ${alerts.length > 0 ? `<button class="alerts-collapse" type="button" data-action="dismiss-all-alerts" title="${escapeHtml(t("hud.alerts.hide"))}">v</button>` : ""}
      </section>

      <section class="region-panel" aria-label="${escapeHtml(t("hud.aria.selectedRegion"))}" data-onboarding-target="region.panel">
        <div class="region-resize-handle" data-resize-panel="region" title="${escapeHtml(t("hud.region.resizeRight"))}"></div>
        ${selectedRegion ? this.regionPanel(selectedRegion, buildings, monthProgress) : `<div class="panel-title">${escapeHtml(t("hud.panels.selectedRegionFallback"))}</div>`}
      </section>

      <section class="build-palette ${this.paletteOpen ? "is-open" : ""}" aria-label="${escapeHtml(t("hud.aria.construction"))}" data-onboarding-target="construction.menu">
        <div class="dock-resize-handle" data-resize-panel="dock" title="${escapeHtml(t("hud.dock.resizeBottom"))}"></div>
        <div class="palette-header">
          <button class="palette-toggle" type="button" data-action="toggle-palette">
            <span>${escapeHtml(this.paletteOpen ? t("hud.dock.close") : t("hud.dock.build"))}</span>
          </button>
          <div class="palette-tabs" role="tablist" aria-label="${escapeHtml(t("hud.dock.panel"))}">
            ${this.paletteTab("construction", t("hud.panels.construction"))}
            ${this.paletteTab("research", t("hud.panels.research"))}
          </div>
          ${this.paletteOpen ? this.activeDockFilterToggle() : ""}
        </div>
        <div class="palette-body palette-body-${this.activeDockTab}" data-scroll-key="${this.activeDockTab}">
          ${this.activeDockTab === "construction"
            ? this.constructionPanel(buildings, availability)
            : this.researchPanel(researchOptions, buildings, monthProgress)}
        </div>
        ${this.gridOverviewCard(summary)}
      </section>
    `;
    this.restorePaletteScroll();
    this.applyPendingProgressAnimations();
  }

  updateVisualProgress(monthProgressOverride?: number): void {
    const summary = this.simulation.getSummary();
    const monthProgress = monthProgressOverride ?? summary.month_progress ?? 0;
    const selectedRegion = this.simulation.getRegionSnapshot();
    if (selectedRegion) {
      selectedRegion.construction_queue.forEach((item, index) => {
        this.patchProgressValue(
          this.queueProgressKey("construction", selectedRegion.id, index, item),
          this.visualQueueProgress(item, monthProgress),
          "--progress"
        );
      });
      selectedRegion.deconstruction_queue.forEach((item, index) => {
        this.patchProgressValue(
          this.queueProgressKey("demolition", selectedRegion.id, index, item),
          this.visualQueueProgress(item, monthProgress),
          "--progress"
        );
      });
    }

    const researchOptions = this.simulation.getResearchOptions();
    const active = researchOptions.find((option) => option.status === "active");
    if (active) {
      const activeProgress = this.visualResearchProgress(active, monthProgress);
      const activePoints = this.visualResearchPoints(active, monthProgress);
      const activeKey = this.activeResearchProgressKey(active);
      this.patchProgressValue(activeKey, activeProgress, "--research-progress");
      const activeElement = this.findProgressElement(activeKey);
      const activeCopy = activeElement?.querySelector<HTMLElement>("[data-research-active-copy]");
      if (activeCopy) {
        activeCopy.textContent =
          `${fmt(activeProgress)}% - ${fmt(activePoints)}/${fmt(active.cost)} ${t("common.units.points")} - ` +
          `${t("hud.researchPanel.etaShort")} ${this.researchEta(active)} - +${fmt(active.monthly_points)} ${t("common.units.points")}/${t("hud.kpi.monthSuffix")}`;
      }
    }

    for (const option of researchOptions) {
      this.patchProgressValue(
        this.researchCardProgressKey(option),
        this.visualResearchProgress(option, monthProgress),
        "--progress"
      );
    }
  }

  setHeatmapMode(mode: HeatmapMode): void {
    this.heatmapMode = mode;
  }

  openConstructionCategory(category = ALL_BUILD_CATEGORY): void {
    this.capturePaletteScroll();
    this.paletteOpen = true;
    this.activeDockTab = "construction";
    this.activeBuildCategory = this.showsAllConstructionCategoriesByDefault() ? ALL_BUILD_CATEGORY : category;
    this.render();
  }

  openResearchPanel(): void {
    this.capturePaletteScroll();
    this.paletteOpen = true;
    this.activeDockTab = "research";
    this.render();
  }

  private resourceSummary(summary: ReturnType<SimulationCore["getSummary"]>): string {
    const energyBalance = summary.energy_produced - summary.energy_consumed;
    const coolingBalance = summary.cooling_available - summary.cooling_used;
    const compute = summary.compute_produced;
    const tooltip = t("hud.resources.tooltip", {
      energyProduced: fmt(summary.energy_produced),
      energyConsumed: fmt(summary.energy_consumed),
      coolingAvailable: fmt(summary.cooling_available),
      coolingUsed: fmt(summary.cooling_used),
      compute: fmt(compute),
      co2Tier: summary.co2_tier
    });
    return `
      <section class="resource-summary" aria-label="${escapeHtml(t("hud.aria.resources"))}" data-onboarding-target="kpi.resources" ${this.tooltipAttrs(t("hud.resources.title"), tooltip, t("hud.resources.meta"))}>
        <div class="resource-pill resource-energy">
          <span>${escapeHtml(t("hud.resources.energy"))}</span>
          <strong>${escapeHtml(fmt(energyBalance))}</strong>
          <small>${escapeHtml(fmt(summary.energy_produced))}/${escapeHtml(fmt(summary.energy_consumed))}</small>
        </div>
        <div class="resource-pill resource-cooling">
          <span>${escapeHtml(t("hud.resources.cooling"))}</span>
          <strong>${escapeHtml(fmt(coolingBalance))}</strong>
          <small>${escapeHtml(fmt(summary.cooling_available))}/${escapeHtml(fmt(summary.cooling_used))}</small>
        </div>
        <div class="resource-pill resource-compute">
          <span>${escapeHtml(t("hud.resources.compute"))}</span>
          <strong>${escapeHtml(fmt(compute))}</strong>
          <small>${escapeHtml(t("hud.resources.productionShort"))}</small>
        </div>
        <div class="resource-pill resource-co2">
          <span>${escapeHtml(t("hud.resources.co2"))}</span>
          <strong>${escapeHtml(summary.co2_tier)}</strong>
          <small>${escapeHtml(t("common.units.tier"))}</small>
        </div>
      </section>
    `;
  }

  private topBrand(): string {
    return `
      <div class="top-brand" ${this.tooltipAttrs(t("hud.brand.title"), t("hud.brand.tooltip"), t("hud.brand.meta"))}>
        <strong>${escapeHtml(t("hud.brand.title"))}</strong>
        <span>${escapeHtml(t("hud.brand.tagline"))}</span>
      </div>
    `;
  }

  private budgetKpi(summary: ReturnType<SimulationCore["getSummary"]>): string {
    const trend = summary.monthly_income >= 0 ? "+" : "-";
    const body = t("hud.kpi.budgetTooltip", {
      money: moneyBillions(summary.money),
      trend,
      income: moneyBillions(Math.abs(summary.monthly_income))
    });
    return `
      <div class="kpi-chip kpi-budget" data-onboarding-target="kpi.money" ${this.tooltipAttrs(t("hud.kpi.budget"), body, t("hud.kpi.budgetMeta"))}>
        <span>${escapeHtml(t("hud.kpi.budget"))}</span>
        <strong>${escapeHtml(moneyBillions(summary.money))}</strong>
        <small>${trend}${escapeHtml(moneyBillions(Math.abs(summary.monthly_income)))} / ${escapeHtml(t("hud.kpi.monthSuffix"))}</small>
      </div>
    `;
  }

  private dateKpi(summary: ReturnType<SimulationCore["getSummary"]>): string {
    const week = Math.max(1, Math.min(52, summary.month * 4));
    const body = t("hud.kpi.dateTooltip", { date: summary.date_text, week });
    return `
      <div class="kpi-chip kpi-date" data-onboarding-target="kpi.date" ${this.tooltipAttrs(t("hud.kpi.date"), body, t("hud.kpi.dateMeta"))}>
        <span>${escapeHtml(t("hud.kpi.date"))}</span>
        <strong>${escapeHtml(summary.date_text)}</strong>
        <small>${escapeHtml(t("hud.kpi.week", { week }))}</small>
      </div>
    `;
  }

  private agiDuel(europeProgress: number, usaProgress: number): string {
    const eu = clampPctFloat(europeProgress);
    const usa = clampPctFloat(usaProgress);
    const delta = eu - usa;
    const meta = delta >= 0
      ? t("hud.agi.leadMeta", { side: t("hud.agi.europe"), points: fmt(delta) })
      : t("hud.agi.leadMeta", { side: t("hud.agi.usa"), points: fmt(Math.abs(delta)) });
    return `
      <section class="agi-duel" aria-label="${escapeHtml(t("hud.agi.aria"))}" data-onboarding-target="kpi.agi" ${this.tooltipAttrs(t("hud.agi.title"), t("hud.agi.body", { eu: fmt(eu), usa: fmt(usa) }), meta)}>
        <div class="agi-side agi-side-europe">
          <span>${escapeHtml(t("hud.agi.progress"))}</span>
          <strong>${escapeHtml(t("hud.agi.europe"))}</strong>
          <i></i>
        </div>
        <div class="agi-ring agi-ring-europe" style="--agi-progress:${eu}">
          <span class="agi-ticks" aria-hidden="true">${this.agiRingTicks(eu)}</span>
          <b>${fmt(eu)}%</b>
        </div>
        <em>${escapeHtml(t("hud.agi.versus"))}</em>
        <div class="agi-ring agi-ring-usa" style="--agi-progress:${usa}">
          <span class="agi-ticks" aria-hidden="true">${this.agiRingTicks(usa)}</span>
          <b>${fmt(usa)}%</b>
        </div>
        <div class="agi-side agi-side-usa">
          <span>${escapeHtml(t("hud.agi.rival"))}</span>
          <strong>${escapeHtml(t("hud.agi.usa"))}</strong>
          <i></i>
        </div>
      </section>
    `;
  }

  private agiRingTicks(progress: number): string {
    const tickCount = 48;
    const activeTicks = Math.round((clampPctFloat(progress) / 100) * tickCount);
    return Array.from({ length: tickCount }, (_, index) => {
      const active = index < activeTicks ? " is-active" : "";
      return `<i class="${active}" style="--tick-angle:${fmt((360 / tickCount) * index, 2)}deg"></i>`;
    }).join("");
  }

  private timeControls(summary: ReturnType<SimulationCore["getSummary"]>): string {
    return `
      <div class="time-controls time-controls-concept" aria-label="${escapeHtml(t("hud.time.speed"))}" ${this.tooltipAttrs(t("hud.time.speed"), t("hud.time.tooltip"), t("hud.time.meta"))}>
        <span class="time-controls-label">${escapeHtml(t("hud.time.speed"))}</span>
        ${this.conceptSpeedButton(0, summary.simulation_speed === 0, "||", t("common.actions.pause"))}
        ${this.conceptSpeedButton(1, summary.simulation_speed === 1, "&#9654;", t("common.actions.play"))}
        ${this.conceptSpeedButton(2, summary.simulation_speed === 2, "&#9654;&#9654;", t("common.actions.fastForward"))}
        ${this.conceptSpeedButton(4, summary.simulation_speed === 4, "&#9654;&#9654;&#9654;", t("common.actions.maximumSpeed"))}
        ${this.speedReadout(summary.simulation_speed)}
      </div>
    `;
  }

  private conceptSpeedButton(speed: number, active: boolean, label: string, title: string): string {
    return `<button class="speed-button ${active ? "is-active" : ""}" type="button" data-speed="${speed}" title="${escapeHtml(title)}">${label}</button>`;
  }

  private speedReadout(speed: number): string {
    const safeSpeed = Number.isFinite(speed) ? Math.max(0, speed) : 0;
    const speedLabel = t("common.units.speedMultiplier", { value: fmt(safeSpeed, 1) });
    const title = safeSpeed <= 0 ? t("hud.time.paused") : t("hud.time.realSpeed", { speed: speedLabel });
    return `<button class="speed-readout" type="button" data-speed-readout="${fmt(safeSpeed, 1)}" title="${escapeHtml(title)}">${speedLabel}</button>`;
  }

  private topMenuCommand(): string {
    return `
      <button class="top-menu-command" type="button" data-action="replay-onboarding" data-onboarding-target="onboarding.replay" ${this.tooltipAttrs(t("hud.menu.title"), t("hud.menu.body"), t("hud.menu.meta"))}>
        <span></span><span></span><span></span>
      </button>
    `;
  }

  private heatmapButton(mode: HeatmapMode): string {
    const tooltip = this.heatmapTooltip(mode);
    return `<button class="heatmap-button ${this.heatmapMode === mode ? "is-active" : ""}" type="button" data-heatmap="${mode}" data-onboarding-target="overlay.${mode}" aria-label="${escapeHtml(tooltip.title)}" title="${escapeHtml(tooltip.title)}" ${this.tooltipAttrs(tooltip.title, tooltip.body, tooltip.meta)}>${escapeHtml(tooltip.shortLabel)}</button>`;
  }

  private heatmapTooltip(mode: HeatmapMode): { title: string; body: string; meta: string; shortLabel: string } {
    return {
      title: t(`hud.heatmaps.${mode}.label`),
      body: t(`hud.heatmaps.${mode}.body`),
      meta: t(`hud.heatmaps.${mode}.meta`),
      shortLabel: t(`hud.heatmaps.${mode}.short`)
    };
  }

  private paletteTab(tab: "construction" | "research", label: string): string {
    const active = this.activeDockTab === tab;
    return `<button class="palette-tab ${active ? "is-active" : ""}" type="button" data-palette-tab="${tab}" data-onboarding-target="palette.${tab}" role="tab" aria-selected="${active}">${label}</button>`;
  }

  private alertCard(alert: Alert): string {
    const elapsed = this.alertFirstSeen.has(alert.id) ? Math.max(0, Date.now() - (this.alertFirstSeen.get(alert.id) ?? Date.now())) : 0;
    const progress = alert.autoDismissMs > 0
      ? `<i class="alert-life" style="--alert-life:${alert.autoDismissMs}ms; --alert-elapsed:${elapsed}ms"></i>`
      : "";
    const localized = this.localizedAlert(alert);
    return `
      <article class="alert-item alert-${alert.state} alert-kind-${this.alertKind(alert)} ${alert.actionable ? "is-actionable" : "is-info"}" data-alert="${escapeHtml(alert.id)}">
        <span class="alert-icon" aria-hidden="true"></span>
        <button class="alert-main" type="button" ${alert.region_id ? `data-region="${escapeHtml(alert.region_id)}"` : ""} ${this.tooltipAttrs(localized.title, localized.body, alert.actionable ? t("hud.alerts.focusRegion") : t("hud.alerts.systemInfo"))}>
          <strong>${escapeHtml(localized.title)}</strong>
          <span>${escapeHtml(localized.body)}</span>
        </button>
        <button class="alert-action" type="button" ${alert.region_id ? `data-region="${escapeHtml(alert.region_id)}"` : ""} title="${escapeHtml(this.alertActionTitle(alert))}">${escapeHtml(this.alertActionLabel(alert))}</button>
        <button class="alert-dismiss" type="button" data-dismiss-alert="${escapeHtml(alert.id)}" title="${escapeHtml(t("hud.alerts.close"))}">x</button>
        ${progress}
      </article>
    `;
  }

  private alertKind(alert: Alert): string {
    const text = `${alert.id} ${alert.title} ${alert.body}`.toLowerCase();
    if (text.includes("research")) {
      return "research";
    }
    if (text.includes("cooling") || text.includes("froid")) {
      return "cooling";
    }
    if (text.includes("network") || text.includes("grid") || text.includes("saturated")) {
      return "network";
    }
    if (text.includes("market") || text.includes("budget")) {
      return "market";
    }
    return "warning";
  }

  private alertActionLabel(alert: Alert): string {
    const kind = this.alertKind(alert);
    if (kind === "research") {
      return t("hud.alerts.claim");
    }
    return alert.actionable ? t("hud.alerts.view") : t("hud.alerts.info");
  }

  private alertActionTitle(alert: Alert): string {
    const title = this.localizedAlert(alert).title;
    return this.alertActionLabel(alert) === t("hud.alerts.view") ? t("hud.alerts.viewTitle", { title }) : title;
  }

  private localizedAlert(alert: Alert): { title: string; body: string } {
    const [, rawRegionName] = alert.title.split(" - ");
    const keys = ALERT_LOCALIZATION_KEYS[alert.id.split(":")[0] ?? ""];
    if (!keys) {
      return { title: alert.title, body: alert.body };
    }
    const regionName = this.localizedAlertRegionName(alert, rawRegionName);
    const title = [t(keys.title), regionName].filter(Boolean).join(" - ");
    const body = `${t(keys.body)} -> ${t(keys.action)}`;
    return { title, body };
  }

  private localizedAlertRegionName(alert: Alert, fallback = ""): string {
    if (alert.region_id) {
      const region = this.simulation.getRegionSnapshot(alert.region_id);
      return region ? this.regionName(region) : fallback;
    }
    if (fallback === "Europe") {
      return t("hud.agi.europe");
    }
    if (fallback === "Global") {
      return t("hud.alerts.global");
    }
    return fallback;
  }

  private regionPanel(region: RegionSnapshot, buildings: Record<string, BuildingDefinition>, monthProgress: number): string {
    const cached = region.cached;
    const levelXp = Math.min(2000, Math.round((region.buildings.length * 110 + region.tags.length * 40) / 10) * 10);
    const regionLevel = Math.max(1, Math.min(9, Math.floor(levelXp / 400) + 1));
    const levelPct = (levelXp / 2000) * 100;
    const queueCards = region.construction_queue.length === 0
      ? `<span class="empty-slot-card">${escapeHtml(t("hud.region.noConstruction"))}</span>`
      : region.construction_queue
        .map((item, index) => this.queueCard(region.id, item, index, buildings[item.building_id], monthProgress))
        .join("");
    const overviewQueueCards = this.overviewQueueCards(region, buildings, monthProgress);
    const demolitionCards = region.deconstruction_queue.length === 0
      ? `<span class="empty-slot-card">${escapeHtml(t("hud.region.noDemolition"))}</span>`
      : region.deconstruction_queue
        .map((item, index) => this.demolitionCard(region.id, item, index, buildings[item.building_id], monthProgress))
        .join("");
    const builtCards = region.buildings.length === 0
      ? `<span class="empty-slot-card">${escapeHtml(t("hud.region.noAssets"))}</span>`
      : region.buildings
        .map((id, index) => this.builtCard(id, buildings[id], index))
        .join("");
    const energyProduction = cached.energy_production ?? 0;
    const energyDemand = cached.energy_consumption ?? 0;
    const energyReserve = Math.max(0, energyProduction + (cached.energy_imported ?? 0) - energyDemand);
    const energyExported = cached.energy_exported ?? 0;
    const energyBalance = energyProduction - energyDemand;
    const energyLocalPct = this.localBalancePct(energyProduction, energyDemand);
    const coolingAvailable = cached.cooling_available ?? 0;
    const coolingUsed = cached.cooling_used ?? 0;
    const coolingReserve = Math.max(0, coolingAvailable - coolingUsed);
    const coolingExported = cached.cooling_exported ?? coolingReserve;
    const coolingBalance = coolingAvailable - coolingUsed;
    const coolingLocalPct = this.localBalancePct(coolingAvailable, coolingUsed);
    const computeDemand = cached.compute_demand ?? 0;
    const computeSupply = cached.compute_produced ?? 0;
    const computeDeficit = Math.max(0, computeDemand - computeSupply);
    const computeExported = cached.compute_exported ?? Math.max(0, computeSupply - computeDemand);
    const computeBalance = computeSupply - computeDemand;
    const computePct = this.localBalancePct(computeSupply, computeDemand);
    const energyUnit = t("common.units.gigawatts");
    const coolingUnit = t("common.units.thermalGigawatts");
    const computeUnit = t("common.units.eflops");
    const energyStatusMetrics = this.regionResourceStatusMetrics(energyProduction, energyDemand, energyExported, energyBalance, energyUnit);
    const coolingStatusMetrics = this.regionResourceStatusMetrics(coolingAvailable, coolingUsed, coolingExported, coolingBalance, coolingUnit);
    const computeStatusMetrics = this.regionResourceStatusMetrics(computeSupply, computeDemand, computeExported, computeBalance, computeUnit);
    const regionName = this.regionName(region);

    const overviewContent = `
      <div class="region-tags">
        ${region.tags.slice(0, 6).map((tag) => `<span>${escapeHtml(this.localizedRegionTag(tag))}</span>`).join("")}
      </div>
      <div class="region-section region-buildings">
        <div class="panel-subtitle"><span>${escapeHtml(t("hud.region.buildingSlots"))}</span><strong>${region.slots_used}/${region.slots_max}</strong></div>
        <div class="built-grid">
          ${builtCards}
        </div>
      </div>
      <div class="region-section region-queue">
        <div class="panel-subtitle"><span>${escapeHtml(t("hud.region.constructionSite"))}</span><strong>${region.construction_queue.length}</strong></div>
        <div class="queue-list">
          ${overviewQueueCards}
        </div>
      </div>
      <div class="region-status-stack">
        ${this.regionStatusBlock("energy", t("hud.region.energy"), energyLocalPct, energyStatusMetrics, energyBalance < 0)}
        ${this.regionStatusBlock("cooling", t("hud.region.cooling"), coolingLocalPct, coolingStatusMetrics, coolingBalance < 0)}
        ${this.regionStatusBlock("compute", t("hud.region.compute"), computePct, computeStatusMetrics, computeBalance < 0)}
      </div>
    `;
    const buildingsContent = `
      <div class="region-section region-buildings">
        <div class="panel-subtitle"><span>${escapeHtml(t("hud.region.buildingSlots"))}</span><strong>${region.slots_used}/${region.slots_max}</strong></div>
        <div class="built-grid">
          ${builtCards}
        </div>
      </div>
      <div class="region-section region-queue">
        <div class="panel-subtitle"><span>${escapeHtml(t("hud.region.constructionSite"))}</span><strong>${region.construction_queue.length}</strong></div>
        <div class="queue-list">
          ${queueCards}
        </div>
      </div>
      <div class="region-section region-demolition">
        <div class="panel-subtitle"><span>${escapeHtml(t("hud.region.demolition"))}</span><strong>${region.deconstruction_queue.length}</strong></div>
        <div class="queue-list">
          ${demolitionCards}
        </div>
      </div>
      ${this.regionManageButton(region)}
    `;
    const statsContent = `
      <div class="region-stats-grid">
        ${this.regionStatTile(t("hud.region.slots"), `${region.slots_used}/${region.slots_max}`, t("hud.region.free", { count: Math.max(0, region.slots_max - region.slots_used) }))}
        ${this.regionStatTile(t("hud.region.levelXp"), `${fmt(levelXp)}`, t("hud.region.level", { level: regionLevel }))}
        ${this.regionStatTile(t("hud.region.energyReserve"), `${fmt(energyReserve, 1)} ${escapeHtml(energyUnit)}`, t("hud.region.producedShort", { value: fmt(energyProduction, 1) }))}
        ${this.regionStatTile(t("hud.region.coolingReserve"), `${fmt(coolingReserve, 1)} ${escapeHtml(coolingUnit)}`, t("hud.region.capacityShort", { value: fmt(coolingAvailable, 1) }))}
        ${this.regionStatTile(computeDeficit > 0 ? t("hud.region.computeDeficit") : t("hud.region.computeReserve"), `${fmt(computeDeficit > 0 ? computeDeficit : computeSupply - computeDemand, 1)} ${escapeHtml(computeUnit)}`, t("hud.region.supplyShort", { value: fmt(computeSupply, 1) }))}
        ${this.regionStatTile(t("hud.region.tags"), `${region.tags.length}`, this.localizedRegionTags(region.tags, 2) || t("hud.region.none"))}
      </div>
      <div class="region-status-stack">
        ${this.regionStatusBlock("energy", t("hud.region.energy"), energyLocalPct, energyStatusMetrics, energyBalance < 0)}
        ${this.regionStatusBlock("cooling", t("hud.region.cooling"), coolingLocalPct, coolingStatusMetrics, coolingBalance < 0)}
        ${this.regionStatusBlock("compute", t("hud.region.compute"), computePct, computeStatusMetrics, computeBalance < 0)}
      </div>
      ${this.regionHistoryChart(region)}
    `;
    const tabContent = this.activeRegionTab === "buildings"
      ? buildingsContent
      : this.activeRegionTab === "stats"
        ? statsContent
        : overviewContent;

    return `
      <div class="panel-title region-title">
        <div>
          <span>${escapeHtml(t("hud.region.region"))}</span>
          <strong>${escapeHtml(regionName)}</strong>
        </div>
        <span class="region-close" aria-hidden="true">x</span>
      </div>
      <div class="region-level-card">
        <strong>${regionLevel}</strong>
        <div>
          <span>${escapeHtml(t("hud.region.regionLevel"))}</span>
          <i style="--meter:${clampPctFloat(levelPct)}%"></i>
        </div>
        <small>${fmt(levelXp)} / 2 000 ${escapeHtml(t("common.units.experiencePoints"))}</small>
      </div>
      <div class="region-tabs" role="tablist" aria-label="${escapeHtml(t("hud.region.views"))}">
        ${this.regionTabButton("overview", t("hud.panels.overview"), t("hud.region.overviewTooltip"), t("hud.region.overviewBody"))}
        ${this.regionTabButton("buildings", t("hud.panels.buildings"), t("hud.region.buildingsTooltip"), t("hud.region.buildingsBody"))}
        ${this.regionTabButton("stats", t("hud.panels.stats"), t("hud.region.statsTooltip"), t("hud.region.statsBody"))}
      </div>
      <div class="region-tab-view region-tab-${this.activeRegionTab}">
        ${tabContent}
      </div>
    `;
  }

  private regionTabButton(tab: RegionPanelTab, label: string, title: string, body: string): string {
    const active = this.activeRegionTab === tab;
    return `
      <button class="${active ? "is-active" : ""}" type="button" role="tab" data-region-tab="${tab}" aria-selected="${active}" ${this.tooltipAttrs(title, body, active ? t("hud.region.active") : t("hud.region.changeView"))}>
        ${escapeHtml(label)}
      </button>
    `;
  }

  private regionManageButton(region: RegionSnapshot): string {
    return `
      <button class="region-manage-button" type="button" data-action="open-construction" ${this.tooltipAttrs(t("hud.region.manage"), t("hud.region.manageTooltip", { region: this.regionName(region) }), t("hud.region.freeSlots", { count: region.slots_max - region.slots_used }))}>
        ${escapeHtml(t("hud.region.manage"))}
      </button>
    `;
  }

  private overviewQueueCards(
    region: RegionSnapshot,
    buildings: Record<string, BuildingDefinition>,
    monthProgress: number
  ): string {
    if (region.construction_queue.length === 0) {
      return `<span class="empty-slot-card">${escapeHtml(t("hud.region.noConstruction"))}</span>`;
    }
    const visibleCards = region.construction_queue
      .slice(0, OVERVIEW_CONSTRUCTION_QUEUE_LIMIT)
      .map((item, index) => this.queueCard(region.id, item, index, buildings[item.building_id], monthProgress));
    const remainingCount = region.construction_queue.length - OVERVIEW_CONSTRUCTION_QUEUE_LIMIT;
    if (remainingCount > 0) {
      visibleCards.push(`
        <button class="overview-more-queue" type="button" data-region-tab="buildings" title="${escapeHtml(t("hud.region.viewAllConstruction"))}">
          <strong>+${remainingCount}</strong>
          <span>${escapeHtml(t("hud.region.extraConstruction"))}</span>
        </button>
      `);
    }
    return visibleCards.join("");
  }

  private regionHistoryChart(region: RegionSnapshot): string {
    const history = region.history.slice(-this.activeRegionHistoryPeriod);
    const hasTrend = history.length > 1;
    const first = history[0];
    const last = history[history.length - 1];
    const resource = this.regionHistoryResourceLabel(this.activeRegionHistoryResource);
    const rangeLabel = first && last
      ? `${this.historyPointLabel(first)} - ${this.historyPointLabel(last)}`
      : t("hud.region.historyPending");
    return `
      <section class="region-history-panel region-history-${this.activeRegionHistoryResource}" aria-label="${escapeHtml(t("hud.region.historyAria"))}">
        <div class="region-history-head">
          <div>
            <span>${escapeHtml(t("hud.region.resourceHistory"))}</span>
            <strong>${escapeHtml(resource.label)} - ${escapeHtml(rangeLabel)}</strong>
          </div>
          <div class="region-history-controls">
            <div class="region-history-resources" role="tablist" aria-label="${escapeHtml(t("hud.region.historyResource"))}">
              ${REGION_HISTORY_RESOURCES.map((resourceKey) => {
                const resourceLabel = this.regionHistoryResourceLabel(resourceKey).label;
                return `
                <button class="region-history-resource-button region-status-${resourceKey} ${this.activeRegionHistoryResource === resourceKey ? "is-active" : ""}" type="button" data-history-resource="${resourceKey}" aria-label="${escapeHtml(resourceLabel)}" title="${escapeHtml(resourceLabel)}" aria-selected="${this.activeRegionHistoryResource === resourceKey}">
                  <i class="region-status-icon" aria-hidden="true"></i>
                </button>
              `;
              }).join("")}
            </div>
            <div class="region-history-periods" role="tablist" aria-label="${escapeHtml(t("hud.region.historyPeriod"))}">
              ${REGION_HISTORY_PERIODS.map((period) => `
                <button class="${this.activeRegionHistoryPeriod === period ? "is-active" : ""}" type="button" data-history-period="${period}" aria-selected="${this.activeRegionHistoryPeriod === period}">
                  ${period}${escapeHtml(t("common.units.monthShort"))}
                </button>
              `).join("")}
            </div>
          </div>
        </div>
        <div class="region-history-chart ${hasTrend ? "" : "is-empty"}">
          ${hasTrend ? this.regionHistorySvg(history, this.activeRegionHistoryResource) : `<span>${escapeHtml(t("hud.region.historyEmpty"))}</span>`}
        </div>
        <div class="region-history-legend">
          <span><i class="legend-supply"></i>${escapeHtml(t("hud.region.supply"))}</span>
          <span><i class="legend-demand"></i>${escapeHtml(t("hud.region.usage"))}</span>
          <span><i class="legend-export"></i>${escapeHtml(t("hud.region.export"))}</span>
          <span><i class="legend-import"></i>${escapeHtml(t("hud.region.importDeficit"))}</span>
        </div>
      </section>
    `;
  }

  private regionHistorySvg(history: RegionHistoryPoint[], resource: RegionHistoryResource): string {
    const resourceMeta = this.regionHistoryResourceLabel(resource);
    return `
      <svg class="region-history-svg" viewBox="0 0 320 148" role="img" aria-label="${escapeHtml(t("hud.region.evolution", { label: resourceMeta.label }))}">
        <defs>
          <linearGradient id="history-grid-fade" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="rgba(83, 231, 255, 0.2)" />
            <stop offset="58%" stop-color="rgba(83, 231, 255, 0.05)" />
            <stop offset="100%" stop-color="rgba(184, 121, 255, 0.12)" />
          </linearGradient>
        </defs>
        <rect class="history-screen" x="1" y="1" width="318" height="146" rx="6"></rect>
        <path class="history-scanline" d="M 8 20 H 312 M 8 44 H 312 M 8 68 H 312 M 8 92 H 312 M 8 116 H 312"></path>
        <path class="history-vgrid" d="M 64 12 V 136 M 124 12 V 136 M 184 12 V 136 M 244 12 V 136 M 304 12 V 136"></path>
        <path class="history-corners" d="M 12 24 V 8 H 28 M 292 8 H 308 V 24 M 308 124 V 140 H 292 M 28 140 H 12 V 124"></path>
        ${this.regionHistoryRow(history, resource, resourceMeta.label, resourceMeta.unit)}
      </svg>
    `;
  }

  private regionHistoryRow(
    history: RegionHistoryPoint[],
    resource: RegionHistoryResource,
    label: string,
    unit: string
  ): string {
    const left = 64;
    const right = 306;
    const top = 20;
    const bottom = 116;
    const height = bottom - top;
    const plotWidth = right - left;
    const metricMax = Math.max(
      ...history.flatMap((point) => {
        const metric = point[resource];
        return [metric.supply, metric.demand, metric.imported, metric.exported];
      }),
      1
    );
    const xAt = (index: number) => history.length <= 1 ? left + plotWidth / 2 : left + (plotWidth * index) / (history.length - 1);
    const yAt = (value: number) => bottom - (Math.max(value, 0) / metricMax) * height;
    const pathFor = (field: "supply" | "demand" | "imported" | "exported") => history
      .map((point, index) => `${index === 0 ? "M" : "L"} ${fmt(xAt(index), 1)} ${fmt(yAt(point[resource][field]), 1)}`)
      .join(" ");
    return `
      <g class="history-row history-row-${resource}">
        <rect class="history-resource-chip" x="6" y="14" width="50" height="20" rx="3"></rect>
        <text class="history-label" x="8" y="27">${escapeHtml(label)}</text>
        <text class="history-max" x="8" y="48">${fmt(metricMax, 1)} ${escapeHtml(unit)}</text>
        <line class="history-gridline history-gridline-top" x1="${left}" y1="${top}" x2="${right}" y2="${top}"></line>
        <line class="history-gridline" x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}"></line>
        <path class="history-line history-line-supply" d="${pathFor("supply")}"></path>
        <path class="history-line history-line-demand" d="${pathFor("demand")}"></path>
        <path class="history-line history-line-export" d="${pathFor("exported")}"></path>
        <path class="history-line history-line-import" d="${pathFor("imported")}"></path>
      </g>
    `;
  }

  private historyPointLabel(point: RegionHistoryPoint): string {
    return `${point.month}/${point.year}`;
  }

  private regionHistoryResourceLabel(resource: RegionHistoryResource): { label: string; unit: string } {
    const labels: Record<RegionHistoryResource, { label: string; unit: string }> = {
      energy: { label: t("hud.region.energy"), unit: t("common.units.gigawatts") },
      cooling: { label: t("hud.region.cooling"), unit: t("common.units.thermalGigawatts") },
      compute: { label: t("hud.region.compute"), unit: t("common.units.exaflopsShort") }
    };
    return labels[resource];
  }

  private regionStatTile(label: string, value: string, detail: string): string {
    return `
      <span class="region-stat-tile">
        <small>${escapeHtml(label)}</small>
        <strong>${escapeHtml(value)}</strong>
        <em>${escapeHtml(detail)}</em>
      </span>
    `;
  }

  private regionStatusBlock(
    tone: "energy" | "cooling" | "compute",
    title: string,
    pct: number,
    metrics: Array<[string, string]>,
    isDeficit = false
  ): string {
    const tooltipBody = metrics.map(([label, value]) => `${label}: ${value}`).join(". ");
    const displayPct = Math.max(0, pct);
    const meterPct = clampPctFloat(pct);
    return `
      <div class="region-status region-status-${tone} ${isDeficit ? "has-deficit" : ""}" ${this.regionStatusTooltipAttrs(title, tooltipBody, `${fmt(displayPct)}%`, tone, metrics)}>
        <div class="region-status-title">
          <span class="region-status-heading">
            <i class="region-status-icon" aria-hidden="true"></i>
            <span>${escapeHtml(title)}</span>
          </span>
          <strong>${fmt(displayPct)}%</strong>
        </div>
        <i style="--meter:${meterPct}%"></i>
        <div class="region-status-metrics">
          ${metrics.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join("")}
        </div>
      </div>
    `;
  }

  private regionStatusTooltipAttrs(
    title: string,
    body: string,
    meta: string,
    tone: "energy" | "cooling" | "compute",
    metrics: Array<[string, string]>
  ): string {
    return [
      this.tooltipAttrs(title, body, meta),
      `data-tooltip-status-tone="${tone}"`,
      `data-tooltip-status-metrics="${escapeHtml(JSON.stringify(metrics))}"`
    ].join(" ");
  }

  private localBalancePct(supply: number, localDemand: number): number {
    if (localDemand <= 0) {
      return 100;
    }
    return (Math.max(supply, 0) / localDemand) * 100;
  }

  private regionResourceStatusMetrics(
    supply: number,
    localUse: number,
    exportAmount: number,
    balance: number,
    unit: string
  ): Array<[string, string]> {
    return [
      [t("hud.region.supply"), `${fmt(supply, 1)} ${unit}`],
      [t("hud.region.localUse"), `${fmt(localUse, 1)} ${unit}`],
      [t("hud.region.export"), `${fmt(exportAmount, 1)} ${unit}`],
      [t("hud.region.balance"), `${this.signedMetric(balance)} ${unit}`]
    ];
  }

  private signedMetric(value: number): string {
    if (Math.abs(value) < 0.05) {
      return fmt(0, 1);
    }
    return `${value > 0 ? "+" : ""}${fmt(value, 1)}`;
  }

  private bar(label: string, pct: number, value: string, tone: string): string {
    return `
      <div class="meter meter-${tone}">
        <div><span>${label}</span><strong>${escapeHtml(value)}</strong></div>
        <i style="--meter:${Math.max(0, Math.min(100, pct))}%"></i>
      </div>
    `;
  }

  private queueCard(
    regionId: string,
    item: QueueProgressItem,
    index: number,
    building: BuildingDefinition | undefined,
    monthProgress: number
  ): string {
    const progressKey = this.queueProgressKey("construction", regionId, index, item);
    const targetProgress = this.visualQueueProgress(item, monthProgress);
    const progress = this.renderProgressValue(progressKey, targetProgress, "--progress");
    const buildingName = this.localizedBuildingName(building, item.building_id);
    return `
      <button class="queue-card" type="button" data-cancel="${index}" title="${escapeHtml(t("hud.region.cancelTitle", { name: buildingName }))}">
        ${this.buildingArt(building)}
        <span class="queue-copy">
          <strong>${escapeHtml(buildingName)}</strong>
          <small>${escapeHtml(t("hud.region.remainingMonths", { months: item.months_remaining }))}</small>
          <i ${this.progressAttributes(progressKey, "--progress", "construction", targetProgress)} data-progress-fill="construction" data-progress-index="${index}" data-progress-building-id="${escapeHtml(item.building_id)}" style="--progress:${progress}%"><b></b></i>
        </span>
      </button>
    `;
  }

  private demolitionCard(
    regionId: string,
    item: QueueProgressItem,
    index: number,
    building: BuildingDefinition | undefined,
    monthProgress: number
  ): string {
    const progressKey = this.queueProgressKey("demolition", regionId, index, item);
    const targetProgress = this.visualQueueProgress(item, monthProgress);
    const progress = this.renderProgressValue(progressKey, targetProgress, "--progress");
    const buildingName = this.localizedBuildingName(building, item.building_id);
    return `
      <span class="queue-card demolition-card" title="${escapeHtml(t("hud.region.demolitionTitle", { name: buildingName }))}">
        ${this.buildingArt(building)}
        <span class="queue-copy">
          <strong>${escapeHtml(buildingName)}</strong>
          <small>${escapeHtml(t("hud.region.demolition"))} - ${escapeHtml(t("hud.region.remainingMonths", { months: item.months_remaining }))}</small>
          <i ${this.progressAttributes(progressKey, "--progress", "demolition", targetProgress)} data-progress-fill="demolition" data-progress-index="${index}" data-progress-building-id="${escapeHtml(item.building_id)}" style="--progress:${progress}%"><b></b></i>
        </span>
      </span>
    `;
  }

  private visualQueueProgress(
    item: { months_remaining: number; total_months: number },
    monthProgress: number
  ): number {
    if (item.total_months <= 0) {
      return 100;
    }
    const completedMonths = item.total_months - item.months_remaining;
    const visualMonths = completedMonths + (item.months_remaining > 0 ? clampRatio(monthProgress) : 0);
    return clampPctFloat((visualMonths / item.total_months) * 100);
  }

  private builtCard(buildingId: string, building: BuildingDefinition | undefined, index: number): string {
    const demolishCost = building ? Math.ceil(building.cost * 0.2) : 0;
    return `
      <button class="built-card" type="button" data-demolish="${index}" title="${escapeHtml(t("hud.construction.dismantleTitle", { name: this.localizedBuildingName(building, buildingId), cost: demolishCost }))}" ${this.buildingTooltipAttrs(building, `${t("hud.construction.dismantle")} ${t("common.units.millionCurrency", { value: demolishCost })}`)}>
        ${this.buildingArt(building)}
        <span class="built-copy">
          <strong>${escapeHtml(this.localizedBuildingName(building, buildingId))}</strong>
          <small>${escapeHtml(this.buildingSummary(building))}</small>
          <span class="built-action">${escapeHtml(t("hud.construction.dismantle"))} ${escapeHtml(t("common.units.millionCurrency", { value: demolishCost }))}</span>
        </span>
      </button>
    `;
  }

  private buildingArt(building: BuildingDefinition | undefined): string {
    return `<span class="building-art building-art--${building?.icon_key ?? "supergrid"}" aria-hidden="true"></span>`;
  }

  private buildingSummary(building: BuildingDefinition | undefined): string {
    if (!building) {
      return "Infrastructure";
    }
    const parts: string[] = [];
    if (building.produces_energy > 0) {
      parts.push(`+${fmt(building.produces_energy)} ${t("hud.resources.energy")}`);
    }
    if (building.produces_cooling > 0) {
      parts.push(`+${fmt(building.produces_cooling)} ${t("hud.resources.cooling")}`);
    }
    if (building.produces_compute > 0) {
      parts.push(`+${fmt(building.produces_compute)} ${t("hud.resources.compute")}`);
    }
    if (building.produces_storage > 0) {
      parts.push(`+${fmt(building.produces_storage)} ${t("hud.categories.storage")}`);
    }
    if (building.produces_researchers > 0) {
      parts.push(`+${fmt(building.produces_researchers)} ${t("hud.resources.researchersShort")}`);
    }
    return parts.slice(0, 2).join(" / ") || this.buildCategoryLabel(building.category);
  }

  private buildingMetricChips(building: BuildingDefinition): string {
    const chips: Array<{ label: string; tone: string }> = [];
    const add = (value: number, label: string, tone: string, prefix = "+") => {
      if (value > 0) {
        chips.push({ label: `${prefix}${fmt(value)} ${label}`, tone });
      }
    };
    add(building.produces_energy, t("hud.resources.energyShort"), "energy");
    add(building.produces_cooling, t("hud.resources.coolingShort"), "cooling");
    add(building.produces_compute, t("hud.resources.computeShort"), "compute");
    add(building.produces_storage, t("hud.resources.storageShort"), "storage");
    add(building.produces_researchers, t("hud.resources.researchersShort"), "research");
    add(building.consumes_energy, t("hud.resources.energyShort"), "cost", "-");
    add(building.consumes_cooling, t("hud.resources.coolingShort"), "cost", "-");
    add(building.co2_monthly, t("hud.resources.co2"), "co2", "+");
    return chips
      .slice(0, 4)
      .map((chip) => `<span class="metric-chip metric-${chip.tone}">${escapeHtml(chip.label)}</span>`)
      .join("");
  }

  private constructionPanel(
    buildings: Record<string, BuildingDefinition>,
    availability: Record<string, BuildAvailability>
  ): string {
    const categories = CATEGORY_ORDER.filter((category) =>
      Object.values(buildings).some((building) => building.category === category)
    );
    this.ensureActiveBuildCategory(buildings);
    const isAll = this.activeBuildCategory === ALL_BUILD_CATEGORY;
    return `
      <div class="build-accordion ${isAll ? "is-all" : "is-single"}">
        <div class="build-category-tabs" role="tablist" aria-label="${escapeHtml(t("hud.construction.categories"))}">
          ${[ALL_BUILD_CATEGORY, ...categories].map((category) => this.buildCategoryTab(category, buildings, availability)).join("")}
        </div>
        <div class="build-category-content">
          ${isAll
            ? categories.map((category) => this.categoryBlock(category, buildings, availability)).join("")
            : this.categoryBlock(this.activeBuildCategory, buildings, availability)}
        </div>
      </div>
    `;
  }

  private gridOverviewCard(summary: ReturnType<SimulationCore["getSummary"]>): string {
    const layout = this.simulation.getRegionLayout();
    const graph = this.simulation.getNetworkGraph();
    const graphLines = this.gridOverviewGraphLines(layout, graph);
    const hubLines = this.gridOverviewHubLines(layout, graph, summary);
    const flowLines = this.gridOverviewFlowLines(layout, summary);
    const nodes = this.gridOverviewNodes(layout, graph, summary);
    const activeFlows = summary.network_flows.length;
    const congestedFlows = summary.network_flows.filter((flow) => flow.is_congested).length;
    const tooltip = t("hud.gridOverview.tooltip", {
      active: activeFlows,
      congested: congestedFlows,
      consumed: fmt(summary.energy_consumed),
      produced: fmt(summary.energy_produced)
    });

    return `
      <aside class="grid-overview-card" aria-label="${escapeHtml(t("hud.gridOverview.title"))}" ${this.tooltipAttrs(t("hud.gridOverview.title"), tooltip, t("hud.gridOverview.meta"))}>
        <div class="grid-overview-heading">
          <strong>${escapeHtml(t("hud.gridOverview.title"))}</strong>
          <span class="grid-overview-expand" aria-hidden="true"></span>
        </div>
        <div class="grid-overview-map" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            ${this.gridOverviewEuropePaths()}
            ${graphLines}
            ${hubLines}
            ${flowLines}
          </svg>
          ${nodes}
        </div>
        <div class="grid-overview-legend">
          <span class="legend-power">${escapeHtml(t("hud.gridOverview.powerFlow"))} <b>${fmt(activeFlows)}</b></span>
          <span class="legend-data">${escapeHtml(t("hud.gridOverview.dataFlow"))} <b>${fmt(summary.compute_used)}</b></span>
          <span class="legend-congestion">${escapeHtml(t("hud.gridOverview.congestion"))} <b>${fmt(congestedFlows)}</b></span>
          <span class="legend-planned">${escapeHtml(t("hud.gridOverview.planned"))}</span>
        </div>
      </aside>
    `;
  }

  private gridOverviewEuropePaths(): string {
    return "";
  }

  private gridOverviewGraphLines(
    layout: ReturnType<SimulationCore["getRegionLayout"]>,
    graph: ReturnType<SimulationCore["getNetworkGraph"]>
  ): string {
    const seen = new Set<string>();
    const lines: string[] = [];
    for (const [sourceId, targets] of Object.entries(graph)) {
      for (const targetId of targets) {
        const key = [sourceId, targetId].sort().join(":");
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        const source = layout[sourceId];
        const target = layout[targetId];
        if (!source || !target) {
          continue;
        }
        lines.push(`<path class="mini-flow mini-flow-data" d="${miniRoutePath(source, target, key, 5)}" />`);
        if (lines.length >= 18) {
          return lines.join("");
        }
      }
    }
    return lines.join("");
  }

  private gridOverviewFlowLines(
    layout: ReturnType<SimulationCore["getRegionLayout"]>,
    summary: ReturnType<SimulationCore["getSummary"]>
  ): string {
    return [...summary.network_flows]
      .sort(
        (a, b) =>
          Number(b.is_congested) - Number(a.is_congested) ||
          b.intensity_normalized - a.intensity_normalized
      )
      .slice(0, 14)
      .map((flow) => {
        const source = layout[flow.source_region_id];
        const target = layout[flow.target_region_id];
        if (!source || !target) {
          return "";
        }
        const tone = flow.is_congested ? "congestion" : "power";
        const width = 0.7 + flow.intensity_normalized * 1.7;
        const opacity = 0.36 + flow.intensity_normalized * 0.5;
        const key = `${flow.source_region_id}:${flow.target_region_id}:${tone}`;
        const route = miniRoutePath(source, target, key, 9 + flow.intensity_normalized * 8);
        return (
          `<path class="mini-flow mini-flow-shadow" d="${route}" />` +
          `<path class="mini-flow mini-flow-${tone}" d="${route}" ` +
          `style="--flow-width:${fmt(width, 2)}; --flow-opacity:${fmt(opacity, 2)}" />`
        );
      })
      .join("");
  }

  private gridOverviewHubLines(
    layout: ReturnType<SimulationCore["getRegionLayout"]>,
    graph: ReturnType<SimulationCore["getNetworkGraph"]>,
    summary: ReturnType<SimulationCore["getSummary"]>
  ): string {
    const selectedPoint = layout[summary.selected_region_id];
    if (!selectedPoint) {
      return "";
    }
    return this.gridOverviewRankedRegions(layout, graph, summary)
      .filter(([regionId]) => regionId !== summary.selected_region_id)
      .slice(0, 10)
      .map(([regionId, weight], index) => {
        const point = layout[regionId];
        if (!point) {
          return "";
        }
        const route = miniRoutePath(selectedPoint, point, `hub:${summary.selected_region_id}:${regionId}`, 3.5 + index * 0.28);
        const strong = index < 4 ? " mini-flow-hub-strong" : "";
        const opacity = Math.min(0.78, 0.26 + weight * 0.12);
        return `<path class="mini-flow mini-flow-hub${strong}" d="${route}" style="--hub-opacity:${fmt(opacity, 2)}" />`;
      })
      .join("");
  }

  private gridOverviewNodes(
    layout: ReturnType<SimulationCore["getRegionLayout"]>,
    graph: ReturnType<SimulationCore["getNetworkGraph"]>,
    summary: ReturnType<SimulationCore["getSummary"]>
  ): string {
    const activeEndpoints = new Set<string>();
    const congestedEndpoints = new Set<string>();
    for (const flow of summary.network_flows) {
      activeEndpoints.add(flow.source_region_id);
      activeEndpoints.add(flow.target_region_id);
      if (flow.is_congested) {
        congestedEndpoints.add(flow.source_region_id);
        congestedEndpoints.add(flow.target_region_id);
      }
    }

    return this.gridOverviewRankedRegions(layout, graph, summary)
      .slice(0, 20)
      .map(([regionId, weight]) => {
        const point = layout[regionId];
        if (!point) {
          return "";
        }
        const selected = regionId === summary.selected_region_id;
        const degree = (graph[regionId]?.length ?? 0) + Object.values(graph).filter((targets) => targets.includes(regionId)).length;
        const classes = ["grid-overview-node"];
        if (selected) {
          classes.push("is-selected");
        }
        if (activeEndpoints.has(regionId)) {
          classes.push("is-flow");
        }
        if (congestedEndpoints.has(regionId)) {
          classes.push("is-congested");
        }
        if (!selected && !activeEndpoints.has(regionId) && (degree >= 12 || weight >= 2.6)) {
          classes.push("is-relay");
        }
        const size = Math.min(7.8, 1.8 + weight * 1.28);
        const power = Math.min(1, 0.2 + weight / 6);
        return (
          `<span class="${classes.join(" ")}" ` +
          `style="--node-x:${miniCoordX(point.x)}%; --node-y:${miniCoordY(point.y)}%; ` +
          `--node-size:${fmt(size, 2)}px; --node-power:${fmt(power, 2)}"></span>`
        );
      })
      .join("");
  }

  private gridOverviewRankedRegions(
    layout: ReturnType<SimulationCore["getRegionLayout"]>,
    graph: ReturnType<SimulationCore["getNetworkGraph"]>,
    summary: ReturnType<SimulationCore["getSummary"]>
  ): Array<[string, number]> {
    const ranked = new Map<string, number>();
    for (const [sourceId, targets] of Object.entries(graph)) {
      if (layout[sourceId]) {
        ranked.set(sourceId, (ranked.get(sourceId) ?? 0) + Math.min(1.2, 0.18 + targets.length * 0.08));
      }
      for (const targetId of targets) {
        if (layout[targetId]) {
          ranked.set(targetId, (ranked.get(targetId) ?? 0) + 0.24);
        }
      }
    }
    for (const flow of summary.network_flows) {
      ranked.set(flow.source_region_id, (ranked.get(flow.source_region_id) ?? 0) + 0.9 + flow.intensity_normalized);
      ranked.set(flow.target_region_id, (ranked.get(flow.target_region_id) ?? 0) + 0.9 + flow.intensity_normalized);
    }
    ranked.set(summary.selected_region_id, (ranked.get(summary.selected_region_id) ?? 0) + 4);
    return [...ranked.entries()]
      .filter(([regionId]) => Boolean(layout[regionId]))
      .sort((a, b) => b[1] - a[1]);
  }

  private buildCategoryTab(
    category: string,
    buildings: Record<string, BuildingDefinition>,
    availability: Record<string, BuildAvailability>
  ): string {
    const active = this.activeBuildCategory === category;
    const count = Object.values(buildings).filter((building) =>
      (category === ALL_BUILD_CATEGORY || building.category === category) &&
      this.shouldShowBuilding(building, availability[building.id])
    ).length;
    return `
      <button class="build-category-tab ${active ? "is-active" : ""}" type="button" data-build-category="${category}" data-onboarding-target="build.category.${category}" role="tab" aria-selected="${active}">
        <span>${escapeHtml(this.buildCategoryLabel(category))}</span>
        <strong>${count}</strong>
      </button>
    `;
  }

  private buildCategoryLabel(category: string): string {
    const key = `hud.categories.${category}`;
    const translated = t(key);
    return translated === key ? category : translated;
  }

  private ensureActiveBuildCategory(buildings: Record<string, BuildingDefinition>): void {
    if (this.activeBuildCategory === ALL_BUILD_CATEGORY) {
      return;
    }
    const hasActive = Object.values(buildings).some((building) => building.category === this.activeBuildCategory);
    if (hasActive) {
      return;
    }
    this.activeBuildCategory = ALL_BUILD_CATEGORY;
  }

  private showsAllConstructionCategoriesByDefault(): boolean {
    return window.matchMedia(ALL_CATEGORIES_DESKTOP_QUERY).matches;
  }

  private categoryBlock(
    category: string,
    buildings: Record<string, BuildingDefinition>,
    availability: Record<string, BuildAvailability>
  ): string {
    const categoryItems = Object.values(buildings).filter((building) => building.category === category);
    const items = categoryItems.filter((building) => this.shouldShowBuilding(building, availability[building.id]));
    if (items.length === 0 && categoryItems.length === 0) {
      return "";
    }
    const previewClass = items.length === 0 ? " is-locked-preview" : "";
    const label = this.buildCategoryLabel(category);
    const optionCount = items.length > 0 ? items.length : Math.max(1, Math.min(4, categoryItems.length));
    return `
      <div class="build-category${previewClass}" data-onboarding-target="build.category.${escapeHtml(category)}.items">
        <div class="build-category-heading">
          <span class="build-category-icon utility-category-icon utility-category-icon-${this.categoryIconKey(category)}" aria-hidden="true"></span>
          <h2>
            <button class="build-category-title" type="button" data-build-category-title="${escapeHtml(category)}" ${this.tooltipAttrs(label, t("hud.construction.showOnly", { label }), t("hud.construction.options", { count: optionCount }))}>
              ${escapeHtml(label)}
            </button>
          </h2>
        </div>
        <div class="build-grid">
          ${items.length > 0
            ? items.map((building) => this.buildButton(building, availability[building.id])).join("")
            : this.lockedCategoryPreview(category, categoryItems)}
        </div>
      </div>
    `;
  }

  private lockedCategoryPreview(category: string, items: BuildingDefinition[]): string {
    const label = this.buildCategoryLabel(category);
    const previewCount = Math.max(1, Math.min(4, items.length));
    return Array.from({ length: previewCount }, (_, index) => `
      <span class="build-card is-disabled build-locked-preview-card" role="button" aria-disabled="true" ${this.tooltipAttrs(label, t("hud.construction.lockedOptions"), t("hud.construction.unlockRequired"))}>
        <span class="build-visual locked-preview-art utility-category-icon utility-category-icon-${this.categoryIconKey(category)}" aria-hidden="true">
          <span>${index === 0 ? escapeHtml(t("hud.construction.researchShort")) : ""}</span>
        </span>
        <span class="build-copy">
          <strong>${escapeHtml(label)}</strong>
          <small>${escapeHtml(t("hud.construction.unlockRequired"))}</small>
        </span>
      </span>
    `).join("");
  }

  private categoryIconKey(category: string): string {
    const icons: Record<string, string> = {
      research: "research",
      energy: "energy",
      storage: "battery",
      cooling: "cooling",
      compute: "datacenter",
      grid: "grid",
      all: "grid"
    };
    return icons[category] ?? "grid";
  }

  private buildButton(building: BuildingDefinition, availability: BuildAvailability | undefined): string {
    const enabled = Boolean(availability?.ok);
    const reason = this.localizedBuildAvailabilityReason(availability, building);
    const cause = availability?.cause ? `data-availability-cause="${availability.cause}"` : "";
    return `
      <button class="build-card ${enabled ? "" : "is-disabled"}" type="button" data-build="${building.id}" data-onboarding-target="build.${building.id}" ${cause} ${enabled ? "" : "disabled"} title="${escapeHtml(reason || this.localizedBuildingDescription(building))}" ${this.buildingTooltipAttrs(building, enabled ? t("hud.construction.available") : reason || t("hud.construction.locked"))}>
        <span class="build-visual" aria-hidden="true">
          ${this.buildingArt(building)}
          ${this.buildingBadges(building, availability)}
        </span>
        <span class="build-copy">
          <strong>${escapeHtml(this.localizedBuildingName(building))}</strong>
          <small>${escapeHtml(t("hud.construction.costMonthsSlots", { cost: building.cost, months: building.construction_months, slots: building.slots_required }))}</small>
          <span class="build-metrics">
            ${this.buildingMetricChips(building)}
          </span>
        </span>
      </button>
    `;
  }

  private shouldShowBuilding(building: BuildingDefinition, availability: BuildAvailability | undefined): boolean {
    if (this.showLockedBuildings || availability?.ok) {
      return true;
    }
    if (!availability?.cause) {
      return true;
    }
    return !BUILD_ACCESS_LOCK_CAUSES.includes(availability.cause);
  }

  private localizedBuildAvailabilityReason(
    availability: BuildAvailability | undefined,
    building: BuildingDefinition | undefined
  ): string {
    if (!availability?.reason) {
      return "";
    }
    switch (availability.cause) {
      case "no_region":
        return t("hud.reasons.selectRegion");
      case "unknown_building":
        return t("hud.reasons.unknownBuilding");
      case "technology":
        return t("hud.reasons.researchTechnology", { technology: building?.unlock_technology ? this.localizedTechnologyName(building.unlock_technology) : "" });
      case "region_tag":
        return t("hud.reasons.regionTag");
      case "region_potential":
        return t("hud.reasons.regionPotential");
      case "budget":
        return t("hud.reasons.budget");
      case "slots":
        return t("hud.reasons.slots");
      default:
        return t("hud.construction.locked");
    }
  }

  private localizedResearchReason(option: ResearchOption): string {
    if (!option.reason) {
      return "";
    }
    if (option.reason.startsWith("Rate 0: ")) {
      return t("hud.reasons.zeroRate", { reason: this.researchStallReason(option) });
    }
    if (option.reason.startsWith("File #")) {
      const position = option.reason.match(/\d+/)?.[0] ?? option.queue_position;
      return t("hud.reasons.queuePosition", { position });
    }
    if (option.lock_cause === "building") {
      if (option.branch === "ai") {
        return t("hud.reasons.requiresAiCenter");
      }
      if (option.branch === "energy" || option.branch === "infrastructure") {
        return t("hud.reasons.requiresEnergyCenter");
      }
      return t("hud.reasons.requiresAnyResearchCenter");
    }
    if (option.lock_cause === "prerequisite" && option.prereq_technology_ids.length > 0) {
      return t("hud.reasons.requires", { name: this.localizedTechnologyName(option.prereq_technology_ids[0]) });
    }
    if (option.reason.startsWith("Requires ")) {
      const name = option.reason.replace(/^Requires /, "").replace(/\.$/, "");
      return t("hud.reasons.requires", { name });
    }
    if (option.status === "completed") {
      return t("hud.reasons.completed");
    }
    if (option.status === "active") {
      return t("hud.reasons.inProgress");
    }
    if (option.status === "queued") {
      return t("hud.reasons.queuePosition", { position: option.queue_position });
    }
    return option.status === "available" ? t("hud.reasons.readyResearch") : t("hud.researchPanel.required");
  }

  private researchStallReason(option: ResearchOption): string {
    if (option.branch === "ai") {
      return t("hud.reasons.requiresAiCenter");
    }
    if (option.branch === "energy" || option.branch === "infrastructure") {
      return t("hud.reasons.requiresEnergyCenter");
    }
    return t("hud.reasons.outputUnavailable");
  }

  private regionName(region: RegionSnapshot): string {
    return translatedOrFallback(`content.regions.${region.id}.name`, region.display_name);
  }

  private localizedBuildingName(building: BuildingDefinition | undefined, fallbackId = ""): string {
    if (!building) {
      return fallbackId;
    }
    return translatedOrFallback(`content.buildings.${building.id}.name`, building.display_name);
  }

  private localizedBuildingDescription(building: BuildingDefinition | undefined): string {
    if (!building) {
      return t("hud.construction.regionalInfrastructure");
    }
    return translatedOrFallback(`content.buildings.${building.id}.notes`, building.description);
  }

  private localizedTechnologyName(technologyId: string): string {
    return translatedOrFallback(`content.technologies.${technologyId}.name`, technologyId);
  }

  private localizedResearchName(option: ResearchOption): string {
    return translatedOrFallback(`content.technologies.${option.id}.name`, option.display_name);
  }

  private localizedResearchNotes(option: ResearchOption): string {
    return translatedOrFallback(`content.technologies.${option.id}.notes`, option.notes);
  }

  private localizedRegionTag(tag: string): string {
    return translatedOrFallback(`content.regionTags.${tag}`, tag);
  }

  private localizedRegionTags(tags: string[], limit: number): string {
    return tags.slice(0, limit).map((tag) => this.localizedRegionTag(tag)).join(" / ");
  }

  private localizedPotential(potential: string): string {
    return translatedOrFallback(`content.potentials.${potential}`, potential);
  }

  private localizedEffectKey(effectKey: string): string {
    return translatedOrFallback(`content.effects.${effectKey}`, effectKey);
  }

  private localizedEffectValue(effectValue: string): string {
    if (!effectValue) {
      return "";
    }
    const mappedKey = EFFECT_VALUE_KEYS[effectValue] ?? `content.effectValues.${effectValue}`;
    return translatedOrFallback(mappedKey, effectValue);
  }

  private tooltipAttrs(title: string, body: string, meta = ""): string {
    return `data-rich-tooltip="1" data-tooltip-title="${escapeHtml(title)}" data-tooltip-body="${escapeHtml(body)}" data-tooltip-meta="${escapeHtml(meta)}"`;
  }

  private buildingTooltipAttrs(building: BuildingDefinition | undefined, meta = ""): string {
    return [
      this.tooltipAttrs(this.localizedBuildingName(building, t("hud.construction.infrastructure")), this.localizedBuildingDescription(building), meta),
      building ? `data-tooltip-building-id="${escapeHtml(building.id)}"` : ""
    ].filter(Boolean).join(" ");
  }

  private researchTooltipAttrs(option: ResearchOption): string {
    return [
      this.tooltipAttrs(this.localizedResearchName(option), this.localizedResearchNotes(option) || this.localizedResearchReason(option) || this.researchEffect(option), ""),
      `data-tooltip-research-id="${escapeHtml(option.id)}"`
    ].join(" ");
  }

  private buildingTooltipBody(building: BuildingDefinition | undefined): string {
    if (!building) {
      return t("hud.construction.regionalInfrastructure");
    }
    const basics = [
      this.buildCategoryLabel(building.category),
      t("common.units.millionCurrency", { value: building.cost }),
      `${building.construction_months}${t("common.units.monthShort")}`,
      `${building.slots_required} ${t("common.units.slots")}`
    ].join(" - ");
    const output = this.buildingSummary(building);
    const demand: string[] = [];
    if (building.consumes_energy > 0) {
      demand.push(t("hud.construction.energyDemand", { value: fmt(building.consumes_energy) }));
    }
    if (building.consumes_cooling > 0) {
      demand.push(t("hud.construction.coolingDemand", { value: fmt(building.consumes_cooling) }));
    }
    if (building.researchers_required > 0) {
      demand.push(t("hud.construction.researchersDemand", { value: fmt(building.researchers_required) }));
    }
    return [basics, output, demand.join(" / "), this.localizedBuildingDescription(building)].filter(Boolean).join(" | ");
  }

  private buildingBadges(building: BuildingDefinition, availability: BuildAvailability | undefined): string {
    const badges: string[] = [];
    if (building.unlock_technology) {
      badges.push(availability?.ok ? t("hud.construction.techOk") : t("hud.construction.researchShort"));
    }
    if (building.id === "energy_research_center") {
      badges.push(t("hud.construction.tiers"));
    } else if (building.id === "ai_research_center") {
      badges.push(t("hud.construction.agiBoost"));
    }
    if (badges.length === 0) {
      return "";
    }
    return `<span class="build-badges">${badges.slice(0, 2).map((badge) => `<span>${escapeHtml(badge)}</span>`).join("")}</span>`;
  }

  private activeDockFilterToggle(): string {
    if (this.activeDockTab === "construction") {
      return this.filterToggle("locked-buildings", t("hud.construction.showLocked"), this.showLockedBuildings);
    }
    return this.filterToggle("unavailable-research", t("hud.researchPanel.showUnavailable"), this.showUnavailableResearch);
  }

  private filterToggle(id: "locked-buildings" | "unavailable-research", label: string, checked: boolean): string {
    const body = id === "locked-buildings"
      ? t("hud.construction.showLockedBody")
      : t("hud.researchPanel.showUnavailableBody");
    const meta = checked ? t("hud.construction.filterActive") : t("hud.construction.filterInactive");
    return `
      <button class="dock-filter-toggle ${checked ? "is-active" : ""}" type="button" data-filter-toggle="${id}" aria-pressed="${checked}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" ${this.tooltipAttrs(label, body, meta)}>
        <span aria-hidden="true"></span>
        <strong>${escapeHtml(label)}</strong>
      </button>
    `;
  }

  private researchPanel(
    options: ResearchOption[],
    buildings: Record<string, BuildingDefinition>,
    monthProgress: number
  ): string {
    const active = options.find((option) => option.status === "active");
    const queued = options
      .filter((option) => option.status === "queued")
      .sort((a, b) => a.queue_position - b.queue_position);
    const visibleOptions = options.filter((option) => this.shouldShowResearchOption(option));
    const activeTargetProgress = active ? this.visualResearchProgress(active, monthProgress) : 0;
    const activeProgress = active
      ? this.renderProgressValue(this.activeResearchProgressKey(active), activeTargetProgress, "--research-progress")
      : 0;
    const activePoints = active ? this.visualResearchPoints(active, monthProgress) : 0;
    const hasVisibleOptions = visibleOptions.length > 0;
    const statusMarkup = active
      ? `
        <div class="research-status is-active" data-onboarding-target="research.status" ${this.progressAttributes(this.activeResearchProgressKey(active), "--research-progress", "research-active", activeTargetProgress)} data-progress-fill="research-active" data-progress-research-id="${escapeHtml(active.id)}" style="--research-progress:${activeProgress}%">
          <div>
            <strong>${escapeHtml(this.localizedResearchName(active))}</strong>
          <span data-research-active-copy data-research-active-detail>${fmt(activeTargetProgress)}% - ${fmt(activePoints)}/${fmt(active.cost)} ${escapeHtml(t("common.units.points"))} - ${escapeHtml(t("hud.researchPanel.etaShort"))} ${this.researchEta(active)} - +${fmt(active.monthly_points)} ${escapeHtml(t("common.units.points"))}/${escapeHtml(t("hud.kpi.monthSuffix"))}</span>
          </div>
        </div>
      `
      : `<div class="research-status" data-onboarding-target="research.status" style="--research-progress:0%"><div><strong>${escapeHtml(t("hud.researchPanel.noActive"))}</strong><span>${escapeHtml(t("hud.researchPanel.chooseTier"))}</span></div></div>`;
    return `
      <div class="research-panel">
        ${statusMarkup}
        <div class="research-queue" aria-label="${escapeHtml(t("hud.researchPanel.queueAria"))}">
          <div class="research-queue-title"><span>${escapeHtml(t("hud.researchPanel.queue"))}</span><strong>${queued.length}</strong></div>
          ${queued.length === 0
            ? `<span class="research-queue-empty">${escapeHtml(t("hud.researchPanel.noQueued"))}</span>`
            : queued.map((option) => this.researchQueueItem(option)).join("")}
        </div>
        <div class="research-grid ${hasVisibleOptions ? "" : "is-preview"}">
          ${hasVisibleOptions
            ? visibleOptions.map((option) => this.researchCard(option, buildings, monthProgress)).join("")
            : this.researchPreviewCards(options)}
        </div>
      </div>
    `;
  }

  private researchPreviewCards(options: ResearchOption[]): string {
    return options
      .slice()
      .sort((a, b) => a.tier - b.tier || a.branch.localeCompare(b.branch) || this.localizedResearchName(a).localeCompare(this.localizedResearchName(b)))
      .slice(0, 4)
      .map((option) => {
        return `
          <span class="research-card research-preview-card research-locked" role="button" aria-disabled="true" ${this.researchTooltipAttrs(option)}>
            <span class="research-card-head">
              <span class="research-card-glyph utility-category-icon utility-category-icon-${this.researchBranchIconKey(option.branch)}" aria-hidden="true"></span>
              <span>
                <strong>${escapeHtml(this.localizedResearchName(option))}</strong>
                <small>${escapeHtml(this.researchBranchTierLabel(option))}</small>
              </span>
            </span>
            <span class="research-progress" style="--progress:0%"><b></b></span>
            <span class="research-copy">${escapeHtml(this.localizedResearchReason(option) || t("hud.researchPanel.required"))}</span>
          </span>
        `;
      })
      .join("");
  }

  private researchQueueItem(option: ResearchOption): string {
    const index = option.queue_position - 1;
    return `
      <article class="research-queue-item" data-queued-research="${escapeHtml(option.id)}">
        <span>
          <strong>${escapeHtml(this.localizedResearchName(option))}</strong>
          <small>#${option.queue_position} - ${escapeHtml(t("hud.researchPanel.etaShort"))} ${this.researchEta(option)} - +${fmt(option.monthly_points)} ${escapeHtml(t("common.units.points"))}/${escapeHtml(t("hud.kpi.monthSuffix"))}</small>
        </span>
        <span class="research-queue-actions">
          <button type="button" data-promote-research="${index}" ${index <= 0 ? "disabled" : ""} title="${escapeHtml(t("hud.researchPanel.moveUp", { name: this.localizedResearchName(option) }))}">${escapeHtml(t("hud.researchPanel.up"))}</button>
          <button type="button" data-remove-research="${index}" title="${escapeHtml(t("hud.researchPanel.remove", { name: this.localizedResearchName(option) }))}">${escapeHtml(t("hud.researchPanel.removeShort"))}</button>
        </span>
      </article>
    `;
  }

  private researchCard(
    option: ResearchOption,
    buildings: Record<string, BuildingDefinition>,
    monthProgress: number
  ): string {
    const enabled = option.status === "available";
    const unlocks = option.unlocks
      .map((id) => this.localizedBuildingName(buildings[id], id))
      .filter(Boolean)
      .slice(0, 3);
    const effect = this.researchEffect(option);
    const progressKey = this.researchCardProgressKey(option);
    const targetProgress = this.visualResearchProgress(option, monthProgress);
    const progress = this.renderProgressValue(progressKey, targetProgress, "--progress");
    const lockCause = option.lock_cause ? `data-lock-cause="${option.lock_cause}"` : "";
    return `
      <button class="research-card research-${option.status}" type="button" data-research="${option.id}" data-onboarding-target="research.${option.id}" ${lockCause} ${enabled ? "" : "disabled"} title="${escapeHtml(this.localizedResearchReason(option) || this.localizedResearchNotes(option))}" ${this.researchTooltipAttrs(option)}>
        <span class="research-card-head">
          <span class="research-card-glyph utility-category-icon utility-category-icon-${this.researchBranchIconKey(option.branch)}" aria-hidden="true"></span>
          <strong>${escapeHtml(this.localizedResearchName(option))}</strong>
          <small>${escapeHtml(this.researchBranchTierLabel(option))} - ${fmt(option.cost)} ${escapeHtml(t("common.units.points"))} - ${this.researchEta(option)}</small>
        </span>
        <span class="research-progress" ${this.progressAttributes(progressKey, "--progress", "research-card", targetProgress)} data-progress-fill="research-card" data-progress-research-id="${escapeHtml(option.id)}" style="--progress:${progress}%"><b></b></span>
        <span class="research-copy">${escapeHtml(this.localizedResearchReason(option) || this.localizedResearchNotes(option) || effect)}</span>
        <span class="research-tags">
          ${unlocks.map((unlock) => `<span>${escapeHtml(t("hud.researchPanel.unlocks", { name: unlock }))}</span>`).join("")}
          ${effect ? `<span>${escapeHtml(effect)}</span>` : ""}
        </span>
      </button>
    `;
  }

  private shouldShowResearchOption(option: ResearchOption): boolean {
    if (this.showUnavailableResearch || option.status !== "locked") {
      return true;
    }
    if (!option.lock_cause) {
      return true;
    }
    return !RESEARCH_UNAVAILABLE_CAUSES.includes(option.lock_cause);
  }

  private researchBranchIconKey(branch: string): string {
    const normalized = branch.toLowerCase();
    if (normalized.includes("energy")) {
      return "energy";
    }
    if (normalized.includes("ai") || normalized.includes("compute") || normalized.includes("model")) {
      return "compute";
    }
    if (normalized.includes("infrastructure") || normalized.includes("grid")) {
      return "grid";
    }
    if (normalized.includes("cool")) {
      return "snow";
    }
    return "science";
  }

  private researchBranchLabel(branch: string): string {
    const key = `hud.researchPanel.branches.${branch}`;
    const translated = t(key);
    return translated === key ? branch : translated;
  }

  private researchBranchTierLabel(option: ResearchOption): string {
    return t("hud.researchPanel.branchTierShort", {
      branch: this.researchBranchLabel(option.branch),
      tier: option.tier
    });
  }

  private visualResearchPoints(option: ResearchOption, monthProgress: number): number {
    if (option.status !== "active") {
      return option.current_points;
    }
    return Math.min(option.cost, option.current_points + Math.max(option.monthly_points, 0) * clampRatio(monthProgress));
  }

  private visualResearchProgress(option: ResearchOption, monthProgress: number): number {
    if (option.cost <= 0) {
      return 100;
    }
    if (option.status === "active") {
      return clampPctFloat((this.visualResearchPoints(option, monthProgress) / option.cost) * 100);
    }
    return clampPctFloat(option.progress * 100);
  }

  private queueProgressKey(
    type: "construction" | "demolition",
    regionId: string,
    index: number,
    item: QueueProgressItem
  ): string {
    return `${type}:${regionId}:${index}:${item.building_id}:${item.total_months}`;
  }

  private activeResearchProgressKey(option: ResearchOption): string {
    return `research-active:${option.id}`;
  }

  private researchCardProgressKey(option: ResearchOption): string {
    return `research-card:${option.id}`;
  }

  private renderProgressValue(key: string, target: number, cssVar: ProgressCssVar): number {
    const clampedTarget = clampPctFloat(target);
    const previous = this.visualProgress.get(key);
    if (previous === undefined || previous > clampedTarget) {
      this.visualProgress.set(key, clampedTarget);
      return clampedTarget;
    }
    const start = clampPctFloat(previous);
    if (clampedTarget > start) {
      this.pendingProgressAnimations.push({ key, cssVar, target: clampedTarget });
    }
    this.visualProgress.set(key, start);
    return start;
  }

  private progressAttributes(key: string, cssVar: ProgressCssVar, kind: string, target: number): string {
    return [
      `data-progress-key="${escapeHtml(key)}"`,
      `data-progress-var="${cssVar}"`,
      `data-progress-kind="${kind}"`,
      `data-progress-target="${clampPctFloat(target)}"`
    ].join(" ");
  }

  private captureVisualProgressFromDom(): void {
    for (const element of this.root.querySelectorAll<HTMLElement>("[data-progress-key]")) {
      const key = element.dataset.progressKey;
      if (!key) {
        continue;
      }
      const value = parseProgressValue(getComputedStyle(element).getPropertyValue(this.progressCssVar(element)));
      if (value !== undefined) {
        this.visualProgress.set(key, value);
      }
    }
  }

  private applyPendingProgressAnimations(): void {
    if (this.progressAnimationFrame !== null) {
      window.cancelAnimationFrame(this.progressAnimationFrame);
      this.progressAnimationFrame = null;
    }
    const animations = this.pendingProgressAnimations;
    this.pendingProgressAnimations = [];
    if (animations.length === 0) {
      return;
    }
    this.progressAnimationFrame = window.requestAnimationFrame(() => {
      this.progressAnimationFrame = null;
      for (const animation of animations) {
        this.patchProgressValue(animation.key, animation.target, animation.cssVar);
      }
    });
  }

  private patchProgressValue(key: string, target: number, cssVar: ProgressCssVar): void {
    const element = this.findProgressElement(key);
    const clampedTarget = clampPctFloat(target);
    if (!element) {
      return;
    }
    element.style.setProperty(cssVar, `${clampedTarget}%`);
    element.dataset.progressTarget = String(clampedTarget);
    this.visualProgress.set(key, clampedTarget);
  }

  private findProgressElement(key: string): HTMLElement | undefined {
    return [...this.root.querySelectorAll<HTMLElement>("[data-progress-key]")]
      .find((element) => element.dataset.progressKey === key);
  }

  private progressCssVar(element: HTMLElement): ProgressCssVar {
    return element.dataset.progressVar === "--research-progress" ? "--research-progress" : "--progress";
  }

  private researchEta(option: ResearchOption): string {
    if (option.status === "completed") {
      return t("hud.researchPanel.etaComplete");
    }
    if (!Number.isFinite(option.estimated_months_remaining)) {
      return t("hud.researchPanel.zeroRateShort");
    }
    return `${Math.max(option.estimated_months_remaining, 0)}${t("common.units.monthShort")}`;
  }

  private researchEffect(option: ResearchOption): string {
    const effectLabel = this.localizedEffectKey(option.effect_key);
    if (option.effect_value_pct > 0) {
      return `+${fmt(option.effect_value_pct)}% ${effectLabel}`;
    }
    if (option.effect_value) {
      return this.localizedEffectValue(option.effect_value);
    }
    return effectLabel;
  }

  private handleTooltipOver(event: PointerEvent): void {
    if (performance.now() < this.tooltipSuppressedUntil) {
      return;
    }
    const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-rich-tooltip]");
    if (!trigger) {
      return;
    }
    this.showTooltip(trigger, event.clientX, event.clientY);
  }

  private handleTooltipMove(event: PointerEvent): void {
    if (!this.tooltipElement || !this.tooltipTrigger) {
      return;
    }
    this.positionTooltip(event.clientX, event.clientY);
  }

  private handleTooltipOut(event: PointerEvent): void {
    const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-rich-tooltip]");
    if (!trigger) {
      return;
    }
    const related = event.relatedTarget;
    if (related instanceof Node && trigger.contains(related)) {
      return;
    }
    this.hideTooltip();
  }

  private handleTooltipFocus(event: FocusEvent): void {
    if (performance.now() < this.tooltipSuppressedUntil) {
      return;
    }
    const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-rich-tooltip]");
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    this.showTooltip(trigger, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  private showTooltip(trigger: HTMLElement, x: number, y: number): void {
    const title = trigger.dataset.tooltipTitle ?? "";
    const body = trigger.dataset.tooltipBody ?? "";
    const meta = trigger.dataset.tooltipMeta ?? "";
    if (!title && !body && !meta) {
      return;
    }

    const tooltip = this.ensureTooltipElement();
    const titleElement = document.createElement("strong");
    titleElement.textContent = title;
    const bodyElement = this.tooltipBodyElement(trigger, body);
    tooltip.replaceChildren(titleElement, bodyElement);
    if (meta) {
      const metaElement = document.createElement("small");
      if (this.isLockedTooltipMeta(meta, trigger)) {
        metaElement.className = "is-locked";
      }
      metaElement.textContent = meta;
      tooltip.append(metaElement);
    }
    tooltip.classList.add("is-visible");
    this.tooltipTrigger = trigger;
    this.positionTooltip(x, y);
  }

  private tooltipBodyElement(trigger: HTMLElement, body: string): HTMLElement {
    const buildingId = trigger.dataset.tooltipBuildingId;
    const building = buildingId ? this.simulation.getBuildingDefinitions()[buildingId] : undefined;
    if (building) {
      return this.buildingTooltipElement(building);
    }
    const researchId = trigger.dataset.tooltipResearchId;
    const researchOption = researchId ? this.simulation.getResearchOptions().find((option) => option.id === researchId) : undefined;
    if (researchOption) {
      return this.researchTooltipElement(researchOption);
    }
    if (trigger.dataset.tooltipStatusMetrics) {
      return this.regionStatusTooltipElement(trigger);
    }
    const bodyElement = document.createElement("span");
    bodyElement.textContent = body;
    return bodyElement;
  }

  private regionStatusTooltipElement(trigger: HTMLElement): HTMLElement {
    const wrapper = document.createElement("div");
    const tone = trigger.dataset.tooltipStatusTone ?? "info";
    wrapper.className = `tooltip-status tooltip-status-${tone}`;
    const metrics = this.parseTooltipMetrics(trigger.dataset.tooltipStatusMetrics);
    if (metrics.length === 0) {
      const fallback = document.createElement("span");
      fallback.textContent = trigger.dataset.tooltipBody ?? "";
      wrapper.append(fallback);
      return wrapper;
    }
    const grid = document.createElement("div");
    grid.className = "tooltip-status-grid";
    for (const [label, value] of metrics) {
      const chip = document.createElement("span");
      chip.className = "tooltip-status-chip";
      const labelElement = document.createElement("small");
      labelElement.textContent = label;
      const valueElement = document.createElement("strong");
      valueElement.textContent = value;
      chip.append(labelElement, valueElement);
      grid.append(chip);
    }
    wrapper.append(grid);
    return wrapper;
  }

  private parseTooltipMetrics(raw: string | undefined): Array<[string, string]> {
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.flatMap((item) => {
        if (!Array.isArray(item) || item.length < 2 || typeof item[0] !== "string" || typeof item[1] !== "string") {
          return [];
        }
        return [[item[0], item[1]] as [string, string]];
      });
    } catch {
      return [];
    }
  }

  private buildingTooltipElement(building: BuildingDefinition): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "tooltip-building";

    const description = document.createElement("p");
    description.textContent = this.localizedBuildingDescription(building);
    wrapper.append(description);

    wrapper.append(this.tooltipChipRow([
      { label: t("common.units.millionCurrency", { value: fmt(building.cost) }), tone: "price", title: t("hud.tooltipSections.price") },
      { label: `${fmt(building.construction_months)}${t("common.units.monthShort")}`, tone: "time", title: t("hud.tooltipSections.construction") },
      { label: `${fmt(building.slots_required)} ${t("common.units.slots")}`, tone: "slot", title: t("hud.tooltipSections.footprint") }
    ]));

    const production = this.buildingResourceChips(building, "production");
    const consumption = this.buildingResourceChips(building, "consumption");
    const constraints = this.buildingConstraintChips(building);
    if (production.length > 0) {
      wrapper.append(this.tooltipChipSection(t("hud.tooltipSections.produced"), production));
    }
    if (consumption.length > 0) {
      wrapper.append(this.tooltipChipSection(t("hud.tooltipSections.consumed"), consumption));
    }
    if (constraints.length > 0) {
      wrapper.append(this.tooltipChipSection(t("hud.tooltipSections.constraints"), constraints));
    }

    return wrapper;
  }

  private buildingResourceChips(
    building: BuildingDefinition,
    mode: "production" | "consumption"
  ): Array<{ label: string; tone: string; title: string }> {
    const prefix = mode === "production" ? "+" : "-";
    const chips: Array<{ label: string; tone: string; title: string }> = [];
    const add = (value: number, label: string, tone: string, title: string) => {
      if (value > 0) {
        chips.push({ label: `${prefix}${fmt(value)} ${label}`, tone, title });
      }
    };
    if (mode === "production") {
      add(building.produces_energy, t("hud.resources.energy"), "energy", t("hud.tooltipSections.energyProduction"));
      add(building.produces_cooling, t("hud.resources.cooling"), "cooling", t("hud.tooltipSections.coolingProduction"));
      add(building.produces_compute, t("hud.resources.compute"), "compute", t("hud.tooltipSections.computeCapacity"));
      add(building.produces_storage, t("hud.categories.storage"), "storage", t("hud.tooltipSections.gridStorage"));
      add(building.produces_researchers, t("hud.resources.researchersShort"), "research", t("hud.tooltipSections.researchers"));
      return chips;
    }
    add(building.consumes_energy, t("hud.resources.energy"), "demand", t("hud.tooltipSections.energyNeed"));
    add(building.consumes_cooling, t("hud.resources.cooling"), "demand", t("hud.tooltipSections.coolingNeed"));
    add(building.consumes_compute, t("hud.resources.compute"), "demand", t("hud.tooltipSections.computeNeed"));
    add(building.researchers_required, t("hud.resources.researchersShort"), "demand", t("hud.tooltipSections.requiredResearchers"));
    add(building.co2_monthly, `CO2/${t("hud.kpi.monthSuffix")}`, "co2", t("hud.tooltipSections.carbonPressure"));
    return chips;
  }

  private buildingConstraintChips(building: BuildingDefinition): Array<{ label: string; tone: string; title: string }> {
    const chips: Array<{ label: string; tone: string; title: string }> = [];
    if (building.unlock_technology) {
      chips.push({
        label: t("hud.researchPanel.techRequirement", { technology: this.localizedTechnologyName(building.unlock_technology) }),
        tone: "locked",
        title: t("hud.construction.requiredResearch")
      });
    }
    if (building.required_potential && building.required_potential_min > 0) {
      chips.push({ label: `${this.localizedPotential(building.required_potential)} ${fmt(building.required_potential_min)}+`, tone: "info", title: t("hud.construction.requiredPotential") });
    }
    if (building.required_tags.length > 0) {
      chips.push({ label: this.localizedRegionTags(building.required_tags, 2), tone: "info", title: t("hud.construction.regionTags") });
    }
    if (building.variable_output) {
      chips.push({ label: t("hud.construction.variable"), tone: "warning", title: t("hud.construction.variableProduction") });
    }
    return chips;
  }

  private researchTooltipElement(option: ResearchOption): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "tooltip-research";

    const description = document.createElement("p");
    description.textContent = this.localizedResearchNotes(option) || this.localizedResearchReason(option) || this.researchEffect(option);
    wrapper.append(description);

    wrapper.append(this.tooltipChipSection(t("hud.tooltipSections.points"), this.researchPointChips(option)));

    const conditions = this.researchConditionChips(option);
    if (conditions.length > 0) {
      wrapper.append(this.tooltipChipSection(t("hud.tooltipSections.conditions"), conditions));
    }

    const unlocks = this.researchUnlockChips(option);
    if (unlocks.length > 0) {
      wrapper.append(this.tooltipChipSection(t("hud.tooltipSections.unlocks"), unlocks));
    }

    const effect = this.researchEffect(option);
    if (effect) {
      wrapper.append(this.tooltipChipSection(t("hud.tooltipSections.effect"), [
        { label: effect, tone: "research", title: t("hud.researchPanel.researchEffect") }
      ]));
    }

    return wrapper;
  }

  private researchPointChips(option: ResearchOption): Array<{ label: string; tone: string; title: string }> {
    const progressPoints = option.status === "active"
      ? Math.min(option.cost, Math.max(option.current_points, 0))
      : Math.max(option.current_points, 0);
    return [
      { label: `${fmt(option.cost)} ${t("common.units.points")}`, tone: "price", title: t("hud.researchPanel.totalCost") },
      { label: `${fmt(progressPoints)} / ${fmt(option.cost)}`, tone: "research", title: t("hud.researchPanel.accumulatedPoints") },
      { label: `+${fmt(option.monthly_points)} ${t("common.units.points")}/${t("hud.kpi.monthSuffix")}`, tone: "energy", title: t("hud.researchPanel.monthlyProduction") },
      { label: `${t("hud.researchPanel.etaShort")} ${this.researchEta(option)}`, tone: "time", title: t("hud.researchPanel.eta") }
    ];
  }

  private researchConditionChips(option: ResearchOption): Array<{ label: string; tone: string; title: string }> {
    const chips: Array<{ label: string; tone: string; title: string }> = [
      { label: this.researchBranchTierLabel(option), tone: "info", title: t("hud.researchPanel.branchTier") }
    ];
    for (const prereq of option.prereq_technology_ids) {
      chips.push({
        label: t("hud.researchPanel.techRequirement", { technology: this.localizedTechnologyName(prereq) }),
        tone: "locked",
        title: t("hud.researchPanel.prerequisite")
      });
    }
    if (option.lock_cause && RESEARCH_UNAVAILABLE_CAUSES.includes(option.lock_cause)) {
      chips.push({ label: this.localizedResearchReason(option) || option.lock_cause, tone: "locked", title: t("hud.researchPanel.blocker") });
    } else if (option.reason && option.status !== "available") {
      chips.push({ label: this.localizedResearchReason(option), tone: "warning", title: t("hud.researchPanel.status") });
    }
    return chips;
  }

  private researchUnlockChips(option: ResearchOption): Array<{ label: string; tone: string; title: string }> {
    const buildings = this.simulation.getBuildingDefinitions();
    return option.unlocks.map((buildingId) => ({
      label: this.localizedBuildingName(buildings[buildingId], buildingId),
      tone: buildings[buildingId] ? "compute" : "info",
      title: buildings[buildingId] ? t("hud.researchPanel.buildingUnlocked") : t("hud.researchPanel.unlock")
    }));
  }

  private tooltipChipSection(title: string, chips: Array<{ label: string; tone: string; title: string }>): HTMLElement {
    const section = document.createElement("div");
    section.className = "tooltip-chip-section";
    const label = document.createElement("span");
    label.className = "tooltip-chip-section-label";
    label.textContent = title;
    section.append(label, this.tooltipChipRow(chips));
    return section;
  }

  private tooltipChipRow(chips: Array<{ label: string; tone: string; title: string }>): HTMLElement {
    const row = document.createElement("div");
    row.className = "tooltip-chip-row";
    for (const chip of chips) {
      const element = document.createElement("span");
      element.className = `tooltip-chip tooltip-chip-${chip.tone}`;
      element.title = chip.title;
      element.textContent = chip.label;
      row.append(element);
    }
    return row;
  }

  private isLockedTooltipMeta(meta: string, trigger: HTMLElement): boolean {
    const availabilityCause = trigger.dataset.availabilityCause as BuildAvailability["cause"] | undefined;
    const researchLockCause = trigger.dataset.lockCause as ResearchOption["lock_cause"] | undefined;
    return (
      /locked|verrouill|debloquer/i.test(meta) ||
      (availabilityCause !== undefined && BUILD_ACCESS_LOCK_CAUSES.includes(availabilityCause)) ||
      (researchLockCause !== undefined && RESEARCH_UNAVAILABLE_CAUSES.includes(researchLockCause))
    );
  }

  private ensureTooltipElement(): HTMLElement {
    if (this.tooltipElement?.isConnected) {
      return this.tooltipElement;
    }
    const tooltip = document.createElement("div");
    tooltip.className = "rich-tooltip";
    tooltip.setAttribute("role", "tooltip");
    this.root.append(tooltip);
    this.tooltipElement = tooltip;
    return tooltip;
  }

  private positionTooltip(x: number, y: number): void {
    const tooltip = this.tooltipElement;
    if (!tooltip) {
      return;
    }
    const margin = 12;
    const offset = 16;
    const rect = tooltip.getBoundingClientRect();
    let left = x + offset;
    let top = y + offset;
    if (left + rect.width > window.innerWidth - margin) {
      left = x - rect.width - offset;
    }
    if (top + rect.height > window.innerHeight - margin) {
      top = y - rect.height - offset;
    }
    tooltip.style.left = `${Math.max(margin, left)}px`;
    tooltip.style.top = `${Math.max(margin, top)}px`;
  }

  private hideTooltip(): void {
    this.tooltipElement?.classList.remove("is-visible");
    this.tooltipTrigger = undefined;
  }

  private handleWheel(event: WheelEvent): void {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target || !this.root.contains(target)) {
      return;
    }

    const nativeScroller = this.closestScrollable(target);
    if (nativeScroller && this.canConsumeWheel(nativeScroller, event)) {
      return;
    }

    const fallbackScroller = this.fallbackWheelScroller(target);
    if (fallbackScroller) {
      const didScrollY = this.scrollElement(fallbackScroller, event.deltaY, "y");
      const didScrollX = this.scrollElement(fallbackScroller, event.deltaX, "x");
      if (didScrollY || didScrollX) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }

    const horizontalScroller = target.closest<HTMLElement>(".build-category-tabs, .build-grid");
    const horizontalDelta = event.deltaX || (event.shiftKey ? event.deltaY : 0);
    if (horizontalScroller && this.scrollElement(horizontalScroller, horizontalDelta, "x")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private closestScrollable(target: HTMLElement): HTMLElement | undefined {
    let node: HTMLElement | null = target;
    while (node && node !== this.root) {
      const style = getComputedStyle(node);
      const canScrollY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1;
      const canScrollX = /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1;
      if (canScrollY || canScrollX) {
        return node;
      }
      node = node.parentElement;
    }
    return undefined;
  }

  private fallbackWheelScroller(target: HTMLElement): HTMLElement | undefined {
    const palette = target.closest<HTMLElement>(".build-palette");
    if (palette) {
      return palette.querySelector<HTMLElement>(".palette-body[data-scroll-key]") ?? palette;
    }
    return target.closest<HTMLElement>(".region-panel, .alerts-panel") ?? undefined;
  }

  private canConsumeWheel(scroller: HTMLElement, event: WheelEvent): boolean {
    return this.canScrollAxis(scroller, event.deltaY, "y") || this.canScrollAxis(scroller, event.deltaX, "x");
  }

  private canScrollAxis(scroller: HTMLElement, delta: number, axis: "x" | "y"): boolean {
    if (Math.abs(delta) < 0.5) {
      return false;
    }
    const position = axis === "y" ? scroller.scrollTop : scroller.scrollLeft;
    const max = axis === "y" ? scroller.scrollHeight - scroller.clientHeight : scroller.scrollWidth - scroller.clientWidth;
    return delta > 0 ? position < max - 1 : position > 1;
  }

  private scrollElement(scroller: HTMLElement, delta: number, axis: "x" | "y"): boolean {
    if (!this.canScrollAxis(scroller, delta, axis)) {
      return false;
    }
    if (axis === "y") {
      const before = scroller.scrollTop;
      scroller.scrollTop = Math.max(0, Math.min(scroller.scrollHeight - scroller.clientHeight, before + delta));
      return Math.abs(scroller.scrollTop - before) > 0.5;
    }
    const before = scroller.scrollLeft;
    scroller.scrollLeft = Math.max(0, Math.min(scroller.scrollWidth - scroller.clientWidth, before + delta));
    return Math.abs(scroller.scrollLeft - before) > 0.5;
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    const button = target.closest("button") as HTMLButtonElement | null;
    if (!button) {
      return;
    }

    const dismissAlertId = button.dataset.dismissAlert;
    if (dismissAlertId) {
      this.dismissAlert(dismissAlertId);
      return;
    }

    const paletteTab = button.dataset.paletteTab as "construction" | "research" | undefined;
    if (paletteTab) {
      this.capturePaletteScroll();
      this.activeDockTab = paletteTab;
      this.paletteOpen = true;
      this.render();
      return;
    }

    const regionTab = button.dataset.regionTab as RegionPanelTab | undefined;
    if (regionTab === "overview" || regionTab === "buildings" || regionTab === "stats") {
      this.activeRegionTab = regionTab;
      this.tooltipSuppressedUntil = performance.now() + 500;
      this.hideTooltip();
      this.render();
      return;
    }

    const historyPeriod = Number(button.dataset.historyPeriod);
    if (REGION_HISTORY_PERIODS.includes(historyPeriod as RegionHistoryPeriod)) {
      this.activeRegionHistoryPeriod = historyPeriod as RegionHistoryPeriod;
      this.tooltipSuppressedUntil = performance.now() + 500;
      this.hideTooltip();
      this.render();
      return;
    }

    const historyResource = button.dataset.historyResource as RegionHistoryResource | undefined;
    if (historyResource && REGION_HISTORY_RESOURCES.includes(historyResource)) {
      this.activeRegionHistoryResource = historyResource;
      this.tooltipSuppressedUntil = performance.now() + 500;
      this.hideTooltip();
      this.render();
      return;
    }

    const buildCategory = button.dataset.buildCategory ?? button.dataset.buildCategoryTitle;
    if (buildCategory) {
      this.activeBuildCategory = buildCategory;
      this.capturePaletteScroll();
      this.render();
      return;
    }

    const filterToggle = button.dataset.filterToggle;
    if (filterToggle === "locked-buildings") {
      this.showLockedBuildings = !this.showLockedBuildings;
      this.capturePaletteScroll();
      this.render();
      return;
    }
    if (filterToggle === "unavailable-research") {
      this.showUnavailableResearch = !this.showUnavailableResearch;
      this.capturePaletteScroll();
      this.render();
      return;
    }

    const buildId = button.dataset.build;
    if (buildId) {
      this.callbacks.onBuild(buildId);
      return;
    }

    const promoteResearch = button.dataset.promoteResearch;
    if (promoteResearch !== undefined) {
      this.callbacks.onPromoteQueuedResearch(Number(promoteResearch));
      return;
    }

    const removeResearch = button.dataset.removeResearch;
    if (removeResearch !== undefined) {
      this.callbacks.onRemoveQueuedResearch(Number(removeResearch));
      return;
    }

    const researchId = button.dataset.research;
    if (researchId) {
      this.callbacks.onStartResearch(researchId);
      return;
    }

    const cancelIndex = button.dataset.cancel;
    if (cancelIndex !== undefined) {
      this.callbacks.onCancel(Number(cancelIndex));
      return;
    }

    const demolishIndex = button.dataset.demolish;
    if (demolishIndex !== undefined) {
      this.callbacks.onDemolish(Number(demolishIndex));
      return;
    }

    const regionId = button.dataset.region;
    if (regionId) {
      this.callbacks.onSelectRegion(regionId);
      return;
    }

    const speed = button.dataset.speed;
    if (speed !== undefined) {
      this.callbacks.onSpeed(Number(speed));
      return;
    }

    const heatmap = button.dataset.heatmap as HeatmapMode | undefined;
    if (heatmap) {
      this.heatmapMode = heatmap;
      this.callbacks.onHeatmap(heatmap);
      this.render();
      return;
    }

    const action = button.dataset.action;
    if (action === "advance") {
      this.callbacks.onAdvance();
    } else if (action === "open-construction") {
      this.paletteOpen = true;
      this.activeDockTab = "construction";
      this.render();
    } else if (action === "toggle-palette") {
      this.paletteOpen = !this.paletteOpen;
      this.render();
    } else if (action === "dismiss-all-alerts") {
      for (const alert of this.simulation.getSummary().alerts) {
        this.dismissAlert(alert.id);
      }
    } else if (action === "replay-onboarding") {
      this.callbacks.onReplayOnboarding();
    }
  }

  private capturePaletteScroll(): void {
    const scroller = this.root.querySelector<HTMLElement>(".palette-body[data-scroll-key]");
    if (!scroller) {
      return;
    }
    const key = scroller.dataset.scrollKey ?? this.activeDockTab;
    this.paletteScroll[key] = { top: scroller.scrollTop, left: scroller.scrollLeft };
  }

  private restorePaletteScroll(): void {
    const scroller = this.root.querySelector<HTMLElement>(".palette-body[data-scroll-key]");
    if (!scroller) {
      return;
    }
    const key = scroller.dataset.scrollKey ?? this.activeDockTab;
    const scroll = this.paletteScroll[key] ?? { top: 0, left: 0 };
    scroller.scrollTop = scroll.top;
    scroller.scrollLeft = scroll.left;
  }

  private handlePointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    const handle = target.closest<HTMLElement>("[data-resize-panel]");
    const resizeTarget = handle?.dataset.resizePanel as ResizeTarget | undefined;
    if (!handle || (resizeTarget !== "dock" && resizeTarget !== "region")) {
      return;
    }
    event.preventDefault();
    this.resizeDrag = {
      target: resizeTarget,
      startX: event.clientX,
      startY: event.clientY,
      startDockHeight: this.dockHeight,
      startRightPanelWidth: this.rightPanelWidth
    };
    document.addEventListener("pointermove", this.handleResizeMove);
    document.addEventListener("pointerup", this.handleResizeEnd, { once: true });
  }

  private handleDoubleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const handle = target.closest<HTMLElement>("[data-resize-panel]");
    const resizeTarget = handle?.dataset.resizePanel as ResizeTarget | undefined;
    if (resizeTarget === "dock") {
      this.dockHeight = this.clampDockHeight(DEFAULT_DOCK_HEIGHT);
      this.storeNumber(PANEL_STORAGE_KEYS.dockHeight, this.dockHeight);
      this.render();
    } else if (resizeTarget === "region") {
      this.rightPanelWidth = this.clampRightPanelWidth(DEFAULT_RIGHT_PANEL_WIDTH);
      this.storeNumber(PANEL_STORAGE_KEYS.rightPanelWidth, this.rightPanelWidth);
      this.render();
    }
  }

  private readonly handleResizeMove = (event: PointerEvent): void => {
    if (!this.resizeDrag) {
      return;
    }
    if (this.resizeDrag.target === "dock") {
      this.dockHeight = this.clampDockHeight(this.resizeDrag.startDockHeight + this.resizeDrag.startY - event.clientY);
    } else {
      this.rightPanelWidth = this.clampRightPanelWidth(
        this.resizeDrag.startRightPanelWidth + this.resizeDrag.startX - event.clientX
      );
    }
    this.applyPanelSizing();
  };

  private readonly handleResizeEnd = (): void => {
    if (!this.resizeDrag) {
      return;
    }
    this.storeNumber(PANEL_STORAGE_KEYS.dockHeight, this.dockHeight);
    this.storeNumber(PANEL_STORAGE_KEYS.rightPanelWidth, this.rightPanelWidth);
    this.resizeDrag = null;
    document.removeEventListener("pointermove", this.handleResizeMove);
  };

  private handleViewportResize(): void {
    this.dockHeight = this.clampDockHeight(this.dockHeight);
    this.rightPanelWidth = this.clampRightPanelWidth(this.rightPanelWidth);
    this.applyPanelSizing();
  }

  private applyPanelSizing(): void {
    const dockHeight = `${this.dockHeight}px`;
    const dockCurrentHeight = `${this.paletteOpen ? this.dockHeight : DOCK_COLLAPSED_HEIGHT}px`;
    const rightPanelWidth = `${this.rightPanelWidth}px`;
    this.root.style.setProperty("--dock-height", dockHeight);
    this.root.style.setProperty("--dock-current-height", dockCurrentHeight);
    this.root.style.setProperty("--right-panel-width", rightPanelWidth);
    this.root.parentElement?.style.setProperty("--dock-height", dockHeight);
    this.root.parentElement?.style.setProperty("--dock-current-height", dockCurrentHeight);
    this.root.parentElement?.style.setProperty("--right-panel-width", rightPanelWidth);
  }

  private clampDockHeight(value: number): number {
    const max = Math.max(MIN_DOCK_HEIGHT, Math.min(560, window.innerHeight - 120));
    return Math.round(Math.max(MIN_DOCK_HEIGHT, Math.min(max, value)));
  }

  private clampRightPanelWidth(value: number): number {
    const max = Math.max(MIN_RIGHT_PANEL_WIDTH, Math.min(520, window.innerWidth - 48));
    return Math.round(Math.max(MIN_RIGHT_PANEL_WIDTH, Math.min(max, value)));
  }

  private loadStoredNumber(key: string, fallback: number): number {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private storeNumber(key: string, value: number): void {
    window.localStorage.setItem(key, String(Math.round(value)));
  }

  private visibleAlerts(alerts: Alert[]): Alert[] {
    const now = Date.now();
    const currentIds = new Set(alerts.map((alert) => alert.id));
    for (const [alertId, timer] of this.alertTimers) {
      if (!currentIds.has(alertId)) {
        clearTimeout(timer);
        this.alertTimers.delete(alertId);
        this.alertFirstSeen.delete(alertId);
        this.dismissedAlerts.delete(alertId);
      }
    }

    for (const alert of alerts) {
      if (!this.alertFirstSeen.has(alert.id)) {
        this.alertFirstSeen.set(alert.id, now);
      }
      if (alert.autoDismissMs > 0 && !this.alertTimers.has(alert.id)) {
        const firstSeen = this.alertFirstSeen.get(alert.id) ?? now;
        const remaining = Math.max(0, alert.autoDismissMs - (now - firstSeen));
        const timer = window.setTimeout(() => this.dismissAlert(alert.id), remaining);
        this.alertTimers.set(alert.id, timer);
      }
      const elapsed = now - (this.alertFirstSeen.get(alert.id) ?? now);
      if (alert.autoDismissMs > 0 && elapsed >= alert.autoDismissMs) {
        this.dismissedAlerts.add(alert.id);
      }
    }

    return alerts.filter((alert) => !this.dismissedAlerts.has(alert.id));
  }

  private dismissAlert(alertId: string): void {
    this.dismissedAlerts.add(alertId);
    const timer = this.alertTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.alertTimers.delete(alertId);
    }
    this.render();
  }
}

function fmt(value: number, digits = 0): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return value.toFixed(digits);
}

function moneyBillions(valueInMillions: number): string {
  const value = Number.isFinite(valueInMillions) ? (valueInMillions / 1000).toFixed(1) : "0.0";
  return t("common.units.billionCurrency", { value });
}

function translatedOrFallback(key: string, fallback: string): string {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

function miniCoordX(value: number): number {
  return miniCoordAxis(value, 12, 76);
}

function miniCoordY(value: number): number {
  return miniCoordAxis(value, 4, 92);
}

function miniCoordAxis(value: number, offset: number, scale: number): number {
  if (!Number.isFinite(value)) {
    return 50;
  }
  return Math.max(4, Math.min(96, Math.round((offset + value * scale) * 10) / 10));
}

function miniRoutePath(
  source: { x: number; y: number },
  target: { x: number; y: number },
  key: string,
  strength: number
): string {
  const sx = miniCoordX(source.x);
  const sy = miniCoordY(source.y);
  const tx = miniCoordX(target.x);
  const ty = miniCoordY(target.y);
  const dx = tx - sx;
  const dy = ty - sy;
  const distance = Math.hypot(dx, dy) || 1;
  const hash = miniHashString(key);
  const sign = hash % 2 === 0 ? 1 : -1;
  const jitter = ((hash % 9) - 4) * 0.36;
  const curve = Math.min(20, Math.max(5, distance * 0.14 + strength + jitter));
  const cx = miniClampCoord((sx + tx) / 2 - (dy / distance) * curve * sign);
  const cy = miniClampCoord((sy + ty) / 2 + (dx / distance) * curve * sign);
  return `M ${fmt(sx, 1)} ${fmt(sy, 1)} Q ${fmt(cx, 1)} ${fmt(cy, 1)} ${fmt(tx, 1)} ${fmt(ty, 1)}`;
}

function miniClampCoord(value: number): number {
  return Math.max(2, Math.min(98, value));
}

function miniHashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function clampPctFloat(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function parseProgressValue(value: string): number | undefined {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? clampPctFloat(parsed) : undefined;
}

function escapeHtml(value: string): string {

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
