import { t } from "../../i18n";
import type { RegionHistoryPoint, RegionSnapshot } from "../../sim";
import { escapeHtml, fmt } from "./format";
import {
  REGION_HISTORY_PERIODS,
  REGION_HISTORY_RESOURCES,
  type RegionHistoryPeriod,
  type RegionHistoryResource
} from "./types";

interface RegionHistoryOptions {
  region: RegionSnapshot;
  activeRegionHistoryPeriod: RegionHistoryPeriod;
  activeRegionHistoryResource: RegionHistoryResource;
}

export function renderRegionHistoryChart(options: RegionHistoryOptions): string {
  const { region, activeRegionHistoryPeriod, activeRegionHistoryResource } = options;
  const history = region.history.slice(-activeRegionHistoryPeriod);
  const hasTrend = history.length > 1;
  const first = history[0];
  const last = history[history.length - 1];
  const resource = regionHistoryResourceLabel(activeRegionHistoryResource);
  const rangeLabel = first && last
    ? `${historyPointLabel(first)} - ${historyPointLabel(last)}`
    : t("hud.region.historyPending");
  return `
    <section class="region-history-panel region-history-${activeRegionHistoryResource}" aria-label="${escapeHtml(t("hud.region.historyAria"))}">
      <div class="region-history-head">
        <div>
          <span>${escapeHtml(t("hud.region.resourceHistory"))}</span>
          <strong>${escapeHtml(resource.label)} - ${escapeHtml(rangeLabel)}</strong>
        </div>
        <div class="region-history-controls">
          <div class="region-history-resources" role="tablist" aria-label="${escapeHtml(t("hud.region.historyResource"))}">
            ${REGION_HISTORY_RESOURCES.map((resourceKey) => {
              const resourceLabel = regionHistoryResourceLabel(resourceKey).label;
              return `
              <button class="region-history-resource-button region-status-${resourceKey} ${activeRegionHistoryResource === resourceKey ? "is-active" : ""}" type="button" data-history-resource="${resourceKey}" aria-label="${escapeHtml(resourceLabel)}" title="${escapeHtml(resourceLabel)}" aria-selected="${activeRegionHistoryResource === resourceKey}">
                <i class="region-status-icon" aria-hidden="true"></i>
              </button>
            `;
            }).join("")}
          </div>
          <div class="region-history-periods" role="tablist" aria-label="${escapeHtml(t("hud.region.historyPeriod"))}">
            ${REGION_HISTORY_PERIODS.map((period) => `
              <button class="${activeRegionHistoryPeriod === period ? "is-active" : ""}" type="button" data-history-period="${period}" aria-selected="${activeRegionHistoryPeriod === period}">
                ${period}${escapeHtml(t("common.units.monthShort"))}
              </button>
            `).join("")}
          </div>
        </div>
      </div>
      <div class="region-history-chart ${hasTrend ? "" : "is-empty"}">
        ${hasTrend ? regionHistorySvg(history, activeRegionHistoryResource) : `<span>${escapeHtml(t("hud.region.historyEmpty"))}</span>`}
      </div>
      <div class="region-history-legend">
        <span><i class="legend-supply"></i>${escapeHtml(t("hud.region.supply"))}</span>
        <span><i class="legend-demand"></i>${escapeHtml(t("hud.region.usage"))}</span>
        <span><i class="legend-export"></i>${escapeHtml(t("hud.region.export"))}</span>
        <span><i class="legend-import"></i>${escapeHtml(t("hud.region.importDeficit"))}</span>
      </div>
    </section>
  `;
}

function regionHistorySvg(history: RegionHistoryPoint[], resource: RegionHistoryResource): string {
  const resourceMeta = regionHistoryResourceLabel(resource);
  return `
    <svg class="region-history-svg" viewBox="0 0 320 148" role="img" aria-label="${escapeHtml(t("hud.region.evolution", { label: resourceMeta.label }))}">
      <defs>
        <linearGradient id="history-grid-fade" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="rgba(83, 231, 255, 0.2)" />
          <stop offset="58%" stop-color="rgba(83, 231, 255, 0.05)" />
          <stop offset="100%" stop-color="rgba(184, 121, 255, 0.12)" />
        </linearGradient>
      </defs>
      <rect class="history-screen" x="1" y="1" width="318" height="146" rx="6"></rect>
      <path class="history-scanline" d="M 8 20 H 312 M 8 44 H 312 M 8 68 H 312 M 8 92 H 312 M 8 116 H 312"></path>
      <path class="history-vgrid" d="M 64 12 V 136 M 124 12 V 136 M 184 12 V 136 M 244 12 V 136 M 304 12 V 136"></path>
      <path class="history-corners" d="M 12 24 V 8 H 28 M 292 8 H 308 V 24 M 308 124 V 140 H 292 M 28 140 H 12 V 124"></path>
      ${regionHistoryRow(history, resource, resourceMeta.label, resourceMeta.unit)}
    </svg>
  `;
}

function regionHistoryRow(
  history: RegionHistoryPoint[],
  resource: RegionHistoryResource,
  label: string,
  unit: string
): string {
  const left = 64;
  const right = 306;
  const top = 20;
  const bottom = 116;
  const height = bottom - top;
  const plotWidth = right - left;
  const metricMax = Math.max(
    ...history.flatMap((point) => {
      const metric = point[resource];
      return [metric.supply, metric.demand, metric.imported, metric.exported];
    }),
    1
  );
  const xAt = (index: number) => history.length <= 1 ? left + plotWidth / 2 : left + (plotWidth * index) / (history.length - 1);
  const yAt = (value: number) => bottom - (Math.max(value, 0) / metricMax) * height;
  const pathFor = (field: "supply" | "demand" | "imported" | "exported") => history
    .map((point, index) => `${index === 0 ? "M" : "L"} ${fmt(xAt(index), 1)} ${fmt(yAt(point[resource][field]), 1)}`)
    .join(" ");
  return `
    <g class="history-row history-row-${resource}">
      <rect class="history-resource-chip" x="6" y="14" width="50" height="20" rx="3"></rect>
      <text class="history-label" x="8" y="27">${escapeHtml(label)}</text>
      <text class="history-max" x="8" y="48">${fmt(metricMax, 1)} ${escapeHtml(unit)}</text>
      <line class="history-gridline history-gridline-top" x1="${left}" y1="${top}" x2="${right}" y2="${top}"></line>
      <line class="history-gridline" x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}"></line>
      <path class="history-line history-line-supply" d="${pathFor("supply")}"></path>
      <path class="history-line history-line-demand" d="${pathFor("demand")}"></path>
      <path class="history-line history-line-export" d="${pathFor("exported")}"></path>
      <path class="history-line history-line-import" d="${pathFor("imported")}"></path>
    </g>
  `;
}

function historyPointLabel(point: RegionHistoryPoint): string {
  return `${point.month}/${point.year}`;
}

function regionHistoryResourceLabel(resource: RegionHistoryResource): { label: string; unit: string } {
  const labels: Record<RegionHistoryResource, { label: string; unit: string }> = {
    energy: { label: t("hud.region.energy"), unit: t("common.units.gigawatts") },
    cooling: { label: t("hud.region.cooling"), unit: t("common.units.thermalGigawatts") },
    compute: { label: t("hud.region.compute"), unit: t("common.units.exaflopsShort") }
  };
  return labels[resource];
}
