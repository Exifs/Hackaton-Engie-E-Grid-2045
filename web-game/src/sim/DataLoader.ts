import { csvParse } from "d3-dsv";
import { numberFrom, numberOrInfinity, splitList } from "./math";
import type {
  BuildingDefinition,
  Co2Tier,
  Constants,
  GameData,
  RegionDefinition,
  RegionLayout,
  TechnologyDefinition,
  VolumeEfficiencyTier
} from "./types";

const DATA_FILES = [
  "balance_constants.json",
  "regions.csv",
  "buildings.csv",
  "network_graph.json",
  "region_layout.json",
  "technologies.csv",
  "events.csv",
  "co2_tiers.csv",
  "network_distance_efficiency.csv",
  "network_volume_efficiency.csv"
];

const BUILDING_ICON_KEYS: Record<string, string> = {
  university: "university",
  ai_research_center: "ai_research_center",
  energy_research_center: "energy_research_center",
  datacenter_standard: "datacenter_standard",
  datacenter_hyperscale: "datacenter_hyperscale",
  gas_power_plant: "gas_power_plant",
  nuclear_power_plant: "nuclear_power_plant",
  wind_onshore: "wind_onshore",
  wind_offshore: "wind_offshore",
  solar_farm: "solar_farm",
  hydro_dam: "hydro_dam",
  battery_storage: "battery_storage",
  air_cooling: "air_cooling",
  river_cooling: "river_cooling",
  sea_cooling: "sea_cooling",
  geothermal_cooling: "geothermal_cooling"
};

type CsvRow = Record<string, string>;

export class DataLoader {
  static async load(baseUrl = `${import.meta.env.BASE_URL}data/`): Promise<GameData> {
    const files: Record<string, string> = {};
    await Promise.all(
      DATA_FILES.map(async (fileName) => {
        const response = await fetch(`${baseUrl}${fileName}`);
        if (!response.ok) {
          throw new Error(`Unable to load ${fileName}: ${response.status}`);
        }
        files[fileName] = await response.text();
      })
    );
    return DataLoader.parseGameData(files);
  }

  static parseGameData(files: Record<string, string>): GameData {
    const constants = loadConstants(json(files["balance_constants.json"], {}));
    constants.distance_efficiency = loadDistanceEfficiency(rows(files["network_distance_efficiency.csv"]));
    constants.volume_efficiency_tiers = loadVolumeEfficiencyTiers(rows(files["network_volume_efficiency.csv"]));

    return {
      constants,
      regions: loadRegions(rows(files["regions.csv"])),
      buildings: loadBuildings(rows(files["buildings.csv"])),
      network_graph: json(files["network_graph.json"], {}),
      region_layout: loadRegionLayout(json(files["region_layout.json"], {})),
      technologies: loadTechnologies(rows(files["technologies.csv"])),
      events: Object.fromEntries(rows(files["events.csv"]).map((row) => [row.event_id, row])),
      co2_tiers: loadCo2Tiers(rows(files["co2_tiers.csv"]))
    };
  }
}

function rows(raw = ""): CsvRow[] {
  return csvParse(raw).map((row) => {
    const clean: CsvRow = {};
    for (const [key, value] of Object.entries(row)) {
      clean[key.trim()] = String(value ?? "").trim();
    }
    return clean;
  });
}

function json<T>(raw: string | undefined, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadConstants(raw: Record<string, unknown>): Constants {
  return {
    starting_money: numberFrom(raw.starting_money, 1000),
    starting_year: Math.trunc(numberFrom(raw.starting_year ?? raw.start_year, 2025)),
    ending_year: Math.trunc(numberFrom(raw.ending_year ?? raw.end_year, 2045)),
    tick_duration_months: Math.trunc(numberFrom(raw.tick_duration_months, 1)),
    starting_monthly_income: numberFrom(raw.starting_monthly_income ?? raw.base_monthly_income, 80),
    base_research_monthly: numberFrom(raw.base_research_monthly ?? raw.base_agi_gain_monthly_pct, 0.35),
    compute_optimal_start: numberFrom(raw.compute_optimal_start, 100),
    compute_optimal_end: numberFrom(raw.compute_optimal_end, 400),
    regional_distance_cap: Math.trunc(numberFrom(raw.regional_distance_cap, 5)),
    population_units_total: numberFrom(raw.population_units_total, 45),
    income_per_population_unit: numberFrom(raw.income_per_population_unit, 2),
    income_per_agi_percent: numberFrom(raw.income_per_agi_percent, 3),
    income_energy_efficiency_tech_bonus: numberFrom(raw.income_energy_efficiency_tech_bonus, 30),
    blackout_light_income_penalty: Math.abs(numberFrom(raw.blackout_light_income_penalty, -20)),
    blackout_severe_income_penalty: Math.abs(numberFrom(raw.blackout_severe_income_penalty, -60)),
    co2_moderate_income_penalty: Math.abs(numberFrom(raw.co2_moderate_income_penalty, -10)),
    co2_elevated_income_penalty: Math.abs(numberFrom(raw.co2_elevated_income_penalty, -30)),
    co2_critical_income_penalty: Math.abs(numberFrom(raw.co2_critical_income_penalty, -80)),
    construction_cancel_refund_min_pct: numberFrom(raw.construction_cancel_refund_min_pct, 50) / 100,
    construction_cancel_refund_max_pct: numberFrom(raw.construction_cancel_refund_max_pct, 75) / 100,
    supergrid_distance_bonus: 0.15,
    supergrid_volume_threshold_bonus: 0.25,
    distance_efficiency: {},
    volume_efficiency_tiers: []
  };
}

function loadRegions(sourceRows: CsvRow[]): Record<string, RegionDefinition> {
  const regions: Record<string, RegionDefinition> = {};
  for (const row of sourceRows) {
    const regionId = row.region_id;
    if (!regionId) {
      continue;
    }
    regions[regionId] = {
      id: regionId,
      display_name: row.region_name || regionId,
      slots_max: Math.trunc(numberFrom(row.slots_total, 12)),
      tags: splitList(row.tags),
      potential_cooling: numberFrom(row.cooling_potential, 1),
      potential_solar: numberFrom(row.solar_potential, 1),
      potential_wind_onshore: numberFrom(row.wind_onshore_potential, 1),
      potential_wind_offshore: numberFrom(row.wind_offshore_potential, 0),
      potential_hydro: numberFrom(row.hydro_potential, 0),
      potential_nuclear: numberFrom(row.nuclear_potential, 0),
      potential_grid: numberFrom(row.grid_potential, 1),
      potential_research: numberFrom(row.research_potential, 1),
      population_units: numberFrom(row.population_units_2025, 0),
      base_energy_demand: numberFrom(row.base_energy_demand, 0),
      starting_energy_generation: numberFrom(row.starting_energy_generation, 0),
      starting_cooling_capacity: numberFrom(row.starting_cooling_capacity, 0),
      starting_compute: numberFrom(row.starting_compute, 0),
      starting_researchers: numberFrom(row.starting_researchers, 0),
      starting_co2_pressure_per_month: numberFrom(row.starting_co2_pressure_per_month, 0)
    };
  }
  return regions;
}

function loadBuildings(sourceRows: CsvRow[]): Record<string, BuildingDefinition> {
  const buildings: Record<string, BuildingDefinition> = {};
  for (const row of sourceRows) {
    const buildingId = row.building_id;
    if (!buildingId) {
      continue;
    }
    const csvCategory = row.category || "misc";
    const category = csvCategory === "storage" ? "grid" : csvCategory;
    buildings[buildingId] = {
      id: buildingId,
      display_name: row.display_name || buildingId,
      category,
      slots_required: Math.trunc(numberFrom(row.slots, 1)),
      cost: Math.trunc(numberFrom(row.cost, 0)),
      construction_months: Math.trunc(numberFrom(row.construction_months, 1)),
      produces_energy: Math.max(numberFrom(row.energy_delta, 0), 0),
      produces_cooling: Math.max(numberFrom(row.cooling_delta, 0), 0),
      produces_researchers: row.output_resource === "researchers" ? numberFrom(row.output_amount, 0) : 0,
      produces_compute: Math.max(numberFrom(row.compute_delta, 0), 0),
      produces_storage: Math.max(numberFrom(row.storage_delta, 0), 0),
      consumes_energy: numberFrom(row.consumes_energy, 0),
      consumes_cooling: numberFrom(row.consumes_cooling, 0),
      consumes_compute: numberFrom(row.consumes_compute, 0),
      researchers_required: numberFrom(row.required_researchers, 0),
      co2_monthly: numberFrom(row.co2_per_month, 0),
      variable_output: Boolean(row.variation_profile),
      variation_profile: row.variation_profile || "",
      availability: row.availability || "available_2025",
      unlock_technology: row.unlock_technology || "",
      required_tags: splitList(row.required_region_tag_any),
      required_potential: row.required_potential_key || "",
      required_potential_min: numberFrom(row.required_potential_min, 0),
      scaling_potential: row.scaling_potential_key || "",
      icon_key: iconKeyForBuilding(buildingId, category),
      description: row.notes || ""
    };
  }
  return buildings;
}

function loadRegionLayout(parsed: { regions?: Record<string, RegionLayout> }): Record<string, RegionLayout> {
  return parsed.regions ?? {};
}

function loadTechnologies(sourceRows: CsvRow[]): Record<string, TechnologyDefinition> {
  const technologies: Record<string, TechnologyDefinition> = {};
  for (const row of sourceRows) {
    const technologyId = row.technology_id;
    if (!technologyId) {
      continue;
    }
    technologies[technologyId] = {
      id: technologyId,
      display_name: row.display_name || technologyId,
      branch: row.branch || "",
      tier: Math.trunc(numberFrom(row.tier, 1)),
      cost: numberFrom(row.cost, 0),
      research_months: Math.trunc(numberFrom(row.research_months, 1)),
      prereq_technology_ids: splitList(row.prereq_technology_ids),
      unlocks: splitList(row.unlocks),
      effect_key: row.effect_key || "",
      effect_value: row.effect_value || "",
      effect_value_pct: numberFrom(row.effect_value_pct, 0),
      notes: row.notes || ""
    };
  }
  return technologies;
}

function loadCo2Tiers(sourceRows: CsvRow[]): Co2Tier[] {
  return sourceRows.map((row) => ({
    id: row.tier_id || "low",
    min: numberFrom(row.min_cumulative_co2, 0),
    max: numberOrInfinity(row.max_cumulative_co2),
    income_penalty: Math.abs(numberFrom(row.income_penalty, 0)),
    cooling_demand_pct: numberFrom(row.cooling_demand_pct, 0)
  }));
}

function loadDistanceEfficiency(sourceRows: CsvRow[]) {
  const values: Record<string, number> = {};
  for (const row of sourceRows) {
    const distance = Math.trunc(numberFrom(row.distance, 0));
    values[String(distance)] = numberFrom(row.distance_efficiency, 1);
  }
  return Object.keys(values).length > 0
    ? values
    : {
        "0": 1,
        "1": 0.92,
        "2": 0.84,
        "3": 0.72,
        "4": 0.58,
        "5": 0.4
      };
}

function loadVolumeEfficiencyTiers(sourceRows: CsvRow[]): VolumeEfficiencyTier[] {
  const tiers = sourceRows.map((row) => ({
    id: row.tier_id,
    min_energy_sent: numberFrom(row.min_energy_sent, 0),
    max_energy_sent: numberOrInfinity(row.max_energy_sent),
    max_after_supergrid: numberOrInfinity(row.max_after_supergrid),
    volume_efficiency: numberFrom(row.volume_efficiency, 1)
  }));
  if (tiers.length > 0) {
    return tiers;
  }
  return [
    { min_energy_sent: 0, max_energy_sent: 50, max_after_supergrid: 62, volume_efficiency: 1 },
    { min_energy_sent: 51, max_energy_sent: 100, max_after_supergrid: 125, volume_efficiency: 0.9 },
    { min_energy_sent: 101, max_energy_sent: 200, max_after_supergrid: 250, volume_efficiency: 0.75 },
    { min_energy_sent: 201, max_energy_sent: 400, max_after_supergrid: 500, volume_efficiency: 0.55 },
    {
      min_energy_sent: 401,
      max_energy_sent: Number.POSITIVE_INFINITY,
      max_after_supergrid: Number.POSITIVE_INFINITY,
      volume_efficiency: 0.35
    }
  ];
}

function iconKeyForBuilding(buildingId: string, category: string): string {
  if (BUILDING_ICON_KEYS[buildingId]) {
    return BUILDING_ICON_KEYS[buildingId];
  }
  if (buildingId.includes("wind") || buildingId.includes("solar")) {
    return "energy";
  }
  if (buildingId.includes("battery")) {
    return "battery";
  }
  if (buildingId.includes("cooling")) {
    return "cooling";
  }
  if (buildingId.includes("datacenter")) {
    return "datacenter";
  }
  if (buildingId.includes("research") || buildingId.includes("university")) {
    return "science";
  }
  if (category === "grid") {
    return "grid";
  }
  return category;
}
