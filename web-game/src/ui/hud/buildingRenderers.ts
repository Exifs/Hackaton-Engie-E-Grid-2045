import { t } from "../../i18n";
import type { BuildingDefinition } from "../../sim";
import { escapeHtml, fmt } from "./format";
import { localizedBuildingDescription, localizedBuildingName } from "./localization";

export function buildCategoryLabel(category: string): string {
  const key = `hud.categories.${category}`;
  const translated = t(key);
  return translated === key ? category : translated;
}

export function buildingArt(building: BuildingDefinition | undefined): string {
  return `<span class="building-art building-art--${building?.icon_key ?? "supergrid"}" aria-hidden="true"></span>`;
}

export function buildingSummary(building: BuildingDefinition | undefined): string {
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
  return parts.slice(0, 2).join(" / ") || buildCategoryLabel(building.category);
}

export function buildingMetricChips(building: BuildingDefinition): string {
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

export function buildingTooltipAttrs(
  building: BuildingDefinition | undefined,
  meta: string,
  tooltipAttrs: (title: string, body: string, meta?: string) => string
): string {
  return [
    tooltipAttrs(localizedBuildingName(building, t("hud.construction.infrastructure")), localizedBuildingDescription(building), meta),
    building ? `data-tooltip-building-id="${escapeHtml(building.id)}"` : ""
  ].filter(Boolean).join(" ");
}
