import { createCore } from "./testData";

describe("Research queue", () => {
  it("blocks starting or queueing research without the required active building", async () => {
    const core = await createCore("research-prereq");

    expect(core.startResearch("batteries")).toMatchObject({
      ok: false,
      reason: "Requires an active Centre recherche energie."
    });
    expect(core.startResearch("model_optimization")).toMatchObject({
      ok: false,
      reason: "Requires an active Centre recherche IA."
    });

    await completeBuilding(core, "energy_research_center");
    expect(core.startResearch("batteries")).toEqual({ ok: true, reason: "" });
    expect(core.startResearch("model_optimization")).toMatchObject({
      ok: false,
      reason: "Requires an active Centre recherche IA."
    });
    expect(core.getSummary().research_queue).toEqual([]);
  });

  it("queues valid research in FIFO order and auto-starts the next item", async () => {
    const core = await createCore("research-fifo");
    await completeBuilding(core, "energy_research_center");

    expect(core.startResearch("batteries")).toEqual({ ok: true, reason: "" });
    expect(core.startResearch("offshore_wind")).toEqual({ ok: true, reason: "Queued." });
    expect(core.startResearch("smart_grids")).toEqual({ ok: true, reason: "Queued." });
    expect(core.getSummary().research_queue).toEqual(["offshore_wind", "smart_grids"]);

    await advanceUntilCompleted(core, "batteries");

    expect(core.getSummary().active_research_id).toBe("offshore_wind");
    expect(core.getSummary().research_queue).toEqual(["smart_grids"]);
  });

  it("removes and promotes queued research without cancelling the active item", async () => {
    const core = await createCore("research-reorder");
    await completeBuilding(core, "energy_research_center");

    expect(core.startResearch("batteries").ok).toBe(true);
    expect(core.startResearch("offshore_wind").ok).toBe(true);
    expect(core.startResearch("smart_grids").ok).toBe(true);

    expect(core.promoteQueuedResearch(1)).toEqual({ ok: true, reason: "" });
    expect(core.getSummary().active_research_id).toBe("batteries");
    expect(core.getSummary().research_queue).toEqual(["smart_grids", "offshore_wind"]);

    expect(core.removeQueuedResearch(0)).toEqual({ ok: true, reason: "" });
    expect(core.getSummary().active_research_id).toBe("batteries");
    expect(core.getSummary().research_queue).toEqual(["offshore_wind"]);
  });
});

async function completeBuilding(core: Awaited<ReturnType<typeof createCore>>, buildingId: string): Promise<void> {
  core.state.money = 10000;
  expect(core.requestBuilding("fr_nord", buildingId).ok).toBe(true);
  for (let index = 0; index < 8; index += 1) {
    core.advanceMonth();
  }
}

async function advanceUntilCompleted(
  core: Awaited<ReturnType<typeof createCore>>,
  technologyId: string
): Promise<void> {
  for (let index = 0; index < 36 && !core.getSummary().completed_technologies[technologyId]; index += 1) {
    core.advanceMonth();
  }
  expect(core.getSummary().completed_technologies[technologyId]).toBe(true);
}
