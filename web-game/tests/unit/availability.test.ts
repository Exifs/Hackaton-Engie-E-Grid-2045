import { createCore } from "./testData";

describe("Build availability", () => {
  it("enforces technology locks before regional checks", async () => {
    const core = await createCore("locks");

    expect(core.getBuildAvailability("fr_nord").battery_storage.ok).toBe(false);
    expect(core.getBuildAvailability("fr_nord").battery_storage.reason).toContain("Locked");

    core.state.completed_technologies.batteries = true;
    expect(core.getBuildAvailability("fr_nord").battery_storage.ok).toBe(true);
  });

  it("enforces regional tags and potentials for specialized buildings", async () => {
    const core = await createCore("tags");
    core.state.completed_technologies.offshore_wind = true;

    expect(core.getBuildAvailability("fr_nord").wind_offshore.ok).toBe(true);
    expect(core.getBuildAvailability("at").wind_offshore.ok).toBe(false);
    expect(core.getBuildAvailability("at").wind_offshore.reason).toMatch(/tag|potential/i);
  });
});
