import { t } from "../../i18n";
import type { BuildingDefinition } from "../../sim";
import { buildingArt, buildingSummary, buildingTooltipAttrs } from "./buildingRenderers";
import { escapeHtml } from "./format";
import { localizedBuildingName } from "./localization";
import {
  progressAttributes,
  queueProgressKey,
  visualQueueProgress
} from "./progress";
import type { ProgressCssVar, QueueProgressItem } from "./types";

type RenderProgressValue = (key: string, target: number, cssVar: ProgressCssVar) => number;
type TooltipAttrs = (title: string, body: string, meta?: string) => string;

interface QueueCardOptions {
  regionId: string;
  item: QueueProgressItem;
  index: number;
  building: BuildingDefinition | undefined;
  monthProgress: number;
  renderProgressValue: RenderProgressValue;
}

interface BuiltCardOptions {
  buildingId: string;
  building: BuildingDefinition | undefined;
  index: number;
  tooltipAttrs: TooltipAttrs;
}

export function renderQueueCard(options: QueueCardOptions): string {
  const progressKey = queueProgressKey("construction", options.regionId, options.index, options.item);
  const targetProgress = visualQueueProgress(options.item, options.monthProgress);
  const progress = options.renderProgressValue(progressKey, targetProgress, "--progress");
  const buildingName = localizedBuildingName(options.building, options.item.building_id);
  return `
    <button class="queue-card" type="button" data-cancel="${options.index}" title="${escapeHtml(t("hud.region.cancelTitle", { name: buildingName }))}">
      ${buildingArt(options.building)}
      <span class="queue-copy">
        <strong>${escapeHtml(buildingName)}</strong>
        <small>${escapeHtml(t("hud.region.remainingMonths", { months: options.item.months_remaining }))}</small>
        <i ${progressAttributes(progressKey, "--progress", "construction", targetProgress)} data-progress-fill="construction" data-progress-index="${options.index}" data-progress-building-id="${escapeHtml(options.item.building_id)}" style="--progress:${progress}%"><b></b></i>
      </span>
    </button>
  `;
}

export function renderDemolitionCard(options: QueueCardOptions): string {
  const progressKey = queueProgressKey("demolition", options.regionId, options.index, options.item);
  const targetProgress = visualQueueProgress(options.item, options.monthProgress);
  const progress = options.renderProgressValue(progressKey, targetProgress, "--progress");
  const buildingName = localizedBuildingName(options.building, options.item.building_id);
  return `
    <span class="queue-card demolition-card" title="${escapeHtml(t("hud.region.demolitionTitle", { name: buildingName }))}">
      ${buildingArt(options.building)}
      <span class="queue-copy">
        <strong>${escapeHtml(buildingName)}</strong>
        <small>${escapeHtml(t("hud.region.demolition"))} - ${escapeHtml(t("hud.region.remainingMonths", { months: options.item.months_remaining }))}</small>
        <i ${progressAttributes(progressKey, "--progress", "demolition", targetProgress)} data-progress-fill="demolition" data-progress-index="${options.index}" data-progress-building-id="${escapeHtml(options.item.building_id)}" style="--progress:${progress}%"><b></b></i>
      </span>
    </span>
  `;
}

export function renderBuiltCard(options: BuiltCardOptions): string {
  const demolishCost = options.building ? Math.ceil(options.building.cost * 0.2) : 0;
  const buildingName = localizedBuildingName(options.building, options.buildingId);
  return `
    <button class="built-card" type="button" data-demolish="${options.index}" title="${escapeHtml(t("hud.construction.dismantleTitle", { name: buildingName, cost: demolishCost }))}" ${buildingTooltipAttrs(options.building, `${t("hud.construction.dismantle")} ${t("common.units.millionCurrency", { value: demolishCost })}`, options.tooltipAttrs)}>
      ${buildingArt(options.building)}
      <span class="built-copy">
        <strong>${escapeHtml(buildingName)}</strong>
        <small>${escapeHtml(buildingSummary(options.building))}</small>
        <span class="built-action">${escapeHtml(t("hud.construction.dismantle"))} ${escapeHtml(t("common.units.millionCurrency", { value: demolishCost }))}</span>
      </span>
    </button>
  `;
}
