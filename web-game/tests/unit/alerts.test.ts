import { createAlert, generateAlerts } from "../../src/sim/alerts";
import type { BuildingDefinition, RegionRuntime } from "../../src/sim";

function regionWithCached(cached: RegionRuntime["cached"], overrides: Partial<RegionRuntime> = {}): RegionRuntime {
  return {
    id: "fr_nord",
    display_name: "France Nord",
    slots_max: 1,
    tags: [],
    potential_cooling: 0,
    potential_solar: 0,
    potential_wind_onshore: 0,
    potential_wind_offshore: 0,
    potential_hydro: 0,
    potential_nuclear: 0,
    potential_grid: 0,
    potential_research: 0,
    population_units: 0,
    base_energy_demand: 0,
    starting_energy_generation: 0,
    starting_cooling_capacity: 0,
    starting_compute: 0,
    starting_researchers: 0,
    starting_co2_pressure_per_month: 0,
    buildings: [],
    construction_queue: [],
    deconstruction_queue: [],
    history: [],
    layout: {},
    cached,
    ...overrides
  };
}

describe("simulation alerts", () => {
  it("creates stable alert ids and auto-dismiss defaults", () => {
    const alert = createAlert(6, "Slots saturated", "France Nord", "regional capacity is full", "choose another region", "fr_nord", "market_info", false);

    expect(alert.id).toBe("slots-saturated:fr-nord:market-info");
    expect(alert.title).toBe("Slots saturated - France Nord");
    expect(alert.body).toBe("regional capacity is full -> choose another region");
    expect(alert.actionable).toBe(false);
    expect(alert.autoDismissMs).toBe(8000);
  });

  it("sorts alerts by priority and limits the active list", () => {
    const alerts = generateAlerts({
      regions: {
        fr_nord: regionWithCached(
          {
            blackout_state: "light",
            energy_efficiency: 0.9,
            cooling_efficiency: 0.91,
            network_congested: true
          },
          { buildings: ["gas_power_plant"] }
        )
      },
      state: {
        researchers_available: 8,
        researchers_required: 10,
        co2_tier: "elevated",
        eu_agi_progress: 40,
        usa_agi_progress: 90
      },
      buildingDefinitions: {} as Record<string, BuildingDefinition>,
      slotsFree: () => 0
    });

    expect(alerts).toHaveLength(5);
    expect(alerts.map((alert) => alert.priority)).toEqual([2, 3, 4, 5, 5]);
    expect(alerts.map((alert) => alert.id)).toContain("network-saturated:fr-nord:power-warning");
    expect(alerts.map((alert) => alert.id)).not.toContain("usa-near-agi:global:critical");
  });
});
