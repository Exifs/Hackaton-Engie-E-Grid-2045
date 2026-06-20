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

const CATEGORY_ORDER = ["research", "energy", "storage", "cooling", "compute", "grid"];
const ALL_BUILD_CATEGORY = "all";
const CATEGORY_LABELS: Record<string, string> = {
  all: "Tous",
  research: "Recherche",
  energy: "Energie",
  storage: "Stockage",
  cooling: "Froid",
  compute: "Compute",
  grid: "Reseau"
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
        ${this.kpi("Date", summary.date_text, "kpi.date")}
        ${this.kpi("Budget", `${fmt(summary.money)} M`, "kpi.money") }
        ${this.kpi("EU AGI", `${fmt(summary.eu_agi_progress)}%`, "kpi.agi") }
        ${this.kpi("USA", `${fmt(summary.usa_agi_progress)}%`, "kpi.usa") }
        ${this.kpi("Energie", `${fmt(summary.energy_produced)} / ${fmt(summary.energy_consumed)}`, "kpi.energy")}
        ${this.kpi("Froid", `${fmt(summary.cooling_available)} / ${fmt(summary.cooling_used)}`, "kpi.cooling")}
        ${this.kpi("Compute", `${fmt(summary.compute_produced)}`, "kpi.compute")}
        ${this.kpi("CO2", summary.co2_tier, "kpi.co2")}
        <div class="time-controls" aria-label="Vitesse">
          ${this.speedButton(0, summary.simulation_speed === 0)}
          ${this.speedButton(1, summary.simulation_speed === 1)}
          ${this.speedButton(2, summary.simulation_speed === 2)}
          ${this.speedButton(4, summary.simulation_speed === 4)}
          <button class="icon-command" type="button" data-action="advance" title="Mois suivant">+1</button>
          <button class="icon-command tutorial-replay-button" type="button" data-action="replay-onboarding" data-onboarding-target="onboarding.replay" title="Rejouer le tutoriel">?</button>
        </div>
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

  private speedButton(speed: number, active: boolean): string {
    const label = speed === 0 ? "II" : `${speed}x`;
    return `<button class="speed-button ${active ? "is-active" : ""}" type="button" data-speed="${speed}" title="Vitesse ${label}">${label}</button>`;
  }

  private heatmapButton(mode: HeatmapMode, label: string): string {
    return `<button class="heatmap-button ${this.heatmapMode === mode ? "is-active" : ""}" type="button" data-heatmap="${mode}" data-onboarding-target="overlay.${mode}">${label}</button>`;
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
      <article class="alert-item alert-${alert.state} ${alert.actionable ? "is-actionable" : "is-info"}" data-alert="${escapeHtml(alert.id)}">
        <button class="alert-main" type="button" ${alert.region_id ? `data-region="${escapeHtml(alert.region_id)}"` : ""} ${this.tooltipAttrs(alert.title, alert.body, alert.actionable ? "Cliquer pour cadrer la region" : "Information systeme")}>
          <strong>${escapeHtml(alert.title)}</strong>
          <span>${escapeHtml(alert.body)}</span>
        </button>
        <button class="alert-dismiss" type="button" data-dismiss-alert="${escapeHtml(alert.id)}" title="Fermer">x</button>
        ${progress}
      </article>
    `;
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
    const slotPct = region.slots_max > 0 ? (region.slots_used / region.slots_max) * 100 : 0;
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

    return `
      <div class="panel-title">
        <span>Region</span>
        <strong>${escapeHtml(region.display_name)}</strong>
      </div>
      <div class="region-stats">
        ${this.bar("Slots", slotPct, `${region.slots_used}/${region.slots_max}`, "cyan")}
        ${this.bar("Energie", (cached.energy_efficiency ?? 1) * 100, `${fmt(cached.energy_efficiency ?? 1, 2)}`, "green")}
        ${this.bar("Froid", (cached.cooling_efficiency ?? 1) * 100, `${fmt(cached.cooling_efficiency ?? 1, 2)}`, "blue")}
        ${this.bar("Compute", Math.min((cached.compute_produced ?? 0) * 4, 100), fmt(cached.compute_produced ?? 0), "violet")}
      </div>
      <div class="region-tags">
        ${region.tags.slice(0, 6).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
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
      <div class="region-section region-buildings">
        <div class="panel-subtitle"><span>Batiments actifs</span><strong>${region.buildings.length}/${region.slots_max}</strong></div>
        <div class="built-grid">
          ${builtCards}
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
        <span>${CATEGORY_LABELS[category] ?? category}</span>
        <strong>${count}</strong>
      </button>
    `;
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
    const items = Object.values(buildings).filter((building) =>
      building.category === category && this.shouldShowBuilding(building, availability[building.id])
    );
    if (items.length === 0) {
      return "";
    }
    return `
      <div class="build-category">
        <h2>${CATEGORY_LABELS[category] ?? category}</h2>
        <div class="build-grid">
          ${items.map((building) => this.buildButton(building, availability[building.id])).join("")}
        </div>
      </div>
    `;
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
        <div class="research-grid">
          ${visibleOptions.map((option) => this.researchCard(option, buildings, monthProgress)).join("")}
        </div>
      </div>
    `;
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
    return `
      <button class="research-card research-${option.status}" type="button" data-research="${option.id}" data-onboarding-target="research.${option.id}" ${lockCause} ${enabled ? "" : "disabled"} title="${escapeHtml(option.reason || option.notes)}">
        <span class="research-card-head">
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

    const buildCategory = button.dataset.buildCategory;
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
    } else if (action === "toggle-palette") {
      this.paletteOpen = !this.paletteOpen;
      this.render();
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
