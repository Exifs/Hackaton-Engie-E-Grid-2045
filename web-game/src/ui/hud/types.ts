import type { HeatmapMode } from "../../game/heatmap";
import type { BuildAvailability, ResearchOption } from "../../sim";

export interface HudCallbacks {
  onBuild: (buildingId: string) => void;
  onCancel: (queueIndex: number) => void;
  onDemolish: (buildingIndex: number) => void;
  onStartResearch: (technologyId: string) => void;
  onRemoveQueuedResearch: (queueIndex: number) => void;
  onPromoteQueuedResearch: (queueIndex: number) => void;
  onAdvance: () => void;
  onSpeed: (speed: number) => void;
  onSelectRegion: (regionId: string) => void;
  onHeatmap: (mode: HeatmapMode) => void;
  onReplayOnboarding: () => void;
}

export const CATEGORY_ORDER = ["energy", "compute", "cooling", "research", "grid", "storage"];
export const ALL_BUILD_CATEGORY = "all";
export const ALL_CATEGORIES_DESKTOP_QUERY = "(min-width: 1180px)";
export const BUILD_ACCESS_LOCK_CAUSES: Array<NonNullable<BuildAvailability["cause"]>> = [
  "technology",
  "region_tag",
  "region_potential"
];
export const RESEARCH_UNAVAILABLE_CAUSES: Array<NonNullable<ResearchOption["lock_cause"]>> = [
  "prerequisite",
  "building"
];

export const ALERT_LOCALIZATION_KEYS: Record<string, { title: string; body: string; action: string }> = {
  "blackout-severe": {
    title: "hud.alerts.titles.blackoutSevere",
    body: "hud.alerts.bodies.localEnergyDeficit",
    action: "hud.alerts.actions.buildLocalProduction"
  },
  "energy-deficit": {
    title: "hud.alerts.titles.energyDeficit",
    body: "hud.alerts.bodies.importsWeak",
    action: "hud.alerts.actions.buildNearbySurplus"
  },
  "cooling-insufficient": {
    title: "hud.alerts.titles.coolingInsufficient",
    body: "hud.alerts.bodies.coolingExceeded",
    action: "hud.alerts.actions.buildCooling"
  },
  "network-saturated": {
    title: "hud.alerts.titles.networkSaturated",
    body: "hud.alerts.bodies.highLossFlows",
    action: "hud.alerts.actions.spreadProduction"
  },
  "slots-saturated": {
    title: "hud.alerts.titles.slotsSaturated",
    body: "hud.alerts.bodies.regionalCapacityFull",
    action: "hud.alerts.actions.chooseAnotherRegion"
  },
  "researchers-insufficient": {
    title: "hud.alerts.titles.researchersInsufficient",
    body: "hud.alerts.bodies.needsExceedCapacity",
    action: "hud.alerts.actions.buildUniversities"
  },
  "co2-elevated": {
    title: "hud.alerts.titles.co2Elevated",
    body: "hud.alerts.bodies.fossilDependence",
    action: "hud.alerts.actions.shiftClean"
  },
  "usa-near-agi": {
    title: "hud.alerts.titles.usaNearAgi",
    body: "hud.alerts.bodies.usCurveAhead",
    action: "hud.alerts.actions.accelerateAi"
  }
};

export const EFFECT_VALUE_KEYS: Record<string, string> = {
  "income_bonus=30;energy_demand_pct=-10": "content.effectValues.income_bonus_30_energy_demand_pct_minus_10",
  "distance_efficiency_pct=15;volume_threshold_pct=25": "content.effectValues.distance_efficiency_pct_15_volume_threshold_pct_25",
  "cost_pct=-10;construction_pct=-10;output_pct=15": "content.effectValues.cost_pct_minus_10_construction_pct_minus_10_output_pct_15"
};

export const OVERVIEW_CONSTRUCTION_QUEUE_LIMIT = 2;
export const REGION_HISTORY_PERIODS = [6, 12, 24, 48] as const;
export const REGION_HISTORY_RESOURCES = ["energy", "cooling", "compute"] as const;

export type ResizeTarget = "dock" | "region";
export type DockTab = "construction" | "research";
export type RegionPanelTab = "overview" | "buildings" | "stats";
export type RegionHistoryPeriod = typeof REGION_HISTORY_PERIODS[number];
export type RegionHistoryResource = typeof REGION_HISTORY_RESOURCES[number];
export type QueueProgressItem = { building_id: string; months_remaining: number; total_months: number };
export type ProgressCssVar = "--progress" | "--research-progress";

export interface PendingProgressAnimation {
  key: string;
  cssVar: ProgressCssVar;
  target: number;
}
