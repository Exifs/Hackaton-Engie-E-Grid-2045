import { clamp } from "./math";
import type { ResearchOption, ResearchStartResult, TechnologyDefinition } from "./types";

interface ResearchOptionsState {
  active_research_id: string;
  active_research_points: number;
  completed_technologies: Record<string, true>;
  research_queue: string[];
}

interface BuildResearchOptionsInput {
  technologies: Record<string, TechnologyDefinition>;
  state: ResearchOptionsState;
  currentTechnologyPointRate: (technologyId: string) => number;
  researchBuildingRequirement: (technology: TechnologyDefinition) => ResearchStartResult;
}

export function buildResearchOptions({
  technologies,
  state,
  currentTechnologyPointRate,
  researchBuildingRequirement
}: BuildResearchOptionsInput): ResearchOption[] {
  return Object.values(technologies)
    .map((technology) => {
      const missingPrereq = technology.prereq_technology_ids.find((prereq) => !state.completed_technologies[prereq]);
      const isCompleted = Boolean(state.completed_technologies[technology.id]);
      const isActive = state.active_research_id === technology.id;
      const queueIndex = state.research_queue.indexOf(technology.id);
      const isQueued = queueIndex >= 0;
      const currentPoints = isActive ? state.active_research_points : isCompleted ? technology.cost : 0;
      const monthlyPoints = currentTechnologyPointRate(technology.id);
      const progress = isActive ? clamp(currentPoints / Math.max(technology.cost, 1), 0, 1) : isCompleted ? 1 : 0;
      const remainingPoints = Math.max(technology.cost - currentPoints, 0);
      const estimatedMonths = monthlyPoints > 0 ? Math.ceil(remainingPoints / monthlyPoints) : Number.POSITIVE_INFINITY;
      let status: ResearchOption["status"] = "available";
      let reason = state.active_research_id ? "Add to the research queue." : "Ready to launch.";
      let lockCause: ResearchOption["lock_cause"];
      const buildingRequirement = researchBuildingRequirement(technology);

      if (isCompleted) {
        status = "completed";
        reason = "Completed.";
      } else if (isActive) {
        status = "active";
        reason = monthlyPoints > 0 ? "Research in progress." : `Rate 0: ${buildingRequirement.reason || "research output unavailable."}`;
      } else if (isQueued) {
        status = "queued";
        reason = `File #${queueIndex + 1}.`;
      } else if (missingPrereq) {
        status = "locked";
        reason = `Requires ${technologies[missingPrereq]?.display_name ?? missingPrereq}.`;
        lockCause = "prerequisite";
      } else if (!buildingRequirement.ok) {
        status = "locked";
        reason = buildingRequirement.reason;
        lockCause = buildingRequirement.cause ?? "building";
      }

      return {
        id: technology.id,
        display_name: technology.display_name,
        branch: technology.branch,
        tier: technology.tier,
        cost: technology.cost,
        progress,
        estimated_months_remaining: estimatedMonths,
        prereq_technology_ids: [...technology.prereq_technology_ids],
        unlocks: [...technology.unlocks],
        effect_key: technology.effect_key,
        effect_value: technology.effect_value,
        effect_value_pct: technology.effect_value_pct,
        notes: technology.notes,
        status,
        reason,
        lock_cause: lockCause,
        current_points: currentPoints,
        monthly_points: monthlyPoints,
        queue_position: isQueued ? queueIndex + 1 : 0
      };
    })
    .sort((a, b) => (a.tier === b.tier ? a.cost - b.cost : a.tier - b.tier));
}
