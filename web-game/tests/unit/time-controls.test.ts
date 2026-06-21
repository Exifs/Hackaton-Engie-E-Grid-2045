import { createCore } from "./testData";

describe("SimulationCore time controls", () => {
  it("setSimulationSpeed(0) pauses and stepSimulationTime does not advance the month", async () => {
    const core = await createCore("time-pause");
    core.setSimulationSpeed(1);
    core.stepSimulationTime(core.secondsPerMonth / 2);

    const monthBeforePause = core.getSummary().month_index;
    core.setSimulationSpeed(0);

    expect(core.getSummary().paused).toBe(true);
    expect(core.getSummary().simulation_speed).toBe(0);
    expect(core.isRunning()).toBe(false);
    expect(core.stepSimulationTime(core.secondsPerMonth * 2)).toBe(0);
    expect(core.getSummary().month_index).toBe(monthBeforePause);
  });

  it("setSimulationSpeed(1) resumes a paused simulation", async () => {
    const core = await createCore("time-resume");
    core.setSimulationSpeed(0);

    core.setSimulationSpeed(1);

    expect(core.getSummary().paused).toBe(false);
    expect(core.getSummary().simulation_speed).toBe(1);
    expect(core.isRunning()).toBe(true);
    expect(core.stepSimulationTime(core.secondsPerMonth + 0.01)).toBe(1);
    expect(core.getSummary().month_index).toBe(1);
  });

  it("togglePaused resumes at the previous non-zero simulation speed", async () => {
    const core = await createCore("time-toggle-previous-speed");
    core.setSimulationSpeed(4);

    core.togglePaused();

    expect(core.getSummary().paused).toBe(true);
    expect(core.getSummary().simulation_speed).toBe(0);

    core.togglePaused();

    expect(core.getSummary().paused).toBe(false);
    expect(core.getSummary().simulation_speed).toBe(4);
  });
});
