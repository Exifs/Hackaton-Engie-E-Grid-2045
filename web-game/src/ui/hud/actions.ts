import type { HeatmapMode } from "../../game/heatmap";
import {
  REGION_HISTORY_PERIODS,
  REGION_HISTORY_RESOURCES,
  type RegionHistoryPeriod,
  type RegionHistoryResource,
  type RegionPanelTab
} from "./types";

export type HudAction =
  | { type: "dismiss-alert"; alertId: string }
  | { type: "palette-tab"; tab: "construction" | "research" }
  | { type: "region-tab"; tab: RegionPanelTab }
  | { type: "history-period"; period: RegionHistoryPeriod }
  | { type: "history-resource"; resource: RegionHistoryResource }
  | { type: "build-category"; category: string }
  | { type: "filter-toggle"; filter: "locked-buildings" | "unavailable-research" }
  | { type: "build"; buildingId: string }
  | { type: "promote-research"; queueIndex: number }
  | { type: "remove-research"; queueIndex: number }
  | { type: "start-research"; researchId: string }
  | { type: "cancel-construction"; queueIndex: number }
  | { type: "demolish-building"; buildingIndex: number }
  | { type: "select-region"; regionId: string }
  | { type: "speed"; speed: number }
  | { type: "heatmap"; mode: HeatmapMode }
  | { type: "command"; command: "advance" | "open-construction" | "toggle-palette" | "dismiss-all-alerts" | "replay-onboarding" };

export function parseHudButtonAction(button: HTMLButtonElement): HudAction | undefined {
  const dismissAlertId = button.dataset.dismissAlert;
  if (dismissAlertId) {
    return { type: "dismiss-alert", alertId: dismissAlertId };
  }

  const paletteTab = button.dataset.paletteTab;
  if (paletteTab === "construction" || paletteTab === "research") {
    return { type: "palette-tab", tab: paletteTab };
  }

  const regionTab = button.dataset.regionTab as RegionPanelTab | undefined;
  if (regionTab === "overview" || regionTab === "buildings" || regionTab === "stats") {
    return { type: "region-tab", tab: regionTab };
  }

  const historyPeriod = Number(button.dataset.historyPeriod);
  if (REGION_HISTORY_PERIODS.includes(historyPeriod as RegionHistoryPeriod)) {
    return { type: "history-period", period: historyPeriod as RegionHistoryPeriod };
  }

  const historyResource = button.dataset.historyResource as RegionHistoryResource | undefined;
  if (historyResource && REGION_HISTORY_RESOURCES.includes(historyResource)) {
    return { type: "history-resource", resource: historyResource };
  }

  const buildCategory = button.dataset.buildCategory ?? button.dataset.buildCategoryTitle;
  if (buildCategory) {
    return { type: "build-category", category: buildCategory };
  }

  const filterToggle = button.dataset.filterToggle;
  if (filterToggle === "locked-buildings" || filterToggle === "unavailable-research") {
    return { type: "filter-toggle", filter: filterToggle };
  }

  const buildId = button.dataset.build;
  if (buildId) {
    return { type: "build", buildingId: buildId };
  }

  const promoteResearch = button.dataset.promoteResearch;
  if (promoteResearch !== undefined) {
    return { type: "promote-research", queueIndex: Number(promoteResearch) };
  }

  const removeResearch = button.dataset.removeResearch;
  if (removeResearch !== undefined) {
    return { type: "remove-research", queueIndex: Number(removeResearch) };
  }

  const researchId = button.dataset.research;
  if (researchId) {
    return { type: "start-research", researchId };
  }

  const cancelIndex = button.dataset.cancel;
  if (cancelIndex !== undefined) {
    return { type: "cancel-construction", queueIndex: Number(cancelIndex) };
  }

  const demolishIndex = button.dataset.demolish;
  if (demolishIndex !== undefined) {
    return { type: "demolish-building", buildingIndex: Number(demolishIndex) };
  }

  const regionId = button.dataset.region;
  if (regionId) {
    return { type: "select-region", regionId };
  }

  const speed = button.dataset.speed;
  if (speed !== undefined) {
    return { type: "speed", speed: Number(speed) };
  }

  const heatmap = button.dataset.heatmap as HeatmapMode | undefined;
  if (heatmap) {
    return { type: "heatmap", mode: heatmap };
  }

  const command = button.dataset.action;
  if (
    command === "advance" ||
    command === "open-construction" ||
    command === "toggle-palette" ||
    command === "dismiss-all-alerts" ||
    command === "replay-onboarding"
  ) {
    return { type: "command", command };
  }

  return undefined;
}
