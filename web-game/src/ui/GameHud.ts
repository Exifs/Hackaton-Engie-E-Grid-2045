import type { HeatmapMode } from "../game/heatmap";
import { t } from "../i18n";
import type { Alert, BuildAvailability, BuildingDefinition, RegionSnapshot, ResearchOption, SimulationCore } from "../sim";
import {
  escapeHtml,
  fmt
} from "./hud/format";
import {
  localizedBuildingDescription,
  localizedBuildingName,
  localizedPotential,
  localizedRegionTags,
  localizedResearchNotes,
  localizedTechnologyName,
  regionName
} from "./hud/localization";
import { renderGridOverviewCard } from "./hud/gridOverview";
import { HudPanelResizeController } from "./hud/panelResize";
import {
  activeResearchProgressKey,
  queueProgressKey,
  researchCardProgressKey,
  visualQueueProgress,
  visualResearchPoints,
  visualResearchProgress
} from "./hud/progress";
import { HudProgressAnimator } from "./hud/progressAnimator";
import { parseHudButtonAction } from "./hud/actions";
import { HudActionDispatcher } from "./hud/actionDispatcher";
import { AlertVisibilityController } from "./hud/alertVisibility";
import { renderAlertsPanel } from "./hud/alertsPanel";
import { renderConstructionDock } from "./hud/constructionDock";
import { renderConstructionPanelContent, shouldShowBuilding } from "./hud/constructionPanelContent";
import { renderRegionPanelContent } from "./hud/regionPanelContent";
import { renderRegionPanelShell } from "./hud/regionPanel";
import { renderBuiltCard, renderDemolitionCard, renderQueueCard } from "./hud/regionCards";
import {
  localizedResearchReason,
  renderResearchPanelContent,
  researchBranchTierLabel,
  researchEffect,
  researchEta
} from "./hud/researchPanelContent";
import { renderHeatmapSwitch, renderTopBar } from "./hud/topBar";
import { TooltipController } from "./hud/tooltipController";
import { PaletteScrollMemory } from "./hud/paletteScroll";
import { handleHudWheel } from "./hud/wheelScroll";
import {
  ALL_BUILD_CATEGORY,
  type HudCallbacks,
  type RegionHistoryPeriod,
  type RegionHistoryResource,
  type RegionPanelTab
} from "./hud/types";

export class GameHud {
  private readonly root: HTMLElement;
  private readonly simulation: SimulationCore;
  private readonly callbacks: HudCallbacks;
  private heatmapMode: HeatmapMode = "energy";
  private paletteOpen = !window.matchMedia("(max-width: 720px)").matches;
  private activeDockTab: "construction" | "research" = "construction";
  private activeRegionTab: RegionPanelTab = "overview";
  private activeRegionHistoryPeriod: RegionHistoryPeriod = 12;
  private activeRegionHistoryResource: RegionHistoryResource = "energy";
  private activeBuildCategory = ALL_BUILD_CATEGORY;
  private showLockedBuildings = false;
  private showUnavailableResearch = false;
  private readonly progressAnimator: HudProgressAnimator;
  private readonly tooltipController: TooltipController;
  private readonly alertVisibility: AlertVisibilityController;
  private readonly panelResize: HudPanelResizeController;
  private readonly paletteScroll: PaletteScrollMemory;
  private readonly actionDispatcher: HudActionDispatcher;

  constructor(root: HTMLElement, simulation: SimulationCore, callbacks: HudCallbacks) {
    this.root = root;
    this.simulation = simulation;
    this.callbacks = callbacks;
    this.progressAnimator = new HudProgressAnimator(this.root);
    this.alertVisibility = new AlertVisibilityController(() => this.render());
    this.paletteScroll = new PaletteScrollMemory(this.root, () => this.activeDockTab);
    this.panelResize = new HudPanelResizeController(
      this.root,
      () => this.paletteOpen,
      () => this.render()
    );
    this.actionDispatcher = new HudActionDispatcher({
      dismissAlert: (alertId) => this.alertVisibility.dismiss(alertId),
      setPaletteTab: (tab) => {
        this.capturePaletteScroll();
        this.activeDockTab = tab;
        this.paletteOpen = true;
        this.render();
      },
      setRegionTab: (tab) => {
        this.activeRegionTab = tab;
        this.tooltipController.suppress(500);
        this.render();
      },
      setHistoryPeriod: (period) => {
        this.activeRegionHistoryPeriod = period;
        this.tooltipController.suppress(500);
        this.render();
      },
      setHistoryResource: (resource) => {
        this.activeRegionHistoryResource = resource;
        this.tooltipController.suppress(500);
        this.render();
      },
      setBuildCategory: (category) => {
        this.activeBuildCategory = category;
        this.capturePaletteScroll();
        this.render();
      },
      toggleFilter: (filter) => {
        if (filter === "locked-buildings") {
          this.showLockedBuildings = !this.showLockedBuildings;
        } else {
          this.showUnavailableResearch = !this.showUnavailableResearch;
        }
        this.capturePaletteScroll();
        this.render();
      },
      build: (buildingId) => this.callbacks.onBuild(buildingId),
      promoteResearch: (queueIndex) => this.callbacks.onPromoteQueuedResearch(queueIndex),
      removeResearch: (queueIndex) => this.callbacks.onRemoveQueuedResearch(queueIndex),
      startResearch: (researchId) => this.callbacks.onStartResearch(researchId),
      cancelConstruction: (queueIndex) => this.callbacks.onCancel(queueIndex),
      demolishBuilding: (buildingIndex) => this.callbacks.onDemolish(buildingIndex),
      selectRegion: (regionId) => this.callbacks.onSelectRegion(regionId),
      setSpeed: (speed) => this.callbacks.onSpeed(speed),
      setHeatmap: ({ mode }) => {
        this.heatmapMode = mode;
        this.callbacks.onHeatmap(mode);
        this.render();
      },
      advance: () => this.callbacks.onAdvance(),
      openConstruction: () => {
        this.paletteOpen = true;
        this.activeDockTab = "construction";
        this.render();
      },
      togglePalette: () => {
        this.paletteOpen = !this.paletteOpen;
        this.render();
      },
      dismissAllAlerts: () => {
        for (const alert of this.simulation.getSummary().alerts) {
          this.alertVisibility.dismiss(alert.id);
        }
      },
      replayOnboarding: () => this.callbacks.onReplayOnboarding()
    });
    this.tooltipController = new TooltipController(this.root, {
      simulation: this.simulation,
      localizedBuildingDescription: (building) => localizedBuildingDescription(building),
      localizedBuildingName: (building, fallbackId = "") => localizedBuildingName(building, fallbackId),
      localizedPotential: (potential) => localizedPotential(potential),
      localizedRegionTags: (tags, limit) => localizedRegionTags(tags, limit),
      localizedResearchNotes: (option) => localizedResearchNotes(option),
      localizedResearchReason: (option) => localizedResearchReason(option),
      localizedTechnologyName: (technologyId) => localizedTechnologyName(technologyId),
      researchBranchTierLabel: (option) => researchBranchTierLabel(option),
      researchEffect: (option) => researchEffect(option),
      researchEta: (option) => researchEta(option)
    });
    this.root.addEventListener("click", (event) => this.handleClick(event));
    this.root.addEventListener("pointerdown", (event) => this.handlePointerDown(event));
    this.root.addEventListener("pointerover", (event) => this.tooltipController.handlePointerOver(event));
    this.root.addEventListener("pointermove", (event) => this.tooltipController.handlePointerMove(event));
    this.root.addEventListener("pointerout", (event) => this.tooltipController.handlePointerOut(event));
    this.root.addEventListener("focusin", (event) => this.tooltipController.handleFocus(event));
    this.root.addEventListener("focusout", () => this.tooltipController.hide());
    this.root.addEventListener("dblclick", (event) => this.handleDoubleClick(event));
    this.root.addEventListener("wheel", (event) => this.handleWheel(event), { passive: false });
    window.addEventListener("resize", () => this.handleViewportResize());
  }

  render(): void {
    this.capturePaletteScroll();
    this.progressAnimator.captureFromDom();
    this.progressAnimator.resetPending();
    const summary = this.simulation.getSummary();
    const selectedRegion = this.simulation.getRegionSnapshot();
    const buildings = this.simulation.getBuildingDefinitions();
    const availability = this.simulation.getBuildAvailability();
    const researchOptions = this.simulation.getResearchOptions();
    const alerts = this.alertVisibility.visibleAlerts(summary.alerts);
    const monthProgress = summary.month_progress ?? 0;
    this.ensureActiveBuildCategory(buildings);
    this.applyPanelSizing();
    const renderContext = {
      heatmapMode: this.heatmapMode,
      activeDockTab: this.activeDockTab,
      tooltipAttrs: (title: string, body: string, meta = "") => this.tooltipAttrs(title, body, meta)
    };

    this.root.innerHTML = `
      ${renderTopBar(summary, renderContext)}

      ${renderHeatmapSwitch(renderContext)}

      ${renderAlertsPanel(alerts, {
        alertFirstSeen: this.alertVisibility.firstSeen,
        localizedAlertRegionName: (alert, fallback = "") => this.localizedAlertRegionName(alert, fallback),
        tooltipAttrs: renderContext.tooltipAttrs
      })}

      ${renderRegionPanelShell({
        selectedRegion,
        buildings,
        monthProgress,
        renderRegionPanel: (region, allBuildings, progress) => this.regionPanel(region, allBuildings, progress)
      })}

      ${renderConstructionDock({
        paletteOpen: this.paletteOpen,
        activeDockTab: this.activeDockTab,
        filterToggleMarkup: this.activeDockFilterToggle(),
        bodyMarkup: this.activeDockTab === "construction"
          ? this.constructionPanel(buildings, availability)
          : this.researchPanel(researchOptions, buildings, monthProgress),
        gridOverviewMarkup: renderGridOverviewCard(summary, this.simulation, renderContext.tooltipAttrs),
        renderContext
      })}
    `;
    this.restorePaletteScroll();
    this.progressAnimator.applyPending();
  }

  updateVisualProgress(monthProgressOverride?: number): void {
    const summary = this.simulation.getSummary();
    const monthProgress = monthProgressOverride ?? summary.month_progress ?? 0;
    const selectedRegion = this.simulation.getRegionSnapshot();
    if (selectedRegion) {
      selectedRegion.construction_queue.forEach((item, index) => {
        this.progressAnimator.patchValue(
          queueProgressKey("construction", selectedRegion.id, index, item),
          visualQueueProgress(item, monthProgress),
          "--progress"
        );
      });
      selectedRegion.deconstruction_queue.forEach((item, index) => {
        this.progressAnimator.patchValue(
          queueProgressKey("demolition", selectedRegion.id, index, item),
          visualQueueProgress(item, monthProgress),
          "--progress"
        );
      });
    }

    const researchOptions = this.simulation.getResearchOptions();
    const active = researchOptions.find((option) => option.status === "active");
    if (active) {
      const activeProgress = visualResearchProgress(active, monthProgress);
      const activePoints = visualResearchPoints(active, monthProgress);
      const activeKey = activeResearchProgressKey(active);
      this.progressAnimator.patchValue(activeKey, activeProgress, "--research-progress");
      const activeElement = this.progressAnimator.findElement(activeKey);
      const activeCopy = activeElement?.querySelector<HTMLElement>("[data-research-active-copy]");
      if (activeCopy) {
        activeCopy.textContent =
          `${fmt(activeProgress)}% - ${fmt(activePoints)}/${fmt(active.cost)} ${t("common.units.points")} - ` +
          `${t("hud.researchPanel.etaShort")} ${researchEta(active)} - +${fmt(active.monthly_points)} ${t("common.units.points")}/${t("hud.kpi.monthSuffix")}`;
      }
    }

    for (const option of researchOptions) {
      this.progressAnimator.patchValue(
        researchCardProgressKey(option),
        visualResearchProgress(option, monthProgress),
        "--progress"
      );
    }
  }

  setHeatmapMode(mode: HeatmapMode): void {
    this.heatmapMode = mode;
  }

  openConstructionCategory(category = ALL_BUILD_CATEGORY): void {
    this.capturePaletteScroll();
    this.paletteOpen = true;
    this.activeDockTab = "construction";
    this.activeBuildCategory = category;
    this.render();
  }

  openResearchPanel(): void {
    this.capturePaletteScroll();
    this.paletteOpen = true;
    this.activeDockTab = "research";
    this.render();
  }

  private localizedAlertRegionName(alert: Alert, fallback = ""): string {
    if (alert.region_id) {
      const region = this.simulation.getRegionSnapshot(alert.region_id);
      return region ? regionName(region) : fallback;
    }
    if (fallback === "Europe") {
      return t("hud.agi.europe");
    }
    if (fallback === "Global") {
      return t("hud.alerts.global");
    }
    return fallback;
  }

  private regionPanel(region: RegionSnapshot, buildings: Record<string, BuildingDefinition>, monthProgress: number): string {
    return renderRegionPanelContent({
      region,
      buildings,
      monthProgress,
      activeRegionTab: this.activeRegionTab,
      activeRegionHistoryPeriod: this.activeRegionHistoryPeriod,
      activeRegionHistoryResource: this.activeRegionHistoryResource,
      tooltipAttrs: (title, body, meta = "") => this.tooltipAttrs(title, body, meta),
      queueCard: (regionId, item, index, building, progress) => renderQueueCard({
        regionId,
        item,
        index,
        building,
        monthProgress: progress,
        renderProgressValue: (key, target, cssVar) => this.progressAnimator.renderValue(key, target, cssVar)
      }),
      demolitionCard: (regionId, item, index, building, progress) => renderDemolitionCard({
        regionId,
        item,
        index,
        building,
        monthProgress: progress,
        renderProgressValue: (key, target, cssVar) => this.progressAnimator.renderValue(key, target, cssVar)
      }),
      builtCard: (buildingId, building, index) => renderBuiltCard({
        buildingId,
        building,
        index,
        tooltipAttrs: (title, body, meta = "") => this.tooltipAttrs(title, body, meta)
      })
    });
  }

  private constructionPanel(
    buildings: Record<string, BuildingDefinition>,
    availability: Record<string, BuildAvailability>
  ): string {
    return renderConstructionPanelContent({
      buildings,
      availability,
      activeBuildCategory: this.activeBuildCategory,
      showLockedBuildings: this.showLockedBuildings,
      tooltipAttrs: (title, body, meta = "") => this.tooltipAttrs(title, body, meta)
    });
  }

  private ensureActiveBuildCategory(buildings: Record<string, BuildingDefinition>): void {
    if (this.activeBuildCategory === ALL_BUILD_CATEGORY) {
      return;
    }
    const hasCategory = Object.values(buildings).some((building) =>
      building.category === this.activeBuildCategory && shouldShowBuilding(this.simulation.getBuildAvailability()[building.id], this.showLockedBuildings)
    );
    if (!hasCategory) {
      this.activeBuildCategory = ALL_BUILD_CATEGORY;
    }
  }
  private tooltipAttrs(title: string, body: string, meta = ""): string {
    return `data-rich-tooltip="1" data-tooltip-title="${escapeHtml(title)}" data-tooltip-body="${escapeHtml(body)}" data-tooltip-meta="${escapeHtml(meta)}"`;
  }

  private activeDockFilterToggle(): string {
    if (this.activeDockTab === "construction") {
      return this.filterToggle("locked-buildings", t("hud.construction.showLocked"), this.showLockedBuildings);
    }
    return this.filterToggle("unavailable-research", t("hud.researchPanel.showUnavailable"), this.showUnavailableResearch);
  }

  private filterToggle(id: "locked-buildings" | "unavailable-research", label: string, checked: boolean): string {
    const body = id === "locked-buildings"
      ? t("hud.construction.showLockedBody")
      : t("hud.researchPanel.showUnavailableBody");
    const meta = checked ? t("hud.construction.filterActive") : t("hud.construction.filterInactive");
    return `
      <button class="dock-filter-toggle ${checked ? "is-active" : ""}" type="button" data-filter-toggle="${id}" aria-pressed="${checked}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" ${this.tooltipAttrs(label, body, meta)}>
        <span aria-hidden="true"></span>
        <strong>${escapeHtml(label)}</strong>
      </button>
    `;
  }

  private researchPanel(
    options: ResearchOption[],
    buildings: Record<string, BuildingDefinition>,
    monthProgress: number
  ): string {
    return renderResearchPanelContent({
      options,
      buildings,
      monthProgress,
      showUnavailableResearch: this.showUnavailableResearch,
      renderProgressValue: (key, target, cssVar) => this.progressAnimator.renderValue(key, target, cssVar),
      tooltipAttrs: (title, body, meta = "") => this.tooltipAttrs(title, body, meta)
    });
  }
  private handleWheel(event: WheelEvent): void {
    handleHudWheel(this.root, event);
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    const button = target.closest("button") as HTMLButtonElement | null;
    if (!button) {
      return;
    }

    const hudAction = parseHudButtonAction(button);
    if (!hudAction) {
      return;
    }

    this.actionDispatcher.dispatch(hudAction);
  }

  private capturePaletteScroll(): void {
    this.paletteScroll.capture();
  }

  private restorePaletteScroll(): void {
    this.paletteScroll.restore();
  }

  private handlePointerDown(event: PointerEvent): void {
    this.panelResize.start(event);
  }

  private handleDoubleClick(event: MouseEvent): void {
    this.panelResize.reset(event);
  }

  private handleViewportResize(): void {
    this.panelResize.handleViewportResize();
  }

  private applyPanelSizing(): void {
    this.panelResize.apply();
  }

}


