import { describe, expect, it } from "vitest";
import { createCore } from "./testData";

describe("SimulationCore time cadence", () => {
  it("uses a 4.8s default month cadence", async () => {
    const core = await createCore("cadence-default");

    expect(core.secondsPerMonth).toBe(4.8);
  });

  it("advances one x1 month at 4.8s but not at 4.79s", async () => {
    const beforeThreshold = await createCore("cadence-before");
    beforeThreshold.setSimulationSpeed(1);
    const startMonth = beforeThreshold.getSummary().month_index;

    expect(beforeThreshold.stepSimulationTime(4.79)).toBe(0);
    expect(beforeThreshold.getSummary().month_index).toBe(startMonth);

    const atThreshold = await createCore("cadence-at");
    atThreshold.setSimulationSpeed(1);
    const thresholdStartMonth = atThreshold.getSummary().month_index;

    expect(atThreshold.stepSimulationTime(4.8)).toBe(1);
    expect(atThreshold.getSummary().month_index).toBe(thresholdStartMonth + 1);
  });
});
