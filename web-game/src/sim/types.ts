export type NumberMap = Record<string, number>;

export interface Constants {
  starting_money: number;
  starting_year: number;
  ending_year: number;
  tick_duration_months: number;
  starting_monthly_income: number;
  base_research_monthly: number;
  compute_optimal_start: number;
  compute_optimal_end: number;
  regional_distance_cap: number;
  population_units_total: number;
  income_per_population_unit: number;
  income_per_agi_percent: number;
  income_energy_efficiency_tech_bonus: number;
  blackout_light_income_penalty: number;
  blackout_severe_income_penalty: number;
  co2_moderate_income_penalty: number;
  co2_elevated_income_penalty: number;
  co2_critical_income_penalty: number;
  construction_cancel_refund_min_pct: number;
  construction_cancel_refund_max_pct: number;
  supergrid_distance_bonus: number;
  supergrid_volume_threshold_bonus: number;
  distance_efficiency: NumberMap;
  volume_efficiency_tiers: VolumeEfficiencyTier[];
}

export interface RegionLayout {
  display_name: string;
  x: number;
  y: number;
  hitbox_radius: number;
  slot_anchor_dx: number;
  slot_anchor_dy: number;
  slot_grid_cols: number;
  slot_grid_rows: number;
  slot_spacing: number;
}

export interface RegionDefinition {
  id: string;
  display_name: string;
  slots_max: number;
  tags: string[];
  potential_cooling: number;
  potential_solar: number;
  potential_wind_onshore: number;
  potential_wind_offshore: number;
  potential_hydro: number;
  potential_nuclear: number;
  potential_grid: number;
  potential_research: number;
  population_units: number;
  base_energy_demand: number;
  starting_energy_generation: number;
  starting_cooling_capacity: number;
  starting_compute: number;
  starting_researchers: number;
  starting_co2_pressure_per_month: number;
}

export interface RegionRuntime extends RegionDefinition {
  buildings: string[];
  construction_queue: ConstructionItem[];
  cached: RegionCachedMetrics;
  layout: Partial<RegionLayout>;
}

export interface BuildingDefinition {
  id: string;
  display_name: string;
  category: string;
  slots_required: number;
  cost: number;
  construction_months: number;
  produces_energy: number;
  produces_cooling: number;
  produces_researchers: number;
  produces_compute: number;
  produces_storage: number;
  consumes_energy: number;
  consumes_cooling: number;
  consumes_compute: number;
  researchers_required: number;
  co2_monthly: number;
  variable_output: boolean;
  variation_profile: string;
  availability: string;
  unlock_technology: string;
  required_tags: string[];
  required_potential: string;
  required_potential_min: number;
  scaling_potential: string;
  icon_key: string;
  description: string;
}

export interface TechnologyDefinition {
  id: string;
  display_name: string;
  branch: string;
  tier: number;
  cost: number;
  research_months: number;
  prereq_technology_ids: string[];
  unlocks: string[];
  effect_key: string;
  effect_value: string;
  effect_value_pct: number;
  notes: string;
}

export interface Co2Tier {
  id: string;
  min: number;
  max: number;
  income_penalty: number;
  cooling_demand_pct: number;
}

export interface VolumeEfficiencyTier {
  id?: string;
  min_energy_sent: number;
  max_energy_sent: number;
  max_after_supergrid: number;
  volume_efficiency: number;
}

export interface ConstructionItem {
  building_id: string;
  months_remaining: number;
  total_months: number;
  cost: number;
}

export interface RegionCachedMetrics {
  energy_production?: number;
  energy_consumption?: number;
  energy_balance_local?: number;
  energy_imported?: number;
  energy_exported?: number;
  energy_unserved?: number;
  energy_efficiency?: number;
  cooling_available?: number;
  cooling_used?: number;
  cooling_efficiency?: number;
  cooling_state?: string;
  compute_produced?: number;
  compute_demand?: number;
  researchers_required?: number;
  researchers_available?: number;
  researcher_efficiency?: number;
  regional_efficiency?: number;
  blackout_state?: string;
  network_congested?: boolean;
  co2_monthly?: number;
  technology_points?: number;
  problems?: string[];
}

export interface RegionMetrics {
  energy_production: number;
  energy_consumption: number;
  cooling_available: number;
  cooling_used: number;
  compute_potential: number;
  compute_demand: number;
  researchers_available: number;
  researchers_required: number;
  researcher_efficiency: number;
  co2_monthly: number;
  technology_points: number;
  ai_research_centers: number;
}

export interface NetworkFlow {
  source_region_id: string;
  target_region_id: string;
  sent_amount: number;
  received_amount: number;
  losses: number;
  distance: number;
  intensity_normalized: number;
  is_congested: boolean;
}

export interface RegionNetworkResult {
  energy_imported: number;
  energy_exported: number;
  energy_unserved: number;
  energy_efficiency: number;
  blackout_state: "stable" | "light" | "severe";
  network_congested: boolean;
}

export interface NetworkResult {
  regions: Record<string, RegionNetworkResult>;
  flows: NetworkFlow[];
}

export interface Alert {
  priority: number;
  title: string;
  body: string;
  region_id: string;
  state: string;
}

export interface GameSummary {
  year: number;
  month: number;
  month_index: number;
  date_text: string;
  money: number;
  monthly_income: number;
  eu_agi_progress: number;
  usa_agi_progress: number;
  cumulative_co2: number;
  co2_tier: string;
  researchers_available: number;
  researchers_required: number;
  compute_produced: number;
  compute_used: number;
  energy_produced: number;
  energy_consumed: number;
  cooling_available: number;
  cooling_used: number;
  blackout_regions: number;
  severe_blackout_regions: number;
  simulation_speed: number;
  paused: boolean;
  selected_region_id: string;
  active_research_id: string;
  active_research_points: number;
  completed_technologies: Record<string, true>;
  alerts: Alert[];
  network_flows: NetworkFlow[];
  game_result: string;
  month_progress?: number;
}

export interface RegionSnapshot extends RegionRuntime {
  slots_used: number;
  slots_free: number;
}

export interface BuildAvailability {
  ok: boolean;
  reason: string;
}

export interface BuildResult extends BuildAvailability {}

export interface CancelResult {
  ok: boolean;
  refund: number;
  reason: string;
}

export interface GameData {
  constants: Constants;
  regions: Record<string, RegionDefinition>;
  buildings: Record<string, BuildingDefinition>;
  network_graph: Record<string, string[]>;
  region_layout: Record<string, RegionLayout>;
  technologies: Record<string, TechnologyDefinition>;
  events: Record<string, Record<string, string>>;
  co2_tiers: Co2Tier[];
}

export interface ProvisionalScore {
  network_stability: number;
  decarbonized_share: number;
  energy_efficiency: number;
  co2: number;
  score: number;
}
