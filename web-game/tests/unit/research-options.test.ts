import { buildResearchOptions } from "../../src/sim/researchOptions";
import type { TechnologyDefinition } from "../../src/sim";

function technology(overrides: Partial<TechnologyDefinition> & Pick<TechnologyDefinition, "id">): TechnologyDefinition {
  return {
    id: overrides.id,
    display_name: overrides.display_name ?? overrides.id,
    branch: overrides.branch ?? "energy",
    tier: overrides.tier ?? 1,
    cost: overrides.cost ?? 100,
    research_months: overrides.research_months ?? 0,
    prereq_technology_ids: overrides.prereq_technology_ids ?? [],
    unlocks: overrides.unlocks ?? [],
    effect_key: overrides.effect_key ?? "",
    effect_value: overrides.effect_value ?? "",
    effect_value_pct: overrides.effect_value_pct ?? 0,
    notes: overrides.notes ?? ""
  };
}

describe("research option builder", () => {
  it("builds sorted research states without SimulationCore", () => {
    const technologies = {
      active: technology({ id: "active", display_name: "Active Tech", tier: 2, cost: 100 }),
      complete: technology({ id: "complete", display_name: "Complete Tech", tier: 1, cost: 50 }),
      queued: technology({ id: "queued", display_name: "Queued Tech", tier: 2, cost: 80 }),
      prereqLocked: technology({
        id: "prereqLocked",
        display_name: "Prereq Locked",
        tier: 3,
        cost: 75,
        prereq_technology_ids: ["missing"]
      }),
      buildingLocked: technology({ id: "buildingLocked", display_name: "Building Locked", tier: 3, cost: 90 })
    };

    const options = buildResearchOptions({
      technologies,
      state: {
        active_research_id: "active",
        active_research_points: 25,
        completed_technologies: { complete: true },
        research_queue: ["queued"]
      },
      currentTechnologyPointRate: (technologyId) => (technologyId === "active" ? 10 : 0),
      researchBuildingRequirement: (tech) =>
        tech.id === "buildingLocked"
          ? { ok: false, reason: "Requires a lab.", cause: "building" }
          : { ok: true, reason: "" }
    });

    expect(options.map((option) => option.id)).toEqual(["complete", "queued", "active", "prereqLocked", "buildingLocked"]);
    expect(options.find((option) => option.id === "complete")).toMatchObject({
      status: "completed",
      progress: 1,
      current_points: 50
    });
    expect(options.find((option) => option.id === "active")).toMatchObject({
      status: "active",
      progress: 0.25,
      estimated_months_remaining: 8,
      monthly_points: 10
    });
    expect(options.find((option) => option.id === "queued")).toMatchObject({
      status: "queued",
      queue_position: 1,
      reason: "File #1."
    });
    expect(options.find((option) => option.id === "prereqLocked")).toMatchObject({
      status: "locked",
      lock_cause: "prerequisite",
      reason: "Requires missing."
    });
    expect(options.find((option) => option.id === "buildingLocked")).toMatchObject({
      status: "locked",
      lock_cause: "building",
      reason: "Requires a lab."
    });
  });
});
