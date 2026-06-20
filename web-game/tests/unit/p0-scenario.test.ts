import { createCore } from "./testData";

describe("P0 playable scenario", () => {
  it("plays France Nord through university, energy, cooling, datacenter, and KPI refresh", async () => {
    const core = await createCore("p0");

    expect(core.requestBuilding("fr_nord", "university").ok).toBe(true);
    expect(core.requestBuilding("fr_nord", "gas_power_plant").ok).toBe(true);
    expect(core.requestBuilding("fr_nord", "air_cooling").ok).toBe(true);
    expect(core.requestBuilding("fr_nord", "datacenter_standard").ok).toBe(true);

    for (let index = 0; index < 6; index += 1) {
      core.advanceMonth();
    }

    const region = core.getRegionSnapshot("fr_nord");
    const summary = core.getSummary();

    expect(region?.buildings).toEqual(
      expect.arrayContaining(["university", "gas_power_plant", "air_cooling", "datacenter_standard"])
    );
    expect(summary.energy_produced).toBeGreaterThan(summary.energy_consumed * 0.8);
    expect(summary.cooling_available).toBeGreaterThan(summary.cooling_used);
    expect(summary.compute_produced).toBeGreaterThan(10);
    expect(Array.isArray(summary.alerts)).toBe(true);
    expect(core.getBuildAvailability("fr_nord").ai_research_center.ok).toBeDefined();
  });
});
