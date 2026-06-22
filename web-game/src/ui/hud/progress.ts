import type { ResearchOption } from "../../sim";
import { clampPctFloat, clampRatio, escapeHtml } from "./format";
import type { ProgressCssVar, QueueProgressItem } from "./types";

export function visualQueueProgress(
  item: { months_remaining: number; total_months: number },
  monthProgress: number
): number {
  if (item.total_months <= 0) {
    return 100;
  }
  const completedMonths = item.total_months - item.months_remaining;
  const visualMonths = completedMonths + (item.months_remaining > 0 ? clampRatio(monthProgress) : 0);
  return clampPctFloat((visualMonths / item.total_months) * 100);
}

export function visualResearchPoints(option: ResearchOption, monthProgress: number): number {
  if (option.status !== "active") {
    return option.current_points;
  }
  return Math.min(option.cost, option.current_points + Math.max(option.monthly_points, 0) * clampRatio(monthProgress));
}

export function visualResearchProgress(option: ResearchOption, monthProgress: number): number {
  if (option.cost <= 0) {
    return 100;
  }
  if (option.status === "active") {
    return clampPctFloat((visualResearchPoints(option, monthProgress) / option.cost) * 100);
  }
  return clampPctFloat(option.progress * 100);
}

export function queueProgressKey(
  type: "construction" | "demolition",
  regionId: string,
  index: number,
  item: QueueProgressItem
): string {
  return `${type}:${regionId}:${index}:${item.building_id}:${item.total_months}`;
}

export function activeResearchProgressKey(option: ResearchOption): string {
  return `research-active:${option.id}`;
}

export function researchCardProgressKey(option: ResearchOption): string {
  return `research-card:${option.id}`;
}

export function progressAttributes(key: string, cssVar: ProgressCssVar, kind: string, target: number): string {
  return [
    `data-progress-key="${escapeHtml(key)}"`,
    `data-progress-var="${cssVar}"`,
    `data-progress-kind="${kind}"`,
    `data-progress-target="${clampPctFloat(target)}"`
  ].join(" ");
}
