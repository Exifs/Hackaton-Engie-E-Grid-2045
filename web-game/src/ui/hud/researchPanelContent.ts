import { t } from "../../i18n";
import type { BuildingDefinition, ResearchOption } from "../../sim";
import { escapeHtml, fmt } from "./format";
import { localizedBuildingName, localizedEffectKey, localizedEffectValue, localizedResearchName, localizedResearchNotes, localizedTechnologyName } from "./localization";
import {
  activeResearchProgressKey,
  progressAttributes,
  researchCardProgressKey,
  visualResearchPoints,
  visualResearchProgress
} from "./progress";
import { RESEARCH_UNAVAILABLE_CAUSES, type ProgressCssVar } from "./types";

interface ResearchPanelContentOptions {
  options: ResearchOption[];
  buildings: Record<string, BuildingDefinition>;
  monthProgress: number;
  showUnavailableResearch: boolean;
  renderProgressValue: (key: string, target: number, cssVar: ProgressCssVar) => number;
  tooltipAttrs: (title: string, body: string, meta?: string) => string;
}

export function renderResearchPanelContent(options: ResearchPanelContentOptions): string {
  const renderer = new ResearchPanelContentRenderer(options);
  return renderer.render();
}

export function localizedResearchReason(option: ResearchOption): string {
  if (!option.reason) {
    return "";
  }
  if (option.reason.startsWith("Rate 0: ")) {
    return t("hud.reasons.zeroRate", { reason: researchStallReason(option) });
  }
  if (option.reason.startsWith("File #")) {
    const position = option.reason.match(/\d+/)?.[0] ?? option.queue_position;
    return t("hud.reasons.queuePosition", { position });
  }
  if (option.lock_cause === "building") {
    if (option.branch === "ai") {
      return t("hud.reasons.requiresAiCenter");
    }
    if (option.branch === "energy" || option.branch === "infrastructure") {
      return t("hud.reasons.requiresEnergyCenter");
    }
    return t("hud.reasons.requiresAnyResearchCenter");
  }
  if (option.lock_cause === "prerequisite" && option.prereq_technology_ids.length > 0) {
    return t("hud.reasons.requires", { name: localizedTechnologyName(option.prereq_technology_ids[0]) });
  }
  if (option.reason.startsWith("Requires ")) {
    const name = option.reason.replace(/^Requires /, "").replace(/\.$/, "");
    return t("hud.reasons.requires", { name });
  }
  if (option.status === "completed") {
    return t("hud.reasons.completed");
  }
  if (option.status === "active") {
    return t("hud.reasons.inProgress");
  }
  if (option.status === "queued") {
    return t("hud.reasons.queuePosition", { position: option.queue_position });
  }
  return option.status === "available" ? t("hud.reasons.readyResearch") : t("hud.researchPanel.required");
}

export function researchBranchTierLabel(option: ResearchOption): string {
  return t("hud.researchPanel.branchTierShort", {
    branch: researchBranchLabel(option.branch),
    tier: option.tier
  });
}

export function researchEta(option: ResearchOption): string {
  if (option.status === "completed") {
    return t("hud.researchPanel.etaComplete");
  }
  if (!Number.isFinite(option.estimated_months_remaining)) {
    return t("hud.researchPanel.zeroRateShort");
  }
  return `${Math.max(option.estimated_months_remaining, 0)}${t("common.units.monthShort")}`;
}

export function researchEffect(option: ResearchOption): string {
  const effectLabel = localizedEffectKey(option.effect_key);
  if (option.effect_value_pct > 0) {
    return `+${fmt(option.effect_value_pct)}% ${effectLabel}`;
  }
  if (option.effect_value) {
    return localizedEffectValue(option.effect_value);
  }
  return effectLabel;
}

class ResearchPanelContentRenderer {
  constructor(private readonly panel: ResearchPanelContentOptions) {}

  render(): string {
    const { options, buildings, monthProgress } = this.panel;
    const active = options.find((option) => option.status === "active");
    const queued = options
      .filter((option) => option.status === "queued")
      .sort((a, b) => a.queue_position - b.queue_position);
    const visibleOptions = options.filter((option) => this.shouldShowResearchOption(option));
    const activeTargetProgress = active ? visualResearchProgress(active, monthProgress) : 0;
    const activeProgress = active
      ? this.panel.renderProgressValue(activeResearchProgressKey(active), activeTargetProgress, "--research-progress")
      : 0;
    const activePoints = active ? visualResearchPoints(active, monthProgress) : 0;
    const hasVisibleOptions = visibleOptions.length > 0;
    const statusMarkup = active
      ? `
        <div class="research-status is-active" data-onboarding-target="research.status" ${progressAttributes(activeResearchProgressKey(active), "--research-progress", "research-active", activeTargetProgress)} data-progress-fill="research-active" data-progress-research-id="${escapeHtml(active.id)}" style="--research-progress:${activeProgress}%">
          <div>
            <strong>${escapeHtml(localizedResearchName(active))}</strong>
          <span data-research-active-copy data-research-active-detail>${fmt(activeTargetProgress)}% - ${fmt(activePoints)}/${fmt(active.cost)} ${escapeHtml(t("common.units.points"))} - ${escapeHtml(t("hud.researchPanel.etaShort"))} ${researchEta(active)} - +${fmt(active.monthly_points)} ${escapeHtml(t("common.units.points"))}/${escapeHtml(t("hud.kpi.monthSuffix"))}</span>
          </div>
        </div>
      `
      : `<div class="research-status" data-onboarding-target="research.status" style="--research-progress:0%"><div><strong>${escapeHtml(t("hud.researchPanel.noActive"))}</strong><span>${escapeHtml(t("hud.researchPanel.chooseTier"))}</span></div></div>`;
    return `
      <div class="research-panel">
        ${statusMarkup}
        <div class="research-queue" aria-label="${escapeHtml(t("hud.researchPanel.queueAria"))}">
          <div class="research-queue-title"><span>${escapeHtml(t("hud.researchPanel.queue"))}</span><strong>${queued.length}</strong></div>
          ${queued.length === 0
            ? `<span class="research-queue-empty">${escapeHtml(t("hud.researchPanel.noQueued"))}</span>`
            : queued.map((option) => this.researchQueueItem(option)).join("")}
        </div>
        <div class="research-grid ${hasVisibleOptions ? "" : "is-preview"}">
          ${hasVisibleOptions
            ? visibleOptions.map((option) => this.researchCard(option, buildings, monthProgress)).join("")
            : this.researchPreviewCards(options)}
        </div>
      </div>
    `;
  }

  private researchPreviewCards(options: ResearchOption[]): string {
    return options
      .slice()
      .sort((a, b) => a.tier - b.tier || a.branch.localeCompare(b.branch) || localizedResearchName(a).localeCompare(localizedResearchName(b)))
      .slice(0, 4)
      .map((option) => {
        return `
          <span class="research-card research-preview-card research-locked" role="button" aria-disabled="true" ${this.researchTooltipAttrs(option)}>
            <span class="research-card-head">
              <span class="research-card-glyph utility-category-icon utility-category-icon-${researchBranchIconKey(option.branch)}" aria-hidden="true"></span>
              <span>
                <strong>${escapeHtml(localizedResearchName(option))}</strong>
                <small>${escapeHtml(researchBranchTierLabel(option))}</small>
              </span>
            </span>
            <span class="research-progress" style="--progress:0%"><b></b></span>
            <span class="research-copy">${escapeHtml(localizedResearchReason(option) || t("hud.researchPanel.required"))}</span>
          </span>
        `;
      })
      .join("");
  }

  private researchQueueItem(option: ResearchOption): string {
    const index = option.queue_position - 1;
    return `
      <article class="research-queue-item" data-queued-research="${escapeHtml(option.id)}">
        <span>
          <strong>${escapeHtml(localizedResearchName(option))}</strong>
          <small>#${option.queue_position} - ${escapeHtml(t("hud.researchPanel.etaShort"))} ${researchEta(option)} - +${fmt(option.monthly_points)} ${escapeHtml(t("common.units.points"))}/${escapeHtml(t("hud.kpi.monthSuffix"))}</small>
        </span>
        <span class="research-queue-actions">
          <button type="button" data-promote-research="${index}" ${index <= 0 ? "disabled" : ""} title="${escapeHtml(t("hud.researchPanel.moveUp", { name: localizedResearchName(option) }))}">${escapeHtml(t("hud.researchPanel.up"))}</button>
          <button type="button" data-remove-research="${index}" title="${escapeHtml(t("hud.researchPanel.remove", { name: localizedResearchName(option) }))}">${escapeHtml(t("hud.researchPanel.removeShort"))}</button>
        </span>
      </article>
    `;
  }

  private researchCard(
    option: ResearchOption,
    buildings: Record<string, BuildingDefinition>,
    monthProgress: number
  ): string {
    const enabled = option.status === "available";
    const unlocks = option.unlocks
      .map((id) => localizedBuildingName(buildings[id], id))
      .filter(Boolean)
      .slice(0, 3);
    const effect = researchEffect(option);
    const progressKey = researchCardProgressKey(option);
    const targetProgress = visualResearchProgress(option, monthProgress);
    const progress = this.panel.renderProgressValue(progressKey, targetProgress, "--progress");
    const lockCause = option.lock_cause ? `data-lock-cause="${option.lock_cause}"` : "";
    return `
      <button class="research-card research-${option.status}" type="button" data-research="${option.id}" data-onboarding-target="research.${option.id}" ${lockCause} ${enabled ? "" : "disabled"} title="${escapeHtml(localizedResearchReason(option) || localizedResearchNotes(option))}" ${this.researchTooltipAttrs(option)}>
        <span class="research-card-head">
          <span class="research-card-glyph utility-category-icon utility-category-icon-${researchBranchIconKey(option.branch)}" aria-hidden="true"></span>
          <strong>${escapeHtml(localizedResearchName(option))}</strong>
          <small>${escapeHtml(researchBranchTierLabel(option))} - ${fmt(option.cost)} ${escapeHtml(t("common.units.points"))} - ${researchEta(option)}</small>
        </span>
        <span class="research-progress" ${progressAttributes(progressKey, "--progress", "research-card", targetProgress)} data-progress-fill="research-card" data-progress-research-id="${escapeHtml(option.id)}" style="--progress:${progress}%"><b></b></span>
        <span class="research-copy">${escapeHtml(localizedResearchReason(option) || localizedResearchNotes(option) || effect)}</span>
        <span class="research-tags">
          ${unlocks.map((unlock) => `<span>${escapeHtml(t("hud.researchPanel.unlocks", { name: unlock }))}</span>`).join("")}
          ${effect ? `<span>${escapeHtml(effect)}</span>` : ""}
        </span>
      </button>
    `;
  }

  private shouldShowResearchOption(option: ResearchOption): boolean {
    if (this.panel.showUnavailableResearch || option.status !== "locked") {
      return true;
    }
    if (!option.lock_cause) {
      return true;
    }
    return !RESEARCH_UNAVAILABLE_CAUSES.includes(option.lock_cause);
  }

  private researchTooltipAttrs(option: ResearchOption): string {
    return [
      this.panel.tooltipAttrs(localizedResearchName(option), localizedResearchNotes(option) || localizedResearchReason(option) || researchEffect(option), ""),
      `data-tooltip-research-id="${escapeHtml(option.id)}"`
    ].join(" ");
  }
}

function researchStallReason(option: ResearchOption): string {
  if (option.branch === "ai") {
    return t("hud.reasons.requiresAiCenter");
  }
  if (option.branch === "energy" || option.branch === "infrastructure") {
    return t("hud.reasons.requiresEnergyCenter");
  }
  return t("hud.reasons.outputUnavailable");
}

function researchBranchIconKey(branch: string): string {
  const normalized = branch.toLowerCase();
  if (normalized.includes("energy")) {
    return "energy";
  }
  if (normalized.includes("ai") || normalized.includes("compute") || normalized.includes("model")) {
    return "compute";
  }
  if (normalized.includes("infrastructure") || normalized.includes("grid")) {
    return "grid";
  }
  if (normalized.includes("cool")) {
    return "snow";
  }
  return "science";
}

function researchBranchLabel(branch: string): string {
  const key = `hud.researchPanel.branches.${branch}`;
  const translated = t(key);
  return translated === key ? branch : translated;
}
