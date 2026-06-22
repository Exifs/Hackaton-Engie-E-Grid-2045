import type { HeatmapMode } from "../game/heatmap";
import type { GameSummary, RegionSnapshot } from "../sim";

export type OnboardingStatus = "idle" | "running" | "completed" | "skipped";

export interface OnboardingGameStateSnapshot {
  summary: GameSummary;
  regions: Record<string, RegionSnapshot>;
  currentOverlay: HeatmapMode;
}

export type OnboardingAction =
  | { type: "selectOverlay"; mode: HeatmapMode }
  | { type: "openConstruction"; category?: string }
  | { type: "openResearch" }
  | { type: "focusRegion"; regionId: string };

export interface OnboardingStep {
  id: string;
  title: string;
  body: string;
  consequence?: string;
  objective: string;
  target?: string;
  preferredOverlay?: HeatmapMode;
  checklist?: string[];
  enter?: OnboardingAction[];
  isCompleted: (state: OnboardingGameStateSnapshot) => boolean;
}

export interface OnboardingEvent {
  type: "building_queued" | "overlay_selected" | "region_selected" | "research_started" | "game_changed";
  buildingId?: string;
  overlay?: HeatmapMode;
  regionId?: string;
  researchId?: string;
}

export interface OnboardingViewModel {
  status: OnboardingStatus;
  step: OnboardingStep;
  stepIndex: number;
  totalSteps: number;
  currentComplete: boolean;
  mode: "instruction" | "consequence";
}

export interface OnboardingStepSnapshot {
  builtOrQueuedBuildings: Set<string>;
  activeOrQueuedResearch: Set<string>;
}
