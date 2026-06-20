import { clamp, lerp } from "./math";
import type { Constants, GameSummary, TechnologyDefinition } from "./types";

export class ResearchSystem {
  computeUsaProgress(year: number, month: number): number {
    const timeline = [
      { year: 2025, value: 0 },
      { year: 2030, value: 20 },
      { year: 2035, value: 45 },
      { year: 2040, value: 75 },
      { year: 2045, value: 100 }
    ];
    const currentTime = year + (month - 1) / 12;
    for (let index = 0; index < timeline.length - 1; index += 1) {
      const start = timeline[index];
      const finish = timeline[index + 1];
      if (currentTime >= start.year && currentTime <= finish.year) {
        const ratio = clamp((currentTime - start.year) / (finish.year - start.year), 0, 1);
        return lerp(start.value, finish.value, ratio);
      }
    }
    return currentTime >= 2045 ? 100 : 0;
  }

  computeEuAgiGain(
    stateSummary: GameSummary,
    constants: Constants,
    aiResearchCenters: number,
    networkStability: number,
    aiEfficiencyBonusPct: number
  ): number {
    if (aiResearchCenters <= 0) {
      return 0;
    }
    const totalMonths = Math.max((constants.ending_year - constants.starting_year) * 12, 1);
    const progressRatio = clamp(stateSummary.month_index / totalMonths, 0, 1);
    const computeOptimal = lerp(constants.compute_optimal_start, constants.compute_optimal_end, progressRatio);
    const factorCompute = Math.sqrt(Math.max(stateSummary.compute_used, 0) / Math.max(computeOptimal, 1));
    let factorResearchers = 1;
    if (stateSummary.researchers_required > 0.01) {
      factorResearchers = clamp(stateSummary.researchers_available / stateSummary.researchers_required, 0, 1);
    }
    const factorAi = 1 + aiEfficiencyBonusPct / 100;
    let factorStability = clamp(networkStability, 0, 1);
    if (stateSummary.severe_blackout_regions > 0) {
      factorStability *= 0.8;
    }
    return constants.base_research_monthly * factorCompute * factorResearchers * factorAi * factorStability;
  }

  nextAvailableTechnology(
    technologies: Record<string, TechnologyDefinition>,
    completedTechnologies: Record<string, true>
  ): string {
    const candidates = Object.values(technologies).filter((technology) => {
      if (completedTechnologies[technology.id]) {
        return false;
      }
      return technology.prereq_technology_ids.every((prereq) => completedTechnologies[prereq]);
    });

    candidates.sort((a, b) => {
      if (a.tier === b.tier) {
        return a.cost - b.cost;
      }
      return a.tier - b.tier;
    });
    return candidates[0]?.id ?? "";
  }

  aiEfficiencyBonus(
    completedTechnologies: Record<string, true>,
    technologies: Record<string, TechnologyDefinition>
  ): number {
    let bonus = 0;
    for (const technologyId of Object.keys(completedTechnologies)) {
      const technology = technologies[technologyId];
      if (!technology) {
        continue;
      }
      if (technology.effect_key === "ai_efficiency_bonus" || technology.effect_key === "agi_gain_multiplier") {
        bonus += technology.effect_value_pct;
      }
    }
    return bonus;
  }
}
