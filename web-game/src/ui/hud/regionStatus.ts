import { t } from "../../i18n";
import { clampPctFloat, escapeHtml, fmt } from "./format";

type ResourceTone = "energy" | "cooling" | "compute" | "research";
type TooltipAttrs = (title: string, body: string, meta?: string) => string;

interface RegionStatusBlockOptions {
  tone: ResourceTone;
  title: string;
  pct: number;
  metrics: Array<[string, string]>;
  isDeficit?: boolean;
  tooltipAttrs: TooltipAttrs;
}

export function localBalancePct(supply: number, localDemand: number): number {
  if (localDemand <= 0) {
    return 100;
  }
  return (Math.max(supply, 0) / localDemand) * 100;
}

export function regionResourceStatusMetrics(
  supply: number,
  localUse: number,
  exportAmount: number,
  balance: number,
  unit: string
): Array<[string, string]> {
  return [
    [t("hud.region.supply"), `${fmt(supply, 1)} ${unit}`],
    [t("hud.region.localUse"), `${fmt(localUse, 1)} ${unit}`],
    [t("hud.region.export"), `${fmt(exportAmount, 1)} ${unit}`],
    [t("hud.region.balance"), `${signedMetric(balance)} ${unit}`]
  ];
}

export function regionResearcherStatusMetrics(available: number, required: number): Array<[string, string]> {
  const unit = t("hud.resources.researchersShort");
  return [
    [t("hud.resources.available"), `${fmt(available, 1)} ${unit}`],
    [t("hud.resources.required"), `${fmt(required, 1)} ${unit}`],
    [t("hud.region.balance"), `${signedMetric(available - required)} ${unit}`]
  ];
}

export function renderRegionStatusBlock(options: RegionStatusBlockOptions): string {
  const tooltipBody = options.metrics.map(([label, value]) => `${label}: ${value}`).join(". ");
  const displayPct = Math.max(0, options.pct);
  const meterPct = clampPctFloat(options.pct);
  return `
    <div class="region-status region-status-${options.tone} ${options.isDeficit ? "has-deficit" : ""}" ${regionStatusTooltipAttrs(options.title, tooltipBody, `${fmt(displayPct)}%`, options.tone, options.metrics, options.tooltipAttrs)}>
      <div class="region-status-title">
        <span class="region-status-heading">
          <i class="region-status-icon" aria-hidden="true"></i>
          <span>${escapeHtml(options.title)}</span>
        </span>
        <strong>${fmt(displayPct)}%</strong>
      </div>
      <i style="--meter:${meterPct}%"></i>
      <div class="region-status-metrics">
        ${options.metrics.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join("")}
      </div>
    </div>
  `;
}

function regionStatusTooltipAttrs(
  title: string,
  body: string,
  meta: string,
  tone: ResourceTone,
  metrics: Array<[string, string]>,
  tooltipAttrs: TooltipAttrs
): string {
  return [
    tooltipAttrs(title, body, meta),
    `data-tooltip-status-tone="${tone}"`,
    `data-tooltip-status-metrics="${escapeHtml(JSON.stringify(metrics))}"`
  ].join(" ");
}

function signedMetric(value: number): string {
  if (Math.abs(value) < 0.05) {
    return fmt(0, 1);
  }
  return `${value > 0 ? "+" : ""}${fmt(value, 1)}`;
}
