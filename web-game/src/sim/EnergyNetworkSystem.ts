import { clamp } from "./math";
import type { Constants, NetworkResult, RegionMetrics, RegionNetworkResult } from "./types";

interface SurplusRegion {
  id: string;
  available: number;
}

export class EnergyNetworkSystem {
  private distances: Record<string, Record<string, number>> = {};
  private distanceCap = 5;

  configure(networkGraph: Record<string, string[]>, distanceCap: number): void {
    this.distanceCap = Math.max(distanceCap, 1);
    this.distances = {};
    for (const regionId of Object.keys(networkGraph)) {
      this.distances[regionId] = this.bfsDistances(regionId, networkGraph);
    }
  }

  resolve(
    regionMetrics: Record<string, RegionMetrics>,
    constants: Constants,
    supergridEnabled: boolean
  ): NetworkResult {
    const flows: NetworkResult["flows"] = [];
    const regionResults: Record<string, RegionNetworkResult> = {};
    const surplusRegions: SurplusRegion[] = [];
    const deficitRegions: { id: string; deficit: number }[] = [];

    for (const [regionId, metrics] of Object.entries(regionMetrics)) {
      const balance = metrics.energy_production - metrics.energy_consumption;
      regionResults[regionId] = {
        energy_imported: 0,
        energy_exported: 0,
        energy_unserved: 0,
        energy_efficiency: 1,
        blackout_state: "stable",
        network_congested: false
      };

      if (balance > 0.01) {
        surplusRegions.push({ id: regionId, available: balance });
      } else if (balance < -0.01) {
        deficitRegions.push({ id: regionId, deficit: -balance });
      }
    }

    for (const deficit of deficitRegions) {
      const targetId = deficit.id;
      let remainingDeficit = deficit.deficit;

      while (remainingDeficit > 0.01) {
        const sourceIndex = this.nearestSurplusIndex(targetId, surplusRegions);
        if (sourceIndex < 0) {
          break;
        }

        const source = surplusRegions[sourceIndex];
        const distance = this.distance(source.id, targetId);
        const distanceEfficiency = this.distanceEfficiency(distance, constants, supergridEnabled);
        const tentativeSent = Math.min(source.available, remainingDeficit / Math.max(distanceEfficiency, 0.01));
        const volumeEfficiency = this.volumeEfficiency(tentativeSent, constants, supergridEnabled);
        const transferEfficiency = clamp(distanceEfficiency * volumeEfficiency, 0, 1);

        if (transferEfficiency <= 0.01) {
          source.available = 0;
          surplusRegions[sourceIndex] = source;
          continue;
        }

        const sent = Math.min(source.available, remainingDeficit / transferEfficiency);
        const received = sent * transferEfficiency;
        const losses = Math.max(sent - received, 0);
        const congested = volumeEfficiency < 0.75 || distance >= this.distanceCap;

        source.available = Math.max(source.available - sent, 0);
        if (source.available <= 0.01) {
          surplusRegions.splice(sourceIndex, 1);
        } else {
          surplusRegions[sourceIndex] = source;
        }

        remainingDeficit = Math.max(remainingDeficit - received, 0);
        regionResults[targetId].energy_imported += received;
        regionResults[source.id].energy_exported += sent;
        regionResults[targetId].network_congested = regionResults[targetId].network_congested || congested;
        regionResults[source.id].network_congested = regionResults[source.id].network_congested || congested;

        flows.push({
          source_region_id: source.id,
          target_region_id: targetId,
          sent_amount: sent,
          received_amount: received,
          losses,
          distance,
          intensity_normalized: clamp(sent / 90, 0.05, 1),
          is_congested: congested
        });
      }

      if (remainingDeficit > 0.01) {
        const consumption = Math.max(regionMetrics[targetId]?.energy_consumption ?? 0, 0.01);
        const efficiency = clamp(1 - remainingDeficit / consumption, 0, 1);
        regionResults[targetId].energy_unserved = remainingDeficit;
        regionResults[targetId].energy_efficiency = efficiency;
        if (efficiency < 0.72) {
          regionResults[targetId].blackout_state = "severe";
        } else if (efficiency < 0.94) {
          regionResults[targetId].blackout_state = "light";
        }
      }
    }

    return { regions: regionResults, flows };
  }

  private nearestSurplusIndex(targetId: string, surplusRegions: SurplusRegion[]): number {
    let bestIndex = -1;
    let bestDistance = this.distanceCap + 1;
    let bestAvailable = -1;
    for (let index = 0; index < surplusRegions.length; index += 1) {
      const source = surplusRegions[index];
      if (source.available <= 0.01) {
        continue;
      }
      const distance = this.distance(source.id, targetId);
      if (distance < bestDistance || (distance === bestDistance && source.available > bestAvailable)) {
        bestIndex = index;
        bestDistance = distance;
        bestAvailable = source.available;
      }
    }
    return bestIndex;
  }

  private bfsDistances(sourceId: string, graph: Record<string, string[]>): Record<string, number> {
    const distances: Record<string, number> = { [sourceId]: 0 };
    const queue = [sourceId];
    let queueIndex = 0;
    while (queueIndex < queue.length) {
      const current = queue[queueIndex];
      queueIndex += 1;
      const currentDistance = distances[current] ?? 0;
      if (currentDistance >= this.distanceCap) {
        continue;
      }
      for (const neighbor of graph[current] ?? []) {
        if (distances[neighbor] !== undefined) {
          continue;
        }
        distances[neighbor] = currentDistance + 1;
        queue.push(neighbor);
      }
    }
    return distances;
  }

  private distance(sourceId: string, targetId: string): number {
    if (sourceId === targetId) {
      return 0;
    }
    return Math.min(this.distances[sourceId]?.[targetId] ?? this.distanceCap, this.distanceCap);
  }

  private distanceEfficiency(distance: number, constants: Constants, supergridEnabled: boolean): number {
    let efficiency = constants.distance_efficiency[String(distance)] ?? 0.4;
    if (supergridEnabled && distance > 0) {
      efficiency = Math.min(1, efficiency + constants.supergrid_distance_bonus);
    }
    return efficiency;
  }

  private volumeEfficiency(sentAmount: number, constants: Constants, supergridEnabled: boolean): number {
    for (const tier of constants.volume_efficiency_tiers) {
      const maxSent = supergridEnabled ? tier.max_after_supergrid : tier.max_energy_sent;
      if (sentAmount >= tier.min_energy_sent && sentAmount <= maxSent) {
        return tier.volume_efficiency;
      }
    }
    return 0.35;
  }
}
