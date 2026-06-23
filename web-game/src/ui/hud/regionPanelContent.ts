import { t } from "../../i18n";
import type { BuildingDefinition, RegionSnapshot } from "../../sim";
import { clampPctFloat, escapeHtml, fmt } from "./format";
import { localizedRegionTag, localizedRegionTags, regionName } from "./localization";
import { renderRegionHistoryChart } from "./regionHistory";
import { localBalancePct, regionResearcherStatusMetrics, regionResourceStatusMetrics, renderRegionStatusBlock } from "./regionStatus";
import { type QueueProgressItem, type RegionHistoryPeriod, type RegionHistoryResource, type RegionPanelTab } from "./types";

interface RegionPanelContentOptions {
  region: RegionSnapshot;
  buildings: Record<string, BuildingDefinition>;
  monthProgress: number;
  activeRegionTab: RegionPanelTab;
  activeRegionHistoryPeriod: RegionHistoryPeriod;
  activeRegionHistoryResource: RegionHistoryResource;
  tooltipAttrs: (title: string, body: string, meta?: string) => string;
  queueCard: (
    regionId: string,
    item: QueueProgressItem,
    index: number,
    building: BuildingDefinition | undefined,
    monthProgress: number
  ) => string;
  demolitionCard: (
    regionId: string,
    item: QueueProgressItem,
    index: number,
    building: BuildingDefinition | undefined,
    monthProgress: number
  ) => string;
  builtCard: (buildingId: string, building: BuildingDefinition | undefined, index: number) => string;
}

const OVERVIEW_CONSTRUCTION_QUEUE_LIMIT = 2;

export function renderRegionPanelContent(options: RegionPanelContentOptions): string {
  const renderer = new RegionPanelContentRenderer(options);
  return renderer.render();
}

class RegionPanelContentRenderer {
  constructor(private readonly options: RegionPanelContentOptions) {}

  render(): string {
    const { region, buildings, monthProgress, activeRegionTab } = this.options;
    const cached = region.cached;
    const levelXp = Math.min(2000, Math.round((region.buildings.length * 110 + region.tags.length * 40) / 10) * 10);
    const regionLevel = Math.max(1, Math.min(9, Math.floor(levelXp / 400) + 1));
    const levelPct = (levelXp / 2000) * 100;
    const queueCards = region.construction_queue.length === 0
      ? `<span class="empty-slot-card">${escapeHtml(t("hud.region.noConstruction"))}</span>`
      : region.construction_queue
        .map((item, index) => this.options.queueCard(region.id, item, index, buildings[item.building_id], monthProgress))
        .join("");
    const overviewQueueCards = this.overviewQueueCards();
    const demolitionCards = region.deconstruction_queue.length === 0
      ? `<span class="empty-slot-card">${escapeHtml(t("hud.region.noDemolition"))}</span>`
      : region.deconstruction_queue
        .map((item, index) => this.options.demolitionCard(region.id, item, index, buildings[item.building_id], monthProgress))
        .join("");
    const builtCards = region.buildings.length === 0
      ? `<span class="empty-slot-card">${escapeHtml(t("hud.region.noAssets"))}</span>`
      : region.buildings
        .map((id, index) => this.options.builtCard(id, buildings[id], index))
        .join("");
    const energyProduction = cached.energy_production ?? 0;
    const energyDemand = cached.energy_consumption ?? 0;
    const energyReserve = Math.max(0, energyProduction + (cached.energy_imported ?? 0) - energyDemand);
    const energyExported = cached.energy_exported ?? 0;
    const energyBalance = energyProduction - energyDemand;
    const energyLocalPct = localBalancePct(energyProduction, energyDemand);
    const coolingAvailable = cached.cooling_available ?? 0;
    const coolingUsed = cached.cooling_used ?? 0;
    const coolingReserve = Math.max(0, coolingAvailable - coolingUsed);
    const coolingExported = cached.cooling_exported ?? coolingReserve;
    const coolingBalance = coolingAvailable - coolingUsed;
    const coolingLocalPct = localBalancePct(coolingAvailable, coolingUsed);
    const computeDemand = cached.compute_demand ?? 0;
    const computeSupply = cached.compute_produced ?? 0;
    const computeDeficit = Math.max(0, computeDemand - computeSupply);
    const computeExported = cached.compute_exported ?? Math.max(0, computeSupply - computeDemand);
    const computeBalance = computeSupply - computeDemand;
    const computePct = localBalancePct(computeSupply, computeDemand);
    const researchersAvailable = cached.researchers_available ?? region.starting_researchers;
    const researchersRequired = cached.researchers_required ?? 0;
    const researchersBalance = researchersAvailable - researchersRequired;
    const researchersPct = localBalancePct(researchersAvailable, researchersRequired);
    const energyUnit = t("common.units.gigawatts");
    const coolingUnit = t("common.units.thermalGigawatts");
    const computeUnit = t("common.units.eflops");
    const energyStatusMetrics = regionResourceStatusMetrics(energyProduction, energyDemand, energyExported, energyBalance, energyUnit);
    const coolingStatusMetrics = regionResourceStatusMetrics(coolingAvailable, coolingUsed, coolingExported, coolingBalance, coolingUnit);
    const computeStatusMetrics = regionResourceStatusMetrics(computeSupply, computeDemand, computeExported, computeBalance, computeUnit);
    const researcherStatusMetrics = regionResearcherStatusMetrics(researchersAvailable, researchersRequired);
    const selectedRegionName = regionName(region);

    const overviewContent = `
      <div class="region-tags">
        ${region.tags.slice(0, 6).map((tag) => `<span>${escapeHtml(localizedRegionTag(tag))}</span>`).join("")}
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
        ${renderRegionStatusBlock({ tone: "energy", title: t("hud.region.energy"), pct: energyLocalPct, metrics: energyStatusMetrics, isDeficit: energyBalance < 0, tooltipAttrs: this.options.tooltipAttrs })}
        ${renderRegionStatusBlock({ tone: "cooling", title: t("hud.region.cooling"), pct: coolingLocalPct, metrics: coolingStatusMetrics, isDeficit: coolingBalance < 0, tooltipAttrs: this.options.tooltipAttrs })}
        ${renderRegionStatusBlock({ tone: "compute", title: t("hud.region.compute"), pct: computePct, metrics: computeStatusMetrics, isDeficit: computeBalance < 0, tooltipAttrs: this.options.tooltipAttrs })}
        ${renderRegionStatusBlock({ tone: "research", title: t("hud.resources.researchers"), pct: researchersPct, metrics: researcherStatusMetrics, isDeficit: researchersBalance < 0, tooltipAttrs: this.options.tooltipAttrs })}
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
      ${this.regionManageButton()}
    `;
    const statsContent = `
      <div class="region-stats-grid">
        ${this.regionStatTile(t("hud.region.slots"), `${region.slots_used}/${region.slots_max}`, t("hud.region.free", { count: Math.max(0, region.slots_max - region.slots_used) }))}
        ${this.regionStatTile(t("hud.region.levelXp"), `${fmt(levelXp)}`, t("hud.region.level", { level: regionLevel }))}
        ${this.regionStatTile(t("hud.region.energyReserve"), `${fmt(energyReserve, 1)} ${escapeHtml(energyUnit)}`, t("hud.region.producedShort", { value: fmt(energyProduction, 1) }))}
        ${this.regionStatTile(t("hud.region.coolingReserve"), `${fmt(coolingReserve, 1)} ${escapeHtml(coolingUnit)}`, t("hud.region.capacityShort", { value: fmt(coolingAvailable, 1) }))}
        ${this.regionStatTile(computeDeficit > 0 ? t("hud.region.computeDeficit") : t("hud.region.computeReserve"), `${fmt(computeDeficit > 0 ? computeDeficit : computeSupply - computeDemand, 1)} ${escapeHtml(computeUnit)}`, t("hud.region.supplyShort", { value: fmt(computeSupply, 1) }))}
        ${this.regionStatTile(t("hud.region.tags"), `${region.tags.length}`, localizedRegionTags(region.tags, 2) || t("hud.region.none"))}
      </div>
      <div class="region-status-stack">
        ${renderRegionStatusBlock({ tone: "energy", title: t("hud.region.energy"), pct: energyLocalPct, metrics: energyStatusMetrics, isDeficit: energyBalance < 0, tooltipAttrs: this.options.tooltipAttrs })}
        ${renderRegionStatusBlock({ tone: "cooling", title: t("hud.region.cooling"), pct: coolingLocalPct, metrics: coolingStatusMetrics, isDeficit: coolingBalance < 0, tooltipAttrs: this.options.tooltipAttrs })}
        ${renderRegionStatusBlock({ tone: "compute", title: t("hud.region.compute"), pct: computePct, metrics: computeStatusMetrics, isDeficit: computeBalance < 0, tooltipAttrs: this.options.tooltipAttrs })}
      </div>
      ${renderRegionHistoryChart({
        region,
        activeRegionHistoryPeriod: this.options.activeRegionHistoryPeriod,
        activeRegionHistoryResource: this.options.activeRegionHistoryResource
      })}
    `;
    const tabContent = activeRegionTab === "buildings"
      ? buildingsContent
      : activeRegionTab === "stats"
        ? statsContent
        : overviewContent;

    return `
      <div class="panel-title region-title">
        <div>
          <span>${escapeHtml(t("hud.region.region"))}</span>
          <strong>${escapeHtml(selectedRegionName)}</strong>
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
      <div class="region-tab-view region-tab-${activeRegionTab}">
        ${tabContent}
      </div>
    `;
  }

  private regionTabButton(tab: RegionPanelTab, label: string, title: string, body: string): string {
    const active = this.options.activeRegionTab === tab;
    return `
      <button class="${active ? "is-active" : ""}" type="button" role="tab" data-region-tab="${tab}" aria-selected="${active}" ${this.options.tooltipAttrs(title, body, active ? t("hud.region.active") : t("hud.region.changeView"))}>
        ${escapeHtml(label)}
      </button>
    `;
  }

  private regionManageButton(): string {
    const { region } = this.options;
    return `
      <button class="region-manage-button" type="button" data-action="open-construction" ${this.options.tooltipAttrs(t("hud.region.manage"), t("hud.region.manageTooltip", { region: regionName(region) }), t("hud.region.freeSlots", { count: region.slots_max - region.slots_used }))}>
        ${escapeHtml(t("hud.region.manage"))}
      </button>
    `;
  }

  private overviewQueueCards(): string {
    const { region, buildings, monthProgress } = this.options;
    if (region.construction_queue.length === 0) {
      return `<span class="empty-slot-card">${escapeHtml(t("hud.region.noConstruction"))}</span>`;
    }
    const visibleCards = region.construction_queue
      .slice(0, OVERVIEW_CONSTRUCTION_QUEUE_LIMIT)
      .map((item, index) => this.options.queueCard(region.id, item, index, buildings[item.building_id], monthProgress));
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

  private regionStatTile(label: string, value: string, detail: string): string {
    return `
      <span class="region-stat-tile">
        <small>${escapeHtml(label)}</small>
        <strong>${escapeHtml(value)}</strong>
        <em>${escapeHtml(detail)}</em>
      </span>
    `;
  }

}
