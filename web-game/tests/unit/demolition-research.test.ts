import { createCore } from "./testData";

describe("Demolition and manual research", () => {
  it("disables a demolished building immediately and frees slots after the demolition timer", async () => {
    const core = await createCore("demolition");

    expect(core.requestBuilding("fr_nord", "gas_power_plant").ok).toBe(true);
    for (let index = 0; index < 4; index += 1) {
      core.advanceMonth();
    }

    const before = core.getRegionSnapshot("fr_nord");
    const moneyBefore = core.getSummary().money;
    expect(before?.buildings).toContain("gas_power_plant");
    expect(before?.slots_used).toBe(2);
    const energyBefore = before?.cached.energy_production ?? 0;

    const result = core.requestDemolition("fr_nord", 0);
    expect(result).toMatchObject({ ok: true, cost: 36, reason: "" });
    expect(core.getSummary().money).toBe(moneyBefore - 36);

    const during = core.getRegionSnapshot("fr_nord");
    expect(during?.buildings).not.toContain("gas_power_plant");
    expect(during?.deconstruction_queue).toHaveLength(1);
    expect(during?.slots_used).toBe(2);
    expect(during?.cached.energy_production ?? 0).toBeLessThan(energyBefore);

    core.advanceMonth();
    expect(core.getRegionSnapshot("fr_nord")?.deconstruction_queue).toHaveLength(1);
    core.advanceMonth();
    const after = core.getRegionSnapshot("fr_nord");
    expect(after?.deconstruction_queue).toHaveLength(0);
    expect(after?.slots_used).toBe(0);
  });

  it("requires the player to start research manually", async () => {
    const core = await createCore("manual-research");

    expect(core.requestBuilding("fr_nord", "energy_research_center").ok).toBe(true);
    for (let index = 0; index < 10; index += 1) {
      core.advanceMonth();
    }

    expect(core.getSummary().active_research_id).toBe("");
    expect(core.getSummary().completed_technologies).toEqual({});

    const start = core.startResearch("batteries");
    expect(start).toEqual({ ok: true, reason: "" });
    expect(core.startResearch("offshore_wind").ok).toBe(false);

    for (let index = 0; index < 20; index += 1) {
      core.advanceMonth();
    }

    expect(core.getSummary().completed_technologies.batteries).toBe(true);
    expect(core.getBuildAvailability("fr_nord").battery_storage.ok).toBe(true);
  });

  it("keeps research active but stalled when no technology points are produced", async () => {
    const core = await createCore("stalled-research");

    expect(core.startResearch("batteries").ok).toBe(true);
    core.advanceMonth();

    const active = core.getResearchOptions().find((option) => option.id === "batteries");
    expect(active?.status).toBe("active");
    expect(active?.progress).toBe(0);
    expect(active?.estimated_months_remaining).toBe(Number.POSITIVE_INFINITY);
  });

  it("marks slot saturation alerts as non-actionable notifications with an 8s timeout", async () => {
    const core = await createCore("slot-alert");
    core.state.money = 10000;

    let guard = 0;
    while (core.getBuildAvailability("dk").gas_power_plant.ok && guard < 40) {
      core.requestBuilding("dk", "gas_power_plant");
      guard += 1;
    }
    for (let index = 0; index < 4; index += 1) {
      core.advanceMonth();
    }

    const alert = core.getSummary().alerts.find((item) => item.title.includes("Slots saturated"));
    expect(alert).toBeDefined();
    expect(alert).toMatchObject({
      id: "slots-saturated:dk:market-info",
      actionable: false,
      autoDismissMs: 8000
    });
  });
});
