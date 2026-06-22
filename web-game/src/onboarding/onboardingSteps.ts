import { t } from "../i18n";
import { ONBOARDING_COPY } from "./onboardingCopy";
import type { OnboardingGameStateSnapshot, OnboardingStep, OnboardingStepSnapshot } from "./types";

const STARTER_ENERGY_BUILDINGS = ["gas_power_plant", "solar_farm", "wind_onshore"];
const COOLING_BUILDINGS = ["air_cooling", "river_cooling", "sea_cooling", "geothermal_cooling"];

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "mission",
    target: "kpi.agi",
    ...ONBOARDING_COPY.mission,
    checklist: [t("onboarding.mission.checklist")],
    isCompleted: () => false
  },
  {
    id: "resources",
    target: "kpi.resources",
    ...ONBOARDING_COPY.resources,
    checklist: [t("onboarding.resources.checklist")],
    isCompleted: () => false
  },
  {
    id: "university",
    target: "build.university",
    ...ONBOARDING_COPY.university,
    checklist: [t("onboarding.university.checklist")],
    enter: [
      { type: "focusRegion", regionId: "fr_nord" },
      { type: "openConstruction", category: "research" }
    ],
    isCompleted: (state) => hasAnyBuilding(state, ["university"])
  },
  {
    id: "cooling-overlay",
    target: "overlay.cooling",
    preferredOverlay: "cooling",
    ...ONBOARDING_COPY.coolingOverlay,
    checklist: [t("onboarding.coolingOverlay.checklist")],
    isCompleted: (state) => state.currentOverlay === "cooling"
  },
  {
    id: "starter-energy",
    target: "build.category.energy.items",
    preferredOverlay: "energy",
    ...ONBOARDING_COPY.starterEnergy,
    checklist: [t("onboarding.starterEnergy.checklist")],
    enter: [
      { type: "selectOverlay", mode: "energy" },
      { type: "openConstruction", category: "energy" }
    ],
    isCompleted: (state) => hasAnyBuilding(state, STARTER_ENERGY_BUILDINGS)
  },
  {
    id: "cooling-build",
    target: "build.category.cooling.items",
    preferredOverlay: "cooling",
    ...ONBOARDING_COPY.coolingBuild,
    checklist: [t("onboarding.coolingBuild.checklist")],
    enter: [
      { type: "selectOverlay", mode: "cooling" },
      { type: "openConstruction", category: "cooling" }
    ],
    isCompleted: (state) => hasAnyBuilding(state, COOLING_BUILDINGS)
  },
  {
    id: "datacenter",
    target: "build.datacenter_standard",
    preferredOverlay: "cooling",
    ...ONBOARDING_COPY.datacenter,
    checklist: [t("onboarding.datacenter.checklist")],
    enter: [{ type: "openConstruction", category: "compute" }],
    isCompleted: (state) => hasAnyBuilding(state, ["datacenter_standard"])
  },
  {
    id: "research",
    target: "build.ai_research_center",
    ...ONBOARDING_COPY.research,
    checklist: [t("onboarding.research.checklist")],
    enter: [{ type: "openConstruction", category: "research" }],
    isCompleted: (state) => hasAnyBuilding(state, ["ai_research_center"])
  },
  {
    id: "energy-research",
    target: "build.energy_research_center",
    ...ONBOARDING_COPY.energyResearch,
    checklist: [t("onboarding.energyResearch.checklist")],
    enter: [{ type: "openConstruction", category: "research" }],
    isCompleted: (state) => hasAnyBuilding(state, ["energy_research_center"])
  },
  {
    id: "network-overlay",
    target: "overlay.network",
    preferredOverlay: "network",
    ...ONBOARDING_COPY.networkOverlay,
    checklist: [t("onboarding.networkOverlay.checklist")],
    enter: [{ type: "selectOverlay", mode: "network" }],
    isCompleted: (state) => state.currentOverlay === "network" || state.currentOverlay === "energy"
  },
  {
    id: "complete",
    target: "alerts.panel",
    ...ONBOARDING_COPY.complete,
    checklist: [t("onboarding.complete.checklist")],
    isCompleted: () => false
  }
];

export function buildStepSnapshot(state: OnboardingGameStateSnapshot): OnboardingStepSnapshot {
  const builtOrQueuedBuildings = new Set<string>();
  const activeOrQueuedResearch = new Set<string>();

  for (const region of Object.values(state.regions)) {
    for (const buildingId of region.buildings) {
      builtOrQueuedBuildings.add(buildingId);
    }
    for (const item of region.construction_queue) {
      builtOrQueuedBuildings.add(item.building_id);
    }
  }

  if (state.summary.active_research_id) {
    activeOrQueuedResearch.add(state.summary.active_research_id);
  }
  for (const researchId of state.summary.research_queue) {
    activeOrQueuedResearch.add(researchId);
  }

  return { builtOrQueuedBuildings, activeOrQueuedResearch };
}

export function hasAnyBuilding(state: OnboardingGameStateSnapshot, buildingIds: string[]): boolean {
  const snapshot = buildStepSnapshot(state);
  return buildingIds.some((buildingId) => snapshot.builtOrQueuedBuildings.has(buildingId));
}

export function hasActiveOrQueuedResearch(state: OnboardingGameStateSnapshot): boolean {
  return buildStepSnapshot(state).activeOrQueuedResearch.size > 0;
}
