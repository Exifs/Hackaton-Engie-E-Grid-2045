import { clamp, lerp } from "./math";
import { RegionSystem } from "./RegionSystem";
import type {
  BuildAvailability,
  BuildingDefinition,
  CancelResult,
  Constants,
  ConstructionItem,
  RegionRuntime
} from "./types";

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
      return { ok: false, reason: "Select a region first." };
    }
    if (!buildingDefinition) {
      return { ok: false, reason: "Unknown building." };
    }
    if (money < buildingDefinition.cost) {
      return { ok: false, reason: "Insufficient budget." };
    }
    if (this.regions.slotsFree(region, buildingDefinitions) < buildingDefinition.slots_required) {
      return { ok: false, reason: "Not enough regional slots." };
    }
    if (buildingDefinition.unlock_technology && !completedTechnologies[buildingDefinition.unlock_technology]) {
      return { ok: false, reason: `Locked: research ${buildingDefinition.unlock_technology}.` };
    }
    if (!this.regions.regionHasAnyTag(region, buildingDefinition.required_tags)) {
      return { ok: false, reason: "Region lacks required tag." };
    }
    if (buildingDefinition.required_potential && buildingDefinition.required_potential_min > 0) {
      if (this.regions.potential(region, buildingDefinition.required_potential) < buildingDefinition.required_potential_min) {
        return { ok: false, reason: "Regional potential too low." };
      }
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
