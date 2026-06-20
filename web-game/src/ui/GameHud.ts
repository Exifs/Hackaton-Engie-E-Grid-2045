import type { HeatmapMode } from "../game/EGridMapScene";
import type { BuildAvailability, BuildingDefinition, RegionSnapshot, SimulationCore } from "../sim";

interface HudCallbacks {
  onBuild: (buildingId: string) => void;
  onCancel: (queueIndex: number) => void;
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

  constructor(root: HTMLElement, simulation: SimulationCore, callbacks: HudCallbacks) {
    this.root = root;
    this.simulation = simulation;
    this.callbacks = callbacks;
    this.root.addEventListener("click", (event) => this.handleClick(event));
  }

  render(): void {
    const summary = this.simulation.getSummary();
    const selectedRegion = this.simulation.getRegionSnapshot();
    const buildings = this.simulation.getBuildingDefinitions();
    const availability = this.simulation.getBuildAvailability();
    const alerts = summary.alerts;

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
          <button class="alert-item alert-${alert.state}" type="button" data-region="${alert.region_id}">
            <strong>${escapeHtml(alert.title)}</strong>
            <span>${escapeHtml(alert.body)}</span>
          </button>
        `).join("")}
      </section>

      <section class="region-panel" aria-label="Region selectionnee">
        ${selectedRegion ? this.regionPanel(selectedRegion, buildings) : `<div class="panel-title">Selection region</div>`}
      </section>

      <section class="build-palette ${this.paletteOpen ? "is-open" : ""}" aria-label="Construction">
        <button class="palette-toggle" type="button" data-action="toggle-palette">
          <span>${this.paletteOpen ? "Fermer" : "Construire"}</span>
        </button>
        <div class="palette-body">
          ${CATEGORY_ORDER.map((category) => this.categoryBlock(category, buildings, availability)).join("")}
        </div>
      </section>
    `;
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

  private regionPanel(region: RegionSnapshot, buildings: Record<string, BuildingDefinition>): string {
    const cached = region.cached;
    const slotPct = region.slots_max > 0 ? (region.slots_used / region.slots_max) * 100 : 0;
    const queueCards = region.construction_queue.length === 0
      ? `<span class="empty-slot-card">Aucun chantier</span>`
      : region.construction_queue
        .map((item, index) => this.queueCard(item, index, buildings[item.building_id]))
        .join("");
    const builtCards = region.buildings.length === 0
      ? `<span class="empty-slot-card">Aucun actif</span>`
      : region.buildings
        .slice(-8)
        .map((id) => this.builtCard(id, buildings[id]))
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

  private builtCard(buildingId: string, building: BuildingDefinition | undefined): string {
    return `
      <span class="built-card" title="${escapeHtml(building?.description ?? buildingId)}">
        ${this.buildingArt(building)}
        <span class="built-copy">
          <strong>${escapeHtml(building?.display_name ?? buildingId)}</strong>
          <small>${escapeHtml(this.buildingSummary(building))}</small>
        </span>
      </span>
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
          <span class="building-icon building-icon--${building.icon_key}"></span>
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

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    const button = target.closest("button") as HTMLButtonElement | null;
    if (!button) {
      return;
    }

    const buildId = button.dataset.build;
    if (buildId) {
      this.callbacks.onBuild(buildId);
      return;
    }

    const cancelIndex = button.dataset.cancel;
    if (cancelIndex !== undefined) {
      this.callbacks.onCancel(Number(cancelIndex));
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
