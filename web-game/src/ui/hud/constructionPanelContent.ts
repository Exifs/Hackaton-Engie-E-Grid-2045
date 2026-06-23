import { t } from "../../i18n";
import type { BuildAvailability, BuildingDefinition } from "../../sim";
import { buildCategoryLabel, buildingArt, buildingMetricChips, buildingTooltipAttrs } from "./buildingRenderers";
import { escapeHtml } from "./format";
import { localizedBuildingDescription, localizedBuildingName, localizedTechnologyName } from "./localization";
import { ALL_BUILD_CATEGORY, BUILD_ACCESS_LOCK_CAUSES, CATEGORY_ORDER } from "./types";

interface ConstructionPanelContentOptions {
  buildings: Record<string, BuildingDefinition>;
  availability: Record<string, BuildAvailability>;
  activeBuildCategory: string;
  showLockedBuildings: boolean;
  tooltipAttrs: (title: string, body: string, meta?: string) => string;
}

export function renderConstructionPanelContent(options: ConstructionPanelContentOptions): string {
  const renderer = new ConstructionPanelContentRenderer(options);
  return renderer.render();
}

export function shouldShowBuilding(
  availability: BuildAvailability | undefined,
  showLockedBuildings: boolean
): boolean {
  if (showLockedBuildings || availability?.ok) {
    return true;
  }
  if (!availability?.cause) {
    return true;
  }
  return !BUILD_ACCESS_LOCK_CAUSES.includes(availability.cause);
}

class ConstructionPanelContentRenderer {
  constructor(private readonly options: ConstructionPanelContentOptions) {}

  render(): string {
    const { buildings, activeBuildCategory } = this.options;
    const categories = CATEGORY_ORDER.filter((category) =>
      Object.values(buildings).some((building) => building.category === category)
    );
    const isAll = activeBuildCategory === ALL_BUILD_CATEGORY;
    return `
      <div class="build-accordion ${isAll ? "is-all" : "is-single"}">
        <div class="build-category-tabs" role="tablist" aria-label="${escapeHtml(t("hud.construction.categories"))}">
          ${[ALL_BUILD_CATEGORY, ...categories].map((category) => this.buildCategoryTab(category)).join("")}
        </div>
        <div class="build-category-content">
          ${isAll
            ? categories.map((category) => this.categoryBlock(category)).join("")
            : this.categoryBlock(activeBuildCategory)}
        </div>
      </div>
    `;
  }

  private buildCategoryTab(category: string): string {
    const { buildings, availability, activeBuildCategory, showLockedBuildings } = this.options;
    const active = activeBuildCategory === category;
    const count = Object.values(buildings).filter((building) =>
      (category === ALL_BUILD_CATEGORY || building.category === category) &&
      shouldShowBuilding(availability[building.id], showLockedBuildings)
    ).length;
    return `
      <button class="build-category-tab ${active ? "is-active" : ""}" type="button" data-build-category="${category}" data-onboarding-target="build.category.${category}" role="tab" aria-selected="${active}">
        <span>${escapeHtml(buildCategoryLabel(category))}</span>
        <strong>${count}</strong>
      </button>
    `;
  }

  private categoryBlock(category: string): string {
    const { buildings, availability, showLockedBuildings } = this.options;
    const categoryItems = Object.values(buildings).filter((building) => building.category === category);
    const items = categoryItems.filter((building) => shouldShowBuilding(availability[building.id], showLockedBuildings));
    if (items.length === 0 && categoryItems.length === 0) {
      return "";
    }
    const previewClass = items.length === 0 ? " is-locked-preview" : "";
    const label = buildCategoryLabel(category);
    const optionCount = items.length > 0 ? items.length : Math.max(1, Math.min(4, categoryItems.length));
    return `
      <div class="build-category${previewClass}" data-onboarding-target="build.category.${escapeHtml(category)}.items">
        <div class="build-category-heading">
          <span class="build-category-icon utility-category-icon utility-category-icon-${this.categoryIconKey(category)}" aria-hidden="true"></span>
          <h2>
            <button class="build-category-title" type="button" data-build-category-title="${escapeHtml(category)}" ${this.options.tooltipAttrs(label, t("hud.construction.showOnly", { label }), t("hud.construction.options", { count: optionCount }))}>
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
    const label = buildCategoryLabel(category);
    const previewCount = Math.max(1, Math.min(4, items.length));
    return Array.from({ length: previewCount }, (_, index) => `
      <span class="build-card is-disabled build-locked-preview-card" role="button" aria-disabled="true" ${this.options.tooltipAttrs(label, t("hud.construction.lockedOptions"), t("hud.construction.unlockRequired"))}>
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
      <button class="build-card ${enabled ? "" : "is-disabled"}" type="button" data-build="${building.id}" data-onboarding-target="build.${building.id}" ${cause} ${enabled ? "" : "disabled"} title="${escapeHtml(reason || localizedBuildingDescription(building))}" ${buildingTooltipAttrs(building, enabled ? t("hud.construction.available") : reason || t("hud.construction.locked"), this.options.tooltipAttrs)}>
        <span class="build-visual" aria-hidden="true">
          ${buildingArt(building)}
        </span>
        <span class="build-copy">
          <strong>${escapeHtml(localizedBuildingName(building))}</strong>
          <small>${escapeHtml(reason || localizedBuildingDescription(building))}</small>
          <span class="build-meta">${escapeHtml(t("common.units.millionCurrency", { value: building.cost }))} - ${building.construction_months}${escapeHtml(t("common.units.monthShort"))}</span>
          <span class="metric-chip-row">
            ${buildingMetricChips(building)}
          </span>
          ${this.buildingBadges(building, availability)}
        </span>
      </button>
    `;
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
        return t("hud.reasons.researchTechnology", { technology: building?.unlock_technology ? localizedTechnologyName(building.unlock_technology) : "" });
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
}
