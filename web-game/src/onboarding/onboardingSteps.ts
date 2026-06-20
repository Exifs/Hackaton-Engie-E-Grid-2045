import { ONBOARDING_COPY } from "./onboardingCopy";
import type { OnboardingGameStateSnapshot, OnboardingStep, OnboardingStepSnapshot } from "./types";

const STARTER_ENERGY_BUILDINGS = ["gas_power_plant", "solar_farm", "wind_onshore"];
const COOLING_BUILDINGS = ["air_cooling", "river_cooling", "sea_cooling", "geothermal_cooling"];
const RESEARCH_BUILDINGS = ["ai_research_center", "energy_research_center"];

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "mission",
    target: "kpi.agi",
    ...ONBOARDING_COPY.mission,
    checklist: ["Comprendre la course Europe / USA"],
    isCompleted: () => false
  },
  {
    id: "resources",
    target: "kpi.energy",
    ...ONBOARDING_COPY.resources,
    checklist: ["Identifier les KPI critiques"],
    isCompleted: () => false
  },
  {
    id: "university",
    target: "build.university",
    ...ONBOARDING_COPY.university,
    checklist: ["Construire une universite"],
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
    checklist: ["Activer l'overlay Froid"],
    isCompleted: (state) => state.currentOverlay === "cooling"
  },
  {
    id: "starter-energy",
    target: "build.gas_power_plant",
    preferredOverlay: "energy",
    ...ONBOARDING_COPY.starterEnergy,
    checklist: ["Construire une production electrique"],
    enter: [
      { type: "selectOverlay", mode: "energy" },
      { type: "openConstruction", category: "energy" }
    ],
    isCompleted: (state) => hasAnyBuilding(state, STARTER_ENERGY_BUILDINGS)
  },
  {
    id: "cooling-build",
    target: "build.air_cooling",
    preferredOverlay: "cooling",
    ...ONBOARDING_COPY.coolingBuild,
    checklist: ["Construire du refroidissement"],
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
    checklist: ["Construire un datacenter standard"],
    enter: [{ type: "openConstruction", category: "compute" }],
    isCompleted: (state) => hasAnyBuilding(state, ["datacenter_standard"])
  },
  {
    id: "research",
    target: "build.ai_research_center",
    ...ONBOARDING_COPY.research,
    checklist: ["Construire un centre de recherche ou lancer une recherche"],
    enter: [{ type: "openConstruction", category: "research" }],
    isCompleted: (state) => hasAnyBuilding(state, RESEARCH_BUILDINGS) || hasActiveOrQueuedResearch(state)
  },
  {
    id: "network-overlay",
    target: "overlay.network",
    preferredOverlay: "network",
    ...ONBOARDING_COPY.networkOverlay,
    checklist: ["Activer l'overlay Reseau ou Energie"],
    enter: [{ type: "selectOverlay", mode: "network" }],
    isCompleted: (state) => state.currentOverlay === "network" || state.currentOverlay === "energy"
  },
  {
    id: "complete",
    target: "alerts.panel",
    ...ONBOARDING_COPY.complete,
    checklist: ["Continuer en autonomie"],
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
