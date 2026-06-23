import { t } from "../../i18n";
import type { SimulationCore } from "../../sim";
import { escapeHtml, fmt, miniCoordX, miniCoordY, miniRoutePath } from "./format";

type Summary = ReturnType<SimulationCore["getSummary"]>;
type RegionLayout = ReturnType<SimulationCore["getRegionLayout"]>;
type NetworkGraph = ReturnType<SimulationCore["getNetworkGraph"]>;

export function renderGridOverviewCard(
  summary: Summary,
  simulation: SimulationCore,
  tooltipAttrs: (title: string, body: string, meta?: string) => string
): string {
  const layout = simulation.getRegionLayout();
  const graph = simulation.getNetworkGraph();
  const graphLines = gridOverviewGraphLines(layout, graph);
  const hubLines = gridOverviewHubLines(layout, graph, summary);
  const flowLines = gridOverviewFlowLines(layout, summary);
  const nodes = gridOverviewNodes(layout, graph, summary);
  const activeFlows = summary.network_flows.length;
  const congestedFlows = summary.network_flows.filter((flow) => flow.is_congested).length;
  const tooltip = t("hud.gridOverview.tooltip", {
    active: activeFlows,
    congested: congestedFlows,
    consumed: fmt(summary.energy_consumed),
    produced: fmt(summary.energy_produced)
  });

  return `
    <aside class="grid-overview-card" aria-label="${escapeHtml(t("hud.gridOverview.title"))}" ${tooltipAttrs(t("hud.gridOverview.title"), tooltip, t("hud.gridOverview.meta"))}>
      <div class="grid-overview-heading">
        <strong>${escapeHtml(t("hud.gridOverview.title"))}</strong>
        <span class="grid-overview-expand" aria-hidden="true"></span>
      </div>
      <div class="grid-overview-map" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          ${graphLines}
          ${hubLines}
          ${flowLines}
        </svg>
        ${nodes}
      </div>
      <div class="grid-overview-legend">
        <span class="legend-power">${escapeHtml(t("hud.gridOverview.powerFlow"))} <b>${fmt(activeFlows)}</b></span>
        <span class="legend-data">${escapeHtml(t("hud.gridOverview.dataFlow"))} <b>${fmt(summary.compute_used)}</b></span>
        <span class="legend-congestion">${escapeHtml(t("hud.gridOverview.congestion"))} <b>${fmt(congestedFlows)}</b></span>
        <span class="legend-planned">${escapeHtml(t("hud.gridOverview.planned"))}</span>
      </div>
    </aside>
  `;
}

function gridOverviewGraphLines(layout: RegionLayout, graph: NetworkGraph): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const [sourceId, targets] of Object.entries(graph)) {
    for (const targetId of targets) {
      const key = [sourceId, targetId].sort().join(":");
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const source = layout[sourceId];
      const target = layout[targetId];
      if (!source || !target) {
        continue;
      }
      lines.push(`<path class="mini-flow mini-flow-data" d="${miniRoutePath(source, target, key, 5)}" />`);
      if (lines.length >= 18) {
        return lines.join("");
      }
    }
  }
  return lines.join("");
}

function gridOverviewFlowLines(layout: RegionLayout, summary: Summary): string {
  return [...summary.network_flows]
    .sort(
      (a, b) =>
        Number(b.is_congested) - Number(a.is_congested) ||
        b.intensity_normalized - a.intensity_normalized
    )
    .slice(0, 14)
    .map((flow) => {
      const source = layout[flow.source_region_id];
      const target = layout[flow.target_region_id];
      if (!source || !target) {
        return "";
      }
      const tone = flow.is_congested ? "congestion" : "power";
      const width = 0.7 + flow.intensity_normalized * 1.7;
      const opacity = 0.36 + flow.intensity_normalized * 0.5;
      const key = `${flow.source_region_id}:${flow.target_region_id}:${tone}`;
      const route = miniRoutePath(source, target, key, 9 + flow.intensity_normalized * 8);
      return (
        `<path class="mini-flow mini-flow-shadow" d="${route}" />` +
        `<path class="mini-flow mini-flow-${tone}" d="${route}" ` +
        `style="--flow-width:${fmt(width, 2)}; --flow-opacity:${fmt(opacity, 2)}" />`
      );
    })
    .join("");
}

function gridOverviewHubLines(layout: RegionLayout, graph: NetworkGraph, summary: Summary): string {
  const selectedPoint = layout[summary.selected_region_id];
  if (!selectedPoint) {
    return "";
  }
  return gridOverviewRankedRegions(layout, graph, summary)
    .filter(([regionId]) => regionId !== summary.selected_region_id)
    .slice(0, 10)
    .map(([regionId, weight], index) => {
      const point = layout[regionId];
      if (!point) {
        return "";
      }
      const route = miniRoutePath(selectedPoint, point, `hub:${summary.selected_region_id}:${regionId}`, 3.5 + index * 0.28);
      const strong = index < 4 ? " mini-flow-hub-strong" : "";
      const opacity = Math.min(0.78, 0.26 + weight * 0.12);
      return `<path class="mini-flow mini-flow-hub${strong}" d="${route}" style="--hub-opacity:${fmt(opacity, 2)}" />`;
    })
    .join("");
}

function gridOverviewNodes(layout: RegionLayout, graph: NetworkGraph, summary: Summary): string {
  const activeEndpoints = new Set<string>();
  const congestedEndpoints = new Set<string>();
  for (const flow of summary.network_flows) {
    activeEndpoints.add(flow.source_region_id);
    activeEndpoints.add(flow.target_region_id);
    if (flow.is_congested) {
      congestedEndpoints.add(flow.source_region_id);
      congestedEndpoints.add(flow.target_region_id);
    }
  }

  return gridOverviewRankedRegions(layout, graph, summary)
    .slice(0, 20)
    .map(([regionId, weight]) => {
      const point = layout[regionId];
      if (!point) {
        return "";
      }
      const selected = regionId === summary.selected_region_id;
      const degree = (graph[regionId]?.length ?? 0) + Object.values(graph).filter((targets) => targets.includes(regionId)).length;
      const classes = ["grid-overview-node"];
      if (selected) {
        classes.push("is-selected");
      }
      if (activeEndpoints.has(regionId)) {
        classes.push("is-flow");
      }
      if (congestedEndpoints.has(regionId)) {
        classes.push("is-congested");
      }
      if (!selected && !activeEndpoints.has(regionId) && (degree >= 12 || weight >= 2.6)) {
        classes.push("is-relay");
      }
      const size = Math.min(7.8, 1.8 + weight * 1.28);
      const power = Math.min(1, 0.2 + weight / 6);
      return (
        `<span class="${classes.join(" ")}" ` +
        `style="--node-x:${miniCoordX(point.x)}%; --node-y:${miniCoordY(point.y)}%; ` +
        `--node-size:${fmt(size, 2)}px; --node-power:${fmt(power, 2)}"></span>`
      );
    })
    .join("");
}

function gridOverviewRankedRegions(layout: RegionLayout, graph: NetworkGraph, summary: Summary): Array<[string, number]> {
  const ranked = new Map<string, number>();
  for (const [sourceId, targets] of Object.entries(graph)) {
    if (layout[sourceId]) {
      ranked.set(sourceId, (ranked.get(sourceId) ?? 0) + Math.min(1.2, 0.18 + targets.length * 0.08));
    }
    for (const targetId of targets) {
      if (layout[targetId]) {
        ranked.set(targetId, (ranked.get(targetId) ?? 0) + 0.24);
      }
    }
  }
  for (const flow of summary.network_flows) {
    ranked.set(flow.source_region_id, (ranked.get(flow.source_region_id) ?? 0) + 0.9 + flow.intensity_normalized);
    ranked.set(flow.target_region_id, (ranked.get(flow.target_region_id) ?? 0) + 0.9 + flow.intensity_normalized);
  }
  ranked.set(summary.selected_region_id, (ranked.get(summary.selected_region_id) ?? 0) + 4);
  return [...ranked.entries()]
    .filter(([regionId]) => Boolean(layout[regionId]))
    .sort((a, b) => b[1] - a[1]);
}
