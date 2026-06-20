import { clamp, lerp } from "./math";
import { RegionSystem } from "./RegionSystem";
import type {
  BuildAvailability,
  BuildingDefinition,
  CancelResult,
  Constants,
  ConstructionItem,
  DeconstructionItem,
  DemolishResult,
  RegionRuntime
} from "./types";

const DEMOLITION_COST_RATIO = 0.2;
const DEMOLITION_MONTH_RATIO = 0.35;
const MIN_DEMOLITION_MONTHS = 2;

export class BuildingSystem {
  private readonly regions = new RegionSystem();

  canStartConstruction(
    region: RegionRuntime | undefined,
    buildingDefinition: BuildingDefinition | undefined,
    money: number,
    completedTechnologies: Record<string, true>,
    buildingDefinitions: Record<string, BuildingDefinition>
  ): BuildAvailability {
    if (!region) {
      return { ok: false, reason: "Select a region first.", cause: "no_region" };
    }
    if (!buildingDefinition) {
      return { ok: false, reason: "Unknown building.", cause: "unknown_building" };
    }
    if (buildingDefinition.unlock_technology && !completedTechnologies[buildingDefinition.unlock_technology]) {
      return { ok: false, reason: `Locked: research ${buildingDefinition.unlock_technology}.`, cause: "technology" };
    }
    if (!this.regions.regionHasAnyTag(region, buildingDefinition.required_tags)) {
      return { ok: false, reason: "Region lacks required tag.", cause: "region_tag" };
    }
    if (buildingDefinition.required_potential && buildingDefinition.required_potential_min > 0) {
      if (this.regions.potential(region, buildingDefinition.required_potential) < buildingDefinition.required_potential_min) {
        return { ok: false, reason: "Regional potential too low.", cause: "region_potential" };
      }
    }
    if (money < buildingDefinition.cost) {
      return { ok: false, reason: "Insufficient budget.", cause: "budget" };
    }
    if (this.regions.slotsFree(region, buildingDefinitions) < buildingDefinition.slots_required) {
      return { ok: false, reason: "Not enough regional slots.", cause: "slots" };
    }
    return { ok: true, reason: "" };
  }

  startConstruction(region: RegionRuntime, buildingDefinition: BuildingDefinition): ConstructionItem {
    const item: ConstructionItem = {
      building_id: buildingDefinition.id,
      months_remaining: buildingDefinition.construction_months,
      total_months: buildingDefinition.construction_months,
      cost: buildingDefinition.cost
    };
    region.construction_queue.push(item);
    return item;
  }

  advanceConstruction(region: RegionRuntime): ConstructionItem[] {
    const completed: ConstructionItem[] = [];
    const remaining: ConstructionItem[] = [];
    for (const item of region.construction_queue) {
      const next = { ...item, months_remaining: item.months_remaining - 1 };
      if (next.months_remaining <= 0) {
        region.buildings.push(next.building_id);
        completed.push(next);
      } else {
        remaining.push(next);
      }
    }
    region.construction_queue = remaining;
    return completed;
  }

  demolitionCost(buildingDefinition: BuildingDefinition): number {
    return Math.ceil(buildingDefinition.cost * DEMOLITION_COST_RATIO);
  }

  demolitionMonths(buildingDefinition: BuildingDefinition): number {
    return Math.max(MIN_DEMOLITION_MONTHS, Math.ceil(buildingDefinition.construction_months * DEMOLITION_MONTH_RATIO));
  }

  canStartDemolition(
    region: RegionRuntime | undefined,
    buildingIndex: number,
    money: number,
    buildingDefinitions: Record<string, BuildingDefinition>
  ): DemolishResult {
    if (!region) {
      return { ok: false, cost: 0, reason: "No region selected." };
    }
    if (buildingIndex < 0 || buildingIndex >= region.buildings.length) {
      return { ok: false, cost: 0, reason: "No building at this slot." };
    }
    const definition = buildingDefinitions[region.buildings[buildingIndex]];
    if (!definition) {
      return { ok: false, cost: 0, reason: "Unknown building." };
    }
    const cost = this.demolitionCost(definition);
    if (money < cost) {
      return { ok: false, cost, reason: "Insufficient budget." };
    }
    return { ok: true, cost, reason: "" };
  }

  startDemolition(
    region: RegionRuntime,
    buildingIndex: number,
    buildingDefinitions: Record<string, BuildingDefinition>
  ): DeconstructionItem {
    const [buildingId] = region.buildings.splice(buildingIndex, 1);
    const definition = buildingDefinitions[buildingId];
    if (!definition) {
      throw new Error(`Unknown building '${buildingId}' during demolition.`);
    }
    const totalMonths = this.demolitionMonths(definition);
    const item: DeconstructionItem = {
      building_id: buildingId,
      months_remaining: totalMonths,
      total_months: totalMonths,
      cost: this.demolitionCost(definition)
    };
    region.deconstruction_queue.push(item);
    return item;
  }

  advanceDemolition(region: RegionRuntime): DeconstructionItem[] {
    const completed: DeconstructionItem[] = [];
    const remaining: DeconstructionItem[] = [];
    for (const item of region.deconstruction_queue) {
      const next = { ...item, months_remaining: item.months_remaining - 1 };
      if (next.months_remaining <= 0) {
        completed.push(next);
      } else {
        remaining.push(next);
      }
    }
    region.deconstruction_queue = remaining;
    return completed;
  }

  cancelConstruction(region: RegionRuntime | undefined, queueIndex: number, constants: Constants): CancelResult {
    if (!region) {
      return { ok: false, refund: 0, reason: "No region selected." };
    }
    if (queueIndex < 0 || queueIndex >= region.construction_queue.length) {
      return { ok: false, refund: 0, reason: "No construction at this slot." };
    }
    const [item] = region.construction_queue.splice(queueIndex, 1);
    const totalMonths = Math.max(item.total_months, 1);
    const monthsRemaining = Math.max(item.months_remaining, 0);
    const progressRatio = clamp(1 - monthsRemaining / totalMonths, 0, 1);
    const refundRatio = lerp(
      constants.construction_cancel_refund_max_pct,
      constants.construction_cancel_refund_min_pct,
      progressRatio
    );
    return { ok: true, refund: Math.floor(item.cost * refundRatio), reason: "" };
  }
}
