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

const CATEGORY_ORDER = ["research", "energy", "cooling", "compute", "grid"];
const CATEGORY_LABELS: Record<string, string> = {
  research: "Recherche",
  energy: "Energie",
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
      <div class="queue-list">
        ${region.construction_queue.length === 0 ? `<span class="muted">Aucune construction</span>` : region.construction_queue
          .map((item, index) => {
            const definition = buildings[item.building_id];
            return `<button class="queue-item" type="button" data-cancel="${index}">
              <span>${escapeHtml(definition?.display_name ?? item.building_id)}</span>
              <strong>${item.months_remaining}m</strong>
            </button>`;
          })
          .join("")}
      </div>
      <div class="built-list">
        ${region.buildings.slice(-6).map((id) => `<span>${escapeHtml(buildings[id]?.display_name ?? id)}</span>`).join("")}
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
        <span class="building-icon building-icon--${building.icon_key}" aria-hidden="true"></span>
        <span class="build-copy">
          <strong>${escapeHtml(building.display_name)}</strong>
          <small>${building.cost}M · ${building.construction_months}m · ${building.slots_required} slots</small>
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
