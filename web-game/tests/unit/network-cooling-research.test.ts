import { CoolingSystem } from "../../src/sim/CoolingSystem";
import { EnergyNetworkSystem } from "../../src/sim/EnergyNetworkSystem";
import { ResearchSystem } from "../../src/sim/ResearchSystem";
import type { RegionMetrics } from "../../src/sim";
import { loadFixtureData } from "./testData";

describe("Network, cooling, and research systems", () => {
  it("routes energy through BFS distance with distance and volume losses", async () => {
    const data = await loadFixtureData();
    const network = new EnergyNetworkSystem();
    network.configure({ a: ["b"], b: ["a", "c"], c: ["b"] }, 5);

    const metrics: Record<string, RegionMetrics> = {
      a: baseMetrics(100, 0),
      b: baseMetrics(0, 0),
      c: baseMetrics(0, 20)
    };
    const result = network.resolve(metrics, data.constants, false);

    expect(result.flows).toHaveLength(1);
    expect(result.flows[0].distance).toBe(2);
    expect(result.flows[0].received_amount).toBeCloseTo(20, 4);
    expect(result.flows[0].sent_amount).toBeGreaterThan(20);
    expect(result.regions.c.energy_unserved).toBe(0);
  });

  it("marks low and critical cooling states", () => {
    const cooling = new CoolingSystem();
    expect(cooling.resolveRegion(9, 10).cooling_state).toBe("low");
    expect(cooling.resolveRegion(5, 10).cooling_state).toBe("critical");
    expect(cooling.resolveRegion(20, 10).cooling_efficiency).toBe(1);
  });

  it("computes USA curve and next available technology", async () => {
    const data = await loadFixtureData();
    const research = new ResearchSystem();

    expect(research.computeUsaProgress(2030, 1)).toBeCloseTo(20);
    expect(research.computeUsaProgress(2045, 1)).toBeCloseTo(100);
    expect(research.nextAvailableTechnology(data.technologies, {})).toBe("batteries");
  });

  it("applies researcher efficiency locally by region", async () => {
    const data = await loadFixtureData();
    const { SimulationCore } = await import("../../src/sim/SimulationCore");
    const core = new SimulationCore(data);
    core.newGame("local-researchers");

    expect(core.requestBuilding("fr_sud", "datacenter_standard").ok).toBe(true);
    for (let index = 0; index < data.buildings.datacenter_standard.construction_months; index += 1) {
      core.advanceMonth();
    }

    const region = core.getRegionSnapshot("fr_sud");
    const summary = core.getSummary();

    expect(summary.researchers_available).toBeGreaterThan(summary.researchers_required);
    expect(region?.cached.researchers_available).toBeCloseTo(data.regions.fr_sud.starting_researchers);
    expect(region?.cached.researchers_required).toBe(data.buildings.datacenter_standard.researchers_required);
    expect(region?.cached.researcher_efficiency).toBeCloseTo(
      data.regions.fr_sud.starting_researchers / data.buildings.datacenter_standard.researchers_required
    );
    expect(summary.researcher_shortage_regions).toBeGreaterThanOrEqual(1);
  });
});

function baseMetrics(production: number, consumption: number): RegionMetrics {
  return {
    energy_production: production,
    energy_consumption: consumption,
    cooling_available: 0,
    cooling_used: 0,
    compute_potential: 0,
    compute_demand: 0,
    researchers_available: 0,
    researchers_required: 0,
    researcher_efficiency: 1,
    co2_monthly: 0,
    technology_points: 0,
    energy_technology_points: 0,
    ai_technology_points: 0,
    ai_research_centers: 0,
    ai_research_capacity: 0
  };
}
