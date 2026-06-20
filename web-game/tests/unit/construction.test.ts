import { createCore } from "./testData";

describe("SimulationCore construction", () => {
  it("starts, completes, and applies a university in France Nord", async () => {
    const core = await createCore("construction");

    const result = core.requestBuilding("fr_nord", "university");
    expect(result.ok).toBe(true);
    expect(core.getSummary().money).toBe(880);
    expect(core.getRegionSnapshot("fr_nord")?.construction_queue).toHaveLength(1);

    for (let index = 0; index < 4; index += 1) {
      core.advanceMonth();
    }

    const snapshot = core.getRegionSnapshot("fr_nord");
    expect(snapshot?.buildings).toContain("university");
    expect(snapshot?.construction_queue).toHaveLength(0);
    expect(core.getSummary().researchers_available).toBeGreaterThan(7.1);
  });

  it("refunds cancelled construction based on progress", async () => {
    const core = await createCore("cancel");
    expect(core.requestBuilding("fr_nord", "gas_power_plant").ok).toBe(true);
    core.advanceMonth();

    const result = core.cancelConstruction("fr_nord", 0);
    expect(result.ok).toBe(true);
    expect(result.refund).toBeGreaterThan(90);
    expect(result.refund).toBeLessThanOrEqual(135);
    expect(core.getRegionSnapshot("fr_nord")?.construction_queue).toHaveLength(0);
  });
});
