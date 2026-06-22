import type { HudAction } from "./actions";
import type { RegionHistoryPeriod, RegionHistoryResource, RegionPanelTab } from "./types";

interface HudActionHandlers {
  dismissAlert: (alertId: string) => void;
  setPaletteTab: (tab: "construction" | "research") => void;
  setRegionTab: (tab: RegionPanelTab) => void;
  setHistoryPeriod: (period: RegionHistoryPeriod) => void;
  setHistoryResource: (resource: RegionHistoryResource) => void;
  setBuildCategory: (category: string) => void;
  toggleFilter: (filter: "locked-buildings" | "unavailable-research") => void;
  build: (buildingId: string) => void;
  promoteResearch: (queueIndex: number) => void;
  removeResearch: (queueIndex: number) => void;
  startResearch: (researchId: string) => void;
  cancelConstruction: (queueIndex: number) => void;
  demolishBuilding: (buildingIndex: number) => void;
  selectRegion: (regionId: string) => void;
  setSpeed: (speed: number) => void;
  setHeatmap: (mode: HudAction & { type: "heatmap" }) => void;
  advance: () => void;
  openConstruction: () => void;
  togglePalette: () => void;
  dismissAllAlerts: () => void;
  replayOnboarding: () => void;
}

export class HudActionDispatcher {
  constructor(private readonly handlers: HudActionHandlers) {}

  dispatch(action: HudAction): void {
    switch (action.type) {
      case "dismiss-alert":
        this.handlers.dismissAlert(action.alertId);
        return;
      case "palette-tab":
        this.handlers.setPaletteTab(action.tab);
        return;
      case "region-tab":
        this.handlers.setRegionTab(action.tab);
        return;
      case "history-period":
        this.handlers.setHistoryPeriod(action.period);
        return;
      case "history-resource":
        this.handlers.setHistoryResource(action.resource);
        return;
      case "build-category":
        this.handlers.setBuildCategory(action.category);
        return;
      case "filter-toggle":
        this.handlers.toggleFilter(action.filter);
        return;
      case "build":
        this.handlers.build(action.buildingId);
        return;
      case "promote-research":
        this.handlers.promoteResearch(action.queueIndex);
        return;
      case "remove-research":
        this.handlers.removeResearch(action.queueIndex);
        return;
      case "start-research":
        this.handlers.startResearch(action.researchId);
        return;
      case "cancel-construction":
        this.handlers.cancelConstruction(action.queueIndex);
        return;
      case "demolish-building":
        this.handlers.demolishBuilding(action.buildingIndex);
        return;
      case "select-region":
        this.handlers.selectRegion(action.regionId);
        return;
      case "speed":
        this.handlers.setSpeed(action.speed);
        return;
      case "heatmap":
        this.handlers.setHeatmap(action);
        return;
      case "command":
        this.dispatchCommand(action.command);
        return;
    }
  }

  private dispatchCommand(
    command: "advance" | "open-construction" | "toggle-palette" | "dismiss-all-alerts" | "replay-onboarding"
  ): void {
    if (command === "advance") {
      this.handlers.advance();
    } else if (command === "open-construction") {
      this.handlers.openConstruction();
    } else if (command === "toggle-palette") {
      this.handlers.togglePalette();
    } else if (command === "dismiss-all-alerts") {
      this.handlers.dismissAllAlerts();
    } else if (command === "replay-onboarding") {
      this.handlers.replayOnboarding();
    }
  }
}
