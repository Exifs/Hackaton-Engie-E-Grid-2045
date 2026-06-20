import type { HeatmapMode } from "../game/EGridMapScene";
import type { Alert, BuildAvailability, BuildingDefinition, RegionSnapshot, ResearchOption, SimulationCore } from "../sim";

interface HudCallbacks {
  onBuild: (buildingId: string) => void;
  onCancel: (queueIndex: number) => void;
  onDemolish: (buildingIndex: number) => void;
  onStartResearch: (technologyId: string) => void;
  onAdvance: () => void;
  onSpeed: (speed: number) => void;
  onSelectRegion: (regionId: string) => void;
  onHeatmap: (mode: HeatmapMode) => void;
}

const CATEGORY_ORDER = ["research", "energy", "storage", "cooling", "compute", "grid"];
const CATEGORY_LABELS: Record<string, string> = {
  research: "Recherche",
  energy: "Energie",
  storage: "Stockage",
  cooling: "Froid",
  compute: "Compute",
  grid: "Reseau"
};

export class GameHud {
  private readonly root: HTMLElement;
  private readonly simulation: SimulationCore;
  private readonly callbacks: HudCallbacks;
  private heatmapMode: HeatmapMode = "energy";
  private paletteOpen = !window.matchMedia("(max-width: 720px)").matches;
  private activeDockTab: "construction" | "research" = "construction";
  private readonly paletteScrollTop: Record<string, number> = { construction: 0, research: 0 };
  private readonly dismissedAlerts = new Set<string>();
  private readonly alertFirstSeen = new Map<string, number>();
  private readonly alertTimers = new Map<string, number>();

  constructor(root: HTMLElement, simulation: SimulationCore, callbacks: HudCallbacks) {
    this.root = root;
    this.simulation = simulation;
    this.callbacks = callbacks;
    this.root.addEventListener("click", (event) => this.handleClick(event));
  }

  render(): void {
    this.capturePaletteScroll();
    const summary = this.simulation.getSummary();
    const selectedRegion = this.simulation.getRegionSnapshot();
    const buildings = this.simulation.getBuildingDefinitions();
    const availability = this.simulation.getBuildAvailability();
    const researchOptions = this.simulation.getResearchOptions();
    const alerts = this.visibleAlerts(summary.alerts);

    this.root.innerHTML = `
      <section class="top-kpi" aria-label="Indicateurs">
        ${this.kpi("Date", summary.date_text)}
        ${this.kpi("Budget", `${fmt(summary.money)} M`) }
        ${this.kpi("EU AGI", `${fmt(summary.eu_agi_progress)}%`) }
        ${this.kpi("USA", `${fmt(summary.usa_agi_progress)}%`) }
        ${this.kpi("Energie", `${fmt(summary.energy_produced)} / ${fmt(summary.energy_consumed)}`)}
        ${this.kpi("Froid", `${fmt(summary.cooling_available)} / ${fmt(summary.cooling_used)}`)}
        ${this.kpi("Compute", `${fmt(summary.compute_produced)}`)}
        ${this.kpi("CO2", summary.co2_tier)}
        <div class="time-controls" aria-label="Vitesse">
          ${this.speedButton(0, summary.simulation_speed === 0)}
          ${this.speedButton(1, summary.simulation_speed === 1)}
          ${this.speedButton(2, summary.simulation_speed === 2)}
          ${this.speedButton(4, summary.simulation_speed === 4)}
          <button class="icon-command" type="button" data-action="advance" title="Mois suivant">+1</button>
        </div>
      </section>

      <section class="heatmap-switch" aria-label="Heatmaps">
        ${this.heatmapButton("energy", "Energie")}
        ${this.heatmapButton("cooling", "Froid")}
        ${this.heatmapButton("compute", "Compute")}
        ${this.heatmapButton("co2", "CO2")}
        ${this.heatmapButton("none", "Off")}
      </section>

      <section class="alerts-panel" aria-label="Alertes">
        ${alerts.length === 0 ? `<div class="alert-empty">Systemes stables</div>` : alerts.map((alert) => `
          ${this.alertCard(alert)}
        `).join("")}
      </section>

      <section class="region-panel" aria-label="Region selectionnee">
        ${selectedRegion ? this.regionPanel(selectedRegion, buildings) : `<div class="panel-title">Selection region</div>`}
      </section>

      <section class="build-palette ${this.paletteOpen ? "is-open" : ""}" aria-label="Construction">
        <div class="palette-header">
          <button class="palette-toggle" type="button" data-action="toggle-palette">
            <span>${this.paletteOpen ? "Fermer" : "Construire"}</span>
          </button>
          <div class="palette-tabs" role="tablist" aria-label="Panel bas">
            ${this.paletteTab("construction", "Construction")}
            ${this.paletteTab("research", "Recherche")}
          </div>
        </div>
        <div class="palette-body palette-body-${this.activeDockTab}" data-scroll-key="${this.activeDockTab}">
          ${this.activeDockTab === "construction"
            ? CATEGORY_ORDER.map((category) => this.categoryBlock(category, buildings, availability)).join("")
            : this.researchPanel(researchOptions, buildings)}
        </div>
      </section>
    `;
    this.restorePaletteScroll();
  }

  private kpi(label: string, value: string): string {
    return `<div class="kpi-chip"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  private speedButton(speed: number, active: boolean): string {
    const label = speed === 0 ? "II" : `${speed}x`;
    return `<button class="speed-button ${active ? "is-active" : ""}" type="button" data-speed="${speed}" title="Vitesse ${label}">${label}</button>`;
  }

  private heatmapButton(mode: HeatmapMode, label: string): string {
    return `<button class="heatmap-button ${this.heatmapMode === mode ? "is-active" : ""}" type="button" data-heatmap="${mode}">${label}</button>`;
  }

  private paletteTab(tab: "construction" | "research", label: string): string {
    const active = this.activeDockTab === tab;
    return `<button class="palette-tab ${active ? "is-active" : ""}" type="button" data-palette-tab="${tab}" role="tab" aria-selected="${active}">${label}</button>`;
  }

  private alertCard(alert: Alert): string {
    const elapsed = this.alertFirstSeen.has(alert.id) ? Math.max(0, Date.now() - (this.alertFirstSeen.get(alert.id) ?? Date.now())) : 0;
    const progress = alert.autoDismissMs > 0
      ? `<i class="alert-life" style="--alert-life:${alert.autoDismissMs}ms; --alert-elapsed:${elapsed}ms"></i>`
      : "";
    return `
      <article class="alert-item alert-${alert.state} ${alert.actionable ? "is-actionable" : "is-info"}" data-alert="${escapeHtml(alert.id)}">
        <button class="alert-main" type="button" ${alert.region_id ? `data-region="${escapeHtml(alert.region_id)}"` : ""}>
          <strong>${escapeHtml(alert.title)}</strong>
          <span>${escapeHtml(alert.body)}</span>
        </button>
        <button class="alert-dismiss" type="button" data-dismiss-alert="${escapeHtml(alert.id)}" title="Fermer">x</button>
        ${progress}
      </article>
    `;
  }

  private regionPanel(region: RegionSnapshot, buildings: Record<string, BuildingDefinition>): string {
    const cached = region.cached;
    const slotPct = region.slots_max > 0 ? (region.slots_used / region.slots_max) * 100 : 0;
    const queueCards = region.construction_queue.length === 0
      ? `<span class="empty-slot-card">Aucun chantier</span>`
      : region.construction_queue
        .map((item, index) => this.queueCard(item, index, buildings[item.building_id]))
        .join("");
    const demolitionCards = region.deconstruction_queue.length === 0
      ? `<span class="empty-slot-card">Aucune demolition</span>`
      : region.deconstruction_queue
        .map((item) => this.demolitionCard(item, buildings[item.building_id]))
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
    item: { building_id: string; months_remaining: number; total_months: number },
    index: number,
    building: BuildingDefinition | undefined
  ): string {
    const progress = item.total_months > 0 ? ((item.total_months - item.months_remaining) / item.total_months) * 100 : 100;
    return `
      <button class="queue-card" type="button" data-cancel="${index}" title="Annuler ${escapeHtml(building?.display_name ?? item.building_id)}">
        ${this.buildingArt(building)}
        <span class="queue-copy">
          <strong>${escapeHtml(building?.display_name ?? item.building_id)}</strong>
          <small>${item.months_remaining}m restantes</small>
          <i style="--progress:${clampPct(progress)}%"><b></b></i>
        </span>
      </button>
    `;
  }

  private demolitionCard(
    item: { building_id: string; months_remaining: number; total_months: number },
    building: BuildingDefinition | undefined
  ): string {
    const progress = item.total_months > 0 ? ((item.total_months - item.months_remaining) / item.total_months) * 100 : 100;
    return `
      <span class="queue-card demolition-card" title="Demolition ${escapeHtml(building?.display_name ?? item.building_id)}">
        ${this.buildingArt(building)}
        <span class="queue-copy">
          <strong>${escapeHtml(building?.display_name ?? item.building_id)}</strong>
          <small>Demolition · ${item.months_remaining}m restantes</small>
          <i style="--progress:${clampPct(progress)}%"><b></b></i>
        </span>
      </span>
    `;
  }

  private builtCard(buildingId: string, building: BuildingDefinition | undefined, index: number): string {
    const demolishCost = building ? Math.ceil(building.cost * 0.2) : 0;
    return `
      <button class="built-card" type="button" data-demolish="${index}" title="Demonter ${escapeHtml(building?.display_name ?? buildingId)} (${demolishCost}M)">
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
  private categoryBlock(

    category: string,
    buildings: Record<string, BuildingDefinition>,
    availability: Record<string, BuildAvailability>
  ): string {
    const items = Object.values(buildings).filter((building) => building.category === category);
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
    return `
      <button class="build-card ${enabled ? "" : "is-disabled"}" type="button" data-build="${building.id}" ${enabled ? "" : "disabled"} title="${escapeHtml(reason || building.description)}">
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

  private researchPanel(options: ResearchOption[], buildings: Record<string, BuildingDefinition>): string {
    const active = options.find((option) => option.status === "active");
    const activeSummary = active
      ? `<div class="research-status"><strong>${escapeHtml(active.display_name)}</strong><span>${fmt(active.progress * 100)}% · ${this.researchEta(active)}</span></div>`
      : `<div class="research-status"><strong>Aucune recherche active</strong><span>Choisis un palier a lancer</span></div>`;
    return `
      <div class="research-panel">
        ${activeSummary}
        <div class="research-grid">
          ${options.map((option) => this.researchCard(option, buildings)).join("")}
        </div>
      </div>
    `;
  }

  private researchCard(option: ResearchOption, buildings: Record<string, BuildingDefinition>): string {
    const enabled = option.status === "available";
    const unlocks = option.unlocks
      .map((id) => buildings[id]?.display_name ?? id)
      .filter(Boolean)
      .slice(0, 3);
    const effect = this.researchEffect(option);
    const progress = clampPct(option.progress * 100);
    return `
      <button class="research-card research-${option.status}" type="button" data-research="${option.id}" ${enabled ? "" : "disabled"} title="${escapeHtml(option.reason || option.notes)}">
        <span class="research-card-head">
          <strong>${escapeHtml(option.display_name)}</strong>
          <small>${escapeHtml(option.branch)} T${option.tier} · ${fmt(option.cost)} pts · ${this.researchEta(option)}</small>
        </span>
        <span class="research-progress" style="--progress:${progress}%"><b></b></span>
        <span class="research-copy">${escapeHtml(option.reason || option.notes || effect)}</span>
        <span class="research-tags">
          ${unlocks.map((unlock) => `<span>Debloque ${escapeHtml(unlock)}</span>`).join("")}
          ${effect ? `<span>${escapeHtml(effect)}</span>` : ""}
        </span>
      </button>
    `;
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

    const buildId = button.dataset.build;
    if (buildId) {
      this.callbacks.onBuild(buildId);
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
    }
  }

  private capturePaletteScroll(): void {
    const scroller = this.root.querySelector<HTMLElement>(".palette-body[data-scroll-key]");
    if (!scroller) {
      return;
    }
    const key = scroller.dataset.scrollKey ?? this.activeDockTab;
    this.paletteScrollTop[key] = scroller.scrollTop;
  }

  private restorePaletteScroll(): void {
    const scroller = this.root.querySelector<HTMLElement>(".palette-body[data-scroll-key]");
    if (!scroller) {
      return;
    }
    const key = scroller.dataset.scrollKey ?? this.activeDockTab;
    scroller.scrollTop = this.paletteScrollTop[key] ?? 0;
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

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
function escapeHtml(value: string): string {

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
