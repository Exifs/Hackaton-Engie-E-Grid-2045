import { createCore } from "./testData";

describe("Build availability", () => {
  it("enforces technology locks before regional checks", async () => {
    const core = await createCore("locks");

    expect(core.getBuildAvailability("fr_nord").battery_storage.ok).toBe(false);
    expect(core.getBuildAvailability("fr_nord").battery_storage.reason).toBe("Research batteries.");
    expect(core.getBuildAvailability("fr_nord").battery_storage.cause).toBe("technology");

    core.state.completed_technologies.batteries = true;
    expect(core.getBuildAvailability("fr_nord").battery_storage.ok).toBe(true);
  });

  it("classifies temporary construction blockers separately from access locks", async () => {
    const core = await createCore("temporary-locks");

    core.state.money = 0;
    expect(core.getBuildAvailability("fr_nord").gas_power_plant).toMatchObject({
      ok: false,
      cause: "budget"
    });

    core.state.money = 10000;
    expect(core.getBuildAvailability("at").wind_offshore).toMatchObject({
      ok: false,
      cause: "technology"
    });

    core.state.completed_technologies.offshore_wind = true;
    expect(core.getBuildAvailability("at").wind_offshore.ok).toBe(false);
    expect(["region_tag", "region_potential"]).toContain(core.getBuildAvailability("at").wind_offshore.cause);
  });

  it("enforces regional tags and potentials for specialized buildings", async () => {
    const core = await createCore("tags");
    core.state.completed_technologies.offshore_wind = true;

    expect(core.getBuildAvailability("fr_nord").wind_offshore.ok).toBe(true);
    expect(core.getBuildAvailability("at").wind_offshore.ok).toBe(false);
    expect(core.getBuildAvailability("at").wind_offshore.reason).toMatch(/tag|potential/i);
  });
});
