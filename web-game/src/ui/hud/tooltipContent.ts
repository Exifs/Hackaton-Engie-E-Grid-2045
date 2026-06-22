import { t } from "../../i18n";
import type { BuildAvailability, BuildingDefinition, ResearchOption, SimulationCore } from "../../sim";
import { fmt } from "./format";
import { BUILD_ACCESS_LOCK_CAUSES, RESEARCH_UNAVAILABLE_CAUSES } from "./types";

export interface TooltipContentContext {
  simulation: SimulationCore;
  localizedBuildingDescription: (building: BuildingDefinition | undefined) => string;
  localizedBuildingName: (building: BuildingDefinition | undefined, fallbackId?: string) => string;
  localizedPotential: (potential: string) => string;
  localizedRegionTags: (tags: string[], limit: number) => string;
  localizedResearchNotes: (option: ResearchOption) => string;
  localizedResearchReason: (option: ResearchOption) => string;
  localizedTechnologyName: (technologyId: string) => string;
  researchBranchTierLabel: (option: ResearchOption) => string;
  researchEffect: (option: ResearchOption) => string;
  researchEta: (option: ResearchOption) => string;
}

type TooltipChip = { label: string; tone: string; title: string };

export function tooltipBodyElement(trigger: HTMLElement, body: string, ctx: TooltipContentContext): HTMLElement {
  const buildingId = trigger.dataset.tooltipBuildingId;
  const building = buildingId ? ctx.simulation.getBuildingDefinitions()[buildingId] : undefined;
  if (building) {
    return buildingTooltipElement(building, ctx);
  }
  const researchId = trigger.dataset.tooltipResearchId;
  const researchOption = researchId ? ctx.simulation.getResearchOptions().find((option) => option.id === researchId) : undefined;
  if (researchOption) {
    return researchTooltipElement(researchOption, ctx);
  }
  if (trigger.dataset.tooltipStatusMetrics) {
    return regionStatusTooltipElement(trigger);
  }
  const bodyElement = document.createElement("span");
  bodyElement.textContent = body;
  return bodyElement;
}

export function isLockedTooltipMeta(meta: string, trigger: HTMLElement): boolean {
  const availabilityCause = trigger.dataset.availabilityCause as BuildAvailability["cause"] | undefined;
  const researchLockCause = trigger.dataset.lockCause as ResearchOption["lock_cause"] | undefined;
  return (
    /locked|verrouill|debloquer/i.test(meta) ||
    (availabilityCause !== undefined && BUILD_ACCESS_LOCK_CAUSES.includes(availabilityCause)) ||
    (researchLockCause !== undefined && RESEARCH_UNAVAILABLE_CAUSES.includes(researchLockCause))
  );
}

function regionStatusTooltipElement(trigger: HTMLElement): HTMLElement {
  const wrapper = document.createElement("div");
  const tone = trigger.dataset.tooltipStatusTone ?? "info";
  wrapper.className = `tooltip-status tooltip-status-${tone}`;
  const metrics = parseTooltipMetrics(trigger.dataset.tooltipStatusMetrics);
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

function parseTooltipMetrics(raw: string | undefined): Array<[string, string]> {
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

function buildingTooltipElement(building: BuildingDefinition, ctx: TooltipContentContext): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "tooltip-building";

  const description = document.createElement("p");
  description.textContent = ctx.localizedBuildingDescription(building);
  wrapper.append(description);

  wrapper.append(tooltipChipRow([
    { label: t("common.units.millionCurrency", { value: fmt(building.cost) }), tone: "price", title: t("hud.tooltipSections.price") },
    { label: `${fmt(building.construction_months)}${t("common.units.monthShort")}`, tone: "time", title: t("hud.tooltipSections.construction") },
    { label: `${fmt(building.slots_required)} ${t("common.units.slots")}`, tone: "slot", title: t("hud.tooltipSections.footprint") }
  ]));

  const production = buildingResourceChips(building, "production");
  const consumption = buildingResourceChips(building, "consumption");
  const constraints = buildingConstraintChips(building, ctx);
  if (production.length > 0) {
    wrapper.append(tooltipChipSection(t("hud.tooltipSections.produced"), production));
  }
  if (consumption.length > 0) {
    wrapper.append(tooltipChipSection(t("hud.tooltipSections.consumed"), consumption));
  }
  if (constraints.length > 0) {
    wrapper.append(tooltipChipSection(t("hud.tooltipSections.constraints"), constraints));
  }

  return wrapper;
}

function buildingResourceChips(building: BuildingDefinition, mode: "production" | "consumption"): TooltipChip[] {
  const prefix = mode === "production" ? "+" : "-";
  const chips: TooltipChip[] = [];
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

function buildingConstraintChips(building: BuildingDefinition, ctx: TooltipContentContext): TooltipChip[] {
  const chips: TooltipChip[] = [];
  if (building.unlock_technology) {
    chips.push({
      label: t("hud.researchPanel.techRequirement", { technology: ctx.localizedTechnologyName(building.unlock_technology) }),
      tone: "locked",
      title: t("hud.construction.requiredResearch")
    });
  }
  if (building.required_potential && building.required_potential_min > 0) {
    chips.push({ label: `${ctx.localizedPotential(building.required_potential)} ${fmt(building.required_potential_min)}+`, tone: "info", title: t("hud.construction.requiredPotential") });
  }
  if (building.required_tags.length > 0) {
    chips.push({ label: ctx.localizedRegionTags(building.required_tags, 2), tone: "info", title: t("hud.construction.regionTags") });
  }
  if (building.variable_output) {
    chips.push({ label: t("hud.construction.variable"), tone: "warning", title: t("hud.construction.variableProduction") });
  }
  return chips;
}

function researchTooltipElement(option: ResearchOption, ctx: TooltipContentContext): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "tooltip-research";

  const description = document.createElement("p");
  description.textContent = ctx.localizedResearchNotes(option) || ctx.localizedResearchReason(option) || ctx.researchEffect(option);
  wrapper.append(description);

  wrapper.append(tooltipChipSection(t("hud.tooltipSections.points"), researchPointChips(option, ctx)));

  const conditions = researchConditionChips(option, ctx);
  if (conditions.length > 0) {
    wrapper.append(tooltipChipSection(t("hud.tooltipSections.conditions"), conditions));
  }

  const unlocks = researchUnlockChips(option, ctx);
  if (unlocks.length > 0) {
    wrapper.append(tooltipChipSection(t("hud.tooltipSections.unlocks"), unlocks));
  }

  const effect = ctx.researchEffect(option);
  if (effect) {
    wrapper.append(tooltipChipSection(t("hud.tooltipSections.effect"), [
      { label: effect, tone: "research", title: t("hud.researchPanel.researchEffect") }
    ]));
  }

  return wrapper;
}

function researchPointChips(option: ResearchOption, ctx: TooltipContentContext): TooltipChip[] {
  const progressPoints = option.status === "active"
    ? Math.min(option.cost, Math.max(option.current_points, 0))
    : Math.max(option.current_points, 0);
  return [
    { label: `${fmt(option.cost)} ${t("common.units.points")}`, tone: "price", title: t("hud.researchPanel.totalCost") },
    { label: `${fmt(progressPoints)} / ${fmt(option.cost)}`, tone: "research", title: t("hud.researchPanel.accumulatedPoints") },
    { label: `+${fmt(option.monthly_points)} ${t("common.units.points")}/${t("hud.kpi.monthSuffix")}`, tone: "energy", title: t("hud.researchPanel.monthlyProduction") },
    { label: `${t("hud.researchPanel.etaShort")} ${ctx.researchEta(option)}`, tone: "time", title: t("hud.researchPanel.eta") }
  ];
}

function researchConditionChips(option: ResearchOption, ctx: TooltipContentContext): TooltipChip[] {
  const chips: TooltipChip[] = [
    { label: ctx.researchBranchTierLabel(option), tone: "info", title: t("hud.researchPanel.branchTier") }
  ];
  for (const prereq of option.prereq_technology_ids) {
    chips.push({
      label: t("hud.researchPanel.techRequirement", { technology: ctx.localizedTechnologyName(prereq) }),
      tone: "locked",
      title: t("hud.researchPanel.prerequisite")
    });
  }
  if (option.lock_cause && RESEARCH_UNAVAILABLE_CAUSES.includes(option.lock_cause)) {
    chips.push({ label: ctx.localizedResearchReason(option) || option.lock_cause, tone: "locked", title: t("hud.researchPanel.blocker") });
  } else if (option.reason && option.status !== "available") {
    chips.push({ label: ctx.localizedResearchReason(option), tone: "warning", title: t("hud.researchPanel.status") });
  }
  return chips;
}

function researchUnlockChips(option: ResearchOption, ctx: TooltipContentContext): TooltipChip[] {
  const buildings = ctx.simulation.getBuildingDefinitions();
  return option.unlocks.map((buildingId) => ({
    label: ctx.localizedBuildingName(buildings[buildingId], buildingId),
    tone: buildings[buildingId] ? "compute" : "info",
    title: buildings[buildingId] ? t("hud.researchPanel.buildingUnlocked") : t("hud.researchPanel.unlock")
  }));
}

function tooltipChipSection(title: string, chips: TooltipChip[]): HTMLElement {
  const section = document.createElement("div");
  section.className = "tooltip-chip-section";
  const label = document.createElement("span");
  label.className = "tooltip-chip-section-label";
  label.textContent = title;
  section.append(label, tooltipChipRow(chips));
  return section;
}

function tooltipChipRow(chips: TooltipChip[]): HTMLElement {
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
