import { clamp } from "./math";
import type { GameSummary, ProvisionalScore } from "./types";

export class ScoringSystem {
  provisionalScore(stateSummary: GameSummary): ProvisionalScore {
    let stability = 100;
    stability -= stateSummary.blackout_regions * 8;
    stability -= stateSummary.severe_blackout_regions * 16;
    stability = clamp(stability, 0, 100);

    const energyProduced = Math.max(stateSummary.energy_produced, 0.01);
    const co2 = stateSummary.cumulative_co2;
    const decarbonizedShare = clamp(100 - co2 / 24, 0, 100);
    const energyEfficiency = clamp((stateSummary.energy_consumed / energyProduced) * 100, 0, 100);

    return {
      network_stability: stability,
      decarbonized_share: decarbonizedShare,
      energy_efficiency: energyEfficiency,
      co2,
      score: Math.round((stability + decarbonizedShare + energyEfficiency + stateSummary.eu_agi_progress) * 2.5)
    };
  }
}
