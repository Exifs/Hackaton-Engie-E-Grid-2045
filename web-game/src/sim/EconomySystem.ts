import type { Constants, GameSummary } from "./types";

export class EconomySystem {
  calculateMonthlyIncome(
    stateSummary: GameSummary,
    constants: Constants,
    completedTechnologies: Record<string, true>
  ): number {
    let income = constants.starting_monthly_income;
    income += constants.population_units_total * constants.income_per_population_unit;
    income += stateSummary.eu_agi_progress * constants.income_per_agi_percent;

    if (completedTechnologies.energy_efficiency) {
      income += constants.income_energy_efficiency_tech_bonus;
    }

    income -= stateSummary.blackout_regions * constants.blackout_light_income_penalty;
    income -= stateSummary.severe_blackout_regions * constants.blackout_severe_income_penalty;

    if (stateSummary.co2_tier === "moderate") {
      income -= constants.co2_moderate_income_penalty;
    } else if (stateSummary.co2_tier === "elevated" || stateSummary.co2_tier === "very_high") {
      income -= constants.co2_elevated_income_penalty;
    } else if (stateSummary.co2_tier === "critical") {
      income -= constants.co2_critical_income_penalty;
    }

    return Math.max(income, 0);
  }
}
