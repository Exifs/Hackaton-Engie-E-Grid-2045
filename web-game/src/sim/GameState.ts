import type { Alert, Constants, GameSummary, NetworkFlow } from "./types";

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export class GameState {
  year = 2025;
  month = 1;
  month_index = 0;
  money = 1000;
  monthly_income = 0;
  eu_agi_progress = 0;
  usa_agi_progress = 0;
  cumulative_co2 = 0;
  co2_tier = "low";
  researchers_available = 0;
  researchers_required = 0;
  researcher_shortage_regions = 0;
  compute_produced = 0;
  compute_used = 0;
  energy_produced = 0;
  energy_consumed = 0;
  cooling_available = 0;
  cooling_used = 0;
  blackout_regions = 0;
  severe_blackout_regions = 0;
  simulation_speed = 0;
  paused = true;
  selected_region_id = "";
  active_research_id = "";
  active_research_points = 0;
  research_queue: string[] = [];
  completed_technologies: Record<string, true> = {};
  alerts: Alert[] = [];
  network_flows: NetworkFlow[] = [];
  game_result = "";

  setup(constants: Constants): void {
    this.year = constants.starting_year;
    this.month = 1;
    this.month_index = 0;
    this.money = constants.starting_money;
    this.monthly_income = constants.starting_monthly_income;
    this.eu_agi_progress = 0;
    this.usa_agi_progress = 0;
    this.cumulative_co2 = 0;
    this.co2_tier = "low";
    this.researchers_available = 0;
    this.researchers_required = 0;
    this.researcher_shortage_regions = 0;
    this.compute_produced = 0;
    this.compute_used = 0;
    this.energy_produced = 0;
    this.energy_consumed = 0;
    this.cooling_available = 0;
    this.cooling_used = 0;
    this.blackout_regions = 0;
    this.severe_blackout_regions = 0;
    this.simulation_speed = 0;
    this.paused = true;
    this.selected_region_id = "";
    this.active_research_id = "";
    this.active_research_points = 0;
    this.research_queue = [];
    this.completed_technologies = {};
    this.alerts = [];
    this.network_flows = [];
    this.game_result = "";
  }

  advanceMonth(): void {
    this.month_index += 1;
    this.month += 1;
    if (this.month > 12) {
      this.month = 1;
      this.year += 1;
    }
  }

  dateText(): string {
    return `${MONTH_NAMES[Math.max(Math.min(this.month - 1, 11), 0)]} ${this.year}`;
  }

  toSummary(): GameSummary {
    return {
      year: this.year,
      month: this.month,
      month_index: this.month_index,
      date_text: this.dateText(),
      money: this.money,
      monthly_income: this.monthly_income,
      eu_agi_progress: this.eu_agi_progress,
      usa_agi_progress: this.usa_agi_progress,
      cumulative_co2: this.cumulative_co2,
      co2_tier: this.co2_tier,
      researchers_available: this.researchers_available,
      researchers_required: this.researchers_required,
      researcher_shortage_regions: this.researcher_shortage_regions,
      compute_produced: this.compute_produced,
      compute_used: this.compute_used,
      energy_produced: this.energy_produced,
      energy_consumed: this.energy_consumed,
      cooling_available: this.cooling_available,
      cooling_used: this.cooling_used,
      blackout_regions: this.blackout_regions,
      severe_blackout_regions: this.severe_blackout_regions,
      simulation_speed: this.simulation_speed,
      paused: this.paused,
      selected_region_id: this.selected_region_id,
      active_research_id: this.active_research_id,
      active_research_points: this.active_research_points,
      research_queue: [...this.research_queue],
      completed_technologies: { ...this.completed_technologies },
      alerts: this.alerts.map((alert) => ({ ...alert })),
      network_flows: this.network_flows.map((flow) => ({ ...flow })),
      game_result: this.game_result
    };
  }
}
