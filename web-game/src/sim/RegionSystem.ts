import { cloneRecord } from "./math";
import type { BuildingDefinition, RegionDefinition, RegionRuntime, RegionSnapshot, RegionLayout } from "./types";

export class RegionSystem {
  cloneRegions(
    regionDefinitions: Record<string, RegionDefinition>,
    layout: Record<string, RegionLayout>
  ): Record<string, RegionRuntime> {
    const regions: Record<string, RegionRuntime> = {};
    for (const [regionId, source] of Object.entries(regionDefinitions)) {
      regions[regionId] = {
        ...cloneRecord(source),
        buildings: [],
        construction_queue: [],
        deconstruction_queue: [],
        cached: {},
        layout: layout[regionId] ?? {}
      };
    }
    return regions;
  }

  slotsUsed(region: RegionRuntime, buildingDefinitions: Record<string, BuildingDefinition>): number {
    let used = 0;
    for (const buildingId of region.buildings) {
      used += buildingDefinitions[buildingId]?.slots_required ?? 1;
    }
    for (const item of region.construction_queue) {
      used += buildingDefinitions[item.building_id]?.slots_required ?? 1;
    }
    for (const item of region.deconstruction_queue) {
      used += buildingDefinitions[item.building_id]?.slots_required ?? 1;
    }
    return used;
  }

  slotsFree(region: RegionRuntime, buildingDefinitions: Record<string, BuildingDefinition>): number {
    return Math.max(region.slots_max - this.slotsUsed(region, buildingDefinitions), 0);
  }

  regionHasAnyTag(region: RegionRuntime, requiredTags: string[]): boolean {
    if (requiredTags.length === 0) {
      return true;
    }
    return requiredTags.some((tag) => region.tags.includes(tag));
  }

  potential(region: RegionRuntime, key: string): number {
    switch (key) {
      case "cooling":
        return region.potential_cooling;
      case "solar":
        return region.potential_solar;
      case "wind_onshore":
        return region.potential_wind_onshore;
      case "wind_offshore":
        return region.potential_wind_offshore;
      case "hydro":
        return region.potential_hydro;
      case "nuclear":
        return region.potential_nuclear;
      case "grid":
        return region.potential_grid;
      case "research":
        return region.potential_research;
      default:
        return 0;
    }
  }

  regionSnapshot(
    region: RegionRuntime,
    buildingDefinitions: Record<string, BuildingDefinition>
  ): RegionSnapshot {
    return {
      ...cloneRecord(region),
      slots_used: this.slotsUsed(region, buildingDefinitions),
      slots_free: this.slotsFree(region, buildingDefinitions)
    };
  }
}
