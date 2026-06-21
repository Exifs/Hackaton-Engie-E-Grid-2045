import type { HeatmapMode } from "../game/EGridMapScene";
import type { Alert, BuildAvailability, BuildingDefinition, RegionSnapshot, ResearchOption, SimulationCore } from "../sim";

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
const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  research: "Research",
  energy: "Energy",
  storage: "Storage",
  cooling: "Cooling",
  compute: "Datacenters",
  grid: "Grid & Network"
};
const BUILD_ACCESS_LOCK_CAUSES: Array<NonNullable<BuildAvailability["cause"]>> = [
  "technology",
  "region_tag",
  "region_potential"
];
const RESEARCH_UNAVAILABLE_CAUSES: Array<NonNullable<ResearchOption["lock_cause"]>> = ["prerequisite", "building"];

const PANEL_STORAGE_KEYS = {
  dockHeight: "egrid:dock-height",
  rightPanelWidth: "egrid:right-panel-width"
};
const DEFAULT_DOCK_HEIGHT = 320;
const DEFAULT_RIGHT_PANEL_WIDTH = 336;
const DOCK_COLLAPSED_HEIGHT = 56;
const MIN_DOCK_HEIGHT = 190;
const MIN_RIGHT_PANEL_WIDTH = 280;

type ResizeTarget = "dock" | "region";
type RegionPanelTab = "overview" | "buildings" | "stats";
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
      <section class="top-kpi" aria-label="Indicateurs" data-onboarding-target="kpi.bar">
        ${this.topBrand()}
        ${this.agiDuel(summary.eu_agi_progress, summary.usa_agi_progress)}
        ${this.budgetKpi(summary)}
        ${this.dateKpi(summary)}
        ${this.kpi("EU AGI", `${fmt(summary.eu_agi_progress)}%`, "kpi.agi") }
        ${this.kpi("USA", `${fmt(summary.usa_agi_progress)}%`, "kpi.usa") }
        ${this.kpi("Energie", `${fmt(summary.energy_produced)} / ${fmt(summary.energy_consumed)}`, "kpi.energy")}
        ${this.kpi("Froid", `${fmt(summary.cooling_available)} / ${fmt(summary.cooling_used)}`, "kpi.cooling")}
        ${this.kpi("Compute", `${fmt(summary.compute_produced)}`, "kpi.compute")}
        ${this.kpi("CO2", summary.co2_tier, "kpi.co2")}
        ${this.timeControls(summary)}
        ${this.topMenuCommand()}
      </section>

      <section class="heatmap-switch" aria-label="Heatmaps" data-onboarding-target="overlay.switch">
        ${this.heatmapButton("energy", "Energie")}
        ${this.heatmapButton("cooling", "Froid")}
        ${this.heatmapButton("network", "Reseau")}
        ${this.heatmapButton("compute", "Compute")}
        ${this.heatmapButton("co2", "CO2")}
        ${this.heatmapButton("none", "Off")}
      </section>

      <section class="alerts-panel" aria-label="Alertes" data-onboarding-target="alerts.panel">
        ${alerts.length === 0 ? this.stableStatusCards(summary) : alerts.map((alert) => `
          ${this.alertCard(alert)}
        `).join("")}
        <button class="alerts-collapse" type="button" data-action="dismiss-all-alerts" title="Masquer les alertes">v</button>
      </section>

      <section class="region-panel" aria-label="Region selectionnee" data-onboarding-target="region.panel">
        <div class="region-resize-handle" data-resize-panel="region" title="Redimensionner le panel droit"></div>
        ${selectedRegion ? this.regionPanel(selectedRegion, buildings, monthProgress) : `<div class="panel-title">Selection region</div>`}
      </section>

      <section class="build-palette ${this.paletteOpen ? "is-open" : ""}" aria-label="Construction" data-onboarding-target="construction.menu">
        <div class="dock-resize-handle" data-resize-panel="dock" title="Redimensionner le dock bas"></div>
        <div class="palette-header">
          <button class="palette-toggle" type="button" data-action="toggle-palette">
            <span>${this.paletteOpen ? "Fermer" : "Construire"}</span>
          </button>
          <div class="palette-tabs" role="tablist" aria-label="Panel bas">
            ${this.paletteTab("construction", "Construction")}
            ${this.paletteTab("research", "Recherche")}
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
          `${fmt(activeProgress)}% - ${fmt(activePoints)}/${fmt(active.cost)} pts - ` +
          `ETA ${this.researchEta(active)} - +${fmt(active.monthly_points)} pts/mois`;
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
    this.activeBuildCategory = category;
    this.render();
  }

  openResearchPanel(): void {
    this.capturePaletteScroll();
    this.paletteOpen = true;
    this.activeDockTab = "research";
    this.render();
  }

  private kpi(label: string, value: string, target = ""): string {
    const targetAttr = target ? ` data-onboarding-target="${target}"` : "";
    return `<div class="kpi-chip"${targetAttr}><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  private topBrand(): string {
    return `
      <div class="top-brand" ${this.tooltipAttrs("E-Grid 2045", "Build, optimize, and stabilize Europe's compute energy grid.", "Strategic command layer")}>
        <strong>E-GRID 2045</strong>
        <span>Build. Optimize. Power Europe.</span>
      </div>
    `;
  }

  private budgetKpi(summary: ReturnType<SimulationCore["getSummary"]>): string {
    const trend = summary.monthly_income >= 0 ? "+" : "-";
    const body = `Tresorerie disponible ${moneyBillions(summary.money)}. Variation mensuelle ${trend}${moneyBillions(Math.abs(summary.monthly_income))}.`;
    return `
      <div class="kpi-chip kpi-budget" data-onboarding-target="kpi.money" ${this.tooltipAttrs("Budget", body, "Projection economique")}>
        <span>Budget</span>
        <strong>${escapeHtml(moneyBillions(summary.money))}</strong>
        <small>${trend}${escapeHtml(moneyBillions(Math.abs(summary.monthly_income)))} / mois</small>
      </div>
    `;
  }

  private dateKpi(summary: ReturnType<SimulationCore["getSummary"]>): string {
    const week = Math.max(1, Math.min(52, summary.month * 4));
    const body = `Fenetre de simulation courante: ${summary.date_text}, semaine ${week}.`;
    return `
      <div class="kpi-chip kpi-date" data-onboarding-target="kpi.date" ${this.tooltipAttrs("Date", body, "Calendrier de campagne")}>
        <span>Date</span>
        <strong>${escapeHtml(summary.date_text)}</strong>
        <small>Semaine ${week}</small>
      </div>
    `;
  }

  private agiDuel(europeProgress: number, usaProgress: number): string {
    const eu = clampPctFloat(europeProgress);
    const usa = clampPctFloat(usaProgress);
    const delta = eu - usa;
    const meta = delta >= 0 ? `Europe +${fmt(delta)} pts` : `USA +${fmt(Math.abs(delta))} pts`;
    return `
      <section class="agi-duel" aria-label="Progression AGI Europe contre USA" data-onboarding-target="kpi.agi" ${this.tooltipAttrs("Course AGI", `Europe ${fmt(eu)}% contre USA ${fmt(usa)}%. Les ticks indiquent la progression strategique globale.`, meta)}>
        <div class="agi-side agi-side-europe">
          <span>AGI Progress</span>
          <strong>Europe</strong>
          <i></i>
        </div>
        <div class="agi-ring agi-ring-europe" style="--agi-progress:${eu}">
          <span class="agi-ticks" aria-hidden="true">${this.agiRingTicks(eu)}</span>
          <b>${fmt(eu)}%</b>
        </div>
        <em>VS</em>
        <div class="agi-ring agi-ring-usa" style="--agi-progress:${usa}">
          <span class="agi-ticks" aria-hidden="true">${this.agiRingTicks(usa)}</span>
          <b>${fmt(usa)}%</b>
        </div>
        <div class="agi-side agi-side-usa">
          <span>Rival Curve</span>
          <strong>USA</strong>
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
      <div class="time-controls time-controls-concept" aria-label="Simulation speed" ${this.tooltipAttrs("Simulation speed", "Controle la cadence de la simulation.", "Pause, lecture, avance rapide")}>
        <span class="time-controls-label">Simulation speed</span>
        ${this.conceptSpeedButton(0, summary.simulation_speed === 0, "||", "Pause")}
        ${this.conceptSpeedButton(1, summary.simulation_speed === 1, "&#9654;", "Lecture")}
        ${this.conceptSpeedButton(2, summary.simulation_speed === 2, "&#9654;&#9654;", "Avance rapide")}
        ${this.conceptSpeedButton(4, summary.simulation_speed === 4, "&#9654;&#9654;&#9654;", "Avance maximale")}
        <button class="speed-readout" type="button" data-speed-readout="1" title="Vitesse normale">1.0x</button>
      </div>
    `;
  }

  private conceptSpeedButton(speed: number, active: boolean, label: string, title: string): string {
    return `<button class="speed-button ${active ? "is-active" : ""}" type="button" data-speed="${speed}" title="${escapeHtml(title)}">${label}</button>`;
  }

  private topMenuCommand(): string {
    return `
      <button class="top-menu-command" type="button" data-action="replay-onboarding" data-onboarding-target="onboarding.replay" ${this.tooltipAttrs("Command menu", "Ouvre les aides et commandes systeme disponibles pendant la simulation.", "Menu")}>
        <span></span><span></span><span></span>
      </button>
    `;
  }

  private heatmapButton(mode: HeatmapMode, label: string): string {
    const tooltip = this.heatmapTooltip(mode, label);
    return `<button class="heatmap-button ${this.heatmapMode === mode ? "is-active" : ""}" type="button" data-heatmap="${mode}" data-onboarding-target="overlay.${mode}" aria-label="${escapeHtml(tooltip.title)}" title="${escapeHtml(tooltip.title)}" ${this.tooltipAttrs(tooltip.title, tooltip.body, tooltip.meta)}>${escapeHtml(tooltip.shortLabel)}</button>`;
  }

  private heatmapTooltip(mode: HeatmapMode, label: string): { title: string; body: string; meta: string; shortLabel: string } {
    const tooltips: Record<HeatmapMode, { body: string; meta: string; shortLabel: string }> = {
      energy: {
        body: "Affiche les zones de production, de demande et de deficit energetique.",
        meta: "Power flow",
        shortLabel: "PWR"
      },
      cooling: {
        body: "Met en avant les capacites de refroidissement et les reserves thermiques.",
        meta: "Cooling",
        shortLabel: "CLD"
      },
      network: {
        body: "Priorise les congestions, liens actifs et transferts interregionaux.",
        meta: "Grid",
        shortLabel: "NET"
      },
      compute: {
        body: "Compare la production compute et les regions a forte charge IA.",
        meta: "Compute",
        shortLabel: "CPU"
      },
      co2: {
        body: "Visualise la pression carbone et les zones a fort impact climatique.",
        meta: "Carbon",
        shortLabel: "CO2"
      },
      none: {
        body: "Masque le filtre couleur pour lire la carte tactique brute.",
        meta: "Neutral",
        shortLabel: "OFF"
      }
    };
    const tooltip = tooltips[mode];
    return {
      title: `Heatmap ${label}`,
      body: tooltip.body,
      meta: tooltip.meta,
      shortLabel: tooltip.shortLabel
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
    return `
      <article class="alert-item alert-${alert.state} alert-kind-${this.alertKind(alert)} ${alert.actionable ? "is-actionable" : "is-info"}" data-alert="${escapeHtml(alert.id)}">
        <span class="alert-icon" aria-hidden="true"></span>
        <button class="alert-main" type="button" ${alert.region_id ? `data-region="${escapeHtml(alert.region_id)}"` : ""} ${this.tooltipAttrs(alert.title, alert.body, alert.actionable ? "Cliquer pour cadrer la region" : "Information systeme")}>
          <strong>${escapeHtml(alert.title)}</strong>
          <span>${escapeHtml(alert.body)}</span>
        </button>
        <button class="alert-action" type="button" ${alert.region_id ? `data-region="${escapeHtml(alert.region_id)}"` : ""} title="${escapeHtml(this.alertActionTitle(alert))}">${escapeHtml(this.alertActionLabel(alert))}</button>
        <button class="alert-dismiss" type="button" data-dismiss-alert="${escapeHtml(alert.id)}" title="Fermer">x</button>
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
      return "Claim";
    }
    return alert.actionable ? "View" : "Info";
  }

  private alertActionTitle(alert: Alert): string {
    return this.alertActionLabel(alert) === "View" ? `Voir ${alert.title}` : alert.title;
  }

  private stableStatusCards(summary: ReturnType<SimulationCore["getSummary"]>): string {
    const cards = [
      ["GRID STABLE", "Systems nominal"],
      ["MARKET UPDATE", `Budget ${fmt(summary.money)}M`],
      ["RESEARCH READY", `${fmt(summary.researchers_available)} researchers`],
      ["SIMULATION", summary.date_text]
    ];
    return cards.map(([title, body]) => `
      <article class="alert-item alert-stable is-info">
        <div class="alert-main">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(body)}</span>
        </div>
      </article>
    `).join("");
  }

  private regionPanel(region: RegionSnapshot, buildings: Record<string, BuildingDefinition>, monthProgress: number): string {
    const cached = region.cached;
    const levelXp = Math.min(2000, Math.round((region.buildings.length * 110 + region.tags.length * 40) / 10) * 10);
    const regionLevel = Math.max(1, Math.min(9, Math.floor(levelXp / 400) + 1));
    const levelPct = (levelXp / 2000) * 100;
    const freeSlotCards = Array.from({ length: Math.min(Math.max(region.slots_max - region.slots_used, 0), 2) })
      .map(() => `<span class="locked-slot-card" aria-label="Slot verrouille"><i></i></span>`)
      .join("");
    const queueCards = region.construction_queue.length === 0
      ? `<span class="empty-slot-card">Aucun chantier</span>`
      : region.construction_queue
        .map((item, index) => this.queueCard(region.id, item, index, buildings[item.building_id], monthProgress))
        .join("");
    const demolitionCards = region.deconstruction_queue.length === 0
      ? `<span class="empty-slot-card">Aucune demolition</span>`
      : region.deconstruction_queue
        .map((item, index) => this.demolitionCard(region.id, item, index, buildings[item.building_id], monthProgress))
        .join("");
    const builtCards = region.buildings.length === 0
      ? `<span class="empty-slot-card">Aucun actif</span>`
      : region.buildings
        .map((id, index) => this.builtCard(id, buildings[id], index))
        .join("");
    const energyProduction = cached.energy_production ?? 0;
    const energyDemand = cached.energy_consumption ?? 0;
    const energyReserve = Math.max(0, energyProduction + (cached.energy_imported ?? 0) - energyDemand);
    const coolingAvailable = cached.cooling_available ?? 0;
    const coolingUsed = cached.cooling_used ?? 0;
    const coolingReserve = Math.max(0, coolingAvailable - coolingUsed);
    const computeDemand = cached.compute_demand ?? 0;
    const computeSupply = cached.compute_produced ?? 0;
    const computeDeficit = Math.max(0, computeDemand - computeSupply);
    const computePct = computeDemand > 0 ? (computeSupply / computeDemand) * 100 : 100;

    const overviewContent = `
      <div class="region-tags">
        ${region.tags.slice(0, 6).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="region-section region-buildings">
        <div class="panel-subtitle"><span>Building slots</span><strong>${region.slots_used}/${region.slots_max}</strong></div>
        <div class="built-grid">
          ${builtCards}${freeSlotCards}
        </div>
      </div>
      <div class="region-status-stack">
        ${this.regionStatusBlock("energy", "Energy status", (cached.energy_efficiency ?? 1) * 100, [
          ["Production", `${fmt(energyProduction, 1)} GW`],
          ["Demand", `${fmt(energyDemand, 1)} GW`],
          ["Reserve", `${fmt(energyReserve, 1)} GW`]
        ])}
        ${this.regionStatusBlock("cooling", "Cooling status", (cached.cooling_efficiency ?? 1) * 100, [
          ["Capacity", `${fmt(coolingAvailable, 1)} GWth`],
          ["Usage", `${fmt(coolingUsed, 1)} GWth`],
          ["Reserve", `${fmt(coolingReserve, 1)} GWth`]
        ])}
        ${this.regionStatusBlock("compute", "Compute demand", computePct, [
          ["Demand", `${fmt(computeDemand, 1)} EFLOPS`],
          ["Supply", `${fmt(computeSupply, 1)} EFLOPS`],
          [computeDeficit > 0 ? "Deficit" : "Reserve", `${fmt(computeDeficit > 0 ? computeDeficit : computeSupply - computeDemand, 1)} EFLOPS`]
        ], computeDeficit > 0)}
      </div>
      ${this.regionManageButton(region)}
    `;
    const buildingsContent = `
      <div class="region-section region-buildings">
        <div class="panel-subtitle"><span>Building slots</span><strong>${region.slots_used}/${region.slots_max}</strong></div>
        <div class="built-grid">
          ${builtCards}${freeSlotCards}
        </div>
      </div>
      <div class="region-section region-queue">
        <div class="panel-subtitle"><span>Chantier</span><strong>${region.construction_queue.length}</strong></div>
        <div class="queue-list">
          ${queueCards}
        </div>
      </div>
      <div class="region-section region-demolition">
        <div class="panel-subtitle"><span>Demolition</span><strong>${region.deconstruction_queue.length}</strong></div>
        <div class="queue-list">
          ${demolitionCards}
        </div>
      </div>
      ${this.regionManageButton(region)}
    `;
    const statsContent = `
      <div class="region-stats-grid">
        ${this.regionStatTile("Slots", `${region.slots_used}/${region.slots_max}`, `${Math.max(0, region.slots_max - region.slots_used)} libres`)}
        ${this.regionStatTile("Level XP", `${fmt(levelXp)}`, `Niveau ${regionLevel}`)}
        ${this.regionStatTile("Energy reserve", `${fmt(energyReserve, 1)} GW`, `${fmt(energyProduction, 1)} prod`)}
        ${this.regionStatTile("Cooling reserve", `${fmt(coolingReserve, 1)} GWth`, `${fmt(coolingAvailable, 1)} capacite`)}
        ${this.regionStatTile(computeDeficit > 0 ? "Compute deficit" : "Compute reserve", `${fmt(computeDeficit > 0 ? computeDeficit : computeSupply - computeDemand, 1)} EFLOPS`, `${fmt(computeSupply, 1)} supply`)}
        ${this.regionStatTile("Tags", `${region.tags.length}`, region.tags.slice(0, 2).join(" / ") || "Aucun")}
      </div>
      <div class="region-status-stack">
        ${this.regionStatusBlock("energy", "Energy status", (cached.energy_efficiency ?? 1) * 100, [
          ["Production", `${fmt(energyProduction, 1)} GW`],
          ["Demand", `${fmt(energyDemand, 1)} GW`],
          ["Reserve", `${fmt(energyReserve, 1)} GW`]
        ])}
        ${this.regionStatusBlock("cooling", "Cooling status", (cached.cooling_efficiency ?? 1) * 100, [
          ["Capacity", `${fmt(coolingAvailable, 1)} GWth`],
          ["Usage", `${fmt(coolingUsed, 1)} GWth`],
          ["Reserve", `${fmt(coolingReserve, 1)} GWth`]
        ])}
        ${this.regionStatusBlock("compute", "Compute demand", computePct, [
          ["Demand", `${fmt(computeDemand, 1)} EFLOPS`],
          ["Supply", `${fmt(computeSupply, 1)} EFLOPS`],
          [computeDeficit > 0 ? "Deficit" : "Reserve", `${fmt(computeDeficit > 0 ? computeDeficit : computeSupply - computeDemand, 1)} EFLOPS`]
        ], computeDeficit > 0)}
      </div>
    `;
    const tabContent = this.activeRegionTab === "buildings"
      ? buildingsContent
      : this.activeRegionTab === "stats"
        ? statsContent
        : overviewContent;

    return `
      <div class="panel-title region-title">
        <div>
          <span>Region</span>
          <strong>${escapeHtml(region.display_name)}</strong>
        </div>
        <span class="region-close" aria-hidden="true">x</span>
      </div>
      <div class="region-level-card">
        <strong>${regionLevel}</strong>
        <div>
          <span>Region level</span>
          <i style="--meter:${clampPctFloat(levelPct)}%"></i>
        </div>
        <small>${fmt(levelXp)} / 2 000 XP</small>
      </div>
      <div class="region-tabs" role="tablist" aria-label="Vues region">
        ${this.regionTabButton("overview", "Overview", "Vue synthese", "Slots, statuts et action principale")}
        ${this.regionTabButton("buildings", "Buildings", "Actifs regionaux", "Actifs, chantiers et demolition")}
        ${this.regionTabButton("stats", "Stats", "Statistiques detaillees", "Capacites, reserves et tags")}
      </div>
      <div class="region-tab-view region-tab-${this.activeRegionTab}">
        ${tabContent}
      </div>
    `;
  }

  private regionTabButton(tab: RegionPanelTab, label: string, title: string, body: string): string {
    const active = this.activeRegionTab === tab;
    return `
      <button class="${active ? "is-active" : ""}" type="button" role="tab" data-region-tab="${tab}" aria-selected="${active}" ${this.tooltipAttrs(title, body, active ? "Actif" : "Changer de vue")}>
        ${escapeHtml(label)}
      </button>
    `;
  }

  private regionManageButton(region: RegionSnapshot): string {
    return `
      <button class="region-manage-button" type="button" data-action="open-construction" ${this.tooltipAttrs("Manage region", `Open the construction dock for ${region.display_name}.`, `${region.slots_max - region.slots_used} free slots`)}>
        Manage region
      </button>
    `;
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
    return `
      <div class="region-status region-status-${tone} ${isDeficit ? "has-deficit" : ""}" ${this.tooltipAttrs(title, tooltipBody, `${fmt(clampPctFloat(pct))}%`)}>
        <div class="region-status-title">
          <span class="region-status-heading">
            <i class="region-status-icon" aria-hidden="true"></i>
            <span>${escapeHtml(title)}</span>
          </span>
          <strong>${fmt(clampPctFloat(pct))}%</strong>
        </div>
        <i style="--meter:${clampPctFloat(pct)}%"></i>
        <div class="region-status-metrics">
          ${metrics.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join("")}
        </div>
      </div>
    `;
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
    return `
      <button class="queue-card" type="button" data-cancel="${index}" title="Annuler ${escapeHtml(building?.display_name ?? item.building_id)}">
        ${this.buildingArt(building)}
        <span class="queue-copy">
          <strong>${escapeHtml(building?.display_name ?? item.building_id)}</strong>
          <small>${item.months_remaining}m restantes</small>
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
    return `
      <span class="queue-card demolition-card" title="Demolition ${escapeHtml(building?.display_name ?? item.building_id)}">
        ${this.buildingArt(building)}
        <span class="queue-copy">
          <strong>${escapeHtml(building?.display_name ?? item.building_id)}</strong>
          <small>Demolition · ${item.months_remaining}m restantes</small>
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
      <button class="built-card" type="button" data-demolish="${index}" title="Demonter ${escapeHtml(building?.display_name ?? buildingId)} (${demolishCost}M)" ${this.tooltipAttrs(building?.display_name ?? buildingId, this.buildingTooltipBody(building), `Demontage ${demolishCost}M`)}>
        ${this.buildingArt(building)}
        <span class="built-copy">
          <strong>${escapeHtml(building?.display_name ?? buildingId)}</strong>
          <small>${escapeHtml(this.buildingSummary(building))}</small>
          <span class="built-action">Demonter ${demolishCost}M</span>
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
      parts.push(`+${fmt(building.produces_energy)} Energie`);
    }
    if (building.produces_cooling > 0) {
      parts.push(`+${fmt(building.produces_cooling)} Froid`);
    }
    if (building.produces_compute > 0) {
      parts.push(`+${fmt(building.produces_compute)} Compute`);
    }
    if (building.produces_storage > 0) {
      parts.push(`+${fmt(building.produces_storage)} Stockage`);
    }
    if (building.produces_researchers > 0) {
      parts.push(`+${fmt(building.produces_researchers)} R&D`);
    }
    return parts.slice(0, 2).join(" / ") || CATEGORY_LABELS[building.category] || building.category;
  }

  private buildingMetricChips(building: BuildingDefinition): string {
    const chips: Array<{ label: string; tone: string }> = [];
    const add = (value: number, label: string, tone: string, prefix = "+") => {
      if (value > 0) {
        chips.push({ label: `${prefix}${fmt(value)} ${label}`, tone });
      }
    };
    add(building.produces_energy, "E", "energy");
    add(building.produces_cooling, "F", "cooling");
    add(building.produces_compute, "C", "compute");
    add(building.produces_storage, "S", "storage");
    add(building.produces_researchers, "R&D", "research");
    add(building.consumes_energy, "E", "cost", "-");
    add(building.consumes_cooling, "F", "cost", "-");
    add(building.co2_monthly, "CO2", "co2", "+");
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
        <div class="build-category-tabs" role="tablist" aria-label="Categories batiments">
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
    const tooltip =
      `${activeFlows} liaisons actives. ${congestedFlows} congestions. ` +
      `Flux energie ${fmt(summary.energy_consumed)} / ${fmt(summary.energy_produced)} GW.`;

    return `
      <aside class="grid-overview-card" aria-label="Grid overview" ${this.tooltipAttrs("Grid overview", tooltip, "Carte reseau compacte")}>
        <div class="grid-overview-heading">
          <strong>Grid overview</strong>
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
          <span class="legend-power">Power flow <b>${fmt(activeFlows)}</b></span>
          <span class="legend-data">Data flow <b>${fmt(summary.compute_used)}</b></span>
          <span class="legend-congestion">Congestion <b>${fmt(congestedFlows)}</b></span>
          <span class="legend-planned">Planned</span>
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
    return CATEGORY_LABELS[category] ?? category;
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
      <div class="build-category${previewClass}">
        <div class="build-category-heading">
          <span class="build-category-icon utility-category-icon utility-category-icon-${this.categoryIconKey(category)}" aria-hidden="true"></span>
          <h2>
            <button class="build-category-title" type="button" data-build-category-title="${escapeHtml(category)}" ${this.tooltipAttrs(label, `Afficher seulement ${label}.`, `${optionCount} options`)}>
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
      <span class="build-card is-disabled build-locked-preview-card" role="button" aria-disabled="true" ${this.tooltipAttrs(label, "Options verrouillees par la recherche ou le potentiel regional.", "A debloquer")}>
        <span class="build-visual locked-preview-art utility-category-icon utility-category-icon-${this.categoryIconKey(category)}" aria-hidden="true">
          <span>${index === 0 ? "Rech." : ""}</span>
        </span>
        <span class="build-copy">
          <strong>${escapeHtml(label)}</strong>
          <small>A debloquer</small>
        </span>
      </span>
    `).join("");
  }

  private categoryIconKey(category: string): string {
    const icons: Record<string, string> = {
      research: "research",
      energy: "energy",
      storage: "grid",
      cooling: "cooling",
      compute: "datacenter",
      grid: "grid",
      all: "grid"
    };
    return icons[category] ?? "grid";
  }

  private buildButton(building: BuildingDefinition, availability: BuildAvailability | undefined): string {
    const enabled = Boolean(availability?.ok);
    const reason = availability?.reason ?? "";
    const cause = availability?.cause ? `data-availability-cause="${availability.cause}"` : "";
    return `
      <button class="build-card ${enabled ? "" : "is-disabled"}" type="button" data-build="${building.id}" data-onboarding-target="build.${building.id}" ${cause} ${enabled ? "" : "disabled"} title="${escapeHtml(reason || building.description)}" ${this.tooltipAttrs(building.display_name, this.buildingTooltipBody(building), enabled ? "Disponible" : reason || "Verrouille")}>
        <span class="build-visual" aria-hidden="true">
          ${this.buildingArt(building)}
          ${this.buildingBadges(building, availability)}
        </span>
        <span class="build-copy">
          <strong>${escapeHtml(building.display_name)}</strong>
          <small>${building.cost}M · ${building.construction_months}m · ${building.slots_required} slots</small>
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

  private tooltipAttrs(title: string, body: string, meta = ""): string {
    return `data-rich-tooltip="1" data-tooltip-title="${escapeHtml(title)}" data-tooltip-body="${escapeHtml(body)}" data-tooltip-meta="${escapeHtml(meta)}"`;
  }

  private buildingTooltipBody(building: BuildingDefinition | undefined): string {
    if (!building) {
      return "Infrastructure regionale.";
    }
    const basics = `${CATEGORY_LABELS[building.category] ?? building.category} - ${building.cost}M - ${building.construction_months}m - ${building.slots_required} slots`;
    const output = this.buildingSummary(building);
    const demand: string[] = [];
    if (building.consumes_energy > 0) {
      demand.push(`-${fmt(building.consumes_energy)} Energie`);
    }
    if (building.consumes_cooling > 0) {
      demand.push(`-${fmt(building.consumes_cooling)} Froid`);
    }
    if (building.researchers_required > 0) {
      demand.push(`${fmt(building.researchers_required)} chercheurs`);
    }
    return [basics, output, demand.join(" / "), building.description].filter(Boolean).join(" | ");
  }

  private buildingBadges(building: BuildingDefinition, availability: BuildAvailability | undefined): string {
    const badges: string[] = [];
    if (building.unlock_technology) {
      badges.push(availability?.ok ? "Tech OK" : "Rech.");
    }
    if (building.id === "energy_research_center") {
      badges.push("Paliers");
    } else if (building.id === "ai_research_center") {
      badges.push("AGI+");
    }
    if (badges.length === 0) {
      return "";
    }
    return `<span class="build-badges">${badges.slice(0, 2).map((badge) => `<span>${escapeHtml(badge)}</span>`).join("")}</span>`;
  }

  private activeDockFilterToggle(): string {
    if (this.activeDockTab === "construction") {
      return this.filterToggle("locked-buildings", "Afficher verrouilles", this.showLockedBuildings);
    }
    return this.filterToggle("unavailable-research", "Afficher indisponibles", this.showUnavailableResearch);
  }

  private filterToggle(id: "locked-buildings" | "unavailable-research", label: string, checked: boolean): string {
    return `
      <button class="dock-filter-toggle ${checked ? "is-active" : ""}" type="button" data-filter-toggle="${id}" aria-pressed="${checked}">
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
            <strong>${escapeHtml(active.display_name)}</strong>
            <span data-research-active-copy data-research-active-detail>${fmt(activeTargetProgress)}% - ${fmt(activePoints)}/${fmt(active.cost)} pts - ETA ${this.researchEta(active)} - +${fmt(active.monthly_points)} pts/mois</span>
          </div>
        </div>
      `
      : `<div class="research-status" data-onboarding-target="research.status" style="--research-progress:0%"><div><strong>Aucune recherche active</strong><span>Choisis un palier a lancer</span></div></div>`;
    return `
      <div class="research-panel">
        ${statusMarkup}
        <div class="research-queue" aria-label="File de recherche">
          <div class="research-queue-title"><span>File</span><strong>${queued.length}</strong></div>
          ${queued.length === 0
            ? `<span class="research-queue-empty">Aucune recherche en attente</span>`
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
      .sort((a, b) => a.tier - b.tier || a.branch.localeCompare(b.branch) || a.display_name.localeCompare(b.display_name))
      .slice(0, 4)
      .map((option) => {
        const effect = this.researchEffect(option);
        const meta = `${option.branch} T${option.tier} - ${fmt(option.cost)} pts`;
        return `
          <span class="research-card research-preview-card research-locked" role="button" aria-disabled="true" ${this.tooltipAttrs(option.display_name, option.reason || option.notes || effect, meta)}>
            <span class="research-card-head">
              <span class="research-card-glyph utility-category-icon utility-category-icon-${this.researchBranchIconKey(option.branch)}" aria-hidden="true"></span>
              <span>
                <strong>${escapeHtml(option.display_name)}</strong>
                <small>${escapeHtml(option.branch)} T${option.tier}</small>
              </span>
            </span>
            <span class="research-progress" style="--progress:0%"><b></b></span>
            <span class="research-copy">${escapeHtml(option.reason || "Recherche requise")}</span>
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
          <strong>${escapeHtml(option.display_name)}</strong>
          <small>#${option.queue_position} - ETA ${this.researchEta(option)} - +${fmt(option.monthly_points)} pts/mois</small>
        </span>
        <span class="research-queue-actions">
          <button type="button" data-promote-research="${index}" ${index <= 0 ? "disabled" : ""} title="Remonter ${escapeHtml(option.display_name)}">Monter</button>
          <button type="button" data-remove-research="${index}" title="Retirer ${escapeHtml(option.display_name)}">Retirer</button>
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
      .map((id) => buildings[id]?.display_name ?? id)
      .filter(Boolean)
      .slice(0, 3);
    const effect = this.researchEffect(option);
    const progressKey = this.researchCardProgressKey(option);
    const targetProgress = this.visualResearchProgress(option, monthProgress);
    const progress = this.renderProgressValue(progressKey, targetProgress, "--progress");
    const lockCause = option.lock_cause ? `data-lock-cause="${option.lock_cause}"` : "";
    const tooltipBody = [option.reason || option.notes || effect, unlocks.length ? `Debloque: ${unlocks.join(", ")}` : ""]
      .filter(Boolean)
      .join(" | ");
    return `
      <button class="research-card research-${option.status}" type="button" data-research="${option.id}" data-onboarding-target="research.${option.id}" ${lockCause} ${enabled ? "" : "disabled"} title="${escapeHtml(option.reason || option.notes)}" ${this.tooltipAttrs(option.display_name, tooltipBody, `${option.branch} T${option.tier} - ${fmt(option.cost)} pts`)}>
        <span class="research-card-head">
          <span class="research-card-glyph utility-category-icon utility-category-icon-${this.researchBranchIconKey(option.branch)}" aria-hidden="true"></span>
          <strong>${escapeHtml(option.display_name)}</strong>
          <small>${escapeHtml(option.branch)} T${option.tier} · ${fmt(option.cost)} pts · ${this.researchEta(option)}</small>
        </span>
        <span class="research-progress" ${this.progressAttributes(progressKey, "--progress", "research-card", targetProgress)} data-progress-fill="research-card" data-progress-research-id="${escapeHtml(option.id)}" style="--progress:${progress}%"><b></b></span>
        <span class="research-copy">${escapeHtml(option.reason || option.notes || effect)}</span>
        <span class="research-tags">
          ${unlocks.map((unlock) => `<span>Debloque ${escapeHtml(unlock)}</span>`).join("")}
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
    if (normalized.includes("infrastructure") || normalized.includes("grid")) {
      return "grid";
    }
    if (normalized.includes("cool")) {
      return "cooling";
    }
    return "research";
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
      return "terminee";
    }
    if (!Number.isFinite(option.estimated_months_remaining)) {
      return "debit 0";
    }
    return `${Math.max(option.estimated_months_remaining, 0)}m`;
  }

  private researchEffect(option: ResearchOption): string {
    if (option.effect_value_pct > 0) {
      return `+${fmt(option.effect_value_pct)}% ${option.effect_key}`;
    }
    if (option.effect_value) {
      return option.effect_value;
    }
    return option.effect_key;
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
    const bodyElement = document.createElement("span");
    bodyElement.textContent = body;
    tooltip.replaceChildren(titleElement, bodyElement);
    if (meta) {
      const metaElement = document.createElement("small");
      metaElement.textContent = meta;
      tooltip.append(metaElement);
    }
    tooltip.classList.add("is-visible");
    this.tooltipTrigger = trigger;
    this.positionTooltip(x, y);
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
  if (!Number.isFinite(valueInMillions)) {
    return "EUR 0.0B";
  }
  return `EUR ${(valueInMillions / 1000).toFixed(1)}B`;
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
